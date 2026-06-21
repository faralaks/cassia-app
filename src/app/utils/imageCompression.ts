const MIN_QUALITY = 0.4;
const MIN_DIMENSION = 480;
const COMPRESSIBLE = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/apng'];

export type ImageQuality = 'high' | 'medium' | 'low';

export const QUALITY_VALUE: Record<ImageQuality, number> = {
  high: 0.85,
  medium: 0.65,
  low: 0.45,
};

// Whether a file is a raster image we can safely re-encode (skips gif/svg).
export const isCompressibleImage = (file: File): boolean => COMPRESSIBLE.includes(file.type);

const loadImage = (file: File | Blob): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });

const canvasToBlob = (canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> =>
  new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/jpeg', quality);
  });

const drawScaled = (img: HTMLImageElement, scale: number): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(img.width * scale));
  canvas.height = Math.max(1, Math.round(img.height * scale));
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // flatten any transparency onto white before encoding to JPEG
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  }
  return canvas;
};

const toJpegName = (name: string): string => `${name.replace(/\.[^.]+$/, '')}.jpg`;

export type CompressOptions = {
  quality?: number;
  maxBytes?: number;
  maxDimension?: number;
};

// Re-encodes an image as JPEG, lowering quality then dimensions until it fits
// under maxBytes (when provided). Returns the original file untouched on failure.
export const compressImageFile = async (
  file: File,
  { quality = 0.8, maxBytes, maxDimension = 2560 }: CompressOptions
): Promise<File> => {
  const img = await loadImage(file);

  const longest = Math.max(img.width, img.height);
  let scale = longest > maxDimension ? maxDimension / longest : 1;
  let q = quality;
  let best: Blob | null = null;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const canvas = drawScaled(img, scale);
    // eslint-disable-next-line no-await-in-loop
    const blob = await canvasToBlob(canvas, q);
    if (!blob) break;
    best = blob;
    if (!maxBytes || blob.size <= maxBytes) break;

    if (q > MIN_QUALITY) {
      q = Math.max(MIN_QUALITY, q - 0.15);
    } else if (canvas.width > MIN_DIMENSION && canvas.height > MIN_DIMENSION) {
      scale *= 0.8;
    } else {
      break;
    }
  }

  if (!best) return file;
  return new File([best], toJpegName(file.name), { type: 'image/jpeg' });
};
