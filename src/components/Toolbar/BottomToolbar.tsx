import React from 'react';
import {
  ArrowUp,
  FileText,
  Grid,
  Hand,
  Image as ImageIcon,
  Layers,
  Link2,
  MessageCircle,
  MessageSquare,
  MousePointer2,
  Plus,
  Redo2,
  RotateCcw,
  Sparkles,
  StickyNote,
  Type,
  Undo2,
  Hexagon,
} from 'lucide-react';
import { AnnotationTool } from '../../core/types';

interface BottomToolbarProps {
  activeTool: AnnotationTool | 'note' | 'hand' | 'shape' | 'image' | 'link' | 'comment';
  onSelectTool: (tool: any) => void;
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

export const BottomToolbar: React.FC<BottomToolbarProps> = ({
  activeTool,
  onSelectTool,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}) => {
  // Map tool to human friendly name for tooltip
  const getToolName = (tool: string) => {
    switch (tool) {
      case 'note':
      case 'rectangle':
        return 'Sticky Note';
      case 'select':
        return 'Selection Pointer';
      case 'hand':
        return 'Hand (Pan Canvas)';
      case 'shape':
      case 'circle':
        return 'Shape Tool';
      case 'arrow':
        return 'Arrow Tool';
      case 'text':
        return 'Text Tool';
      case 'image':
        return 'Insert Media';
      case 'link':
        return 'Insert Link';
      case 'comment':
        return 'Add Comment';
      case 'pen':
        return 'Freehand Draw';
      default:
        return 'Sticky Note';
    }
  };

  return (
    <>
      {/* Bottom Left Quick Controls: [ ↺  ▨  ⊞ ] */}
      <div className="bottom-left-controls">
        <button
          className="icon-btn"
          disabled={!canUndo}
          onClick={onUndo}
          title="Undo (Ctrl+Z)"
          style={{ width: 32, height: 32, opacity: canUndo ? 1 : 0.4 }}
        >
          <RotateCcw size={16} />
        </button>

        <button
          className="icon-btn"
          onClick={() => {}}
          title="Layers & Shading"
          style={{ width: 32, height: 32 }}
        >
          {/* Custom hatched square icon matching reference ▨ */}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="2" y="2" width="12" height="12" rx="2" />
            <line x1="2" y1="6" x2="6" y2="2" />
            <line x1="2" y1="11" x2="11" y2="2" />
            <line x1="5" y1="14" x2="14" y2="5" />
            <line x1="10" y1="14" x2="14" y2="10" />
          </svg>
        </button>

        <button
          className="icon-btn"
          onClick={() => {}}
          title="Grid Layout View"
          style={{ width: 32, height: 32 }}
        >
          <Grid size={16} />
        </button>
      </div>

      {/* Main Bottom Floating Pill Toolbar with Purple Outline */}
      <div className="bottom-toolbar-container">
        {/* Floating Tooltip above active tool */}
        <div className="toolbar-tooltip-pill">
          {getToolName(activeTool)}
        </div>

        <div className="bottom-toolbar">
          {/* 1. Selection Cursor */}
          <button
            className={`toolbar-btn ${activeTool === 'select' ? 'active' : ''}`}
            onClick={() => onSelectTool('select')}
            title="Select (V)"
          >
            <MousePointer2 size={18} />
          </button>

          {/* 2. Hand Pan */}
          <button
            className={`toolbar-btn ${activeTool === 'hand' ? 'active' : ''}`}
            onClick={() => onSelectTool('hand')}
            title="Hand / Pan (H)"
          >
            <Hand size={18} />
          </button>

          {/* 3. Sticky Note (Active in reference) */}
          <button
            className={`toolbar-btn ${activeTool === 'note' || activeTool === 'rectangle' ? 'active' : ''}`}
            onClick={() => onSelectTool('note')}
            title="Sticky Note (N)"
          >
            <StickyNote size={18} fill={activeTool === 'note' || activeTool === 'rectangle' ? '#7c3aed' : 'none'} />
          </button>

          {/* 4. Polygon / Star Shape */}
          <button
            className={`toolbar-btn ${activeTool === 'shape' || activeTool === 'circle' ? 'active' : ''}`}
            onClick={() => onSelectTool('shape')}
            title="Shapes (S)"
          >
            <Hexagon size={18} />
          </button>

          {/* 5. Arrow Tool */}
          <button
            className={`toolbar-btn ${activeTool === 'arrow' ? 'active' : ''}`}
            onClick={() => onSelectTool('arrow')}
            title="Arrow (A)"
          >
            <ArrowUp size={18} />
          </button>

          {/* 6. Text Tool */}
          <button
            className={`toolbar-btn ${activeTool === 'text' ? 'active' : ''}`}
            onClick={() => onSelectTool('text')}
            title="Text (T)"
          >
            <Type size={18} />
          </button>

          {/* 7. Image / Media Insert */}
          <button
            className={`toolbar-btn ${activeTool === 'image' ? 'active' : ''}`}
            onClick={() => onSelectTool('image')}
            title="Add Media / Screenshot"
          >
            <ImageIcon size={18} />
          </button>

          {/* 8. Link Tool */}
          <button
            className={`toolbar-btn ${activeTool === 'link' ? 'active' : ''}`}
            onClick={() => onSelectTool('link')}
            title="Add Link (K)"
          >
            <Link2 size={18} />
          </button>

          {/* 9. Comments */}
          <button
            className={`toolbar-btn ${activeTool === 'comment' ? 'active' : ''}`}
            onClick={() => onSelectTool('comment')}
            title="Add Comment (C)"
          >
            <MessageSquare size={18} />
          </button>
        </div>
      </div>

      {/* Bottom Right Floating Chat / AI Collaborator Button (•••) */}
      <button
        className="bottom-right-chat-btn"
        title="Collaborative Chat / Comments"
        onClick={() => {}}
      >
        <MessageCircle size={22} fill="#ffffff" stroke="#7c3aed" />
      </button>
    </>
  );
};

