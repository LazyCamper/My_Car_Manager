import React from 'react';
import { Inspection } from '../../domain/models';
import { calculateDday, formatCurrency } from '../../shared/utils';

export interface InspectionSectionProps {
  currentInspection?: Inspection;
  allInspections: Inspection[];
  onOpenAddModal: () => void;
  onSelectInspection: (inspection: Inspection) => void;
}

export const InspectionSection: React.FC<InspectionSectionProps> = ({
  currentInspection,
  allInspections,
  onOpenAddModal,
  onSelectInspection,
}) => {
  const historyItems = allInspections.filter(
    (item) => item.id !== currentInspection?.id,
  );
  const currentDday = currentInspection
    ? calculateDday(currentInspection.expiryDate)
    : null;

  return (
    <section
      className="compliance-section"
      aria-labelledby="inspection-section-title"
    >
      <div className="section-header-row">
        <h2 id="inspection-section-title" className="section-title">
          자동차 검사
        </h2>
        <button
          type="button"
          className="btn btn-chip-primary touch-target"
          onClick={onOpenAddModal}
        >
          + 검사 등록
        </button>
      </div>

      {!currentInspection ? (
        <div className="empty-state-box" data-testid="empty-inspection-state">
          <p className="empty-state-title">등록된 자동차 검사 정보가 없습니다</p>
          <p className="empty-state-desc">
            최근 검사일과 다음 검사 만기일을 등록하면 홈 화면에서 D-day를 안내해 드립니다.
          </p>
        </div>
      ) : (
        <div
          className={`compliance-current-card due-card-${currentDday?.status ?? 'normal'}`}
          data-testid="current-inspection-card"
        >
          <div className="compliance-card-header">
            <span className="compliance-current-badge">현재 유효한 검사</span>
            {currentDday && (
              <span className={`dday-badge dday-badge-${currentDday.status}`}>
                {currentDday.badgeText}
              </span>
            )}
          </div>

          <div className="compliance-card-main">
            <div className="compliance-info-grid">
              <div className="compliance-info-item">
                <span className="compliance-info-label">다음 만기일</span>
                <strong className="compliance-info-value highlight">
                  {currentInspection.expiryDate}
                </strong>
              </div>
              <div className="compliance-info-item">
                <span className="compliance-info-label">최근 검사일</span>
                <span className="compliance-info-value">
                  {currentInspection.inspectionDate}
                </span>
              </div>
              <div className="compliance-info-item">
                <span className="compliance-info-label">검사소</span>
                <span className="compliance-info-value">
                  {currentInspection.stationName || '-'}
                </span>
              </div>
              <div className="compliance-info-item">
                <span className="compliance-info-label">검사 비용</span>
                <span className="compliance-info-value">
                  {formatCurrency(currentInspection.cost)}
                </span>
              </div>
            </div>

            {currentInspection.memo && (
              <p className="compliance-memo">{currentInspection.memo}</p>
            )}
          </div>

          <div className="compliance-card-footer">
            <button
              type="button"
              className="btn btn-chip touch-target"
              onClick={() => onSelectInspection(currentInspection)}
            >
              검사 정보 수정
            </button>
          </div>
        </div>
      )}

      {historyItems.length > 0 && (
        <div className="compliance-history-block">
          <h3 className="compliance-history-title">
            지난 검사 이력 ({historyItems.length}건)
          </h3>
          <ul
            className="compliance-history-list"
            aria-label="지난 자동차 검사 이력"
          >
            {historyItems.map((item) => (
              <li key={item.id} className="compliance-history-item">
                <button
                  type="button"
                  className="compliance-history-btn"
                  onClick={() => onSelectInspection(item)}
                >
                  <div className="compliance-history-main">
                    <strong className="compliance-history-date">
                      검사일: {item.inspectionDate} (만기: {item.expiryDate})
                    </strong>
                    <span className="compliance-history-sub">
                      {item.stationName ? `${item.stationName} · ` : ''}
                      {formatCurrency(item.cost)}
                    </span>
                  </div>
                  <span className="compliance-history-edit">상세·수정</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
};
