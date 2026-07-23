import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { verifyRequestUser, getAdminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { checkRateLimit } from '@/lib/rate-limit';
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
    return NextResponse.json({ error: access.error }, { status: 402 });
  }

  // Report generation is a longer, more expensive Claude call — capped tighter than chat.
  const rate = await checkRateLimit('reports', authResult.uid, 15, '1 d');
  if (rate.limited) {
    return NextResponse.json(
      { error: `Daily report limit reached. Try again after ${rate.resetAt}.` },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { reportType, data, siteName } = body;
    if (!reportType || !data) {
      return NextResponse.json({ error: 'reportType and data are required' }, { status: 400 });
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
