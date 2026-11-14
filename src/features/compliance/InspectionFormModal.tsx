import React, { useEffect, useState } from 'react';
import { Inspection } from '../../domain/models';
import {
  addYearsClamped,
  formatDateDot,
  parseDateString,
  useModalViewport,
} from '../../shared/utils';

export type InspectionFormSubmitData = Omit<Inspection, 'id'> & {
  id?: string;
};

export interface InspectionFormModalProps {
  isOpen: boolean;
  vehicleId: string;
  initialInspection?: Inspection | null;
  onClose: () => void;
  onSubmit: (data: InspectionFormSubmitData) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export const InspectionFormModal: React.FC<InspectionFormModalProps> = ({
  isOpen,
  vehicleId,
  initialInspection,
  onClose,
  onSubmit,
  onDelete,
}) => {
  const isEditMode = Boolean(initialInspection);

  const [inspectionDate, setInspectionDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [stationName, setStationName] = useState('');
  const [cost, setCost] = useState('');
  const [memo, setMemo] = useState('');
  const [isCurrent, setIsCurrent] = useState(true);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { sheetStyle, handleFieldFocusCapture } = useModalViewport(isOpen);

  useEffect(() => {
    if (!isOpen) return;
    setErrorMessage(null);
    setIsConfirmingDelete(false);

    if (initialInspection) {
      setInspectionDate(initialInspection.inspectionDate);
      setExpiryDate(initialInspection.expiryDate);
      setStationName(initialInspection.stationName ?? '');
      setCost(String(initialInspection.cost));
      setMemo(initialInspection.memo ?? '');
      setIsCurrent(initialInspection.isCurrent);
    } else {
      const today = new Date();
      const twoYearsLater = addYearsClamped(today, 2);
      setInspectionDate(formatDateDot(today));
      setExpiryDate(formatDateDot(twoYearsLater));
      setStationName('');
      setCost('');
      setMemo('');
      setIsCurrent(true);
    }
  }, [isOpen, initialInspection]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!inspectionDate.trim()) {
      setErrorMessage('검사일을 입력해 주세요.');
      return;
    }
    let formattedInspectionDate: string;
    try {
      formattedInspectionDate = formatDateDot(
        parseDateString(inspectionDate.trim()),
      );
    } catch {
      setErrorMessage('검사일은 YYYY.MM.DD 형식으로 입력해 주세요.');
      return;
    }

    if (!expiryDate.trim()) {
      setErrorMessage('다음 만기일을 입력해 주세요.');
      return;
    }
    let formattedExpiryDate: string;
    try {
      formattedExpiryDate = formatDateDot(parseDateString(expiryDate.trim()));
    } catch {
      setErrorMessage('다음 만기일은 YYYY.MM.DD 형식으로 입력해 주세요.');
      return;
    }

    if (cost.trim() === '') {
      setErrorMessage('검사 비용을 입력해 주세요.');
      return;
    }
    const parsedCost = Number(cost);
    if (!Number.isFinite(parsedCost) || parsedCost < 0) {
      setErrorMessage('검사 비용은 0원 이상의 숫자로 입력해 주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        id: initialInspection?.id,
        vehicleId,
        inspectionDate: formattedInspectionDate,
        expiryDate: formattedExpiryDate,
        stationName: stationName.trim() || undefined,
        cost: Math.round(parsedCost),
        memo: memo.trim() || undefined,
        attachmentIds: initialInspection?.attachmentIds ?? [],
        isCurrent,
      });
      onClose();
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : '자동차 검사 정보 저장 중 오류가 발생했습니다.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!initialInspection || !onDelete) return;
    setIsSubmitting(true);
    try {
      await onDelete(initialInspection.id);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="inspection-modal-title"
    >
      <div
        className="modal-sheet"
        style={sheetStyle}
        onFocusCapture={handleFieldFocusCapture}
      >
        <header className="modal-header">
          <h2 id="inspection-modal-title" className="modal-title">
            {isEditMode ? '자동차 검사 수정' : '자동차 검사 등록'}
          </h2>
          <button
            type="button"
            className="btn-icon touch-target"
            onClick={onClose}
            aria-label="닫기"
          >
            ✕
          </button>
        </header>

        <form onSubmit={handleSubmit} className="vehicle-form" noValidate>
          {errorMessage && (
            <p className="form-error-banner" role="alert">
              {errorMessage}
            </p>
          )}

          <div className="form-row-2col">
            <div className="form-field">
              <label htmlFor="insp-date" className="form-label">
                검사일 <span className="required-mark">*</span>
              </label>
              <input
                id="insp-date"
                type="text"
                inputMode="numeric"
                className="form-input touch-target"
                placeholder="YYYY.MM.DD"
                value={inspectionDate}
                onChange={(e) => setInspectionDate(e.target.value)}
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="insp-expiry" className="form-label">
                다음 만기일 <span className="required-mark">*</span>
              </label>
              <input
                id="insp-expiry"
                type="text"
                inputMode="numeric"
                className="form-input touch-target"
                placeholder="YYYY.MM.DD"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-row-2col">
            <div className="form-field">
              <label htmlFor="insp-station" className="form-label">
                검사소
              </label>
              <input
                id="insp-station"
                type="text"
                className="form-input touch-target"
                placeholder="예: 성산검사소"
                value={stationName}
                onChange={(e) => setStationName(e.target.value)}
              />
            </div>

            <div className="form-field">
              <label htmlFor="insp-cost" className="form-label">
                검사 비용 (원) <span className="required-mark">*</span>
              </label>
              <input
                id="insp-cost"
                type="number"
                inputMode="numeric"
                className="form-input touch-target"
                placeholder="예: 56000"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="insp-memo" className="form-label">
              메모
            </label>
            <textarea
              id="insp-memo"
              rows={2}
              className="form-input"
              placeholder="종합검사 적합 판정, 배출가스 수치 등 메모"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
            />
          </div>

          <label className="checkbox-field touch-target">
            <input
              type="checkbox"
              checked={isCurrent}
              onChange={(e) => setIsCurrent(e.target.checked)}
            />
            <span>현재 유효한 검사 항목으로 표시</span>
          </label>

          {isEditMode && onDelete && isConfirmingDelete ? (
            <div
              className="delete-confirm-box"
              role="alertdialog"
              aria-label="검사 내역 삭제 확인"
            >
              <p className="delete-confirm-text">
                이 자동차 검사 이력을 삭제하시겠습니까?
              </p>
              <div className="delete-confirm-actions">
                <button
                  type="button"
                  className="btn btn-secondary touch-target"
                  onClick={() => setIsConfirmingDelete(false)}
                  disabled={isSubmitting}
                >
                  삭제 취소
                </button>
                <button
                  type="button"
                  className="btn btn-danger touch-target"
                  onClick={handleConfirmDelete}
                  disabled={isSubmitting}
                >
                  삭제 확인
                </button>
              </div>
            </div>
          ) : (
            <div className="modal-actions">
              {isEditMode && onDelete && (
                <button
                  type="button"
                  className="btn btn-danger-outline touch-target"
                  onClick={() => setIsConfirmingDelete(true)}
                  disabled={isSubmitting}
                >
                  삭제
                </button>
              )}
              <button
                type="button"
                className="btn btn-secondary touch-target"
                onClick={onClose}
                disabled={isSubmitting}
              >
                취소
              </button>
              <button
                type="submit"
                className="btn btn-primary touch-target"
                disabled={isSubmitting}
              >
                {isEditMode ? '수정 저장' : '검사 등록'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
