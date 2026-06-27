import {
  fetchInterestOverTime,
  fetchRelatedQueries,
  fetchInterestByRegion,
  type TrendTimelinePoint,
  type RegionInterest,
} from '@/lib/google-trends';
import {
  generateTrendInsights,
  isOpenAIConfigured,
  type DesignIdea,
} from '@/lib/openai';

export type Momentum = 'trending_up' | 'peak' | 'declining';

export interface TrendReport {
  keyword: string;
  /** Where the numbers come from — shown to the user as a transparency badge. */
  dataSource: 'google_trends' | 'ai_estimate';
  trendScore: number; // 0-100
  momentum: Momentum;
  demandLabel: 'low' | 'medium' | 'high';
  suggestedPrice: number;
  timeline: TrendTimelinePoint[];
  risingQueries: string[];
  regions: RegionInterest[];
  designIdeas: DesignIdea[];
  audience: string;
  rationale: string;
  generatedAt: string;
}

// In-memory cache to bound external/AI calls. (Per serverless instance.)
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6h
const cache = new Map<string, { at: number; report: TrendReport }>();

function deriveScoreFromLabel(label: 'low' | 'medium' | 'high'): number {
  return label === 'high' ? 82 : label === 'low' ? 35 : 60;
}

/**
 * Build a trend report by combining REAL Google Trends data (when reachable)
 * with an OpenAI interpretation. Degrades gracefully:
 *  - Google Trends blocked/offline  -> AI estimate (dataSource = 'ai_estimate')
 *  - OpenAI not configured           -> minimal report from real data only
 * Never throws for the common failure paths.
 */
export async function getTrendReport(
  keyword: string,
  opts: { includeIdeas?: boolean; geo?: string } = {},
): Promise<TrendReport> {
  const trimmed = keyword.trim();
  const cacheKey = `${trimmed.toLowerCase()}|${opts.includeIdeas ? 'ideas' : 'basic'}|${opts.geo ?? ''}`;
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.report;

  let dataSource: TrendReport['dataSource'] = 'ai_estimate';
  let timeline: TrendTimelinePoint[] = [];
  let risingQueries: string[] = [];
  let regions: RegionInterest[] = [];
  let realScore: number | undefined;
  let realMomentum: Momentum | undefined;

  // 1) Real data (best-effort).
  try {
    const t = await fetchInterestOverTime(trimmed, opts.geo);
    timeline = t.timeline;
    realScore = t.trendScore;
    realMomentum = t.predictionStatus as Momentum;
    dataSource = 'google_trends';
    const [related, regs] = await Promise.all([
      fetchRelatedQueries(trimmed, opts.geo),
      fetchInterestByRegion(trimmed, opts.geo),
    ]);
    risingQueries = related;
    regions = regs;
  } catch {
    dataSource = 'ai_estimate';
  }

  // 2) AI interpretation (grounded when we have real data).
  let insights;
  if (isOpenAIConfigured()) {
    try {
      insights = await generateTrendInsights({
        keyword: trimmed,
        trendScore: realScore,
        momentum: realMomentum,
        risingQueries,
        hasRealData: dataSource === 'google_trends',
        includeIdeas: opts.includeIdeas ?? false,
      });
    } catch {
      insights = undefined;
    }
  }

  const report: TrendReport = {
    keyword: trimmed,
    dataSource,
    trendScore:
      realScore ??
      insights?.trendScore ??
      deriveScoreFromLabel(insights?.demandLabel ?? 'medium'),
    momentum: realMomentum ?? 'trending_up',
    demandLabel: insights?.demandLabel ?? 'medium',
    suggestedPrice: insights?.suggestedPrice ?? 30,
    timeline,
    risingQueries:
      risingQueries.length > 0 ? risingQueries : insights?.related ?? [],
    regions,
    designIdeas: insights?.designIdeas ?? [],
    audience: insights?.audience ?? 'Independent fashion shoppers',
    rationale:
      insights?.rationale ??
      (dataSource === 'google_trends'
        ? 'Based on Google Trends interest over the last 90 days.'
        : 'Live data and AI are limited right now — showing a basic estimate.'),
    generatedAt: new Date().toISOString(),
  };

  cache.set(cacheKey, { at: Date.now(), report });
  return report;
}
