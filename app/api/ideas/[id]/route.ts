import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { stringifyJson } from '@/lib/json';

/** Delete a saved idea (owner only). */
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  await prisma.savedIdea.deleteMany({
    where: { id: params.id, userId: user.id },
  });
  return NextResponse.json({ ok: true });
}

const patchSchema = z.object({
  brief: z.unknown().optional(),
  imageUrl: z.string().url().startsWith('https://').max(2000).optional(),
});

/** Attach a generated brief and/or mockup to a saved idea (owner only) — lets
 *  the Library complete the idea → brief → mockup loop after saving. */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 },
    );
  }
  const { brief, imageUrl } = parsed.data;
  if (brief === undefined && imageUrl === undefined) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  const updated = await prisma.savedIdea.updateMany({
    where: { id: params.id, userId: user.id },
    data: {
      ...(brief !== undefined
        ? { briefJson: stringifyJson(brief), status: 'brief' }
        : {}),
      ...(imageUrl !== undefined ? { imageUrl } : {}),
    },
  });
  if (updated.count === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
