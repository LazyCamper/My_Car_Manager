import React, { useEffect, useState } from 'react';
import { Vehicle, VehicleInput } from '../../domain/models';

export interface VehicleFormModalProps {
  isOpen: boolean;
  initialVehicle?: Vehicle | null;
  onClose: () => void;
  onSubmit: (input: VehicleInput) => Promise<void>;
  onDelete?: (vehicleId: string) => Promise<void>;
}

export const VehicleFormModal: React.FC<VehicleFormModalProps> = ({
  isOpen,
  initialVehicle,
  onClose,
  onSubmit,
  onDelete,
}) => {
  const isEditMode = Boolean(initialVehicle);
  const currentYear = new Date().getFullYear();

  const [name, setName] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [manufacturerModel, setManufacturerModel] = useState('');
  const [modelYear, setModelYear] = useState(String(currentYear));
  const [currentMileage, setCurrentMileage] = useState('0');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setErrorMessage(null);
    if (initialVehicle) {
      setName(initialVehicle.name);
      setPlateNumber(initialVehicle.plateNumber);
      setManufacturerModel(initialVehicle.manufacturerModel);
      setModelYear(String(initialVehicle.modelYear));
      setCurrentMileage(String(initialVehicle.currentMileage));
    } else {
      setName('');
      setPlateNumber('');
      setManufacturerModel('');
      setModelYear(String(currentYear));
      setCurrentMileage('');
    }
  }, [isOpen, initialVehicle, currentYear]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedName = name.trim();
    const trimmedPlate = plateNumber.trim();
    const trimmedModel = manufacturerModel.trim();
    const parsedYear = Number(modelYear);
    const parsedMileage = Number(currentMileage || '0');

    if (!trimmedName) {
      setErrorMessage('차량 이름(별칭)을 입력해 주세요.');
      return;
    }
    if (!trimmedPlate) {
      setErrorMessage('차량 번호판을 입력해 주세요.');
      return;
    }
    if (!trimmedModel) {
      setErrorMessage('제조사/모델명을 입력해 주세요.');
      return;
    }
    if (
      !Number.isInteger(parsedYear) ||
      parsedYear < 1970 ||
      parsedYear > currentYear + 2
    ) {
      setErrorMessage('올바른 연식을 입력해 주세요. (예: 2023)');
      return;
    }
    if (!Number.isFinite(parsedMileage) || parsedMileage < 0) {
      setErrorMessage('현재 주행거리는 0 이상의 숫자로 입력해 주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        id: initialVehicle?.id,
        name: trimmedName,
        plateNumber: trimmedPlate,
        manufacturerModel: trimmedModel,
        modelYear: parsedYear,
        currentMileage: Math.round(parsedMileage),
      });
      onClose();
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : '차량 정보를 저장하는 중 오류가 발생했습니다.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!initialVehicle || !onDelete) return;
    setIsSubmitting(true);
    try {
      await onDelete(initialVehicle.id);
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
      aria-labelledby="vehicle-modal-title"
    >
      <div className="modal-sheet">
        <header className="modal-header">
          <h2 id="vehicle-modal-title" className="modal-title">
            {isEditMode ? '차량 정보 수정' : '새 차량 등록'}
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

          <div className="form-field">
            <label htmlFor="vehicle-name" className="form-label">
              차량 이름(별칭) <span className="required-mark">*</span>
            </label>
            <input
              id="vehicle-name"
              type="text"
              className="form-input touch-target"
              placeholder="예: 패밀리카, 출퇴근 차"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="vehicle-plate" className="form-label">
              번호판 <span className="required-mark">*</span>
            </label>
            <input
              id="vehicle-plate"
              type="text"
              className="form-input touch-target"
              placeholder="예: 12가 3456"
              value={plateNumber}
              onChange={(e) => setPlateNumber(e.target.value)}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="vehicle-model" className="form-label">
              제조사/모델 <span className="required-mark">*</span>
            </label>
            <input
              id="vehicle-model"
              type="text"
              className="form-input touch-target"
              placeholder="예: 기아 쏘렌토 하이브리드"
              value={manufacturerModel}
              onChange={(e) => setManufacturerModel(e.target.value)}
              required
            />
          </div>

          <div className="form-row-2col">
            <div className="form-field">
              <label htmlFor="vehicle-year" className="form-label">
                연식 (년) <span className="required-mark">*</span>
              </label>
              <input
                id="vehicle-year"
                type="number"
                inputMode="numeric"
                className="form-input touch-target"
                placeholder="예: 2023"
                value={modelYear}
                onChange={(e) => setModelYear(e.target.value)}
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="vehicle-mileage" className="form-label">
                현재 주행거리 (km) <span className="required-mark">*</span>
              </label>
              <input
                id="vehicle-mileage"
                type="number"
                inputMode="numeric"
                className="form-input touch-target"
                placeholder="예: 35000"
                value={currentMileage}
                onChange={(e) => setCurrentMileage(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="modal-actions">
            {isEditMode && onDelete && (
              <button
                type="button"
                className="btn btn-danger-outline touch-target"
                onClick={handleDelete}
                disabled={isSubmitting}
              >
                차량 삭제
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
              {isEditMode ? '수정 저장' : '차량 등록'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
