'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Palette, Bookmark, Check, Copy } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { MockupButton } from '@/components/Trends/MockupButton';
import type { DesignIdea, DesignBrief } from '@/lib/trend-types';

/** Compact rendering of a generated design brief (reused by the Library). */
export function BriefView({
  brief,
  onMockup,
}: {
  brief: DesignBrief;
  onMockup?: (url: string) => void;
}) {
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
        <>
          <p className="text-xs text-muted-foreground">{brief.mockupPrompt}</p>
          <MockupButton prompt={brief.mockupPrompt} onGenerated={onMockup} />
        </>
      )}
    </div>
  );
}

export function IdeaCard({
  idea,
  keyword,
}: {
  idea: DesignIdea;
  keyword: string;
}) {
  const [brief, setBrief] = useState<DesignBrief | null>(null);
  const [briefLoading, setBriefLoading] = useState(false);
  const [mockupUrl, setMockupUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  async function copy() {
    const lines = [
      `${idea.title} — $${idea.suggestedPrice} (${keyword})`,
      idea.description,
      idea.keyElements.length
        ? `Key elements: ${idea.keyElements.join(', ')}`
        : '',
    ];
    if (brief) {
      lines.push(
        '',
        `Concept: ${brief.concept}`,
        brief.palette.length
          ? `Palette: ${brief.palette.map((c) => `${c.name} ${c.hex}`).join(', ')}`
          : '',
        brief.typography ? `Typography: ${brief.typography}` : '',
        brief.audience ? `Audience: ${brief.audience}` : '',
        brief.mockupPrompt ? `Mockup prompt: ${brief.mockupPrompt}` : '',
      );
    }
    try {
      await navigator.clipboard.writeText(lines.filter(Boolean).join('\n'));
      setCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Could not copy');
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
          keyword,
          description: idea.description,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Could not generate brief');
      setBrief(json.brief);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not generate brief');
    } finally {
      setBriefLoading(false);
    }
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch('/api/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword,
          title: idea.title,
          description: idea.description,
          suggestedPrice: idea.suggestedPrice,
          brief,
          // Only persist real stored URLs; an inline data: URL (Storage not
          // configured) is too large for the DB and only used for live preview.
          imageUrl:
            mockupUrl && !mockupUrl.startsWith('data:') ? mockupUrl : undefined,
        }),
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error ?? 'Could not save');
      }
      setSaved(true);
      toast.success('Idea saved to your Library');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="text-base">{idea.title}</CardTitle>
        <CardDescription>{idea.description}</CardDescription>
      </CardHeader>
      <CardContent className="mt-auto space-y-3">
        <p className="text-sm font-semibold">${idea.suggestedPrice}</p>
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
        {brief && <BriefView brief={brief} onMockup={setMockupUrl} />}
        <div className="flex flex-wrap gap-2">
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
          <Button
            size="sm"
            variant="ghost"
            onClick={save}
            disabled={saving || saved}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : saved ? (
              <Check className="h-4 w-4" />
            ) : (
              <Bookmark className="h-4 w-4" />
            )}
            {saved ? 'Saved' : 'Save'}
          </Button>
          <Button size="sm" variant="ghost" onClick={copy}>
            {copied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            Copy
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
