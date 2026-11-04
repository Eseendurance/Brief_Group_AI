import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { checkRateLimit, clientIp, rateLimitFailure } from '@/lib/rate-limit';
import { sendWaitlistConfirmation } from '@/lib/email';

// Captures real Digital Marketplace waitlist signups — Phase 3 module,
// "Coming soon" on the live site. This stores actual leads in Firestore,
// it does not simulate a submission.

export async function POST(request) {
  try {
    // This form is public (no login required), so it's rate-limited by IP
    // instead of uid — stops a script from flooding your leads collection.
    const rate = await checkRateLimit('waitlist', clientIp(request), 5, '1 h');
    const rateFailure = rateLimitFailure(rate, 'Too many submissions. Please try again later.');
    if (rateFailure) {
      return NextResponse.json({ error: rateFailure.error }, { status: rateFailure.status });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'A valid waitlist request is required.' }, { status: 400 });
    }

    const { email, company = '', interest = '' } = body;
    if (
      typeof email !== 'string' ||
      typeof company !== 'string' ||
      typeof interest !== 'string' ||
      email.trim().length > 254 ||
      company.trim().length > 160 ||
      interest.trim().length > 1000 ||
      !/^\S+@\S+\.\S+$/.test(email.trim())
    ) {
      return NextResponse.json({ error: 'A valid email is required' }, { status: 400 });
    }

    const adminDb = getAdminDb();
    if (!adminDb) {
      return NextResponse.json({ error: 'Database is not configured yet.' }, { status: 500 });
    }

    await adminDb.collection('marketplace_waitlist').add({
      email: email.trim().toLowerCase(),
      company: company.trim(),
      interest: interest.trim(),
      createdAt: FieldValue.serverTimestamp(),
    });

    // Best-effort — a failed email should never block the signup itself.
    sendWaitlistConfirmation({ to: email.trim().toLowerCase() })
      .catch((err) => console.error('waitlist email failed', err));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('waitlist route error', err);
    return NextResponse.json({ error: 'Failed to join the waitlist. Please try again.' }, { status: 500 });
  }
}
