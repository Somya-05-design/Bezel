import React, { useRef } from 'react';
import {
  ArrowUp,
  Hand,
  HelpCircle,
  Link2,
  MessageSquare,
  MousePointer,
  Redo2,
  Undo2,
  Upload,
} from 'lucide-react';
import { AnnotationTool } from '../../core/types';
import { ThemeSwitcher } from './ThemeSwitcher';

interface BottomToolbarProps {
  activeTool: AnnotationTool | 'hand' | 'shape' | 'image' | 'link' | 'comment';
  onSelectTool: (tool: any) => void;
  onUploadFile?: (file: File) => void;
  onOpenShortcutsModal?: () => void;
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
  onUploadFile,
  onOpenShortcutsModal,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  return (
    <>
      {/* Bottom Left Quick Controls: Undo / Redo for steps */}
      <div className="bottom-left-controls">
        <button
          className="icon-btn"
          disabled={!canUndo}
          onClick={onUndo}
          title="Undo step (Ctrl+Z)"
          aria-label="Undo"
          style={{ width: 32, height: 32, opacity: canUndo ? 1 : 0.35, cursor: canUndo ? 'pointer' : 'not-allowed' }}
        >
          <Undo2 size={16} strokeWidth={2.2} />
        </button>

        <button
          className="icon-btn"
          disabled={!canRedo}
          onClick={onRedo}
          title="Redo step (Ctrl+Y / Ctrl+Shift+Z)"
          aria-label="Redo"
          style={{ width: 32, height: 32, opacity: canRedo ? 1 : 0.35, cursor: canRedo ? 'pointer' : 'not-allowed' }}
        >
          <Redo2 size={16} strokeWidth={2.2} />
        </button>
      </div>

      {/* Main Bottom Floating Pill Toolbar with Purple Outline */}
      <div className="bottom-toolbar-container">
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

          {/* 7. Image / Media Upload Tool (Arrow Up in Tray) */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file && onUploadFile) {
                onUploadFile(file);
              }
              // Reset input so re-uploading same file works
              e.target.value = '';
            }}
            accept="image/*,video/*"
            style={{ display: 'none' }}
          />
          <button
            className={`toolbar-btn ${activeTool === 'image' ? 'active' : ''}`}
            onClick={() => {
              onSelectTool('image');
              fileInputRef.current?.click();
            }}
            title="Upload Image / Video"
          >
            <Upload size={18} strokeWidth={2} />
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

      {/* Bottom Right Floating Actions (Shortcuts Help ? above Screen / Theme Switcher) */}
      <div className="bottom-right-actions">
        {onOpenShortcutsModal && (
          <button
            className="bottom-right-help-btn"
            onClick={onOpenShortcutsModal}
            title="Shortcuts & Help (?)"
            aria-label="Keyboard Shortcuts & Help"
          >
            <HelpCircle size={18} strokeWidth={2} />
          </button>
        )}
        <ThemeSwitcher />
      </div>
    </>
  );
};


