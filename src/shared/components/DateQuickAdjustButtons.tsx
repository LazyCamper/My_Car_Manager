import React from 'react';
import {
  addMonthsClamped,
  addYearsClamped,
  formatDateDot,
  parseDateString,
} from '../utils';

export interface DateQuickAdjustButtonsProps {
  value: string;
  onChange: (nextDate: string) => void;
  fieldLabel: string;
}

function resolveBaseDate(value: string): Date {
  const trimmed = value.trim();
  if (!trimmed) return new Date();
  try {
    return parseDateString(trimmed);
  } catch {
    return new Date();
  }
}

export const DateQuickAdjustButtons: React.FC<DateQuickAdjustButtonsProps> = ({
  value,
  onChange,
  fieldLabel,
}) => {
  const handleSetToday = () => {
    onChange(formatDateDot(new Date()));
  };

  const handleAddMonths = (months: number) => {
    const base = resolveBaseDate(value);
    onChange(formatDateDot(addMonthsClamped(base, months)));
  };

  const handleAddYears = (years: number) => {
    const base = resolveBaseDate(value);
    onChange(formatDateDot(addYearsClamped(base, years)));
  };

  return (
    <div className="date-quick-buttons">
      <button
        type="button"
        className="date-quick-btn"
        onClick={handleSetToday}
        title={`${fieldLabel} 오늘 날짜로 설정`}
      >
        오늘
      </button>
      <button
        type="button"
        className="date-quick-btn"
        onClick={() => handleAddMonths(1)}
        title={`${fieldLabel} 1개월 추가`}
      >
        +1개월
      </button>
      <button
        type="button"
        className="date-quick-btn"
        onClick={() => handleAddYears(1)}
        title={`${fieldLabel} 1년 추가`}
      >
        +1년
      </button>
    </div>
  );
};
