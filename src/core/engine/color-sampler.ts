import { ExtractedPalette } from '../types';

interface RGB {
  r: number;
  g: number;
  b: number;
}

interface HSL {
  h: number;
  s: number;
  l: number;
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (c: number) => {
    const hex = Math.max(0, Math.min(255, Math.round(c))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function rgbToHsl(r: number, g: number, b: number): HSL {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToRgb(h: number, s: number, l: number): RGB {
  h /= 360;
  s /= 100;
  l /= 100;
  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

/**
 * Fast client-side dominant color sampler and gradient generator.
 * Uses a downsampled canvas (64x64) and k-means clustering in HSL space.
 */
export function extractPaletteFromImage(
  source: CanvasImageSource,
  options?: { sampleSize?: number }
): ExtractedPalette {
  const size = options?.sampleSize || 64;
  const offscreen = document.createElement('canvas');
  offscreen.width = size;
  offscreen.height = size;
  const ctx = offscreen.getContext('2d', { willReadFrequently: true });

  if (!ctx) {
    return getDefaultFallbackPalette();
  }

  try {
    ctx.drawImage(source, 0, 0, size, size);
    const imgData = ctx.getImageData(0, 0, size, size).data;

    // Collect valid color samples
    const samples: Array<{ rgb: RGB; hsl: HSL; weight: number }> = [];
    const colorBuckets = new Map<string, { rSum: number; gSum: number; bSum: number; count: number }>();

    for (let i = 0; i < imgData.length; i += 4) {
      const alpha = imgData[i + 3];
      if (alpha < 128) continue; // Ignore transparent pixels

      const r = imgData[i];
      const g = imgData[i + 1];
      const b = imgData[i + 2];

      // Quantize slightly to 4-bit per channel for histogram bucketing
      const qr = (r >> 4) << 4;
      const qg = (g >> 4) << 4;
      const qb = (b >> 4) << 4;
      const key = `${qr},${qg},${qb}`;

      const existing = colorBuckets.get(key);
      if (existing) {
        existing.rSum += r;
        existing.gSum += g;
        existing.bSum += b;
        existing.count++;
      } else {
        colorBuckets.set(key, { rSum: r, gSum: g, bSum: b, count: 1 });
      }
    }

    // Sort buckets by frequency
    const sortedBuckets = Array.from(colorBuckets.values()).sort((a, b) => b.count - a.count);

    if (sortedBuckets.length === 0) {
      return getDefaultFallbackPalette();
    }

    const uniqueColors: Array<{ rgb: RGB; hsl: HSL; score: number }> = [];

    for (const b of sortedBuckets.slice(0, 30)) {
      const avgR = Math.round(b.rSum / b.count);
      const avgG = Math.round(b.gSum / b.count);
      const avgB = Math.round(b.bSum / b.count);
      const hsl = rgbToHsl(avgR, avgG, avgB);

      // Score color by saturation and population (avoiding pure white or pure black as solitary accent)
      const saturationScore = hsl.s / 100;
      const luminancePenalty = hsl.l < 10 || hsl.l > 92 ? 0.3 : 1.0;
      const score = b.count * (1 + saturationScore * 2) * luminancePenalty;

      uniqueColors.push({
        rgb: { r: avgR, g: avgG, b: avgB },
        hsl,
        score,
      });
    }

    uniqueColors.sort((a, b) => b.score - a.score);

    const dominant = uniqueColors[0]
      ? rgbToHex(uniqueColors[0].rgb.r, uniqueColors[0].rgb.g, uniqueColors[0].rgb.b)
      : '#3b82f6';

    // Find a vibrant accent (high saturation)
    const vibrantItem = [...uniqueColors].sort((a, b) => b.hsl.s - a.hsl.s)[0] || uniqueColors[0];
    const vibrant = rgbToHex(vibrantItem.rgb.r, vibrantItem.rgb.g, vibrantItem.rgb.b);

    // Find secondary color with distinct hue or lightness
    const secondaryItem =
      uniqueColors.find(
        (c) => Math.abs(c.hsl.h - vibrantItem.hsl.h) > 30 || Math.abs(c.hsl.l - vibrantItem.hsl.l) > 25
      ) || uniqueColors[1] || uniqueColors[0];
    const secondary = rgbToHex(secondaryItem.rgb.r, secondaryItem.rgb.g, secondaryItem.rgb.b);

    // Dark muted variant
    const darkHsl = { ...vibrantItem.hsl, l: Math.min(20, vibrantItem.hsl.l * 0.4), s: vibrantItem.hsl.s * 0.6 };
    const darkRgb = hslToRgb(darkHsl.h, darkHsl.s, darkHsl.l);
    const darkMuted = rgbToHex(darkRgb.r, darkRgb.g, darkRgb.b);

    // Light muted variant
    const lightHsl = { ...vibrantItem.hsl, l: Math.max(88, 100 - vibrantItem.hsl.l * 0.3), s: vibrantItem.hsl.s * 0.4 };
    const lightRgb = hslToRgb(lightHsl.h, lightHsl.s, lightHsl.l);
    const lightMuted = rgbToHex(lightRgb.r, lightRgb.g, lightRgb.b);

    // Complementary accent
    const compHue = (vibrantItem.hsl.h + 180) % 360;
    const compRgb = hslToRgb(compHue, Math.max(60, vibrantItem.hsl.s), 55);
    const accent = rgbToHex(compRgb.r, compRgb.g, compRgb.b);

    // Generate suggested gradient combinations
    const suggestedGradients: string[][] = [
      [dominant, secondary],
      [vibrant, darkMuted],
      [vibrant, accent],
      ['#0f172a', dominant, '#1e1b4b'],
      [darkMuted, vibrant, secondary],
      ['#18181b', darkMuted],
    ];

    return {
      dominant,
      secondary,
      accent,
      vibrant,
      darkMuted,
      lightMuted,
      suggestedGradients,
    };
  } catch (err) {
    console.warn('Palette extraction error:', err);
    return getDefaultFallbackPalette();
  }
}

export function getDefaultFallbackPalette(): ExtractedPalette {
  return {
    dominant: '#6366f1',
    secondary: '#a855f7',
    accent: '#ec4899',
    vibrant: '#8b5cf6',
    darkMuted: '#0f172a',
    lightMuted: '#f1f5f9',
    suggestedGradients: [
      ['#4f46e5', '#7c3aed', '#db2777'],
      ['#0f172a', '#1e1b4b', '#312e81'],
      ['#18181b', '#27272a'],
      ['#0284c7', '#2563eb', '#4f46e5'],
      ['#059669', '#0d9488', '#0284c7'],
      ['#ea580c', '#d97706', '#ca8a04'],
    ],
  };
}
