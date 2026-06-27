// Shared, dependency-free types for the trend UI (safe to import in client
// components — no server-only deps).

export type Momentum = 'trending_up' | 'peak' | 'declining';

export interface RegionInterest {
  region: string;
  value: number;
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
  generatedAt?: string;
}
