import React from 'react';
import { Vehicle } from '../../domain/models';
import { formatMileage } from '../../shared/utils';

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
          <span className="vehicle-plate-badge">{activeVehicle.plateNumber}</span>
        </div>
        <div className="vehicle-mileage-box">
          <span className="vehicle-mileage-label">현재 주행거리</span>
          <strong className="vehicle-mileage-value">
            {formatMileage(activeVehicle.currentMileage)}
          </strong>
        </div>
      </div>
    </section>
  );
};
