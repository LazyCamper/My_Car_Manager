export const MAX_ATTACHMENTS_PER_ITEM = 5;
export const BACKUP_SCHEMA_VERSION = 1;
export const LAST_BACKUP_DATE_META_KEY = 'lastBackupDate';

export interface Vehicle {
  id: string;
  name: string; // 이름(별칭)
  plateNumber: string; // 번호판
  manufacturerModel: string; // 제조사/모델
  modelYear: number; // 연식
  currentMileage: number; // 현재 주행거리 (km)
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export type VehicleInput = {
  id?: string;
  name: string;
  plateNumber: string;
  manufacturerModel: string;
  modelYear: number;
  currentMileage: number;
  displayOrder?: number;
};

export type MaintenanceCategory =
  | 'engine_oil'
  | 'tire'
  | 'brake'
  | 'battery'
  | 'filter'
  | 'other';

export interface MaintenanceLog {
  id: string;
  vehicleId: string;
  date: string; // YYYY.MM.DD
  mileage: number;
  category: MaintenanceCategory;
  title: string;
  shopName?: string;
  cost: number;
  nextDueDate?: string; // YYYY.MM.DD
  nextDueMileage?: number;
  isDueCompleted?: boolean;
  memo?: string;
  attachmentIds: string[];
  createdAt: string;
}

export interface Inspection {
  id: string;
  vehicleId: string;
  inspectionDate: string; // YYYY.MM.DD
  expiryDate: string; // YYYY.MM.DD
  cost: number;
  stationName?: string;
  memo?: string;
  attachmentIds: string[];
  isCurrent: boolean;
}

export interface Insurance {
  id: string;
  vehicleId: string;
  companyName: string;
  productName?: string; // 상품명
  emergencyPhone?: string; // 연락처
  startDate: string; // YYYY.MM.DD
  endDate: string; // YYYY.MM.DD
  premiumCost: number;
  memo?: string; // 담보 메모
  attachmentIds: string[];
  isCurrent: boolean;
}

export type AttachmentParentType = 'maintenance' | 'inspection' | 'insurance';

export interface Attachment {
  id: string;
  parentType: AttachmentParentType;
  parentId: string;
  blob: Blob;
  mimeType: string;
  fileName: string;
  size: number;
  createdAt: string;
}

export interface SerializedAttachment {
  id: string;
  parentType: AttachmentParentType;
  parentId: string;
  base64Data: string;
  mimeType: string;
  fileName: string;
  size: number;
  createdAt: string;
}

export interface BackupDataSnapshot {
  vehicles: Vehicle[];
  maintenanceLogs: MaintenanceLog[];
  inspections: Inspection[];
  insurances: Insurance[];
  attachments: Attachment[];
}

export interface BackupFilePayload {
  schemaVersion: number;
  exportedAt: string;
  data: {
    vehicles: Vehicle[];
    maintenanceLogs: MaintenanceLog[];
    inspections: Inspection[];
    insurances: Insurance[];
    attachments: SerializedAttachment[];
  };
}

export type DdayUrgencyStatus = 'overdue' | 'urgent' | 'normal';

export type UpcomingDueType = 'inspection' | 'insurance' | 'maintenance';

export interface UpcomingDueItem {
  id: string;
  type: UpcomingDueType;
  categoryLabel: string;
  title: string;
  dueDate: string; // YYYY.MM.DD
  daysRemaining: number;
  status: DdayUrgencyStatus;
  badgeText: string;
  subInfo?: string;
}
