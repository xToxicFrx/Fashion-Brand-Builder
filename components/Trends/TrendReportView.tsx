'use client';

import { TrendingUp, Plus, Sparkles, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { TrendChart } from '@/components/Trends/TrendChart';
import { IdeaCard } from '@/components/Trends/IdeaCard';
import type { TrendReport, Momentum } from '@/lib/trend-types';

const MOMENTUM: Record<Momentum, { label: string; className: string }> = {
  trending_up: { label: '↑ Rising', className: 'text-green-600' },
  peak: { label: '◆ Peaking', className: 'text-amber-600' },
  declining: { label: '↓ Cooling', className: 'text-red-600' },
};

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

/** Presentational view of a trend report — reused live (Trend Radar) and for
 *  saved reports (Library). Pass onTrack to show a "Track niche" button. */
export function TrendReportView({
  report,
  onTrack,
  tracking,
  tracked,
}: {
  report: TrendReport;
  onTrack?: () => void;
  tracking?: boolean;
  tracked?: boolean;
}) {
  const m = MOMENTUM[report.momentum] ?? MOMENTUM.trending_up;

  return (
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
                title={
                  report.dataSource === 'google_trends'
                    ? 'Scored from live Google Trends search interest over the last 90 days.'
                    : 'Estimated by AI from market knowledge — live search data wasn’t available. Track this niche to refine it over time.'
                }
                className={`cursor-help rounded-full px-2 py-0.5 text-xs font-medium ${
                  report.dataSource === 'google_trends'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                {report.dataSource === 'google_trends'
                  ? '● Live Google Trends data'
                  : '✦ AI estimate'}
              </span>
              {onTrack && (
                <Button
                  size="sm"
                  variant={tracked ? 'secondary' : 'default'}
                  onClick={onTrack}
                  disabled={tracking || tracked}
                >
                  {tracking ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  {tracked ? 'Tracking' : 'Track niche'}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat label="Trend score" value={`${report.trendScore}/100`} />
            <Stat label="Momentum" value={m.label} className={m.className} />
            <Stat label="Est. demand" value={report.demandLabel} capitalize />
            <Stat label="Suggested price" value={`$${report.suggestedPrice}`} />
          </div>
          {report.timeline && report.timeline.length > 1 && (
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
            {report.risingQueries && report.risingQueries.length > 0 && (
              <div>
                <p className="mb-1 text-sm font-medium">Rising related searches</p>
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
            {report.regions && report.regions.length > 0 && (
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

      {report.designIdeas && report.designIdeas.length > 0 && (
        <div className="space-y-3">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <Sparkles className="h-5 w-5 text-primary" /> What to design
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {report.designIdeas.map((idea, idx) => (
              <IdeaCard key={idx} idea={idea} keyword={report.keyword} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
