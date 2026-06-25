/**
 * Canvas data model for the Design Studio. A design's `designData` column stores
 * a JSON-encoded {@link CanvasState}; the Konva editor renders {@link CanvasElement}s.
 */

export type ElementType = 'text' | 'rect' | 'circle' | 'image';

export interface CanvasElement {
  id: string;
  type: ElementType;
  name: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  rotation: number;
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  opacity: number;
  visible: boolean;
  locked: boolean;
  // text-only
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontStyle?: string; // 'normal' | 'bold' | 'italic' | 'bold italic'
  align?: string; // 'left' | 'center' | 'right'
  // image-only
  src?: string;
}

export interface CanvasState {
  width: number;
  height: number;
  background: string;
  elements: CanvasElement[];
}

export const FONT_FAMILIES = [
  'Arial',
  'Georgia',
  'Times New Roman',
  'Courier New',
  'Verdana',
  'Impact',
  'Trebuchet MS',
] as const;

export const DEFAULT_CANVAS: CanvasState = {
  width: 500,
  height: 600,
  background: '#ffffff',
  elements: [],
};

/** A starter swatch palette for color pickers. */
export const SWATCHES = [
  '#111827',
  '#ffffff',
  '#ef4444',
  '#f59e0b',
  '#10b981',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#f9fafb',
  '#6b7280',
];
