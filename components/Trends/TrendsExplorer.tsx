'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Search, Sparkles, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { TrendChart, type TrendPoint } from '@/components/Trends/TrendChart';
import { TrendScore } from '@/components/Trends/TrendScore';
import { TrendPrediction } from '@/components/Trends/TrendPrediction';

export interface SerializedTrend {
  id: string;
  keyword: string;
  category: string | null;
  trendScore: number;
  predictionStatus: string;
  googleTrendsData: string | null;
  generatedAt: string;
}

interface Analysis {
  trendScore: number;
  demandPrediction: number;
  suggestedPrice: number;
  predictionStatus: string;
  trends: string[];
  rationale: string;
}

function parseTimeline(trend: SerializedTrend): TrendPoint[] {
  if (!trend.googleTrendsData) return [];
  try {
    const data = JSON.parse(trend.googleTrendsData) as {
      timeline?: Array<{ date?: string; week?: number; value?: number }>;
    };
    return (data.timeline ?? []).map((p, i) => ({
      label: p.date ?? (p.week ? `W${p.week}` : String(i + 1)),
      value: p.value ?? 0,
    }));
  } catch {
    return [];
  }
}

export function TrendsExplorer({
  initialTrends,
}: {
  initialTrends: SerializedTrend[];
}) {
  const [trends, setTrends] = useState(initialTrends);
  const [selectedId, setSelectedId] = useState(initialTrends[0]?.id ?? null);
  const [keyword, setKeyword] = useState('');
  const [searching, setSearching] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);

  const selected =
    trends.find((t) => t.id === selectedId) ?? trends[0] ?? null;

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!keyword.trim()) return;
    setSearching(true);
    setAnalysis(null);
    try {
      const res = await fetch('/api/trends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: keyword.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Trend lookup failed');
      const trend = json.trend as SerializedTrend;
      setTrends((prev) => [trend, ...prev]);
      setSelectedId(trend.id);
      setKeyword('');
      toast.success(`Fetched trend for "${trend.keyword}".`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Trend lookup failed',
      );
    } finally {
      setSearching(false);
    }
  }

  async function handleAnalyze() {
    if (!selected) return;
    setAnalyzing(true);
    try {
      const res = await fetch('/api/trends/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: selected.keyword,
          category: selected.category ?? undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Analysis failed');
      setAnalysis(json.analysis as Analysis);
      toast.success('AI analysis ready.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      {/* Left: search + list */}
      <div className="space-y-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            placeholder="Search a keyword…"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <Button type="submit" size="icon" disabled={searching}>
            {searching ? <Loader2 className="animate-spin" /> : <Search />}
          </Button>
        </form>

        <div className="space-y-2">
          {trends.map((trend) => (
            <button
              key={trend.id}
              type="button"
              onClick={() => {
                setSelectedId(trend.id);
                setAnalysis(null);
              }}
              className={cn(
                'flex w-full items-center justify-between gap-2 rounded-md border px-3 py-2 text-left text-sm',
                selected?.id === trend.id
                  ? 'border-primary bg-accent'
                  : 'hover:bg-muted',
              )}
            >
              <span className="truncate">{trend.keyword}</span>
              <TrendScore score={trend.trendScore} size="sm" />
            </button>
          ))}
          {trends.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No trends yet — search for a keyword above.
            </p>
          )}
        </div>
      </div>

      {/* Right: detail */}
      {selected ? (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="text-xl capitalize">
                  {selected.keyword}
                </CardTitle>
                <div className="mt-2 flex items-center gap-3">
                  <TrendScore score={selected.trendScore} />
                  <TrendPrediction status={selected.predictionStatus} />
                </div>
              </div>
              <Button
                variant="secondary"
                onClick={handleAnalyze}
                disabled={analyzing}
              >
                {analyzing ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Sparkles />
                )}
                Analyze with AI
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <TrendChart data={parseTimeline(selected)} />

            {analysis && (
              <div className="space-y-3 rounded-lg border bg-muted/40 p-4">
                <div className="flex flex-wrap gap-4 text-sm">
                  <span>
                    AI score: <strong>{analysis.trendScore}/100</strong>
                  </span>
                  <span>
                    Est. demand:{' '}
                    <strong>{analysis.demandPrediction} units</strong>
                  </span>
                  <span>
                    Suggested price: <strong>€{analysis.suggestedPrice}</strong>
                  </span>
                </div>
                {analysis.trends.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Related: {analysis.trends.join(', ')}
                  </p>
                )}
                <p className="text-sm">{analysis.rationale}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            Search for a keyword to see trend data.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
