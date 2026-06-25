import { NextResponse } from 'next/server';

import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { trendQuerySchema } from '@/lib/validations';
import { fetchInterestOverTime } from '@/lib/google-trends';
import { stringifyJson } from '@/lib/json';

/** List recently generated trends (newest first). */
export async function GET() {
  const trends = await prisma.trend.findMany({
    orderBy: { generatedAt: 'desc' },
    take: 50,
  });
  return NextResponse.json({ trends });
}

/**
 * Fetch live Google Trends interest for a keyword, persist a Trend row, and
 * return it. Requires the (unofficial) Trends endpoint to be reachable.
 */
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = trendQuerySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid keyword' },
        { status: 400 },
      );
    }

    const { keyword, category, geo } = parsed.data;
    const result = await fetchInterestOverTime(keyword, geo);

    const trend = await prisma.trend.create({
      data: {
        keyword,
        category: category ?? null,
        trendScore: result.trendScore,
        predictionStatus: result.predictionStatus,
        googleTrendsData: stringifyJson({ timeline: result.timeline }),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
      },
    });

    return NextResponse.json({ trend, result });
  } catch (error) {
    console.error('[api/trends POST]', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch trend data.',
      },
      { status: 502 },
    );
  }
}
