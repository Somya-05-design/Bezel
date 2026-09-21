export type CutoutStyle =
  | 'dynamic-island'
  | 'punch-hole'
  | 'notch'
  | 'waterdrop'
  | 'bezel-minimal'
  | 'tablet-modern';

export type FrameOrientation = 'portrait' | 'landscape';

export type FrameColorId =
  | 'midnight'
  | 'silver'
  | 'titanium-natural'
  | 'deep-purple'
  | 'cosmic-black'
  | 'champagne-gold';

export interface FrameColorOption {
  id: FrameColorId;
  name: string;
  bodyColor: string;
  rimColor: string;
  bezelColor: string;
  accentHighlight: string;
}

export interface ScreenBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  borderRadius: number;
}

export interface CutoutDefinition {
  type: 'dynamic-island' | 'punch-hole' | 'notch' | 'waterdrop' | 'none';
  x: number;
  y: number;
  width: number;
  height: number;
  radius?: number;
  path?: string; // Optional custom SVG path
}

export interface FrameDefinition {
  id: string;
  name: string;
  cutoutStyle: CutoutStyle;
  orientation: FrameOrientation;
  aspectRatio: number; // Screen width / height
  outerWidth: number;
  outerHeight: number;
  screenBounds: ScreenBounds;
  cutout: CutoutDefinition;
  availableColors: FrameColorOption[];
  defaultColorId: FrameColorId;
  bezelThickness: number;
  outerCornerRadius: number;
}

export type BackgroundType =
  | 'solid'
  | 'linear-gradient'
  | 'radial-gradient'
  | 'mesh-gradient'
  | 'image'
  | 'transparent';

export interface ExtractedPalette {
  dominant: string;
  secondary: string;
  accent: string;
  vibrant: string;
  darkMuted: string;
  lightMuted: string;
  suggestedGradients: string[][];
}

export interface BackgroundConfig {
  type: BackgroundType;
  colors: string[];
  angle?: number; // 0 - 360 for linear gradients
  imageUrl?: string;
  imageElement?: HTMLImageElement | null;
  blur?: number; // 0 - 40px
  noise?: boolean; // Subtle grain texture
  padding?: number; // Padding around device mockup in % or px
  shadow?: {
    enabled: boolean;
    blur: number;
    offsetY: number;
    opacity: number;
    color: string;
  };
}

export interface TransformKeyframe {
  scale: number; // 1.0 = fit, > 1.0 = zoomed
  offsetX: number; // Normalized -1.0 to 1.0
  offsetY: number;
}

export type KenBurnsEasing = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
export type KenBurnsPreset =
  | 'zoom-in'
  | 'zoom-out'
  | 'pan-left-to-right'
  | 'pan-right-to-left'
  | 'subtle-drift'
  | 'custom';

export interface KenBurnsConfig {
  enabled: boolean;
  start: TransformKeyframe;
  end: TransformKeyframe;
  duration: number; // seconds
  fps: number; // 30 or 60
  easing: KenBurnsEasing;
  preset: KenBurnsPreset;
}

export type AnnotationTool =
  | 'select'
  | 'crop'
  | 'pen'
  | 'arrow'
  | 'text'
  | 'rectangle'
  | 'circle'
  | 'redact'
  | 'highlight';

export interface Point {
  x: number;
  y: number;
}

export interface AnnotationItem {
  id: string;
  tool: AnnotationTool;
  color: string;
  strokeWidth: number;
  points?: Point[];
  startPoint?: Point;
  endPoint?: Point;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  blurRadius?: number; // For redact / pixelate
  rect?: { x: number; y: number; width: number; height: number };
}

export interface CropRect {
  x: number; // Normalized 0..1 in source image coordinates
  y: number;
  width: number;
  height: number;
}

export interface MediaSourceItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  element?: HTMLImageElement | HTMLVideoElement;
  width: number;
  height: number;
  duration?: number; // For video or slide duration in seconds
  fileName?: string;
}

export interface SlideshowConfig {
  enabled: boolean;
  slides: MediaSourceItem[];
  defaultSlideDuration: number; // seconds per slide
  transition: 'cut' | 'crossfade';
  transitionDuration: number; // seconds
  loop: boolean;
  boomerang: boolean;
}

export type ExportFormat = 'png' | 'jpeg' | 'webp' | 'mp4' | 'gif' | 'boomerang-gif';

export interface ExportPreset {
  id: string;
  name: string;
  category: 'social' | 'store' | 'custom' | 'original';
  width: number;
  height: number;
  scaleFactor: number;
}

export interface ExportProgress {
  stage: 'preparing' | 'rendering' | 'encoding' | 'finalizing' | 'done' | 'error';
  currentFrame: number;
  totalFrames: number;
  percentage: number;
  message?: string;
}

export interface CompositeFrameOptions {
  sourceElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement;
  frame: FrameDefinition;
  frameColor: FrameColorId;
  background: BackgroundConfig;
  crop?: CropRect | null;
  transform?: TransformKeyframe;
  annotations?: AnnotationItem[];
  canvasWidth: number;
  canvasHeight: number;
  deviceScale?: number; // Scaling factor of the device within background
  devicePosition?: { x: number; y: number }; // Offset from center
  showReflections?: boolean;
}
