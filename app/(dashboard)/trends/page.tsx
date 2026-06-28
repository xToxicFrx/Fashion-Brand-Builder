import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { TrendRadar } from '@/components/Trends/TrendRadar';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Trend Radar' };

export default async function TrendsPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const user = await getCurrentUser();
  if (!user) return null;

  const niches = await prisma.trackedNiche.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 24,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Trend Radar</h1>
        <p className="text-muted-foreground">
          Search any fashion niche for a live, data-grounded trend report — then
          turn the winners into a design.
        </p>
      </div>

      <TrendRadar initialKeyword={searchParams.q ?? ''} />

      {niches.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">
            Your tracked niches
          </h2>
          <div className="flex flex-wrap gap-2">
            {niches.map((n) => (
              <span
                key={n.id}
                className="rounded-full border px-3 py-1 text-sm"
              >
                {n.keyword}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
