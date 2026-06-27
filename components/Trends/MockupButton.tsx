'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Image as ImageIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';

/** Generates an AI concept/mockup image from a prompt and shows it inline. */
export function MockupButton({ prompt }: { prompt: string }) {
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    try {
      const res = await fetch('/api/design/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Could not generate image');
      setUrl(json.url);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Could not generate image',
      );
    } finally {
      setLoading(false);
    }
  }

  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt="AI concept mockup"
        className="mt-2 w-full rounded-md border"
      />
    );
  }

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={generate}
      disabled={loading}
      className="mt-1"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <ImageIcon className="h-4 w-4" />
      )}
      {loading ? 'Generating…' : 'Generate mockup'}
    </Button>
  );
}
