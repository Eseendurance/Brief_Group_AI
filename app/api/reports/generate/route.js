import { NextResponse } from 'next/server';
import { verifyRequestUser, getAdminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { checkRateLimit, rateLimitFailure } from '@/lib/rate-limit';
import { requireActiveAccess } from '@/lib/subscription';
import { getCompanyContext, canWriteOperationalData } from '@/lib/company-access';
import { generateGeminiText } from '@/lib/ai-provider';

export const runtime = 'nodejs';

export async function POST(request) {
  const authResult = await verifyRequestUser(request);
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const access = await requireActiveAccess(getAdminDb(), authResult.uid);
  if (!access.allowed) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }
  const companyContext = await getCompanyContext(getAdminDb(), authResult.uid);
  if (companyContext.error) {
    return NextResponse.json({ error: companyContext.error }, { status: companyContext.status });
  }
  if (companyContext.membership && !canWriteOperationalData(companyContext.membership.role)) {
    return NextResponse.json({ error: 'Viewer accounts cannot generate or save reports.' }, { status: 403 });
  }

  // Report generation is a longer, more expensive Gemini call — capped tighter than chat.
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

    const prompt = `Write a professional, boardroom-ready ${reportType} report for "${siteName || 'the site'}".
Use the real data below — do not invent numbers that aren't derivable from it. Structure it with:
1. Executive Summary (2-3 sentences)
2. Key Metrics (bullet list, using the actual figures given)
3. Findings & Risks
4. Recommended Actions (specific, prioritized)

Data:
${JSON.stringify(data, null, 2)}`;

    const geminiResponse = await generateGeminiText({
      systemPrompt: 'You are a professional operations and reporting assistant for industrial and infrastructure teams. Use the supplied data and keep the response actionable, accurate, and concise.',
      userPrompt: prompt,
    });

    if (!geminiResponse.ok) {
      return NextResponse.json({ error: geminiResponse.error || 'Report generation failed' }, { status: 503 });
    }

    const reportText = geminiResponse.text || '';

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
