import React, { useEffect, useState } from 'react';
import { useRepositories } from '../../app/RepositoryContext';
import { Insurance } from '../../domain/models';
import {
  PhotoAttachmentField,
  PhotoDraftItem,
} from '../../shared/components/PhotoAttachmentField';
import { formatDateDot, parseDateString } from '../../shared/utils';

export type InsuranceFormSubmitData = Omit<Insurance, 'id'> & {
  id?: string;
};

export interface InsuranceFormModalProps {
  isOpen: boolean;
  vehicleId: string;
  initialInsurance?: Insurance | null;
  onClose: () => void;
  onSubmit: (data: InsuranceFormSubmitData) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export const InsuranceFormModal: React.FC<InsuranceFormModalProps> = ({
  isOpen,
  vehicleId,
  initialInsurance,
  onClose,
  onSubmit,
  onDelete,
}) => {
  const { attachmentRepo } = useRepositories();
  const isEditMode = Boolean(initialInsurance);

  const [companyName, setCompanyName] = useState('');
  const [productName, setProductName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [premiumCost, setPremiumCost] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [memo, setMemo] = useState('');
  const [isCurrent, setIsCurrent] = useState(true);
  const [photos, setPhotos] = useState<PhotoDraftItem[]>([]);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    const createdUrls: string[] = [];

    setErrorMessage(null);
    setIsConfirmingDelete(false);

    if (initialInsurance) {
      setCompanyName(initialInsurance.companyName);
      setProductName(initialInsurance.productName ?? '');
      setStartDate(initialInsurance.startDate);
      setEndDate(initialInsurance.endDate);
      setPremiumCost(String(initialInsurance.premiumCost));
      setEmergencyPhone(initialInsurance.emergencyPhone ?? '');
      setMemo(initialInsurance.memo ?? '');
      setIsCurrent(initialInsurance.isCurrent);

      if (
        initialInsurance.attachmentIds &&
        initialInsurance.attachmentIds.length > 0
      ) {
        void attachmentRepo
          .getByIds(initialInsurance.attachmentIds)
          .then((records) => {
            if (!isMounted) return;
            const drafts: PhotoDraftItem[] = records.map((rec) => {
              const previewUrl = URL.createObjectURL(rec.blob);
              createdUrls.push(previewUrl);
              return {
                key: `existing-${rec.id}`,
                existingAttachmentId: rec.id,
                blob: rec.blob,
                fileName: rec.fileName,
                previewUrl,
              };
            });
            setPhotos(drafts);
          });
      } else {
        setPhotos([]);
      }
    } else {
      const today = new Date();
      const oneYearLater = new Date(
        today.getFullYear() + 1,
        today.getMonth(),
        today.getDate(),
      );
      setCompanyName('');
      setProductName('');
      setStartDate(formatDateDot(today));
      setEndDate(formatDateDot(oneYearLater));
      setPremiumCost('');
      setEmergencyPhone('');
      setMemo('');
      setIsCurrent(true);
      setPhotos([]);
    }

    return () => {
      isMounted = false;
      createdUrls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [isOpen, initialInsurance, attachmentRepo]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!companyName.trim()) {
      setErrorMessage('보험사명을 입력해 주세요.');
      return;
    }

    if (!startDate.trim()) {
      setErrorMessage('보험 시작일을 입력해 주세요.');
      return;
    }
    let formattedStartDate: string;
    try {
      formattedStartDate = formatDateDot(parseDateString(startDate.trim()));
    } catch {
      setErrorMessage('보험 시작일은 YYYY.MM.DD 형식으로 입력해 주세요.');
      return;
    }

    if (!endDate.trim()) {
      setErrorMessage('보험 만기일을 입력해 주세요.');
      return;
    }
    let formattedEndDate: string;
    try {
      formattedEndDate = formatDateDot(parseDateString(endDate.trim()));
    } catch {
      setErrorMessage('보험 만기일은 YYYY.MM.DD 형식으로 입력해 주세요.');
      return;
    }

    if (premiumCost.trim() === '') {
      setErrorMessage('보험료를 입력해 주세요.');
      return;
    }
    const parsedCost = Number(premiumCost);
    if (!Number.isFinite(parsedCost) || parsedCost < 0) {
      setErrorMessage('보험료는 0원 이상의 숫자로 입력해 주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      const originalIds = initialInsurance?.attachmentIds ?? [];
      const keptExistingIds = photos
        .map((p) => p.existingAttachmentId)
        .filter((id): id is string => Boolean(id));
      const removedIds = originalIds.filter(
        (id) => !keptExistingIds.includes(id),
      );

      if (removedIds.length > 0) {
        await attachmentRepo.deleteMany(removedIds);
      }

      const finalAttachmentIds: string[] = [];
      for (const item of photos) {
        if (item.existingAttachmentId) {
          finalAttachmentIds.push(item.existingAttachmentId);
        } else {
          const savedAtt = await attachmentRepo.save({
            parentType: 'insurance',
            parentId: initialInsurance?.id ?? vehicleId,
            blob: item.blob,
            fileName: item.fileName,
          });
          finalAttachmentIds.push(savedAtt.id);
        }
      }

      await onSubmit({
        id: initialInsurance?.id,
        vehicleId,
        companyName: companyName.trim(),
        productName: productName.trim() || undefined,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        premiumCost: Math.round(parsedCost),
        emergencyPhone: emergencyPhone.trim() || undefined,
        memo: memo.trim() || undefined,
        attachmentIds: finalAttachmentIds,
        isCurrent,
      });
      onClose();
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : '자동차 보험 정보 저장 중 오류가 발생했습니다.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!initialInsurance || !onDelete) return;
    setIsSubmitting(true);
    try {
      await onDelete(initialInsurance.id);
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
      aria-labelledby="insurance-modal-title"
    >
      <div className="modal-sheet">
        <header className="modal-header">
          <h2 id="insurance-modal-title" className="modal-title">
            {isEditMode ? '자동차 보험 수정' : '자동차 보험 등록'}
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
              <label htmlFor="ins-company" className="form-label">
                보험사 <span className="required-mark">*</span>
              </label>
              <input
                id="ins-company"
                type="text"
                className="form-input touch-target"
                placeholder="예: 삼성화재, 현대해상"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="ins-product" className="form-label">
                상품명
              </label>
              <input
                id="ins-product"
                type="text"
                className="form-input touch-target"
                placeholder="예: 다이렉트 개인용"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
              />
            </div>
          </div>

          <div className="form-row-2col">
            <div className="form-field">
              <label htmlFor="ins-start" className="form-label">
                보험 시작일 <span className="required-mark">*</span>
              </label>
              <input
                id="ins-start"
                type="text"
                className="form-input touch-target"
                placeholder="YYYY.MM.DD"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="ins-end" className="form-label">
                보험 만기일 <span className="required-mark">*</span>
              </label>
              <input
                id="ins-end"
                type="text"
                className="form-input touch-target"
                placeholder="YYYY.MM.DD"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-row-2col">
            <div className="form-field">
              <label htmlFor="ins-cost" className="form-label">
                보험료 (원) <span className="required-mark">*</span>
              </label>
              <input
                id="ins-cost"
                type="number"
                inputMode="numeric"
                className="form-input touch-target"
                placeholder="예: 680000"
                value={premiumCost}
                onChange={(e) => setPremiumCost(e.target.value)}
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="ins-phone" className="form-label">
                연락처 (긴급출동)
              </label>
              <input
                id="ins-phone"
                type="tel"
                className="form-input touch-target"
                placeholder="예: 1588-5114"
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="ins-memo" className="form-label">
              담보 메모
            </label>
            <textarea
              id="ins-memo"
              rows={2}
              className="form-input"
              placeholder="대물배상 10억, 자동차상해, 부부한정 등 주요 특약 메모"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
            />
          </div>

          <PhotoAttachmentField photos={photos} onChange={setPhotos} />

          <label className="checkbox-field touch-target">
            <input
              type="checkbox"
              checked={isCurrent}
              onChange={(e) => setIsCurrent(e.target.checked)}
            />
            <span>현재 유효한 보험 항목으로 표시</span>
          </label>

          {isEditMode && onDelete && isConfirmingDelete ? (
            <div
              className="delete-confirm-box"
              role="alertdialog"
              aria-label="보험 내역 삭제 확인"
            >
              <p className="delete-confirm-text">
                이 자동차 보험 이력을 삭제하시겠습니까?
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
                {isEditMode ? '수정 저장' : '보험 등록'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
