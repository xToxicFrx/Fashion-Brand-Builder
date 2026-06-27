'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  Loader2,
  Search,
  TrendingUp,
  Plus,
  Sparkles,
  Palette,
  ArrowUpRight,
  Bookmark,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { TrendChart } from '@/components/Trends/TrendChart';

interface DesignIdea {
  title: string;
  description: string;
  suggestedPrice: number;
  keyElements: string[];
}
interface RegionInterest {
  region: string;
  value: number;
}
interface TrendReport {
  keyword: string;
  dataSource: 'google_trends' | 'ai_estimate';
  trendScore: number;
  momentum: 'trending_up' | 'peak' | 'declining';
  demandLabel: 'low' | 'medium' | 'high';
  suggestedPrice: number;
  timeline: { date: string; value: number }[];
  risingQueries: string[];
  regions: RegionInterest[];
  designIdeas: DesignIdea[];
  audience: string;
  rationale: string;
}
interface ColorSwatch {
  name: string;
  hex: string;
}
interface DesignBrief {
  concept: string;
  palette: ColorSwatch[];
  keyElements: string[];
  typography: string;
  audience: string;
  suggestedPrice: number;
  mockupPrompt: string;
}

const MOMENTUM: Record<
  TrendReport['momentum'],
  { label: string; className: string }
> = {
  trending_up: { label: '↑ Rising', className: 'text-green-600' },
  peak: { label: '◆ Peaking', className: 'text-amber-600' },
  declining: { label: '↓ Cooling', className: 'text-red-600' },
};

function studioHref(idea: DesignIdea, keyword: string) {
  const params = new URLSearchParams({
    name: idea.title,
    brief: `${idea.description} (niche: ${keyword})`,
  });
  return `/studio?${params.toString()}`;
}

