import { describe, it, expect } from 'vitest';
import { CAR_LEDGER_DB_NAME, defaultDb } from './db';

describe('Dexie 데이터베이스 설정 검증 (db.ts)', () => {
  it('데이터베이스 이름이 "car-ledger-db"로 고정되어 있다', () => {
    expect(CAR_LEDGER_DB_NAME).toBe('car-ledger-db');
    expect(defaultDb.name).toBe('car-ledger-db');
  });
});
