'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, ShoppingBag } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn, formatCurrency } from '@/lib/utils';

interface ProductPurchaseProps {
  storeSlug: string;
  productId: string;
  sizes: string[];
  prices: Record<string, number>;
}

export function ProductPurchase({
  storeSlug,
  productId,
  sizes,
  prices,
}: ProductPurchaseProps) {
  const [size, setSize] = useState(sizes[0] ?? '');
  const [quantity, setQuantity] = useState(1);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const unitPrice = prices[size] ?? Object.values(prices)[0] ?? 0;

  async function buy() {
    if (!email) {
      toast.error('Enter your email to continue.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeSlug,
          customerEmail: email,
          items: [{ productId, size, quantity }],
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Checkout failed');
      if (json.url) {
        window.location.href = json.url as string;
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Checkout failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <Label className="mb-2 block">Size</Label>
        <div className="flex flex-wrap gap-2">
          {sizes.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSize(s)}
              className={cn(
                'rounded-md border px-4 py-2 text-sm',
                size === s
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'hover:bg-muted',
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="qty">Quantity</Label>
          <Input
            id="qty"
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      </div>

      <Button className="w-full" size="lg" onClick={buy} disabled={loading}>
        {loading ? <Loader2 className="animate-spin" /> : <ShoppingBag />}
        Buy now · {formatCurrency(unitPrice * quantity)}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Secure checkout via Stripe.
      </p>
    </div>
  );
}
