import Link from 'next/link';
import {
  Images,
  ShoppingBag,
  Package,
  Euro,
  TrendingUp,
  Sparkles,
} from 'lucide-react';

import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { parseJson } from '@/lib/json';
import { formatCurrency, formatDate } from '@/lib/utils';
import { QuickStats } from '@/components/Dashboard/QuickStats';
import { RevenueChart } from '@/components/Dashboard/RevenueChart';
import { WhatToDesignNext } from '@/components/Dashboard/WhatToDesignNext';
import { TrendSparkline } from '@/components/trend-sparkline';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [designs, productCount, orders] = await Promise.all([
    prisma.design.findMany({
      where: { userId: user.id },
      orderBy: { trendScore: 'desc' },
    }),
    prisma.product.count({ where: { store: { userId: user.id } } }),
    prisma.order.findMany({
      where: { store: { userId: user.id } },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const trackedNiches = await prisma.trackedNiche.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 9,
  });

  // Watchlist: latest score + delta + sparkline (from the latest snapshot).
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

  const revenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const publishedCount = designs.filter((d) => d.status === 'published').length;

  const now = new Date();
  const months: Array<{ key: string; label: string }> = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: d.toLocaleString('en-US', { month: 'short' }),
    });
  }
  const buckets = Object.fromEntries(months.map((m) => [m.key, 0])) as Record<
    string,
    number
  >;
  for (const order of orders) {
    const d = new Date(order.createdAt);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (key in buckets) buckets[key] += order.totalAmount;
  }
  const revenueData = months.map((m) => ({
    month: m.label,
    revenue: Math.round(buckets[m.key]),
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user.name ?? 'designer'}.
        </p>
      </div>

      {/* Trend Radar */}
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
              to get personalized, data-grounded ideas on what to design next —
              or run the{' '}
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
                  <Card key={n.id}>
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
                        <TrendSparkline
                          data={n.timeline}
                          className="h-14 w-full"
                        />
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
                          {n.delta >= 0 ? '↑' : '↓'} {Math.abs(n.delta)} since
                          last check
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <QuickStats
        items={[
          {
            label: 'Designs',
            value: String(designs.length),
            icon: Images,
            hint: `${publishedCount} published`,
          },
          { label: 'Products', value: String(productCount), icon: Package },
          { label: 'Orders', value: String(orders.length), icon: ShoppingBag },
          {
            label: 'Revenue',
            value: formatCurrency(revenue),
            icon: Euro,
          },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Revenue (last 6 months)</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart data={revenueData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-4 w-4" /> Top designs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {designs.slice(0, 5).map((design) => (
              <Link
                key={design.id}
                href={`/studio/${design.id}`}
                className="flex items-center justify-between gap-2 rounded-md p-2 hover:bg-muted"
              >
                <span className="truncate text-sm">{design.name}</span>
                <Badge variant="secondary">{design.trendScore ?? '—'}</Badge>
              </Link>
            ))}
            {designs.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No designs yet.{' '}
                <Link href="/studio" className="underline">
                  Create one
                </Link>
                .
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent orders</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No orders yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">Customer</th>
                    <th className="py-2 pr-4 font-medium">Items</th>
                    <th className="py-2 pr-4 font-medium">Total</th>
                    <th className="py-2 pr-4 font-medium">Status</th>
                    <th className="py-2 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 6).map((order) => {
                    const items = parseJson<unknown[]>(order.items, []);
                    return (
                      <tr key={order.id} className="border-b last:border-0">
                        <td className="py-2 pr-4">{order.customerEmail}</td>
                        <td className="py-2 pr-4">{items.length}</td>
                        <td className="py-2 pr-4">
                          {formatCurrency(order.totalAmount)}
                        </td>
                        <td className="py-2 pr-4">
                          <Badge variant="outline" className="capitalize">
                            {order.status}
                          </Badge>
                        </td>
                        <td className="py-2">{formatDate(order.createdAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
