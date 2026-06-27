'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Plus, X, Check } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const GOAL_OPTIONS = [
  'Find trends early',
  'Sell more',
  'Start a brand',
  'Side income',
  'Grow on TikTok/IG',
];

export function OnboardingWizard() {
  const router = useRouter();
  const [niches, setNiches] = useState<string[]>([]);
  const [nicheInput, setNicheInput] = useState('');
  const [style, setStyle] = useState('');
  const [goals, setGoals] = useState<string[]>([]);
  const [brandName, setBrandName] = useState('');
  const [saving, setSaving] = useState(false);

  function addNiche() {
    const v = nicheInput.trim();
    if (!v || niches.includes(v) || niches.length >= 8) return;
    setNiches((n) => [...n, v]);
    setNicheInput('');
  }

  function toggleGoal(g: string) {
    setGoals((cur) => (cur.includes(g) ? cur.filter((x) => x !== g) : [...cur, g]));
  }

  async function submit() {
    if (niches.length === 0) {
      toast.error('Add at least one niche to track.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niches, style, goals, brandName }),
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error ?? 'Could not save');
      }
      toast.success('All set! Your radar is ready.');
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-8">
      {/* Niches */}
      <section className="space-y-3">
        <div>
          <Label className="text-base">1. What niches do you design for?</Label>
          <p className="text-sm text-muted-foreground">
            We&apos;ll track these and surface what to design next. Add up to 8.
          </p>
        </div>
        <div className="flex gap-2">
          <Input
            value={nicheInput}
            onChange={(e) => setNicheInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addNiche();
              }
            }}
            placeholder="e.g. streetwear, Y2K, cottagecore…"
            maxLength={60}
          />
          <Button type="button" variant="outline" onClick={addNiche}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {niches.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {niches.map((n) => (
              <span
                key={n}
                className="flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-sm"
              >
                {n}
                <button
                  onClick={() => setNiches((x) => x.filter((y) => y !== n))}
                  aria-label={`Remove ${n}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
          </div>
        )}
      </section>

      {/* Style */}
      <section className="space-y-2">
        <Label htmlFor="style" className="text-base">
          2. How would you describe your style? (optional)
        </Label>
        <Input
          id="style"
          value={style}
          onChange={(e) => setStyle(e.target.value)}
          placeholder="e.g. bold, minimalist, vintage, playful"
          maxLength={120}
        />
      </section>

      {/* Goals */}
      <section className="space-y-2">
        <Label className="text-base">3. What&apos;s your main goal?</Label>
        <div className="flex flex-wrap gap-2">
          {GOAL_OPTIONS.map((g) => {
            const active = goals.includes(g);
            return (
              <button
                key={g}
                type="button"
                onClick={() => toggleGoal(g)}
                className={`flex items-center gap-1 rounded-full border px-3 py-1 text-sm transition-colors ${
                  active
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                }`}
              >
                {active && <Check className="h-3.5 w-3.5" />}
                {g}
              </button>
            );
          })}
        </div>
      </section>

      {/* Brand */}
      <section className="space-y-2">
        <Label htmlFor="brand" className="text-base">
          4. Brand name (optional)
        </Label>
        <Input
          id="brand"
          value={brandName}
          onChange={(e) => setBrandName(e.target.value)}
          placeholder="Your brand"
          maxLength={80}
        />
      </section>

      <Button onClick={submit} disabled={saving} size="lg" className="w-full">
        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
        Build my radar
      </Button>
    </div>
  );
}
