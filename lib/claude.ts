import Anthropic from '@anthropic-ai/sdk';

/**
 * Lazily-instantiated Anthropic (Claude) client. Throws a clear error when
 * ANTHROPIC_API_KEY is missing so the rest of the app boots without it.
 */
let anthropicClient: Anthropic | null = null;

function getAnthropic(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      'Claude is not configured. Set ANTHROPIC_API_KEY in your environment to enable AI features.',
    );
  }
  if (!anthropicClient) {
    anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return anthropicClient;
}

export function isClaudeConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/** Default to the most capable Claude model; override with CLAUDE_MODEL. */
const MODEL = process.env.CLAUDE_MODEL || 'claude-opus-4-8';

/**
 * Robustly extract a JSON object from a model text response (handles the model
 * wrapping JSON in prose or code fences).
 */
function extractJson<T>(text: string): T {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1) {
    throw new Error('No JSON object found in Claude response.');
  }
  return JSON.parse(candidate.slice(start, end + 1)) as T;
}

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}

export interface DesignSuggestionInput {
  name?: string;
  category?: string;
  description?: string;
  keyword?: string;
}

export interface DesignSuggestion {
  trendScore: number; // 0-100
  demandPrediction: number; // estimated units, 0-1000
  suggestedPrice: number; // EUR
  predictionStatus: 'trending_up' | 'peak' | 'declining';
  trends: string[]; // related trending keywords
  rationale: string; // short human-readable explanation
}

/**
 * Ask Claude to analyze a design concept (or a keyword) and return a structured
 * trend/price/demand assessment. Makes a real API call — requires ANTHROPIC_API_KEY.
 *
 * @throws if Claude is not configured or the response cannot be parsed.
 */
export async function getDesignSuggestions(
  input: DesignSuggestionInput,
): Promise<DesignSuggestion> {
  const client = getAnthropic();

  const subject = input.keyword
    ? `the fashion trend keyword "${input.keyword}"`
    : `a ${input.category ?? 'apparel'} design named "${input.name ?? 'Untitled'}"${
        input.description ? ` described as: ${input.description}` : ''
      }`;

  const system =
    'You are a fashion trend analyst for an independent-designer platform. ' +
    'You assess apparel concepts and trends and respond with a single, strict JSON object only — ' +
    'no prose, no markdown, no code fences. ' +
    'Schema: {"trendScore": number (0-100), "demandPrediction": number (0-1000), ' +
    '"suggestedPrice": number (EUR), "predictionStatus": "trending_up"|"peak"|"declining", ' +
    '"trends": string[] (3-5 related trend keywords), "rationale": string (max 280 chars)}.';

  const userPrompt = `Analyze ${subject}. Estimate its current trend strength, predicted demand in units, a recommended retail price in EUR, whether the trend is rising, peaking, or declining, related trending keywords, and a brief rationale. Respond with JSON only.`;

  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const textBlock = message.content.find((b) => b.type === 'text');
    const text = textBlock && 'text' in textBlock ? textBlock.text : '';
    const parsed = extractJson<Partial<DesignSuggestion>>(text);

    const status = parsed.predictionStatus;
    return {
      trendScore: clamp(Math.round(Number(parsed.trendScore)), 0, 100),
      demandPrediction: clamp(Math.round(Number(parsed.demandPrediction)), 0, 1000),
      suggestedPrice: clamp(Number(parsed.suggestedPrice), 1, 100000),
      predictionStatus:
        status === 'peak' || status === 'declining' ? status : 'trending_up',
      trends: Array.isArray(parsed.trends)
        ? parsed.trends.slice(0, 5).map(String)
        : [],
      rationale:
        typeof parsed.rationale === 'string'
          ? parsed.rationale.slice(0, 280)
          : 'No rationale provided.',
    };
  } catch (error) {
    console.error('[claude] getDesignSuggestions failed:', error);
    throw error instanceof Error
      ? error
      : new Error('Claude request failed.');
  }
}
