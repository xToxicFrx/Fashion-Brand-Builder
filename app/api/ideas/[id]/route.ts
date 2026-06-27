import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

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
