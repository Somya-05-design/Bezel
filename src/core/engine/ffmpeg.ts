import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpegInstance: FFmpeg | null = null;
let isLoaded = false;
let loadPromise: Promise<FFmpeg> | null = null;

/**
 * Initializes and loads ffmpeg.wasm singleton from reliable CDN.
 */
export async function getFFmpeg(
  onProgress?: (progress: number) => void
): Promise<FFmpeg> {
  if (ffmpegInstance && isLoaded) {
    return ffmpegInstance;
  }

  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = (async () => {
    const ffmpeg = new FFmpeg();

    ffmpeg.on('progress', ({ progress }) => {
      if (onProgress) {
        onProgress(Math.max(0, Math.min(1, progress)));
      }
    });

    try {
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
      ffmpegInstance = ffmpeg;
      isLoaded = true;
      return ffmpeg;
    } catch (err) {
      console.warn('Failed to load ffmpeg.wasm, fallback mode will be used:', err);
      throw err;
    }
  })();

  return loadPromise;
}

/**
 * Encodes an array of HTMLCanvasElement frames into an MP4 file using ffmpeg.wasm.
 */
export async function encodeMp4WithFFmpeg(
  canvases: HTMLCanvasElement[],
  fps: number = 30,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  const ffmpeg = await getFFmpeg(onProgress);

  const numFrames = canvases.length;
  // Write each frame as a JPEG/PNG file in ffmpeg virtual FS
  for (let i = 0; i < numFrames; i++) {
    const canvas = canvases[i];
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', 0.95)
    );
    if (!blob) continue;

    const fileName = `frame_${String(i).padStart(5, '0')}.jpg`;
    await ffmpeg.writeFile(fileName, await fetchFile(blob));

    if (onProgress) {
      onProgress(((i + 1) / numFrames) * 0.4); // 0-40% for frame preparation
    }
  }

  // Run FFmpeg to encode H.264 MP4 with yuv420p pixel format for universal mobile compatibility
  const outputFileName = 'output.mp4';
  await ffmpeg.exec([
    '-framerate',
    String(fps),
    '-i',
    'frame_%05d.jpg',
    '-c:v',
    'libx264',
    '-pix_fmt',
    'yuv420p',
    '-preset',
    'ultrafast',
    '-movflags',
    '+faststart',
    outputFileName,
  ]);

  const data = await ffmpeg.readFile(outputFileName);

  // Clean up virtual files
  for (let i = 0; i < numFrames; i++) {
    const fileName = `frame_${String(i).padStart(5, '0')}.jpg`;
    try {
      await ffmpeg.deleteFile(fileName);
    } catch {}
  }
  try {
    await ffmpeg.deleteFile(outputFileName);
  } catch {}

  return new Blob([data as any], { type: 'video/mp4' });
}

/**
 * Hardware-accelerated canvas stream encoder using MediaRecorder (instant client-side export).
 */
export async function encodeWithMediaRecorder(
  renderFrame: (index: number, canvas: HTMLCanvasElement) => Promise<void> | void,
  totalFrames: number,
  width: number,
  height: number,
  fps: number = 30,
  mimeType: string = 'video/mp4',
  onProgress?: (progress: number) => void
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const stream = canvas.captureStream(fps);

  // Determine supported mime type
  const supportedType =
    MediaRecorder.isTypeSupported(mimeType)
      ? mimeType
      : MediaRecorder.isTypeSupported('video/mp4;codecs=avc1')
      ? 'video/mp4;codecs=avc1'
      : MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : 'video/webm';

  const recorder = new MediaRecorder(stream, {
    mimeType: supportedType,
    videoBitsPerSecond: 8_000_000,
  });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) {
      chunks.push(e.data);
    }
  };

  const recordingPromise = new Promise<Blob>((resolve, reject) => {
    recorder.onstop = () => {
      resolve(new Blob(chunks, { type: supportedType }));
    };
    recorder.onerror = (e) => reject(e);
  });

  recorder.start();

  const intervalMs = 1000 / fps;
  for (let i = 0; i < totalFrames; i++) {
    await renderFrame(i, canvas);
    if (onProgress) {
      onProgress((i + 1) / totalFrames);
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  recorder.stop();
  return recordingPromise;
}
