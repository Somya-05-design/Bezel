import { CropRect, FrameDefinition } from '../types';
import { FRAME_DEFINITIONS } from '../frames';

export interface SmartCropResult {
  recommendedFrame: FrameDefinition;
  cropRect: CropRect;
  matchedAspectRatio: number;
}

/**
 * Computes optimal frame match and crop rectangle based on source image dimensions.
 */
export function calculateSmartCrop(
  sourceWidth: number,
  sourceHeight: number,
  currentFrame?: FrameDefinition
): SmartCropResult {
  const sourceAspect = sourceWidth / sourceHeight;
  const isLandscape = sourceAspect > 1.1;

  // Filter candidates matching orientation
  const orientationFrames = FRAME_DEFINITIONS.filter(
    (f) => f.orientation === (isLandscape ? 'landscape' : 'portrait')
  );

  // Find the frame with the closest aspect ratio to source
  let closestFrame = orientationFrames[0] || FRAME_DEFINITIONS[0];
  let minAspectDiff = Infinity;

  for (const frame of orientationFrames) {
    const diff = Math.abs(frame.aspectRatio - sourceAspect);
    if (diff < minAspectDiff) {
      minAspectDiff = diff;
      closestFrame = frame;
    }
  }

  const activeFrame = currentFrame || closestFrame;
  const targetAspect = activeFrame.aspectRatio;

  // Calculate centered crop rect in normalized 0..1 coordinates
  let cropX = 0;
  let cropY = 0;
  let cropW = 1;
  let cropH = 1;

  if (sourceAspect > targetAspect) {
    // Source is wider than frame screen -> crop sides
    cropW = targetAspect / sourceAspect;
    cropX = (1 - cropW) / 2;
  } else {
    // Source is taller than frame screen -> crop top/bottom (center or slightly bias to top for mobile headers)
    cropH = sourceAspect / targetAspect;
    cropY = 0; // Align to top for mobile screenshots (status bar / header priority)
  }

  return {
    recommendedFrame: closestFrame,
    cropRect: {
      x: Math.max(0, cropX),
      y: Math.max(0, cropY),
      width: Math.min(1, cropW),
      height: Math.min(1, cropH),
    },
    matchedAspectRatio: sourceAspect,
  };
}
