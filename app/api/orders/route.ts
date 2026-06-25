import { NextResponse } from 'next/server';

import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

/** List orders across the current user's store(s). */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const orders = await prisma.order.findMany({
    where: { store: { userId: user.id } },
    include: { store: true },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ orders });
}
