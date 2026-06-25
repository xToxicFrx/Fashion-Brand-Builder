import { NextResponse } from 'next/server';

import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { productCreateSchema } from '@/lib/validations';
import { stringifyJson } from '@/lib/json';
import { randomSkuSuffix } from '@/lib/utils';

/** List products across the current user's store(s). */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const products = await prisma.product.findMany({
    where: { store: { userId: user.id } },
    include: { design: true, store: true },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ products });
}

/** Create a product from one of the user's designs in their store. */
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = productCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid product' },
        { status: 400 },
      );
    }

    const store = await prisma.store.findFirst({ where: { userId: user.id } });
    if (!store) {
      return NextResponse.json(
        { error: 'Create a store before adding products.' },
        { status: 400 },
      );
    }

    const design = await prisma.design.findUnique({
      where: { id: parsed.data.designId },
    });
    if (!design || design.userId !== user.id) {
      return NextResponse.json({ error: 'Design not found' }, { status: 404 });
    }

    const product = await prisma.product.create({
      data: {
        designId: design.id,
        storeId: store.id,
        sku: parsed.data.sku || `SKU-${randomSkuSuffix()}`,
        sizes: stringifyJson(parsed.data.sizes),
        prices: stringifyJson(parsed.data.prices),
        inventory: stringifyJson(parsed.data.inventory),
        printProvider: parsed.data.printProvider,
        isPublished: parsed.data.isPublished,
      },
    });

    return NextResponse.json({ product });
  } catch (error) {
    console.error('[api/products POST]', error);
    return NextResponse.json(
      { error: 'Failed to create product.' },
      { status: 500 },
    );
  }
}
