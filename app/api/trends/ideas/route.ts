import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getTrendReport } from '@/lib/trend-intelligence';

export const dynamic = 'force-dynamic';

/**
 * Ranked "what to design next" feed: pulls AI design ideas for the user's most
 * recent tracked niches and ranks them by trend score. Reports are cached (6h)
 * inside getTrendReport, so repeat loads are cheap.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const niches = await prisma.trackedNiche.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 4,
  });
  if (niches.length === 0) {
    return NextResponse.json({ ideas: [] });
  }

  const reports = await Promise.all(
    niches.map((n) =>
      getTrendReport(n.keyword, { includeIdeas: true }).catch(() => null),
    ),
  );

  const ideas: Array<{
    title: string;
    description: string;
    suggestedPrice: number;
    keyElements: string[];
    keyword: string;
    trendScore: number;
    momentum: string;
  }> = [];

  for (const r of reports) {
    if (!r) continue;
    for (const idea of r.designIdeas) {
      ideas.push({
        ...idea,
        keyword: r.keyword,
        trendScore: r.trendScore,
        momentum: r.momentum,
      });
    }
  }

  ideas.sort((a, b) => b.trendScore - a.trendScore);
  return NextResponse.json({ ideas: ideas.slice(0, 12) });
}
