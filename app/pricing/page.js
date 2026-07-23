'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Check, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { PLANS } from '@/lib/plans';
import { useAuth } from '@/lib/auth-context';
import { authedFetch } from '@/lib/api-client';

export default function PricingPage() {
  const { user, configured } = useAuth();
  const router = useRouter();
  const [loadingPlan, setLoadingPlan] = useState(null); // `${planId}-${provider}`
  const [error, setError] = useState('');

  async function handleCheckout(planId, provider) {
    if (!user) {
      router.push('/signup');
      return;
    }
    setError('');
    setLoadingPlan(`${planId}-${provider}`);
    try {
      const endpoint = provider === 'stripe' ? '/api/payments/stripe/checkout' : '/api/payments/paystack/checkout';
      const data = await authedFetch(endpoint, { method: 'POST', body: JSON.stringify({ planId }) });
      // Stripe/Paystack checkout pages live on their own domains, so this has
      // to be a real browser navigation, not a Next.js route — that's a
      // legitimate use of window.location, not a purity violation.
      // eslint-disable-next-line react-hooks/immutability
      window.location.href = data.url;
    } catch (err) {
      setError(err.message);
      setLoadingPlan(null);
    }
  }

  return (
    <main className="min-h-screen bg-white bg-grid-fade">
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="Brief Group" width={32} height={32} className="h-8 w-8 object-contain" />
            <span className="font-display font-semibold">Brief Group</span>
          </Link>
          <Link href={user ? '/dashboard' : '/'} className="text-sm text-ink-300 hover:text-ink-100 flex items-center gap-1.5">
            <ArrowLeft size={15} /> Back
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center max-w-xl mx-auto mb-14">
          <h1 className="font-display font-semibold text-3xl sm:text-4xl tracking-tight mb-3">Simple, honest pricing</h1>
          <p className="text-ink-300">
            Every new account gets a <strong className="text-ink-100">14-day free trial</strong> with full access
            to AI reports, inspections, and the assistant — no card required to start. Priced in Naira for our
            primary market, with clear USD for international pilots.
          </p>
        </div>

        {error && (
          <div className="max-w-md mx-auto flex items-start gap-2 bg-alert/10 border border-alert/30 text-alert text-sm rounded-lg p-4 mb-8">
            <AlertCircle size={16} className="shrink-0 mt-0.5" /> {error}
          </div>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-4xl mx-auto">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className={`card p-6 flex flex-col ${plan.popular ? 'border-amber shadow-glow-amber ring-1 ring-amber/20' : ''}`}
            >
              {plan.popular && (
                <span className="self-start text-[10px] font-semibold uppercase tracking-wide bg-amber text-white px-2 py-0.5 rounded-full mb-3">
                  Most popular
                </span>
              )}
              <h3 className="font-display font-semibold text-lg">{plan.name}</h3>
              <p className="text-ink-500 text-xs mb-4">{plan.tagline}</p>

              <div className="mb-5">
                {plan.contactOnly ? (
                  <div className="font-display text-2xl">Custom</div>
                ) : (
                  <>
                    <div className="font-display text-2xl mono-num">
                      {plan.priceNaira === 0 ? '₦0' : `₦${plan.priceNaira.toLocaleString()}`}
                      <span className="text-sm text-ink-500 font-body font-normal">/mo</span>
                    </div>
                    {plan.priceUsd > 0 && <div className="text-xs text-ink-500 mt-0.5">~${plan.priceUsd} USD</div>}
                  </>
                )}
              </div>

              <ul className="space-y-2 mb-6 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-ink-300">
                    <Check size={15} className="text-cyan shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

              {plan.contactOnly ? (
                <a href="mailto:Briefgroup1@gmail.com" className="text-center border border-border rounded-lg py-2.5 text-sm font-medium hover:bg-base-800 transition-colors">
                  {plan.cta}
                </a>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={() => handleCheckout(plan.id, 'paystack')}
                    disabled={loadingPlan !== null || !configured}
                    className="w-full flex items-center justify-center gap-2 bg-amber text-white text-sm font-medium py-2.5 rounded-lg hover:bg-amber-soft transition-colors disabled:opacity-50"
                  >
                    {loadingPlan === `${plan.id}-paystack` && <Loader2 className="animate-spin" size={14} />}
                    Pay with Paystack
                  </button>
                  <button
                    onClick={() => handleCheckout(plan.id, 'stripe')}
                    disabled={loadingPlan !== null || !configured}
                    className="w-full flex items-center justify-center gap-2 border border-border text-sm font-medium py-2.5 rounded-lg hover:bg-base-800 transition-colors disabled:opacity-50"
                  >
                    {loadingPlan === `${plan.id}-stripe` && <Loader2 className="animate-spin" size={14} />}
                    Pay with Stripe
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        <p className="text-center text-xs text-ink-500 mt-10">
          Paystack is recommended for Nigerian cards and bank transfers. Stripe is recommended for
          international cards. Both charge in the currency shown above.
        </p>
      </div>
    </main>
  );
}
