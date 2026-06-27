import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { teaserSchema } from '@/lib/validations';

/** List the current user's tracked niches, each with its latest score + delta. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const niches = await prisma.trackedNiche.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  });

  const withSnapshots = await Promise.all(
    niches.map(async (n) => {
      const [latest, previous] = await Promise.all([
        prisma.trendSnapshot.findFirst({
          where: { keyword: n.keyword },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.trendSnapshot.findFirst({
          where: { keyword: n.keyword },
          orderBy: { createdAt: 'desc' },
          skip: 1,
        }),
      ]);
      return {
        id: n.id,
        keyword: n.keyword,
        createdAt: n.createdAt.toISOString(),
        trendScore: latest?.trendScore ?? null,
        momentum: latest?.momentum ?? null,
        source: latest?.source ?? null,
        delta:
          latest && previous ? latest.trendScore - previous.trendScore : null,
      };
    }),
  );

  return NextResponse.json({ niches: withSnapshots });
}

/** Track a new niche (idempotent per user+keyword). */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = teaserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 },
    );
  }

  try {
    const niche = await prisma.trackedNiche.upsert({
      where: {
        userId_keyword: { userId: user.id, keyword: parsed.data.keyword },
      },
      update: {},
      create: { userId: user.id, keyword: parsed.data.keyword },
    });
    return NextResponse.json({ niche });
  } catch (error) {
    console.error('[api/niches POST]', error);
    return NextResponse.json(
      { error: 'Could not track niche.' },
      { status: 500 },
    );
  }
}
