import { generateOpportunityIdeas, type RawOpportunity } from '@/lib/openai';
import { getCategory, type CategoryId } from '@/lib/categories';
import { prisma } from '@/lib/db';

/** One transparent signal contributing to an opportunity's score. */
export interface OpportunitySignal {
  label: string;
  score: number; // 0-100
  weight: number; // 0-1
}

export interface Opportunity extends RawOpportunity {
  /** 0-100 composite opportunity score. */
  score: number;
  signals: OpportunitySignal[];
}

export interface OpportunityResult {
  category: CategoryId;
  generatedAt: string;
  /** True when served from the durable cache (so the caller can skip metering). */
  cached: boolean;
  opportunities: Opportunity[];
}

const LEVEL = { low: 0, medium: 1, high: 2 } as const;
const clamp100 = (n: number) => Math.min(100, Math.max(0, Math.round(n)));

// 12h durable cache to bound OpenAI cost — an opportunity scan is one broad call.
const CACHE_TTL_MS = 12 * 60 * 60 * 1000;

/**
 * Score a candidate from transparent signals so the user sees *why* it ranks:
 *  - demand: more is better
 *  - low competition: less market saturation is better (inverted)
 *  - margin potential: higher retail price → more room (capped, diminishing)
 */
function scoreOpportunity(o: RawOpportunity): {
  score: number;
  signals: OpportunitySignal[];
} {
  const demand = [30, 65, 95][LEVEL[o.demand]];
  const headroom = [90, 60, 30][LEVEL[o.competition]];
  const margin =
    o.suggestedPrice >= 60
      ? 90
      : o.suggestedPrice >= 30
        ? 72
        : o.suggestedPrice >= 15
          ? 52
          : 35;

  const signals: OpportunitySignal[] = [
    { label: 'Demand', score: demand, weight: 0.45 },
    { label: 'Low competition', score: headroom, weight: 0.35 },
    { label: 'Margin potential', score: margin, weight: 0.2 },
  ];
  const score = clamp100(
    signals.reduce((s, sig) => s + sig.score * sig.weight, 0),
  );
  return { score, signals };
}

async function readCache(key: string): Promise<OpportunityResult | null> {
  try {
    const row = await prisma.reportCache.findUnique({ where: { key } });
    if (!row) return null;
    if (Date.now() - row.updatedAt.getTime() > CACHE_TTL_MS) return null;
    return JSON.parse(row.reportJson) as OpportunityResult;
  } catch {
    return null;
  }
}

async function writeCache(
  key: string,
  result: OpportunityResult,
): Promise<void> {
  try {
    await prisma.reportCache.upsert({
      where: { key },
      update: { reportJson: JSON.stringify(result) },
      create: { key, reportJson: JSON.stringify(result) },
    });
  } catch {
    // best-effort — caching never breaks the request
  }
}

/**
 * Find and rank the best product opportunities for a category. Brainstorms
 * candidates with AI, scores each from transparent signals, sorts best-first,
 * and caches for 12h to bound cost. Throws if AI is unavailable (the route
 * surfaces a friendly error).
 */
export async function findOpportunities(
  category?: string,
  seed?: string,
): Promise<OpportunityResult> {
  const categoryId = getCategory(category).id;
  const cacheKey = `opp|${categoryId}|${(seed ?? '').trim().toLowerCase()}`;

  const cached = await readCache(cacheKey);
  if (cached) return { ...cached, cached: true };

  const raw = await generateOpportunityIdeas({ category: categoryId, seed });
  const opportunities: Opportunity[] = raw
    .map((o) => ({ ...o, ...scoreOpportunity(o) }))
    .sort((a, b) => b.score - a.score);

  const result: OpportunityResult = {
    category: categoryId,
    generatedAt: new Date().toISOString(),
    cached: false,
    opportunities,
  };
  // Only cache a non-empty result so a transient empty parse retries next time.
  if (opportunities.length > 0) await writeCache(cacheKey, result);
  return result;
}
