// Single source of truth for pricing — used by the pricing page and both
// payment routes, so the price shown to the user always matches what's
// actually charged.
//
// Pricing reasoning (so this isn't an arbitrary number): Claude API costs at
// typical pilot usage run roughly $2-5/user/month even on generous usage
// (20 reports + 100 chat messages + 20 inspections), plus Firebase/Vercel
// infra costs that stay near-zero at this scale. Starter and Growth are
// priced with wide margin over that, in Naira first since your primary
// market is Nigeria, with a USD equivalent for international pilots.

export const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    priceNaira: 25000,
    priceUsd: 17,
    tagline: 'For a single site running for real',
    features: [
      'Up to 3 sites',
      'Unlimited energy & fault readings',
      '20 AI reports / month',
      '20 inspections / month',
      'Email support',
    ],
    cta: 'Start 14-day trial',
    stripePriceEnv: 'STRIPE_PRICE_STARTER',
    paystackPlanCodeEnv: 'PAYSTACK_PLAN_STARTER',
  },
  {
    id: 'growth',
    name: 'Growth',
    priceNaira: 75000,
    priceUsd: 50,
    tagline: 'For multi-site operators',
    features: [
      'Up to 10 sites',
      'Unlimited energy & fault readings',
      'Unlimited AI reports',
      'Unlimited inspections',
      'Priority support',
      'Early access to Marketplace',
    ],
    cta: 'Start 14-day trial',
    popular: true,
    stripePriceEnv: 'STRIPE_PRICE_GROWTH',
    paystackPlanCodeEnv: 'PAYSTACK_PLAN_GROWTH',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    priceNaira: null,
    priceUsd: null,
    tagline: 'For large or multi-region operations',
    features: [
      'Unlimited sites',
      'Custom data retention & SLA',
      'Dedicated support',
      'Custom integrations',
    ],
    cta: 'Talk to us',
    contactOnly: true,
  },
];

export function getPlan(planId) {
  return PLANS.find((p) => p.id === planId) || null;
}
