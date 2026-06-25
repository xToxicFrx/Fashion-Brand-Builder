import { NextResponse } from 'next/server';

import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { designUpdateSchema } from '@/lib/validations';
import { stringifyJson } from '@/lib/json';

type Params = { params: { id: string } };

async function ownedDesign(userId: string, id: string) {
  const design = await prisma.design.findUnique({ where: { id } });
  if (!design || design.userId !== userId) return null;
  return design;
}

/** Get a single design owned by the current user. */
export async function GET(_request: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const design = await ownedDesign(user.id, params.id);
  if (!design) {
    return NextResponse.json({ error: 'Design not found' }, { status: 404 });
  }
  return NextResponse.json({ design });
}

/** Update a design owned by the current user. */
export async function PUT(request: Request, { params }: Params) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const existing = await ownedDesign(user.id, params.id);
    if (!existing) {
      return NextResponse.json({ error: 'Design not found' }, { status: 404 });
    }

    const body = await request.json();
    const parsed = designUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid design' },
        { status: 400 },
      );
    }

    const d = parsed.data;
    const design = await prisma.design.update({
      where: { id: params.id },
      data: {
        ...(d.name !== undefined ? { name: d.name } : {}),
        ...(d.description !== undefined
          ? { description: d.description ?? null }
          : {}),
        ...(d.category !== undefined ? { category: d.category } : {}),
        ...(d.price !== undefined ? { price: d.price } : {}),
        ...(d.status !== undefined ? { status: d.status } : {}),
        ...(d.designData !== undefined
          ? { designData: stringifyJson(d.designData) }
          : {}),
        ...(d.mockupImageUrl !== undefined
          ? { mockupImageUrl: d.mockupImageUrl ?? null }
          : {}),
        ...(d.thumbnailUrl !== undefined
          ? { thumbnailUrl: d.thumbnailUrl ?? null }
          : {}),
      },
    });

    return NextResponse.json({ design });
  } catch (error) {
    console.error('[api/designs/[id] PUT]', error);
    return NextResponse.json(
      { error: 'Failed to update design.' },
      { status: 500 },
    );
  }
}

/** Delete a design owned by the current user. */
export async function DELETE(_request: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const existing = await ownedDesign(user.id, params.id);
  if (!existing) {
    return NextResponse.json({ error: 'Design not found' }, { status: 404 });
  }
  await prisma.design.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
