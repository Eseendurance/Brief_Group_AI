import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { verifyRequestUser, getAdminDb } from '@/lib/firebaseAdmin';
import { checkRateLimit, clientIp } from '@/lib/rate-limit';
import { requireActiveAccess } from '@/lib/subscription';

export const runtime = 'nodejs';

const SYSTEM_PROMPT = `You are the Brief Group Energy & Infrastructure Assistant, embedded in the Brief Group platform.
Brief Group builds AI infrastructure intelligence: Smart Energy Monitoring, AI Fault Detection, Energy
Forecasting, Automated Reports, Computer Vision Inspections, and a Digital Marketplace — for SMEs and
industrial operators, starting in Nigeria and expanding globally.

Answer questions about the user's energy usage, equipment fault risk, farm/crop conditions, and how to use
the platform. When the user provides their own data (readings, scores, weather), reason over the actual
numbers they give you rather than making figures up. Keep answers concise, practical, and confident — this
is used by operations teams making real decisions, not a marketing chatbot. If you don't have enough data
to answer precisely, say what additional reading or module would give the answer.`;

export async function POST(request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'AI assistant is not configured yet. Add ANTHROPIC_API_KEY in your environment variables.' },
      { status: 503 }
    );
  }

  // Rate limit by authenticated uid when available, otherwise by IP — caps
  // real Anthropic spend per requester. See lib/rate-limit.js.
  const auth = await verifyRequestUser(request);
  const identifier = auth.uid || clientIp(request);

  // Trial gate only applies to logged-in accounts — there's nothing to gate
  // for anonymous/public assistant use, that's covered by IP rate limiting below.
  if (auth.uid) {
    const access = await requireActiveAccess(getAdminDb(), auth.uid);
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: 402 });
    }
  }

  const rate = await checkRateLimit('chat', identifier, 30, '1 h');
  if (rate.limited) {
    return NextResponse.json(
      { error: `Rate limit reached. Try again after ${rate.resetAt}.` },
      { status: 429 }
    );
  }

  try {
    const { messages, context } = await request.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'messages array is required' }, { status: 400 });
    }

    const anthropic = new Anthropic({ apiKey });

    const contextBlock = context
      ? `\n\nCurrent platform data available for this user:\n${JSON.stringify(context, null, 2)}`
      : '';

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: SYSTEM_PROMPT + contextBlock,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    return NextResponse.json({ reply: textBlock?.text || '' });
  } catch (err) {
    console.error('chat route error', err);
    return NextResponse.json({ error: err.message || 'Chat request failed' }, { status: 500 });
  }
}
