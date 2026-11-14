import { MaintenanceCategory, MaintenanceLog } from '../../domain/models';

export interface MaintenanceCategoryOption {
  value: MaintenanceCategory;
  label: string;
  defaultTitle: string;
}

export const MAINTENANCE_CATEGORY_OPTIONS: MaintenanceCategoryOption[] = [
  { value: 'engine_oil', label: '엔진오일', defaultTitle: '엔진오일 교체' },
  { value: 'tire', label: '타이어', defaultTitle: '타이어 점검/교체' },
  { value: 'brake', label: '브레이크', defaultTitle: '브레이크 패드/오일 정비' },
  { value: 'battery', label: '배터리', defaultTitle: '배터리 교체' },
  { value: 'filter', label: '에어컨·필터', defaultTitle: '에어컨 필터 교체' },
  { value: 'other', label: '직접 입력', defaultTitle: '' },
];

export function getCategoryLabel(category: MaintenanceCategory): string {
  const found = MAINTENANCE_CATEGORY_OPTIONS.find((c) => c.value === category);
  return found ? found.label : '기타';
}

export function calculateTotalMaintenanceCost(logs: MaintenanceLog[]): number {
  return logs.reduce((sum, log) => sum + (Number.isFinite(log.cost) ? log.cost : 0), 0);
}
