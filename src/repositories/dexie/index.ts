import {
  Attachment,
  AttachmentParentType,
  BackupDataSnapshot,
  Inspection,
  Insurance,
  MaintenanceLog,
  MAX_ATTACHMENTS_PER_ITEM,
  Vehicle,
  VehicleInput,
} from '../../domain/models';
import {
  AppRepositories,
  IAppMetaRepository,
  IAttachmentRepository,
  IBackupRepository,
  IComplianceRepository,
  IMaintenanceRepository,
  IVehicleRepository,
} from '../interfaces';
import { CarManagerDatabase, defaultDb } from './db';

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function assertAttachmentLimit(attachmentIds: string[]): void {
  if (attachmentIds.length > MAX_ATTACHMENTS_PER_ITEM) {
    throw new Error(
      `첨부 사진은 최대 ${MAX_ATTACHMENTS_PER_ITEM}장까지만 등록할 수 있습니다.`,
    );
  }
}

export class DexieVehicleRepository implements IVehicleRepository {
  constructor(private readonly db: CarManagerDatabase = defaultDb) {}

  async getAll(): Promise<Vehicle[]> {
    const list = await this.db.vehicles.toArray();
    return list.sort((a, b) => a.displayOrder - b.displayOrder);
  }

  async getById(id: string): Promise<Vehicle | undefined> {
    return this.db.vehicles.get(id);
  }

  async save(input: VehicleInput): Promise<Vehicle> {
    const now = new Date().toISOString();
    if (input.id) {
      const existing = await this.db.vehicles.get(input.id);
      if (existing) {
        const updated: Vehicle = {
          ...existing,
          name: input.name.trim(),
          plateNumber: input.plateNumber.trim(),
          manufacturerModel: input.manufacturerModel.trim(),
          modelYear: Number(input.modelYear),
          currentMileage: Number(input.currentMileage),
          displayOrder: input.displayOrder ?? existing.displayOrder,
          updatedAt: now,
        };
        await this.db.vehicles.put(updated);
        return updated;
      }
    }

    const count = await this.db.vehicles.count();
    const created: Vehicle = {
      id: input.id ?? generateId(),
      name: input.name.trim(),
      plateNumber: input.plateNumber.trim(),
      manufacturerModel: input.manufacturerModel.trim(),
      modelYear: Number(input.modelYear),
      currentMileage: Number(input.currentMileage),
      displayOrder: input.displayOrder ?? count,
      createdAt: now,
      updatedAt: now,
    };
    await this.db.vehicles.put(created);
    return created;
  }

  async delete(id: string): Promise<void> {
    await this.db.transaction(
      'rw',
      [
        this.db.vehicles,
        this.db.maintenanceLogs,
        this.db.inspections,
        this.db.insurances,
        this.db.attachments,
      ],
      async () => {
        const maintList = await this.db.maintenanceLogs
          .where('vehicleId')
          .equals(id)
          .toArray();
        const inspList = await this.db.inspections
          .where('vehicleId')
          .equals(id)
          .toArray();
        const insList = await this.db.insurances
          .where('vehicleId')
          .equals(id)
          .toArray();

        const attachmentIdsToDelete = [
          ...maintList.flatMap((m) => m.attachmentIds),
          ...inspList.flatMap((i) => i.attachmentIds),
          ...insList.flatMap((i) => i.attachmentIds),
        ];

        if (attachmentIdsToDelete.length > 0) {
          await this.db.attachments.bulkDelete(attachmentIdsToDelete);
        }

        await this.db.maintenanceLogs.where('vehicleId').equals(id).delete();
        await this.db.inspections.where('vehicleId').equals(id).delete();
        await this.db.insurances.where('vehicleId').equals(id).delete();
        await this.db.vehicles.delete(id);
      },
    );
  }
}

export class DexieComplianceRepository implements IComplianceRepository {
  constructor(private readonly db: CarManagerDatabase = defaultDb) {}

  async getCurrentInspection(vehicleId: string): Promise<Inspection | undefined> {
    const items = await this.db.inspections
      .where('vehicleId')
      .equals(vehicleId)
      .toArray();
    if (items.length === 0) return undefined;
    const current = items.find((item) => item.isCurrent);
    if (current) return current;
    return items.sort((a, b) => b.expiryDate.localeCompare(a.expiryDate))[0];
  }

  async getInspectionsByVehicle(vehicleId: string): Promise<Inspection[]> {
    const items = await this.db.inspections
      .where('vehicleId')
      .equals(vehicleId)
      .toArray();
    return items.sort((a, b) => b.expiryDate.localeCompare(a.expiryDate));
  }

