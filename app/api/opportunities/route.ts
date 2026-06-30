import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/lib/auth';
import { isOpenAIConfigured } from '@/lib/openai';
import { findOpportunities } from '@/lib/opportunity';
import { getUserCategory } from '@/lib/category-server';
import { checkQuota } from '@/lib/limits';
import { track } from '@/lib/analytics';
import { jsonError, logError } from '@/lib/api';

export const dynamic = 'force-dynamic';

/**
 * Opportunity Finder: proactively rank the best product opportunities for the
 * user's category (the standout feature). Metered like the other AI features;
 * results are cached 12h, and a cached hit doesn't consume quota.
 */
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return jsonError('Unauthorized', 401);
    if (!isOpenAIConfigured()) {
      return jsonError('AI is not configured. Set OPENAI_API_KEY.', 503);
    }

    const body = await request.json().catch(() => ({}));
    const seed =
      typeof body?.seed === 'string' && body.seed.trim()
        ? body.seed.trim().slice(0, 60)
        : undefined;

    const quota = await checkQuota(user.id, 'opportunity');
    if (!quota.allowed) {
      await track('paywall_hit', {
        userId: user.id,
        meta: { feature: 'opportunity', used: quota.used, limit: quota.limit },
      });
      return jsonError(
        `You've used all ${quota.limit} opportunity scans this month — upgrade at /pricing for more, or wait until the 1st.`,
        429,
      );
    }

    const category = await getUserCategory(user.id);
    const result = await findOpportunities(category, seed);

    // Only a real (non-cached) AI scan counts against the monthly quota.
    if (!result.cached) {
      await track('opportunity_generated', {
        userId: user.id,
        meta: { category, count: result.opportunities.length },
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    logError('api/opportunities', error);
    return jsonError('Could not load opportunities. Please try again.', 502);
  }
}
