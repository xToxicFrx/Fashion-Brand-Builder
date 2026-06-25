import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import {
  TrendsExplorer,
  type SerializedTrend,
} from '@/components/Trends/TrendsExplorer';

export const dynamic = 'force-dynamic';

export default async function TrendsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const trends = await prisma.trend.findMany({
    orderBy: { generatedAt: 'desc' },
    take: 50,
  });

  const serialized: SerializedTrend[] = trends.map((t) => ({
    id: t.id,
    keyword: t.keyword,
    category: t.category,
    trendScore: t.trendScore,
    predictionStatus: t.predictionStatus,
    googleTrendsData: t.googleTrendsData,
    generatedAt: t.generatedAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Trend Intelligence</h1>
        <p className="text-muted-foreground">
          Search keywords for live Google Trends data, then analyze them with AI.
        </p>
      </div>
      <TrendsExplorer initialTrends={serialized} />
    </div>
  );
}
