import googleTrends from 'google-trends-api';
import type { TREND_STATUSES } from '@/lib/validations';

export type TrendStatus = (typeof TREND_STATUSES)[number];

export interface TrendTimelinePoint {
  date: string;
  value: number;
}

export interface TrendResult {
  keyword: string;
  timeline: TrendTimelinePoint[];
  averageValue: number;
  latestValue: number;
  /** 0-100 interest score (Google Trends is already 0-100). */
  trendScore: number;
  predictionStatus: TrendStatus;
}

/**
 * Derive a simple momentum-based status from the timeline: compare the recent
 * window against the earlier window.
 */
function deriveStatus(timeline: TrendTimelinePoint[]): TrendStatus {
  if (timeline.length < 4) return 'trending_up';
  const window = Math.max(2, Math.floor(timeline.length / 4));
  const recent = timeline.slice(-window);
  const earlier = timeline.slice(-window * 2, -window);
  const avg = (pts: TrendTimelinePoint[]) =>
    pts.reduce((sum, p) => sum + p.value, 0) / (pts.length || 1);
  const recentAvg = avg(recent);
  const earlierAvg = avg(earlier) || 1;

  if (recentAvg > earlierAvg * 1.1) return 'trending_up';
  if (recentAvg < earlierAvg * 0.9) return 'declining';
  return 'peak';
}

/**
 * Fetch interest-over-time for a keyword from Google Trends (unofficial API).
 * Returns a normalized result with a derived trend score and status.
 *
 * @throws if the upstream request fails (rate-limited / blocked / offline).
 */
export async function fetchInterestOverTime(
  keyword: string,
  geo = '',
): Promise<TrendResult> {
  try {
    const raw = await googleTrends.interestOverTime({
      keyword,
      startTime: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90), // last 90 days
      geo: geo || undefined,
    });

    const data = JSON.parse(raw);
    const timelineData: Array<{ formattedTime?: string; value?: number[] }> =
      data?.default?.timelineData ?? [];

    const timeline: TrendTimelinePoint[] = timelineData.map((point) => ({
      date: point.formattedTime ?? '',
      value: Array.isArray(point.value) ? point.value[0] ?? 0 : 0,
    }));

    if (timeline.length === 0) {
      throw new Error('No timeline data returned for this keyword.');
    }

    const averageValue = Math.round(
      timeline.reduce((sum, p) => sum + p.value, 0) / timeline.length,
    );
    const latestValue = timeline[timeline.length - 1]?.value ?? 0;
    // Weight latest momentum slightly above the average.
    const trendScore = Math.min(
      100,
      Math.max(0, Math.round(latestValue * 0.6 + averageValue * 0.4)),
    );

    return {
      keyword,
      timeline,
      averageValue,
      latestValue,
      trendScore,
      predictionStatus: deriveStatus(timeline),
    };
  } catch (error) {
    console.error('[google-trends] interestOverTime failed:', error);
    throw new Error(
      'Failed to fetch Google Trends data. The unofficial Trends endpoint may be rate-limited or temporarily unavailable.',
    );
  }
}

/**
 * Fetch rising/top related search queries for a keyword. Best-effort: returns an
 * empty array on failure so a caller can still build a report.
 */
export async function fetchRelatedQueries(
  keyword: string,
  geo = '',
): Promise<string[]> {
  try {
    const raw = await googleTrends.relatedQueries({
      keyword,
      geo: geo || undefined,
    });
    const data = JSON.parse(raw);
    const lists: Array<{ rankedKeyword?: Array<{ query?: string }> }> =
      data?.default?.rankedList ?? [];
    const queries: string[] = [];
    for (const list of lists) {
      for (const item of list?.rankedKeyword ?? []) {
        if (item?.query) queries.push(String(item.query));
      }
    }
    return Array.from(new Set(queries)).slice(0, 8);
  } catch (error) {
    console.error('[google-trends] relatedQueries failed:', error);
    return [];
  }
}

export interface RegionInterest {
  region: string;
  value: number;
}

/**
 * Fetch interest-by-region (top countries) for a keyword. Best-effort: returns an
 * empty array on failure.
 */
export async function fetchInterestByRegion(
  keyword: string,
  geo = '',
): Promise<RegionInterest[]> {
  try {
    const raw = await googleTrends.interestByRegion({
      keyword,
      geo: geo || undefined,
      resolution: 'COUNTRY',
    });
    const data = JSON.parse(raw);
    const regions: Array<{ geoName?: string; value?: number[] }> =
      data?.default?.geoMapData ?? [];
    return regions
      .map((r) => ({
        region: r.geoName ?? '',
        value: Array.isArray(r.value) ? r.value[0] ?? 0 : 0,
      }))
      .filter((r) => r.region && r.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  } catch (error) {
    console.error('[google-trends] interestByRegion failed:', error);
    return [];
  }
}
