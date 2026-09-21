import React, { useEffect, useRef, useState } from 'react';
import { EditorState } from '../../core/state/store';
import { compositeFrame, interpolateTransform } from '../../core/engine';
import { AnnotationItem, Point } from '../../core/types';
import { Image as ImageIcon, Upload, Video } from 'lucide-react';

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
      if (!isRunning) return;

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

      // Default sample element if no media uploaded yet
      let sourceElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement =
        state.sourceMedia?.element || getPlaceholderGraphic();

      compositeFrame(
        {
          sourceElement,
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

      // Request next frame if video or Ken Burns is active
      if (state.sourceMedia?.type === 'video' || state.kenBurns.enabled) {
        animationFrameRef.current = requestAnimationFrame(renderLoop);
      }
    };

    renderLoop();

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
    if (state.activeTool === 'select' || state.activeTool === 'crop') return;
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
    } else if (state.activeTool === 'text') {
      const text = prompt('Enter annotation text:', 'Highlight');
      if (text) {
        onAddAnnotation({
          id,
          tool: 'text',
          color,
          strokeWidth: 2,
          startPoint,
          text,
          fontSize: state.annotationFontSize,
        });
      }
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
            cursor:
              state.activeTool === 'pen'
                ? 'crosshair'
                : state.activeTool === 'arrow'
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
            background: 'rgba(99, 102, 241, 0.15)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            zIndex: 50,
          }}
        >
          <Upload size={48} color="#a5b4fc" />
          <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>
            Drop image or video recording to mock up
          </div>
        </div>
      )}
    </main>
  );
};

// Generates a sleek default placeholder app screen when no image is loaded
let placeholderCanvasCache: HTMLCanvasElement | null = null;
function getPlaceholderGraphic(): HTMLCanvasElement {
  if (placeholderCanvasCache) return placeholderCanvasCache;

  const canvas = document.createElement('canvas');
  canvas.width = 1179;
  canvas.height = 2556;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // Dark modern app screen gradient
  const bg = ctx.createLinearGradient(0, 0, 0, 2556);
  bg.addColorStop(0, '#090d16');
  bg.addColorStop(0.4, '#101726');
  bg.addColorStop(1, '#070a10');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1179, 2556);

  // App UI Cards
  ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.beginPath();
  ctx.roundRect(80, 260, 1019, 480, 40);
  ctx.fill();

  ctx.fillStyle = '#6366f1';
  ctx.beginPath();
  ctx.arc(180, 360, 48, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 54px Plus Jakarta Sans, sans-serif';
  ctx.fillText('Bezel Studio', 260, 380);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.font = '36px Plus Jakarta Sans, sans-serif';
  ctx.fillText('Drop screenshot or screen recording here', 120, 520);
  ctx.fillText('Auto content-aware backdrop & motion', 120, 590);

  // Second Card
  ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
  ctx.beginPath();
  ctx.roundRect(80, 800, 1019, 700, 40);
  ctx.fill();

  placeholderCanvasCache = canvas;
  return canvas;
}
