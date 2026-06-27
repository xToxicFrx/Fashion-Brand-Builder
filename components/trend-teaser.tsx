'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Search, TrendingUp, ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { TrendSparkline } from '@/components/trend-sparkline';

interface TrendAnalysis {
  keyword: string;
  trendScore: number;
  predictionStatus: 'trending_up' | 'peak' | 'declining';
  demandLabel: 'low' | 'medium' | 'high';
  suggestedPrice: number;
  related: string[];
  rationale: string;
  dataSource?: 'google_trends' | 'ai_estimate';
  timeline?: { date: string; value: number }[];
}

// Shown when the AI key isn't configured yet, so the page still demos the value.
const STATIC_EXAMPLE: TrendAnalysis = {
  keyword: 'Y2K baby tees',
  trendScore: 87,
  predictionStatus: 'trending_up',
  demandLabel: 'high',
  suggestedPrice: 28,
  related: ['cropped fit', 'baby blue', 'butterfly print', 'low rise'],
  rationale:
    'Strong, sustained search growth driven by nostalgia-led streetwear, with high resale and social engagement.',
  dataSource: 'ai_estimate',
};

const MOMENTUM: Record<
  TrendAnalysis['predictionStatus'],
  { label: string; className: string }
> = {
  trending_up: { label: '↑ Rising', className: 'text-green-600' },
  peak: { label: '◆ Peaking', className: 'text-amber-600' },
  declining: { label: '↓ Cooling', className: 'text-red-600' },
};

function DataSourceBadge({ source }: { source?: TrendAnalysis['dataSource'] }) {
  if (source === 'google_trends') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
        ● Live Google Trends data
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
      AI estimate
    </span>
  );
}

function ResultCard({ a, example }: { a: TrendAnalysis; example?: boolean }) {
  const m = MOMENTUM[a.predictionStatus];
  return (
    <Card className="border-primary/30 text-left">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardDescription className="flex items-center gap-2 text-primary">
            <TrendingUp className="h-4 w-4" />
            {example ? 'Sample trend report' : 'Your trend report'}
          </CardDescription>
          <DataSourceBadge source={a.dataSource} />
        </div>
        <CardTitle className="text-2xl">&ldquo;{a.keyword}&rdquo;</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <div>
            <p className="text-2xl font-bold">
              {a.trendScore}
              <span className="text-sm text-muted-foreground">/100</span>
            </p>
            <p className="text-muted-foreground">Trend score</p>
          </div>
          <div>
            <p className={`text-2xl font-bold ${m.className}`}>{m.label}</p>
            <p className="text-muted-foreground">Momentum</p>
          </div>
          <div>
            <p className="text-2xl font-bold capitalize">{a.demandLabel}</p>
            <p className="text-muted-foreground">Est. demand</p>
          </div>
          <div>
            <p className="text-2xl font-bold">${a.suggestedPrice}</p>
            <p className="text-muted-foreground">Suggested price</p>
          </div>
        </div>
        {a.timeline && a.timeline.length > 1 && (
          <div>
            <TrendSparkline data={a.timeline} className="h-20 w-full" />
            <p className="mt-1 text-center text-xs text-muted-foreground">
              Interest over the last 90 days
            </p>
          </div>
        )}
        {a.related.length > 0 && (
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Related: </span>
            {a.related.join(' · ')}
          </p>
        )}
        {a.rationale && (
          <p className="text-sm text-muted-foreground">{a.rationale}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function TrendTeaser() {
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrendAnalysis | null>(null);
  const [isExample, setIsExample] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!keyword.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/trends/teaser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (res.status === 503) {
          setResult({ ...STATIC_EXAMPLE });
          setIsExample(true);
          toast.message('Showing a sample — live analysis is coming soon.');
          return;
        }
        throw new Error(json.error ?? 'Something went wrong');
      }
      setResult(json.analysis);
      setIsExample(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Something went wrong',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-2xl">
      <form
        onSubmit={handleSubmit}
        className="flex w-full flex-col gap-3 sm:flex-row"
      >
        <Input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Your niche — e.g. anime streetwear, cottagecore…"
          maxLength={60}
          required
          aria-label="Your niche or keyword"
        />
        <Button type="submit" size="lg" disabled={loading} className="shrink-0">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          Analyze my niche
        </Button>
      </form>

      {result && (
        <div className="mt-6 space-y-4">
          <ResultCard a={result} example={isExample} />
          <div className="flex flex-col items-center gap-2 rounded-lg border bg-muted/40 p-5 text-center">
            <p className="font-semibold">
              Want a fresh report like this for your niche every week?
            </p>
            <Button asChild size="lg">
              <a href="#waitlist">
                Get early access <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
