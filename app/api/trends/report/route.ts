import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/lib/auth';
import { teaserSchema } from '@/lib/validations';
import {
  getTrendReport,
  persistReportArtifacts,
} from '@/lib/trend-intelligence';
import { track } from '@/lib/analytics';
import { jsonError, logError } from '@/lib/api';

/**
 * Full trend report for a logged-in user (includes AI design ideas) and saves a
 * snapshot so we can show history/deltas over time.
 */
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return jsonError('Unauthorized', 401);
    }

    const body = await request.json();
    const parsed = teaserSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? 'Invalid input', 400);
    }

    const report = await getTrendReport(parsed.data.keyword, {
      includeIdeas: true,
    });

    // Persist history artifacts (snapshot + saved report) — best-effort.
    await persistReportArtifacts(user.id, report);

    await track('report_generated', {
      userId: user.id,
      keyword: report.keyword,
      meta: { source: report.dataSource, trendScore: report.trendScore },
    });

    return NextResponse.json({ report });
  } catch (error) {
    logError('api/trends/report', error);
    return jsonError('Trend analysis failed. Please try again.', 502);
  }
}
