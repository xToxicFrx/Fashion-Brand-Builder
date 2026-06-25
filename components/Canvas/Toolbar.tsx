'use client';

import React, { useRef } from 'react';
import {
  Type,
  Square,
  Circle as CircleIcon,
  ImageIcon,
  Undo2,
  Redo2,
  Copy,
  Trash2,
  ArrowUp,
  ArrowDown,
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCanvasStore } from '@/store/useCanvasStore';
import {
  CanvasElement,
  ElementType,
  FONT_FAMILIES,
  SWATCHES,
} from '@/components/Canvas/types';

function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `el-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function Toolbar() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const width = useCanvasStore((s) => s.width);
  const height = useCanvasStore((s) => s.height);
  const background = useCanvasStore((s) => s.background);
  const setBackground = useCanvasStore((s) => s.setBackground);
  const elements = useCanvasStore((s) => s.elements);
  const selectedId = useCanvasStore((s) => s.selectedId);
  const addElement = useCanvasStore((s) => s.addElement);
  const updateElement = useCanvasStore((s) => s.updateElement);
  const removeElement = useCanvasStore((s) => s.removeElement);
  const duplicateElement = useCanvasStore((s) => s.duplicateElement);
  const bringForward = useCanvasStore((s) => s.bringForward);
  const sendBackward = useCanvasStore((s) => s.sendBackward);
  const beginChange = useCanvasStore((s) => s.beginChange);
  const undo = useCanvasStore((s) => s.undo);
  const redo = useCanvasStore((s) => s.redo);
  const past = useCanvasStore((s) => s.past);
  const future = useCanvasStore((s) => s.future);

  const selected = elements.find((el) => el.id === selectedId) ?? null;

  const addShape = (type: ElementType) => {
    const base = {
      id: newId(),
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
    };
    let element: CanvasElement;
    if (type === 'text') {
      element = {
        ...base,
        type: 'text',
        name: 'Text',
        x: width / 2 - 120,
        y: height / 2 - 20,
        width: 240,
        text: 'Your text',
        fontSize: 36,
        fontFamily: 'Arial',
        fontStyle: 'bold',
        align: 'center',
        fill: '#111827',
      };
    } else if (type === 'rect') {
      element = {
        ...base,
        type: 'rect',
        name: 'Rectangle',
        x: width / 2 - 75,
        y: height / 2 - 75,
        width: 150,
        height: 150,
        fill: '#3b82f6',
      };
    } else {
      element = {
        ...base,
        type: 'circle',
        name: 'Circle',
        x: width / 2,
        y: height / 2,
        radius: 70,
        fill: '#f59e0b',
      };
    }
    addElement(element);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      const img = new window.Image();
      img.onload = () => {
        const maxDim = 240;
        const ratio = Math.min(maxDim / img.width, maxDim / img.height, 1);
        addElement({
          id: newId(),
          type: 'image',
          name: file.name.slice(0, 24) || 'Image',
          x: width / 2 - (img.width * ratio) / 2,
          y: height / 2 - (img.height * ratio) / 2,
          width: img.width * ratio,
          height: img.height * ratio,
          rotation: 0,
          opacity: 1,
          visible: true,
          locked: false,
          fill: '#000000',
          src,
        });
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="flex w-full flex-col gap-4">
      {/* Add elements */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
          Add
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" onClick={() => addShape('text')}>
            <Type /> Text
          </Button>
          <Button variant="outline" size="sm" onClick={() => addShape('rect')}>
            <Square /> Rect
          </Button>
          <Button variant="outline" size="sm" onClick={() => addShape('circle')}>
            <CircleIcon /> Circle
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImageIcon /> Image
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
        </div>
      </div>

      {/* History */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          disabled={past.length === 0}
          onClick={undo}
        >
          <Undo2 /> Undo
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          disabled={future.length === 0}
          onClick={redo}
        >
          <Redo2 /> Redo
        </Button>
      </div>

      <Separator />

      {/* Canvas background */}
      <div>
        <Label className="mb-2 block text-xs uppercase text-muted-foreground">
          Canvas background
        </Label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={background}
            onChange={(e) => setBackground(e.target.value)}
            className="h-9 w-9 cursor-pointer rounded border"
            aria-label="Canvas background color"
          />
          <Input
            value={background}
            onChange={(e) => setBackground(e.target.value)}
            className="h-9"
          />
        </div>
      </div>

      <Separator />

      {/* Selected element inspector */}
      {selected ? (
        <div className="flex flex-col gap-4">
          <p className="text-xs font-semibold uppercase text-muted-foreground">
            {selected.type} properties
          </p>

          {selected.type !== 'image' && (
            <div>
              <Label className="mb-2 block text-xs">Fill</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={selected.fill}
                  onChange={(e) =>
                    updateElement(selected.id, { fill: e.target.value })
                  }
                  className="h-9 w-9 cursor-pointer rounded border"
                  aria-label="Fill color"
                />
                <Input
                  value={selected.fill}
                  onChange={(e) =>
                    updateElement(selected.id, { fill: e.target.value })
                  }
                  className="h-9"
                />
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {SWATCHES.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => updateElement(selected.id, { fill: color })}
                    className="h-6 w-6 rounded border"
                    style={{ backgroundColor: color }}
                    aria-label={`Set fill ${color}`}
                  />
                ))}
              </div>
            </div>
          )}

          {selected.type === 'text' && (
            <>
              <div>
                <Label className="mb-2 block text-xs">Text</Label>
                <Input
                  value={selected.text ?? ''}
                  onChange={(e) =>
                    updateElement(selected.id, { text: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="mb-2 block text-xs">Font size</Label>
                  <Input
                    type="number"
                    min={6}
                    value={Math.round(selected.fontSize ?? 28)}
                    onChange={(e) =>
                      updateElement(selected.id, {
                        fontSize: Number(e.target.value) || 6,
                      })
                    }
                  />
                </div>
                <div>
                  <Label className="mb-2 block text-xs">Font</Label>
                  <Select
                    value={selected.fontFamily ?? 'Arial'}
                    onValueChange={(value) =>
                      updateElement(selected.id, { fontFamily: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FONT_FAMILIES.map((font) => (
                        <SelectItem key={font} value={font}>
                          {font}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={
                    (selected.fontStyle ?? '').includes('bold')
                      ? 'default'
                      : 'outline'
                  }
                  size="icon"
                  onClick={() => {
                    const isBold = (selected.fontStyle ?? '').includes('bold');
                    const isItalic = (selected.fontStyle ?? '').includes(
                      'italic',
                    );
                    const next = [
                      !isBold ? 'bold' : '',
                      isItalic ? 'italic' : '',
                    ]
                      .filter(Boolean)
                      .join(' ');
                    updateElement(selected.id, {
                      fontStyle: next || 'normal',
                    });
                  }}
                  aria-label="Toggle bold"
                >
                  <Bold />
                </Button>
                <Button
                  type="button"
                  variant={
                    (selected.fontStyle ?? '').includes('italic')
                      ? 'default'
                      : 'outline'
                  }
                  size="icon"
                  onClick={() => {
                    const isBold = (selected.fontStyle ?? '').includes('bold');
                    const isItalic = (selected.fontStyle ?? '').includes(
                      'italic',
                    );
                    const next = [
                      isBold ? 'bold' : '',
                      !isItalic ? 'italic' : '',
                    ]
                      .filter(Boolean)
                      .join(' ');
                    updateElement(selected.id, {
                      fontStyle: next || 'normal',
                    });
                  }}
                  aria-label="Toggle italic"
                >
                  <Italic />
                </Button>
                {(['left', 'center', 'right'] as const).map((align) => {
                  const Icon =
                    align === 'left'
                      ? AlignLeft
                      : align === 'center'
                        ? AlignCenter
                        : AlignRight;
                  return (
                    <Button
                      key={align}
                      type="button"
                      variant={
                        (selected.align ?? 'left') === align
                          ? 'default'
                          : 'outline'
                      }
                      size="icon"
                      onClick={() => updateElement(selected.id, { align })}
                      aria-label={`Align ${align}`}
                    >
                      <Icon />
                    </Button>
                  );
                })}
              </div>
            </>
          )}

          <div>
            <Label className="mb-2 block text-xs">
              Opacity ({Math.round(selected.opacity * 100)}%)
            </Label>
            <Slider
              value={[Math.round(selected.opacity * 100)]}
              min={0}
              max={100}
              step={1}
              onPointerDown={() => beginChange()}
              onValueChange={([value]) =>
                updateElement(
                  selected.id,
                  { opacity: value / 100 },
                  { history: false },
                )
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => bringForward(selected.id)}
            >
              <ArrowUp /> Forward
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => sendBackward(selected.id)}
            >
              <ArrowDown /> Back
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => duplicateElement(selected.id)}
            >
              <Copy /> Duplicate
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => removeElement(selected.id)}
            >
              <Trash2 /> Delete
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Select an element on the canvas to edit its properties, or add a new
          one above.
        </p>
      )}
    </div>
  );
}

export default Toolbar;
