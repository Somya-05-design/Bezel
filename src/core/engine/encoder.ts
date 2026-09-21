import {
  CompositeFrameOptions,
  ExportFormat,
  ExportProgress,
  KenBurnsConfig,
  SlideshowConfig,
  TransformKeyframe,
} from '../types';
import { compositeFrame } from './composite';
import { encodeBoomerangGif, encodeGifFromCanvases } from './gif-encoder';
import { encodeMp4WithFFmpeg, encodeWithMediaRecorder } from './ffmpeg';

/**
 * Calculates interpolated transform for Ken Burns easing between start and end keyframes.
 */
export function interpolateTransform(
  start: TransformKeyframe,
  end: TransformKeyframe,
  t: number,
  easing: KenBurnsConfig['easing']
): TransformKeyframe {
  // Apply easing curve
  let easeT = t;
  if (easing === 'ease-in') {
    easeT = t * t;
  } else if (easing === 'ease-out') {
    easeT = t * (2 - t);
  } else if (easing === 'ease-in-out') {
    easeT = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  return {
    scale: start.scale + (end.scale - start.scale) * easeT,
    offsetX: start.offsetX + (end.offsetX - start.offsetX) * easeT,
    offsetY: start.offsetY + (end.offsetY - start.offsetY) * easeT,
  };
}

/**
 * Exports a single static composited image as a Blob.
 */
export async function exportStaticImage(
  options: CompositeFrameOptions,
  format: 'png' | 'jpeg' | 'webp' = 'png',
  quality: number = 0.95
): Promise<Blob> {
  const canvas = compositeFrame(options);
  const mimeType =
    format === 'jpeg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png';

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to create image blob from canvas'));
      },
      mimeType,
      quality
    );
  });
}

/**
 * Exports a Ken Burns motion sequence (static image with smooth pan/zoom).
 */
export async function exportKenBurns(
  baseOptions: CompositeFrameOptions,
  kenBurns: KenBurnsConfig,
  format: 'mp4' | 'gif' | 'boomerang-gif',
  onProgress?: (progress: ExportProgress) => void
): Promise<Blob> {
  const fps = kenBurns.fps || 30;
  const totalFrames = Math.round(kenBurns.duration * fps);
  const renderedFrames: HTMLCanvasElement[] = [];

  for (let i = 0; i < totalFrames; i++) {
    const t = totalFrames > 1 ? i / (totalFrames - 1) : 0;
    const currentTransform = interpolateTransform(
      kenBurns.start,
      kenBurns.end,
      t,
      kenBurns.easing
    );

    const frameCanvas = document.createElement('canvas');
    frameCanvas.width = baseOptions.canvasWidth;
    frameCanvas.height = baseOptions.canvasHeight;

    compositeFrame(
      {
        ...baseOptions,
        transform: currentTransform,
      },
      frameCanvas
    );

    renderedFrames.push(frameCanvas);

    if (onProgress) {
      onProgress({
        stage: 'rendering',
        currentFrame: i + 1,
        totalFrames,
        percentage: ((i + 1) / totalFrames) * 50,
        message: `Compositing frame ${i + 1} of ${totalFrames}...`,
      });
    }
  }

  if (onProgress) {
    onProgress({
      stage: 'encoding',
      currentFrame: totalFrames,
      totalFrames,
      percentage: 50,
      message: `Encoding ${format.toUpperCase()}...`,
    });
  }

  let resultBlob: Blob;
  if (format === 'gif') {
    resultBlob = await encodeGifFromCanvases(renderedFrames, fps, (p) => {
      if (onProgress) {
        onProgress({
          stage: 'encoding',
          currentFrame: Math.round(p * totalFrames),
          totalFrames,
          percentage: 50 + p * 50,
          message: `Building GIF: ${Math.round(p * 100)}%`,
        });
      }
    });
  } else if (format === 'boomerang-gif') {
    resultBlob = await encodeBoomerangGif(renderedFrames, fps, (p) => {
      if (onProgress) {
        onProgress({
          stage: 'encoding',
          currentFrame: Math.round(p * totalFrames),
          totalFrames,
          percentage: 50 + p * 50,
          message: `Building Boomerang GIF: ${Math.round(p * 100)}%`,
        });
      }
    });
  } else {
    // MP4 export
    try {
      resultBlob = await encodeMp4WithFFmpeg(renderedFrames, fps, (p) => {
        if (onProgress) {
          onProgress({
            stage: 'encoding',
            currentFrame: Math.round(p * totalFrames),
            totalFrames,
            percentage: 50 + p * 50,
            message: `Encoding MP4 video: ${Math.round(p * 100)}%`,
          });
        }
      });
    } catch {
      // Fallback to MediaRecorder stream encoding
      resultBlob = await encodeWithMediaRecorder(
        (idx, c) => {
          const t = totalFrames > 1 ? idx / (totalFrames - 1) : 0;
          const tr = interpolateTransform(kenBurns.start, kenBurns.end, t, kenBurns.easing);
          compositeFrame({ ...baseOptions, transform: tr }, c);
        },
        totalFrames,
        baseOptions.canvasWidth,
        baseOptions.canvasHeight,
        fps,
        'video/mp4'
      );
    }
  }

  if (onProgress) {
    onProgress({
      stage: 'done',
      currentFrame: totalFrames,
      totalFrames,
      percentage: 100,
      message: 'Export complete!',
    });
  }

  return resultBlob;
}

