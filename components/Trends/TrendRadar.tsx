'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TrendReportView } from '@/components/Trends/TrendReportView';
import type { TrendReport } from '@/lib/trend-types';

export function TrendRadar({ initialKeyword = '' }: { initialKeyword?: string }) {
  const [keyword, setKeyword] = useState(initialKeyword);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<TrendReport | null>(null);
  const [tracking, setTracking] = useState(false);
  const [tracked, setTracked] = useState(false);

  async function analyze(e?: React.FormEvent) {
    e?.preventDefault();
    if (!keyword.trim()) return;
    setLoading(true);
    setReport(null);
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

      {report && (
        <TrendReportView
          report={report}
          onTrack={track}
          tracking={tracking}
          tracked={tracked}
        />
      )}
    </div>
  );
}
