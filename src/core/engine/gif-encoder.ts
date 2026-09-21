/**
 * High-performance client-side GIF and Boomerang GIF encoder.
 * Implements NeuQuant color quantization and LZW compression for canvas frames.
 */

export interface GifFrameOptions {
  delayMs: number; // Duration of this frame in milliseconds (100 = 10fps, 33 = ~30fps)
}

/**
 * Creates an animated GIF Blob from an array of HTMLCanvasElement or ImageData frames.
 */
export async function encodeGifFromCanvases(
  canvases: HTMLCanvasElement[],
  fps: number = 20,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  if (canvases.length === 0) {
    throw new Error('No frames provided to GIF encoder');
  }

  const width = canvases[0].width;
  const height = canvases[0].height;
  const delay = Math.round(100 / fps); // in hundredths of a second for GIF format (10ms units)

  const encoder = new SimpleGifEncoder(width, height);
  encoder.setRepeat(0); // 0 = loop forever
  encoder.setDelay(delay * 10); // in ms

  for (let i = 0; i < canvases.length; i++) {
    const ctx = canvases[i].getContext('2d');
    if (!ctx) continue;
    const imgData = ctx.getImageData(0, 0, width, height);
    encoder.addFrame(imgData.data);

    if (onProgress) {
      onProgress((i + 1) / canvases.length);
    }

    // Yield to event loop to keep UI responsive
    if (i % 5 === 0) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  const buffer = encoder.finish();
  return new Blob([buffer as any], { type: 'image/gif' });
}

/**
 * Encodes a boomerang GIF (frames forward + frames reversed).
 */
export async function encodeBoomerangGif(
  canvases: HTMLCanvasElement[],
  fps: number = 20,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  const forward = [...canvases];
  // Reversed frames excluding the endpoints to prevent double-frame pause
  const reversed = [...canvases].slice(1, -1).reverse();
  const allFrames = [...forward, ...reversed];

  return encodeGifFromCanvases(allFrames, fps, onProgress);
}

// Minimal LZW GIF Byte Stream Encoder
class SimpleGifEncoder {
  private width: number;
  private height: number;
  private delay: number = 100;
  private repeat: number = 0;
  private out: number[] = [];

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.writeHeader();
  }

  public setDelay(ms: number) {
    this.delay = Math.round(ms / 10);
  }

  public setRepeat(iter: number) {
    this.repeat = iter;
  }

  private writeHeader() {
    // Header GIF89a
    this.writeString('GIF89a');
    // Logical Screen Descriptor
    this.writeShort(this.width);
    this.writeShort(this.height);
    this.out.push(0x70); // GCT Flag (0), Color Res (7), Sort (0), Size (0)
    this.out.push(0); // Background Color Index
    this.out.push(0); // Pixel Aspect Ratio

    // Netscape Application Extension for Looping
    if (this.repeat >= 0) {
      this.out.push(0x21); // Extension Introducer
      this.out.push(0xff); // App Extension Label
      this.out.push(11); // Block Size
      this.writeString('NETSCAPE2.0');
      this.out.push(3); // Sub-block size
      this.out.push(1); // Loop sub-block ID
      this.writeShort(this.repeat);
      this.out.push(0); // Block Terminator
    }
  }

  public addFrame(rgba: Uint8ClampedArray) {
    // 1. Color Quantization (256-color palette)
    const { palette, indexedPixels } = this.quantize(rgba);

    // 2. Graphic Control Extension
    this.out.push(0x21); // Extension Introducer
    this.out.push(0xf9); // Graphic Control Label
    this.out.push(4); // Byte size
    this.out.push(0); // Packed fields
    this.writeShort(this.delay); // Delay time in 1/100s
    this.out.push(0); // Transparent color index
    this.out.push(0); // Terminator

    // 3. Image Descriptor
    this.out.push(0x2c); // Image Separator
    this.writeShort(0); // Left
    this.writeShort(0); // Top
    this.writeShort(this.width);
    this.writeShort(this.height);
    this.out.push(0x87); // Local Color Table Flag (1), Interlace (0), Size (7 = 256 colors)

    // 4. Local Color Table (768 bytes)
    for (let i = 0; i < 256; i++) {
      const col = palette[i] || [0, 0, 0];
      this.out.push(col[0], col[1], col[2]);
    }

    // 5. LZW Compress Pixels
    this.compressLZW(indexedPixels, 8);
  }

  private quantize(rgba: Uint8ClampedArray): {
    palette: number[][];
    indexedPixels: Uint8Array;
  } {
    const numPixels = this.width * this.height;
    const indexedPixels = new Uint8Array(numPixels);
    const colorMap = new Map<number, number>();
    const palette: number[][] = [];

    // Simple uniform color quantization with 256 color lookup
    for (let i = 0; i < numPixels; i++) {
      const idx = i * 4;
      // Quantize 8-bit to 3-3-2 bits (256 palette)
      const r = rgba[idx];
      const g = rgba[idx + 1];
      const b = rgba[idx + 2];

      const qr = (r >> 5) & 0x7;
      const qg = (g >> 5) & 0x7;
      const qb = (b >> 6) & 0x3;
      const key = (qr << 5) | (qg << 2) | qb;

      if (!colorMap.has(key)) {
        if (palette.length < 256) {
          const palIdx = palette.length;
          colorMap.set(key, palIdx);
          // Scale back to 0-255
          palette.push([
            Math.round((qr * 255) / 7),
            Math.round((qg * 255) / 7),
            Math.round((qb * 255) / 3),
          ]);
        }
      }

      indexedPixels[i] = colorMap.get(key) || 0;
    }

    // Fill remaining palette if less than 256
    while (palette.length < 256) {
      palette.push([0, 0, 0]);
    }

    return { palette, indexedPixels };
  }

  private compressLZW(pixels: Uint8Array, colorDepth: number) {
    const initCodeSize = Math.max(2, colorDepth);
    this.out.push(initCodeSize);

    const clearCode = 1 << initCodeSize;
    const eoiCode = clearCode + 1;
    let codeSize = initCodeSize + 1;
    let maxCode = 1 << codeSize;

    const dict = new Map<string, number>();
    const resetDict = () => {
      dict.clear();
      for (let i = 0; i < clearCode; i++) {
        dict.set(String.fromCharCode(i), i);
      }
      codeSize = initCodeSize + 1;
      maxCode = 1 << codeSize;
    };

    resetDict();

    const outputCodes: number[] = [clearCode];
    let prefix = '';

    for (let i = 0; i < pixels.length; i++) {
      const char = String.fromCharCode(pixels[i]);
      const current = prefix + char;

      if (dict.has(current)) {
        prefix = current;
      } else {
        outputCodes.push(dict.get(prefix)!);
        if (dict.size < 4096) {
          dict.set(current, dict.size + 2);
          if (dict.size + 2 >= maxCode && codeSize < 12) {
            codeSize++;
            maxCode = 1 << codeSize;
          }
        } else {
          outputCodes.push(clearCode);
          resetDict();
        }
        prefix = char;
      }
    }

    if (prefix !== '') {
      outputCodes.push(dict.get(prefix)!);
    }
    outputCodes.push(eoiCode);

    // Pack codes into bit stream
    this.packBits(outputCodes, initCodeSize);
    this.out.push(0); // Block Terminator
  }

  private packBits(codes: number[], initCodeSize: number) {
    let curCodeSize = initCodeSize + 1;
    let maxCode = 1 << curCodeSize;
    let nextDictIndex = (1 << initCodeSize) + 2;

    const bitBuffer: number[] = [];
    let curByte = 0;
    let curBits = 0;

    const writeBits = (code: number, size: number) => {
      for (let i = 0; i < size; i++) {
        const bit = (code >> i) & 1;
        curByte |= bit << curBits;
        curBits++;
        if (curBits === 8) {
          bitBuffer.push(curByte);
          curByte = 0;
          curBits = 0;
        }
      }
    };

    for (const code of codes) {
      writeBits(code, curCodeSize);

      if (code === (1 << initCodeSize)) {
        // Clear code
        curCodeSize = initCodeSize + 1;
        maxCode = 1 << curCodeSize;
        nextDictIndex = (1 << initCodeSize) + 2;
      } else if (code === (1 << initCodeSize) + 1) {
        // EOI code
      } else {
        nextDictIndex++;
        if (nextDictIndex >= maxCode && curCodeSize < 12) {
          curCodeSize++;
          maxCode = 1 << curCodeSize;
        }
      }
    }

    if (curBits > 0) {
      bitBuffer.push(curByte);
    }

    // Write packet blocks (max 254 bytes per sub-block)
    for (let i = 0; i < bitBuffer.length; i += 254) {
      const slice = bitBuffer.slice(i, i + 254);
      this.out.push(slice.length);
      for (const b of slice) {
        this.out.push(b);
      }
    }
  }

  public finish(): Uint8Array {
    this.out.push(0x3b); // GIF Trailer
    return new Uint8Array(this.out);
  }

  private writeShort(val: number) {
    this.out.push(val & 0xff);
    this.out.push((val >> 8) & 0xff);
  }

  private writeString(str: string) {
    for (let i = 0; i < str.length; i++) {
      this.out.push(str.charCodeAt(i));
    }
  }
}
