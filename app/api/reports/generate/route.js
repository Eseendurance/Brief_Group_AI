import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { verifyRequestUser, getAdminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { checkRateLimit, rateLimitFailure } from '@/lib/rate-limit';
import { requireActiveAccess } from '@/lib/subscription';

export const runtime = 'nodejs';

export async function POST(request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Report generation is not configured yet. Add ANTHROPIC_API_KEY in your environment variables.' },
      { status: 503 }
    );
  }

  const authResult = await verifyRequestUser(request);
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const access = await requireActiveAccess(getAdminDb(), authResult.uid);
  if (!access.allowed) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  // Report generation is a longer, more expensive Claude call — capped tighter than chat.
  const rate = await checkRateLimit('reports', authResult.uid, 15, '1 d');
  const rateFailure = rateLimitFailure(rate, `Daily report limit reached. Try again after ${rate.resetAt}.`);
  if (rateFailure) {
    return NextResponse.json({ error: rateFailure.error }, { status: rateFailure.status });
  }

  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'A valid report request is required.' }, { status: 400 });
    }

    const { reportType, data, siteName } = body;
    if (
      typeof reportType !== 'string' ||
      !reportType.trim() ||
      reportType.length > 80 ||
      !data ||
      typeof data !== 'object' ||
      Array.isArray(data) ||
      (siteName !== undefined && (typeof siteName !== 'string' || siteName.length > 120))
    ) {
      return NextResponse.json({ error: 'A report type and object data are required.' }, { status: 400 });
    }
    if (JSON.stringify(data).length > 20000) {
      return NextResponse.json({ error: 'The report data is too large. Reduce it and try again.' }, { status: 413 });
    }

    const anthropic = new Anthropic({ apiKey });

    const prompt = `Write a professional, boardroom-ready ${reportType} report for "${siteName || 'the site'}".
Use the real data below — do not invent numbers that aren't derivable from it. Structure it with:
1. Executive Summary (2-3 sentences)
2. Key Metrics (bullet list, using the actual figures given)
3. Findings & Risks
4. Recommended Actions (specific, prioritized)

Data:
${JSON.stringify(data, null, 2)}`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    const reportText = textBlock?.text || '';

    // Persist the generated report so it shows up in report history.
    const adminDb = getAdminDb();
    let reportId = null;
    if (adminDb) {
      const docRef = await adminDb.collection('reports').add({
        uid: authResult.uid,
        reportType,
        siteName: siteName || '',
        content: reportText,
        sourceData: data,
        createdAt: FieldValue.serverTimestamp(),
      });
      reportId = docRef.id;
    }

    return NextResponse.json({ report: reportText, reportId });
  } catch (err) {
    console.error('report generation error', err);
    return NextResponse.json({ error: err.message || 'Report generation failed' }, { status: 500 });
  }
}
