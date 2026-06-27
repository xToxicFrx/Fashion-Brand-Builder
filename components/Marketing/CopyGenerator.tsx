'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Sparkles, Copy } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface ListingCopy {
  titles: string[];
  description: string;
  seoTags: string[];
  socialHooks: string[];
}

function CopyButton({ text }: { text: string }) {
  return (
    <button
      onClick={() => {
        navigator.clipboard?.writeText(text).then(
          () => toast.success('Copied'),
          () => toast.error('Could not copy'),
        );
      }}
      className="text-muted-foreground hover:text-foreground"
      aria-label="Copy"
    >
      <Copy className="h-3.5 w-3.5" />
    </button>
  );
}

export function CopyGenerator() {
  const [keyword, setKeyword] = useState('');
  const [productTitle, setProductTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [copy, setCopy] = useState<ListingCopy | null>(null);

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    if (!keyword.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/marketing/copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword,
          productTitle: productTitle || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Could not generate');
      setCopy(json.copy);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not generate');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={generate} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <Input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Niche — e.g. cottagecore"
          maxLength={60}
          aria-label="Niche"
        />
        <Input
          value={productTitle}
          onChange={(e) => setProductTitle(e.target.value)}
          placeholder="Product (optional) — e.g. floral tote"
          maxLength={120}
          aria-label="Product"
        />
        <Button type="submit" disabled={loading} className="shrink-0">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          Generate
        </Button>
      </form>

      {copy && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Title options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {copy.titles.map((t, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
                >
                  <span>{t}</span>
                  <CopyButton text={t} />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                Description <CopyButton text={copy.description} />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{copy.description}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">SEO tags</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-1.5">
              {copy.seoTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Social hooks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {copy.socialHooks.map((h, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
                >
                  <span>{h}</span>
                  <CopyButton text={h} />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
