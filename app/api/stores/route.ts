import { NextResponse } from 'next/server';

import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { storeSchema } from '@/lib/validations';
import { stringifyJson } from '@/lib/json';
import { slugify } from '@/lib/utils';
import { storeLimitFor } from '@/lib/limits';

/** Get the current user's store (the first one), if any. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const store = await prisma.store.findFirst({ where: { userId: user.id } });
  return NextResponse.json({ store });
}

/** Create or update the current user's store. */
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = storeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid store' },
        { status: 400 },
      );
    }

    const existing = await prisma.store.findFirst({
      where: { userId: user.id },
    });

    if (!existing && storeLimitFor(user.subscriptionTier) < 1) {
      return NextResponse.json(
        {
          error: `Your ${user.subscriptionTier} plan does not include a store. Upgrade to open one.`,
        },
        { status: 403 },
      );
    }

    const data = parsed.data;

    // Ensure a unique slug.
    let slug = data.slug || slugify(data.name) || 'store';
    let suffix = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const clash = await prisma.store.findUnique({ where: { slug } });
      if (!clash || clash.id === existing?.id) break;
      suffix += 1;
      slug = `${data.slug || slugify(data.name) || 'store'}-${suffix}`;
    }

    const payload = {
      name: data.name,
      slug,
      description: data.description ?? null,
      logoUrl: data.logoUrl ?? null,
      brandColors: data.brandColors
        ? stringifyJson(data.brandColors)
        : null,
    };

    const store = existing
      ? await prisma.store.update({ where: { id: existing.id }, data: payload })
      : await prisma.store.create({
          data: { ...payload, userId: user.id },
        });

    return NextResponse.json({ store });
  } catch (error) {
    console.error('[api/stores POST]', error);
    return NextResponse.json(
      { error: 'Failed to save store.' },
      { status: 500 },
    );
  }
}
