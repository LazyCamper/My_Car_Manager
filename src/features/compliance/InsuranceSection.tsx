import React from 'react';
import { Insurance } from '../../domain/models';
import { AttachmentThumbnailStrip } from '../../shared/components/AttachmentThumbnailStrip';
import { calculateDday, formatCurrency } from '../../shared/utils';

export interface InsuranceSectionProps {
  currentInsurance?: Insurance;
  allInsurances: Insurance[];
  onOpenAddModal: () => void;
  onSelectInsurance: (insurance: Insurance) => void;
}

export const InsuranceSection: React.FC<InsuranceSectionProps> = ({
  currentInsurance,
  allInsurances,
  onOpenAddModal,
  onSelectInsurance,
}) => {
  const historyItems = allInsurances.filter(
    (item) => item.id !== currentInsurance?.id,
  );
  const currentDday = currentInsurance
    ? calculateDday(currentInsurance.endDate)
    : null;

  return (
    <section
      className="compliance-section"
      aria-labelledby="insurance-section-title"
    >
      <div className="section-header-row">
        <h2 id="insurance-section-title" className="section-title">
          자동차 보험
        </h2>
        <button
          type="button"
          className="btn btn-chip-primary touch-target"
          onClick={onOpenAddModal}
        >
          + 보험 등록
        </button>
      </div>

      {!currentInsurance ? (
        <div className="empty-state-box" data-testid="empty-insurance-state">
          <p className="empty-state-title">등록된 자동차 보험 정보가 없습니다</p>
          <p className="empty-state-desc">
            가입한 보험사, 보장 기간(시작일·만기일), 연락처를 등록해 두면 만기 알림과 긴급출동 연결을 바로 이용할 수 있습니다.
          </p>
        </div>
      ) : (
        <div
          className={`compliance-current-card due-card-${currentDday?.status ?? 'normal'}`}
          data-testid="current-insurance-card"
        >
          <div className="compliance-card-header">
            <span className="compliance-current-badge">현재 유효한 보험</span>
            {currentDday && (
              <span className={`dday-badge dday-badge-${currentDday.status}`}>
                {currentDday.badgeText}
              </span>
            )}
          </div>

          <div className="compliance-card-main">
            <div className="compliance-company-row">
              <strong className="compliance-company-name">
                {currentInsurance.companyName}
              </strong>
              {currentInsurance.productName && (
                <span className="compliance-product-name">
                  {currentInsurance.productName}
                </span>
              )}
            </div>

            <div className="compliance-info-grid">
              <div className="compliance-info-item">
                <span className="compliance-info-label">보험 기간</span>
                <strong className="compliance-info-value highlight">
                  {currentInsurance.startDate} ~ {currentInsurance.endDate}
                </strong>
              </div>
              <div className="compliance-info-item">
                <span className="compliance-info-label">보험료</span>
                <span className="compliance-info-value">
                  {formatCurrency(currentInsurance.premiumCost)}
                </span>
              </div>
              <div className="compliance-info-item">
                <span className="compliance-info-label">연락처</span>
                <span className="compliance-info-value">
                  {currentInsurance.emergencyPhone || '-'}
                </span>
              </div>
            </div>

            {currentInsurance.memo && (
              <p className="compliance-memo">{currentInsurance.memo}</p>
            )}

            {currentInsurance.attachmentIds &&
              currentInsurance.attachmentIds.length > 0 && (
                <AttachmentThumbnailStrip
                  attachmentIds={currentInsurance.attachmentIds}
                />
              )}
          </div>

          <div className="compliance-card-footer">
            {currentInsurance.emergencyPhone && (
              <a
                href={`tel:${currentInsurance.emergencyPhone}`}
                className="btn btn-call touch-target"
              >
                📞 긴급출동 전화 ({currentInsurance.emergencyPhone})
              </a>
            )}
            <button
              type="button"
              className="btn btn-chip touch-target"
              onClick={() => onSelectInsurance(currentInsurance)}
            >
              보험 정보 수정
            </button>
          </div>
        </div>
      )}

      {historyItems.length > 0 && (
        <div className="compliance-history-block">
          <h3 className="compliance-history-title">
            지난 보험 이력 ({historyItems.length}건)
          </h3>
          <ul
            className="compliance-history-list"
            aria-label="지난 자동차 보험 이력"
          >
            {historyItems.map((item) => (
              <li key={item.id} className="compliance-history-item">
                <button
                  type="button"
                  className="compliance-history-btn"
                  onClick={() => onSelectInsurance(item)}
                >
                  <div className="compliance-history-main">
                    <strong className="compliance-history-date">
                      {item.companyName}
                      {item.productName ? ` (${item.productName})` : ''}
                    </strong>
                    <span className="compliance-history-sub">
                      {item.startDate} ~ {item.endDate} ·{' '}
                      {formatCurrency(item.premiumCost)}
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
