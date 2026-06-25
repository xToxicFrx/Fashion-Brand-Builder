import Link from 'next/link';
import { Pencil, Plus } from 'lucide-react';

import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { DeleteDesignButton } from '@/components/designs/DeleteDesignButton';

export const dynamic = 'force-dynamic';

export default async function DesignsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const designs = await prisma.design.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: 'desc' },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Designs</h1>
          <p className="text-muted-foreground">{designs.length} design(s)</p>
        </div>
        <Button asChild>
          <Link href="/studio">
            <Plus className="h-4 w-4" /> New design
          </Link>
        </Button>
      </div>

      {designs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <p className="text-muted-foreground">
              You haven&apos;t created any designs yet.
            </p>
            <Button asChild>
              <Link href="/studio">Open the Design Studio</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {designs.map((design) => (
            <Card key={design.id} className="overflow-hidden">
              <div className="flex aspect-square items-center justify-center bg-muted">
                {design.thumbnailUrl || design.mockupImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={design.thumbnailUrl ?? design.mockupImageUrl ?? ''}
                    alt={design.name}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <span className="text-sm text-muted-foreground">
                    No preview
                  </span>
                )}
              </div>
              <CardContent className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{design.name}</p>
                    <p className="text-xs capitalize text-muted-foreground">
                      {design.category} · {formatCurrency(design.price)}
                    </p>
                  </div>
                  <Badge
                    variant={
                      design.status === 'published' ? 'success' : 'secondary'
                    }
                    className="capitalize"
                  >
                    {design.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">
                    Trend {design.trendScore ?? '—'}
                  </span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" asChild>
                      <Link
                        href={`/studio/${design.id}`}
                        aria-label="Edit design"
                      >
                        <Pencil />
                      </Link>
                    </Button>
                    <DeleteDesignButton id={design.id} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
