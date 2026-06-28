import { notFound } from 'next/navigation';

import { prisma } from '@/lib/db';

// Always read fresh from the DB; never statically cache the metrics.
export const dynamic = 'force-dynamic';

/** Distinct users that fired a given event type at least once. */
async function distinctUsers(type: string): Promise<number> {
  const rows = await prisma.event.findMany({
    where: { type, userId: { not: null } },
    distinct: ['userId'],
    select: { userId: true },
  });
  return rows.length;
}

/** Distinct users active (any event) since a point in time. */
async function activeSince(since: Date): Promise<number> {
  const rows = await prisma.event.findMany({
    where: { createdAt: { gte: since }, userId: { not: null } },
    distinct: ['userId'],
    select: { userId: true },
  });
  return rows.length;
}

/**
 * Private product-metrics dashboard. Guarded by a shared secret like the
 * waitlist page: set `ADMIN_TOKEN` and open `/admin/metrics?token=<value>`.
 * Wrong/missing token 404s. Shows the activation funnel (distinct users per
 * step), DAU/WAU and a recent-event feed from the `Event` model.
 */
export default async function MetricsAdminPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected || searchParams.token !== expected) {
    notFound();
  }

  const now = Date.now();
  const dayAgo = new Date(now - 1000 * 60 * 60 * 24);
  const weekAgo = new Date(now - 1000 * 60 * 60 * 24 * 7);

  const [
    totalUsers,
    totalEvents,
    byType,
    usersReport,
    usersBrief,
    usersMockup,
    usersIdea,
    dau,
    wau,
    recent,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.event.count(),
    prisma.event.groupBy({ by: ['type'], _count: { _all: true } }),
    distinctUsers('report_generated'),
    distinctUsers('brief_generated'),
    distinctUsers('mockup_generated'),
    distinctUsers('idea_saved'),
    activeSince(dayAgo),
    activeSince(weekAgo),
    prisma.event.findMany({ orderBy: { createdAt: 'desc' }, take: 30 }),
  ]);

  const eventsOf = (t: string) =>
    byType.find((b) => b.type === t)?._count._all ?? 0;
  const pct = (n: number) =>
    totalUsers > 0 ? Math.round((n / totalUsers) * 100) : 0;

  const funnel = [
    { label: 'Signed up', users: totalUsers, events: totalUsers },
    { label: 'Generated a report', users: usersReport, events: eventsOf('report_generated') },
    { label: 'Generated a brief', users: usersBrief, events: eventsOf('brief_generated') },
    { label: 'Generated a mockup', users: usersMockup, events: eventsOf('mockup_generated') },
    { label: 'Saved an idea', users: usersIdea, events: eventsOf('idea_saved') },
  ];

  const headline = [
    { label: 'Users', value: totalUsers },
    { label: 'Activation', value: `${pct(usersMockup)}%` },
    { label: 'DAU', value: dau },
    { label: 'WAU', value: wau },
    { label: 'Events', value: totalEvents },
  ];

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-2xl font-bold">Product metrics</h1>
      <p className="text-sm text-muted-foreground">
        Activation = users who generated a mockup ÷ total users.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-5">
        {headline.map((h) => (
          <div key={h.label} className="rounded-lg border p-4">
            <p className="text-2xl font-bold tabular-nums">{h.value}</p>
            <p className="text-xs text-muted-foreground">{h.label}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-12 text-lg font-bold">Activation funnel</h2>
      <table className="mt-3 w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="py-2 font-medium">Step</th>
            <th className="py-2 text-right font-medium">Users</th>
            <th className="py-2 text-right font-medium">% of signups</th>
            <th className="py-2 text-right font-medium">Events</th>
          </tr>
        </thead>
        <tbody>
          {funnel.map((f) => (
            <tr key={f.label} className="border-b">
              <td className="py-2">{f.label}</td>
              <td className="py-2 text-right tabular-nums">{f.users}</td>
              <td className="py-2 text-right tabular-nums text-muted-foreground">
                {pct(f.users)}%
              </td>
              <td className="py-2 text-right tabular-nums text-muted-foreground">
                {f.events}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="mt-12 text-lg font-bold">Recent activity</h2>
      {recent.length > 0 ? (
        <table className="mt-3 w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="py-2 font-medium">Event</th>
              <th className="py-2 font-medium">Keyword</th>
              <th className="py-2 font-medium">When</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((e) => (
              <tr key={e.id} className="border-b">
                <td className="py-2 font-mono text-xs">{e.type}</td>
                <td className="py-2 text-muted-foreground">{e.keyword ?? '—'}</td>
                <td className="py-2 text-muted-foreground">
                  {e.createdAt.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">
          No events yet. Use the app (generate a report, brief or mockup) and
          they&apos;ll show up here.
        </p>
      )}
    </main>
  );
}
