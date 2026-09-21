import {
  AnnotationItem,
  AnnotationTool,
  BackgroundConfig,
  CropRect,
  ExportFormat,
  ExportPreset,
  ExtractedPalette,
  FrameColorId,
  FrameDefinition,
  KenBurnsConfig,
  MediaSourceItem,
  SlideshowConfig,
  TransformKeyframe,
} from '../types';
import { FRAME_DEFINITIONS } from '../frames';
import { EXPORT_PRESETS } from './presets';
import { getDefaultFallbackPalette } from '../engine/color-sampler';

export interface EditorState {
  // Frame
  currentFrame: FrameDefinition;
  frameColor: FrameColorId;
  deviceScale: number;
  devicePosition: { x: number; y: number };
  showReflections: boolean;

  // Background
  background: BackgroundConfig;
  palette: ExtractedPalette;

  // Source media
  sourceMedia: MediaSourceItem | null;
  crop: CropRect | null;
  smartCropEnabled: boolean;
  transform: TransformKeyframe;

  // Ken Burns Motion
  kenBurns: KenBurnsConfig;

  // Slideshow
  slideshow: SlideshowConfig;

  // Annotations
  activeTool: AnnotationTool;
  annotationColor: string;
  annotationStrokeWidth: number;
  annotationFontSize: number;
  annotations: AnnotationItem[];

  // Undo / Redo history
  undoStack: AnnotationItem[][];
  redoStack: AnnotationItem[][];

  // Export
  exportPreset: ExportPreset;
  exportFormat: ExportFormat;
  exportQuality: number;

  // UI state
  zoom: number;
  isExporting: boolean;
  showShortcutsModal: boolean;
  activeSidebarTab: 'frame' | 'background' | 'motion' | 'slideshow' | 'export';
}

export const INITIAL_STATE: EditorState = {
  currentFrame: FRAME_DEFINITIONS[0], // Dynamic Island portrait
  frameColor: 'midnight',
  deviceScale: 0.84,
  devicePosition: { x: 0, y: 0 },
  showReflections: true,

  background: {
    type: 'linear-gradient',
    colors: ['#4f46e5', '#7c3aed', '#db2777'],
    angle: 135,
    blur: 0,
    noise: true,
    shadow: {
      enabled: true,
      blur: 50,
      offsetY: 28,
      opacity: 0.45,
      color: '#000000',
    },
  },
  palette: getDefaultFallbackPalette(),

  sourceMedia: null,
  crop: null,
  smartCropEnabled: true,
  transform: { scale: 1.0, offsetX: 0, offsetY: 0 },

  kenBurns: {
    enabled: false,
    start: { scale: 1.0, offsetX: 0, offsetY: 0 },
    end: { scale: 1.18, offsetX: 0, offsetY: -0.06 },
    duration: 3.5,
    fps: 30,
    easing: 'ease-in-out',
    preset: 'zoom-in',
  },

  slideshow: {
    enabled: false,
    slides: [],
    defaultSlideDuration: 2.5,
    transition: 'crossfade',
    transitionDuration: 0.5,
    loop: true,
    boomerang: false,
  },

  activeTool: 'select',
  annotationColor: '#ef4444',
  annotationStrokeWidth: 4,
  annotationFontSize: 24,
  annotations: [],

  undoStack: [],
  redoStack: [],

  exportPreset: EXPORT_PRESETS[0],
  exportFormat: 'png',
  exportQuality: 0.95,

  zoom: 1.0,
  isExporting: false,
  showShortcutsModal: false,
  activeSidebarTab: 'frame',
};
