import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

import { prisma } from '@/lib/db';
import { parseJson } from '@/lib/json';
import { formatCurrency } from '@/lib/utils';
import { StoreHeader } from '@/components/Store/StoreHeader';
import { ProductPurchase } from '@/components/Store/ProductPurchase';

export const dynamic = 'force-dynamic';

type BrandColors = { primary?: string; secondary?: string; accent?: string };

export default async function ProductPage({
  params,
}: {
  params: { storeSlug: string; productId: string };
}) {
  const product = await prisma.product.findUnique({
    where: { id: params.productId },
    include: { design: true, store: true },
  });

  if (
    !product ||
    !product.isPublished ||
    product.store.slug !== params.storeSlug
  ) {
    notFound();
  }

  const sizes = parseJson<string[]>(product.sizes, []);
  const prices = parseJson<Record<string, number>>(product.prices, {});
  const colors = parseJson<BrandColors>(product.store.brandColors, {});
  const values = Object.values(prices);
  const minPrice = values.length ? Math.min(...values) : 0;
  const image = product.design.mockupImageUrl ?? product.design.thumbnailUrl;

  return (
    <main className="min-h-screen bg-background">
      <StoreHeader
        name={product.store.name}
        slug={product.store.slug}
        colors={colors}
      />

      <div className="mx-auto max-w-5xl px-6 py-10">
        <Link
          href={`/${product.store.slug}`}
          className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to store
        </Link>

        <div className="grid gap-10 md:grid-cols-2">
          <div className="flex aspect-square items-center justify-center rounded-lg border bg-muted">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={image}
                alt={product.design.name}
                className="h-full w-full object-contain"
              />
            ) : (
              <span className="text-muted-foreground">No image</span>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold">{product.design.name}</h1>
              <p className="mt-1 text-xl text-muted-foreground">
                from {formatCurrency(minPrice)}
              </p>
            </div>
            {product.design.description && (
              <p className="text-muted-foreground">
                {product.design.description}
              </p>
            )}
            <ProductPurchase
              storeSlug={product.store.slug}
              productId={product.id}
              sizes={sizes.length ? sizes : ['One size']}
              prices={prices}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
