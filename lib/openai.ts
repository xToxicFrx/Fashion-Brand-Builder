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

export interface DesignIdea {
  title: string;
  description: string;
  suggestedPrice: number;
  keyElements: string[];
}

export interface TrendInsights {
  trendScore: number; // AI estimate (used only when no real data is available)
  demandLabel: 'low' | 'medium' | 'high';
  suggestedPrice: number;
  audience: string;
  rationale: string;
  related: string[];
  designIdeas: DesignIdea[];
}

/**
 * Interpret a fashion niche with OpenAI. When real Google Trends numbers are
 * provided (hasRealData), they are passed as ground truth so the rationale and
 * ideas are grounded in measured data rather than invented.
 */
export async function generateTrendInsights(params: {
  keyword: string;
  trendScore?: number;
  momentum?: string;
  risingQueries?: string[];
  hasRealData: boolean;
  includeIdeas?: boolean;
}): Promise<TrendInsights> {
  const client = getOpenAI();
  const { keyword, trendScore, momentum, risingQueries, hasRealData, includeIdeas } =
    params;

  const ideasInstruction = includeIdeas
    ? '"designIdeas": array of exactly 3 objects {"title": string, "description": string (max 160 chars), "suggestedPrice": number (USD), "keyElements": string[] (2-4 items)}'
    : '"designIdeas": []';

  const system =
    'You are a fashion trend analyst for an independent-designer platform. ' +
    'Respond with a single strict JSON object only — no prose, no markdown. ' +
    'Schema: {"trendScore": number (0-100), "demandLabel": "low"|"medium"|"high", ' +
    '"suggestedPrice": number (USD retail), "audience": string (max 120 chars), ' +
    '"rationale": string (max 240 chars), "related": string[] (3-6 related keywords), ' +
    ideasInstruction +
    '}.';

  const dataContext = hasRealData
    ? `Use this REAL Google Trends data as ground truth: current interest score ${trendScore}/100, momentum "${momentum}"${
        risingQueries && risingQueries.length
          ? `, rising related searches: ${risingQueries.slice(0, 8).join(', ')}`
          : ''
      }. Base your rationale on these real numbers.`
    : 'No live data is available; estimate from your own knowledge and keep numbers plausible.';

  const userPrompt = `Analyze the fashion niche/keyword "${keyword}" for an independent apparel designer. ${dataContext} Provide demand level, a recommended USD retail price, the core audience, a brief rationale, related keywords${
    includeIdeas
      ? ', and 3 concrete, specific product/design ideas with prices and key visual elements'
      : ''
  }. Respond with JSON only.`;

  try {
    const completion = await client.chat.completions.create({
      model: MODEL,
      max_tokens: includeIdeas ? 1200 : 600,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userPrompt },
      ],
    });

    const text = completion.choices[0]?.message?.content ?? '';
    const parsed = extractJson<Partial<TrendInsights>>(text);
    const demand = parsed.demandLabel;

    return {
      trendScore: clamp(Math.round(Number(parsed.trendScore)), 0, 100),
      demandLabel: demand === 'low' || demand === 'high' ? demand : 'medium',
      suggestedPrice: clamp(Number(parsed.suggestedPrice), 1, 100000),
      audience:
        typeof parsed.audience === 'string'
          ? parsed.audience.slice(0, 160)
          : 'Independent fashion shoppers',
      rationale:
        typeof parsed.rationale === 'string'
          ? parsed.rationale.slice(0, 300)
          : 'No rationale provided.',
      related: Array.isArray(parsed.related)
        ? parsed.related.slice(0, 6).map(String)
        : [],
      designIdeas: Array.isArray(parsed.designIdeas)
        ? parsed.designIdeas.slice(0, 3).map((i) => {
            const idea = (i ?? {}) as Partial<DesignIdea>;
            return {
              title: String(idea.title ?? 'Untitled idea'),
              description: String(idea.description ?? ''),
              suggestedPrice: clamp(Number(idea.suggestedPrice), 1, 100000),
              keyElements: Array.isArray(idea.keyElements)
                ? idea.keyElements.slice(0, 4).map(String)
                : [],
            };
          })
        : [],
    };
  } catch (error) {
    console.error('[openai] generateTrendInsights failed:', error);
    throw error instanceof Error ? error : new Error('OpenAI request failed.');
  }
}

export interface ColorSwatch {
  name: string;
  hex: string;
}

export interface DesignBrief {
  concept: string;
  palette: ColorSwatch[];
  keyElements: string[];
  typography: string;
  audience: string;
  suggestedPrice: number;
  mockupPrompt: string;
}

