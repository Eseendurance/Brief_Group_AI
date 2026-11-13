import { NextResponse } from 'next/server';
import { verifyRequestUser, getAdminDb } from '@/lib/firebaseAdmin';
import { checkRateLimit, clientIp, rateLimitFailure } from '@/lib/rate-limit';
import { requireActiveAccess } from '@/lib/subscription';
import { generateGeminiText } from '@/lib/ai-provider';

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
  const auth = await verifyRequestUser(request);
  const identifier = auth.uid || clientIp(request);

  if (auth.uid) {
    const access = await requireActiveAccess(getAdminDb(), auth.uid);
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }
  }

  const rate = await checkRateLimit('chat', identifier, 30, '1 h');
  const rateFailure = rateLimitFailure(rate, `Rate limit reached. Try again after ${rate.resetAt}.`);
  if (rateFailure) {
    return NextResponse.json({ error: rateFailure.error }, { status: rateFailure.status });
  }

  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'A valid chat request is required.' }, { status: 400 });
    }

    const { messages, context } = body;
    if (!Array.isArray(messages) || messages.length === 0 || messages.length > 20) {
      return NextResponse.json({ error: 'messages must contain between 1 and 20 items' }, { status: 400 });
    }
    if (messages.some((message) =>
      !message ||
      typeof message !== 'object' ||
      !['user', 'assistant'].includes(message.role) ||
      typeof message.content !== 'string' ||
      !message.content.trim() ||
      message.content.length > 6000
    )) {
      return NextResponse.json({ error: 'Each message must have a valid role and non-empty text content under 6,000 characters.' }, { status: 400 });
    }

    const contextSize = context === undefined ? 0 : JSON.stringify(context).length;
    const messageSize = messages.reduce((total, message) => total + message.content.length, 0);
    if (messageSize + contextSize > 30000 || contextSize > 10000) {
      return NextResponse.json({ error: 'The conversation is too large. Shorten it and try again.' }, { status: 413 });
    }

    const contextBlock = context
      ? `\n\nCurrent platform data available for this user:\n${JSON.stringify(context, null, 2)}`
      : '';

    const prompt = messages.map((m) => `${m.role}: ${m.content}`).join('\n');
    const result = await generateGeminiText({
      systemPrompt: SYSTEM_PROMPT + contextBlock,
      userPrompt: prompt,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error || 'The assistant is temporarily unavailable. Please try again later.' }, { status: 503 });
    }

    return NextResponse.json({ reply: result.text || '' });
  } catch (err) {
    console.error('chat route error', err);
    return NextResponse.json({ error: err.message || 'Chat request failed' }, { status: 500 });
  }
}
