import { prisma } from '@/lib/db';

/**
 * Per-user monthly usage limits for the AI features that each cost an OpenAI
 * call. Primary purpose today: cost protection — a single account can't run up
 * the OpenAI bill. It also forms the monetization structure: paid tiers lift
 * the limits once Stripe checkout is wired (Phase C3).
 */

/** Metered AI features. */
export type Feature = 'report' | 'brief' | 'mockup';

/** The analytics Event type recorded for each feature (see lib/analytics.ts). */
const EVENT_TYPE: Record<Feature, string> = {
  report: 'report_generated',
  brief: 'brief_generated',
  mockup: 'mockup_generated',
};

/**
 * Monthly limits by subscription tier. Free is generous enough for a real
 * designer to explore but bounded against abuse. starter/pro activate when
 * Stripe is wired.
 */
const LIMITS: Record<string, Record<Feature, number>> = {
  free: { report: 25, brief: 25, mockup: 10 },
  starter: { report: 300, brief: 300, mockup: 150 },
  pro: {
    report: Number.POSITIVE_INFINITY,
    brief: Number.POSITIVE_INFINITY,
    mockup: Number.POSITIVE_INFINITY,
  },
};

export function monthlyLimit(tier: string, feature: Feature): number {
  return (LIMITS[tier] ?? LIMITS.free)[feature];
}

export interface QuotaStatus {
  allowed: boolean;
  used: number;
  limit: number;
}

/**
 * Check a user's usage of a feature against their tier's monthly limit, counting
 * this calendar month's events. Fails OPEN (allowed) on any error so a metering
 * glitch never blocks a real user — cost protection shouldn't break the app.
 */
export async function checkQuota(
  userId: string,
  tier: string,
  feature: Feature,
): Promise<QuotaStatus> {
  const limit = monthlyLimit(tier, feature);
  if (!Number.isFinite(limit)) return { allowed: true, used: 0, limit };
  try {
    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    const used = await prisma.event.count({
      where: { userId, type: EVENT_TYPE[feature], createdAt: { gte: start } },
    });
    return { allowed: used < limit, used, limit };
  } catch {
    return { allowed: true, used: 0, limit };
  }
}
