import React, { useState } from 'react';
import { Vehicle } from '../../domain/models';
import { formatCurrency, formatMileage } from '../../shared/utils';

export interface VehicleSwitcherProps {
  vehicles: Vehicle[];
  activeVehicle: Vehicle;
  onSelectVehicle: (vehicleId: string) => void;
  onOpenAddModal: () => void;
  onOpenEditModal: (vehicle: Vehicle) => void;
}

export const VehicleSwitcher: React.FC<VehicleSwitcherProps> = ({
  vehicles,
  activeVehicle,
  onSelectVehicle,
  onOpenAddModal,
  onOpenEditModal,
}) => {
  const [isSpecOpen, setIsSpecOpen] = useState(false);
  const [copiedVin, setCopiedVin] = useState(false);

  const hasDetailSpecs = Boolean(
    activeVehicle.registrationDate ||
      activeVehicle.purchaseDate ||
      activeVehicle.purchaseMileage ||
      activeVehicle.purchasePrice ||
      activeVehicle.vin ||
      activeVehicle.tireSize ||
      activeVehicle.vehiclePrice ||
      activeVehicle.engineSpec ||
      activeVehicle.performanceSpec ||
      activeVehicle.transmission ||
      activeVehicle.fuelSpec ||
      activeVehicle.dimensionSpec ||
      activeVehicle.consumablesSpec ||
      activeVehicle.colorSpec ||
      activeVehicle.options ||
      activeVehicle.tinting ||
      activeVehicle.memo,
  );

  const drivenSincePurchase =
    typeof activeVehicle.purchaseMileage === 'number' &&
    activeVehicle.currentMileage >= activeVehicle.purchaseMileage
      ? activeVehicle.currentMileage - activeVehicle.purchaseMileage
      : undefined;

  const handleCopyVin = async () => {
    if (!activeVehicle.vin) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(activeVehicle.vin);
      }
      setCopiedVin(true);
      setTimeout(() => setCopiedVin(false), 2000);
    } catch {
      setCopiedVin(false);
    }
  };

  return (
    <section className="vehicle-header-card" aria-label="선택된 차량 정보 및 전환">
      <div className="vehicle-switcher-bar">
        <div className="vehicle-select-wrapper">
          <label htmlFor="active-vehicle-select" className="sr-only">
            관리 차량 선택
          </label>
          <select
            id="active-vehicle-select"
            aria-label="관리 차량 선택"
            className="vehicle-select touch-target"
            value={activeVehicle.id}
            onChange={(e) => onSelectVehicle(e.target.value)}
          >
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} ({v.plateNumber})
              </option>
            ))}
          </select>
        </div>

        <div className="vehicle-switcher-actions">
          <button
            type="button"
            className="btn btn-chip touch-target"
            onClick={() => onOpenEditModal(activeVehicle)}
          >
            차량 수정
          </button>
          <button
            type="button"
            className="btn btn-chip-primary touch-target"
            onClick={onOpenAddModal}
          >
            + 차량 추가
          </button>
        </div>
      </div>

      <div className="vehicle-summary-row">
        <div className="vehicle-summary-main">
          <span className="vehicle-model-text">
            {activeVehicle.manufacturerModel} · {activeVehicle.modelYear}년식
          </span>
          <div className="vehicle-badge-group">
            <span className="vehicle-plate-badge">{activeVehicle.plateNumber}</span>
            {activeVehicle.tireSize && (
              <span className="vehicle-spec-mini-badge">
                타이어 {activeVehicle.tireSize}
              </span>
            )}
          </div>
        </div>
        <div className="vehicle-mileage-box">
          <span className="vehicle-mileage-label">현재 주행거리</span>
          <strong className="vehicle-mileage-value">
            {formatMileage(activeVehicle.currentMileage)}
          </strong>
        </div>
      </div>

      {hasDetailSpecs && (
        <div className="vehicle-detail-specs-wrapper">
          <button
            type="button"
            className="vehicle-specs-expand-btn touch-target"
            onClick={() => setIsSpecOpen((prev) => !prev)}
            aria-expanded={isSpecOpen}
          >
            {isSpecOpen ? '▲ 제원 · 옵션 상세 닫기' : '▼ 제원 · 옵션 상세보기'}
          </button>

          {isSpecOpen && (
            <dl
              className="vehicle-specs-dl"
              data-testid="vehicle-detail-specs-panel"
            >
              {activeVehicle.registrationDate && (
                <div className="vehicle-spec-item">
                  <dt>최초 등록일</dt>
                  <dd>{activeVehicle.registrationDate}</dd>
                </div>
              )}
              {typeof activeVehicle.vehiclePrice === 'number' && (
                <div className="vehicle-spec-item">
                  <dt>출고 차량가</dt>
                  <dd>{formatCurrency(activeVehicle.vehiclePrice)}</dd>
                </div>
              )}
              {activeVehicle.purchaseDate && (
                <div className="vehicle-spec-item">
                  <dt>구매(인수)일</dt>
                  <dd>{activeVehicle.purchaseDate}</dd>
                </div>
              )}
              {typeof activeVehicle.purchasePrice === 'number' && (
                <div className="vehicle-spec-item">
                  <dt>실구매가</dt>
                  <dd>{formatCurrency(activeVehicle.purchasePrice)}</dd>
                </div>
              )}
              {typeof activeVehicle.purchaseMileage === 'number' && (
                <div className="vehicle-spec-item vehicle-spec-item-wide">
                  <dt>인수 당시 주행거리</dt>
                  <dd>
                    {formatMileage(activeVehicle.purchaseMileage)}
                    {typeof drivenSincePurchase === 'number'
                      ? ` (인수 후 +${formatMileage(drivenSincePurchase)} 주행)`
                      : ''}
                  </dd>
                </div>
              )}
              {activeVehicle.vin && (
                <div className="vehicle-spec-item vehicle-spec-item-wide">
                  <dt>차대번호 (VIN)</dt>
                  <dd className="vehicle-vin-row">
                    <code className="vehicle-vin-code">{activeVehicle.vin}</code>
                    <button
                      type="button"
                      className="btn btn-chip"
                      onClick={() => void handleCopyVin()}
                    >
                      {copiedVin ? '복사됨 ✓' : '복사'}
                    </button>
                  </dd>
                </div>
              )}
              {activeVehicle.colorSpec && (
                <div className="vehicle-spec-item vehicle-spec-item-wide">
                  <dt>외장 색상 · 컬러코드</dt>
                  <dd>{activeVehicle.colorSpec}</dd>
                </div>
              )}
              {activeVehicle.engineSpec && (
                <div className="vehicle-spec-item vehicle-spec-item-wide">
                  <dt>엔진</dt>
                  <dd>{activeVehicle.engineSpec}</dd>
                </div>
              )}
              {activeVehicle.performanceSpec && (
                <div className="vehicle-spec-item vehicle-spec-item-wide">
                  <dt>출력 · 성능</dt>
                  <dd>{activeVehicle.performanceSpec}</dd>
                </div>
              )}
              {activeVehicle.transmission && (
                <div className="vehicle-spec-item">
                  <dt>변속기</dt>
                  <dd>{activeVehicle.transmission}</dd>
                </div>
              )}
              {activeVehicle.fuelSpec && (
                <div className="vehicle-spec-item">
                  <dt>연료 · 연비</dt>
                  <dd>{activeVehicle.fuelSpec}</dd>
                </div>
              )}
              {activeVehicle.dimensionSpec && (
                <div className="vehicle-spec-item vehicle-spec-item-wide">
                  <dt>차체 치수 · 공차중량</dt>
                  <dd>{activeVehicle.dimensionSpec}</dd>
                </div>
              )}
              {activeVehicle.tireSize && (
                <div className="vehicle-spec-item">
                  <dt>타이어 · 공기압</dt>
                  <dd>{activeVehicle.tireSize}</dd>
                </div>
              )}
              {activeVehicle.consumablesSpec && (
                <div className="vehicle-spec-item">
                  <dt>소모품 규격</dt>
                  <dd>{activeVehicle.consumablesSpec}</dd>
                </div>
              )}
              {activeVehicle.options && (
                <div className="vehicle-spec-item vehicle-spec-item-wide">
                  <dt>장착 옵션</dt>
                  <dd>{activeVehicle.options}</dd>
                </div>
              )}
              {activeVehicle.tinting && (
                <div className="vehicle-spec-item vehicle-spec-item-wide">
                  <dt>틴팅</dt>
                  <dd>{activeVehicle.tinting}</dd>
                </div>
              )}
              {activeVehicle.memo && (
                <div className="vehicle-spec-item vehicle-spec-item-wide">
                  <dt className="vehicle-memo-dt">
                    <span>차량 관리 메모 · 계정</span>
                    <button
                      type="button"
                      className="btn btn-chip"
                      onClick={() => onOpenEditModal(activeVehicle)}
                    >
                      비밀번호 · 메모 수정
                    </button>
                  </dt>
                  <dd className="vehicle-memo-dd">{activeVehicle.memo}</dd>
                </div>
              )}
            </dl>
          )}
        </div>
      )}
    </section>
  );
};
