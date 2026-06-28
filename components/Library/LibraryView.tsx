'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  ChevronDown,
  ChevronUp,
  Trash2,
  TrendingUp,
  Bookmark,
  Search,
  Download,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { TrendReportView } from '@/components/Trends/TrendReportView';
import { downloadImage } from '@/lib/download';
import type { TrendReport } from '@/lib/trend-types';

interface SavedReportItem {
  id: string;
  keyword: string;
  trendScore: number;
  momentum: string;
  createdAt: string;
  report: TrendReport;
}
interface SavedIdeaItem {
  id: string;
  keyword: string;
  title: string;
  description: string | null;
  suggestedPrice: number | null;
  imageUrl: string | null;
}

const MOMENTUM_LABEL: Record<string, string> = {
  trending_up: '↑ Rising',
  peak: '◆ Peaking',
  declining: '↓ Cooling',
};

export function LibraryView({
  reports,
  ideas,
}: {
  reports: SavedReportItem[];
  ideas: SavedIdeaItem[];
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [ideaList, setIdeaList] = useState(ideas);
  const [query, setQuery] = useState('');

  const filteredIdeas = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ideaList;
    return ideaList.filter((i) =>
      [i.title, i.keyword, i.description ?? '']
        .join(' ')
        .toLowerCase()
        .includes(q),
    );
  }, [ideaList, query]);

  async function deleteIdea(id: string) {
    setIdeaList((list) => list.filter((i) => i.id !== id));
    await fetch(`/api/ideas/${id}`, { method: 'DELETE' }).catch(() => {});
    toast.success('Removed');
  }

  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <TrendingUp className="h-5 w-5 text-primary" /> Saved trend reports
        </h2>
        {reports.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No reports yet — analyze a niche in the Trend Radar and it&apos;s saved
            here automatically.
          </p>
        ) : (
          <div className="space-y-3">
            {reports.map((r) => {
              const open = openId === r.id;
              return (
                <Card key={r.id}>
                  <button
                    onClick={() => setOpenId(open ? null : r.id)}
                    className="flex w-full items-center justify-between gap-3 p-4 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">{r.keyword}</span>
                      <span className="text-sm text-muted-foreground">
                        {r.trendScore}/100 · {MOMENTUM_LABEL[r.momentum] ?? r.momentum}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {new Date(r.createdAt).toLocaleDateString()}
                      {open ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </button>
                  {open && (
                    <div className="border-t p-4">
                      <TrendReportView report={r.report} />
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <Bookmark className="h-5 w-5 text-primary" /> Saved ideas
            {ideaList.length > 0 && (
              <span className="text-sm font-normal text-muted-foreground">
                ({ideaList.length})
              </span>
            )}
          </h2>
          {ideaList.length > 0 && (
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search saved ideas…"
                className="pl-8"
              />
            </div>
          )}
        </div>
        {ideaList.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No saved ideas yet — hit “Save” on any design idea.
          </p>
        ) : filteredIdeas.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No ideas match “{query}”.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredIdeas.map((i) => (
              <Card key={i.id} className="flex flex-col">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{i.title}</CardTitle>
                  <p className="text-xs text-muted-foreground">{i.keyword}</p>
                </CardHeader>
                <CardContent className="mt-auto space-y-2">
                  {i.imageUrl && (
                    <div className="group relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={i.imageUrl}
                        alt={`${i.title} mockup`}
                        className="aspect-square w-full rounded-md border object-cover"
                        loading="lazy"
                      />
                      <button
                        onClick={() =>
                          downloadImage(
                            i.imageUrl as string,
                            `${i.title}`.replace(/[^\w.-]+/g, '-').toLowerCase() +
                              '.png',
                          )
                        }
                        className="absolute right-2 top-2 rounded-md bg-background/80 p-1.5 text-muted-foreground opacity-0 shadow-sm transition-opacity hover:text-foreground group-hover:opacity-100"
                        aria-label="Download mockup"
                        title="Download mockup"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  {i.description && (
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {i.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">
                      {i.suggestedPrice != null ? `$${i.suggestedPrice}` : ''}
                    </span>
                    <button
                      onClick={() => deleteIdea(i.id)}
                      className="text-muted-foreground hover:text-red-600"
                      aria-label="Delete idea"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