/** Turn a trend-driven idea into a concrete, actionable design brief. */
export async function generateDesignBrief(params: {
  ideaTitle: string;
  keyword: string;
  description?: string;
}): Promise<DesignBrief> {
  const client = getOpenAI();
  const { ideaTitle, keyword, description } = params;

  const system =
    'You are an apparel design director. Respond with a single strict JSON object only — no prose, no markdown. ' +
    'Schema: {"concept": string (max 280 chars), "palette": array of 3-5 {"name": string, "hex": string (#RRGGBB)}, ' +
    '"keyElements": string[] (3-6), "typography": string (max 80 chars), "audience": string (max 120 chars), ' +
    '"suggestedPrice": number (USD), "mockupPrompt": string (a vivid prompt to generate a product mockup image, max 320 chars)}.';

  const userPrompt = `Create a concrete design brief for the apparel idea "${ideaTitle}" in the "${keyword}" niche${
    description ? ` (${description})` : ''
  }. Make it specific and production-ready. Respond with JSON only.`;

  try {
    const completion = await client.chat.completions.create({
      model: MODEL,
      max_tokens: 900,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userPrompt },
      ],
    });

    const text = completion.choices[0]?.message?.content ?? '';
    const parsed = extractJson<Partial<DesignBrief>>(text);

    return {
      concept:
        typeof parsed.concept === 'string'
          ? parsed.concept.slice(0, 400)
          : 'No concept provided.',
      palette: Array.isArray(parsed.palette)
        ? parsed.palette.slice(0, 6).map((c) => {
            const sw = (c ?? {}) as Partial<ColorSwatch>;
            const hex = String(sw.hex ?? '#000000');
            return {
              name: String(sw.name ?? 'Color'),
              hex: /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : '#888888',
            };
          })
        : [],
      keyElements: Array.isArray(parsed.keyElements)
        ? parsed.keyElements.slice(0, 6).map(String)
        : [],
      typography:
        typeof parsed.typography === 'string'
          ? parsed.typography.slice(0, 120)
          : '',
      audience:
        typeof parsed.audience === 'string'
          ? parsed.audience.slice(0, 160)
          : '',
      suggestedPrice: clamp(Number(parsed.suggestedPrice), 1, 100000),
      mockupPrompt:
        typeof parsed.mockupPrompt === 'string'
          ? parsed.mockupPrompt.slice(0, 400)
          : '',
    };
  } catch (error) {
    console.error('[openai] generateDesignBrief failed:', error);
    throw error instanceof Error ? error : new Error('OpenAI request failed.');
  }
}

export interface ListingCopy {
  titles: string[];
  description: string;
  seoTags: string[];
  socialHooks: string[];
}

/** Generate marketing copy (titles, description, SEO tags, social hooks). */
export async function generateListingCopy(params: {
  keyword: string;
  productTitle?: string;
  description?: string;
}): Promise<ListingCopy> {
  const client = getOpenAI();
  const { keyword, productTitle, description } = params;

  const system =
    'You are a fashion e-commerce copywriter. Respond with a single strict JSON object only — no prose, no markdown. ' +
    'Schema: {"titles": string[] (5 catchy product titles, max 70 chars each), ' +
    '"description": string (a compelling product description, 50-120 words), ' +
    '"seoTags": string[] (8 lowercase SEO/search tags), ' +
    '"socialHooks": string[] (3 short TikTok/Instagram hooks, max 100 chars each)}.';

  const subject = productTitle
    ? `the product "${productTitle}" in the "${keyword}" niche`
    : `a product in the "${keyword}" fashion niche`;
  const userPrompt = `Write marketing copy for ${subject}${
    description ? ` (${description})` : ''
  }. Make it punchy and conversion-focused. Respond with JSON only.`;

  try {
    const completion = await client.chat.completions.create({
      model: MODEL,
      max_tokens: 900,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userPrompt },
      ],
    });
    const text = completion.choices[0]?.message?.content ?? '';
    const parsed = extractJson<Partial<ListingCopy>>(text);
    return {
      titles: Array.isArray(parsed.titles)
        ? parsed.titles.slice(0, 5).map(String)
        : [],
      description:
        typeof parsed.description === 'string' ? parsed.description : '',
      seoTags: Array.isArray(parsed.seoTags)
        ? parsed.seoTags.slice(0, 12).map(String)
        : [],
      socialHooks: Array.isArray(parsed.socialHooks)
        ? parsed.socialHooks.slice(0, 4).map(String)
        : [],
    };
  } catch (error) {
    console.error('[openai] generateListingCopy failed:', error);
    throw error instanceof Error ? error : new Error('OpenAI request failed.');
  }
}

/**
 * Generate an apparel concept/mockup image. Returns a temporary image URL
 * (dall-e-3). Override the model with OPENAI_IMAGE_MODEL.
 */
export async function generateConceptImage(prompt: string): Promise<string> {
  const client = getOpenAI();
  const model = process.env.OPENAI_IMAGE_MODEL || 'dall-e-3';
  const fullPrompt =
    `Apparel product mockup, e-commerce catalog style, clean studio background, photorealistic. ${prompt}`.slice(
      0,
      1000,
    );
  try {
    const result = await client.images.generate({
      model,
      prompt: fullPrompt,
      size: '1024x1024',
      n: 1,
    });
    const url = result.data?.[0]?.url;
    if (!url) throw new Error('No image was returned.');
    return url;
  } catch (error) {
    console.error('[openai] generateConceptImage failed:', error);
    throw error instanceof Error ? error : new Error('Image generation failed.');
  }
}
