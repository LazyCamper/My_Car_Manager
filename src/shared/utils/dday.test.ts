import { describe, it, expect } from 'vitest';
import {
  calculateDday,
  formatDateDot,
  parseDateString,
} from './dday';
import { buildUpcomingDueItems } from '../../domain/services/upcomingDueService';

describe('D-day 유틸 함수 테스트 (calculateDday)', () => {
  const baseDate = '2026.11.14';

  it('만기일이 기준일보다 과거이면 status는 overdue이고 badgeText는 "만기 지남"이다', () => {
    const result1 = calculateDday('2026.11.13', baseDate);
    expect(result1.daysRemaining).toBe(-1);
    expect(result1.status).toBe('overdue');
    expect(result1.badgeText).toBe('만기 지남');
    expect(result1.isOverdue).toBe(true);

    const result2 = calculateDday('2026.10.01', baseDate);
    expect(result2.daysRemaining).toBe(-44);
    expect(result2.status).toBe('overdue');
    expect(result2.badgeText).toBe('만기 지남');
  });

  it('만기일이 기준일 당일이면 status는 urgent이고 badgeText는 "D-Day"이다', () => {
    const result = calculateDday('2026.11.14', baseDate);
    expect(result.daysRemaining).toBe(0);
    expect(result.status).toBe('urgent');
    expect(result.badgeText).toBe('D-Day');
    expect(result.isUrgent).toBe(true);
    expect(result.isOverdue).toBe(false);
  });

  it('만기일이 1일~30일 이내이면 status는 urgent이고 badgeText는 "D-N"이다', () => {
    const d1 = calculateDday('2026.11.15', baseDate);
    expect(d1.daysRemaining).toBe(1);
    expect(d1.status).toBe('urgent');
    expect(d1.badgeText).toBe('D-1');
    expect(d1.isUrgent).toBe(true);

    const d30 = calculateDday('2026.12.14', baseDate);
    expect(d30.daysRemaining).toBe(30);
    expect(d30.status).toBe('urgent');
    expect(d30.badgeText).toBe('D-30');
    expect(d30.isUrgent).toBe(true);
  });

  it('만기일이 31일 이상 남아있으면 status는 normal이고 badgeText는 "D-N"이다', () => {
    const d31 = calculateDday('2026.12.15', baseDate);
    expect(d31.daysRemaining).toBe(31);
    expect(d31.status).toBe('normal');
    expect(d31.badgeText).toBe('D-31');
    expect(d31.isUrgent).toBe(false);
    expect(d31.isOverdue).toBe(false);
  });

  it('YYYY-MM-DD 하이픈 입력도 정상 파싱하고 YYYY.MM.DD로 포맷팅한다', () => {
    const parsed = parseDateString('2026-11-20');
    expect(formatDateDot(parsed)).toBe('2026.11.20');
    const dday = calculateDday('2026-11-20', baseDate);
    expect(dday.daysRemaining).toBe(6);
    expect(dday.badgeText).toBe('D-6');
  });

  it('유효하지 않은 날짜 문자열은 에러를 발생시킨다', () => {
    expect(() => parseDateString('2026.02.30')).toThrow();
    expect(() => parseDateString('invalid-date')).toThrow();
  });
});

describe('다가오는 만기 통합 정렬 테스트 (buildUpcomingDueItems)', () => {
  it('검사, 보험, 미완료 정비 예정일을 임박순(daysRemaining 오름차순)으로 정렬한다', () => {
    const baseDate = '2026.11.14';
    const items = buildUpcomingDueItems({
      baseDate,
      inspection: {
        id: 'insp-1',
        vehicleId: 'v-1',
        inspectionDate: '2024.12.01',
        expiryDate: '2026.12.01', // D-17 (urgent)
        cost: 54000,
        attachmentIds: [],
        isCurrent: true,
      },
      insurance: {
        id: 'ins-1',
        vehicleId: 'v-1',
        companyName: '삼성화재',
        startDate: '2025.11.10',
        endDate: '2026.11.10', // D-(-4) (overdue)
        premiumCost: 680000,
        attachmentIds: [],
        isCurrent: true,
      },
      maintenanceLogs: [
        {
          id: 'maint-1',
          vehicleId: 'v-1',
          date: '2026.06.01',
          mileage: 30000,
          category: 'engine_oil',
          title: '엔진오일 교체',
          cost: 90000,
          nextDueDate: '2027.01.15', // D-62 (normal)
          nextDueMileage: 40000,
          isDueCompleted: false,
          attachmentIds: [],
          createdAt: '2026-06-01T00:00:00.000Z',
        },
        {
          id: 'maint-completed',
          vehicleId: 'v-1',
          date: '2026.05.01',
          mileage: 28000,
          category: 'tire',
          title: '타이어 위치교환',
          cost: 30000,
          nextDueDate: '2026.11.15',
          isDueCompleted: true, // 완료된 항목은 제외되어야 함
          attachmentIds: [],
          createdAt: '2026-05-01T00:00:00.000Z',
        },
      ],
    });

    expect(items).toHaveLength(3);
    // 1순위: 만기 지난 보험 (daysRemaining: -4)
    expect(items[0].type).toBe('insurance');
    expect(items[0].status).toBe('overdue');
    expect(items[0].badgeText).toBe('만기 지남');

    // 2순위: 17일 남은 자동차 검사 (daysRemaining: 17)
    expect(items[1].type).toBe('inspection');
    expect(items[1].status).toBe('urgent');
    expect(items[1].badgeText).toBe('D-17');

    // 3순위: 62일 남은 엔진오일 정비 예정 (daysRemaining: 62)
    expect(items[2].type).toBe('maintenance');
    expect(items[2].status).toBe('normal');
    expect(items[2].badgeText).toBe('D-62');
  });
});
