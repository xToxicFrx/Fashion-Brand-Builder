import OpenAI from 'openai';

/**
 * Lazily-instantiated OpenAI client. Throws a clear error when OPENAI_API_KEY is
 * missing so the rest of the app boots without it. Mirrors lib/claude.ts.
 */
let openaiClient: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      'OpenAI is not configured. Set OPENAI_API_KEY in your environment to enable AI features.',
    );
  }
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
}

export function isOpenAIConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

/**
 * High-quality flagship by default; override with OPENAI_MODEL (e.g. "gpt-4.1").
 * Note: if you switch to an o-series reasoning model, that API uses
 * max_completion_tokens instead of max_tokens — adjust below if you do.
 */
const MODEL = process.env.OPENAI_MODEL || 'gpt-4o';

/** Robustly extract a JSON object from a model text response. */
function extractJson<T>(text: string): T {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1) {
    throw new Error('No JSON object found in OpenAI response.');
  }
  return JSON.parse(candidate.slice(start, end + 1)) as T;
}

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}

export interface TrendAnalysis {
  keyword: string;
  trendScore: number; // 0-100
  predictionStatus: 'trending_up' | 'peak' | 'declining';
  demandLabel: 'low' | 'medium' | 'high';
  suggestedPrice: number; // USD
  related: string[]; // related trending keywords
  rationale: string; // short human-readable explanation
}

/**
 * Ask OpenAI to analyze a fashion niche/keyword and return a structured
 * trend/demand/price assessment. Makes a real API call — requires OPENAI_API_KEY.
 *
 * @throws if OpenAI is not configured or the response cannot be parsed.
 */
export async function analyzeTrendKeyword(
  keyword: string,
): Promise<TrendAnalysis> {
  const client = getOpenAI();

  const system =
    'You are a fashion trend analyst for an independent-designer platform. ' +
    'Assess an apparel niche/keyword and respond with a single strict JSON object only — no prose, no markdown. ' +
    'Schema: {"trendScore": number (0-100), "predictionStatus": "trending_up"|"peak"|"declining", ' +
    '"demandLabel": "low"|"medium"|"high", "suggestedPrice": number (USD retail), ' +
    '"related": string[] (3-5 related trending keywords), "rationale": string (max 240 chars)}.';

  const userPrompt = `Analyze the fashion trend/niche "${keyword}" for an independent apparel designer. Estimate current trend strength (0-100), whether it is rising, peaking, or declining, the demand level, a recommended retail price in USD, related trending keywords, and a brief rationale. Respond with JSON only.`;

  try {
    const completion = await client.chat.completions.create({
      model: MODEL,
      max_tokens: 800,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userPrompt },
      ],
    });

    const text = completion.choices[0]?.message?.content ?? '';
    const parsed = extractJson<Partial<TrendAnalysis>>(text);

    const status = parsed.predictionStatus;
    const demand = parsed.demandLabel;
    return {
      keyword,
      trendScore: clamp(Math.round(Number(parsed.trendScore)), 0, 100),
      predictionStatus:
        status === 'peak' || status === 'declining' ? status : 'trending_up',
      demandLabel: demand === 'low' || demand === 'high' ? demand : 'medium',
      suggestedPrice: clamp(Number(parsed.suggestedPrice), 1, 100000),
      related: Array.isArray(parsed.related)
        ? parsed.related.slice(0, 5).map(String)
        : [],
      rationale:
        typeof parsed.rationale === 'string'
          ? parsed.rationale.slice(0, 280)
          : 'No rationale provided.',
    };
  } catch (error) {
    console.error('[openai] analyzeTrendKeyword failed:', error);
    throw error instanceof Error ? error : new Error('OpenAI request failed.');
  }
}
