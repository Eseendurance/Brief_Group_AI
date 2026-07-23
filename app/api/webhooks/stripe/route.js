import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

export const runtime = 'nodejs';

export async function POST(request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secretKey || !webhookSecret) {
    return NextResponse.json({ error: 'Stripe webhook not configured' }, { status: 503 });
  }

  const stripe = new Stripe(secretKey);
  const signature = request.headers.get('stripe-signature');
  const rawBody = await request.text(); // must be raw text — Stripe signature verification needs the exact bytes

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error('stripe webhook signature verification failed', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const adminDb = getAdminDb();
  if (!adminDb) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const uid = session.client_reference_id || session.metadata?.uid;
    const planId = session.metadata?.planId;
    if (uid && planId) {
      await adminDb.collection('users').doc(uid).set(
        {
          plan: planId,
          planProvider: 'stripe',
          stripeCustomerId: session.customer,
          stripeSubscriptionId: session.subscription,
          planUpdatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }
  }

  // Downgrade back to the pilot plan if the subscription is cancelled or payment fails repeatedly.
  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object;
    const usersSnap = await adminDb
      .collection('users')
      .where('stripeSubscriptionId', '==', subscription.id)
      .limit(1)
      .get();
    if (!usersSnap.empty) {
      await usersSnap.docs[0].ref.set({ plan: 'pilot', planUpdatedAt: FieldValue.serverTimestamp() }, { merge: true });
    }
  }

  return NextResponse.json({ received: true });
}
