import React from 'react';

export interface LightboxPhoto {
  url: string;
  fileName: string;
}

export interface PhotoLightboxModalProps {
  photo: LightboxPhoto | null;
  onClose: () => void;
}

export const PhotoLightboxModal: React.FC<PhotoLightboxModalProps> = ({
  photo,
  onClose,
}) => {
  if (!photo) {
    return null;
  }

  return (
    <div
      className="lightbox-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="첨부 사진 확대 보기"
      onClick={onClose}
    >
      <div
        className="lightbox-content"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="lightbox-header">
          <span className="lightbox-filename">{photo.fileName}</span>
          <button
            type="button"
            className="btn-lightbox-close touch-target"
            onClick={onClose}
            aria-label="확대 보기 닫기"
          >
            ✕ 닫기
          </button>
        </header>
        <div className="lightbox-image-wrap">
          <img
            src={photo.url}
            alt={photo.fileName}
            className="lightbox-image"
          />
        </div>
      </div>
    </div>
  );
};
