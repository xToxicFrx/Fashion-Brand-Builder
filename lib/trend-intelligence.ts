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
import { prisma } from '@/lib/db';
import { stringifyJson } from '@/lib/json';

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

// Two-layer cache to bound external/AI calls:
//  - in-memory: fastest, but per serverless instance and lost on cold starts.
//  - durable (ReportCache table): cross-user, survives cold starts, cuts cost.
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6h (in-memory)
const DURABLE_TTL_MS = 24 * 60 * 60 * 1000; // 24h (DB)
const cache = new Map<string, { at: number; report: TrendReport }>();

/** Read a fresh report from the durable cache, or null. Never throws. */
async function readDurableCache(key: string): Promise<TrendReport | null> {
  try {
    const row = await prisma.reportCache.findUnique({ where: { key } });
    if (!row) return null;
    if (Date.now() - row.updatedAt.getTime() > DURABLE_TTL_MS) return null;
    return JSON.parse(row.reportJson) as TrendReport;
  } catch {
    return null;
  }
}

/** Upsert a report into the durable cache. Best-effort; never throws. */
async function writeDurableCache(
  key: string,
  report: TrendReport,
): Promise<void> {
  try {
    const reportJson = JSON.stringify(report);
    await prisma.reportCache.upsert({
      where: { key },
      update: { reportJson },
      create: { key, reportJson },
    });
  } catch {
    // ignore — caching is best-effort
  }
}

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

  // Durable cache (survives cold starts, shared across users).
  const cached = await readDurableCache(cacheKey);
  if (cached) {
    cache.set(cacheKey, { at: Date.now(), report: cached });
    return cached;
  }

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

  // Don't cache a degraded fallback (no AI insights and no real data) so a
  // transient OpenAI/Trends outage retries next time instead of sticking.
  const degraded = !insights && dataSource !== 'google_trends';
  if (!degraded) {
    cache.set(cacheKey, { at: Date.now(), report });
    await writeDurableCache(cacheKey, report);
  }
  return report;
}

/**
 * Persist a generated report's history artifacts: a TrendSnapshot (powers
 * sparklines/deltas) and the per-user SavedReport (instant re-open in the
 * Library and on the dashboard). Best-effort — never throws, so callers can run
 * it without guarding the request it accompanies.
 */
export async function persistReportArtifacts(
  userId: string,
  report: TrendReport,
): Promise<void> {
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
    console.error('[trend-intelligence] snapshot failed', e);
  }
  try {
    await prisma.savedReport.upsert({
      where: { userId_keyword: { userId, keyword: report.keyword } },
      update: {
        trendScore: report.trendScore,
        momentum: report.momentum,
        dataSource: report.dataSource,
        reportJson: stringifyJson(report),
      },
      create: {
        userId,
        keyword: report.keyword,
        trendScore: report.trendScore,
        momentum: report.momentum,
        dataSource: report.dataSource,
        reportJson: stringifyJson(report),
      },
    });
  } catch (e) {
    console.error('[trend-intelligence] saveReport failed', e);
  }
}
