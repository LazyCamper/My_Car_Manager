import React, { useEffect, useState } from 'react';
import { useRepositories } from '../../app/RepositoryContext';
import { MaintenanceCategory, MaintenanceLog } from '../../domain/models';
import {
  PhotoAttachmentField,
  PhotoDraftItem,
} from '../../shared/components/PhotoAttachmentField';
import {
  formatDateDot,
  parseDateString,
  useModalViewport,
} from '../../shared/utils';
import { getLogCategories, MAINTENANCE_CATEGORY_OPTIONS } from './constants';

export type MaintenanceFormSubmitData = Omit<
  MaintenanceLog,
  'id' | 'createdAt'
> & {
  id?: string;
};

export interface MaintenanceFormModalProps {
  isOpen: boolean;
  vehicleId: string;
  defaultMileage?: number;
  initialLog?: MaintenanceLog | null;
  onClose: () => void;
  onSubmit: (data: MaintenanceFormSubmitData) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export const MaintenanceFormModal: React.FC<MaintenanceFormModalProps> = ({
  isOpen,
  vehicleId,
  defaultMileage = 0,
  initialLog,
  onClose,
  onSubmit,
  onDelete,
}) => {
  const { attachmentRepo } = useRepositories();
  const isEditMode = Boolean(initialLog);

  const [date, setDate] = useState('');
  const [mileage, setMileage] = useState('');
  const [category, setCategory] = useState<MaintenanceCategory>('engine_oil');
  const [selectedCategories, setSelectedCategories] = useState<
    MaintenanceCategory[]
  >(['engine_oil']);
  const [customTitle, setCustomTitle] = useState('엔진오일 교체');
  const [cost, setCost] = useState('');
  const [shopName, setShopName] = useState('');
  const [memo, setMemo] = useState('');
  const [nextDueDate, setNextDueDate] = useState('');
  const [photos, setPhotos] = useState<PhotoDraftItem[]>([]);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { sheetStyle, handleFieldFocusCapture } = useModalViewport(isOpen);

  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    const createdUrls: string[] = [];

    setErrorMessage(null);
    setIsConfirmingDelete(false);

    if (initialLog) {
      setDate(initialLog.date);
      setMileage(
        typeof initialLog.mileage === 'number'
          ? String(initialLog.mileage)
          : '',
      );
      setCategory(initialLog.category);
      setSelectedCategories(getLogCategories(initialLog));
      setCustomTitle(initialLog.title);
      setCost(String(initialLog.cost));
      setShopName(initialLog.shopName ?? '');
      setMemo(initialLog.memo ?? '');
      setNextDueDate(initialLog.nextDueDate ?? '');

      if (initialLog.attachmentIds && initialLog.attachmentIds.length > 0) {
        void attachmentRepo
          .getByIds(initialLog.attachmentIds)
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
      setDate(formatDateDot(new Date()));
      setMileage(defaultMileage > 0 ? String(defaultMileage) : '');
      setCategory('engine_oil');
      setSelectedCategories(['engine_oil']);
      setCustomTitle('엔진오일 교체');
      setCost('');
      setShopName('');
      setMemo('');
      setNextDueDate('');
      setPhotos([]);
    }

    return () => {
      isMounted = false;
      createdUrls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [isOpen, initialLog, defaultMileage, attachmentRepo]);

  if (!isOpen) {
    return null;
  }

  const handleCategoryChange = (nextCategory: MaintenanceCategory) => {
    setCategory(nextCategory);
    setSelectedCategories((prev) =>
      prev.length <= 1 ? [nextCategory] : Array.from(new Set([nextCategory, ...prev])),
    );
    const option = MAINTENANCE_CATEGORY_OPTIONS.find(
      (item) => item.value === nextCategory,
    );
    if (option) {
      setCustomTitle(option.defaultTitle);
    }
  };

  const handleToggleExtraCategory = (targetCat: MaintenanceCategory) => {
    setSelectedCategories((prev) => {
      const exists = prev.includes(targetCat);
      if (exists) {
        if (prev.length === 1) return prev; // 최소 1개 유지
        const next = prev.filter((c) => c !== targetCat);
        if (category === targetCat) {
          setCategory(next[0]);
        }
        return next;
      }
      return [...prev, targetCat];
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedDate = date.trim();
    if (!trimmedDate) {
      setErrorMessage('정비 날짜를 입력해 주세요.');
      return;
    }

    let formattedDate: string;
    try {
      formattedDate = formatDateDot(parseDateString(trimmedDate));
    } catch {
      setErrorMessage('날짜는 YYYY.MM.DD 형식으로 올바르게 입력해 주세요.');
      return;
    }

    let finalMileage: number | undefined;
    if (mileage.trim() !== '') {
      const parsedMileage = Number(mileage);
      if (!Number.isFinite(parsedMileage) || parsedMileage < 0) {
        setErrorMessage('주행거리는 0 이상의 숫자로 입력해 주세요.');
        return;
      }
      finalMileage = Math.round(parsedMileage);
    }

    let finalCost = 0;
    if (cost.trim() !== '') {
      const parsedCost = Number(cost);
      if (!Number.isFinite(parsedCost) || parsedCost < 0) {
        setErrorMessage('비용은 0원 이상의 숫자로 입력해 주세요.');
        return;
      }
      finalCost = Math.round(parsedCost);
    }

    const option = MAINTENANCE_CATEGORY_OPTIONS.find(
      (item) => item.value === category,
    );
    const resolvedTitle = customTitle.trim() || option?.defaultTitle || '';
    if (!resolvedTitle) {
      setErrorMessage('정비 항목명을 입력해 주세요.');
      return;
    }

    let formattedNextDueDate: string | undefined;
    if (nextDueDate.trim()) {
      try {
        formattedNextDueDate = formatDateDot(
          parseDateString(nextDueDate.trim()),
        );
      } catch {
        setErrorMessage(
          '다음 정비 예정일은 YYYY.MM.DD 형식으로 입력해 주세요.',
        );
        return;
      }
    }

    setIsSubmitting(true);
    const newlySavedIds: string[] = [];
    try {
      const originalIds = initialLog?.attachmentIds ?? [];
      const keptExistingIds = photos
        .map((p) => p.existingAttachmentId)
        .filter((id): id is string => Boolean(id));
      const removedIds = originalIds.filter(
        (id) => !keptExistingIds.includes(id),
      );

      const finalAttachmentIds: string[] = [];
      for (const item of photos) {
        if (item.existingAttachmentId) {
          finalAttachmentIds.push(item.existingAttachmentId);
        } else {
          const savedAtt = await attachmentRepo.save({
            parentType: 'maintenance',
            parentId: initialLog?.id ?? vehicleId,
            blob: item.blob,
            fileName: item.fileName,
          });
          newlySavedIds.push(savedAtt.id);
          finalAttachmentIds.push(savedAtt.id);
        }
      }

      const finalCategories =
        selectedCategories.length > 0 ? selectedCategories : [category];

      await onSubmit({
        id: initialLog?.id,
        vehicleId,
        date: formattedDate,
        mileage: finalMileage,
        category: finalCategories[0],
        categories: finalCategories,
        title: resolvedTitle,
        cost: finalCost,
        shopName: shopName.trim() || undefined,
        memo: memo.trim() || undefined,
        nextDueDate: formattedNextDueDate,
        nextDueMileage: initialLog?.nextDueMileage,
        isDueCompleted: initialLog?.isDueCompleted ?? false,
        attachmentIds: finalAttachmentIds,
      });

      // 본문 저장이 성공한 뒤에만 제거된 기존 사진을 삭제하여 실패 시 기존 데이터 유실 방지
      if (removedIds.length > 0) {
        await attachmentRepo.deleteMany(removedIds);
      }

      onClose();
    } catch (err) {
      if (newlySavedIds.length > 0) {
        await attachmentRepo.deleteMany(newlySavedIds).catch(() => undefined);
      }
      setErrorMessage(
        err instanceof Error
          ? err.message
          : '정비 내역 저장 중 오류가 발생했습니다.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!initialLog || !onDelete) return;
    setIsSubmitting(true);
    try {
      await onDelete(initialLog.id);
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
      aria-labelledby="maintenance-modal-title"
    >
      <div
        className="modal-sheet"
        style={sheetStyle}
        onFocusCapture={handleFieldFocusCapture}
      >
        <header className="modal-header">
          <h2 id="maintenance-modal-title" className="modal-title">
            {isEditMode ? '정비 내역 상세 · 수정' : '정비 내역 등록'}
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
              <label htmlFor="maint-date" className="form-label">
                정비 날짜 <span className="required-mark">*</span>
              </label>
              <input
                id="maint-date"
                type="text"
                inputMode="numeric"
                className="form-input touch-target"
                placeholder="예: 2026.05.12 또는 26.5.12"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="maint-mileage" className="form-label">
                주행거리 (km) · 선택
              </label>
              <input
                id="maint-mileage"
                type="number"
                inputMode="numeric"
                className="form-input touch-target"
                placeholder="미입력 시 생략"
                value={mileage}
                onChange={(e) => setMileage(e.target.value)}
              />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="maint-category" className="form-label">
              정비 항목 분류 <span className="required-mark">*</span>
            </label>
            <select
              id="maint-category"
              className="form-input touch-target"
              value={category}
              onChange={(e) =>
                handleCategoryChange(e.target.value as MaintenanceCategory)
              }
            >
              {MAINTENANCE_CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <div
              className="multi-category-chip-group"
              role="group"
              aria-label="복수 정비 항목 태그 선택"
            >
              {MAINTENANCE_CATEGORY_OPTIONS.map((opt) => {
                const isSelected = selectedCategories.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    className={`filter-chip${isSelected ? ' active' : ''}`}
                    onClick={() => handleToggleExtraCategory(opt.value)}
                    aria-pressed={isSelected}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="maint-title" className="form-label">
              정비 항목 상세명 (직접 입력 가능){' '}
              <span className="required-mark">*</span>
            </label>
            <input
              id="maint-title"
              type="text"
              className="form-input touch-target"
              placeholder="예: 합성유 엔진오일 교체, 와이퍼 교체"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-row-2col">
            <div className="form-field">
              <label htmlFor="maint-cost" className="form-label">
                비용 (원) · 미입력 시 0원
              </label>
              <input
                id="maint-cost"
                type="number"
                inputMode="numeric"
                className="form-input touch-target"
                placeholder="보증/보험 수리 시 비워두세요"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
              />
            </div>

            <div className="form-field">
              <label htmlFor="maint-shop" className="form-label">
                정비소
              </label>
              <input
                id="maint-shop"
                type="text"
                className="form-input touch-target"
                placeholder="예: 구미서비스센터"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
              />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="maint-next-due" className="form-label">
              다음 정비 예정일 (선택)
            </label>
            <input
              id="maint-next-due"
              type="text"
              inputMode="numeric"
              className="form-input touch-target"
              placeholder="예: 2027.05.14"
              value={nextDueDate}
              onChange={(e) => setNextDueDate(e.target.value)}
            />
          </div>

          <div className="form-field">
            <label htmlFor="maint-memo" className="form-label">
              메모
            </label>
            <textarea
              id="maint-memo"
              rows={2}
              className="form-input"
              placeholder="교체 부품 브랜드, 특이사항 등을 기록하세요"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
            />
          </div>

          <PhotoAttachmentField photos={photos} onChange={setPhotos} />

          {isEditMode && onDelete && isConfirmingDelete ? (
            <div
              className="delete-confirm-box"
              role="alertdialog"
              aria-label="정비 내역 삭제 확인"
            >
              <p className="delete-confirm-text">
                이 정비 내역을 정말 삭제하시겠습니까?
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
                {isEditMode ? '수정 저장' : '정비 등록'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
