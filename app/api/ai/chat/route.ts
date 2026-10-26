import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/app/lib/api-security";
import { requireWorkspaceWriteAccess } from "@/app/lib/billing-access";
import { callGeminiChat } from "@/app/lib/gemini";
import {
  releaseWorkspaceCredits,
  reserveWorkspaceCredits,
  settleWorkspaceCredits,
  workspaceCreditLimit,
} from "@/app/lib/workspace-limits";

const domainGuidance = {
  general:
    "You are a thoughtful BriefGroup AI product guide. Explain the Brief Group platform honestly and do not claim features or certifications that are not confirmed.",
  farm:
    "You are BriefGroup AI, a practical precision-agriculture assistant. Help users reason about soil, irrigation, crop observations, and weather context. Be clear about uncertainty and do not present general guidance as a substitute for local agronomic expertise.",
  equipment:
    "You are BriefGroup AI, a careful equipment operations assistant. Help structure maintenance observations and troubleshooting steps. Prioritize manufacturer guidance and safe isolation procedures; never instruct a user to bypass guards or work on energized equipment.",
  inspection:
    "You are BriefGroup AI, an inspection and field-evidence assistant. Help users organize observations, inspection questions, and next steps. Do not claim to have analyzed an image unless one was actually provided.",
  automation:
    "You are BriefGroup AI, an operations workflow assistant. Help teams make handoffs, reporting, and repeatable processes clearer. Do not claim to have executed a real-world action.",
  safety:
    "You are BriefGroup AI, a general workplace wellbeing guide. Offer optional, low-risk reminders such as hydration, rest, and gentle ergonomic movement. Do not diagnose, collect medical information, or replace a qualified safety professional. For immediate danger, advise contacting local emergency services and following the organization's safety procedures.",
} as const;

type ChatDomain = keyof typeof domainGuidance;

type ChatPayload = {
  domain?: unknown;
  message?: unknown;
};

type GeminiResponse = {
  candidates?: {
    content?: {
      parts?: { text?: string }[];
    };
  }[];
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
};

function isChatDomain(domain: unknown): domain is ChatDomain {
  return typeof domain === "string" && domain in domainGuidance;
}

export async function POST(request: NextRequest) {
  const limited = await rateLimit(request, "public-ai-chat", 20);
  if (limited) return limited;

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 8_192) {
    return NextResponse.json(
      { error: "That request is too large. Please shorten your question." },
      { status: 413 },
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "BriefGroup AI is not configured yet. Please contact our team to arrange a pilot.",
      },
      { status: 503 },
    );
  }

  const body = (await request.json().catch(() => null)) as ChatPayload | null;
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  const domain = isChatDomain(body?.domain) ? body.domain : "general";

  if (!message) {
    return NextResponse.json({ error: "Please enter a question." }, { status: 400 });
  }
  if (message.length > 1200) {
    return NextResponse.json(
      { error: "Questions must be 1,200 characters or fewer." },
      { status: 413 },
    );
  }

  const hasBearerToken = request.headers.has("authorization");
  const access = hasBearerToken ? await requireWorkspaceWriteAccess(request) : null;
  if (access instanceof NextResponse) return access;

  let reservation:
    | { periodStart: Date; reservedCredits: number }
    | undefined;
  if (access) {
    const estimatedInput = Math.ceil(message.length / 2) + 250;
    const reserve = estimatedInput + 700;
    const limit = workspaceCreditLimit(
      access.workspace.plan,
      access.workspace.subscriptionStatus,
    );
    if (limit === 0) {
      return NextResponse.json(
        { error: "This workspace does not have an active AI credit allowance." },
        { status: 402 },
      );
    }
    const creditReservation = await reserveWorkspaceCredits({
      workspaceId: access.workspace.id,
      credits: reserve,
      limit,
    });
    if (!creditReservation) {
      return NextResponse.json(
        {
          error: "Your workspace has reached its monthly AI credit allowance.",
          code: "AI_CREDIT_LIMIT_REACHED",
          billingUrl: "/workspace#billing",
        },
        { status: 429 },
      );
    }
    reservation = creditReservation;
  }

  const releaseReservation = async () => {
    if (reservation && access) {
      await releaseWorkspaceCredits({
        workspaceId: access.workspace.id,
        periodStart: reservation.periodStart,
        reservedCredits: reservation.reservedCredits,
      });
      reservation = undefined;
    }
  };

  let result;
  try {
    result = await callGeminiChat({
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
      systemInstruction: `${domainGuidance[domain]} Identify yourself only as BriefGroup AI. Keep the answer concise, warm, and useful. If key context is missing, ask a clarifying question rather than inventing facts.`,
      userMessage: message,
    });
  } catch (error) {
    await releaseReservation();
    if (error instanceof Error && error.message.includes("timeout")) {
      return NextResponse.json(
        { error: "BriefGroup AI took too long to respond. Please try again." },
        { status: 504 },
      );
    }
    return NextResponse.json(
      { error: "BriefGroup AI is temporarily unavailable. Please try again." },
      { status: 502 },
    );
  }

  const reply = result.text;

  if (reservation && access) {
    const promptTokens = result.usage.promptTokenCount ?? Math.ceil(message.length / 2) + 250;
    const outputTokens =
      result.usage.candidatesTokenCount ?? Math.ceil(reply.length / 4);
    const totalTokens =
      result.usage.totalTokenCount ?? promptTokens + outputTokens;
    const actualCredits = Math.max(1, promptTokens + outputTokens);
    if (actualCredits > reservation.reservedCredits) {
      await releaseReservation();
      return NextResponse.json(
        { error: "The response exceeded the reserved workspace usage. Please try again." },
        { status: 502 },
      );
    }
    await settleWorkspaceCredits({
      workspaceId: access.workspace.id,
      userId: access.userId,
      periodStart: reservation.periodStart,
      reservedCredits: reservation.reservedCredits,
      actualCredits,
      endpoint: `/api/ai/chat:${domain}`,
      tokensUsed: totalTokens,
    });
    reservation = undefined;
  }

  return NextResponse.json({ reply });
}