function Stat({
  label,
  value,
  className,
  capitalize,
}: {
  label: string;
  value: string;
  className?: string;
  capitalize?: boolean;
}) {
  return (
    <div>
      <p
        className={`text-2xl font-bold ${className ?? ''} ${
          capitalize ? 'capitalize' : ''
        }`}
      >
        {value}
      </p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function BriefView({ brief }: { brief: DesignBrief }) {
  return (
    <div className="space-y-2 rounded-md border bg-muted/30 p-3 text-left">
      <p className="text-xs text-muted-foreground">{brief.concept}</p>
      {brief.palette.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {brief.palette.map((c) => (
            <span key={c.hex + c.name} className="flex items-center gap-1 text-xs">
              <span
                className="h-4 w-4 rounded-full border"
                style={{ backgroundColor: c.hex }}
              />
              {c.name}
            </span>
          ))}
        </div>
      )}
      {brief.typography && (
        <p className="text-xs">
          <span className="font-medium">Type:</span> {brief.typography}
        </p>
      )}
      {brief.mockupPrompt && (
        <p className="text-xs text-muted-foreground">{brief.mockupPrompt}</p>
      )}
    </div>
  );
}

export function TrendRadar({ initialKeyword = '' }: { initialKeyword?: string }) {
  const [keyword, setKeyword] = useState(initialKeyword);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<TrendReport | null>(null);
  const [tracking, setTracking] = useState(false);
  const [tracked, setTracked] = useState(false);
  const [briefs, setBriefs] = useState<Record<number, DesignBrief>>({});
  const [briefLoading, setBriefLoading] = useState<number | null>(null);
  const [saving, setSaving] = useState<number | null>(null);

  async function analyze(e?: React.FormEvent) {
    e?.preventDefault();
    if (!keyword.trim()) return;
    setLoading(true);
    setReport(null);
    setBriefs({});
    setTracked(false);
    try {
      const res = await fetch('/api/trends/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Analysis failed');
      setReport(json.report);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  }

  async function track() {
    if (!report) return;
    setTracking(true);
    try {
      const res = await fetch('/api/niches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: report.keyword }),
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error ?? 'Could not track');
      }
      setTracked(true);
      toast.success(`Tracking “${report.keyword}”`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not track');
    } finally {
      setTracking(false);
    }
  }

  async function makeBrief(idx: number, idea: DesignIdea) {
    if (!report) return;
    setBriefLoading(idx);
    try {
      const res = await fetch('/api/trends/brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ideaTitle: idea.title,
          keyword: report.keyword,
          description: idea.description,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Could not generate brief');
      setBriefs((b) => ({ ...b, [idx]: json.brief }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not generate brief');
    } finally {
      setBriefLoading(null);
    }
  }

  async function saveIdea(idx: number, idea: DesignIdea) {
    if (!report) return;
    setSaving(idx);
    try {
      const res = await fetch('/api/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: report.keyword,
          title: idea.title,
          description: idea.description,
          suggestedPrice: idea.suggestedPrice,
          brief: briefs[idx],
        }),
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error ?? 'Could not save');
      }
      toast.success('Idea saved');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save');
    } finally {
      setSaving(null);
    }
  }

  const m = report ? MOMENTUM[report.momentum] : null;

  return (
    <div className="space-y-6">
      <form onSubmit={analyze} className="flex flex-col gap-3 sm:flex-row">
        <Input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Search a niche — e.g. gorpcore, balletcore, anime tees…"
          maxLength={60}
          aria-label="Niche"
        />
        <Button type="submit" disabled={loading} className="shrink-0">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          Analyze
        </Button>
      </form>

      {report && m && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardDescription className="flex items-center gap-2 text-primary">
                    <TrendingUp className="h-4 w-4" /> Trend report
                  </CardDescription>
                  <CardTitle className="text-2xl">
                    &ldquo;{report.keyword}&rdquo;
                  </CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      report.dataSource === 'google_trends'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {report.dataSource === 'google_trends'
                      ? '● Live Google Trends data'
                      : 'AI estimate'}
                  </span>
                  <Button
                    size="sm"
                    variant={tracked ? 'secondary' : 'default'}
                    onClick={track}
                    disabled={tracking || tracked}
                  >
                    {tracking ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    {tracked ? 'Tracking' : 'Track niche'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Stat label="Trend score" value={`${report.trendScore}/100`} />
                <Stat label="Momentum" value={m.label} className={m.className} />
                <Stat label="Est. demand" value={report.demandLabel} capitalize />
                <Stat
                  label="Suggested price"
                  value={`$${report.suggestedPrice}`}
                />
              </div>
              {report.timeline.length > 1 && (
                <TrendChart
                  data={report.timeline.map((p) => ({
                    label: p.date,
                    value: p.value,
                  }))}
                />
              )}
              {report.rationale && (
                <p className="text-sm text-muted-foreground">{report.rationale}</p>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                {report.risingQueries.length > 0 && (
                  <div>
                    <p className="mb-1 text-sm font-medium">
                      Rising related searches
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {report.risingQueries.map((q) => (
                        <span
                          key={q}
                          className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground"
                        >
                          {q}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {report.regions.length > 0 && (
                  <div>
                    <p className="mb-1 text-sm font-medium">Top regions</p>
                    <div className="flex flex-wrap gap-1.5">
                      {report.regions.map((r) => (
                        <span
                          key={r.region}
                          className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground"
                        >
                          {r.region} · {r.value}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {report.audience && (
                <p className="text-sm">
                  <span className="font-medium">Audience: </span>
                  <span className="text-muted-foreground">{report.audience}</span>
                </p>
              )}
            </CardContent>
          </Card>

          {report.designIdeas.length > 0 && (
            <div className="space-y-3">
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <Sparkles className="h-5 w-5 text-primary" /> What to design
              </h2>
              <div className="grid gap-4 md:grid-cols-3">
                {report.designIdeas.map((idea, idx) => (
                  <Card key={idx} className="flex flex-col">
                    <CardHeader>
                      <CardTitle className="text-base">{idea.title}</CardTitle>
                      <CardDescription>{idea.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="mt-auto space-y-3">
                      <p className="text-sm font-semibold">
                        ${idea.suggestedPrice}
                      </p>
                      {idea.keyElements.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {idea.keyElements.map((k) => (
                            <span
                              key={k}
                              className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                            >
                              {k}
                            </span>
                          ))}
                        </div>
                      )}
                      {briefs[idx] && <BriefView brief={briefs[idx]} />}
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => makeBrief(idx, idea)}
                          disabled={briefLoading === idx}
                        >
                          {briefLoading === idx ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Palette className="h-4 w-4" />
                          )}
                          Brief
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => saveIdea(idx, idea)}
                          disabled={saving === idx}
                        >
                          {saving === idx ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Bookmark className="h-4 w-4" />
                          )}
                          Save
                        </Button>
                        <Button size="sm" variant="ghost" asChild>
                          <Link href={studioHref(idea, report.keyword)}>
                            Studio <ArrowUpRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
