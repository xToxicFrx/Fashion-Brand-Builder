import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

const itemSchema = z.object({
  title: z.string().trim().min(1).max(160),
  keyword: z.string().max(60).optional(),
});

/** Add an item to a collection (owner only). */
export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const collection = await prisma.collection.findFirst({
    where: { id: params.id, userId: user.id },
  });
  if (!collection) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  const body = await request.json();
  const parsed = itemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 },
    );
  }
  const count = await prisma.collectionItem.count({
    where: { collectionId: collection.id },
  });
  const item = await prisma.collectionItem.create({
    data: {
      collectionId: collection.id,
      title: parsed.data.title,
      keyword: parsed.data.keyword ?? null,
      sortOrder: count,
    },
  });
  return NextResponse.json({ item });
}
