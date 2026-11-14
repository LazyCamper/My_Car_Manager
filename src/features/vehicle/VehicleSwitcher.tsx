import React, { useState } from 'react';
import { Vehicle } from '../../domain/models';
import { formatCurrency, formatMileage } from '../../shared/utils';

export interface VehicleSwitcherProps {
  vehicles: Vehicle[];
  activeVehicle: Vehicle;
  onSelectVehicle: (vehicleId: string) => void;
  onOpenAddModal: () => void;
  onOpenEditModal: (vehicle: Vehicle) => void;
  onMoveVehicle?: (vehicleId: string, direction: 'up' | 'down') => void;
  onReorderVehicles?: (fromIndex: number, toIndex: number) => void;
}

function hasVehicleDetailSpecs(v: Vehicle): boolean {
  return Boolean(
    v.registrationDate ||
      v.purchaseDate ||
      v.purchaseMileage ||
      v.purchasePrice ||
      v.vin ||
      v.tireSize ||
      v.vehiclePrice ||
      v.engineSpec ||
      v.performanceSpec ||
      v.transmission ||
      v.fuelSpec ||
      v.dimensionSpec ||
      v.consumablesSpec ||
      v.colorSpec ||
      v.options ||
      v.tinting ||
      v.memo,
  );
}

