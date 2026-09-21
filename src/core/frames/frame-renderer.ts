import { FrameColorId, FrameColorOption, FrameDefinition } from '../types';

/**
 * Creates an SVG Path string for the frame's active screen area, including cutout geometry.
 */
export function getScreenClipPath(frame: FrameDefinition): Path2D {
  const path = new Path2D();
  const { x, y, width, height, borderRadius } = frame.screenBounds;

  // Add the rounded screen rectangle
  path.roundRect(x, y, width, height, borderRadius);

  return path;
}

/**
 * Renders the cutout (e.g. Dynamic Island pill, notch, punch hole) directly onto the canvas.
 * This is drawn over the screen content to realistically emulate physical hardware cutouts.
 */
export function drawCutoutArt(
  ctx: CanvasRenderingContext2D,
  frame: FrameDefinition,
  color: FrameColorOption
): void {
  const { cutout } = frame;
  if (cutout.type === 'none') return;

  ctx.save();

  if (cutout.type === 'dynamic-island') {
    // Dynamic Island pill
    const pillX = cutout.x;
    const pillY = cutout.y;
    const pillW = cutout.width;
    const pillH = cutout.height;
    const pillR = cutout.radius || pillH / 2;

    // Dark pill body
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.roundRect(pillX, pillY, pillW, pillH, pillR);
    ctx.fill();

    // Subtle edge highlight
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Front camera lens (left/center)
    const isPortrait = frame.orientation === 'portrait';
    const camX = isPortrait ? pillX + pillW - 32 : pillX + 32;
    const camY = pillY + pillH / 2;
    const camR = 11;

    ctx.beginPath();
    ctx.arc(camX, camY, camR, 0, Math.PI * 2);
    ctx.fillStyle = '#060a12';
    ctx.fill();

    // Sapphire lens reflection
    const lensGrad = ctx.createRadialGradient(
      camX - 2,
      camY - 2,
      1,
      camX,
      camY,
      camR
    );
    lensGrad.addColorStop(0, 'rgba(64, 120, 220, 0.45)');
    lensGrad.addColorStop(0.6, 'rgba(16, 32, 64, 0.8)');
    lensGrad.addColorStop(1, '#05070c');
    ctx.fillStyle = lensGrad;
    ctx.beginPath();
    ctx.arc(camX, camY, camR - 2, 0, Math.PI * 2);
    ctx.fill();

    // Sensor dot
    const sensorX = isPortrait ? pillX + 34 : pillX + pillW - 34;
    ctx.beginPath();
    ctx.arc(sensorX, camY, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#0a0b0e';
    ctx.fill();
  } else if (cutout.type === 'punch-hole') {
    // Punch-hole camera
    const cx = cutout.x + cutout.width / 2;
    const cy = cutout.y + cutout.height / 2;
    const r = (cutout.radius || cutout.width / 2);

    // Outer dark ring
    ctx.beginPath();
    ctx.arc(cx, cy, r + 2, 0, Math.PI * 2);
    ctx.fillStyle = '#000000';
    ctx.fill();

    // Camera reflection
    const grad = ctx.createRadialGradient(cx - 2, cy - 2, 1, cx, cy, r);
    grad.addColorStop(0, 'rgba(80, 140, 240, 0.5)');
    grad.addColorStop(0.7, '#070b14');
    grad.addColorStop(1, '#000000');

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    ctx.stroke();
  } else if (cutout.type === 'notch') {
    // Classic trapezoidal notch
    const nx = cutout.x;
    const ny = cutout.y;
    const nw = cutout.width;
    const nh = cutout.height;
    const nr = cutout.radius || 18;

    ctx.beginPath();
    ctx.moveTo(nx, ny);
    ctx.lineTo(nx, ny + nh - nr);
    ctx.quadraticCurveTo(nx, ny + nh, nx + nr, ny + nh);
    ctx.lineTo(nx + nw - nr, ny + nh);
    ctx.quadraticCurveTo(nx + nw, ny + nh, nx + nw, ny + nh - nr);
    ctx.lineTo(nx + nw, ny);
    ctx.closePath();

    ctx.fillStyle = '#000000';
    ctx.fill();

    // Speaker grill
    const spW = 90;
    const spH = 6;
    const spX = nx + (nw - spW) / 2;
    const spY = ny + 10;
    ctx.beginPath();
    ctx.roundRect(spX, spY, spW, spH, 3);
    ctx.fillStyle = '#1c1e24';
    ctx.fill();

    // Camera circle
    const camX = nx + nw / 2 + 70;
    const camY = ny + 28;
    ctx.beginPath();
    ctx.arc(camX, camY, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#060a12';
    ctx.fill();
  } else if (cutout.type === 'waterdrop') {
    const cx = cutout.x + cutout.width / 2;
    const cy = cutout.y;
    const w = cutout.width;
    const h = cutout.height;

    ctx.beginPath();
    ctx.moveTo(cx - w / 2 - 10, cy);
    ctx.quadraticCurveTo(cx - w / 2, cy + h, cx, cy + h);
    ctx.quadraticCurveTo(cx + w / 2, cy + h, cx + w / 2 + 10, cy);
    ctx.closePath();

    ctx.fillStyle = '#000000';
    ctx.fill();

    // Camera lens
    ctx.beginPath();
    ctx.arc(cx, cy + h / 2, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#070b14';
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Draws the physical phone body, rim highlights, buttons, and bezel surrounding the screen.
 */
export function drawDeviceFrameArt(
  ctx: CanvasRenderingContext2D,
  frame: FrameDefinition,
  colorId: FrameColorId
): void {
  const color =
    frame.availableColors.find((c) => c.id === colorId) ||
    frame.availableColors[0];

  const w = frame.outerWidth;
  const h = frame.outerHeight;
  const rad = frame.outerCornerRadius;

  ctx.save();

  // 1. Hardware physical buttons (Volume, Power, Action)
  ctx.fillStyle = color.rimColor;
  if (frame.orientation === 'portrait') {
    // Power button (right side)
    ctx.beginPath();
    ctx.roundRect(w - 3, 340, 5, 120, 2);
    ctx.fill();

    // Volume Up / Down (left side)
    ctx.beginPath();
    ctx.roundRect(-2, 280, 5, 80, 2);
    ctx.roundRect(-2, 390, 5, 80, 2);
    ctx.fill();

    // Action button / mute switch
    ctx.beginPath();
    ctx.roundRect(-2, 190, 5, 50, 2);
    ctx.fill();
  } else {
    // Landscape buttons (top/bottom)
    ctx.beginPath();
    ctx.roundRect(340, -2, 120, 5, 2);
    ctx.roundRect(280, h - 3, 80, 5, 2);
    ctx.roundRect(390, h - 3, 80, 5, 2);
    ctx.fill();
  }

  // 2. Outer Chassis / Body
  ctx.beginPath();
  ctx.roundRect(0, 0, w, h, rad);
  ctx.fillStyle = color.bodyColor;
  ctx.fill();

  // 3. Metallic Outer Rim Chamfer Gradient (Curved metallic finish)
  const rimGrad = ctx.createLinearGradient(0, 0, w, h);
  rimGrad.addColorStop(0, color.accentHighlight);
  rimGrad.addColorStop(0.2, color.rimColor);
  rimGrad.addColorStop(0.5, color.bodyColor);
  rimGrad.addColorStop(0.8, color.rimColor);
  rimGrad.addColorStop(1, color.accentHighlight);

  ctx.lineWidth = 6;
  ctx.strokeStyle = rimGrad;
  ctx.stroke();

  // 4. Inner Bezel (Black display border)
  const { x: sx, y: sy, width: sw, height: sh, borderRadius: srad } =
    frame.screenBounds;
  const bezelPath = new Path2D();
  bezelPath.roundRect(0, 0, w, h, rad);
  // Cut screen rectangle out of the bezel
  bezelPath.roundRect(sx, sy, sw, sh, srad);

  ctx.fillStyle = color.bezelColor;
  ctx.fill(bezelPath, 'evenodd');

  // Subtle inner bezel bevel
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(sx - 1, sy - 1, sw + 2, sh + 2, srad + 1);
  ctx.stroke();

  // 5. Speaker Ear Grill (for portrait phones with top speaker slit)
  if (frame.orientation === 'portrait' && frame.cutoutStyle !== 'dynamic-island') {
    ctx.fillStyle = '#1e2026';
    ctx.beginPath();
    ctx.roundRect((w - 100) / 2, 12, 100, 5, 2.5);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Draws realistic screen glass specular glare / ambient reflection across the display.
 */
export function drawScreenGlassReflection(
  ctx: CanvasRenderingContext2D,
  frame: FrameDefinition
): void {
  const { x, y, width, height, borderRadius } = frame.screenBounds;

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, borderRadius);
  ctx.clip();

  // Subtle diagonal light sweep
  const glareGrad = ctx.createLinearGradient(x, y, x + width, y + height);
  glareGrad.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
  glareGrad.addColorStop(0.3, 'rgba(255, 255, 255, 0.02)');
  glareGrad.addColorStop(0.45, 'rgba(255, 255, 255, 0)');
  glareGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

  ctx.fillStyle = glareGrad;
  ctx.fillRect(x, y, width, height);

  ctx.restore();
}
