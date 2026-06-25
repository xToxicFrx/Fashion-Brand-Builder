'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type Konva from 'konva';
import { toast } from 'sonner';
import { Sparkles, Save, Send, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CanvasEditor } from '@/components/Canvas/CanvasEditor';
import { Toolbar } from '@/components/Canvas/Toolbar';
import { LayersPanel } from '@/components/Canvas/LayersPanel';
import { useCanvasStore } from '@/store/useCanvasStore';
import { DEFAULT_CANVAS, type CanvasState } from '@/components/Canvas/types';
import { DESIGN_CATEGORIES } from '@/lib/validations';
import { slugify } from '@/lib/utils';

export interface DesignStudioProps {
  initialDesign?: {
    id: string;
    name: string;
    description?: string | null;
    category: string;
    price: number;
    status: string;
    designData: CanvasState;
  };
}

export function DesignStudio({ initialDesign }: DesignStudioProps) {
  const router = useRouter();
  const stageRef = useRef<Konva.Stage>(null);

  const loadState = useCanvasStore((s) => s.loadState);
  const selectedId = useCanvasStore((s) => s.selectedId);
  const removeElement = useCanvasStore((s) => s.removeElement);
  const undo = useCanvasStore((s) => s.undo);
  const redo = useCanvasStore((s) => s.redo);

  const [name, setName] = useState(initialDesign?.name ?? 'Untitled design');
  const [category, setCategory] = useState(
    initialDesign?.category ?? 'tshirt',
  );
  const [price, setPrice] = useState(String(initialDesign?.price ?? 29.99));
  const [description, setDescription] = useState(
    initialDesign?.description ?? '',
  );
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  // Initialize the canvas from the loaded design (or a blank canvas) once.
  useEffect(() => {
    loadState(initialDesign?.designData ?? DEFAULT_CANVAS);
  }, [initialDesign, loadState]);

  // Keyboard shortcuts: undo/redo and delete.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      } else if (
        !typing &&
        (e.key === 'Delete' || e.key === 'Backspace') &&
        selectedId
      ) {
        e.preventDefault();
        removeElement(selectedId);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedId, removeElement, undo, redo]);

  async function uploadThumbnail(): Promise<string | undefined> {
    const stage = stageRef.current;
    if (!stage) return undefined;
    try {
      const dataUrl = stage.toDataURL({ pixelRatio: 2 });
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataUrl,
          filename: `${slugify(name) || 'design'}.png`,
        }),
      });
      if (!res.ok) return undefined;
      const json = (await res.json()) as { url: string };
      return json.url;
    } catch (error) {
      console.error('[studio] thumbnail upload failed:', error);
      return undefined;
    }
  }

  async function persist(status: 'draft' | 'published') {
    setSaving(true);
    try {
      const imageUrl = await uploadThumbnail();
      const payload = {
        name,
        description: description || null,
        category,
        price: Number(price) || 0,
        status,
        designData: useCanvasStore.getState().toCanvasState(),
        mockupImageUrl: imageUrl ?? null,
        thumbnailUrl: imageUrl ?? null,
      };

      const res = await fetch(
        initialDesign ? `/api/designs/${initialDesign.id}` : '/api/designs',
        {
          method: initialDesign ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'Failed to save design');
      }

      toast.success(
        status === 'published' ? 'Design published!' : 'Draft saved.',
      );
      router.push('/designs');
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to save design',
      );
    } finally {
      setSaving(false);
    }
  }

  async function runAiSuggestions() {
    setAnalyzing(true);
    try {
      const res = await fetch('/api/ai/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, category, description }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error ?? 'AI analysis failed');
      }
      const s = json.suggestion as {
        trendScore: number;
        demandPrediction: number;
        suggestedPrice: number;
        trends: string[];
      };
      setPrice(String(s.suggestedPrice));
      toast.success(
        `Trend ${s.trendScore}/100 · ~${s.demandPrediction} units · €${s.suggestedPrice}`,
        {
          description: s.trends.length
            ? `Related: ${s.trends.join(', ')}`
            : undefined,
          duration: 8000,
        },
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'AI analysis failed',
      );
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header / metadata */}
      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 p-4">
          <div className="min-w-[200px] flex-1">
            <Label htmlFor="design-name" className="mb-1 block text-xs">
              Name
            </Label>
            <Input
              id="design-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="w-40">
            <Label className="mb-1 block text-xs">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DESIGN_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-28">
            <Label htmlFor="design-price" className="mb-1 block text-xs">
              Price (€)
            </Label>
            <Input
              id="design-price"
              type="number"
              min={0}
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
          <div className="ml-auto flex gap-2">
            <Button
              variant="secondary"
              onClick={runAiSuggestions}
              disabled={analyzing}
            >
              {analyzing ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Sparkles />
              )}
              AI Suggest
            </Button>
            <Button
              variant="outline"
              onClick={() => persist('draft')}
              disabled={saving}
            >
              {saving ? <Loader2 className="animate-spin" /> : <Save />}
              Save Draft
            </Button>
            <Button onClick={() => persist('published')} disabled={saving}>
              {saving ? <Loader2 className="animate-spin" /> : <Send />}
              Publish
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Editor body */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr_240px]">
        <Card className="order-2 lg:order-1">
          <CardContent className="p-4">
            <Toolbar />
          </CardContent>
        </Card>

        <div className="order-1 flex items-start justify-center overflow-auto rounded-lg bg-muted/40 p-6 lg:order-2">
          <CanvasEditor stageRef={stageRef} />
        </div>

        <Card className="order-3">
          <CardContent className="p-4">
            <LayersPanel />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default DesignStudio;
