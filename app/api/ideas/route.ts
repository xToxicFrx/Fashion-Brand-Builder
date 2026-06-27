import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { stringifyJson } from '@/lib/json';

/** List the current user's saved design ideas (newest first). */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const ideas = await prisma.savedIdea.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  return NextResponse.json({ ideas });
}

const saveSchema = z.object({
  keyword: z.string().trim().min(2).max(60),
  title: z.string().trim().min(2).max(160),
  description: z.string().max(400).optional(),
  suggestedPrice: z.number().optional(),
  brief: z.unknown().optional(),
});

/** Save a design idea (optionally with a generated brief). */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await request.json();
  const parsed = saveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 },
    );
  }

  try {
    const { keyword, title, description, suggestedPrice, brief } = parsed.data;
    const idea = await prisma.savedIdea.create({
      data: {
        userId: user.id,
        keyword,
        title,
        description: description ?? null,
        suggestedPrice: suggestedPrice ?? null,
        status: brief ? 'brief' : 'idea',
        briefJson: brief ? stringifyJson(brief) : null,
      },
    });
    return NextResponse.json({ idea });
  } catch (error) {
    console.error('[api/ideas POST]', error);
    return NextResponse.json(
      { error: 'Could not save the idea.' },
      { status: 500 },
    );
  }
}
