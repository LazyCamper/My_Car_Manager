import { describe, it, expect } from 'vitest';
import { Inspection, Insurance, MaintenanceLog, Vehicle } from '../../domain/models';
import { AppMetaRecord, CAR_LEDGER_DB_NAME, CarManagerDatabase, defaultDb } from './db';
import { createInitialSampleVehicle, DexieVehicleRepository } from './index';

function createStubDb() {
  const vehicleStore = new Map<string, Vehicle>();
  const maintenanceStore = new Map<string, MaintenanceLog>();
  const inspectionStore = new Map<string, Inspection>();
  const insuranceStore = new Map<string, Insurance>();
  const metaStore = new Map<string, AppMetaRecord>();

  const stub = {
    vehicles: {
      toArray: async () => Array.from(vehicleStore.values()),
      count: async () => vehicleStore.size,
      get: async (id: string) => vehicleStore.get(id),
      put: async (v: Vehicle) => {
        vehicleStore.set(v.id, v);
        return v.id;
      },
      delete: async (id: string) => {
        vehicleStore.delete(id);
      },
    },
    maintenanceLogs: {
      bulkPut: async (items: MaintenanceLog[]) => {
        for (const item of items) maintenanceStore.set(item.id, item);
      },
      where: () => ({
        equals: (vehicleId: string) => ({
          toArray: async () =>
            Array.from(maintenanceStore.values()).filter(
              (m) => m.vehicleId === vehicleId,
            ),
          delete: async () => {
            let count = 0;
            for (const [k, v] of maintenanceStore.entries()) {
              if (v.vehicleId === vehicleId) {
                maintenanceStore.delete(k);
                count++;
              }
            }
            return count;
          },
        }),
      }),
    },
    inspections: {
      put: async (item: Inspection) => {
        inspectionStore.set(item.id, item);
        return item.id;
      },
      where: () => ({
        equals: (vehicleId: string) => ({
          toArray: async () =>
            Array.from(inspectionStore.values()).filter(
              (i) => i.vehicleId === vehicleId,
            ),
          delete: async () => {
            let count = 0;
            for (const [k, v] of inspectionStore.entries()) {
              if (v.vehicleId === vehicleId) {
                inspectionStore.delete(k);
                count++;
              }
            }
            return count;
          },
        }),
      }),
    },
    insurances: {
      put: async (item: Insurance) => {
        insuranceStore.set(item.id, item);
        return item.id;
      },
      where: () => ({
        equals: (vehicleId: string) => ({
          toArray: async () =>
            Array.from(insuranceStore.values()).filter(
              (i) => i.vehicleId === vehicleId,
            ),
          delete: async () => {
            let count = 0;
            for (const [k, v] of insuranceStore.entries()) {
              if (v.vehicleId === vehicleId) {
                insuranceStore.delete(k);
                count++;
              }
            }
            return count;
          },
        }),
      }),
    },
    attachments: {
      bulkDelete: async () => undefined,
    },
    appMeta: {
      get: async (key: string) => metaStore.get(key),
      put: async (rec: AppMetaRecord) => {
        metaStore.set(rec.key, rec);
        return rec.key;
      },
    },
    transaction: async (_mode: string, _tables: unknown, fn: () => Promise<unknown>) =>
      fn(),
  };

  return {
    db: stub as unknown as CarManagerDatabase,
    maintenanceStore,
    inspectionStore,
    insuranceStore,
  };
}

describe('Dexie 데이터베이스 설정 검증 (db.ts)', () => {
  it('데이터베이스 이름이 "car-ledger-db"로 고정되어 있다', () => {
    expect(CAR_LEDGER_DB_NAME).toBe('car-ledger-db');
    expect(defaultDb.name).toBe('car-ledger-db');
  });

  it('최초 진입 시 샘플 차량과 정비·검사·보험 샘플 데이터가 자동 등록되며, 삭제 후에는 다시 자동 생성되지 않는다', async () => {
    const sample = createInitialSampleVehicle();
    expect(sample.name).toBe('패밀리 SUV (샘플)');

    const { db, maintenanceStore, inspectionStore, insuranceStore } =
      createStubDb();
    const repo = new DexieVehicleRepository(db);

    const firstLoad = await repo.getAll();
    expect(firstLoad).toHaveLength(1);
    expect(firstLoad[0].name).toBe('패밀리 SUV (샘플)');
    expect(firstLoad[0].manufacturerModel).toBe('기아 쏘렌토 하이브리드');
    expect(maintenanceStore.size).toBe(2);
    expect(inspectionStore.size).toBe(1);
    expect(insuranceStore.size).toBe(1);

    await repo.delete(firstLoad[0].id);
    const afterDelete = await repo.getAll();
    expect(afterDelete).toHaveLength(0);
    expect(maintenanceStore.size).toBe(0);
    expect(inspectionStore.size).toBe(0);
    expect(insuranceStore.size).toBe(0);
  });
});
