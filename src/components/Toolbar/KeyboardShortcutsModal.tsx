import React, { useEffect, useRef } from 'react';
import { Keyboard, X, Sparkles, Command } from 'lucide-react';

interface KeyboardShortcutsPanelProps {
  onClose: () => void;
}

interface ShortcutCategory {
  title: string;
  items: { key: string; desc: string }[];
}

const SHORTCUT_GROUPS: ShortcutCategory[] = [
  {
    title: 'Tools & Annotation',
    items: [
      { key: 'V', desc: 'Select / Move' },
      { key: 'H', desc: 'Hand / Pan Canvas' },
      { key: 'N', desc: 'Sticky Note' },
      { key: 'S', desc: 'Shapes & Stars' },
      { key: 'A', desc: 'Arrow Line' },
      { key: 'T', desc: 'Text Annotation' },
      { key: 'K', desc: 'Insert Link' },
      { key: 'C', desc: 'Comments & Notes' },
    ],
  },
  {
    title: 'Actions & Engine',
    items: [
      { key: 'Ctrl + Z', desc: 'Undo Action' },
      { key: 'Ctrl + Shift + Z', desc: 'Redo Action' },
      { key: 'Ctrl + E', desc: 'Open Export Studio' },
      { key: 'Shift + A', desc: 'Toggle Smart Fit' },
    ],
  },
  {
    title: 'Zoom & Viewport',
    items: [
      { key: '+ / -', desc: 'Zoom In / Out' },
      { key: '0', desc: 'Reset Zoom (100%)' },
      { key: '?', desc: 'Toggle Shortcuts Panel' },
    ],
  },
];

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsPanelProps> = ({ onClose }) => {
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on Escape or click outside
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        !(e.target as HTMLElement).closest('.bottom-right-help-btn')
      ) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div className="shortcuts-side-container" ref={panelRef} role="dialog" aria-label="Keyboard Shortcuts">
      {/* Header */}
      <div className="shortcuts-side-header">
        <div className="shortcuts-title-group">
          <div className="shortcuts-icon-pill">
            <Keyboard size={16} />
          </div>
          <div>
            <div className="shortcuts-side-title">Keyboard Shortcuts</div>
            <div className="shortcuts-side-subtitle">Quick access reference</div>
          </div>
        </div>
        <button
          className="icon-btn shortcuts-close-btn"
          onClick={onClose}
          title="Close (Esc)"
          aria-label="Close shortcuts panel"
        >
          <X size={16} />
        </button>
      </div>

      {/* Content Groups */}
      <div className="shortcuts-side-body">
        {SHORTCUT_GROUPS.map((group, gIdx) => (
          <div key={gIdx} className="shortcuts-group-block">
            <div className="shortcuts-group-heading">{group.title}</div>
            <div className="shortcuts-group-list">
              {group.items.map((item, idx) => (
                <div key={idx} className="shortcuts-item-row">
                  <span className="shortcuts-item-label">{item.desc}</span>
                  <kbd className="shortcuts-item-kbd">{item.key}</kbd>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
