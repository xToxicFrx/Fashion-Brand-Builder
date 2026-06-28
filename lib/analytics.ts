import { prisma } from '@/lib/db';

/**
 * Product-funnel event types. Keep in sync with the comment on the `Event`
 * model in prisma/schema.prisma. These power the admin metrics view and, in
 * Phase C, usage metering for monetization.
 */
export type EventType =
  | 'signup'
  | 'onboarding_complete'
  | 'report_generated'
  | 'idea_saved'
  | 'brief_generated'
  | 'mockup_generated'
  | 'paywall_hit'
  | 'checkout_started'
  | 'subscribed';

interface TrackOptions {
  userId?: string | null;
  keyword?: string | null;
  meta?: Record<string, unknown>;
}

/**
 * Record a single product-analytics event. Fire-and-forget by contract: it
 * NEVER throws — a tracking failure must not break the user action it
 * accompanies. Callers can `await track(...)` (cheap insert, guarantees the
 * write completes before a serverless function freezes) without a try/catch.
 */
export async function track(
  type: EventType,
  opts: TrackOptions = {},
): Promise<void> {
  try {
    await prisma.event.create({
      data: {
        type,
        userId: opts.userId ?? null,
        keyword: opts.keyword ?? null,
        meta: opts.meta ? JSON.stringify(opts.meta) : null,
      },
    });
  } catch (error) {
    // Swallow — analytics must never surface to the user or fail the request.
    console.error(`[analytics] track("${type}") failed:`, error);
  }
}
