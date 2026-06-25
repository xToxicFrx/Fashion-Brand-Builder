import { NextResponse } from 'next/server';

import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { orderUpdateSchema } from '@/lib/validations';

type Params = { params: { id: string } };

/** Update an order's status / tracking number (store owner only). */
export async function PATCH(request: Request, { params }: Params) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: { store: true },
    });
    if (!order || order.store.userId !== user.id) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const body = await request.json();
    const parsed = orderUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid update' },
        { status: 400 },
      );
    }

    const updated = await prisma.order.update({
      where: { id: params.id },
      data: {
        ...(parsed.data.status ? { status: parsed.data.status } : {}),
        ...(parsed.data.trackingNumber !== undefined
          ? { trackingNumber: parsed.data.trackingNumber ?? null }
          : {}),
      },
    });

    return NextResponse.json({ order: updated });
  } catch (error) {
    console.error('[api/orders/[id] PATCH]', error);
    return NextResponse.json(
      { error: 'Failed to update order.' },
      { status: 500 },
    );
  }
}
