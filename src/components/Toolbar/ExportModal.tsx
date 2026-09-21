import React, { useState } from 'react';
import {
  CheckCircle2,
  Download,
  Film,
  FileImage,
  Loader2,
  Sparkles,
  Video,
  X,
} from 'lucide-react';
import { EditorState } from '../../core/state/store';
import { ExportFormat, ExportProgress } from '../../core/types';
import {
  exportKenBurns,
  exportSlideshow,
  exportStaticImage,
  exportVideoInFrame,
} from '../../core/engine';

interface ExportModalProps {
  state: EditorState;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ state, onClose }) => {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>(
    state.sourceMedia?.type === 'video' || state.kenBurns.enabled ? 'mp4' : 'png'
  );
  const [scaleMultiplier, setScaleMultiplier] = useState<number>(1);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const handleStartExport = async () => {
    setIsExporting(true);
    setProgress({
      stage: 'preparing',
      currentFrame: 0,
      totalFrames: 100,
      percentage: 5,
      message: 'Preparing assets...',
    });

    try {
      const targetW = state.exportPreset.width * scaleMultiplier;
      const targetH = state.exportPreset.height * scaleMultiplier;

      const baseOptions = {
        sourceElement: state.sourceMedia?.element || document.createElement('canvas'),
        frame: state.currentFrame,
        frameColor: state.frameColor,
        background: state.background,
        crop: state.crop,
        transform: state.transform,
        annotations: state.annotations,
        canvasWidth: targetW,
        canvasHeight: targetH,
        deviceScale: state.deviceScale,
        devicePosition: state.devicePosition,
        showReflections: state.showReflections,
      };

      let blob: Blob;

      if (state.sourceMedia?.type === 'video') {
        blob = await exportVideoInFrame(
          state.sourceMedia.element as HTMLVideoElement,
          baseOptions,
          selectedFormat as 'mp4' | 'gif' | 'boomerang-gif',
          30,
          setProgress
        );
      } else if (state.kenBurns.enabled) {
        blob = await exportKenBurns(
          baseOptions,
          state.kenBurns,
          selectedFormat as 'mp4' | 'gif' | 'boomerang-gif',
          setProgress
        );
      } else if (state.slideshow.enabled && state.slideshow.slides.length > 0) {
        blob = await exportSlideshow(
          baseOptions,
          state.slideshow,
          selectedFormat as 'mp4' | 'gif' | 'boomerang-gif',
          20,
          setProgress
        );
      } else {
        blob = await exportStaticImage(
          baseOptions,
          selectedFormat as 'png' | 'jpeg' | 'webp',
          state.exportQuality
        );
      }

      // Create download trigger
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);

      const ext =
        selectedFormat === 'mp4'
          ? 'mp4'
          : selectedFormat === 'gif' || selectedFormat === 'boomerang-gif'
          ? 'gif'
          : selectedFormat;
      const a = document.createElement('a');
      a.href = url;
      a.download = `bezel-mockup-${Date.now()}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setProgress({
        stage: 'done',
        currentFrame: 100,
        totalFrames: 100,
        percentage: 100,
        message: 'Saved to your Downloads!',
      });
    } catch (err: any) {
      console.error('Export failed:', err);
      setProgress({
        stage: 'error',
        currentFrame: 0,
        totalFrames: 100,
        percentage: 0,
        message: `Export error: ${err?.message || 'Unknown error'}`,
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Export Studio</div>
          <button className="icon-btn" onClick={onClose} style={{ width: 32, height: 32 }}>
            <X size={16} />
          </button>
        </div>

        {/* Format Selection */}
        <div>
          <div className="section-label">Output Format</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {[
              { id: 'png', name: 'PNG Image', icon: FileImage, desc: 'Lossless crisp' },
              { id: 'mp4', name: 'MP4 Video', icon: Video, desc: 'Universal video' },
              { id: 'gif', name: 'GIF Animation', icon: Film, desc: 'Looping GIF' },
              { id: 'boomerang-gif', name: 'Boomerang GIF', icon: Film, desc: 'Forward + Reverse' },
              { id: 'jpeg', name: 'JPEG', icon: FileImage, desc: 'Small file' },
              { id: 'webp', name: 'WebP', icon: FileImage, desc: 'Modern web' },
            ].map((fmt) => {
              const Icon = fmt.icon;
              return (
                <button
                  key={fmt.id}
                  className={`frame-card ${selectedFormat === fmt.id ? 'active' : ''}`}
                  onClick={() => setSelectedFormat(fmt.id as ExportFormat)}
                  style={{ padding: '10px 8px' }}
                >
                  <Icon size={18} color="#818cf8" />
                  <div style={{ fontSize: '0.78rem', fontWeight: 600 }}>{fmt.name}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{fmt.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Resolution Quality Multiplier */}
        <div>
          <div className="section-label">Resolution Scale</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { scale: 1, label: '1x Standard', res: `${state.exportPreset.width} × ${state.exportPreset.height}` },
              { scale: 2, label: '2x Retina HD', res: `${state.exportPreset.width * 2} × ${state.exportPreset.height * 2}` },
            ].map((opt) => (
              <button
                key={opt.scale}
                className={`icon-btn ${scaleMultiplier === opt.scale ? 'active' : ''}`}
                onClick={() => setScaleMultiplier(opt.scale)}
                style={{
                  flex: 1,
                  height: 44,
                  flexDirection: 'column',
                  gap: 2,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                }}
              >
                <span>{opt.label}</span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{opt.res}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Progress Bar */}
        {progress && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
              <span style={{ color: progress.stage === 'error' ? 'var(--color-danger)' : 'var(--text-secondary)' }}>
                {progress.message}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                {Math.round(progress.percentage)}%
              </span>
            </div>
            <div className="progress-container">
              <div className="progress-bar-fill" style={{ width: `${progress.percentage}%` }} />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <button
            className="icon-btn"
            onClick={onClose}
            style={{ flex: 1, height: 44, fontWeight: 600 }}
          >
            Cancel
          </button>
          <button
            className="gradient-btn"
            disabled={isExporting}
            onClick={handleStartExport}
            style={{ flex: 2, height: 44, justifyContent: 'center' }}
          >
            {isExporting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Processing...</span>
              </>
            ) : progress?.stage === 'done' ? (
              <>
                <CheckCircle2 size={18} />
                <span>Download Again</span>
              </>
            ) : (
              <>
                <Download size={18} />
                <span>Render & Download</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
