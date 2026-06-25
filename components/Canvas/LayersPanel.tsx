'use client';

import React from 'react';
import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Type,
  Square,
  Circle as CircleIcon,
  ImageIcon,
  Layers,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { useCanvasStore } from '@/store/useCanvasStore';
import type { ElementType } from '@/components/Canvas/types';

const ICONS: Record<ElementType, React.ComponentType<{ className?: string }>> = {
  text: Type,
  rect: Square,
  circle: CircleIcon,
  image: ImageIcon,
};

export function LayersPanel() {
  const elements = useCanvasStore((s) => s.elements);
  const selectedId = useCanvasStore((s) => s.selectedId);
  const setSelectedId = useCanvasStore((s) => s.setSelectedId);
  const updateElement = useCanvasStore((s) => s.updateElement);

  // Render front-most first (last in array is drawn on top).
  const ordered = [...elements].reverse();

  return (
    <div className="flex w-full flex-col">
      <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
        <Layers className="h-3.5 w-3.5" /> Layers ({elements.length})
      </p>
      {ordered.length === 0 ? (
        <p className="text-sm text-muted-foreground">No layers yet.</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {ordered.map((element) => {
            const Icon = ICONS[element.type];
            const isSelected = element.id === selectedId;
            return (
              <li
                key={element.id}
                className={cn(
                  'flex items-center gap-2 rounded-md border px-2 py-1.5 text-sm',
                  isSelected
                    ? 'border-primary bg-accent'
                    : 'border-transparent hover:bg-muted',
                )}
              >
                <button
                  type="button"
                  className="flex flex-1 items-center gap-2 overflow-hidden text-left"
                  onClick={() => setSelectedId(element.id)}
                >
                  <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">{element.name}</span>
                </button>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() =>
                    updateElement(element.id, { visible: !element.visible })
                  }
                  aria-label={element.visible ? 'Hide layer' : 'Show layer'}
                >
                  {element.visible ? (
                    <Eye className="h-4 w-4" />
                  ) : (
                    <EyeOff className="h-4 w-4" />
                  )}
                </button>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() =>
                    updateElement(element.id, { locked: !element.locked })
                  }
                  aria-label={element.locked ? 'Unlock layer' : 'Lock layer'}
                >
                  {element.locked ? (
                    <Lock className="h-4 w-4" />
                  ) : (
                    <Unlock className="h-4 w-4" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default LayersPanel;
