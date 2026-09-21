import React from 'react';
import {
  Film,
  Layers,
  Palette,
  Play,
  RotateCw,
  Sliders,
  Sparkles,
  Sun,
  Video,
  Wand2,
} from 'lucide-react';
import { EditorState } from '../../core/state/store';
import { FRAME_DEFINITIONS } from '../../core/frames';
import {
  BackgroundConfig,
  FrameColorId,
  FrameDefinition,
  KenBurnsConfig,
  KenBurnsPreset,
} from '../../core/types';

interface SidePanelProps {
  state: EditorState;
  onSelectFrame: (frame: FrameDefinition) => void;
  onSelectColor: (colorId: FrameColorId) => void;
  onChangeDeviceScale: (scale: number) => void;
  onToggleReflections: () => void;
  onUpdateBackground: (bg: Partial<BackgroundConfig>) => void;
  onApplyPaletteGradient: (colors: string[]) => void;
  onUpdateKenBurns: (kb: Partial<KenBurnsConfig>) => void;
  onSetSidebarTab: (tab: EditorState['activeSidebarTab']) => void;
}

export const SidePanel: React.FC<SidePanelProps> = ({
  state,
  onSelectFrame,
  onSelectColor,
  onChangeDeviceScale,
  onToggleReflections,
  onUpdateBackground,
  onApplyPaletteGradient,
  onUpdateKenBurns,
  onSetSidebarTab,
}) => {
  const { currentFrame, frameColor, background, palette, kenBurns, activeSidebarTab } =
    state;

  return (
    <aside className="side-panel">
      {/* Tab Navigation */}
      <div className="sidebar-tabs">
        <button
          className={`sidebar-tab ${activeSidebarTab === 'frame' ? 'active' : ''}`}
          onClick={() => onSetSidebarTab('frame')}
        >
          Device
        </button>
        <button
          className={`sidebar-tab ${activeSidebarTab === 'background' ? 'active' : ''}`}
          onClick={() => onSetSidebarTab('background')}
        >
          Backdrop
        </button>
        <button
          className={`sidebar-tab ${activeSidebarTab === 'motion' ? 'active' : ''}`}
          onClick={() => onSetSidebarTab('motion')}
        >
          Motion
        </button>
        <button
          className={`sidebar-tab ${activeSidebarTab === 'slideshow' ? 'active' : ''}`}
          onClick={() => onSetSidebarTab('slideshow')}
        >
          Slides
        </button>
      </div>

      <div className="sidebar-content">
        {/* TAB 1: DEVICE FRAME */}
        {activeSidebarTab === 'frame' && (
          <>
            <div>
              <div className="section-label">Device Cutout Style</div>
              <div className="frames-grid">
                {FRAME_DEFINITIONS.map((f) => (
                  <div
                    key={f.id}
                    className={`frame-card ${f.id === currentFrame.id ? 'active' : ''}`}
                    onClick={() => onSelectFrame(f)}
                  >
                    <div className="frame-card-name">{f.name}</div>
                    <div className="frame-card-desc">
                      {f.orientation} • {f.cutoutStyle}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="section-label">Hardware Color Variant</div>
              <div className="color-swatches">
                {currentFrame.availableColors.map((c) => (
                  <button
                    key={c.id}
                    className={`color-swatch ${frameColor === c.id ? 'active' : ''}`}
                    style={{ backgroundColor: c.bodyColor }}
                    onClick={() => onSelectColor(c.id)}
                    title={c.name}
                  />
                ))}
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span className="section-label">Device Scale</span>
                <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                  {Math.round(state.deviceScale * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.4"
                max="0.95"
                step="0.01"
                value={state.deviceScale}
                onChange={(e) => onChangeDeviceScale(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Glass Glare Reflection</span>
              <button
                className={`icon-btn ${state.showReflections ? 'active' : ''}`}
                onClick={onToggleReflections}
                style={{ width: 'auto', padding: '4px 10px', height: 30, fontSize: '0.75rem' }}
              >
                <Sun size={14} style={{ marginRight: 4 }} />
                {state.showReflections ? 'ON' : 'OFF'}
              </button>
            </div>
          </>
        )}

        {/* TAB 2: BACKGROUND */}
        {activeSidebarTab === 'background' && (
          <>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Wand2 size={14} color="#818cf8" />
                <span className="section-label" style={{ margin: 0 }}>
                  Content-Aware Gradients
                </span>
              </div>
              <div className="palette-suggestions">
                {palette.suggestedGradients.map((colors, i) => (
                  <button
                    key={i}
                    className="palette-btn"
                    style={{
                      background: `linear-gradient(135deg, ${colors.join(', ')})`,
                    }}
                    onClick={() => onApplyPaletteGradient(colors)}
                    title={`Gradient ${i + 1}`}
                  />
                ))}
              </div>
            </div>

            <div>
              <div className="section-label">Backdrop Type</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {(['linear-gradient', 'radial-gradient', 'solid', 'transparent'] as const).map(
                  (type) => (
                    <button
                      key={type}
                      className={`icon-btn ${background.type === type ? 'active' : ''}`}
                      onClick={() => onUpdateBackground({ type })}
                      style={{
                        flex: 1,
                        height: 34,
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        textTransform: 'capitalize',
                      }}
                    >
                      {type.replace('-gradient', '')}
                    </button>
                  )
                )}
              </div>
            </div>

            {background.type === 'linear-gradient' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span className="section-label">Gradient Angle</span>
                  <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                    {background.angle || 135}°
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="360"
                  step="5"
                  value={background.angle || 135}
                  onChange={(e) => onUpdateBackground({ angle: parseInt(e.target.value, 10) })}
                  style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
                />
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Analog Film Grain Texture</span>
              <button
                className={`icon-btn ${background.noise ? 'active' : ''}`}
                onClick={() => onUpdateBackground({ noise: !background.noise })}
                style={{ width: 'auto', padding: '4px 10px', height: 30, fontSize: '0.75rem' }}
              >
                <Sparkles size={14} style={{ marginRight: 4 }} />
                {background.noise ? 'ON' : 'OFF'}
              </button>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span className="section-label">Device Shadow Softness</span>
                <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                  {background.shadow?.blur || 48}px
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="90"
                step="2"
                value={background.shadow?.blur || 48}
                onChange={(e) =>
                  onUpdateBackground({
                    shadow: {
                      ...background.shadow!,
                      blur: parseInt(e.target.value, 10),
                    },
                  })
                }
                style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
              />
            </div>
          </>
        )}

        {/* TAB 3: KEN BURNS MOTION */}
        {activeSidebarTab === 'motion' && (
          <>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px',
                background: 'var(--bg-surface-elevated)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>Ken Burns Motion</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Cinematic pan & zoom export
                </div>
              </div>
              <button
                className={`icon-btn ${kenBurns.enabled ? 'active' : ''}`}
                onClick={() => onUpdateKenBurns({ enabled: !kenBurns.enabled })}
                style={{ width: 'auto', padding: '6px 14px', fontSize: '0.8rem', fontWeight: 600 }}
              >
                {kenBurns.enabled ? 'ENABLED' : 'DISABLED'}
              </button>
            </div>

            {kenBurns.enabled && (
              <>
                <div>
                  <div className="section-label">Motion Presets</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                    {(
                      [
                        { id: 'zoom-in', name: 'Slow Zoom In', start: { scale: 1.0, offsetX: 0, offsetY: 0 }, end: { scale: 1.18, offsetX: 0, offsetY: -0.06 } },
                        { id: 'zoom-out', name: 'Zoom Out Reveal', start: { scale: 1.25, offsetX: 0, offsetY: 0 }, end: { scale: 1.0, offsetX: 0, offsetY: 0 } },
                        { id: 'pan-left-to-right', name: 'Pan Left → Right', start: { scale: 1.15, offsetX: -0.1, offsetY: 0 }, end: { scale: 1.15, offsetX: 0.1, offsetY: 0 } },
                        { id: 'subtle-drift', name: 'Subtle Drift', start: { scale: 1.05, offsetX: -0.04, offsetY: 0.04 }, end: { scale: 1.12, offsetX: 0.04, offsetY: -0.04 } },
                      ] as const
                    ).map((preset) => (
                      <button
                        key={preset.id}
                        className={`frame-card ${kenBurns.preset === preset.id ? 'active' : ''}`}
                        onClick={() =>
                          onUpdateKenBurns({
                            preset: preset.id as KenBurnsPreset,
                            start: preset.start,
                            end: preset.end,
                          })
                        }
                        style={{ padding: '10px 8px' }}
                      >
                        <Film size={15} color="#818cf8" />
                        <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span className="section-label">Animation Duration</span>
                    <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                      {kenBurns.duration}s
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1.5"
                    max="8.0"
                    step="0.5"
                    value={kenBurns.duration}
                    onChange={(e) => onUpdateKenBurns({ duration: parseFloat(e.target.value) })}
                    style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
                  />
                </div>

                <div>
                  <div className="section-label">Easing Curve</div>
                  <select
                    value={kenBurns.easing}
                    onChange={(e) =>
                      onUpdateKenBurns({ easing: e.target.value as KenBurnsConfig['easing'] })
                    }
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.8rem',
                    }}
                  >
                    <option value="ease-in-out">Smooth (Ease In Out)</option>
                    <option value="linear">Constant (Linear)</option>
                    <option value="ease-out">Decelerate (Ease Out)</option>
                    <option value="ease-in">Accelerate (Ease In)</option>
                  </select>
                </div>
              </>
            )}
          </>
        )}

        {/* TAB 4: SLIDESHOW */}
        {activeSidebarTab === 'slideshow' && (
          <>
            <div
              style={{
                padding: '16px',
                textAlign: 'center',
                background: 'var(--bg-surface-elevated)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-secondary)',
                fontSize: '0.8rem',
              }}
            >
              Upload multiple screenshots to create a carousel slideshow with animated crossfades
              or Boomerang looping.
            </div>
          </>
        )}
      </div>
    </aside>
  );
};
