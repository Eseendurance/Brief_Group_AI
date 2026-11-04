import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { verifyRequestUser } from '@/lib/firebaseAdmin';
import { getPlan } from '@/lib/plans';
import { getSiteBaseUrl } from '@/lib/site-url';

export const runtime = 'nodejs';

export async function POST(request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json(
      { error: 'Card payments aren\u2019t configured yet. Add STRIPE_SECRET_KEY in your environment variables.' },
      { status: 503 }
    );
  }

  const authResult = await verifyRequestUser(request);
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  try {
    const { planId } = await request.json();
    const plan = getPlan(planId);
    if (!plan || plan.contactOnly) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const priceId = process.env[plan.stripePriceEnv];
    if (!priceId) {
      return NextResponse.json(
        { error: `Stripe price ID not set for this plan. Add ${plan.stripePriceEnv} in your environment variables (create the Price in your Stripe Dashboard first).` },
        { status: 503 }
      );
    }

    const stripe = new Stripe(secretKey);
    const origin = getSiteBaseUrl(request);

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: authResult.email,
      // client_reference_id ties the payment back to the Firebase uid so the
      // webhook knows whose plan to upgrade — this is what makes the
      // integration real rather than a checkout button that goes nowhere.
      client_reference_id: authResult.uid,
      metadata: { uid: authResult.uid, planId: plan.id },
      success_url: `${origin}/dashboard/settings?upgraded=1`,
      cancel_url: `${origin}/pricing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('stripe checkout error', err);
    return NextResponse.json({ error: err.message || 'Could not start checkout' }, { status: 500 });
  }
}
