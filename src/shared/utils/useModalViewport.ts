import React, { useCallback, useEffect, useState } from 'react';

export interface ModalViewportResult {
  sheetStyle: React.CSSProperties;
  handleFieldFocusCapture: (e: React.FocusEvent<HTMLElement>) => void;
}

/**
 * 모바일 모달이 열렸을 때:
 * 1) 배경(body) 스크롤을 잠그고,
 * 2) visualViewport(가상 키보드 높이)를 감지해 모달 하단 패딩을 확보하며,
 * 3) 포커스된 입력창이 키보드에 가려지지 않도록 모달 중앙으로 스크롤합니다.
 */
export function useModalViewport(isOpen: boolean): ModalViewportResult {
  const [keyboardInset, setKeyboardInset] = useState(0);

  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') {
      setKeyboardInset(0);
      return;
    }

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const vv = typeof window !== 'undefined' ? window.visualViewport : null;
    const updateViewport = () => {
      if (!vv) return;
      const occupiedBottom = Math.max(
        0,
        window.innerHeight - vv.height - vv.offsetTop,
      );
      setKeyboardInset(Math.round(occupiedBottom));
    };

    if (vv) {
      updateViewport();
      vv.addEventListener('resize', updateViewport);
      vv.addEventListener('scroll', updateViewport);
    }

    return () => {
      document.body.style.overflow = prevOverflow;
      if (vv) {
        vv.removeEventListener('resize', updateViewport);
        vv.removeEventListener('scroll', updateViewport);
      }
    };
  }, [isOpen]);

  const handleFieldFocusCapture = useCallback(
    (e: React.FocusEvent<HTMLElement>) => {
      const target = e.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
      ) {
        if (typeof target.scrollIntoView === 'function') {
          setTimeout(() => {
            target.scrollIntoView({ block: 'center', behavior: 'smooth' });
          }, 120);
        }
      }
    },
    [],
  );

  const sheetStyle: React.CSSProperties =
    keyboardInset > 0
      ? {
          paddingBottom: `calc(24px + ${keyboardInset}px)`,
        }
      : {};

  return {
    sheetStyle,
    handleFieldFocusCapture,
  };
}
