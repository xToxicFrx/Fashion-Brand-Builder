import { NextResponse } from 'next/server';

import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { designCreateSchema } from '@/lib/validations';
import { stringifyJson } from '@/lib/json';
import { designLimitFor } from '@/lib/limits';

/** List the current user's designs (newest first). */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const designs = await prisma.design.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: 'desc' },
  });

  return NextResponse.json({ designs });
}

/** Create a new design (enforces the subscription tier's design limit). */
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = designCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid design' },
        { status: 400 },
      );
    }

    const limit = designLimitFor(user.subscriptionTier);
    const count = await prisma.design.count({ where: { userId: user.id } });
    if (count >= limit) {
      return NextResponse.json(
        {
          error: `Your ${user.subscriptionTier} plan allows ${limit} design(s). Upgrade to create more.`,
        },
        { status: 403 },
      );
    }

    const d = parsed.data;
    const design = await prisma.design.create({
      data: {
        userId: user.id,
        name: d.name,
        description: d.description ?? null,
        category: d.category,
        price: d.price,
        status: d.status,
        designData: stringifyJson(d.designData),
        mockupImageUrl: d.mockupImageUrl ?? null,
        thumbnailUrl: d.thumbnailUrl ?? null,
      },
    });

    return NextResponse.json({ design });
  } catch (error) {
    console.error('[api/designs POST]', error);
    return NextResponse.json(
      { error: 'Failed to create design.' },
      { status: 500 },
    );
  }
}
