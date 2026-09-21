import React from 'react';
import { Keyboard, X } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  onClose: () => void;
}

const SHORTCUTS = [
  { key: 'V', desc: 'Select / Move Tool' },
  { key: 'C', desc: 'Crop Tool' },
  { key: 'P', desc: 'Pen / Freehand Tool' },
  { key: 'A', desc: 'Arrow Tool' },
  { key: 'T', desc: 'Text Tool' },
  { key: 'R', desc: 'Rectangle Shape Tool' },
  { key: 'O', desc: 'Circle Shape Tool' },
  { key: 'B', desc: 'Blur / Redact Tool' },
  { key: 'Shift + A', desc: 'Toggle Smart Fit / Crop' },
  { key: 'Ctrl / ⌘ + Z', desc: 'Undo Action' },
  { key: 'Ctrl / ⌘ + Shift + Z', desc: 'Redo Action' },
  { key: 'Ctrl / ⌘ + E', desc: 'Open Export Studio' },
  { key: '+ / -', desc: 'Zoom In / Out' },
  { key: '0', desc: 'Reset Viewport Zoom' },
  { key: '?', desc: 'Show Shortcuts Cheat Sheet' },
];

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ onClose }) => {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Keyboard size={20} color="#818cf8" />
            <div className="modal-title">Keyboard Shortcuts</div>
          </div>
          <button className="icon-btn" onClick={onClose} style={{ width: 32, height: 32 }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '60vh', overflowY: 'auto' }}>
          {SHORTCUTS.map((s, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{s.desc}</span>
              <kbd
                style={{
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-xs)',
                  background: 'var(--bg-surface-active)',
                  border: '1px solid var(--border-medium)',
                  fontSize: '0.72rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 600,
                  color: '#a5b4fc',
                }}
              >
                {s.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
