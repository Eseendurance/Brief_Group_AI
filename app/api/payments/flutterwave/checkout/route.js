import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { verifyRequestUser, getAdminDb } from '@/lib/firebaseAdmin';
import { getPlan } from '@/lib/plans';
import { getSiteBaseUrl } from '@/lib/site-url';

export const runtime = 'nodejs';

export async function POST(request) {
  const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ error: 'Flutterwave is not configured. Add FLUTTERWAVE_SECRET_KEY.' }, { status: 503 });
  }

  const auth = await verifyRequestUser(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (!auth.email) return NextResponse.json({ error: 'A verified account email is required for checkout.' }, { status: 400 });

  const adminDb = getAdminDb();
  if (!adminDb) return NextResponse.json({ error: 'Billing is temporarily unavailable.' }, { status: 503 });

  const body = await request.json().catch(() => null);
  const plan = getPlan(body?.planId);
  if (!plan || plan.contactOnly || !plan.priceNaira || !plan.flutterwavePlanEnv) {
    return NextResponse.json({ error: 'Choose a valid subscription plan.' }, { status: 400 });
  }

  const paymentPlan = process.env[plan.flutterwavePlanEnv];
  if (!paymentPlan || !/^\d+$/.test(paymentPlan)) {
    return NextResponse.json({ error: `Flutterwave recurring plan ID is missing or invalid. Configure ${plan.flutterwavePlanEnv}.` }, { status: 503 });
  }

  let origin;
  try {
    origin = getSiteBaseUrl(request);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 503 });
  }
  const txRef = `bg_${randomUUID()}`;
  const checkoutRef = adminDb.collection('flutterwave_checkouts').doc(txRef);
  await checkoutRef.create({
    uid: auth.uid,
    email: auth.email.toLowerCase(),
    planId: plan.id,
    paymentPlanId: paymentPlan,
    amount: plan.priceNaira,
    currency: 'NGN',
    status: 'pending',
    createdAt: FieldValue.serverTimestamp(),
  });

  try {
    const response = await fetch('https://api.flutterwave.com/v3/payments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tx_ref: txRef,
        amount: plan.priceNaira,
        currency: 'NGN',
        payment_plan: Number(paymentPlan),
        redirect_url: `${origin}/dashboard/settings?provider=flutterwave&checkout=complete`,
        customer: { email: auth.email },
        meta: { uid: auth.uid, planId: plan.id },
        customizations: {
          title: 'Brief Group subscription',
          description: `${plan.name} monthly plan`,
          logo: `${origin}/logo.png`,
        },
      }),
    });
    const result = await response.json().catch(() => null);
    const checkoutUrl = result?.data?.link;
    if (!response.ok || result?.status !== 'success' || typeof checkoutUrl !== 'string') {
      await checkoutRef.update({ status: 'failed', updatedAt: FieldValue.serverTimestamp() });
      return NextResponse.json({ error: result?.message || 'Flutterwave checkout could not be initialized.' }, { status: 502 });
    }

    const parsedUrl = new URL(checkoutUrl);
    if (parsedUrl.protocol !== 'https:' || parsedUrl.hostname !== 'checkout.flutterwave.com') {
      await checkoutRef.update({ status: 'failed', updatedAt: FieldValue.serverTimestamp() });
      return NextResponse.json({ error: 'Flutterwave returned an invalid checkout destination.' }, { status: 502 });
    }
    await checkoutRef.update({ status: 'initialized', updatedAt: FieldValue.serverTimestamp() });
    return NextResponse.json({ url: parsedUrl.toString() });
  } catch (error) {
    await checkoutRef.update({ status: 'failed', updatedAt: FieldValue.serverTimestamp() });
    console.error('Flutterwave checkout initialization failed', error);
    return NextResponse.json({ error: 'Could not start Flutterwave checkout. Please try again.' }, { status: 502 });
  }
}
