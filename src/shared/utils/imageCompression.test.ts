import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  calculateResizedDimensions,
  compressImageFile,
  DEFAULT_JPEG_QUALITY,
  DEFAULT_MAX_LONG_EDGE,
  OUTPUT_IMAGE_MIME,
} from './imageCompression';

describe('이미지 압축 유틸 테스트 (imageCompression)', () => {
  describe('calculateResizedDimensions', () => {
    it('긴 변이 1600px 이하인 이미지는 원본 크기를 그대로 유지한다', () => {
      expect(calculateResizedDimensions(1200, 900)).toEqual({
        width: 1200,
        height: 900,
      });
      expect(calculateResizedDimensions(1600, 1200)).toEqual({
        width: 1600,
        height: 1200,
      });
    });

    it('가로가 긴 이미지(3200x2400)는 가로를 1600px로 맞추고 비율을 유지한다', () => {
      expect(calculateResizedDimensions(3200, 2400)).toEqual({
        width: 1600,
        height: 1200,
      });
    });

    it('세로가 긴 이미지(1800x3600)는 세로를 1600px로 맞추고 비율을 유지한다', () => {
      expect(calculateResizedDimensions(1800, 3600)).toEqual({
        width: 800,
        height: 1600,
      });
    });

    it('유효하지 않은 크기(0 이하)는 에러를 발생시킨다', () => {
      expect(() => calculateResizedDimensions(0, 100)).toThrow();
      expect(() => calculateResizedDimensions(100, -50)).toThrow();
    });
  });

  describe('compressImageFile', () => {
    const originalImage = globalThis.Image;
    const originalCreateObjectURL = URL.createObjectURL;
    const originalRevokeObjectURL = URL.revokeObjectURL;

    beforeEach(() => {
      URL.createObjectURL = vi.fn(() => 'blob:mock-url');
      URL.revokeObjectURL = vi.fn();

      class MockImage {
        naturalWidth = 4000;
        naturalHeight = 3000;
        width = 4000;
        height = 3000;
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        set src(_val: string) {
          setTimeout(() => {
            if (this.onload) this.onload();
          }, 0);
        }
      }
      globalThis.Image = MockImage as unknown as typeof Image;
    });

    afterEach(() => {
      globalThis.Image = originalImage;
      URL.createObjectURL = originalCreateObjectURL;
      URL.revokeObjectURL = originalRevokeObjectURL;
      vi.restoreAllMocks();
    });

    it('4000x3000 이미지를 긴 변 1600px(1600x1200), JPEG 품질 0.7로 압축하여 Blob을 반환한다', async () => {
      const drawImageSpy = vi.fn();
      let capturedMime = '';
      let capturedQuality = 0;

      vi.spyOn(
        HTMLCanvasElement.prototype,
        'getContext',
      ).mockImplementation(
        () =>
          ({
            drawImage: drawImageSpy,
          }) as unknown as CanvasRenderingContext2D,
      );

      vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(
        function (callback, mimeType, quality) {
          capturedMime = mimeType ?? '';
          capturedQuality = typeof quality === 'number' ? quality : 0;
          callback(new Blob(['compressed-jpeg-bytes'], { type: OUTPUT_IMAGE_MIME }));
        },
      );

      const inputBlob = new Blob(['raw-image-bytes'], { type: 'image/png' });
      const resultBlob = await compressImageFile(inputBlob);

      expect(drawImageSpy).toHaveBeenCalledWith(
        expect.anything(),
        0,
        0,
        DEFAULT_MAX_LONG_EDGE,
        1200,
      );
      expect(capturedMime).toBe('image/jpeg');
      expect(capturedQuality).toBe(DEFAULT_JPEG_QUALITY);
      expect(resultBlob).toBeInstanceOf(Blob);
      expect(resultBlob.type).toBe('image/jpeg');
    });
  });
});
