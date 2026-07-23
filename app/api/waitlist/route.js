import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { checkRateLimit, clientIp } from '@/lib/rate-limit';
import { sendWaitlistConfirmation } from '@/lib/email';

// Captures real Digital Marketplace waitlist signups — Phase 3 module,
// "Coming soon" on the live site. This stores actual leads in Firestore,
// it does not simulate a submission.

export async function POST(request) {
  try {
    // This form is public (no login required), so it's rate-limited by IP
    // instead of uid — stops a script from flooding your leads collection.
    const rate = await checkRateLimit('waitlist', clientIp(request), 5, '1 h');
    if (rate.limited) {
      return NextResponse.json({ error: 'Too many submissions. Please try again later.' }, { status: 429 });
    }

    const { email, company, interest } = await request.json();
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: 'A valid email is required' }, { status: 400 });
    }

    const adminDb = getAdminDb();
    if (!adminDb) {
      return NextResponse.json({ error: 'Database is not configured yet.' }, { status: 500 });
    }

    await adminDb.collection('marketplace_waitlist').add({
      email,
      company: company || '',
      interest: interest || '',
      createdAt: FieldValue.serverTimestamp(),
    });

    // Best-effort — a failed email should never block the signup itself.
    sendWaitlistConfirmation({ to: email }).catch((err) => console.error('waitlist email failed', err));

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Failed to join waitlist' }, { status: 500 });
  }
}
