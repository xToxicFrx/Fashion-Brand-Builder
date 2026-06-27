import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

/** List the current user's collections with their items. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const collections = await prisma.collection.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    include: { items: { orderBy: { sortOrder: 'asc' } } },
  });
  return NextResponse.json({ collections });
}

const createSchema = z.object({
  name: z.string().trim().min(1).max(80),
  description: z.string().max(400).optional(),
});

/** Create a new collection. */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 },
    );
  }
  const collection = await prisma.collection.create({
    data: {
      userId: user.id,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
    },
    include: { items: true },
  });
  return NextResponse.json({ collection });
}
