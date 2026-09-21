import React, { useRef } from 'react';
import {
  Download,
  HelpCircle,
  Layers,
  Sparkles,
  Upload,
  Video,
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
  onOpenShortcutsModal: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  state,
  onUploadFile,
  onSelectPreset,
  onToggleSmartCrop,
  onOpenExportModal,
  onOpenShortcutsModal,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadFile(file);
    }
  };

  return (
    <header className="top-nav">
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div className="brand-logo">
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #6366f1, #d946ef)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)',
            }}
          >
            <Sparkles size={18} />
          </div>
          <span>BEZEL</span>
          <span className="brand-badge">Studio</span>
        </div>

        {/* Export Dimensions Preset Dropdown */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <select
            value={state.exportPreset.id}
            onChange={(e) => {
              const preset = EXPORT_PRESETS.find((p) => p.id === e.target.value);
              if (preset) onSelectPreset(preset);
            }}
            style={{
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '6px 12px',
              fontSize: '0.8rem',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            {EXPORT_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="nav-actions">
        {/* Smart Crop Toggle */}
        <button
          className={`icon-btn ${state.smartCropEnabled ? 'active' : ''}`}
          onClick={onToggleSmartCrop}
          title={`Smart Crop: ${state.smartCropEnabled ? 'ON' : 'OFF'} (Shift+A)`}
          style={{ width: 'auto', padding: '0 12px', gap: '6px', fontSize: '0.78rem', fontWeight: 600 }}
        >
          <Layers size={15} />
          <span>Smart Fit</span>
        </button>

        {/* Upload File Button */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*,video/*"
          style={{ display: 'none' }}
        />
        <button
          className="icon-btn"
          onClick={() => fileInputRef.current?.click()}
          style={{ width: 'auto', padding: '0 14px', gap: '6px', fontSize: '0.8rem', fontWeight: 600 }}
        >
          <Upload size={16} />
          <span>Upload Media</span>
        </button>

        {/* Shortcuts / Help */}
        <button
          className="icon-btn"
          onClick={onOpenShortcutsModal}
          title="Keyboard Shortcuts (?)"
        >
          <HelpCircle size={18} />
        </button>

        {/* Export CTA */}
        <button className="gradient-btn" onClick={onOpenExportModal}>
          {state.sourceMedia?.type === 'video' || state.kenBurns.enabled ? (
            <Video size={17} />
          ) : (
            <Download size={17} />
          )}
          <span>Export Studio</span>
        </button>
      </div>
    </header>
  );
};
