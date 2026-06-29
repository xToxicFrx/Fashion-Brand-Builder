import { prisma } from '@/lib/db';

/**
 * Durable, DB-backed rate limit — no Redis/external service needed, so it works
 * across all serverless instances (unlike an in-memory Map). Returns true if the
 * action is allowed (and records a hit), false once `key` has reached `max`
 * within `windowMs`. Fails OPEN on any DB error so a glitch never locks users
 * out, and prunes the key's expired rows to bound table growth.
 */
export async function rateLimit(
  key: string,
  max: number,
  windowMs: number,
): Promise<boolean> {
  const since = new Date(Date.now() - windowMs);
  try {
    const count = await prisma.rateHit.count({
      where: { key, createdAt: { gte: since } },
    });
    if (count >= max) return false;
    await prisma.rateHit.create({ data: { key } });
    // Opportunistic cleanup of this key's expired hits.
    prisma.rateHit
      .deleteMany({ where: { key, createdAt: { lt: since } } })
      .catch(() => {});
    return true;
  } catch {
    return true;
  }
}

/** Best-effort client IP from proxy headers (Vercel sets x-forwarded-for). */
export function clientIp(request: Request): string {
  return (
    request.headers.get('x-real-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown'
  );
}
