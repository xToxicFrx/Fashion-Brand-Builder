import { NextResponse } from 'next/server';

import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { profileUpdateSchema } from '@/lib/validations';

/** Update the current user's profile (name, bio, role, avatar). */
export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = profileUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid profile' },
        { status: 400 },
      );
    }

    const data = parsed.data;
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.bio !== undefined ? { bio: data.bio ?? null } : {}),
        ...(data.role !== undefined ? { role: data.role } : {}),
        ...(data.image !== undefined ? { image: data.image ?? null } : {}),
      },
    });

    return NextResponse.json({
      user: {
        id: updated.id,
        name: updated.name,
        bio: updated.bio,
        role: updated.role,
      },
    });
  } catch (error) {
    console.error('[api/profile PATCH]', error);
    return NextResponse.json(
      { error: 'Failed to update profile.' },
      { status: 500 },
    );
  }
}
