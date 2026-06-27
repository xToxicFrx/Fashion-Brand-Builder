import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

/** Remove a tracked niche (only the owner's). */
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await prisma.trackedNiche.deleteMany({
      where: { id: params.id, userId: user.id },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[api/niches DELETE]', error);
    return NextResponse.json(
      { error: 'Could not remove niche.' },
      { status: 500 },
    );
  }
}
