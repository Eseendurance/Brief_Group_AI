import { createHash, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { getPlan } from '@/lib/plans';

export const runtime = 'nodejs';

function matchesSecret(provided, expected) {
  if (!provided || !expected) return false;
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);
  return providedBuffer.length === expectedBuffer.length && timingSafeEqual(providedBuffer, expectedBuffer);
}

function subscriptionKey(email, planId) {
  return createHash('sha256').update(`${email.toLowerCase()}:${planId}`).digest('hex');
}

export async function POST(request) {
  const webhookSecret = process.env.FLUTTERWAVE_WEBHOOK_SECRET;
  const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;
  if (!webhookSecret || !secretKey) {
    return NextResponse.json({ error: 'Flutterwave webhook is not configured.' }, { status: 503 });
  }

  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > 65536) return NextResponse.json({ error: 'Webhook payload is too large.' }, { status: 413 });
  const signature = request.headers.get('verif-hash');
  if (!matchesSecret(signature, webhookSecret)) {
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 401 });
  }

  const rawBody = await request.text();
  if (rawBody.length > 65536) return NextResponse.json({ error: 'Webhook payload is too large.' }, { status: 413 });
  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid webhook payload.' }, { status: 400 });
  }

  if (event?.event === 'subscription.cancelled') {
    const email = typeof event.data?.customer?.email === 'string'
      ? event.data.customer.email.trim().toLowerCase()
      : '';
    const paymentPlanId = event.data?.plan?.id;
    if (!email || (typeof paymentPlanId !== 'number' && typeof paymentPlanId !== 'string')) {
      return NextResponse.json({ error: 'Subscription cancellation is missing customer or plan details.' }, { status: 400 });
    }

    const adminDb = getAdminDb();
    if (!adminDb) return NextResponse.json({ error: 'Billing database is not configured.' }, { status: 503 });
    const subscriptionRef = adminDb.collection('flutterwave_subscriptions')
      .doc(subscriptionKey(email, String(paymentPlanId)));
    try {
      await adminDb.runTransaction(async (transaction) => {
        const subscriptionSnap = await transaction.get(subscriptionRef);
        if (!subscriptionSnap.exists || subscriptionSnap.data().status === 'cancelled') return;
        const subscription = subscriptionSnap.data();
        const userRef = adminDb.collection('users').doc(subscription.uid);
        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists) throw new Error('SUBSCRIBER_NOT_FOUND');
        transaction.update(subscriptionRef, {
          status: 'cancelled',
          cancelledAt: FieldValue.serverTimestamp(),
        });
        transaction.update(userRef, {
          plan: 'cancelled',
          planUpdatedAt: FieldValue.serverTimestamp(),
        });
      });
    } catch (error) {
      if (error.message === 'SUBSCRIBER_NOT_FOUND') {
        return NextResponse.json({ error: 'The subscription account could not be found.' }, { status: 404 });
      }
      throw error;
    }
    return NextResponse.json({ received: true });
  }

  if (event?.event !== 'charge.completed' || event?.data?.status !== 'successful') {
    return NextResponse.json({ received: true });
  }
  const transactionId = event.data.id;
  const txRef = event.data.tx_ref;
  if ((typeof transactionId !== 'number' && typeof transactionId !== 'string') ||
      typeof txRef !== 'string' || txRef.length > 128) {
    return NextResponse.json({ error: 'Webhook is missing transaction details.' }, { status: 400 });
  }

  const adminDb = getAdminDb();
  if (!adminDb) return NextResponse.json({ error: 'Billing database is not configured.' }, { status: 503 });
  const checkoutRef = adminDb.collection('flutterwave_checkouts').doc(txRef);
  const checkoutSnap = await checkoutRef.get();
  if (!checkoutSnap.exists) return NextResponse.json({ error: 'Unknown checkout reference.' }, { status: 404 });
  const checkout = checkoutSnap.data();
  const subscriptionRef = adminDb.collection('flutterwave_subscriptions')
    .doc(subscriptionKey(checkout.email, checkout.paymentPlanId));
  if (checkout.status === 'paid') return NextResponse.json({ received: true, alreadyProcessed: true });

  const verificationResponse = await fetch(
    `https://api.flutterwave.com/v3/transactions/${encodeURIComponent(String(transactionId))}/verify`,
    { headers: { Authorization: `Bearer ${secretKey}` } }
  );
  const verification = await verificationResponse.json().catch(() => null);
  if (!verificationResponse.ok) {
    console.error('Flutterwave transaction verification failed', verification?.message);
    return NextResponse.json({ error: 'Payment verification is temporarily unavailable.' }, { status: 502 });
  }

  const payment = verification?.data;
  const expectedPlan = getPlan(checkout.planId);
  const verifiedEmail = typeof payment?.customer?.email === 'string'
    ? payment.customer.email.toLowerCase()
    : '';
  if (!expectedPlan || payment?.status !== 'successful' || payment?.tx_ref !== txRef ||
      String(payment?.id) !== String(transactionId) || payment?.currency !== checkout.currency ||
      Number(payment?.amount) !== checkout.amount ||
      verifiedEmail !== checkout.email) {
    return NextResponse.json({ error: 'Verified payment does not match the checkout.' }, { status: 400 });
  }

  const userRef = adminDb.collection('users').doc(checkout.uid);
  try {
    await adminDb.runTransaction(async (transaction) => {
      const [currentCheckout, userSnap] = await Promise.all([
        transaction.get(checkoutRef),
        transaction.get(userRef),
      ]);
      if (!currentCheckout.exists || !userSnap.exists) throw new Error('CHECKOUT_OR_USER_NOT_FOUND');
      if (currentCheckout.data().status === 'paid') return;
      transaction.update(userRef, {
        plan: checkout.planId,
        planProvider: 'flutterwave',
        flutterwaveCustomerId: payment.customer?.id ? String(payment.customer.id) : null,
        flutterwaveTransactionId: String(payment.id),
        flutterwavePlanId: String(checkout.paymentPlanId),
        ...(payment.subscription_id ? { flutterwaveSubscriptionId: String(payment.subscription_id) } : {}),
        planUpdatedAt: FieldValue.serverTimestamp(),
      });
      transaction.update(checkoutRef, {
        status: 'paid',
        transactionId: String(payment.id),
        paidAt: FieldValue.serverTimestamp(),
      });
      transaction.set(subscriptionRef, {
        uid: checkout.uid,
        email: checkout.email,
        planId: checkout.planId,
        paymentPlanId: String(checkout.paymentPlanId),
        status: 'active',
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
    });
  } catch (error) {
    if (error.message === 'CHECKOUT_OR_USER_NOT_FOUND') {
      return NextResponse.json({ error: 'The account for this payment could not be found.' }, { status: 404 });
    }
    throw error;
  }

  return NextResponse.json({ received: true });
}
