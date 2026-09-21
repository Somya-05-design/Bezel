import React from 'react';
import {
  ArrowUpRight,
  Circle,
  Crop,
  EyeOff,
  Minus,
  MousePointer,
  Move,
  PenTool,
  Plus,
  Redo2,
  RotateCcw,
  Square,
  Type,
  Undo2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { AnnotationTool } from '../../core/types';

interface BottomToolbarProps {
  activeTool: AnnotationTool;
  onSelectTool: (tool: AnnotationTool) => void;
  annotationColor: string;
  onChangeColor: (color: string) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
}

const PRESET_COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ffffff', '#000000'];

export const BottomToolbar: React.FC<BottomToolbarProps> = ({
  activeTool,
  onSelectTool,
  annotationColor,
  onChangeColor,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  zoom,
  onZoomIn,
  onZoomOut,
  onResetZoom,
}) => {
  return (
    <div className="bottom-toolbar">
      {/* Select / Pointer */}
      <button
        className={`icon-btn ${activeTool === 'select' ? 'active' : ''}`}
        onClick={() => onSelectTool('select')}
        title="Select / Move (V)"
      >
        <MousePointer size={18} />
      </button>

      {/* Crop */}
      <button
        className={`icon-btn ${activeTool === 'crop' ? 'active' : ''}`}
        onClick={() => onSelectTool('crop')}
        title="Crop (C)"
      >
        <Crop size={18} />
      </button>

      <div className="toolbar-divider" />

      {/* Pen */}
      <button
        className={`icon-btn ${activeTool === 'pen' ? 'active' : ''}`}
        onClick={() => onSelectTool('pen')}
        title="Pen / Freehand (P)"
      >
        <PenTool size={18} />
      </button>

      {/* Arrow */}
      <button
        className={`icon-btn ${activeTool === 'arrow' ? 'active' : ''}`}
        onClick={() => onSelectTool('arrow')}
        title="Arrow Tool (A)"
      >
        <ArrowUpRight size={18} />
      </button>

      {/* Text */}
      <button
        className={`icon-btn ${activeTool === 'text' ? 'active' : ''}`}
        onClick={() => onSelectTool('text')}
        title="Text Tool (T)"
      >
        <Type size={18} />
      </button>

      {/* Rectangle */}
      <button
        className={`icon-btn ${activeTool === 'rectangle' ? 'active' : ''}`}
        onClick={() => onSelectTool('rectangle')}
        title="Rectangle Shape (R)"
      >
        <Square size={18} />
      </button>

      {/* Circle */}
      <button
        className={`icon-btn ${activeTool === 'circle' ? 'active' : ''}`}
        onClick={() => onSelectTool('circle')}
        title="Circle Shape (O)"
      >
        <Circle size={18} />
      </button>

      {/* Blur / Redact */}
      <button
        className={`icon-btn ${activeTool === 'redact' ? 'active' : ''}`}
        onClick={() => onSelectTool('redact')}
        title="Blur Redaction (B)"
      >
        <EyeOff size={18} />
      </button>

      <div className="toolbar-divider" />

      {/* Quick Color Picker */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {PRESET_COLORS.map((c) => (
          <button
            key={c}
            onClick={() => onChangeColor(c)}
            style={{
              width: 18,
              height: 18,
              borderRadius: '50%',
              backgroundColor: c,
              border: annotationColor === c ? '2px solid #818cf8' : '1px solid rgba(255,255,255,0.2)',
              transform: annotationColor === c ? 'scale(1.2)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          />
        ))}
      </div>

      <div className="toolbar-divider" />

      {/* Undo */}
      <button
        className="icon-btn"
        disabled={!canUndo}
        onClick={onUndo}
        title="Undo (Ctrl+Z)"
        style={{ opacity: canUndo ? 1 : 0.4 }}
      >
        <Undo2 size={18} />
      </button>

      {/* Redo */}
      <button
        className="icon-btn"
        disabled={!canRedo}
        onClick={onRedo}
        title="Redo (Ctrl+Shift+Z)"
        style={{ opacity: canRedo ? 1 : 0.4 }}
      >
        <Redo2 size={18} />
      </button>

      <div className="toolbar-divider" />

      {/* Zoom Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
        <button className="icon-btn" onClick={onZoomOut} title="Zoom Out (-)" style={{ width: 32, height: 32 }}>
          <Minus size={14} />
        </button>
        <button
          className="icon-btn"
          onClick={onResetZoom}
          title="Reset Zoom (0)"
          style={{ width: 'auto', padding: '0 8px', height: 32, fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}
        >
          {Math.round(zoom * 100)}%
        </button>
        <button className="icon-btn" onClick={onZoomIn} title="Zoom In (+)" style={{ width: 32, height: 32 }}>
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
};