/**
 * Exports a video inside the framed mockup.
 */
export async function exportVideoInFrame(
  videoElement: HTMLVideoElement,
  baseOptions: CompositeFrameOptions,
  format: 'mp4' | 'gif' | 'boomerang-gif' = 'mp4',
  fps: number = 30,
  onProgress?: (progress: ExportProgress) => void
): Promise<Blob> {
  const duration = videoElement.duration || 5;
  const totalFrames = Math.round(duration * fps);
  const renderedFrames: HTMLCanvasElement[] = [];

  const originalTime = videoElement.currentTime;
  const wasPaused = videoElement.paused;
  videoElement.pause();

  for (let i = 0; i < totalFrames; i++) {
    const time = (i / totalFrames) * duration;
    videoElement.currentTime = time;

    // Wait for video frame to seek
    await new Promise<void>((resolve) => {
      const onSeeked = () => {
        videoElement.removeEventListener('seeked', onSeeked);
        resolve();
      };
      videoElement.addEventListener('seeked', onSeeked, { once: true });
      // Fallback timeout in case seeked doesn't fire immediately
      setTimeout(resolve, 150);
    });

    const frameCanvas = document.createElement('canvas');
    frameCanvas.width = baseOptions.canvasWidth;
    frameCanvas.height = baseOptions.canvasHeight;

    compositeFrame(
      {
        ...baseOptions,
        sourceElement: videoElement,
      },
      frameCanvas
    );

    renderedFrames.push(frameCanvas);

    if (onProgress) {
      onProgress({
        stage: 'rendering',
        currentFrame: i + 1,
        totalFrames,
        percentage: ((i + 1) / totalFrames) * 50,
        message: `Extracting video frame ${i + 1} of ${totalFrames}...`,
      });
    }
  }

  videoElement.currentTime = originalTime;
  if (!wasPaused) {
    videoElement.play().catch(() => {});
  }

  if (format === 'gif') {
    return encodeGifFromCanvases(renderedFrames, fps, (p) => {
      if (onProgress) {
        onProgress({
          stage: 'encoding',
          currentFrame: Math.round(p * totalFrames),
          totalFrames,
          percentage: 50 + p * 50,
          message: `Compiling GIF: ${Math.round(p * 100)}%`,
        });
      }
    });
  } else if (format === 'boomerang-gif') {
    return encodeBoomerangGif(renderedFrames, fps);
  } else {
    return encodeMp4WithFFmpeg(renderedFrames, fps, (p) => {
      if (onProgress) {
        onProgress({
          stage: 'encoding',
          currentFrame: Math.round(p * totalFrames),
          totalFrames,
          percentage: 50 + p * 50,
          message: `Encoding MP4: ${Math.round(p * 100)}%`,
        });
      }
    });
  }
}

/**
 * Exports a slideshow of images framed in the mockup.
 */
export async function exportSlideshow(
  baseOptions: CompositeFrameOptions,
  slideshow: SlideshowConfig,
  format: 'mp4' | 'gif' | 'boomerang-gif',
  fps: number = 20,
  onProgress?: (progress: ExportProgress) => void
): Promise<Blob> {
  const slides = slideshow.slides;
  if (slides.length === 0) {
    throw new Error('Slideshow has no slides to render');
  }

  const renderedFrames: HTMLCanvasElement[] = [];

  for (let s = 0; s < slides.length; s++) {
    const slide = slides[s];
    const duration = slide.duration || slideshow.defaultSlideDuration || 2.0;
    const slideFrames = Math.round(duration * fps);

    // Ensure image element is loaded
    let imgEl = slide.element;
    if (!imgEl) {
      imgEl = new Image();
      imgEl.crossOrigin = 'anonymous';
      imgEl.src = slide.url;
      await new Promise((res) => {
        imgEl!.onload = res;
      });
    }

    for (let f = 0; f < slideFrames; f++) {
      const frameCanvas = document.createElement('canvas');
      frameCanvas.width = baseOptions.canvasWidth;
      frameCanvas.height = baseOptions.canvasHeight;

      compositeFrame(
        {
          ...baseOptions,
          sourceElement: imgEl,
        },
        frameCanvas
      );

      renderedFrames.push(frameCanvas);
    }

    if (onProgress) {
      onProgress({
        stage: 'rendering',
        currentFrame: s + 1,
        totalFrames: slides.length,
        percentage: ((s + 1) / slides.length) * 50,
        message: `Rendering slide ${s + 1} of ${slides.length}...`,
      });
    }
  }

  if (format === 'gif') {
    return encodeGifFromCanvases(renderedFrames, fps);
  } else if (format === 'boomerang-gif') {
    return encodeBoomerangGif(renderedFrames, fps);
  } else {
    return encodeMp4WithFFmpeg(renderedFrames, fps);
  }
}
