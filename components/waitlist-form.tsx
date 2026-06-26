'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const SELLS_ON_OPTIONS = [
  { value: 'etsy', label: 'Etsy' },
  { value: 'tiktok', label: 'TikTok Shop' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'own_store', label: 'My own store' },
  { value: 'nothing_yet', label: 'Not selling yet' },
];

export function WaitlistForm() {
  const [email, setEmail] = useState('');
  const [sellsOn, setSellsOn] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, sellsOn: sellsOn || undefined }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Something went wrong');
      setDone(true);
      toast.success(
        json.alreadyJoined
          ? "You're already on the list 🎉"
          : "You're on the list 🎉",
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Something went wrong',
      );
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="w-full max-w-md rounded-lg border bg-card p-6 text-center">
        <p className="text-lg font-semibold">You&apos;re on the list! 🎉</p>
        <p className="mt-1 text-sm text-muted-foreground">
          We&apos;ll email you the moment early access opens.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-md flex-col gap-3"
    >
      <Input
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        aria-label="Email address"
      />
      <Select value={sellsOn} onValueChange={setSellsOn}>
        <SelectTrigger aria-label="Where do you sell?">
          <SelectValue placeholder="Where do you sell? (optional)" />
        </SelectTrigger>
        <SelectContent>
          {SELLS_ON_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button type="submit" size="lg" disabled={loading}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Get early access <ArrowRight className="h-4 w-4" />
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        No spam — just a heads-up when it&apos;s ready.
      </p>
    </form>
  );
}
