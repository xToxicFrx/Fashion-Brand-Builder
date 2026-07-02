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
  Palette,
  Loader2,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TrendReportView } from '@/components/Trends/TrendReportView';
import { BriefView } from '@/components/Trends/IdeaCard';
import { downloadImage } from '@/lib/download';
import type { TrendReport, DesignBrief } from '@/lib/trend-types';

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
  brief: DesignBrief | null;
}

const MOMENTUM_LABEL: Record<string, string> = {
  trending_up: '↑ Rising',
  peak: '◆ Peaking',
  declining: '↓ Cooling',
};

/** A saved idea with in-place brief/mockup generation, persisted via PATCH so
 *  the loop (opportunity/idea → brief → mockup) completes inside the Library. */
function IdeaLibraryCard({
  idea,
  onDelete,
}: {
  idea: SavedIdeaItem;
  onDelete: () => void;
}) {
  const [brief, setBrief] = useState<DesignBrief | null>(idea.brief);
  const [briefLoading, setBriefLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(idea.imageUrl);

  async function persist(patch: { brief?: DesignBrief; imageUrl?: string }) {
    try {
      const res = await fetch(`/api/ideas/${idea.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error();
    } catch {
      toast.error('Saved for this session, but storing it failed — retry later.');
    }
  }

  async function makeBrief() {
    setBriefLoading(true);
    try {
      const res = await fetch('/api/trends/brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ideaTitle: idea.title,
          keyword: idea.keyword,
          description: idea.description ?? undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Could not generate brief');
      setBrief(json.brief);
      await persist({ brief: json.brief });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Could not generate brief',
      );
    } finally {
      setBriefLoading(false);
    }
  }

  function handleMockup(url: string) {
    setImageUrl(url);
    // Only persist real stored URLs; an inline data: URL (Storage not
    // configured) is too large for the DB and only used for live preview.
    if (url.startsWith('https://')) void persist({ imageUrl: url });
  }

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{idea.title}</CardTitle>
        <p className="text-xs text-muted-foreground">{idea.keyword}</p>
      </CardHeader>
      <CardContent className="mt-auto space-y-2">
        {imageUrl && (
          <div className="group relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={`${idea.title} mockup`}
              className="aspect-square w-full rounded-md border object-cover"
              loading="lazy"
            />
            <button
              onClick={() =>
                downloadImage(
                  imageUrl,
                  `${idea.title}`.replace(/[^\w.-]+/g, '-').toLowerCase() +
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
        {idea.description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {idea.description}
          </p>
        )}
        {brief && <BriefView brief={brief} onMockup={handleMockup} />}
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">
            {idea.suggestedPrice != null ? `$${idea.suggestedPrice}` : ''}
          </span>
          <div className="flex items-center gap-2">
            {!brief && (
              <Button
                size="sm"
                variant="outline"
                onClick={makeBrief}
                disabled={briefLoading}
              >
                {briefLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Palette className="h-4 w-4" />
                )}
                Brief
              </Button>
            )}
            <button
              onClick={onDelete}
              className="text-muted-foreground hover:text-red-600"
              aria-label="Delete idea"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

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
              <IdeaLibraryCard
                key={i.id}
                idea={i}
                onDelete={() => deleteIdea(i.id)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