export const VehicleSwitcher: React.FC<VehicleSwitcherProps> = ({
  vehicles,
  activeVehicle,
  onSelectVehicle,
  onOpenAddModal,
  onOpenEditModal,
  onMoveVehicle,
  onReorderVehicles,
}) => {
  const [expandedVehicleIds, setExpandedVehicleIds] = useState<
    Record<string, boolean>
  >({});
  const [copiedVinId, setCopiedVinId] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const toggleSpecOpen = (vehicleId: string) => {
    setExpandedVehicleIds((prev) => ({
      ...prev,
      [vehicleId]: !prev[vehicleId],
    }));
  };

  const handleCopyVin = async (vehicle: Vehicle) => {
    if (!vehicle.vin) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(vehicle.vin);
      }
      setCopiedVinId(vehicle.id);
      setTimeout(() => setCopiedVinId(null), 2000);
    } catch {
      setCopiedVinId(null);
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (
    e: React.DragEvent<HTMLElement>,
    index: number,
  ) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLElement>, toIndex: number) => {
    e.preventDefault();
    if (
      draggedIndex !== null &&
      draggedIndex !== toIndex &&
      onReorderVehicles
    ) {
      onReorderVehicles(draggedIndex, toIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <section
      className="vehicle-header-card"
      aria-label="보유 차량 목록 및 선택"
    >
      <div className="vehicle-section-topbar">
        <div className="vehicle-section-heading">
          <h2 className="section-title">보유 차량</h2>
          <span className="section-count-badge">{vehicles.length}대</span>
        </div>

        <button
          type="button"
          className="btn btn-chip-primary touch-target"
          onClick={onOpenAddModal}
        >
          + 차량 추가
        </button>
      </div>

      <div
        className="owned-vehicle-list"
        data-testid="owned-vehicles-list"
        aria-label="보유 차량 전체 목록"
      >
        {vehicles.map((vehicle, index) => {
          const isSelected = vehicle.id === activeVehicle.id;
          const isSpecOpen = Boolean(expandedVehicleIds[vehicle.id]);
          const showDetailToggle = hasVehicleDetailSpecs(vehicle);
          const isFirst = index === 0;
          const isLast = index === vehicles.length - 1;
          const isDragOver = dragOverIndex === index;
          const drivenSincePurchase =
            typeof vehicle.purchaseMileage === 'number' &&
            vehicle.currentMileage >= vehicle.purchaseMileage
              ? vehicle.currentMileage - vehicle.purchaseMileage
              : undefined;

          return (
            <article
              key={vehicle.id}
              className={`owned-vehicle-card${isSelected ? ' selected' : ''}${isDragOver ? ' drag-over' : ''}`}
              data-testid={`vehicle-card-${vehicle.id}`}
              draggable={vehicles.length > 1}
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
            >
              <div
                className="vehicle-summary-row"
                onClick={() => {
                  if (!isSelected) {
                    onSelectVehicle(vehicle.id);
                  }
                }}
              >
                <div className="vehicle-summary-main">
                  <div className="vehicle-title-line">
                    <strong className="vehicle-name-badge">
                      {vehicle.name}
                    </strong>
                    <span className="vehicle-plate-badge">
                      {vehicle.plateNumber}
                    </span>
                    {isSelected && (
                      <span className="vehicle-active-pill">선택됨</span>
                    )}
                  </div>
                  <span className="vehicle-model-text">
                    {vehicle.manufacturerModel} · {vehicle.modelYear}년식
                  </span>
                  {(vehicle.tireSize || vehicle.registrationDate) && (
                    <div className="vehicle-badge-group">
                      {vehicle.registrationDate && (
                        <span className="vehicle-spec-mini-badge">
                          등록 {vehicle.registrationDate}
                        </span>
                      )}
                      {vehicle.tireSize && (
                        <span className="vehicle-spec-mini-badge">
                          타이어 {vehicle.tireSize}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="vehicle-card-right-col">
                  <div className="vehicle-mileage-box">
                    <span className="vehicle-mileage-label">현재 주행거리</span>
                    <strong className="vehicle-mileage-value">
                      {formatMileage(vehicle.currentMileage)}
                    </strong>
                  </div>
                </div>
              </div>

              {(isSelected || vehicles.length > 1) && (
                <div className="vehicle-card-action-bar">
                  {vehicles.length > 1 ? (
                    <div
                      className="vehicle-reorder-btns"
                      aria-label={`${vehicle.name} 순서 변경`}
                    >
                      <button
                        type="button"
                        className="btn-reorder"
                        disabled={isFirst}
                        aria-label={`${vehicle.name} 위로 이동`}
                        title="위로 이동"
                        onClick={(e) => {
                          e.stopPropagation();
                          onMoveVehicle?.(vehicle.id, 'up');
                        }}
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        className="btn-reorder"
                        disabled={isLast}
                        aria-label={`${vehicle.name} 아래로 이동`}
                        title="아래로 이동"
                        onClick={(e) => {
                          e.stopPropagation();
                          onMoveVehicle?.(vehicle.id, 'down');
                        }}
                      >
                        ▼
                      </button>
                    </div>
                  ) : (
                    <span />
                  )}

                  {isSelected && (
                    <button
                      type="button"
                      className="btn btn-chip vehicle-card-edit-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenEditModal(vehicle);
                      }}
                    >
                      차량 수정
                    </button>
                  )}
                </div>
              )}

              {showDetailToggle && (
                <div className="vehicle-detail-specs-wrapper">
                  <button
                    type="button"
                    className="vehicle-specs-expand-btn touch-target"
                    onClick={() => toggleSpecOpen(vehicle.id)}
                    aria-expanded={isSpecOpen}
                  >
                    {isSpecOpen
                      ? '▲ 제원 · 옵션 상세 닫기'
                      : '▼ 제원 · 옵션 상세보기'}
                  </button>

                  {isSpecOpen && (
                    <dl
                      className="vehicle-specs-dl"
                      data-testid="vehicle-detail-specs-panel"
                    >
                      {vehicle.registrationDate && (
                        <div className="vehicle-spec-item">
                          <dt>최초 등록일</dt>
                          <dd>{vehicle.registrationDate}</dd>
                        </div>
                      )}
                      {typeof vehicle.vehiclePrice === 'number' && (
                        <div className="vehicle-spec-item">
                          <dt>출고 차량가</dt>
                          <dd>{formatCurrency(vehicle.vehiclePrice)}</dd>
                        </div>
                      )}
                      {vehicle.purchaseDate && (
                        <div className="vehicle-spec-item">
                          <dt>구매(인수)일</dt>
                          <dd>{vehicle.purchaseDate}</dd>
                        </div>
                      )}
                      {typeof vehicle.purchasePrice === 'number' && (
                        <div className="vehicle-spec-item">
                          <dt>실구매가</dt>
                          <dd>{formatCurrency(vehicle.purchasePrice)}</dd>
                        </div>
                      )}
                      {typeof vehicle.purchaseMileage === 'number' && (
                        <div className="vehicle-spec-item vehicle-spec-item-wide">
                          <dt>인수 당시 주행거리</dt>
                          <dd>
                            {formatMileage(vehicle.purchaseMileage)}
                            {typeof drivenSincePurchase === 'number'
                              ? ` (인수 후 +${formatMileage(drivenSincePurchase)} 주행)`
                              : ''}
                          </dd>
                        </div>
                      )}
                      {vehicle.vin && (
                        <div className="vehicle-spec-item vehicle-spec-item-wide">
                          <dt>차대번호 (VIN)</dt>
                          <dd className="vehicle-vin-row">
                            <code className="vehicle-vin-code">
                              {vehicle.vin}
                            </code>
                            <button
                              type="button"
                              className="btn btn-chip"
                              onClick={() => void handleCopyVin(vehicle)}
                            >
                              {copiedVinId === vehicle.id ? '복사됨 ✓' : '복사'}
                            </button>
                          </dd>
                        </div>
                      )}
                      {vehicle.colorSpec && (
                        <div className="vehicle-spec-item vehicle-spec-item-wide">
                          <dt>외장 색상 · 컬러코드</dt>
                          <dd>{vehicle.colorSpec}</dd>
                        </div>
                      )}
                      {vehicle.engineSpec && (
                        <div className="vehicle-spec-item vehicle-spec-item-wide">
                          <dt>엔진</dt>
                          <dd>{vehicle.engineSpec}</dd>
                        </div>
                      )}
                      {vehicle.performanceSpec && (
                        <div className="vehicle-spec-item vehicle-spec-item-wide">
                          <dt>출력 · 성능</dt>
                          <dd>{vehicle.performanceSpec}</dd>
                        </div>
                      )}
                      {vehicle.transmission && (
                        <div className="vehicle-spec-item">
                          <dt>변속기</dt>
                          <dd>{vehicle.transmission}</dd>
                        </div>
                      )}
                      {vehicle.fuelSpec && (
                        <div className="vehicle-spec-item">
                          <dt>연료 · 연비</dt>
                          <dd>{vehicle.fuelSpec}</dd>
                        </div>
                      )}
                      {vehicle.dimensionSpec && (
                        <div className="vehicle-spec-item vehicle-spec-item-wide">
                          <dt>차체 치수 · 공차중량</dt>
                          <dd>{vehicle.dimensionSpec}</dd>
                        </div>
                      )}
                      {vehicle.tireSize && (
                        <div className="vehicle-spec-item">
                          <dt>타이어 · 공기압</dt>
                          <dd>{vehicle.tireSize}</dd>
                        </div>
                      )}
                      {vehicle.consumablesSpec && (
                        <div className="vehicle-spec-item">
                          <dt>소모품 규격</dt>
                          <dd>{vehicle.consumablesSpec}</dd>
                        </div>
                      )}
                      {vehicle.options && (
                        <div className="vehicle-spec-item vehicle-spec-item-wide">
                          <dt>장착 옵션</dt>
                          <dd>{vehicle.options}</dd>
                        </div>
                      )}
                      {vehicle.tinting && (
                        <div className="vehicle-spec-item vehicle-spec-item-wide">
                          <dt>틴팅</dt>
                          <dd>{vehicle.tinting}</dd>
                        </div>
                      )}
                      {vehicle.memo && (
                        <div className="vehicle-spec-item vehicle-spec-item-wide">
                          <dt className="vehicle-memo-dt">
                            <span>차량 관리 메모 · 계정</span>
                            <button
                              type="button"
                              className="btn btn-chip"
                              onClick={() => onOpenEditModal(vehicle)}
                            >
                              비밀번호 · 메모 수정
                            </button>
                          </dt>
                          <dd className="vehicle-memo-dd">{vehicle.memo}</dd>
                        </div>
                      )}
                    </dl>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
};
