import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

const patchSchema = z.object({
  status: z.enum(['idea', 'designing', 'ready', 'listed']).optional(),
  title: z.string().trim().min(1).max(160).optional(),
  notes: z.string().max(400).optional(),
});

/** Update a collection item (owner only, verified via the parent collection). */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 },
    );
  }
  const item = await prisma.collectionItem.findFirst({
    where: { id: params.id, collection: { userId: user.id } },
  });
  if (!item) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  await prisma.collectionItem.update({
    where: { id: item.id },
    data: parsed.data,
  });
  return NextResponse.json({ ok: true });
}

/** Delete a collection item (owner only). */
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const item = await prisma.collectionItem.findFirst({
    where: { id: params.id, collection: { userId: user.id } },
  });
  if (!item) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  await prisma.collectionItem.delete({ where: { id: item.id } });
  return NextResponse.json({ ok: true });
}
