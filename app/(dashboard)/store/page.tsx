import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { parseJson } from '@/lib/json';
import { StoreManager } from '@/components/Store/StoreManager';

export const dynamic = 'force-dynamic';

export default async function StorePage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [store, designs, products] = await Promise.all([
    prisma.store.findFirst({ where: { userId: user.id } }),
    prisma.design.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, name: true },
    }),
    prisma.product.findMany({
      where: { store: { userId: user.id } },
      include: { design: true },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Store</h1>
        <p className="text-muted-foreground">
          Configure your storefront and turn designs into products.
        </p>
      </div>
      <StoreManager
        store={
          store
            ? {
                id: store.id,
                name: store.name,
                slug: store.slug,
                description: store.description,
                logoUrl: store.logoUrl,
                brandColors: store.brandColors,
              }
            : null
        }
        designs={designs}
        products={products.map((p) => ({
          id: p.id,
          sku: p.sku,
          isPublished: p.isPublished,
          designName: p.design.name,
          sizesCount: parseJson<string[]>(p.sizes, []).length,
        }))}
      />
    </div>
  );
}
