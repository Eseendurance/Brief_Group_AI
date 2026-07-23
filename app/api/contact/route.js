import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { checkRateLimit, clientIp } from '@/lib/rate-limit';
import { sendContactNotification } from '@/lib/email';

export async function POST(request) {
  try {
    const rate = await checkRateLimit('contact', clientIp(request), 5, '1 h');
    if (rate.limited) {
      return NextResponse.json({ error: 'Too many messages sent. Please try again later.' }, { status: 429 });
    }

    const { name, email, message } = await request.json();
    if (!name || !email || !message || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: 'Name, a valid email, and a message are required.' }, { status: 400 });
    }

    const adminDb = getAdminDb();
    if (adminDb) {
      await adminDb.collection('contact_messages').add({
        name,
        email,
        message,
        createdAt: FieldValue.serverTimestamp(),
      });
    }

    // Best-effort — if email isn't configured yet, the message is still saved to Firestore above.
    sendContactNotification({ name, email, message }).catch((err) => console.error('contact email failed', err));

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Failed to send message' }, { status: 500 });
  }
}
