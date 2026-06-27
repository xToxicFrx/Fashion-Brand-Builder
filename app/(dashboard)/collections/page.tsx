import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { CollectionsManager } from '@/components/Collections/CollectionsManager';

export const dynamic = 'force-dynamic';

export default async function CollectionsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const collections = await prisma.collection.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    include: { items: { orderBy: { sortOrder: 'asc' } } },
  });

  const serialized = collections.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    status: c.status,
    items: c.items.map((i) => ({
      id: i.id,
      title: i.title,
      keyword: i.keyword,
      status: i.status,
    })),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Collections</h1>
        <p className="text-muted-foreground">
          Plan a drop around your trends. Track each piece from idea → designing →
          ready → listed.
        </p>
      </div>
      <CollectionsManager initialCollections={serialized} />
    </div>
  );
}
