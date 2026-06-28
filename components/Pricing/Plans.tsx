'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Check, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Plan {
  id: string;
  name: string;
  priceLabel: string;
  highlights: string[];
  available: boolean;
}

const FREE = {
  id: 'free',
  name: 'Free',
  priceLabel: '$0',
  highlights: ['25 trend reports/mo', '25 briefs/mo', '10 mockups/mo'],
};

export function Plans({
  plans,
  currentTier,
  billingEnabled,
}: {
  plans: Plan[];
  currentTier: string;
  billingEnabled: boolean;
}) {
  const [loading, setLoading] = useState<string | null>(null);

  async function subscribe(planId: string) {
    setLoading(planId);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Could not start checkout');
      window.location.href = json.url;
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Could not start checkout',
      );
      setLoading(null);
    }
  }

  async function openPortal() {
    setLoading('portal');
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Could not open billing');
      window.location.href = json.url;
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Could not open billing',
      );
      setLoading(null);
    }
  }

  function PlanCard({
    plan,
    cta,
  }: {
    plan: Omit<Plan, 'available'>;
    cta: React.ReactNode;
  }) {
    const current = currentTier === plan.id;
    return (
      <Card className={current ? 'border-primary' : ''}>
        <CardHeader>
          <CardTitle className="flex items-baseline justify-between">
            {plan.name}
            <span className="text-sm font-normal text-muted-foreground">
              {plan.priceLabel}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ul className="space-y-1 text-sm text-muted-foreground">
            {plan.highlights.map((h) => (
              <li key={h} className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                {h}
              </li>
            ))}
          </ul>
          {cta}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
      <PlanCard
        plan={FREE}
        cta={
          <Button variant="outline" disabled className="w-full">
            {currentTier === 'free' ? 'Current plan' : 'Free'}
          </Button>
        }
      />
      {plans.map((p) => {
        const current = currentTier === p.id;
        return (
          <PlanCard
            key={p.id}
            plan={p}
            cta={
              current ? (
                <Button disabled className="w-full">
                  Current plan
                </Button>
              ) : !billingEnabled || !p.available ? (
                <Button variant="outline" disabled className="w-full">
                  Coming soon
                </Button>
              ) : (
                <Button
                  className="w-full"
                  onClick={() => subscribe(p.id)}
                  disabled={loading === p.id}
                >
                  {loading === p.id && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  Upgrade
                </Button>
              )
            }
          />
        );
      })}
      </div>
      {currentTier !== 'free' && billingEnabled && (
        <Button
          variant="outline"
          size="sm"
          onClick={openPortal}
          disabled={loading === 'portal'}
        >
          {loading === 'portal' && <Loader2 className="h-4 w-4 animate-spin" />}
          Manage billing
        </Button>
      )}
    </div>
  );
}
