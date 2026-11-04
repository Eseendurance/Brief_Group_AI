import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { checkRateLimit, clientIp, rateLimitFailure } from '@/lib/rate-limit';
import { sendContactNotification } from '@/lib/email';

export async function POST(request) {
  try {
    const rate = await checkRateLimit('contact', clientIp(request), 5, '1 h');
    const rateFailure = rateLimitFailure(rate, 'Too many messages sent. Please try again later.');
    if (rateFailure) {
      return NextResponse.json({ error: rateFailure.error }, { status: rateFailure.status });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'A valid contact request is required.' }, { status: 400 });
    }

    const { name, email, message } = body;
    if (
      typeof name !== 'string' ||
      typeof email !== 'string' ||
      typeof message !== 'string' ||
      !name.trim() ||
      !message.trim() ||
      name.trim().length > 120 ||
      email.trim().length > 254 ||
      message.trim().length > 5000 ||
      !/^\S+@\S+\.\S+$/.test(email.trim())
    ) {
      return NextResponse.json({ error: 'Name, a valid email, and a message are required.' }, { status: 400 });
    }

    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedMessage = message.trim();
    const adminDb = getAdminDb();
    if (!adminDb) {
      return NextResponse.json({ error: 'Contact service is not configured yet.' }, { status: 503 });
    }
    await adminDb.collection('contact_messages').add({
      name: normalizedName,
      email: normalizedEmail,
      message: normalizedMessage,
      createdAt: FieldValue.serverTimestamp(),
    });

    // Best-effort — if email isn't configured yet, the message is still saved to Firestore above.
    sendContactNotification({ name: normalizedName, email: normalizedEmail, message: normalizedMessage })
      .catch((err) => console.error('contact email failed', err));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('contact route error', err);
    return NextResponse.json({ error: 'Failed to send your message. Please try again.' }, { status: 500 });
  }
}
