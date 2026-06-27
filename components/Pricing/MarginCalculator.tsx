'use client';

import { useState } from 'react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

function num(v: string): number {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function MarginCalculator() {
  const [cost, setCost] = useState('12');
  const [price, setPrice] = useState('32');
  const [fixed, setFixed] = useState('0');
  const [targetMargin, setTargetMargin] = useState('60');

  const c = num(cost);
  const p = num(price);
  const f = num(fixed);
  const tm = Math.min(95, Math.max(0, num(targetMargin)));

  const profit = p - c;
  const margin = p > 0 ? (profit / p) * 100 : 0;
  const markup = c > 0 ? (profit / c) * 100 : 0;
  const breakEvenUnits = profit > 0 ? Math.ceil(f / profit) : 0;
  // Price needed to hit the target margin: price = cost / (1 - margin)
  const recommendedPrice = tm < 100 ? c / (1 - tm / 100) : 0;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your numbers</CardTitle>
          <CardDescription>
            Enter your unit cost and price to see the real margin.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cost">Unit cost ($)</Label>
            <Input
              id="cost"
              type="number"
              inputMode="decimal"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="price">Selling price ($)</Label>
            <Input
              id="price"
              type="number"
              inputMode="decimal"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fixed">Monthly fixed costs ($, optional)</Label>
            <Input
              id="fixed"
              type="number"
              inputMode="decimal"
              value={fixed}
              onChange={(e) => setFixed(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tm">Target margin (%)</Label>
            <Input
              id="tm"
              type="number"
              inputMode="decimal"
              value={targetMargin}
              onChange={(e) => setTargetMargin(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4 self-start">
        <Metric label="Profit / unit" value={`$${profit.toFixed(2)}`} />
        <Metric label="Margin" value={`${margin.toFixed(0)}%`} />
        <Metric label="Markup" value={`${markup.toFixed(0)}%`} />
        <Metric
          label="Break-even"
          value={breakEvenUnits > 0 ? `${breakEvenUnits} units` : '—'}
          hint={f > 0 ? 'to cover fixed costs' : 'set fixed costs'}
        />
        <Metric
          label={`Price for ${tm.toFixed(0)}% margin`}
          value={recommendedPrice > 0 ? `$${recommendedPrice.toFixed(2)}` : '—'}
          hint="at your current cost"
        />
      </div>
    </div>
  );
}
