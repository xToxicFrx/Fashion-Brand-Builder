import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { teaserSchema } from '@/lib/validations';
import { getTrendReport } from '@/lib/trend-intelligence';
import { stringifyJson } from '@/lib/json';
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

    // Best-effort history snapshot — never fail the request over it.
    try {
      await prisma.trendSnapshot.create({
        data: {
          keyword: report.keyword,
          trendScore: report.trendScore,
          momentum: report.momentum,
          source: report.dataSource,
          dataJson: stringifyJson({
            timeline: report.timeline,
            related: report.risingQueries,
            regions: report.regions,
          }),
        },
      });
    } catch (e) {
      logError('api/trends/report:snapshot', e);
    }

    // Auto-save the full report per user so it's instantly re-openable later.
    try {
      await prisma.savedReport.upsert({
        where: { userId_keyword: { userId: user.id, keyword: report.keyword } },
        update: {
          trendScore: report.trendScore,
          momentum: report.momentum,
          dataSource: report.dataSource,
          reportJson: stringifyJson(report),
        },
        create: {
          userId: user.id,
          keyword: report.keyword,
          trendScore: report.trendScore,
          momentum: report.momentum,
          dataSource: report.dataSource,
          reportJson: stringifyJson(report),
        },
      });
    } catch (e) {
      logError('api/trends/report:saveReport', e);
    }

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
