import { notFound } from 'next/navigation';

import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { parseJson } from '@/lib/json';
import { DEFAULT_CANVAS, type CanvasState } from '@/components/Canvas/types';
import { StudioLoader } from '@/components/Canvas/StudioLoader';

export const dynamic = 'force-dynamic';

export default async function EditDesignPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getCurrentUser();
  if (!user) return null;

  const design = await prisma.design.findUnique({ where: { id: params.id } });
  if (!design || design.userId !== user.id) {
    notFound();
  }

  const canvas = parseJson<CanvasState>(design.designData, DEFAULT_CANVAS);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Edit design</h1>
        <p className="text-muted-foreground">{design.name}</p>
      </div>
      <StudioLoader
        initialDesign={{
          id: design.id,
          name: design.name,
          description: design.description,
          category: design.category,
          price: design.price,
          status: design.status,
          designData: canvas,
        }}
      />
    </div>
  );
}
