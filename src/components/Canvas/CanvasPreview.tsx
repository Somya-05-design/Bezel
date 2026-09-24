import React, { useEffect, useRef, useState } from 'react';
import { EditorState } from '../../core/state/store';
import { compositeFrame, interpolateTransform } from '../../core/engine';
import { AnnotationItem, Point } from '../../core/types';
import {
  Bold,
  ChevronDown,
  CornerDownRight,
  Edit3,
  Link,
  List,
  Pen,
  Plus,
  Strikethrough,
  Type,
  Upload,
} from 'lucide-react';

interface CanvasPreviewProps {
  state: EditorState;
  onAddAnnotation: (annotation: AnnotationItem) => void;
  onUploadFile: (file: File) => void;
}

interface StickyNoteItem {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  author: string;
  isBold?: boolean;
  isStrikethrough?: boolean;
  fontSize?: 'Small' | 'Medium' | 'Large';
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

  // Sticky notes list (empty by default)
  const [notes, setNotes] = useState<StickyNoteItem[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [showColorPicker, setShowColorPicker] = useState<boolean>(false);

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

  const handleCanvasClick = (e: React.MouseEvent) => {
    // If active tool is 'note' or 'rectangle', create a new sticky note where clicked
    if ((state.activeTool as string) === 'note' || state.activeTool === 'rectangle') {
      const rect = containerRef.current?.getBoundingClientRect();
      const x = rect ? e.clientX - rect.left - 125 : e.clientX - 125;
      const y = rect ? e.clientY - rect.top - 135 : e.clientY - 135;

      const newNote: StickyNoteItem = {
        id: `note_${Date.now()}`,
        x: Math.max(20, x),
        y: Math.max(20, y),
        text: 'Add text',
        color: '#7ec6f8',
        author: 'Razy',
        fontSize: 'Small',
      };
      setNotes((prev) => [...prev, newNote]);
      setSelectedNoteId(newNote.id);
      setEditingNoteId(newNote.id);
      return;
    }

    // Clicking on empty area deselects
    setSelectedNoteId(null);
    setEditingNoteId(null);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (state.activeTool === 'select' || (state.activeTool as string) === 'note' || (state.activeTool as string) === 'hand') return;
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

  const updateNote = (id: string, updates: Partial<StickyNoteItem>) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, ...updates } : n))
    );
  };

  const duplicateNote = (note: StickyNoteItem) => {
    const newNote: StickyNoteItem = {
      ...note,
      id: `note_${Date.now()}`,
      x: note.x + 280,
      y: note.y,
      text: 'New note',
    };
    setNotes((prev) => [...prev, newNote]);
    setSelectedNoteId(newNote.id);
  };

  const selectedNote = notes.find((n) => n.id === selectedNoteId);

  return (
    <main
      className="canvas-viewport"
      ref={containerRef}
      onClick={handleCanvasClick}
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

        {/* Whiteboard Interactive Canvas Notes Layer */}
        {notes.length > 0 && (
          <div className="canvas-interactive-layer" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
            {notes.map((note) => {
              const isSelected = selectedNoteId === note.id;
              const isEditing = editingNoteId === note.id;

              return (
                <div
                  key={note.id}
                  style={{
                    position: 'absolute',
                    left: note.x,
                    top: note.y,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedNoteId(note.id);
                  }}
                >
                  <div
                    className="reference-sticky-note"
                    style={{
                      backgroundColor: note.color,
                      borderColor: isSelected ? '#38bdf8' : 'transparent',
                    }}
                  >
                    {/* Handles when selected */}
                    {isSelected && (
                      <>
                        <div className="selection-handle-corner handle-tl" />
                        <div className="selection-handle-corner handle-tr" />
                        <div className="selection-handle-corner handle-bl" />
                        <div className="selection-handle-corner handle-br" />

                        <div className="selection-dot-mid dot-top" />
                        <div className="selection-dot-mid dot-left" />
                        <div className="selection-dot-mid dot-bottom" />

                        {/* Quick Add Node (+) Button on Right Edge */}
                        <button
                          className="sticky-add-node-btn"
                          title="Add connected note"
                          onClick={(e) => {
                            e.stopPropagation();
                            duplicateNote(note);
                          }}
                        >
                          <Plus size={16} strokeWidth={2.5} />
                        </button>
                      </>
                    )}

                    {/* Note Content */}
                    <div>
                      {isEditing ? (
                        <textarea
                          value={note.text}
                          autoFocus
                          onChange={(e) => updateNote(note.id, { text: e.target.value })}
                          onBlur={() => setEditingNoteId(null)}
                          style={{
                            width: '100%',
                            background: 'transparent',
                            border: 'none',
                            resize: 'none',
                            color: '#075985',
                            fontFamily: 'inherit',
                            fontSize: note.fontSize === 'Large' ? '1.4rem' : note.fontSize === 'Medium' ? '1.2rem' : '1rem',
                            fontWeight: note.isBold ? 700 : 500,
                            textDecoration: note.isStrikethrough ? 'line-through' : 'none',
                          }}
                        />
                      ) : (
                        <div
                          onClick={() => setEditingNoteId(note.id)}
                          style={{
                            color: '#075985',
                            fontSize: note.fontSize === 'Large' ? '1.4rem' : note.fontSize === 'Medium' ? '1.2rem' : '1rem',
                            fontWeight: note.isBold ? 700 : 500,
                            textDecoration: note.isStrikethrough ? 'line-through' : 'none',
                            cursor: 'text',
                          }}
                        >
                          {note.text}
                        </div>
                      )}
                    </div>

                    {/* Author signature at bottom left */}
                    <div
                      style={{
                        fontSize: '0.78rem',
                        fontWeight: 500,
                        color: '#0369a1',
                      }}
                    >
                      {note.author}
                    </div>

                    {/* Floating Contextual Dark Formatting Bar Beneath Selected Sticky */}
                    {isSelected && (
                      <div
                        className="floating-format-bar"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Color Swatch Dropdown */}
                        <div style={{ position: 'relative' }}>
                          <button
                            className="format-btn"
                            onClick={() => setShowColorPicker(!showColorPicker)}
                          >
                            <span
                              style={{
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                backgroundColor: note.color,
                                display: 'inline-block',
                              }}
                            />
                            <ChevronDown size={11} color="#94a3b8" />
                          </button>

                          {showColorPicker && (
                            <div
                              style={{
                                position: 'absolute',
                                top: 'calc(100% + 6px)',
                                left: 0,
                                background: '#27272a',
                                padding: 6,
                                borderRadius: 6,
                                display: 'flex',
                                gap: 6,
                                boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                                zIndex: 50,
                              }}
                            >
                              {['#7ec6f8', '#fde047', '#86efac', '#fca5a5', '#d8b4fe', '#fdba74'].map((c) => (
                                <button
                                  key={c}
                                  onClick={() => {
                                    updateNote(note.id, { color: c });
                                    setShowColorPicker(false);
                                  }}
                                  style={{
                                    width: 18,
                                    height: 18,
                                    borderRadius: '50%',
                                    backgroundColor: c,
                                    border: 'none',
                                    cursor: 'pointer',
                                  }}
                                />
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="format-divider" />

                        {/* Font Family / Size Dropdowns */}
                        <button className="format-btn">
                          <span>Aa</span>
                          <ChevronDown size={11} color="#94a3b8" />
                        </button>

                        <button
                          className="format-btn"
                          onClick={() => {
                            const next = note.fontSize === 'Small' ? 'Medium' : note.fontSize === 'Medium' ? 'Large' : 'Small';
                            updateNote(note.id, { fontSize: next });
                          }}
                        >
                          <span>{note.fontSize || 'Small'}</span>
                          <ChevronDown size={11} color="#94a3b8" />
                        </button>

                        <div className="format-divider" />

                        {/* Bold */}
                        <button
                          className={`format-btn ${note.isBold ? 'active' : ''}`}
                          onClick={() => updateNote(note.id, { isBold: !note.isBold })}
                          title="Bold"
                        >
                          <Bold size={13} />
                        </button>

                        {/* Strikethrough */}
                        <button
                          className={`format-btn ${note.isStrikethrough ? 'active' : ''}`}
                          onClick={() => updateNote(note.id, { isStrikethrough: !note.isStrikethrough })}
                          title="Strikethrough"
                        >
                          <Strikethrough size={13} />
                        </button>

                        {/* Link */}
                        <button className="format-btn" title="Add link">
                          <Link size={13} />
                        </button>

                        {/* Bullet List */}
                        <button className="format-btn" title="Bullet list">
                          <List size={13} />
                        </button>

                        <div className="format-divider" />

                        {/* Edit Pencil Button (Purple) */}
                        <button
                          className="format-pencil-btn"
                          title="Edit note"
                          onClick={() => setEditingNoteId(note.id)}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
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

// Generates a modern white/light app screen when no image is loaded
let placeholderCanvasCache: HTMLCanvasElement | null = null;
function getPlaceholderGraphic(): HTMLCanvasElement {
  if (placeholderCanvasCache) return placeholderCanvasCache;

  const canvas = document.createElement('canvas');
  canvas.width = 1179;
  canvas.height = 2556;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // Clean Modern App Screen Gradient
  const bg = ctx.createLinearGradient(0, 0, 0, 2556);
  bg.addColorStop(0, '#f8fafc');
  bg.addColorStop(0.5, '#f1f5f9');
  bg.addColorStop(1, '#e2e8f0');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1179, 2556);

  // App UI Cards
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(15, 23, 42, 0.06)';
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 10;
  ctx.beginPath();
  ctx.roundRect(80, 260, 1019, 480, 40);
  ctx.fill();

  ctx.shadowColor = 'transparent';
  ctx.fillStyle = '#7c3aed';
  ctx.beginPath();
  ctx.arc(180, 360, 48, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 54px Plus Jakarta Sans, sans-serif';
  ctx.fillText('Bezel Studio', 260, 380);

  ctx.fillStyle = '#64748b';
  ctx.font = '36px Plus Jakarta Sans, sans-serif';
  ctx.fillText('Interactive Collaborative Canvas', 120, 520);
  ctx.fillText('Drop screenshot or screen recording here', 120, 590);

  // Second Card
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(80, 800, 1019, 700, 40);
  ctx.fill();

  placeholderCanvasCache = canvas;
  return canvas;
}