  async saveInspection(
    input: Omit<Inspection, 'id'> & { id?: string },
  ): Promise<Inspection> {
    assertAttachmentLimit(input.attachmentIds);
    const record: Inspection = {
      ...input,
      id: input.id ?? generateId(),
    };
    await this.db.transaction('rw', this.db.inspections, async () => {
      if (record.isCurrent) {
        const existing = await this.db.inspections
          .where('vehicleId')
          .equals(record.vehicleId)
          .toArray();
        for (const item of existing) {
          if (item.id !== record.id && item.isCurrent) {
            await this.db.inspections.put({ ...item, isCurrent: false });
          }
        }
      }
      await this.db.inspections.put(record);
    });
    return record;
  }

  async deleteInspection(id: string): Promise<void> {
    await this.db.transaction('rw', this.db.inspections, async () => {
      const target = await this.db.inspections.get(id);
      await this.db.inspections.delete(id);
      if (target?.isCurrent) {
        const remaining = await this.db.inspections
          .where('vehicleId')
          .equals(target.vehicleId)
          .toArray();
        if (remaining.length > 0) {
          remaining.sort((a, b) => b.expiryDate.localeCompare(a.expiryDate));
          await this.db.inspections.put({ ...remaining[0], isCurrent: true });
        }
      }
    });
  }

  async getCurrentInsurance(vehicleId: string): Promise<Insurance | undefined> {
    const items = await this.db.insurances
      .where('vehicleId')
      .equals(vehicleId)
      .toArray();
    if (items.length === 0) return undefined;
    const current = items.find((item) => item.isCurrent);
    if (current) return current;
    return items.sort((a, b) => b.endDate.localeCompare(a.endDate))[0];
  }

  async getInsurancesByVehicle(vehicleId: string): Promise<Insurance[]> {
    const items = await this.db.insurances
      .where('vehicleId')
      .equals(vehicleId)
      .toArray();
    return items.sort((a, b) => b.endDate.localeCompare(a.endDate));
  }

  async saveInsurance(
    input: Omit<Insurance, 'id'> & { id?: string },
  ): Promise<Insurance> {
    assertAttachmentLimit(input.attachmentIds);
    const record: Insurance = {
      ...input,
      id: input.id ?? generateId(),
    };
    await this.db.transaction('rw', this.db.insurances, async () => {
      if (record.isCurrent) {
        const existing = await this.db.insurances
          .where('vehicleId')
          .equals(record.vehicleId)
          .toArray();
        for (const item of existing) {
          if (item.id !== record.id && item.isCurrent) {
            await this.db.insurances.put({ ...item, isCurrent: false });
          }
        }
      }
      await this.db.insurances.put(record);
    });
    return record;
  }

  async deleteInsurance(id: string): Promise<void> {
    await this.db.transaction('rw', this.db.insurances, async () => {
      const target = await this.db.insurances.get(id);
      await this.db.insurances.delete(id);
      if (target?.isCurrent) {
        const remaining = await this.db.insurances
          .where('vehicleId')
          .equals(target.vehicleId)
          .toArray();
        if (remaining.length > 0) {
          remaining.sort((a, b) => b.endDate.localeCompare(a.endDate));
          await this.db.insurances.put({ ...remaining[0], isCurrent: true });
        }
      }
    });
  }
}

export class DexieMaintenanceRepository implements IMaintenanceRepository {
  constructor(private readonly db: CarManagerDatabase = defaultDb) {}

  async getByVehicle(vehicleId: string): Promise<MaintenanceLog[]> {
    const items = await this.db.maintenanceLogs
      .where('vehicleId')
      .equals(vehicleId)
      .toArray();
    return items.sort((a, b) => b.date.localeCompare(a.date));
  }

  async getUpcomingDueByVehicle(vehicleId: string): Promise<MaintenanceLog[]> {
    const items = await this.db.maintenanceLogs
      .where('vehicleId')
      .equals(vehicleId)
      .toArray();
    return items.filter(
      (item) => Boolean(item.nextDueDate) && !item.isDueCompleted,
    );
  }

  async save(
    input: Omit<MaintenanceLog, 'id' | 'createdAt'> & { id?: string },
  ): Promise<MaintenanceLog> {
    assertAttachmentLimit(input.attachmentIds);
    const now = new Date().toISOString();
    const existing = input.id
      ? await this.db.maintenanceLogs.get(input.id)
      : undefined;
    const record: MaintenanceLog = {
      ...input,
      id: input.id ?? generateId(),
      createdAt: existing?.createdAt ?? now,
    };
    await this.db.maintenanceLogs.put(record);
    return record;
  }

