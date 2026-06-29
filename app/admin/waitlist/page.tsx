import { notFound } from 'next/navigation';

import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// Always read fresh from the DB; never statically cache the count.
export const dynamic = 'force-dynamic';

/**
 * Minimal private waitlist dashboard. Restricted to users with role "admin"
 * (404s otherwise, hiding its existence). Grant admin once in the DB:
 *   UPDATE "User" SET role = 'admin' WHERE email = 'you@example.com';
 */
export default async function WaitlistAdminPage() {
  const user = await getCurrentUser();
  if (user?.role !== 'admin') {
    notFound();
  }

  const [count, recent] = await Promise.all([
    prisma.waitlistSignup.count(),
    prisma.waitlistSignup.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
  ]);

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-2xl font-bold">Waitlist</h1>
      <p className="mt-4 text-6xl font-bold tabular-nums">{count}</p>
      <p className="text-sm text-muted-foreground">total signups</p>

      {recent.length > 0 ? (
        <table className="mt-10 w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="py-2 font-medium">Email</th>
              <th className="py-2 font-medium">Sells on</th>
              <th className="py-2 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((r) => (
              <tr key={r.id} className="border-b">
                <td className="py-2">{r.email}</td>
                <td className="py-2">{r.sellsOn ?? '—'}</td>
                <td className="py-2 text-muted-foreground">
                  {r.createdAt.toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="mt-10 text-sm text-muted-foreground">
          No signups yet. Share your link and check back here.
        </p>
      )}
    </main>
  );
}
