'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Loader2,
  Telescope,
  Search,
  ArrowRight,
  Bookmark,
  Check,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import type { Opportunity } from '@/lib/opportunity';

const LEVEL_STYLE: Record<string, string> = {
  low: 'bg-rose-100 text-rose-700',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-emerald-100 text-emerald-700',
};

// Low competition is good (green), high competition is bad (red) — invert.
function competitionStyle(level: string): string {
  const mapped = level === 'low' ? 'high' : level === 'high' ? 'low' : 'medium';
  return LEVEL_STYLE[mapped];
}

function scoreColor(score: number): string {
  return score >= 75
    ? 'text-emerald-600'
    : score >= 55
      ? 'text-amber-600'
      : 'text-rose-600';
}

export function OpportunityFinder({
  categoryLabel,
}: {
  categoryLabel: string;
}) {
  const router = useRouter();
  const [items, setItems] = useState<Opportunity[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [seed, setSeed] = useState('');
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set());

  const scan = useCallback(async (seedValue?: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(seedValue ? { seed: seedValue } : {}),
      });
      const json = await res.json();
      if (!res.ok)
        throw new Error(json.error ?? 'Could not load opportunities');
      setItems(json.opportunities ?? []);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Could not load opportunities',
      );
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void scan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function analyze(keyword: string) {
    router.push(`/trends?q=${encodeURIComponent(keyword)}`);
  }

  async function saveIdea(o: Opportunity) {
    setSavingKey(o.keyword);
    try {
      const res = await fetch('/api/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: o.keyword,
          title: o.title,
          description: `${o.angle} Buyer: ${o.audience}`.slice(0, 400),
          suggestedPrice: o.suggestedPrice,
        }),
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error ?? 'Could not save');
      }
      setSavedKeys((prev) => new Set(prev).add(o.keyword));
      toast.success('Saved to your Library — generate a brief or mockup there.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save');
    } finally {
      setSavingKey(null);
    }
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void scan(seed.trim() || undefined);
        }}
        className="flex flex-col gap-3 sm:flex-row"
      >
        <Input
          value={seed}
          onChange={(e) => setSeed(e.target.value)}
          placeholder={`Focus the scan (optional) — a theme within ${categoryLabel}`}
          maxLength={60}
          aria-label="Focus"
        />
        <Button type="submit" disabled={loading} className="shrink-0">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Telescope className="h-4 w-4" />
          )}
          {seed.trim() ? 'Focus scan' : 'Rescan'}
        </Button>
      </form>

      {loading && (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-3 rounded-lg border p-5">
              <div className="h-5 w-2/3 animate-pulse rounded bg-muted" />
              <div className="h-3 w-full animate-pulse rounded bg-muted" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      )}

      {!loading && items && items.length === 0 && (
        <p className="rounded-lg border p-6 text-sm text-muted-foreground">
          No opportunities came back. Try a focus keyword or rescan.
        </p>
      )}

      {!loading && items && items.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((o, idx) => (
            <Card key={`${o.keyword}-${idx}`} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">
                      #{idx + 1}
                    </span>
                    <h3 className="text-base font-bold leading-tight">
                      {o.title}
                    </h3>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-2xl font-bold tabular-nums ${scoreColor(
                        o.score,
                      )}`}
                    >
                      {o.score}
                    </span>
                    <span className="block text-[10px] uppercase tracking-wide text-muted-foreground">
                      opportunity
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-3">
                <p className="text-sm text-muted-foreground">{o.angle}</p>

                <div className="space-y-1.5">
                  {o.signals.map((s) => (
                    <div key={s.label} className="space-y-0.5">
                      <div className="flex justify-between text-[11px] text-muted-foreground">
                        <span>{s.label}</span>
                        <span className="tabular-nums">{s.score}/100</span>
                      </div>
                      <div className="h-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${s.score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span
                    className={`rounded-full px-2 py-0.5 font-medium capitalize ${
                      LEVEL_STYLE[o.demand]
                    }`}
                  >
                    {o.demand} demand
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 font-medium capitalize ${competitionStyle(
                      o.competition,
                    )}`}
                  >
                    {o.competition} competition
                  </span>
                  <span className="rounded-full border px-2 py-0.5 text-muted-foreground">
                    ~${o.suggestedPrice}
                  </span>
                </div>

                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Buyer: </span>
                  {o.audience}
                </p>

                <div className="mt-auto flex gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="flex-1"
                    onClick={() => analyze(o.keyword)}
                  >
                    <Search className="h-4 w-4" /> Analyze
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => saveIdea(o)}
                    disabled={savingKey === o.keyword || savedKeys.has(o.keyword)}
                  >
                    {savingKey === o.keyword ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : savedKeys.has(o.keyword) ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Bookmark className="h-4 w-4" />
                    )}
                    {savedKeys.has(o.keyword) ? 'Saved' : 'Save idea'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
