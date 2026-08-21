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

function buildFallbackReply(messages, context) {
  const lastUserMessage = [...messages].reverse().find((message) => message.role === 'user')?.content || '';
  const energySummary = context?.energySummary || {};
  const totalKwh = energySummary.totalKwh ?? 0;
  const anomalyCount = energySummary.anomalyCount ?? 0;
  const trend = energySummary.trend ?? 'flat';
  const text = String(lastUserMessage).toLowerCase();

  if (text.includes('energy') || text.includes('usage') || text.includes('consumption')) {
    return `Based on the current platform summary, your site has ${totalKwh} kWh logged with ${anomalyCount} anomaly signals and a ${trend} energy trend. The best next step is to review the energy dashboard for the specific time period and compare the peaks against your operating schedule.`;
  }

  if (text.includes('farm') || text.includes('crop') || text.includes('yield') || text.includes('weather')) {
    return `For farm operations, the most valuable move is to combine weather, irrigation, and crop-health data in the same view. Brief Group helps you spot before-stress conditions early so you can protect yield rather than react after damage occurs.`;
  }

  if (text.includes('fault') || text.includes('risk') || text.includes('equipment') || text.includes('machine')) {
    return `For equipment risk, the platform should prioritize asset condition, recent trend direction, and abnormal usage patterns. If a machine or transformer is trending outside its usual range, investigate the asset immediately and compare it against recent readings before downtime happens.`;
  }

  return `I can help with your energy, farm, and infrastructure data. Right now the assistant is operating in a local fallback mode, which means the full Anthropic model is not configured in this environment. Once ANTHROPIC_API_KEY is added, the assistant can give deeper, model-generated answers based on your live data.`;
}

export async function POST(request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  // Rate limit by authenticated uid when available, otherwise by IP — caps
  // real Anthropic spend per requester. See lib/rate-limit.js.
  const auth = await verifyRequestUser(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status || 401 });
  }

  const identifier = auth.uid || clientIp(request);

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

    if (!apiKey) {
      return NextResponse.json({ reply: buildFallbackReply(messages, context) });
    }

    const anthropic = new Anthropic({ apiKey });
    const contextBlock = context ? `\n\nCurrent platform data available for this user:\n${JSON.stringify(context, null, 2)}` : '';

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-latest',
      max_tokens: 1024,
      system: SYSTEM_PROMPT + contextBlock,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    return NextResponse.json({ reply: textBlock?.text || 'I could not generate a response from the model.' });
  } catch (err) {
    const { messages, context } = await request.clone().json().catch(() => ({ messages: [], context: null }));
    console.error('chat route error', err);
    if (Array.isArray(messages) && messages.length > 0) {
      return NextResponse.json({ reply: buildFallbackReply(messages, context) });
    }
    return NextResponse.json({ error: err.message || 'Chat request failed' }, { status: 500 });
  }
}
