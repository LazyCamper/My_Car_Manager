import React, { useEffect, useState } from 'react';

export const PwaUpdatePrompt: React.FC = () => {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const [updateSwFn, setUpdateSwFn] = useState<
    ((reloadPage?: boolean) => Promise<void>) | null
  >(null);

  useEffect(() => {
    let isMounted = true;

    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    void import('virtual:pwa-register')
      .then(({ registerSW }) => {
        if (!isMounted) return;
        const updateSW = registerSW({
          onNeedRefresh() {
            if (isMounted) setNeedRefresh(true);
          },
          onOfflineReady() {
            if (isMounted) setOfflineReady(true);
          },
        });
        setUpdateSwFn(() => updateSW);
      })
      .catch(() => {
        // 테스트 또는 SW 미지원 환경에서는 무시
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (!needRefresh && !offlineReady) {
    return null;
  }

  return (
    <div
      className="pwa-toast-banner"
      role="status"
      aria-live="polite"
      data-testid="pwa-toast-banner"
    >
      <div className="pwa-toast-message">
        {needRefresh ? (
          <span>새 버전이 출시되었습니다. 업데이트하시겠습니까?</span>
        ) : (
          <span>오프라인에서도 앱을 사용할 준비가 완료되었습니다.</span>
        )}
      </div>
      <div className="pwa-toast-actions">
        {needRefresh && updateSwFn && (
          <button
            type="button"
            className="btn btn-primary touch-target pwa-toast-btn"
            onClick={() => void updateSwFn(true)}
          >
            업데이트
          </button>
        )}
        <button
          type="button"
          className="btn btn-secondary touch-target pwa-toast-btn"
          onClick={() => {
            setNeedRefresh(false);
            setOfflineReady(false);
          }}
        >
          닫기
        </button>
      </div>
    </div>
  );
};
