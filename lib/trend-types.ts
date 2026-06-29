// Shared, dependency-free types for the trend UI (safe to import in client
// components — no server-only deps).

export type Momentum = 'trending_up' | 'peak' | 'declining';

export interface RegionInterest {
  region: string;
  value: number;
}

/** One weighted signal contributing to the composite trend score (B2). */
export interface ScoreSignal {
  key: 'interest' | 'momentum' | 'expansion' | 'reach';
  label: string;
  /** This signal's own 0-100 strength. */
  score: number;
  /** Normalized weight across the shown signals (sums to ~1). */
  weight: number;
  /** Short human explanation of what the signal measures / why this value. */
  detail: string;
}

export interface DesignIdea {
  title: string;
  description: string;
  suggestedPrice: number;
  keyElements: string[];
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

export interface TrendReport {
  keyword: string;
  dataSource: 'google_trends' | 'ai_estimate';
  trendScore: number;
  momentum: Momentum;
  demandLabel: 'low' | 'medium' | 'high';
  suggestedPrice: number;
  timeline: { date: string; value: number }[];
  risingQueries: string[];
  regions: RegionInterest[];
  designIdeas: DesignIdea[];
  audience: string;
  rationale: string;
  /** Per-signal breakdown of trendScore (present for live Google Trends data). */
  scoreBreakdown?: ScoreSignal[];
  generatedAt?: string;
}
