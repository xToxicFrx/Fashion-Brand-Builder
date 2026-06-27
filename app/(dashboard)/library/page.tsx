import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { parseJson } from '@/lib/json';
import { LibraryView } from '@/components/Library/LibraryView';
import type { TrendReport } from '@/lib/trend-types';

export const dynamic = 'force-dynamic';

export default async function LibraryPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [reports, ideas] = await Promise.all([
    prisma.savedReport.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    }),
    prisma.savedIdea.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 60,
    }),
  ]);

  const reportItems = reports.map((r) => {
    const fallback: TrendReport = {
      keyword: r.keyword,
      dataSource: 'ai_estimate',
      trendScore: r.trendScore,
      momentum: 'trending_up',
      demandLabel: 'medium',
      suggestedPrice: 0,
      timeline: [],
      risingQueries: [],
      regions: [],
      designIdeas: [],
      audience: '',
      rationale: '',
    };
    return {
      id: r.id,
      keyword: r.keyword,
      trendScore: r.trendScore,
      momentum: r.momentum,
      createdAt: r.createdAt.toISOString(),
      report: parseJson<TrendReport>(r.reportJson, fallback),
    };
  });

  const ideaItems = ideas.map((i) => ({
    id: i.id,
    keyword: i.keyword,
    title: i.title,
    description: i.description,
    suggestedPrice: i.suggestedPrice,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Library</h1>
        <p className="text-muted-foreground">
          Everything you&apos;ve analyzed and saved — reopen any report instantly,
          no AI needed.
        </p>
      </div>
      <LibraryView reports={reportItems} ideas={ideaItems} />
    </div>
  );
}
