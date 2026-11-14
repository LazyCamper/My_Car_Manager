import React, { useRef, useState } from 'react';
import { MAX_ATTACHMENTS_PER_ITEM } from '../../domain/models';
import {
  compressImageFile,
  DEFAULT_JPEG_QUALITY,
  DEFAULT_MAX_LONG_EDGE,
} from '../utils';
import { LightboxPhoto, PhotoLightboxModal } from './PhotoLightboxModal';

export interface PhotoDraftItem {
  key: string;
  existingAttachmentId?: string;
  blob: Blob;
  fileName: string;
  previewUrl: string;
}

export interface PhotoAttachmentFieldProps {
  photos: PhotoDraftItem[];
  onChange: (nextPhotos: PhotoDraftItem[]) => void;
  maxCount?: number;
}

export const PhotoAttachmentField: React.FC<PhotoAttachmentFieldProps> = ({
  photos,
  onChange,
  maxCount = MAX_ATTACHMENTS_PER_ITEM,
}) => {
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  const [isCompressing, setIsCompressing] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [lightboxPhoto, setLightboxPhoto] = useState<LightboxPhoto | null>(
    null,
  );

  const isMaxReached = photos.length >= maxCount;

  const handleFilesSelected = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const selectedFiles = Array.from(fileList);
    e.target.value = '';
    setPhotoError(null);

    if (photos.length + selectedFiles.length > maxCount) {
      setPhotoError(`사진은 최대 ${maxCount}장까지만 첨부할 수 있습니다.`);
      return;
    }

    setIsCompressing(true);
    try {
      const addedDrafts: PhotoDraftItem[] = [];
      for (const file of selectedFiles) {
        const compressedBlob = await compressImageFile(file, {
          maxLongEdge: DEFAULT_MAX_LONG_EDGE,
          quality: DEFAULT_JPEG_QUALITY,
        });
        const previewUrl = URL.createObjectURL(compressedBlob);
        addedDrafts.push({
          key: `draft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          blob: compressedBlob,
          fileName: file.name || 'photo.jpg',
          previewUrl,
        });
      }
      onChange([...photos, ...addedDrafts]);
    } catch (err) {
      setPhotoError(
        err instanceof Error
          ? err.message
          : '사진 압축 중 오류가 발생했습니다.',
      );
    } finally {
      setIsCompressing(false);
    }
  };

  const handleRemovePhoto = (key: string) => {
    setPhotoError(null);
    const target = photos.find((p) => p.key === key);
    if (target) {
      URL.revokeObjectURL(target.previewUrl);
    }
    onChange(photos.filter((p) => p.key !== key));
  };

  return (
    <div className="photo-attachment-field">
      <div className="photo-field-header">
        <span className="form-label">
          영수증·서류 사진 첨부 ({photos.length}/{maxCount})
        </span>
        <span className="photo-field-hint">자동 압축 (1600px, JPEG)</span>
      </div>

      {photoError && (
        <p className="form-error-banner" role="alert">
          {photoError}
        </p>
      )}

      <div className="photo-upload-buttons">
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          data-testid="gallery-file-input"
          aria-label="갤러리에서 사진 선택"
          onChange={(e) => void handleFilesSelected(e)}
          disabled={isMaxReached || isCompressing}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          data-testid="camera-file-input"
          aria-label="카메라로 사진 촬영"
          onChange={(e) => void handleFilesSelected(e)}
          disabled={isMaxReached || isCompressing}
        />

        <button
          type="button"
          className="btn btn-secondary touch-target photo-upload-btn"
          onClick={() => galleryInputRef.current?.click()}
          disabled={isMaxReached || isCompressing}
        >
          🖼️ 갤러리 선택
        </button>

        <button
          type="button"
          className="btn btn-secondary touch-target photo-upload-btn"
          onClick={() => cameraInputRef.current?.click()}
          disabled={isMaxReached || isCompressing}
        >
          📷 카메라 촬영
        </button>
      </div>

      {isCompressing && (
        <p className="photo-compressing-status">사진을 압축하고 있습니다...</p>
      )}

      {photos.length > 0 && (
        <ul className="photo-thumb-list" aria-label="첨부된 사진 썸네일 목록">
          {photos.map((item, idx) => (
            <li key={item.key} className="photo-thumb-item">
              <button
                type="button"
                className="photo-thumb-preview-btn"
                onClick={() =>
                  setLightboxPhoto({
                    url: item.previewUrl,
                    fileName: item.fileName,
                  })
                }
                aria-label={`${item.fileName} 확대 보기`}
              >
                <img
                  src={item.previewUrl}
                  alt={`첨부 사진 ${idx + 1}: ${item.fileName}`}
                  className="photo-thumb-img"
                />
              </button>
              <button
                type="button"
                className="photo-thumb-delete-btn"
                onClick={() => handleRemovePhoto(item.key)}
                aria-label={`${item.fileName} 사진 삭제`}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      <PhotoLightboxModal
        photo={lightboxPhoto}
        onClose={() => setLightboxPhoto(null)}
      />
    </div>
  );
};
