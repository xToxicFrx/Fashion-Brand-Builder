import Link from 'next/link';
import { Sparkles, TrendingUp } from 'lucide-react';

import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { parseJson } from '@/lib/json';
import { WhatToDesignNext } from '@/components/Dashboard/WhatToDesignNext';
import { TrendSparkline } from '@/components/trend-sparkline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Dashboard' };

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const trackedNiches = await prisma.trackedNiche.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 9,
  });

  const watchlist = await Promise.all(
    trackedNiches.map(async (n) => {
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
      const data = latest
        ? parseJson<{ timeline?: { date: string; value: number }[] }>(
            latest.dataJson,
            {},
          )
        : {};
      return {
        id: n.id,
        keyword: n.keyword,
        score: latest?.trendScore ?? null,
        delta:
          latest && previous ? latest.trendScore - previous.trendScore : null,
        timeline: data.timeline ?? [],
      };
    }),
  );

  const recentReports = await prisma.savedReport.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: 'desc' },
    take: 6,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user.name ?? 'designer'}.
        </p>
      </div>

      {/* What to design next */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <Sparkles className="h-5 w-5 text-primary" /> What to design next
          </h2>
          <Link
            href="/trends"
            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            Open Trend Radar →
          </Link>
        </div>

        {trackedNiches.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              Track your first niche in the{' '}
              <Link href="/trends" className="font-medium underline">
                Trend Radar
              </Link>{' '}
              to get personalized ideas — or run the{' '}
              <Link href="/onboarding" className="font-medium underline">
                30-second setup
              </Link>
              .
            </CardContent>
          </Card>
        ) : (
          <>
            <WhatToDesignNext />
            <div>
              <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                Your tracked niches
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {watchlist.map((n) => (
                  <Link
                    key={n.id}
                    href={`/trends?q=${encodeURIComponent(n.keyword)}`}
                    className="block rounded-lg transition-colors hover:bg-muted/40"
                  >
                  <Card className="h-full">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{n.keyword}</CardTitle>
                        {n.score != null && (
                          <Badge variant="secondary">{n.score}</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {n.timeline.length > 1 ? (
                        <TrendSparkline data={n.timeline} className="h-14 w-full" />
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Open it in the Trend Radar to populate history.
                        </p>
                      )}
                      {n.delta != null && n.delta !== 0 && (
                        <p
                          className={`mt-2 text-xs ${
                            n.delta >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {n.delta >= 0 ? '↑' : '↓'} {Math.abs(n.delta)} since last
                          check
                        </p>
                      )}
                    </CardContent>
                  </Card>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Recent reports */}
      {recentReports.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <TrendingUp className="h-5 w-5 text-primary" /> Recent reports
            </h2>
            <Link
              href="/library"
              className="text-sm text-muted-foreground underline-offset-4 hover:underline"
            >
              All in Library →
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recentReports.map((r) => (
              <Link
                key={r.id}
                href="/library"
                className="flex items-center justify-between gap-2 rounded-lg border p-3 hover:bg-muted"
              >
                <span className="truncate text-sm font-medium">{r.keyword}</span>
                <Badge variant="secondary">{r.trendScore}</Badge>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
