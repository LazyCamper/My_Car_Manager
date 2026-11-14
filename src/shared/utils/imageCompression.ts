export const DEFAULT_MAX_LONG_EDGE = 1600;
export const DEFAULT_JPEG_QUALITY = 0.7;
export const OUTPUT_IMAGE_MIME = 'image/jpeg';

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface CompressImageOptions {
  maxLongEdge?: number;
  quality?: number;
}

/**
 * 원본 가로/세로 크기에서 긴 변이 maxLongEdge(기본 1600px)를 넘지 않도록
 * 종횡비를 유지한 리사이즈 크기를 계산합니다.
 */
export function calculateResizedDimensions(
  width: number,
  height: number,
  maxLongEdge: number = DEFAULT_MAX_LONG_EDGE,
): ImageDimensions {
  if (width <= 0 || height <= 0) {
    throw new Error('Image dimensions must be positive numbers');
  }

  const longest = Math.max(width, height);
  if (longest <= maxLongEdge) {
    return { width: Math.round(width), height: Math.round(height) };
  }

  const scale = maxLongEdge / longest;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function loadImageElement(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('이미지를 불러오지 못했습니다.'));
    };
    img.src = url;
  });
}

/**
 * 이미지 파일(File/Blob)을 클라이언트 Canvas를 사용해
 * 긴 변 최대 1600px, JPEG 품질 0.7의 Blob으로 압축합니다.
 */
export async function compressImageFile(
  file: Blob,
  options: CompressImageOptions = {},
): Promise<Blob> {
  const maxLongEdge = options.maxLongEdge ?? DEFAULT_MAX_LONG_EDGE;
  const quality = options.quality ?? DEFAULT_JPEG_QUALITY;

  const img = await loadImageElement(file);
  const srcWidth = img.naturalWidth || img.width || 1;
  const srcHeight = img.naturalHeight || img.height || 1;

  const { width, height } = calculateResizedDimensions(
    srcWidth,
    srcHeight,
    maxLongEdge,
  );

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context를 사용할 수 없습니다.');
  }

  ctx.drawImage(img, 0, 0, width, height);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('이미지 압축(Blob 변환)에 실패했습니다.'));
          return;
        }
        resolve(blob);
      },
      OUTPUT_IMAGE_MIME,
      quality,
    );
  });
}
