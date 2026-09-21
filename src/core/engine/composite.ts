import {
  AnnotationItem,
  BackgroundConfig,
  CompositeFrameOptions,
} from '../types';
import {
  drawCutoutArt,
  drawDeviceFrameArt,
  drawScreenGlassReflection,
  getScreenClipPath,
} from '../frames';

/**
 * Draws background with linear/radial gradients, solid color, image, and optional noise.
 */
export function drawBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  config: BackgroundConfig
): void {
  ctx.save();

  if (config.type === 'transparent') {
    ctx.clearRect(0, 0, width, height);
    ctx.restore();
    return;
  }

  if (config.type === 'solid') {
    ctx.fillStyle = config.colors[0] || '#0f172a';
    ctx.fillRect(0, 0, width, height);
  } else if (config.type === 'radial-gradient') {
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.max(width, height) * 0.8;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    const colors = config.colors.length > 0 ? config.colors : ['#3b82f6', '#0f172a'];
    colors.forEach((color, i) => {
      grad.addColorStop(i / (colors.length - 1 || 1), color);
    });
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  } else if (config.type === 'image' && config.imageElement) {
    // Custom background image with optional blur
    if (config.blur && config.blur > 0) {
      ctx.filter = `blur(${config.blur}px)`;
    }
    // Cover fill
    const img = config.imageElement;
    const imgAspect = img.width / img.height;
    const canvasAspect = width / height;
    let sw = img.width;
    let sh = img.height;
    let sx = 0;
    let sy = 0;

    if (imgAspect > canvasAspect) {
      sw = img.height * canvasAspect;
      sx = (img.width - sw) / 2;
    } else {
      sh = img.width / canvasAspect;
      sy = (img.height - sh) / 2;
    }

    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, width, height);
    ctx.filter = 'none';
  } else {
    // Linear gradient (default)
    const angle = ((config.angle || 135) * Math.PI) / 180;
    const x1 = width / 2 - (Math.cos(angle) * width) / 2;
    const y1 = height / 2 - (Math.sin(angle) * height) / 2;
    const x2 = width / 2 + (Math.cos(angle) * width) / 2;
    const y2 = height / 2 + (Math.sin(angle) * height) / 2;

    const grad = ctx.createLinearGradient(x1, y1, x2, y2);
    const colors = config.colors.length > 0 ? config.colors : ['#6366f1', '#a855f7', '#ec4899'];
    colors.forEach((color, i) => {
      grad.addColorStop(i / (colors.length - 1 || 1), color);
    });

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  }

  // Subtle grain / noise overlay for visual richness
  if (config.noise) {
    drawNoiseOverlay(ctx, width, height, 0.04);
  }

  ctx.restore();
}

/**
 * Creates a subtle procedural grain noise texture.
 */
function drawNoiseOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  opacity: number
): void {
  const noiseCanvas = document.createElement('canvas');
  noiseCanvas.width = 128;
  noiseCanvas.height = 128;
  const nCtx = noiseCanvas.getContext('2d');
  if (!nCtx) return;

  const imgData = nCtx.createImageData(128, 128);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const val = Math.floor(Math.random() * 255);
    data[i] = val;
    data[i + 1] = val;
    data[i + 2] = val;
    data[i + 3] = 255;
  }
  nCtx.putImageData(imgData, 0, 0);

  ctx.save();
  ctx.globalAlpha = opacity;
  const pattern = ctx.createPattern(noiseCanvas, 'repeat');
  if (pattern) {
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, width, height);
  }
  ctx.restore();
}

/**
 * Renders annotations on top of canvas.
 */
