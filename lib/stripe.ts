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
