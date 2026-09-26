import React, { useRef, useState } from 'react';
import {
  ChevronDown,
  Map,
  Minus,
  MousePointer,
  Plus,
  Share2,
  Sparkles,
  Upload,
  Video,
  Download,
} from 'lucide-react';
import { EditorState } from '../../core/state/store';
import { EXPORT_PRESETS } from '../../core/state/presets';
import { ExportPreset } from '../../core/types';

interface TopNavProps {
  state: EditorState;
  onUploadFile: (file: File) => void;
  onSelectPreset: (preset: ExportPreset) => void;
  onToggleSmartCrop: () => void;
  onOpenExportModal: () => void;
  onOpenShortcutsModal?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onResetZoom?: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  state,
  onUploadFile,
  onSelectPreset,
  onToggleSmartCrop,
  onOpenExportModal,
  onOpenShortcutsModal,
  onZoomIn,
  onZoomOut,
  onResetZoom,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [boardName, setBoardName] = useState<string>('untitledboard');
  const [isEditingTitle, setIsEditingTitle] = useState<boolean>(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadFile(file);
    }
  };

  return (
    <header className="top-nav">
      {/* LEFT SECTION: Logo & Breadcrumb */}
      <div className="nav-left-section">
        {/* Colorful Creative Sunburst / Pencil Badge (as in reference) */}
        <div className="brand-sun-badge" title="Bezel Whiteboard">
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 6V2" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M23 9L26 6" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M26 16H30" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M9 9L6 6" stroke="#ec4899" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M6 16H2" stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round" />
            {/* Pencil Tip Center */}
            <path d="M13 14L16 26L19 14L16 11L13 14Z" fill="#6366f1" />
            <path d="M14.5 22L16 26L17.5 22H14.5Z" fill="#1e1b4b" />
            <path d="M11 16L13 14L16 11L19 14L21 16" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <div className="nav-divider" />

        {/* Breadcrumb Title: Board / untitledboard ⌄ */}
        <div className="breadcrumb-title" onClick={() => setIsEditingTitle(true)}>
          <span>Board</span>
          <span style={{ color: 'var(--text-muted)' }}>/</span>
          {isEditingTitle ? (
            <input
              type="text"
              value={boardName}
              autoFocus
              onChange={(e) => setBoardName(e.target.value)}
              onBlur={() => setIsEditingTitle(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setIsEditingTitle(false);
              }}
              style={{
                border: 'none',
                background: 'transparent',
                fontWeight: 600,
                fontSize: '0.82rem',
                color: 'var(--text-primary)',
                width: `${Math.max(100, boardName.length * 9)}px`,
              }}
            />
          ) : (
            <strong>{boardName}</strong>
          )}
          <ChevronDown size={14} color="#94a3b8" />
        </div>
      </div>

      {/* RIGHT SECTION: Avatar, Zoom, Upload */}
      <div className="nav-right-section">
        <button
          className="icon-btn"
          onClick={onToggleSmartCrop}
          title={`Smart Fit / Mouse Sync: ${state.smartCropEnabled ? 'Active' : 'Off'}`}
          style={{ width: 28, height: 28, color: state.smartCropEnabled ? '#7c3aed' : '#94a3b8' }}
        >
          <MousePointer size={15} />
        </button>

        {/* Current User Profile Avatar with Gold Ring */}
        <img
          src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=64&h=64&fit=crop&crop=faces"
          alt="My Profile"
          className="user-profile-avatar"
          title="Razy (You)"
        />

        {/* Upload Hidden Input & Trigger */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*,video/*"
          style={{ display: 'none' }}
        />

        {/* Zoom Capsule: [ -  40% ⌄  + ] */}
        <div className="zoom-capsule">
          <button
            className="zoom-btn"
            onClick={onZoomOut}
            title="Zoom Out (-)"
          >
            <Minus size={13} />
          </button>
          <span
            className="zoom-value-text"
            onClick={onResetZoom}
            title="Click to reset 100%"
          >
            {Math.round(state.zoom * 100)}% ⌄
          </span>
          <button
            className="zoom-btn"
            onClick={onZoomIn}
            title="Zoom In (+)"
          >
            <Plus size={13} />
          </button>
        </div>

        {/* Upload Image / Video Button */}
        <button
          className="icon-btn"
          onClick={() => fileInputRef.current?.click()}
          title="Upload Screenshot / Video"
          style={{ width: 32, height: 32, color: '#475569' }}
        >
          <Upload size={17} />
        </button>
      </div>
    </header>
  );
};

