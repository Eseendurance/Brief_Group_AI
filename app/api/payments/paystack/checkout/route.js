import { NextResponse } from 'next/server';
import { verifyRequestUser } from '@/lib/firebaseAdmin';
import { getPlan } from '@/lib/plans';
import { getSiteBaseUrl } from '@/lib/site-url';

export const runtime = 'nodejs';

export async function POST(request) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json(
      { error: 'Paystack isn\u2019t configured yet. Add PAYSTACK_SECRET_KEY in your environment variables.' },
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
    if (!plan || plan.contactOnly || !plan.priceNaira) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const planCode = plan.paystackPlanCodeEnv && process.env[plan.paystackPlanCodeEnv];
    if (!planCode) {
    return NextResponse.json(
      { error: `Paystack recurring plan ID is missing. Configure ${plan.paystackPlanCodeEnv}.` },
      { status: 503 }
    );
    }

    const origin = getSiteBaseUrl(request);

    const res = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: authResult.email,
        currency: 'NGN',
        plan: planCode,
        callback_url: `${origin}/dashboard/settings?upgraded=1`,
        // metadata ties the payment back to the Firebase uid so the webhook
        // knows whose plan to upgrade.
        metadata: { uid: authResult.uid, planId: plan.id },
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.status) {
      throw new Error(data.message || 'Paystack initialization failed');
    }

    return NextResponse.json({ url: data.data.authorization_url });
  } catch (err) {
    console.error('paystack checkout error', err);
    return NextResponse.json({ error: err.message || 'Could not start checkout' }, { status: 500 });
  }
}
