import { NextResponse } from 'next/server';

import { teaserSchema } from '@/lib/validations';
import {
  analyzeTrendKeyword,
  isOpenAIConfigured,
  type TrendAnalysis,
} from '@/lib/openai';

/**
 * Public trend teaser for the landing page. NOT authenticated, so it has basic,
 * best-effort cost/abuse protection: a per-IP rate limit and a per-keyword cache
 * (both in-memory — scoped to a single serverless instance; use a shared store
 * like Upstash for hard, global limits). Returns 503 when AI isn't configured so
 * the frontend can fall back to a static example instead of erroring.
 */
const RATE_LIMIT = 5; // requests
const RATE_WINDOW_MS = 60_000; // per minute, per IP
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

const hits = new Map<string, number[]>();
const cache = new Map<string, { at: number; data: TrendAnalysis }>();

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

    if (!isOpenAIConfigured()) {
      return NextResponse.json(
        { error: 'AI is not configured yet.' },
        { status: 503 },
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

    const keyword = parsed.data.keyword;
    const cacheKey = keyword.toLowerCase();
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
      return NextResponse.json({ analysis: cached.data, cached: true });
    }

    const analysis = await analyzeTrendKeyword(keyword);
    cache.set(cacheKey, { at: Date.now(), data: analysis });
    return NextResponse.json({ analysis });
  } catch (error) {
    console.error('[api/trends/teaser]', error);
    return NextResponse.json(
      { error: 'Trend analysis failed. Please try again.' },
      { status: 502 },
    );
  }
}
