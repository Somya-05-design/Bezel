import React, { useEffect, useRef, useState } from 'react';
import { EditorState } from '../../core/state/store';
import { compositeFrame, interpolateTransform } from '../../core/engine';
import { AnnotationItem, Point } from '../../core/types';
import { Upload } from 'lucide-react';

interface CanvasPreviewProps {
  state: EditorState;
  onAddAnnotation: (annotation: AnnotationItem) => void;
  onUploadFile: (file: File) => void;
}

export const CanvasPreview: React.FC<CanvasPreviewProps> = ({
  state,
  onAddAnnotation,
  onUploadFile,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [startPoint, setStartPoint] = useState<Point | null>(null);

  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  // Handle Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      onUploadFile(file);
    }
  };

  // Live Canvas Rendering Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let isRunning = true;
    startTimeRef.current = Date.now();

    const renderLoop = () => {
      if (!isRunning || !state.sourceMedia || !state.sourceMedia.element) return;

      const targetW = state.exportPreset.width;
      const targetH = state.exportPreset.height;

      let activeTransform = state.transform;

      // Handle Ken Burns live preview
      if (state.kenBurns.enabled) {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        const cycle = elapsed % (state.kenBurns.duration || 3);
        const t = cycle / (state.kenBurns.duration || 3);
        activeTransform = interpolateTransform(
          state.kenBurns.start,
          state.kenBurns.end,
          t,
          state.kenBurns.easing
        );
      }

      compositeFrame(
        {
          sourceElement: state.sourceMedia.element,
          frame: state.currentFrame,
          frameColor: state.frameColor,
          background: state.background,
          crop: state.crop,
          transform: activeTransform,
          annotations: state.annotations,
          canvasWidth: targetW,
          canvasHeight: targetH,
          deviceScale: state.deviceScale,
          devicePosition: state.devicePosition,
          showReflections: state.showReflections,
        },
        canvas
      );

      if (state.sourceMedia.type === 'video' || state.kenBurns.enabled) {
        animationFrameRef.current = requestAnimationFrame(renderLoop);
      }
    };

    if (state.sourceMedia) {
      renderLoop();
    }

    return () => {
      isRunning = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [
    state.currentFrame,
    state.frameColor,
    state.background,
    state.sourceMedia,
    state.crop,
    state.transform,
    state.kenBurns,
    state.annotations,
    state.exportPreset,
    state.deviceScale,
    state.devicePosition,
    state.showReflections,
  ]);

  // Handle Drawing Annotations
  const getCanvasCoords = (e: React.MouseEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (state.activeTool === 'select' || (state.activeTool as string) === 'hand') return;
    const p = getCanvasCoords(e);
    setIsDrawing(true);
    setStartPoint(p);
    setCurrentPoints([p]);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing) return;
    const p = getCanvasCoords(e);
    if (state.activeTool === 'pen') {
      setCurrentPoints((prev) => [...prev, p]);
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDrawing || !startPoint) return;
    const endP = getCanvasCoords(e);
    setIsDrawing(false);

    const id = `ann_${Date.now()}`;
    const color = state.annotationColor;
    const strokeWidth = state.annotationStrokeWidth;

    if (state.activeTool === 'pen') {
      onAddAnnotation({
        id,
        tool: 'pen',
        color,
        strokeWidth,
        points: currentPoints,
      });
    } else if (state.activeTool === 'arrow') {
      onAddAnnotation({
        id,
        tool: 'arrow',
        color,
        strokeWidth,
        startPoint,
        endPoint: endP,
      });
    } else if (state.activeTool === 'rectangle') {
      onAddAnnotation({
        id,
        tool: 'rectangle',
        color,
        strokeWidth,
        rect: {
          x: Math.min(startPoint.x, endP.x),
          y: Math.min(startPoint.y, endP.y),
          width: Math.abs(endP.x - startPoint.x),
          height: Math.abs(endP.y - startPoint.y),
        },
      });
    } else if (state.activeTool === 'circle') {
      onAddAnnotation({
        id,
        tool: 'circle',
        color,
        strokeWidth,
        rect: {
          x: Math.min(startPoint.x, endP.x),
          y: Math.min(startPoint.y, endP.y),
          width: Math.abs(endP.x - startPoint.x),
          height: Math.abs(endP.y - startPoint.y),
        },
      });
    }

    setStartPoint(null);
    setCurrentPoints([]);
  };

  return (
    <main
      className="canvas-viewport"
      ref={containerRef}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div
        className="canvas-wrapper"
        style={{
          transform: `scale(${state.zoom})`,
          maxWidth: '85vw',
          maxHeight: '75vh',
        }}
      >
        <canvas
          ref={canvasRef}
          className="preview-canvas"
          style={{
            maxWidth: '100%',
            maxHeight: '75vh',
            display: state.sourceMedia ? 'block' : 'none',
            cursor:
              state.activeTool === 'pen' || state.activeTool === 'arrow'
                ? 'crosshair'
                : 'default',
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        />
      </div>

      {/* Drag & Drop Overlay */}
      {isDraggingOver && (
        <div
          style={{
            position: 'absolute',
            inset: 20,
            borderRadius: 'var(--radius-xl)',
            border: '3px dashed var(--accent-primary)',
            background: 'rgba(124, 58, 237, 0.08)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            zIndex: 50,
          }}
        >
          <Upload size={48} color="#7c3aed" />
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Drop image or video recording to mock up
          </div>
        </div>
      )}
    </main>
  );
};
