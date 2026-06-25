'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Loader2, Trash2, ExternalLink } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

interface SerializedStore {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  brandColors: string | null;
}

interface SerializedProduct {
  id: string;
  sku: string;
  isPublished: boolean;
  designName: string;
  sizesCount: number;
}

export function StoreManager({
  store,
  designs,
  products,
}: {
  store: SerializedStore | null;
  designs: Array<{ id: string; name: string }>;
  products: SerializedProduct[];
}) {
  const router = useRouter();

  const brand = store?.brandColors
    ? (JSON.parse(store.brandColors) as {
        primary?: string;
        secondary?: string;
        accent?: string;
      })
    : {};

  const [name, setName] = useState(store?.name ?? '');
  const [description, setDescription] = useState(store?.description ?? '');
  const [logoUrl, setLogoUrl] = useState(store?.logoUrl ?? '');
  const [primary, setPrimary] = useState(brand.primary ?? '#111827');
  const [secondary, setSecondary] = useState(brand.secondary ?? '#6b7280');
  const [accent, setAccent] = useState(brand.accent ?? '#f59e0b');
  const [savingStore, setSavingStore] = useState(false);

  const [designId, setDesignId] = useState(designs[0]?.id ?? '');
  const [selectedSizes, setSelectedSizes] = useState<string[]>([
    'S',
    'M',
    'L',
    'XL',
  ]);
  const [price, setPrice] = useState('32');
  const [inventory, setInventory] = useState('25');
  const [creating, setCreating] = useState(false);

  async function saveStore(e: React.FormEvent) {
    e.preventDefault();
    setSavingStore(true);
    try {
      const res = await fetch('/api/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description: description || null,
          logoUrl: logoUrl || null,
          brandColors: { primary, secondary, accent },
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed to save store');
      toast.success('Store saved.');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save');
    } finally {
      setSavingStore(false);
    }
  }

  function toggleSize(size: string) {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size],
    );
  }

  async function createProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!designId) {
      toast.error('Select a design first.');
      return;
    }
    if (selectedSizes.length === 0) {
      toast.error('Select at least one size.');
      return;
    }
    setCreating(true);
    try {
      const prices: Record<string, number> = {};
      const inv: Record<string, number> = {};
      for (const size of selectedSizes) {
        prices[size] = Number(price) || 0;
        inv[size] = Number(inventory) || 0;
      }
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          designId,
          sizes: selectedSizes,
          prices,
          inventory: inv,
          isPublished: true,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed to create product');
      toast.success('Product created.');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create');
    } finally {
      setCreating(false);
    }
  }

  async function togglePublish(product: SerializedProduct) {
    const res = await fetch(`/api/products/${product.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublished: !product.isPublished }),
    });
    if (res.ok) {
      toast.success(product.isPublished ? 'Unpublished.' : 'Published.');
      router.refresh();
    } else {
      toast.error('Failed to update product.');
    }
  }

  async function deleteProduct(id: string) {
    if (!window.confirm('Delete this product?')) return;
    const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('Product deleted.');
      router.refresh();
    } else {
      toast.error('Failed to delete product.');
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Store settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Store settings</CardTitle>
          <CardDescription>
            {store ? (
              <span className="inline-flex items-center gap-1">
                Public page:{' '}
                <Link
                  href={`/${store.slug}`}
                  className="inline-flex items-center gap-1 underline"
                  target="_blank"
                >
                  /{store.slug} <ExternalLink className="h-3 w-3" />
                </Link>
              </span>
            ) : (
              'Set up your storefront.'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveStore} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="store-name">Name</Label>
              <Input
                id="store-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="store-desc">Description</Label>
              <Textarea
                id="store-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="store-logo">Logo URL</Label>
              <Input
                id="store-logo"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://…"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Primary', value: primary, set: setPrimary },
                { label: 'Secondary', value: secondary, set: setSecondary },
                { label: 'Accent', value: accent, set: setAccent },
              ].map((c) => (
                <div key={c.label} className="space-y-1">
                  <Label className="text-xs">{c.label}</Label>
                  <input
                    type="color"
                    value={c.value}
                    onChange={(e) => c.set(e.target.value)}
                    className="h-9 w-full cursor-pointer rounded border"
                  />
                </div>
              ))}
            </div>
            <Button type="submit" disabled={savingStore}>
              {savingStore && <Loader2 className="animate-spin" />} Save store
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Products */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Add product from design</CardTitle>
            <CardDescription>
              Generate a sellable product from one of your designs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {designs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Create a design first in the{' '}
                <Link href="/studio" className="underline">
                  Design Studio
                </Link>
                .
              </p>
            ) : (
              <form onSubmit={createProduct} className="space-y-4">
                <div className="space-y-2">
                  <Label>Design</Label>
                  <Select value={designId} onValueChange={setDesignId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a design" />
                    </SelectTrigger>
                    <SelectContent>
                      {designs.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="mb-2 block">Sizes</Label>
                  <div className="flex flex-wrap gap-2">
                    {SIZES.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => toggleSize(size)}
                        className={cn(
                          'rounded-md border px-3 py-1 text-sm',
                          selectedSizes.includes(size)
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'hover:bg-muted',
                        )}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="p-price">Price (€)</Label>
                    <Input
                      id="p-price"
                      type="number"
                      min={0}
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="p-inv">Inventory / size</Label>
                    <Input
                      id="p-inv"
                      type="number"
                      min={0}
                      value={inventory}
                      onChange={(e) => setInventory(e.target.value)}
                    />
                  </div>
                </div>
                <Button type="submit" disabled={creating}>
                  {creating && <Loader2 className="animate-spin" />} Create
                  product
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Products ({products.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {products.length === 0 ? (
              <p className="text-sm text-muted-foreground">No products yet.</p>
            ) : (
              products.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between gap-2 rounded-md border p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{product.designName}</p>
                    <p className="text-xs text-muted-foreground">
                      {product.sku} · {product.sizesCount} sizes
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={product.isPublished ? 'success' : 'secondary'}
                    >
                      {product.isPublished ? 'Live' : 'Hidden'}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => togglePublish(product)}
                    >
                      {product.isPublished ? 'Unpublish' : 'Publish'}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => deleteProduct(product.id)}
                      aria-label="Delete product"
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
