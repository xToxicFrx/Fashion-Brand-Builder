import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getStripe, isStripeConfigured, appUrl, getPlan } from '@/lib/stripe';
import { track } from '@/lib/analytics';
import { jsonError, logError } from '@/lib/api';

export const dynamic = 'force-dynamic';

const schema = z.object({ plan: z.enum(['starter', 'pro']) });

/** Start a Stripe Checkout session to subscribe to a paid plan. Gated on Stripe
 *  being configured (key + the plan's price ID), so it no-ops cleanly until set. */
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return jsonError('Unauthorized', 401);
    if (!isStripeConfigured()) {
      return jsonError('Billing is not configured yet.', 503);
    }

    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return jsonError('Invalid plan', 400);

    const plan = getPlan(parsed.data.plan);
    if (!plan?.priceId) {
      return jsonError('That plan is not available yet.', 503);
    }

    const stripe = getStripe();

    // Reuse the user's Stripe customer if we have one, else create + store it.
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    let customerId = dbUser?.stripeCustomerId ?? undefined;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: plan.priceId, quantity: 1 }],
      success_url: appUrl('/pricing?upgraded=1'),
      cancel_url: appUrl('/pricing'),
      metadata: { userId: user.id, plan: plan.id },
      subscription_data: { metadata: { userId: user.id, plan: plan.id } },
    });

    await track('checkout_started', { userId: user.id, meta: { plan: plan.id } });
    return NextResponse.json({ url: session.url });
  } catch (error) {
    logError('api/checkout', error);
    return jsonError('Could not start checkout.', 502);
  }
}
