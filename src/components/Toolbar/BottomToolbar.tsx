import React from 'react';
import {
  ArrowUp,
  Grid,
  Hand,
  ImagePlus,
  Link2,
  MessageSquare,
  MousePointer,
  RotateCcw,
  Sparkles,
  StickyNote,
  Type,
} from 'lucide-react';
import { AnnotationTool } from '../../core/types';

interface BottomToolbarProps {
  activeTool: AnnotationTool | 'note' | 'hand' | 'shape' | 'image' | 'link' | 'comment';
  onSelectTool: (tool: any) => void;
  annotationColor?: string;
  onChangeColor?: (color: string) => void;
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
  onUndo,
}) => {
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
          {/* Hatched Square Icon matching reference ▨ */}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#475569" strokeWidth="1.5">
            <rect x="2.5" y="2.5" width="11" height="11" rx="2" />
            <line x1="3" y1="7" x2="7" y2="3" />
            <line x1="3" y1="12" x2="12" y2="3" />
            <line x1="7" y1="13" x2="13" y2="7" />
          </svg>
        </button>

        <button
          className="icon-btn"
          onClick={() => {}}
          title="Grid Layout View"
          style={{ width: 32, height: 32 }}
        >
          {/* 2-column layout grid icon matching reference ⊞ */}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#475569" strokeWidth="1.5">
            <rect x="2.5" y="2.5" width="11" height="11" rx="2" />
            <line x1="8" y1="2.5" x2="8" y2="13.5" />
            <line x1="2.5" y1="8" x2="8" y2="8" />
          </svg>
        </button>
      </div>

      {/* Main Bottom Floating Pill Toolbar with Purple Outline */}
      <div className="bottom-toolbar-container">
        {/* Floating Tooltip directly above the Sticky Note Tool */}
        <div className="toolbar-tooltip-pill">
          Sticky Note
        </div>

        <div className="bottom-toolbar">
          {/* 1. Selection Pointer Arrow ↖ */}
          <button
            className={`toolbar-btn ${activeTool === 'select' ? 'active' : ''}`}
            onClick={() => onSelectTool('select')}
            title="Select (V)"
          >
            <MousePointer size={18} />
          </button>

          {/* 2. Hand Tool ✋ */}
          <button
            className={`toolbar-btn ${activeTool === 'hand' ? 'active' : ''}`}
            onClick={() => onSelectTool('hand')}
            title="Hand / Pan (H)"
          >
            <Hand size={18} />
          </button>

          {/* 3. Sticky Note Tool (Active Lavender in Reference) */}
          <button
            className={`toolbar-btn ${activeTool === 'note' || activeTool === 'rectangle' ? 'active' : ''}`}
            onClick={() => onSelectTool('note')}
            title="Sticky Note (N)"
          >
            {/* Custom rounded note icon */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill={activeTool === 'note' || activeTool === 'rectangle' ? '#7c3aed' : 'none'} stroke={activeTool === 'note' || activeTool === 'rectangle' ? '#7c3aed' : '#475569'} strokeWidth="2">
              <rect x="4" y="4" width="16" height="16" rx="4" />
            </svg>
          </button>

          {/* 4. 8-Point Star / Octagram Shape Tool ☼ */}
          <button
            className={`toolbar-btn ${activeTool === 'shape' || activeTool === 'circle' ? 'active' : ''}`}
            onClick={() => onSelectTool('shape')}
            title="Shapes (S)"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </button>

          {/* 5. Up Arrow Tool ↑ */}
          <button
            className={`toolbar-btn ${activeTool === 'arrow' ? 'active' : ''}`}
            onClick={() => onSelectTool('arrow')}
            title="Arrow (A)"
          >
            <ArrowUp size={18} />
          </button>

          {/* 6. Text Tool T */}
          <button
            className={`toolbar-btn ${activeTool === 'text' ? 'active' : ''}`}
            onClick={() => onSelectTool('text')}
            title="Text (T)"
          >
            <div style={{ border: '1.5px solid currentColor', borderRadius: 4, width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.72rem' }}>
              T
            </div>
          </button>

          {/* 7. Image Plus Tool 🖼️+ */}
          <button
            className={`toolbar-btn ${activeTool === 'image' ? 'active' : ''}`}
            onClick={() => onSelectTool('image')}
            title="Add Media"
          >
            <ImagePlus size={18} />
          </button>

          {/* 8. Link Chain Tool 🔗 */}
          <button
            className={`toolbar-btn ${activeTool === 'link' ? 'active' : ''}`}
            onClick={() => onSelectTool('link')}
            title="Insert Link (K)"
          >
            <Link2 size={18} />
          </button>

          {/* 9. Comments Speech Bubble 💬 */}
          <button
            className={`toolbar-btn ${activeTool === 'comment' ? 'active' : ''}`}
            onClick={() => onSelectTool('comment')}
            title="Add Comment (C)"
          >
            <MessageSquare size={18} />
          </button>
        </div>
      </div>

      {/* Bottom Right Floating Purple Chat Button with 3 dots (•••) */}
      <button
        className="bottom-right-chat-btn"
        title="Collaborative Chat / Comments"
        onClick={() => {}}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
          <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM7 11C6.45 11 6 10.55 6 10C6 9.45 6.45 9 7 9C7.55 9 8 9.45 8 10C8 10.55 7.55 11 7 11ZM12 11C11.45 11 11 10.55 11 10C11 9.45 11.45 9 12 9C12.55 9 13 9.45 13 10C13 10.55 12.55 11 12 11ZM17 11C16.45 11 16 10.55 16 10C16 9.45 16.45 9 17 9C17.55 9 18 9.45 18 10C18 10.55 17.55 11 17 11Z" />
        </svg>
      </button>
    </>
  );
};


