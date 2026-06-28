import Stripe from 'stripe';

/**
 * Lazily-instantiated Stripe client. Throws a clear error (rather than crashing
 * at import time) when STRIPE_SECRET_KEY is missing, so the rest of the app runs
 * without Stripe configured.
 */
let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error(
      'Stripe is not configured. Set STRIPE_SECRET_KEY in your environment to enable checkout.',
    );
  }
  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-06-20',
      typescript: true,
    });
  }
  return stripeClient;
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

/** Base URL used to build success/cancel redirect URLs. */
export function appUrl(path = ''): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXTAUTH_URL ??
    'http://localhost:3000';
  return `${base.replace(/\/$/, '')}${path}`;
}

/** Paid subscription plans. Price IDs and display labels come from env so the
 * account owner configures real prices without code changes. A plan with no
 * price ID set is shown but not yet purchasable. Limits live in lib/limits.ts. */
export type PlanId = 'starter' | 'pro';

export interface PlanConfig {
  id: PlanId;
  name: string;
  priceId: string | undefined;
  /** Display only (e.g. "$9/mo"). Set STRIPE_PRICE_<PLAN>_LABEL to override. */
  priceLabel: string;
  highlights: string[];
}

export function getPlans(): PlanConfig[] {
  return [
    {
      id: 'starter',
      name: 'Starter',
      priceId: process.env.STRIPE_PRICE_STARTER,
      priceLabel: process.env.STRIPE_PRICE_STARTER_LABEL ?? '$9/mo',
      highlights: ['300 trend reports/mo', '300 briefs/mo', '150 mockups/mo'],
    },
    {
      id: 'pro',
      name: 'Pro',
      priceId: process.env.STRIPE_PRICE_PRO,
      priceLabel: process.env.STRIPE_PRICE_PRO_LABEL ?? '$29/mo',
      highlights: ['Unlimited reports', 'Unlimited briefs', 'Unlimited mockups'],
    },
  ];
}

export function getPlan(id: string): PlanConfig | undefined {
  return getPlans().find((p) => p.id === id);
}
