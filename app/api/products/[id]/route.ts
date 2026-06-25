import { NextResponse } from 'next/server';

import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { stringifyJson } from '@/lib/json';

type Params = { params: { id: string } };

async function ownedProduct(userId: string, id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: { store: true },
  });
  if (!product || product.store.userId !== userId) return null;
  return product;
}

/** Update a product (publish toggle, prices, inventory). */
export async function PATCH(request: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const product = await ownedProduct(user.id, params.id);
  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  const body = (await request.json()) as {
    isPublished?: boolean;
    prices?: Record<string, number>;
    inventory?: Record<string, number>;
  };

  const product2 = await prisma.product.update({
    where: { id: params.id },
    data: {
      ...(body.isPublished !== undefined
        ? { isPublished: body.isPublished }
        : {}),
      ...(body.prices ? { prices: stringifyJson(body.prices) } : {}),
      ...(body.inventory ? { inventory: stringifyJson(body.inventory) } : {}),
    },
  });

  return NextResponse.json({ product: product2 });
}

/** Delete a product. */
export async function DELETE(_request: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const product = await ownedProduct(user.id, params.id);
  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }
  await prisma.product.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
