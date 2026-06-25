import { NextResponse } from 'next/server';
import type Stripe from 'stripe';

import { prisma } from '@/lib/db';
import { getStripe, isStripeConfigured } from '@/lib/stripe';

export const runtime = 'nodejs';

/**
 * Stripe webhook handler. Verifies the signature against the raw request body
 * and creates an Order when a checkout session completes.
 */
export async function POST(request: Request) {
  if (!isStripeConfigured() || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: 'Stripe webhooks are not configured.' },
      { status: 503 },
    );
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  const body = await request.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (error) {
    console.error('[stripe/webhook] signature verification failed:', error);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const meta = session.metadata ?? {};
      if (meta.storeId && meta.items) {
        await prisma.order.create({
          data: {
            storeId: meta.storeId,
            customerEmail:
              meta.customerEmail ?? session.customer_email ?? 'unknown',
            items: meta.items,
            totalAmount: Number(meta.total ?? 0),
            status: 'processing',
            stripePaymentId:
              typeof session.payment_intent === 'string'
                ? session.payment_intent
                : (session.id ?? null),
          },
        });
      }
    }
  } catch (error) {
    console.error('[stripe/webhook] handler error:', error);
    return NextResponse.json({ error: 'Handler error' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
