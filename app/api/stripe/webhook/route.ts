import { NextResponse } from 'next/server';
import type Stripe from 'stripe';

import { getStripe, isStripeConfigured } from '@/lib/stripe';
import { prisma } from '@/lib/db';
import { track } from '@/lib/analytics';
import { logError } from '@/lib/api';

export const dynamic = 'force-dynamic';

/**
 * Stripe webhook: keeps User.subscriptionTier in sync with the subscription.
 * Verifies the signature against STRIPE_WEBHOOK_SECRET using the raw request
 * body. Gated on Stripe being configured so it no-ops cleanly until set up.
 */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!isStripeConfigured() || !secret) {
    return NextResponse.json({ error: 'Not configured' }, { status: 503 });
  }
  const sig = request.headers.get('stripe-signature');
  if (!sig) return NextResponse.json({ error: 'No signature' }, { status: 400 });

  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    const raw = await request.text();
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch (error) {
    logError('api/stripe/webhook:verify', error);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const s = event.data.object as Stripe.Checkout.Session;
        const userId = s.metadata?.userId;
        const plan = s.metadata?.plan;
        if (userId && plan) {
          const before = await prisma.user.findUnique({
            where: { id: userId },
            select: { subscriptionTier: true },
          });
          await prisma.user.update({
            where: { id: userId },
            data: {
              subscriptionTier: plan,
              ...(typeof s.customer === 'string'
                ? { stripeCustomerId: s.customer }
                : {}),
            },
          });
          // Count a new subscription only once — Stripe may retry the event.
          if (before?.subscriptionTier !== plan) {
            await track('subscribed', { userId, meta: { plan } });
          }
        }
        break;
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.userId;
        const active = sub.status === 'active' || sub.status === 'trialing';
        const tier = active ? sub.metadata?.plan ?? 'starter' : 'free';
        if (userId) {
          await prisma.user
            .update({ where: { id: userId }, data: { subscriptionTier: tier } })
            .catch(() => {});
        }
        break;
      }
      default:
        break;
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    logError('api/stripe/webhook', error);
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 });
  }
}
