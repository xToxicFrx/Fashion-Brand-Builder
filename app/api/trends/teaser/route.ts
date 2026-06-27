import { NextResponse } from 'next/server';

import { teaserSchema } from '@/lib/validations';
import { getTrendReport } from '@/lib/trend-intelligence';

/**
 * Public trend teaser for the landing page. NOT authenticated, so it has basic,
 * best-effort cost/abuse protection (per-IP rate limit). The heavy lifting +
 * caching + graceful degradation live in getTrendReport().
 */
const RATE_LIMIT = 6; // requests
const RATE_WINDOW_MS = 60_000; // per minute, per IP

const hits = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > RATE_LIMIT;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = teaserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
        { status: 400 },
      );
    }

    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      'unknown';
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Too many requests — please wait a minute and try again.' },
        { status: 429 },
      );
    }

    const report = await getTrendReport(parsed.data.keyword, {
      includeIdeas: false,
    });

    // Shape kept backwards-compatible with the teaser component.
    return NextResponse.json({
      analysis: {
        keyword: report.keyword,
        trendScore: report.trendScore,
        predictionStatus: report.momentum,
        demandLabel: report.demandLabel,
        suggestedPrice: report.suggestedPrice,
        related: report.risingQueries,
        rationale: report.rationale,
        dataSource: report.dataSource,
        timeline: report.timeline,
      },
    });
  } catch (error) {
    console.error('[api/trends/teaser]', error);
    return NextResponse.json(
      { error: 'Trend analysis failed. Please try again.' },
      { status: 502 },
    );
  }
}
