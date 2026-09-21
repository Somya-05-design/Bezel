import React, { useEffect, useState } from 'react';
import { EditorState, INITIAL_STATE } from './core/state/store';
import {
  AnnotationItem,
  AnnotationTool,
  BackgroundConfig,
  ExportPreset,
  FrameColorId,
  FrameDefinition,
  KenBurnsConfig,
} from './core/types';
import { calculateSmartCrop, extractPaletteFromImage } from './core/engine';
import { TopNav } from './components/Toolbar/TopNav';
import { CanvasPreview } from './components/Canvas/CanvasPreview';
import { BottomToolbar } from './components/Toolbar/BottomToolbar';
import { SidePanel } from './components/Toolbar/SidePanel';
import { ExportModal } from './components/Toolbar/ExportModal';
import { KeyboardShortcutsModal } from './components/Toolbar/KeyboardShortcutsModal';
import './styles/index.css';
import './styles/components.css';

export const App: React.FC = () => {
  const [state, setState] = useState<EditorState>(INITIAL_STATE);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState<boolean>(false);

  // File Upload Handler (Images & Screen Recording Videos)
  const handleUploadFile = (file: File) => {
    const isVideo = file.type.startsWith('video/');
    const url = URL.createObjectURL(file);

    if (isVideo) {
      const video = document.createElement('video');
      video.src = url;
      video.crossOrigin = 'anonymous';
      video.loop = true;
      video.muted = true;
      video.playsInline = true;

      video.onloadedmetadata = () => {
        video.play().catch(() => {});

        let activeFrame = state.currentFrame;
        let cropRect = state.crop;

        if (state.smartCropEnabled) {
          const smart = calculateSmartCrop(video.videoWidth, video.videoHeight, state.currentFrame);
          activeFrame = smart.recommendedFrame;
          cropRect = smart.cropRect;
        }

        setState((prev) => ({
          ...prev,
          currentFrame: activeFrame,
          crop: cropRect,
          sourceMedia: {
            id: `media_${Date.now()}`,
            type: 'video',
            url,
            element: video,
            width: video.videoWidth,
            height: video.videoHeight,
            duration: video.duration,
            fileName: file.name,
          },
        }));
      };
    } else {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = url;

      img.onload = () => {
        // 1. Extract content-aware dominant colors
        const palette = extractPaletteFromImage(img);

        // 2. Calculate smart crop and best-fit frame
        let activeFrame = state.currentFrame;
        let cropRect = state.crop;

        if (state.smartCropEnabled) {
          const smart = calculateSmartCrop(img.width, img.height, state.currentFrame);
          activeFrame = smart.recommendedFrame;
          cropRect = smart.cropRect;
        }

        setState((prev) => ({
          ...prev,
          currentFrame: activeFrame,
          crop: cropRect,
          palette,
          background: {
            ...prev.background,
            colors: palette.suggestedGradients[0] || prev.background.colors,
          },
          sourceMedia: {
            id: `media_${Date.now()}`,
            type: 'image',
            url,
            element: img,
            width: img.width,
            height: img.height,
            fileName: file.name,
          },
        }));
      };
    }
  };

  // Tool Selection & Annotations
  const handleSelectTool = (tool: AnnotationTool) => {
    setState((prev) => ({ ...prev, activeTool: tool }));
  };

  const handleAddAnnotation = (item: AnnotationItem) => {
    setState((prev) => ({
      ...prev,
      undoStack: [...prev.undoStack, prev.annotations],
      redoStack: [],
      annotations: [...prev.annotations, item],
    }));
  };

  const handleUndo = () => {
    setState((prev) => {
      if (prev.undoStack.length === 0) return prev;
      const previousAnnotations = prev.undoStack[prev.undoStack.length - 1];
      const newUndoStack = prev.undoStack.slice(0, -1);
      return {
        ...prev,
        annotations: previousAnnotations,
        undoStack: newUndoStack,
        redoStack: [...prev.redoStack, prev.annotations],
      };
    });
  };

  const handleRedo = () => {
    setState((prev) => {
      if (prev.redoStack.length === 0) return prev;
      const nextAnnotations = prev.redoStack[prev.redoStack.length - 1];
      const newRedoStack = prev.redoStack.slice(0, -1);
      return {
        ...prev,
        annotations: nextAnnotations,
        undoStack: [...prev.undoStack, prev.annotations],
        redoStack: newRedoStack,
      };
    });
  };

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        setShowExportModal(true);
      } else if (e.shiftKey && e.key.toUpperCase() === 'A') {
        e.preventDefault();
        setState((prev) => ({ ...prev, smartCropEnabled: !prev.smartCropEnabled }));
      } else if (e.key === '?') {
        e.preventDefault();
        setShowShortcutsModal((prev) => !prev);
      } else if (e.key.toLowerCase() === 'v') {
        handleSelectTool('select');
      } else if (e.key.toLowerCase() === 'c') {
        handleSelectTool('crop');
      } else if (e.key.toLowerCase() === 'p') {
        handleSelectTool('pen');
      } else if (e.key.toLowerCase() === 'a' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
        handleSelectTool('arrow');
      } else if (e.key.toLowerCase() === 't') {
        handleSelectTool('text');
      } else if (e.key.toLowerCase() === 'r') {
        handleSelectTool('rectangle');
      } else if (e.key.toLowerCase() === 'o') {
        handleSelectTool('circle');
      } else if (e.key.toLowerCase() === 'b') {
        handleSelectTool('redact');
      } else if (e.key === '=' || e.key === '+') {
        setState((prev) => ({ ...prev, zoom: Math.min(2.5, prev.zoom + 0.1) }));
      } else if (e.key === '-') {
        setState((prev) => ({ ...prev, zoom: Math.max(0.4, prev.zoom - 0.1) }));
      } else if (e.key === '0') {
        setState((prev) => ({ ...prev, zoom: 1.0 }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="app-container">
      {/* Top Header */}
      <TopNav
        state={state}
        onUploadFile={handleUploadFile}
        onSelectPreset={(preset: ExportPreset) => setState((prev) => ({ ...prev, exportPreset: preset }))}
        onToggleSmartCrop={() => setState((prev) => ({ ...prev, smartCropEnabled: !prev.smartCropEnabled }))}
        onOpenExportModal={() => setShowExportModal(true)}
        onOpenShortcutsModal={() => setShowShortcutsModal(true)}
      />

      {/* Main Workspace */}
      <div className="workspace-layout">
        {/* Canvas Center Preview */}
        <CanvasPreview
          state={state}
          onAddAnnotation={handleAddAnnotation}
          onUploadFile={handleUploadFile}
        />

        {/* Floating Bottom Toolbar */}
        <BottomToolbar
          activeTool={state.activeTool}
          onSelectTool={handleSelectTool}
          annotationColor={state.annotationColor}
          onChangeColor={(color) => setState((prev) => ({ ...prev, annotationColor: color }))}
          canUndo={state.undoStack.length > 0}
          canRedo={state.redoStack.length > 0}
          onUndo={handleUndo}
          onRedo={handleRedo}
          zoom={state.zoom}
          onZoomIn={() => setState((prev) => ({ ...prev, zoom: Math.min(2.5, prev.zoom + 0.1) }))}
          onZoomOut={() => setState((prev) => ({ ...prev, zoom: Math.max(0.4, prev.zoom - 0.1) }))}
          onResetZoom={() => setState((prev) => ({ ...prev, zoom: 1.0 }))}
        />

        {/* Right Configuration Panel */}
        <SidePanel
          state={state}
          onSelectFrame={(frame: FrameDefinition) => setState((prev) => ({ ...prev, currentFrame: frame }))}
          onSelectColor={(colorId: FrameColorId) => setState((prev) => ({ ...prev, frameColor: colorId }))}
          onChangeDeviceScale={(scale: number) => setState((prev) => ({ ...prev, deviceScale: scale }))}
          onToggleReflections={() => setState((prev) => ({ ...prev, showReflections: !prev.showReflections }))}
          onUpdateBackground={(bg: Partial<BackgroundConfig>) =>
            setState((prev) => ({ ...prev, background: { ...prev.background, ...bg } }))
          }
          onApplyPaletteGradient={(colors: string[]) =>
            setState((prev) => ({ ...prev, background: { ...prev.background, colors } }))
          }
          onUpdateKenBurns={(kb: Partial<KenBurnsConfig>) =>
            setState((prev) => ({ ...prev, kenBurns: { ...prev.kenBurns, ...kb } }))
          }
          onSetSidebarTab={(tab) => setState((prev) => ({ ...prev, activeSidebarTab: tab }))}
        />
      </div>

      {/* Export Studio Modal */}
      {showExportModal && <ExportModal state={state} onClose={() => setShowExportModal(false)} />}

      {/* Keyboard Shortcuts Cheat Sheet */}
      {showShortcutsModal && <KeyboardShortcutsModal onClose={() => setShowShortcutsModal(false)} />}
    </div>
  );
};

export default App;