export function drawAnnotations(
  ctx: CanvasRenderingContext2D,
  annotations: AnnotationItem[]
): void {
  if (!annotations || annotations.length === 0) return;

  ctx.save();
  for (const item of annotations) {
    ctx.strokeStyle = item.color;
    ctx.fillStyle = item.color;
    ctx.lineWidth = item.strokeWidth || 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (item.tool === 'pen' && item.points && item.points.length > 1) {
      ctx.beginPath();
      ctx.moveTo(item.points[0].x, item.points[0].y);
      for (let i = 1; i < item.points.length; i++) {
        ctx.lineTo(item.points[i].x, item.points[i].y);
      }
      ctx.stroke();
    } else if (item.tool === 'arrow' && item.startPoint && item.endPoint) {
      const { x: sx, y: sy } = item.startPoint;
      const { x: ex, y: ey } = item.endPoint;
      const headLen = Math.max(12, item.strokeWidth * 3);
      const angle = Math.atan2(ey - sy, ex - sx);

      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.stroke();

      // Arrow head
      ctx.beginPath();
      ctx.moveTo(ex, ey);
      ctx.lineTo(
        ex - headLen * Math.cos(angle - Math.PI / 6),
        ey - headLen * Math.sin(angle - Math.PI / 6)
      );
      ctx.lineTo(
        ex - headLen * Math.cos(angle + Math.PI / 6),
        ey - headLen * Math.sin(angle + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fill();
    } else if (item.tool === 'rectangle' && item.rect) {
      ctx.beginPath();
      ctx.rect(item.rect.x, item.rect.y, item.rect.width, item.rect.height);
      ctx.stroke();
    } else if (item.tool === 'circle' && item.rect) {
      const rx = item.rect.width / 2;
      const ry = item.rect.height / 2;
      const cx = item.rect.x + rx;
      const cy = item.rect.y + ry;
      ctx.beginPath();
      ctx.ellipse(cx, cy, Math.abs(rx), Math.abs(ry), 0, 0, Math.PI * 2);
      ctx.stroke();
    } else if (item.tool === 'text' && item.text && item.startPoint) {
      ctx.font = `${item.fontSize || 24}px ${item.fontFamily || 'Inter, sans-serif'}`;
      ctx.fillText(item.text, item.startPoint.x, item.startPoint.y);
    }
  }
  ctx.restore();
}

/**
 * Core composite function: renders a single frame at high resolution with full styling.
 * Returns the composited HTMLCanvasElement.
 */
export function compositeFrame(
  options: CompositeFrameOptions,
  targetCanvas?: HTMLCanvasElement
): HTMLCanvasElement {
  const {
    sourceElement,
    frame,
    frameColor,
    background,
    crop,
    transform,
    annotations,
    canvasWidth,
    canvasHeight,
    deviceScale = 0.82,
    devicePosition = { x: 0, y: 0 },
    showReflections = true,
  } = options;

  const canvas = targetCanvas || document.createElement('canvas');
  if (canvas.width !== canvasWidth) canvas.width = canvasWidth;
  if (canvas.height !== canvasHeight) canvas.height = canvasHeight;

  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) {
    throw new Error('Failed to get 2D canvas context for compositeFrame');
  }

  // Clear canvas
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  // 1. Draw Background
  drawBackground(ctx, canvasWidth, canvasHeight, background);

  // Calculate device placement and scaling
  const frameAspect = frame.outerWidth / frame.outerHeight;
  const targetAspect = canvasWidth / canvasHeight;

  let baseScale: number;
  if (frameAspect > targetAspect) {
    // Width-constrained
    baseScale = (canvasWidth * deviceScale) / frame.outerWidth;
  } else {
    // Height-constrained
    baseScale = (canvasHeight * deviceScale) / frame.outerHeight;
  }

  const renderedWidth = frame.outerWidth * baseScale;
  const renderedHeight = frame.outerHeight * baseScale;

  const posX = (canvasWidth - renderedWidth) / 2 + devicePosition.x;
  const posY = (canvasHeight - renderedHeight) / 2 + devicePosition.y;

  ctx.save();
  ctx.translate(posX, posY);
  ctx.scale(baseScale, baseScale);

  // 2. Draw Realistic Device Drop Shadow
  if (background.shadow?.enabled ?? true) {
    const shadowOpacity = background.shadow?.opacity ?? 0.35;
    const shadowBlur = (background.shadow?.blur ?? 48) / baseScale;
    const shadowOffset = (background.shadow?.offsetY ?? 24) / baseScale;

    ctx.save();
    ctx.shadowColor = `rgba(0, 0, 0, ${shadowOpacity})`;
    ctx.shadowBlur = shadowBlur;
    ctx.shadowOffsetY = shadowOffset;
    ctx.beginPath();
    ctx.roundRect(0, 0, frame.outerWidth, frame.outerHeight, frame.outerCornerRadius);
    ctx.fillStyle = '#000000';
    ctx.fill();
    ctx.restore();
  }

  // 3. Draw Device Chassis & Bezel
  drawDeviceFrameArt(ctx, frame, frameColor);

  // 4. Clip to Screen Area and Draw Source Content
  const screenPath = getScreenClipPath(frame);
  const { x: sx, y: sy, width: sw, height: sh } = frame.screenBounds;

  ctx.save();
  ctx.clip(screenPath);

  // Fill black screen background first
  ctx.fillStyle = '#000000';
  ctx.fillRect(sx, sy, sw, sh);

  // Calculate source aspect ratio & transform
  const sourceW =
    'videoWidth' in sourceElement && sourceElement.videoWidth
      ? sourceElement.videoWidth
      : 'naturalWidth' in sourceElement && sourceElement.naturalWidth
      ? sourceElement.naturalWidth
      : sourceElement.width;

  const sourceH =
    'videoHeight' in sourceElement && sourceElement.videoHeight
      ? sourceElement.videoHeight
      : 'naturalHeight' in sourceElement && sourceElement.naturalHeight
      ? sourceElement.naturalHeight
      : sourceElement.height;

  if (sourceW > 0 && sourceH > 0) {
    ctx.save();
    ctx.translate(sx + sw / 2, sy + sh / 2);

    // Apply Ken Burns / interactive pan & zoom transform
    const scaleFactor = transform?.scale ?? 1.0;
    const offsetX = (transform?.offsetX ?? 0) * (sw / 2);
    const offsetY = (transform?.offsetY ?? 0) * (sh / 2);

    ctx.translate(offsetX, offsetY);
    ctx.scale(scaleFactor, scaleFactor);

    // Calculate cover fit inside screen
    const screenAspect = sw / sh;
    const srcAspect = sourceW / sourceH;

    let drawW = sw;
    let drawH = sh;

    if (crop) {
      // Manual crop coordinates
      const cropSrcX = crop.x * sourceW;
      const cropSrcY = crop.y * sourceH;
      const cropSrcW = crop.width * sourceW;
      const cropSrcH = crop.height * sourceH;

      ctx.drawImage(
        sourceElement,
        cropSrcX,
        cropSrcY,
        cropSrcW,
        cropSrcH,
        -sw / 2,
        -sh / 2,
        sw,
        sh
      );
    } else {
      if (srcAspect > screenAspect) {
        drawH = sh;
        drawW = sh * srcAspect;
      } else {
        drawW = sw;
        drawH = sw / srcAspect;
      }

      ctx.drawImage(sourceElement, -drawW / 2, -drawH / 2, drawW, drawH);
    }

    ctx.restore();
  }

  // Draw Screen Annotations if any
  if (annotations && annotations.length > 0) {
    drawAnnotations(ctx, annotations);
  }

  ctx.restore(); // Restore clip

  // 5. Draw Physical Cutout Art (Dynamic Island pill, camera punch hole, notch)
  const colorOpt =
    frame.availableColors.find((c) => c.id === frameColor) ||
    frame.availableColors[0];
  drawCutoutArt(ctx, frame, colorOpt);

  // 6. Draw Subtle Glass Reflection
  if (showReflections) {
    drawScreenGlassReflection(ctx, frame);
  }

  ctx.restore(); // Restore device translation and scale

  return canvas;
}
