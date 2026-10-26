export type GeminiUsageMetadata = {
  promptTokenCount?: number;
  candidatesTokenCount?: number;
  totalTokenCount?: number;
};

export type GeminiChatResult = {
  text: string;
  usage: GeminiUsageMetadata;
};

export async function callGeminiChat({
  systemInstruction,
  userMessage,
  model,
}: {
  systemInstruction: string;
  userMessage: string;
  model?: string;
}): Promise<GeminiChatResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured for the Brief Group assistant.");
  }

  const resolvedModel = model || process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(resolvedModel)}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemInstruction }],
        },
        contents: [{ role: "user", parts: [{ text: userMessage }] }],
        generationConfig: {
          maxOutputTokens: 700,
          temperature: 0.4,
        },
      }),
      signal: AbortSignal.timeout(25_000),
    },
  );

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    const message = detail ? detail.slice(0, 250) : "Gemini failed to respond.";
    throw new Error(`Gemini request failed (${response.status}): ${message}`);
  }

  const payload = (await response.json()) as {
    candidates?: {
      content?: {
        parts?: { text?: string }[];
      };
    }[];
    usageMetadata?: GeminiUsageMetadata;
  };

  const text = payload.candidates
    ?.flatMap((candidate) => candidate.content?.parts ?? [])
    .map((part) => part.text)
    .find((part): part is string => typeof part === "string" && part.length > 0);

  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }

  return {
    text,
    usage: payload.usageMetadata ?? {},
  };
}
