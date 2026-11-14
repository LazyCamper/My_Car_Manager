import React, { useEffect, useState } from 'react';
import { useRepositories } from '../../app/RepositoryContext';
import { LightboxPhoto, PhotoLightboxModal } from './PhotoLightboxModal';

export interface AttachmentThumbnailStripProps {
  attachmentIds: string[];
}

interface LoadedThumb {
  id: string;
  fileName: string;
  url: string;
}

export const AttachmentThumbnailStrip: React.FC<
  AttachmentThumbnailStripProps
> = ({ attachmentIds }) => {
  const { attachmentRepo } = useRepositories();
  const [thumbs, setThumbs] = useState<LoadedThumb[]>([]);
  const [lightboxPhoto, setLightboxPhoto] = useState<LightboxPhoto | null>(
    null,
  );

  useEffect(() => {
    let isMounted = true;
    const createdUrls: string[] = [];

    if (!attachmentIds || attachmentIds.length === 0) {
      setThumbs([]);
      return;
    }

    void attachmentRepo.getByIds(attachmentIds).then((records) => {
      if (!isMounted) return;
      const mapped = records.map((rec) => {
        const url = URL.createObjectURL(rec.blob);
        createdUrls.push(url);
        return {
          id: rec.id,
          fileName: rec.fileName,
          url,
        };
      });
      setThumbs(mapped);
    });

    return () => {
      isMounted = false;
      createdUrls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [attachmentIds, attachmentRepo]);

  if (!attachmentIds || attachmentIds.length === 0 || thumbs.length === 0) {
    return null;
  }

  return (
    <div
      className="attachment-strip-container"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="attachment-strip-list" aria-label="첨부 사진 썸네일">
        {thumbs.map((thumb) => (
          <button
            key={thumb.id}
            type="button"
            className="attachment-strip-thumb-btn"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxPhoto({ url: thumb.url, fileName: thumb.fileName });
            }}
            aria-label={`${thumb.fileName} 확대 보기`}
          >
            <img
              src={thumb.url}
              alt={thumb.fileName}
              className="attachment-strip-img"
            />
          </button>
        ))}
      </div>

      <PhotoLightboxModal
        photo={lightboxPhoto}
        onClose={() => setLightboxPhoto(null)}
      />
    </div>
  );
};
