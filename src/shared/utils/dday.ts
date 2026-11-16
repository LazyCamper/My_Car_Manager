import { DdayUrgencyStatus } from '../../domain/models';

export const URGENT_THRESHOLD_DAYS = 30;
export const MIN_VALID_YEAR = 1900;
export const MAX_VALID_YEAR = 2100;

export interface DdayResult {
  daysRemaining: number;
  status: DdayUrgencyStatus;
  badgeText: string;
  isOverdue: boolean;
  isUrgent: boolean;
}

/**
 * 'YYYY.MM.DD', 'YYYY-MM-DD', 'YY.M.D', 'YYYYMMDD', 'YYMMDD', 'YYYY.MM', 'YY년 M월(D일)' 형식의 문자열을
 * 로컬 자정(00:00:00) Date 객체로 변환합니다.
 * - 2자리 연도(예: '23.11.22', '200223')는 2000년대(20YY)로 자동 보정합니다.
 * - 일(day)이 생략된 연·월 표기(예: '2021.01', '21년1월')는 해당 월 1일로 보정합니다.
 */
export function parseDateString(dateStr: string): Date {
  const trimmed = dateStr.trim();
  const compact8Match = /^(\d{4})(\d{2})(\d{2})$/.exec(trimmed);
  const compact6Match = /^(\d{2})(\d{2})(\d{2})$/.exec(trimmed);
  const koreanYmdMatch =
    /^(\d{2}|\d{4})\s*년\s*(\d{1,2})\s*월(?:\s*(\d{1,2})\s*일?)?$/.exec(
      trimmed,
    );

  let normalized: string;
  if (compact8Match) {
    normalized = `${compact8Match[1]}.${compact8Match[2]}.${compact8Match[3]}`;
  } else if (compact6Match) {
    normalized = `20${compact6Match[1]}.${compact6Match[2]}.${compact6Match[3]}`;
  } else if (koreanYmdMatch) {
    normalized = `${koreanYmdMatch[1]}.${koreanYmdMatch[2]}.${koreanYmdMatch[3] ?? '01'}`;
  } else {
    const dotReplaced = trimmed.replace(/-/g, '.');
    if (/^(\d{2}|\d{4})\.\d{1,2}$/.test(dotReplaced)) {
      normalized = `${dotReplaced}.01`;
    } else {
      normalized = dotReplaced;
    }
  }

  if (!/^(\d{2}|\d{4})\.\d{1,2}\.\d{1,2}$/.test(normalized)) {
    throw new Error(`Invalid date format: ${dateStr}. Expected YYYY.MM.DD`);
  }

  const parts = normalized.split('.');
  const rawYear = Number(parts[0]);
  const year = parts[0].length === 2 ? 2000 + rawYear : rawYear;
  const month = Number(parts[1]);
  const day = Number(parts[2]);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    year < MIN_VALID_YEAR ||
    year > MAX_VALID_YEAR ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    throw new Error(`Invalid date value: ${dateStr}`);
  }

  const date = new Date(year, month - 1, day, 0, 0, 0, 0);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    throw new Error(`Non-existent calendar date: ${dateStr}`);
  }
  return date;
}

/**
 * 기준일(dateInput)에 yearsToAdd년을 더하되,
 * 윤년 2월 29일에서 평년으로 이동할 때 3월 1일로 밀리지 않고 2월 28일(해당 월 말일)로 보정합니다.
 */
export function addYearsClamped(
  dateInput: Date | string,
  yearsToAdd: number,
): Date {
  const base =
    typeof dateInput === 'string'
      ? parseDateString(dateInput)
      : new Date(
          dateInput.getFullYear(),
          dateInput.getMonth(),
          dateInput.getDate(),
          0,
          0,
          0,
          0,
        );

  const targetYear = base.getFullYear() + yearsToAdd;
  const month = base.getMonth();
  const day = base.getDate();

  const lastDayOfTargetMonth = new Date(targetYear, month + 1, 0).getDate();
  const clampedDay = Math.min(day, lastDayOfTargetMonth);

  return new Date(targetYear, month, clampedDay, 0, 0, 0, 0);
}

/**
 * 기준일(dateInput)에 monthsToAdd개월을 더하되,
 * 31일에서 30일/28일 월로 이동할 때 다음 달로 넘치지 않고 해당 월 말일로 보정합니다.
 */
export function addMonthsClamped(
  dateInput: Date | string,
  monthsToAdd: number,
): Date {
  const base =
    typeof dateInput === 'string'
      ? parseDateString(dateInput)
      : new Date(
          dateInput.getFullYear(),
          dateInput.getMonth(),
          dateInput.getDate(),
          0,
          0,
          0,
          0,
        );

  const totalMonths = base.getFullYear() * 12 + base.getMonth() + monthsToAdd;
  const targetYear = Math.floor(totalMonths / 12);
  const targetMonth = ((totalMonths % 12) + 12) % 12;
  const day = base.getDate();

  const lastDayOfTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
  const clampedDay = Math.min(day, lastDayOfTargetMonth);

  return new Date(targetYear, targetMonth, clampedDay, 0, 0, 0, 0);
}

/**
 * Date 객체 또는 날짜 문자열을 'YYYY.MM.DD' 형식으로 변환합니다.
 */
export function formatDateDot(dateInput: Date | string): string {
  const date =
    typeof dateInput === 'string'
      ? parseDateString(dateInput)
      : new Date(
          dateInput.getFullYear(),
          dateInput.getMonth(),
          dateInput.getDate(),
        );
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
}

/**
 * 목표일(targetDateStr)과 기준일(baseDate, 기본값 오늘)의 일수 차이를 계산하여
 * D-day 상태('overdue' | 'urgent' | 'normal')와 표시 문구를 반환합니다.
 * - 지난 경우(daysRemaining < 0): status = 'overdue', badgeText = '만기 지남'
 * - 당일(daysRemaining === 0): status = 'urgent', badgeText = 'D-Day'
 * - 30일 이내(1 <= daysRemaining <= 30): status = 'urgent', badgeText = 'D-N'
 * - 30일 초과(daysRemaining > 30): status = 'normal', badgeText = 'D-N'
 */
export function calculateDday(
  targetDateStr: string,
  baseDate: Date | string = new Date(),
): DdayResult {
  const target = parseDateString(targetDateStr);
  const base =
    typeof baseDate === 'string'
      ? parseDateString(baseDate)
      : new Date(
          baseDate.getFullYear(),
          baseDate.getMonth(),
          baseDate.getDate(),
          0,
          0,
          0,
          0,
        );

  const targetUtc = Date.UTC(
    target.getFullYear(),
    target.getMonth(),
    target.getDate(),
  );
  const baseUtc = Date.UTC(base.getFullYear(), base.getMonth(), base.getDate());

  const diffMs = targetUtc - baseUtc;
  const daysRemaining = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (daysRemaining < 0) {
    return {
      daysRemaining,
      status: 'overdue',
      badgeText: '만기 지남',
      isOverdue: true,
      isUrgent: false,
    };
  }

  if (daysRemaining === 0) {
    return {
      daysRemaining: 0,
      status: 'urgent',
      badgeText: 'D-Day',
      isOverdue: false,
      isUrgent: true,
    };
  }

  if (daysRemaining <= URGENT_THRESHOLD_DAYS) {
    return {
      daysRemaining,
      status: 'urgent',
      badgeText: `D-${daysRemaining}`,
      isOverdue: false,
      isUrgent: true,
    };
  }

  return {
    daysRemaining,
    status: 'normal',
    badgeText: `D-${daysRemaining}`,
    isOverdue: false,
    isUrgent: false,
  };
}
