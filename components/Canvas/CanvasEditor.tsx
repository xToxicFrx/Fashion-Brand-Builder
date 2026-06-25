'use client';

import React, { useEffect, useRef } from 'react';
import Konva from 'konva';
import {
  Stage,
  Layer,
  Rect,
  Circle,
  Text,
  Image as KonvaImage,
  Transformer,
} from 'react-konva';

import { useCanvasStore } from '@/store/useCanvasStore';
import type { CanvasElement } from '@/components/Canvas/types';

interface CanvasEditorProps {
  stageRef: React.RefObject<Konva.Stage>;
}

/**
 * Loads an HTMLImageElement for a Konva image node (react-konva needs a loaded
 * image instance, not a URL).
 */
function useHtmlImage(src?: string): HTMLImageElement | undefined {
  const [image, setImage] = React.useState<HTMLImageElement>();
  useEffect(() => {
    if (!src) {
      setImage(undefined);
      return;
    }
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.src = src;
    const handleLoad = () => setImage(img);
    img.addEventListener('load', handleLoad);
    return () => img.removeEventListener('load', handleLoad);
  }, [src]);
  return image;
}

interface ShapeProps {
  element: CanvasElement;
  onSelect: () => void;
  onDragStart: () => void;
  onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onTransformStart: () => void;
  onTransformEnd: (e: Konva.KonvaEventObject<Event>) => void;
  registerRef: (node: Konva.Node | null) => void;
}

function ImageShape(props: ShapeProps) {
  const { element, registerRef } = props;
  const image = useHtmlImage(element.src);
  return (
    <KonvaImage
      ref={registerRef as never}
      image={image}
      name={element.id}
      x={element.x}
      y={element.y}
      width={element.width ?? 160}
      height={element.height ?? 160}
      rotation={element.rotation}
      opacity={element.opacity}
      draggable={!element.locked}
      onClick={props.onSelect}
      onTap={props.onSelect}
      onDragStart={props.onDragStart}
      onDragEnd={props.onDragEnd}
      onTransformStart={props.onTransformStart}
      onTransformEnd={props.onTransformEnd}
    />
  );
}

export function CanvasEditor({ stageRef }: CanvasEditorProps) {
  const width = useCanvasStore((s) => s.width);
  const height = useCanvasStore((s) => s.height);
  const background = useCanvasStore((s) => s.background);
  const elements = useCanvasStore((s) => s.elements);
  const selectedId = useCanvasStore((s) => s.selectedId);
  const setSelectedId = useCanvasStore((s) => s.setSelectedId);
  const updateElement = useCanvasStore((s) => s.updateElement);
  const beginChange = useCanvasStore((s) => s.beginChange);

  const transformerRef = useRef<Konva.Transformer>(null);
  const shapeRefs = useRef<Record<string, Konva.Node>>({});

  // Attach the transformer to the selected (unlocked, visible) node.
  useEffect(() => {
    const transformer = transformerRef.current;
    if (!transformer) return;
    const selected = selectedId ? shapeRefs.current[selectedId] : null;
    const element = elements.find((el) => el.id === selectedId);
    if (selected && element && !element.locked && element.visible) {
      transformer.nodes([selected]);
    } else {
      transformer.nodes([]);
    }
    transformer.getLayer()?.batchDraw();
  }, [selectedId, elements]);

  const handleStageMouseDown = (
    e: Konva.KonvaEventObject<MouseEvent | TouchEvent>,
  ) => {
    if (e.target === e.target.getStage()) {
      setSelectedId(null);
    }
  };

  const handleDragEnd =
    (id: string) => (e: Konva.KonvaEventObject<DragEvent>) => {
      updateElement(
        id,
        { x: e.target.x(), y: e.target.y() },
        { history: false },
      );
    };

  const handleTransformEnd =
    (element: CanvasElement) => (e: Konva.KonvaEventObject<Event>) => {
      const node = e.target as Konva.Shape;
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();
      node.scaleX(1);
      node.scaleY(1);

      const patch: Partial<CanvasElement> = {
        x: node.x(),
        y: node.y(),
        rotation: node.rotation(),
      };

      if (element.type === 'circle') {
        const radius = (element.radius ?? 50) * ((scaleX + scaleY) / 2);
        patch.radius = Math.max(5, radius);
      } else if (element.type === 'text') {
        patch.fontSize = Math.max(6, (element.fontSize ?? 24) * scaleY);
        patch.width = Math.max(20, (element.width ?? 200) * scaleX);
      } else {
        patch.width = Math.max(5, (element.width ?? 100) * scaleX);
        patch.height = Math.max(5, (element.height ?? 100) * scaleY);
      }

      updateElement(element.id, patch, { history: false });
    };

  const registerRef = (id: string) => (node: Konva.Node | null) => {
    if (node) {
      shapeRefs.current[id] = node;
    } else {
      delete shapeRefs.current[id];
    }
  };

  const renderElement = (element: CanvasElement) => {
    if (!element.visible) return null;

    const common = {
      name: element.id,
      x: element.x,
      y: element.y,
      rotation: element.rotation,
      opacity: element.opacity,
      draggable: !element.locked,
      onClick: () => setSelectedId(element.id),
      onTap: () => setSelectedId(element.id),
      onDragStart: beginChange,
      onDragEnd: handleDragEnd(element.id),
      onTransformStart: beginChange,
      onTransformEnd: handleTransformEnd(element),
    };

    switch (element.type) {
      case 'rect':
        return (
          <Rect
            key={element.id}
            ref={registerRef(element.id) as never}
            {...common}
            width={element.width ?? 120}
            height={element.height ?? 120}
            fill={element.fill}
            stroke={element.stroke}
            strokeWidth={element.strokeWidth ?? 0}
            cornerRadius={6}
          />
        );
      case 'circle':
        return (
          <Circle
            key={element.id}
            ref={registerRef(element.id) as never}
            {...common}
            radius={element.radius ?? 60}
            fill={element.fill}
            stroke={element.stroke}
            strokeWidth={element.strokeWidth ?? 0}
          />
        );
      case 'text':
        return (
          <Text
            key={element.id}
            ref={registerRef(element.id) as never}
            {...common}
            text={element.text ?? 'Text'}
            fontSize={element.fontSize ?? 28}
            fontFamily={element.fontFamily ?? 'Arial'}
            fontStyle={element.fontStyle ?? 'normal'}
            align={element.align ?? 'left'}
            width={element.width ?? 240}
            fill={element.fill}
          />
        );
      case 'image':
        return (
          <ImageShape
            key={element.id}
            element={element}
            onSelect={() => setSelectedId(element.id)}
            onDragStart={beginChange}
            onDragEnd={handleDragEnd(element.id)}
            onTransformStart={beginChange}
            onTransformEnd={handleTransformEnd(element)}
            registerRef={registerRef(element.id)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div
      className="inline-block rounded-lg border bg-white shadow-sm"
      style={{ lineHeight: 0 }}
    >
      <Stage
        ref={stageRef}
        width={width}
        height={height}
        onMouseDown={handleStageMouseDown}
        onTouchStart={handleStageMouseDown}
      >
        <Layer>
          <Rect
            x={0}
            y={0}
            width={width}
            height={height}
            fill={background}
            listening={false}
          />
          {elements.map(renderElement)}
          <Transformer
            ref={transformerRef}
            rotateEnabled
            boundBoxFunc={(oldBox, newBox) =>
              newBox.width < 5 || newBox.height < 5 ? oldBox : newBox
            }
          />
        </Layer>
      </Stage>
    </div>
  );
}

export default CanvasEditor;
