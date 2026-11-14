import Dexie, { Table } from 'dexie';
import {
  Attachment,
  Inspection,
  Insurance,
  MaintenanceLog,
  Vehicle,
} from '../../domain/models';

export interface AppMetaRecord {
  key: string;
  value: unknown;
}

export const CAR_LEDGER_DB_NAME = 'car-ledger-db';

export class CarManagerDatabase extends Dexie {
  vehicles!: Table<Vehicle, string>;
  maintenanceLogs!: Table<MaintenanceLog, string>;
  inspections!: Table<Inspection, string>;
  insurances!: Table<Insurance, string>;
  attachments!: Table<Attachment, string>;
  appMeta!: Table<AppMetaRecord, string>;

  constructor(dbName = CAR_LEDGER_DB_NAME) {
    super(dbName);
    this.version(1).stores({
      vehicles: 'id, displayOrder',
      maintenanceLogs: 'id, vehicleId, date, category, nextDueDate',
      inspections: 'id, vehicleId, expiryDate, isCurrent',
      insurances: 'id, vehicleId, endDate, isCurrent',
      attachments: 'id, [parentType+parentId]',
      appMeta: 'key',
    });
  }
}

export const defaultDb = new CarManagerDatabase();
