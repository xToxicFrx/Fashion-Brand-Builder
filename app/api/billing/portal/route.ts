import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getStripe, isStripeConfigured, appUrl } from '@/lib/stripe';
import { jsonError, logError } from '@/lib/api';

export const dynamic = 'force-dynamic';

/** Open the Stripe billing portal so a subscriber can manage/cancel their plan.
 *  Gated on Stripe being configured and the user having a Stripe customer. */
export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) return jsonError('Unauthorized', 401);
    if (!isStripeConfigured()) {
      return jsonError('Billing is not configured yet.', 503);
    }
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser?.stripeCustomerId) {
      return jsonError('No billing account yet.', 400);
    }
    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: dbUser.stripeCustomerId,
      return_url: appUrl('/pricing'),
    });
    return NextResponse.json({ url: session.url });
  } catch (error) {
    logError('api/billing/portal', error);
    return jsonError('Could not open the billing portal.', 502);
  }
}
