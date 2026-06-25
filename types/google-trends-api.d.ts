/**
 * Minimal type declarations for the unofficial `google-trends-api` package,
 * which ships without TypeScript types. Each method resolves to a JSON string.
 */
declare module 'google-trends-api' {
  interface TrendsOptions {
    keyword?: string | string[];
    startTime?: Date;
    endTime?: Date;
    geo?: string | string[];
    hl?: string;
    timezone?: number;
    category?: number;
    granularTimeResolution?: boolean;
    [key: string]: unknown;
  }

  const googleTrends: {
    interestOverTime(options: TrendsOptions): Promise<string>;
    interestByRegion(options: TrendsOptions): Promise<string>;
    relatedQueries(options: TrendsOptions): Promise<string>;
    relatedTopics(options: TrendsOptions): Promise<string>;
    dailyTrends(options: TrendsOptions): Promise<string>;
    realTimeTrends(options: TrendsOptions): Promise<string>;
    autoComplete(options: TrendsOptions): Promise<string>;
  };

  export default googleTrends;
}
