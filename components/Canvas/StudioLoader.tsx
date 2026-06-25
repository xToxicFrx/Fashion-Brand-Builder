'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

import type { DesignStudioProps } from '@/components/Canvas/DesignStudio';

// Konva touches `window`, so the editor must only render on the client.
const DesignStudio = dynamic(
  () => import('@/components/Canvas/DesignStudio').then((m) => m.DesignStudio),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    ),
  },
);

export function StudioLoader(props: DesignStudioProps) {
  return <DesignStudio {...props} />;
}
