import {
  Attachment,
  AttachmentParentType,
  BackupDataSnapshot,
  Inspection,
  Insurance,
  MaintenanceLog,
  Vehicle,
  VehicleInput,
} from '../../domain/models';

export interface IVehicleRepository {
  getAll(): Promise<Vehicle[]>;
  getById(id: string): Promise<Vehicle | undefined>;
  save(input: VehicleInput): Promise<Vehicle>;
  delete(id: string): Promise<void>;
}

export interface IComplianceRepository {
  getCurrentInspection(vehicleId: string): Promise<Inspection | undefined>;
  getInspectionsByVehicle(vehicleId: string): Promise<Inspection[]>;
  saveInspection(
    input: Omit<Inspection, 'id'> & { id?: string },
  ): Promise<Inspection>;
  deleteInspection(id: string): Promise<void>;
  getCurrentInsurance(vehicleId: string): Promise<Insurance | undefined>;
  getInsurancesByVehicle(vehicleId: string): Promise<Insurance[]>;
  saveInsurance(
    input: Omit<Insurance, 'id'> & { id?: string },
  ): Promise<Insurance>;
  deleteInsurance(id: string): Promise<void>;
}

export interface IMaintenanceRepository {
  getByVehicle(vehicleId: string): Promise<MaintenanceLog[]>;
  getUpcomingDueByVehicle(vehicleId: string): Promise<MaintenanceLog[]>;
  save(
    input: Omit<MaintenanceLog, 'id' | 'createdAt'> & { id?: string },
  ): Promise<MaintenanceLog>;
  delete(id: string): Promise<void>;
}

export interface IAttachmentRepository {
  getByIds(ids: string[]): Promise<Attachment[]>;
  getByParent(
    parentType: AttachmentParentType,
    parentId: string,
  ): Promise<Attachment[]>;
  save(input: {
    id?: string;
    parentType: AttachmentParentType;
    parentId: string;
    blob: Blob;
    fileName: string;
    mimeType?: string;
  }): Promise<Attachment>;
  delete(id: string): Promise<void>;
  deleteMany(ids: string[]): Promise<void>;
}

export interface IBackupRepository {
  exportSnapshot(): Promise<BackupDataSnapshot>;
  restoreSnapshot(snapshot: BackupDataSnapshot): Promise<void>;
}

export interface IAppMetaRepository {
  get<T = string>(key: string): Promise<T | undefined>;
  set<T = string>(key: string, value: T): Promise<void>;
}

export interface AppRepositories {
  vehicleRepo: IVehicleRepository;
  complianceRepo: IComplianceRepository;
  maintenanceRepo: IMaintenanceRepository;
  attachmentRepo: IAttachmentRepository;
  backupRepo: IBackupRepository;
  appMetaRepo: IAppMetaRepository;
}
