import React, { useEffect, useRef, useState } from 'react';
import { Vehicle, VehicleInput } from '../../domain/models';
import {
  compressImageFile,
  formatDateDot,
  parseDateString,
  useModalViewport,
} from '../../shared/utils';

export const VEHICLE_BG_PRESETS = [
  { value: 'auto', label: '자동 (차종 인식)' },
  { value: 'sedan', label: '세단' },
  { value: 'suv', label: 'SUV' },
  { value: 'camper', label: '모터홈·캠핑카' },
  { value: 'sports', label: '스포츠 쿠페' },
  { value: 'none', label: '배경 없음' },
] as const;

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('이미지를 읽지 못했습니다.'));
      }
    };
    reader.onerror = () => reject(new Error('이미지를 읽는 중 오류가 발생했습니다.'));
    reader.readAsDataURL(blob);
  });
}

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

  const [registrationDate, setRegistrationDate] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [purchaseMileage, setPurchaseMileage] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [vin, setVin] = useState('');
  const [tireSize, setTireSize] = useState('');
  const [vehiclePrice, setVehiclePrice] = useState('');
  const [engineSpec, setEngineSpec] = useState('');
  const [performanceSpec, setPerformanceSpec] = useState('');
  const [transmission, setTransmission] = useState('');
  const [fuelSpec, setFuelSpec] = useState('');
  const [dimensionSpec, setDimensionSpec] = useState('');
  const [consumablesSpec, setConsumablesSpec] = useState('');
  const [colorSpec, setColorSpec] = useState('');
  const [options, setOptions] = useState('');
  const [tinting, setTinting] = useState('');
  const [memo, setMemo] = useState('');
  const [backgroundImage, setBackgroundImage] = useState('auto');
  const [isSpecsExpanded, setIsSpecsExpanded] = useState(false);
  const bgFileInputRef = useRef<HTMLInputElement | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { sheetStyle, handleFieldFocusCapture } = useModalViewport(isOpen);

  useEffect(() => {
    if (!isOpen) return;
    setErrorMessage(null);
    setIsConfirmingDelete(false);
    if (initialVehicle) {
      setName(initialVehicle.name);
      setPlateNumber(initialVehicle.plateNumber);
      setManufacturerModel(initialVehicle.manufacturerModel);
      setModelYear(String(initialVehicle.modelYear));
      setCurrentMileage(String(initialVehicle.currentMileage));
      setRegistrationDate(initialVehicle.registrationDate ?? '');
      setPurchaseDate(initialVehicle.purchaseDate ?? '');
      setPurchaseMileage(
        typeof initialVehicle.purchaseMileage === 'number'
          ? String(initialVehicle.purchaseMileage)
          : '',
      );
      setPurchasePrice(
        typeof initialVehicle.purchasePrice === 'number'
          ? String(initialVehicle.purchasePrice)
          : '',
      );
      setVin(initialVehicle.vin ?? '');
      setTireSize(initialVehicle.tireSize ?? '');
      setVehiclePrice(
        typeof initialVehicle.vehiclePrice === 'number'
          ? String(initialVehicle.vehiclePrice)
          : '',
      );
      setEngineSpec(initialVehicle.engineSpec ?? '');
      setPerformanceSpec(initialVehicle.performanceSpec ?? '');
      setTransmission(initialVehicle.transmission ?? '');
      setFuelSpec(initialVehicle.fuelSpec ?? '');
      setDimensionSpec(initialVehicle.dimensionSpec ?? '');
      setConsumablesSpec(initialVehicle.consumablesSpec ?? '');
      setColorSpec(initialVehicle.colorSpec ?? '');
      setOptions(initialVehicle.options ?? '');
      setTinting(initialVehicle.tinting ?? '');
      setMemo(initialVehicle.memo ?? '');
      setBackgroundImage(initialVehicle.backgroundImage ?? 'auto');
      setIsSpecsExpanded(
        Boolean(
          initialVehicle.registrationDate ||
            initialVehicle.purchaseDate ||
            initialVehicle.purchaseMileage ||
            initialVehicle.purchasePrice ||
            initialVehicle.vin ||
            initialVehicle.tireSize ||
            initialVehicle.vehiclePrice ||
            initialVehicle.engineSpec ||
            initialVehicle.performanceSpec ||
            initialVehicle.transmission ||
            initialVehicle.fuelSpec ||
            initialVehicle.dimensionSpec ||
            initialVehicle.consumablesSpec ||
            initialVehicle.colorSpec ||
            initialVehicle.options ||
            initialVehicle.tinting ||
            initialVehicle.memo,
        ),
      );
    } else {
      setName('');
      setPlateNumber('');
      setManufacturerModel('');
      setModelYear(String(currentYear));
      setCurrentMileage('');
      setRegistrationDate('');
      setPurchaseDate('');
      setPurchaseMileage('');
      setPurchasePrice('');
      setVin('');
      setTireSize('');
      setVehiclePrice('');
      setEngineSpec('');
      setPerformanceSpec('');
      setTransmission('');
      setFuelSpec('');
      setDimensionSpec('');
      setConsumablesSpec('');
      setColorSpec('');
      setOptions('');
      setTinting('');
      setMemo('');
      setBackgroundImage('auto');
      setIsSpecsExpanded(false);
    }
  }, [isOpen, initialVehicle, currentYear]);

  if (!isOpen) {
    return null;
  }

  const isCustomPhotoBg = backgroundImage.startsWith('data:image/');

  const handleBgPhotoSelect = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setErrorMessage(null);
    try {
      let targetBlob: Blob = file;
      try {
        targetBlob = await compressImageFile(file, {
          maxLongEdge: 960,
          quality: 0.72,
        });
      } catch {
        targetBlob = file;
      }
      const dataUrl = await blobToDataUrl(targetBlob);
      setBackgroundImage(dataUrl);
    } catch {
      setErrorMessage('배경 이미지를 불러오지 못했습니다.');
    }
  };

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

    let formattedRegDate: string | undefined;
    if (registrationDate.trim()) {
      try {
        formattedRegDate = formatDateDot(
          parseDateString(registrationDate.trim()),
        );
      } catch {
        setErrorMessage('최초 등록일은 YYYY.MM.DD 형식으로 입력해 주세요.');
        return;
      }
    }

    let formattedPurchaseDate: string | undefined;
    if (purchaseDate.trim()) {
      try {
        formattedPurchaseDate = formatDateDot(
          parseDateString(purchaseDate.trim()),
        );
      } catch {
        setErrorMessage('구매(인수)일은 YYYY.MM.DD 형식으로 입력해 주세요.');
        return;
      }
    }

    let parsedPurchaseMileage: number | undefined;
    if (purchaseMileage.trim()) {
      const numMileage = Number(purchaseMileage.replace(/,/g, '').trim());
      if (!Number.isFinite(numMileage) || numMileage < 0) {
        setErrorMessage('구매(인수) 주행거리는 0 이상의 숫자로 입력해 주세요.');
        return;
      }
      parsedPurchaseMileage = Math.round(numMileage);
    }

    let parsedPurchasePrice: number | undefined;
    if (purchasePrice.trim()) {
      const numPurchasePrice = Number(purchasePrice.replace(/,/g, '').trim());
      if (!Number.isFinite(numPurchasePrice) || numPurchasePrice < 0) {
        setErrorMessage('실구매가는 0원 이상의 숫자로 입력해 주세요.');
        return;
      }
      parsedPurchasePrice = Math.round(numPurchasePrice);
    }

    let parsedPrice: number | undefined;
    if (vehiclePrice.trim()) {
      const numPrice = Number(vehiclePrice.replace(/,/g, '').trim());
      if (!Number.isFinite(numPrice) || numPrice < 0) {
        setErrorMessage('차량가는 0원 이상의 숫자로 입력해 주세요.');
        return;
      }
      parsedPrice = Math.round(numPrice);
    }

    const roundedMileage = Math.round(parsedMileage);
    const resolvedMileageDate =
      !initialVehicle || roundedMileage !== initialVehicle.currentMileage
        ? formatDateDot(new Date())
        : initialVehicle.mileageUpdatedAt;

    setIsSubmitting(true);
    try {
      await onSubmit({
        id: initialVehicle?.id,
        name: trimmedName,
        plateNumber: trimmedPlate,
        manufacturerModel: trimmedModel,
        modelYear: parsedYear,
        currentMileage: roundedMileage,
        mileageUpdatedAt: resolvedMileageDate,
        registrationDate: formattedRegDate,
        purchaseDate: formattedPurchaseDate,
        purchaseMileage: parsedPurchaseMileage,
        purchasePrice: parsedPurchasePrice,
        vin: vin.trim() || undefined,
        tireSize: tireSize.trim() || undefined,
        vehiclePrice: parsedPrice,
        engineSpec: engineSpec.trim() || undefined,
        performanceSpec: performanceSpec.trim() || undefined,
        transmission: transmission.trim() || undefined,
        fuelSpec: fuelSpec.trim() || undefined,
        dimensionSpec: dimensionSpec.trim() || undefined,
        consumablesSpec: consumablesSpec.trim() || undefined,
        colorSpec: colorSpec.trim() || undefined,
        options: options.trim() || undefined,
        tinting: tinting.trim() || undefined,
        memo: memo.trim() || undefined,
        backgroundImage:
          backgroundImage && backgroundImage !== 'auto'
            ? backgroundImage
            : undefined,
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

  const handleConfirmDelete = async () => {
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
      <div
        className="modal-sheet"
        style={sheetStyle}
        onFocusCapture={handleFieldFocusCapture}
      >
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

          <div className="form-field vehicle-bg-picker-field">
            <div className="vehicle-bg-picker-header">
              <span className="form-label">카드 배경 이미지 · 스타일</span>
              <input
                ref={bgFileInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                data-testid="vehicle-bg-file-input"
                onChange={(e) => void handleBgPhotoSelect(e)}
              />
              <button
                type="button"
                className="btn btn-chip-primary"
                onClick={() => bgFileInputRef.current?.click()}
              >
                📷 내 차 사진 업로드
              </button>
            </div>

            {isCustomPhotoBg ? (
              <div
                className="vehicle-bg-custom-preview"
                data-testid="vehicle-bg-custom-preview"
              >
                <div
                  className="vehicle-bg-preview-thumb"
                  style={{ backgroundImage: `url(${backgroundImage})` }}
                />
                <div className="vehicle-bg-preview-info">
                  <strong>사용자 지정 차량 사진 적용됨</strong>
                  <span>카드 배경에 선택한 사진이 표시됩니다.</span>
                </div>
                <button
                  type="button"
                  className="btn btn-chip"
                  onClick={() => setBackgroundImage('auto')}
                >
                  기본 일러스트로 변경
                </button>
              </div>
            ) : (
              <div
                className="multi-category-chip-group"
                role="group"
                aria-label="차량 카드 배경 스타일 선택"
              >
                {VEHICLE_BG_PRESETS.map((preset) => {
                  const isActive = backgroundImage === preset.value;
                  return (
                    <button
                      key={preset.value}
                      type="button"
                      className={`filter-chip${isActive ? ' active' : ''}`}
                      onClick={() => setBackgroundImage(preset.value)}
                      aria-pressed={isActive}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="vehicle-specs-toggle-box">
            <button
              type="button"
              className="btn btn-secondary touch-target vehicle-specs-toggle-btn"
              onClick={() => setIsSpecsExpanded((prev) => !prev)}
              aria-expanded={isSpecsExpanded}
            >
              {isSpecsExpanded
                ? '▲ 제원 · 옵션 · 틴팅 상세 입력 접기'
                : '▼ 제원 · 옵션 · 틴팅 상세 입력 (선택)'}
            </button>
          </div>

          {isSpecsExpanded && (
            <div
              className="vehicle-specs-form-section"
              data-testid="vehicle-specs-form-section"
            >
              <div className="form-row-2col">
                <div className="form-field">
                  <label htmlFor="vehicle-reg-date" className="form-label">
                    최초 등록일
                  </label>
                  <input
                    id="vehicle-reg-date"
                    type="text"
                    inputMode="numeric"
                    className="form-input touch-target"
                    placeholder="예: 2023.05.26"
                    value={registrationDate}
                    onChange={(e) => setRegistrationDate(e.target.value)}
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="vehicle-price" className="form-label">
                    출고 차량가 (원)
                  </label>
                  <input
                    id="vehicle-price"
                    type="number"
                    inputMode="numeric"
                    className="form-input touch-target"
                    placeholder="예: 57700000"
                    value={vehiclePrice}
                    onChange={(e) => setVehiclePrice(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row-2col">
                <div className="form-field">
                  <label htmlFor="vehicle-purchase-date" className="form-label">
                    구매(인수)일
                  </label>
                  <input
                    id="vehicle-purchase-date"
                    type="text"
                    inputMode="numeric"
                    className="form-input touch-target"
                    placeholder="예: 2025.08.14"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                  />
                </div>

                <div className="form-field">
                  <label
                    htmlFor="vehicle-purchase-mileage"
                    className="form-label"
                  >
                    인수 당시 주행거리 (km)
                  </label>
                  <input
                    id="vehicle-purchase-mileage"
                    type="number"
                    inputMode="numeric"
                    className="form-input touch-target"
                    placeholder="예: 56200"
                    value={purchaseMileage}
                    onChange={(e) => setPurchaseMileage(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row-2col">
                <div className="form-field">
                  <label
                    htmlFor="vehicle-purchase-price"
                    className="form-label"
                  >
                    실구매가 (원)
                  </label>
                  <input
                    id="vehicle-purchase-price"
                    type="number"
                    inputMode="numeric"
                    className="form-input touch-target"
                    placeholder="예: 50000000"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="vehicle-color" className="form-label">
                    외장 색상 · 컬러코드
                  </label>
                  <input
                    id="vehicle-color"
                    type="text"
                    className="form-input touch-target"
                    placeholder="예: 망가니즈루스터 (도요타 1K2)"
                    value={colorSpec}
                    onChange={(e) => setColorSpec(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row-2col">
                <div className="form-field">
                  <label htmlFor="vehicle-vin" className="form-label">
                    차대번호 (VIN)
                  </label>
                  <input
                    id="vehicle-vin"
                    type="text"
                    className="form-input touch-target"
                    placeholder="예: WBA31FU07PFP40365"
                    value={vin}
                    onChange={(e) => setVin(e.target.value)}
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="vehicle-tire" className="form-label">
                    타이어 규격 · 공기압
                  </label>
                  <input
                    id="vehicle-tire"
                    type="text"
                    className="form-input touch-target"
                    placeholder="예: 245/45R20 (39psi)"
                    value={tireSize}
                    onChange={(e) => setTireSize(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="vehicle-engine" className="form-label">
                  엔진 제원
                </label>
                <input
                  id="vehicle-engine"
                  type="text"
                  className="form-input touch-target"
                  placeholder="예: B47 1,995cc / 트윈터보 직렬 4기통 디젤"
                  value={engineSpec}
                  onChange={(e) => setEngineSpec(e.target.value)}
                />
              </div>

              <div className="form-field">
                <label htmlFor="vehicle-perf" className="form-label">
                  출력 · 토크 · 제로백
                </label>
                <input
                  id="vehicle-perf"
                  type="text"
                  className="form-input touch-target"
                  placeholder="예: 190마력, 40.8토크(1750~2500RPM) · 제로백 6.9초"
                  value={performanceSpec}
                  onChange={(e) => setPerformanceSpec(e.target.value)}
                />
              </div>

              <div className="form-row-2col">
                <div className="form-field">
                  <label htmlFor="vehicle-transmission" className="form-label">
                    변속기
                  </label>
                  <input
                    id="vehicle-transmission"
                    type="text"
                    className="form-input touch-target"
                    placeholder="예: 스텝트로닉 스포츠 자동 8단"
                    value={transmission}
                    onChange={(e) => setTransmission(e.target.value)}
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="vehicle-fuel" className="form-label">
                    연료탱크 · 복합연비
                  </label>
                  <input
                    id="vehicle-fuel"
                    type="text"
                    className="form-input touch-target"
                    placeholder="예: 59L · 복합연비 15.0km/L"
                    value={fuelSpec}
                    onChange={(e) => setFuelSpec(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="vehicle-dimension" className="form-label">
                  차체 치수 · 공차중량
                </label>
                <input
                  id="vehicle-dimension"
                  type="text"
                  className="form-input touch-target"
                  placeholder="예: 전장/전폭 5235/1900mm · 축거 3125mm · 공차중량 2330kg"
                  value={dimensionSpec}
                  onChange={(e) => setDimensionSpec(e.target.value)}
                />
              </div>

              <div className="form-field">
                <label htmlFor="vehicle-consumables" className="form-label">
                  소모품 사이즈 규격 (에어컨필터 등)
                </label>
                <input
                  id="vehicle-consumables"
                  type="text"
                  className="form-input touch-target"
                  placeholder="예: 에어컨필터 사이즈 245 * 178 * 28"
                  value={consumablesSpec}
                  onChange={(e) => setConsumablesSpec(e.target.value)}
                />
              </div>

              <div className="form-field">
                <label htmlFor="vehicle-options" className="form-label">
                  장착 옵션 · 시공 내역
                </label>
                <input
                  id="vehicle-options"
                  type="text"
                  className="form-input touch-target"
                  placeholder="예: Car eye 3.0 블랙박스, 신차 유리막, 생활ppf, 하이패스"
                  value={options}
                  onChange={(e) => setOptions(e.target.value)}
                />
              </div>

              <div className="form-field">
                <label htmlFor="vehicle-tinting" className="form-label">
                  틴팅 (썬팅)
                </label>
                <input
                  id="vehicle-tinting"
                  type="text"
                  className="form-input touch-target"
                  placeholder="예: 레이노 S9 전면 45%, 측후면 35%"
                  value={tinting}
                  onChange={(e) => setTinting(e.target.value)}
                />
              </div>

              <div className="form-field">
                <label htmlFor="vehicle-memo" className="form-label">
                  차량 관리 메모 (내비게이션 계정 · 비밀번호 · 쿠폰 잔여 등)
                </label>
                <textarea
                  id="vehicle-memo"
                  rows={3}
                  className="form-input"
                  placeholder="내비 업데이트 아이디/비밀번호, 잔여 쿠폰 등을 직접 입력해 두세요"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                />
              </div>
            </div>
          )}

          {isEditMode && onDelete && isConfirmingDelete ? (
            <div
              className="delete-confirm-box"
              role="alertdialog"
              aria-label="차량 삭제 확인"
            >
              <p className="delete-confirm-text">
                이 차량을 삭제하면 연관된 모든 정비·검사·보험 기록과 첨부 사진이 함께 삭제됩니다. 정말 삭제하시겠습니까?
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
          )}
        </form>
      </div>
    </div>
  );
};