  async delete(id: string): Promise<void> {
    await this.db.transaction(
      'rw',
      [this.db.maintenanceLogs, this.db.attachments],
      async () => {
        const target = await this.db.maintenanceLogs.get(id);
        if (target?.attachmentIds.length) {
          await this.db.attachments.bulkDelete(target.attachmentIds);
        }
        await this.db.maintenanceLogs.delete(id);
      },
    );
  }
}

export class DexieAttachmentRepository implements IAttachmentRepository {
  constructor(private readonly db: CarManagerDatabase = defaultDb) {}

  async getByIds(ids: string[]): Promise<Attachment[]> {
    if (ids.length === 0) return [];
    const results = await this.db.attachments.bulkGet(ids);
    return results.filter((item): item is Attachment => Boolean(item));
  }

  async getByParent(
    parentType: AttachmentParentType,
    parentId: string,
  ): Promise<Attachment[]> {
    const items = await this.db.attachments
      .where('[parentType+parentId]')
      .equals([parentType, parentId])
      .toArray();
    return items.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async save(input: {
    id?: string;
    parentType: AttachmentParentType;
    parentId: string;
    blob: Blob;
    fileName: string;
    mimeType?: string;
  }): Promise<Attachment> {
    const record: Attachment = {
      id: input.id ?? generateId(),
      parentType: input.parentType,
      parentId: input.parentId,
      blob: input.blob,
      mimeType: input.mimeType ?? (input.blob.type || 'image/jpeg'),
      fileName: input.fileName,
      size: input.blob.size,
      createdAt: new Date().toISOString(),
    };
    await this.db.attachments.put(record);
    return record;
  }

  async delete(id: string): Promise<void> {
    await this.db.attachments.delete(id);
  }

  async deleteMany(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    await this.db.attachments.bulkDelete(ids);
  }
}

export class DexieBackupRepository implements IBackupRepository {
  constructor(private readonly db: CarManagerDatabase = defaultDb) {}

  async exportSnapshot(): Promise<BackupDataSnapshot> {
    const [vehicles, maintenanceLogs, inspections, insurances, attachments] =
      await Promise.all([
        this.db.vehicles.toArray(),
        this.db.maintenanceLogs.toArray(),
        this.db.inspections.toArray(),
        this.db.insurances.toArray(),
        this.db.attachments.toArray(),
      ]);

    return {
      vehicles,
      maintenanceLogs,
      inspections,
      insurances,
      attachments,
    };
  }

  async restoreSnapshot(snapshot: BackupDataSnapshot): Promise<void> {
    await this.db.transaction(
      'rw',
      [
        this.db.vehicles,
        this.db.maintenanceLogs,
        this.db.inspections,
        this.db.insurances,
        this.db.attachments,
      ],
      async () => {
        await Promise.all([
          this.db.vehicles.clear(),
          this.db.maintenanceLogs.clear(),
          this.db.inspections.clear(),
          this.db.insurances.clear(),
          this.db.attachments.clear(),
        ]);

        if (snapshot.vehicles.length > 0) {
          await this.db.vehicles.bulkPut(snapshot.vehicles);
        }
        if (snapshot.maintenanceLogs.length > 0) {
          await this.db.maintenanceLogs.bulkPut(snapshot.maintenanceLogs);
        }
        if (snapshot.inspections.length > 0) {
          await this.db.inspections.bulkPut(snapshot.inspections);
        }
        if (snapshot.insurances.length > 0) {
          await this.db.insurances.bulkPut(snapshot.insurances);
        }
        if (snapshot.attachments.length > 0) {
          await this.db.attachments.bulkPut(snapshot.attachments);
        }
      },
    );
  }
}

export class DexieAppMetaRepository implements IAppMetaRepository {
  constructor(private readonly db: CarManagerDatabase = defaultDb) {}

  async get<T = string>(key: string): Promise<T | undefined> {
    const record = await this.db.appMeta.get(key);
    return record?.value as T | undefined;
  }

  async set<T = string>(key: string, value: T): Promise<void> {
    await this.db.appMeta.put({ key, value });
  }
}

export function createDexieRepositories(
  db: CarManagerDatabase = defaultDb,
): AppRepositories {
  return {
    vehicleRepo: new DexieVehicleRepository(db),
    complianceRepo: new DexieComplianceRepository(db),
    maintenanceRepo: new DexieMaintenanceRepository(db),
    attachmentRepo: new DexieAttachmentRepository(db),
    backupRepo: new DexieBackupRepository(db),
    appMetaRepo: new DexieAppMetaRepository(db),
  };
}
