import { NextResponse } from 'next/server';
import type Stripe from 'stripe';

import { prisma } from '@/lib/db';
import { checkoutSchema } from '@/lib/validations';
import { getStripe, isStripeConfigured, appUrl } from '@/lib/stripe';
import { parseJson, stringifyJson } from '@/lib/json';

export const runtime = 'nodejs';

/**
 * Create a Stripe Checkout Session for a storefront cart. The order itself is
 * created later by the Stripe webhook on `checkout.session.completed`.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid checkout' },
        { status: 400 },
      );
    }

    const { storeSlug, items, customerEmail } = parsed.data;
    const store = await prisma.store.findUnique({ where: { slug: storeSlug } });
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    if (!isStripeConfigured()) {
      return NextResponse.json(
        {
          error:
            'Payments are not configured. Set STRIPE_SECRET_KEY to enable checkout.',
        },
        { status: 503 },
      );
    }

    const products = await prisma.product.findMany({
      where: { id: { in: items.map((i) => i.productId) }, storeId: store.id },
      include: { design: true },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    const orderItems: Array<{
      productId: string;
      size: string;
      quantity: number;
      price: number;
    }> = [];
    let total = 0;

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) continue;
      const prices = parseJson<Record<string, number>>(product.prices, {});
      const unit = prices[item.size] ?? Object.values(prices)[0] ?? 0;
      total += unit * item.quantity;
      orderItems.push({
        productId: item.productId,
        size: item.size,
        quantity: item.quantity,
        price: unit,
      });
      lineItems.push({
        quantity: item.quantity,
        price_data: {
          currency: 'eur',
          unit_amount: Math.round(unit * 100),
          product_data: {
            name: `${product.design.name} (${item.size})`,
          },
        },
      });
    }

    if (lineItems.length === 0) {
      return NextResponse.json(
        { error: 'No valid items in cart' },
        { status: 400 },
      );
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      customer_email: customerEmail,
      success_url: appUrl(`/${storeSlug}?success=1`),
      cancel_url: appUrl(`/${storeSlug}?canceled=1`),
      metadata: {
        storeId: store.id,
        customerEmail,
        items: stringifyJson(orderItems),
        total: String(total),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('[api/checkout]', error);
    return NextResponse.json(
      { error: 'Failed to start checkout.' },
      { status: 500 },
    );
  }
}
