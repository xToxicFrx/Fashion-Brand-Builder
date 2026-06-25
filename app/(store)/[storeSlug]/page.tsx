import { notFound } from 'next/navigation';

import { prisma } from '@/lib/db';
import { parseJson } from '@/lib/json';
import { StoreHeader } from '@/components/Store/StoreHeader';
import { ProductCard } from '@/components/Store/ProductCard';

export const dynamic = 'force-dynamic';

type BrandColors = { primary?: string; secondary?: string; accent?: string };

export default async function StorefrontPage({
  params,
  searchParams,
}: {
  params: { storeSlug: string };
  searchParams: { success?: string; canceled?: string };
}) {
  const store = await prisma.store.findUnique({
    where: { slug: params.storeSlug },
    include: {
      products: {
        where: { isPublished: true },
        include: { design: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!store) notFound();

  const colors = parseJson<BrandColors>(store.brandColors, {});

  return (
    <main className="min-h-screen bg-background">
      <StoreHeader
        name={store.name}
        slug={store.slug}
        description={store.description}
        logoUrl={store.logoUrl}
        colors={colors}
      />

      <div className="mx-auto max-w-6xl px-6 py-10">
        {searchParams.success && (
          <div className="mb-6 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            Payment successful — your order is confirmed. Check your email for
            details.
          </div>
        )}
        {searchParams.canceled && (
          <div className="mb-6 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Checkout canceled. Your cart is still here whenever you&apos;re ready.
          </div>
        )}

        {store.products.length === 0 ? (
          <p className="py-16 text-center text-muted-foreground">
            This store has no products yet.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {store.products.map((product) => {
              const prices = parseJson<Record<string, number>>(
                product.prices,
                {},
              );
              const values = Object.values(prices);
              const minPrice = values.length ? Math.min(...values) : 0;
              return (
                <ProductCard
                  key={product.id}
                  storeSlug={store.slug}
                  productId={product.id}
                  name={product.design.name}
                  image={
                    product.design.mockupImageUrl ??
                    product.design.thumbnailUrl
                  }
                  price={minPrice}
                />
              );
            })}
          </div>
        )}
      </div>

      <footer className="border-t px-6 py-6 text-center text-sm text-muted-foreground">
        Powered by Fashion Brand Builder
      </footer>
    </main>
  );
}
