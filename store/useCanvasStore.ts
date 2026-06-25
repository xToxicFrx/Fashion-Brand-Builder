import { create } from 'zustand';

import {
  CanvasElement,
  CanvasState,
  DEFAULT_CANVAS,
} from '@/components/Canvas/types';

const MAX_HISTORY = 50;

interface Snapshot {
  width: number;
  height: number;
  background: string;
  elements: CanvasElement[];
}

interface CanvasStore extends Snapshot {
  selectedId: string | null;
  past: Snapshot[];
  future: Snapshot[];

  /** Replace the entire canvas (used when loading a saved design); clears history. */
  loadState: (state: CanvasState) => void;
  /** Serialize the current canvas to a {@link CanvasState}. */
  toCanvasState: () => CanvasState;

  setSelectedId: (id: string | null) => void;
  setBackground: (color: string) => void;

  addElement: (element: CanvasElement) => void;
  updateElement: (
    id: string,
    patch: Partial<CanvasElement>,
    options?: { history?: boolean },
  ) => void;
  removeElement: (id: string) => void;
  duplicateElement: (id: string) => void;
  bringForward: (id: string) => void;
  sendBackward: (id: string) => void;

  /** Snapshot current state before a continuous gesture (drag/transform). */
  beginChange: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

function snapshot(state: Snapshot): Snapshot {
  return {
    width: state.width,
    height: state.height,
    background: state.background,
    elements: state.elements.map((el) => ({ ...el })),
  };
}

export const useCanvasStore = create<CanvasStore>((set, get) => ({
  ...DEFAULT_CANVAS,
  selectedId: null,
  past: [],
  future: [],

  loadState: (state) =>
    set({
      width: state.width || DEFAULT_CANVAS.width,
      height: state.height || DEFAULT_CANVAS.height,
      background: state.background || DEFAULT_CANVAS.background,
      elements: (state.elements ?? []).map((el) => ({ ...el })),
      selectedId: null,
      past: [],
      future: [],
    }),

  toCanvasState: () => {
    const { width, height, background, elements } = get();
    return { width, height, background, elements: elements.map((e) => ({ ...e })) };
  },

  setSelectedId: (id) => set({ selectedId: id }),

  setBackground: (color) =>
    set((s) => ({
      background: color,
      past: [...s.past, snapshot(s)].slice(-MAX_HISTORY),
      future: [],
    })),

  addElement: (element) =>
    set((s) => ({
      elements: [...s.elements, element],
      selectedId: element.id,
      past: [...s.past, snapshot(s)].slice(-MAX_HISTORY),
      future: [],
    })),

  updateElement: (id, patch, options) =>
    set((s) => {
      const withHistory = options?.history !== false;
      return {
        elements: s.elements.map((el) =>
          el.id === id ? { ...el, ...patch } : el,
        ),
        past: withHistory
          ? [...s.past, snapshot(s)].slice(-MAX_HISTORY)
          : s.past,
        future: withHistory ? [] : s.future,
      };
    }),

  removeElement: (id) =>
    set((s) => ({
      elements: s.elements.filter((el) => el.id !== id),
      selectedId: s.selectedId === id ? null : s.selectedId,
      past: [...s.past, snapshot(s)].slice(-MAX_HISTORY),
      future: [],
    })),

  duplicateElement: (id) =>
    set((s) => {
      const original = s.elements.find((el) => el.id === id);
      if (!original) return s;
      const copy: CanvasElement = {
        ...original,
        id:
          typeof crypto !== 'undefined' && 'randomUUID' in crypto
            ? crypto.randomUUID()
            : `el-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        name: `${original.name} copy`,
        x: original.x + 20,
        y: original.y + 20,
      };
      return {
        elements: [...s.elements, copy],
        selectedId: copy.id,
        past: [...s.past, snapshot(s)].slice(-MAX_HISTORY),
        future: [],
      };
    }),

  bringForward: (id) =>
    set((s) => {
      const index = s.elements.findIndex((el) => el.id === id);
      if (index === -1 || index === s.elements.length - 1) return s;
      const next = [...s.elements];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return {
        elements: next,
        past: [...s.past, snapshot(s)].slice(-MAX_HISTORY),
        future: [],
      };
    }),

  sendBackward: (id) =>
    set((s) => {
      const index = s.elements.findIndex((el) => el.id === id);
      if (index <= 0) return s;
      const next = [...s.elements];
      [next[index], next[index - 1]] = [next[index - 1], next[index]];
      return {
        elements: next,
        past: [...s.past, snapshot(s)].slice(-MAX_HISTORY),
        future: [],
      };
    }),

  beginChange: () =>
    set((s) => ({
      past: [...s.past, snapshot(s)].slice(-MAX_HISTORY),
      future: [],
    })),

  undo: () =>
    set((s) => {
      if (s.past.length === 0) return s;
      const previous = s.past[s.past.length - 1];
      const current = snapshot(s);
      const selectedStillExists = previous.elements.some(
        (el) => el.id === s.selectedId,
      );
      return {
        ...previous,
        selectedId: selectedStillExists ? s.selectedId : null,
        past: s.past.slice(0, -1),
        future: [current, ...s.future].slice(0, MAX_HISTORY),
      };
    }),

  redo: () =>
    set((s) => {
      if (s.future.length === 0) return s;
      const next = s.future[0];
      const current = snapshot(s);
      const selectedStillExists = next.elements.some(
        (el) => el.id === s.selectedId,
      );
      return {
        ...next,
        selectedId: selectedStillExists ? s.selectedId : null,
        past: [...s.past, current].slice(-MAX_HISTORY),
        future: s.future.slice(1),
      };
    }),

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,
}));
