import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

export const runtime = 'nodejs';

export async function POST(request) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ error: 'Paystack webhook not configured' }, { status: 503 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get('x-paystack-signature');

  // Paystack signs the raw body with HMAC-SHA512 using your secret key —
  // this is how we know the request genuinely came from Paystack and not
  // someone POSTing a fake "payment succeeded" event.
  const expectedSignature = crypto.createHmac('sha512', secretKey).update(rawBody).digest('hex');
  if (signature !== expectedSignature) {
    console.error('paystack webhook signature mismatch');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const event = JSON.parse(rawBody);

  const adminDb = getAdminDb();
  if (!adminDb) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  if (event.event === 'charge.success') {
    const { uid, planId } = event.data?.metadata || {};
    if (uid && planId) {
      await adminDb.collection('users').doc(uid).set(
        {
          plan: planId,
          planProvider: 'paystack',
          paystackCustomerCode: event.data?.customer?.customer_code,
          planUpdatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }
  }

  return NextResponse.json({ received: true });
}
