import React from 'react';
import { MaintenanceCategory, MaintenanceLog } from '../../domain/models';
import { AttachmentThumbnailStrip } from '../../shared/components/AttachmentThumbnailStrip';
import { formatCurrency, formatMileage } from '../../shared/utils';
import { getCategoryLabel, MAINTENANCE_CATEGORY_OPTIONS } from './constants';

export type CategoryFilterValue = 'all' | MaintenanceCategory;

export interface MaintenanceTimelineProps {
  logs: MaintenanceLog[];
  selectedCategory: CategoryFilterValue;
  onSelectCategory: (category: CategoryFilterValue) => void;
  onSelectLog: (log: MaintenanceLog) => void;
}

export const MaintenanceTimeline: React.FC<MaintenanceTimelineProps> = ({
  logs,
  selectedCategory,
  onSelectCategory,
  onSelectLog,
}) => {
  const filteredLogs =
    selectedCategory === 'all'
      ? logs
      : logs.filter((log) => log.category === selectedCategory);

  return (
    <div className="maintenance-timeline-section">
      <div
        className="category-filter-bar"
        role="group"
        aria-label="정비 항목별 필터"
      >
        <button
          type="button"
          className={`filter-chip touch-target${selectedCategory === 'all' ? ' active' : ''}`}
          onClick={() => onSelectCategory('all')}
          aria-pressed={selectedCategory === 'all'}
        >
          전체
        </button>
        {MAINTENANCE_CATEGORY_OPTIONS.map((opt) => {
          const isActive = selectedCategory === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              className={`filter-chip touch-target${isActive ? ' active' : ''}`}
              onClick={() => onSelectCategory(opt.value)}
              aria-pressed={isActive}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {filteredLogs.length === 0 ? (
        <div className="empty-state-box" data-testid="empty-maintenance-list">
          <p className="empty-state-title">
            {selectedCategory === 'all'
              ? '등록된 정비 내역이 없습니다'
              : '해당 항목의 정비 내역이 없습니다'}
          </p>
          <p className="empty-state-desc">
            엔진오일, 타이어, 브레이크 등 정비 기록을 추가하면 최신순 타임라인으로 확인할 수 있습니다.
          </p>
        </div>
      ) : (
        <ol className="timeline-list" aria-label="정비 내역 타임라인">
          {filteredLogs.map((log) => (
            <li key={log.id} className="timeline-item">
              <div className="timeline-card-container">
                <button
                  type="button"
                  className="timeline-card-btn"
                  onClick={() => onSelectLog(log)}
                >
                  <div className="timeline-card-top">
                    <div className="timeline-date-group">
                      <span className="timeline-date">{log.date}</span>
                      <span className="timeline-category-badge">
                        {getCategoryLabel(log.category)}
                      </span>
                      {log.attachmentIds && log.attachmentIds.length > 0 && (
                        <span className="timeline-photo-badge">
                          📷 {log.attachmentIds.length}장
                        </span>
                      )}
                    </div>
                    <strong className="timeline-cost">
                      {formatCurrency(log.cost)}
                    </strong>
                  </div>

                  <div className="timeline-card-body">
                    <strong className="timeline-title">{log.title}</strong>
                    <span className="timeline-submeta">
                      주행거리 {formatMileage(log.mileage)}
                      {log.shopName ? ` · ${log.shopName}` : ''}
                    </span>
                    {log.memo && <p className="timeline-memo">{log.memo}</p>}
                  </div>
                </button>

                {log.attachmentIds && log.attachmentIds.length > 0 && (
                  <AttachmentThumbnailStrip attachmentIds={log.attachmentIds} />
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
};
