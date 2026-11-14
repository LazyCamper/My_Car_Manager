import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useActiveVehicle } from '../app/ActiveVehicleContext';
import { useRepositories } from '../app/RepositoryContext';
import {
  BackupFilePayload,
  LAST_BACKUP_DATE_META_KEY,
} from '../domain/models';
import {
  buildBackupFileName,
  deserializeBackupPayload,
  parseAndValidateBackupJson,
  serializeBackupSnapshot,
} from '../features/backup';
import { formatDateDot } from '../shared/utils';

function triggerJsonDownload(jsonContent: string, fileName: string): void {
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(typeof reader.result === 'string' ? reader.result : '');
    };
    reader.onerror = () => {
      reject(new Error('파일을 읽는 중 오류가 발생했습니다.'));
    };
    reader.readAsText(file);
  });
}

export const SettingsPage: React.FC = () => {
  const { backupRepo, appMetaRepo } = useRepositories();
  const { refreshVehicles } = useActiveVehicle();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [lastBackupDate, setLastBackupDate] = useState<string | undefined>(
    undefined,
  );
  const [pendingPayload, setPendingPayload] =
    useState<BackupFilePayload | null>(null);
  const [pendingFileName, setPendingFileName] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const loadBackupMeta = useCallback(async () => {
    const savedDate = await appMetaRepo.get<string>(LAST_BACKUP_DATE_META_KEY);
    setLastBackupDate(savedDate);
  }, [appMetaRepo]);

  useEffect(() => {
    void loadBackupMeta();
  }, [loadBackupMeta]);

  const handleExportBackup = async () => {
    setErrorMessage(null);
    setStatusMessage(null);
    setIsProcessing(true);

    try {
      const snapshot = await backupRepo.exportSnapshot();
      const jsonContent = await serializeBackupSnapshot(snapshot);
      const todayStr = formatDateDot(new Date());
      const fileName = buildBackupFileName(todayStr);

      triggerJsonDownload(jsonContent, fileName);

      await appMetaRepo.set(LAST_BACKUP_DATE_META_KEY, todayStr);
      setLastBackupDate(todayStr);
      setStatusMessage(`백업 파일(${fileName})을 내보냈습니다.`);
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : '백업 내보내기 중 오류가 발생했습니다.',
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setErrorMessage(null);
    setStatusMessage(null);
    setPendingPayload(null);

    try {
      const rawText = await readFileAsText(file);
      const validated = parseAndValidateBackupJson(rawText);
      setPendingFileName(file.name);
      setPendingPayload(validated);
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : '유효하지 않은 백업 파일입니다.',
      );
    }
  };

  const handleConfirmRestore = async () => {
    if (!pendingPayload) return;
    setErrorMessage(null);
    setStatusMessage(null);
    setIsProcessing(true);

    try {
      const snapshot = deserializeBackupPayload(pendingPayload);
      await backupRepo.restoreSnapshot(snapshot);

      const todayStr = formatDateDot(new Date());
      await appMetaRepo.set(LAST_BACKUP_DATE_META_KEY, todayStr);
      setLastBackupDate(todayStr);
      await refreshVehicles();

      setPendingPayload(null);
      setStatusMessage('백업 데이터를 성공적으로 복원했습니다.');
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : '데이터 복원 중 오류가 발생했습니다.',
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <section aria-labelledby="settings-title" className="settings-page">
      <header className="page-header garage-hero-banner garage-hero-banner--settings">
        <div className="garage-hero-content">
          <span className="garage-hero-eyebrow">DATA &amp; SYSTEM PREFERENCES</span>
          <h1 id="settings-title" className="page-title garage-hero-title">
            설정
          </h1>
          <p className="garage-hero-subtitle">
            데이터 JSON 백업·복원 및 오프라인 앱 저장소 환경 관리
          </p>
        </div>
      </header>

      <section
        className="backup-card"
        aria-labelledby="backup-section-heading"
      >
        <div className="backup-card-header">
          <h2 id="backup-section-heading" className="section-title">
            데이터 백업 및 복원
          </h2>
          <p className="backup-card-desc">
            모든 차량 정보, 정비·검사·보험 기록, 첨부된 영수증/서류 사진을 JSON 파일 하나로 내보내거나 복원할 수 있습니다.
          </p>
        </div>

        <div className="backup-last-date-box">
          <span className="backup-last-date-label">마지막 백업 날짜</span>
          <strong
            className="backup-last-date-value"
            data-testid="last-backup-date"
          >
            {lastBackupDate ?? '백업 기록 없음'}
          </strong>
        </div>

        {errorMessage && (
          <p className="form-error-banner" role="alert">
            {errorMessage}
          </p>
        )}

        {statusMessage && (
          <p className="backup-success-banner" role="status">
            {statusMessage}
          </p>
        )}

        <div className="backup-actions-grid">
          <button
            type="button"
            className="btn btn-primary touch-target"
            onClick={() => void handleExportBackup()}
            disabled={isProcessing}
          >
            📥 백업 파일 내보내기 (JSON)
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="sr-only"
            data-testid="backup-import-input"
            aria-label="백업 JSON 파일 선택"
            onChange={(e) => void handleFileChange(e)}
            disabled={isProcessing}
          />
          <button
            type="button"
            className="btn btn-secondary touch-target"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
          >
            📤 백업 파일 가져오기 (복원)
          </button>
        </div>

        {pendingPayload && (
          <div
            className="restore-confirm-box"
            role="alertdialog"
            aria-label="백업 복원 확인"
          >
            <strong className="restore-confirm-title">
              기존 데이터를 덮어씁니다
            </strong>
            <p className="restore-confirm-desc">
              선택한 파일(<strong>{pendingFileName}</strong>)로 복원하면 현재 저장된 모든 차량·정비·검사·보험 및 사진 데이터가 백업 파일 내용으로 교체됩니다. 계속하시겠습니까?
            </p>
            <p className="restore-confirm-summary">
              포함된 항목: 차량 {pendingPayload.data.vehicles.length}대 · 정비{' '}
              {pendingPayload.data.maintenanceLogs.length}건 · 검사{' '}
              {pendingPayload.data.inspections.length}건 · 보험{' '}
              {pendingPayload.data.insurances.length}건 · 사진{' '}
              {pendingPayload.data.attachments.length}장
            </p>
            <div className="delete-confirm-actions">
              <button
                type="button"
                className="btn btn-secondary touch-target"
                onClick={() => setPendingPayload(null)}
                disabled={isProcessing}
              >
                복원 취소
              </button>
              <button
                type="button"
                className="btn btn-danger touch-target"
                onClick={() => void handleConfirmRestore()}
                disabled={isProcessing}
              >
                복원 확인
              </button>
            </div>
          </div>
        )}
      </section>

      <section
        className="ios-guide-card"
        aria-labelledby="ios-guide-heading"
        data-testid="ios-install-guide"
      >
        <h2 id="ios-guide-heading" className="section-title">
          홈 화면 앱 설치 및 데이터 보호 안내
        </h2>
        <p className="ios-guide-highlight">
          📱 <strong>iPhone은 Safari 공유 → 홈 화면에 추가</strong>로 설치해 주세요.
        </p>
        <p className="backup-card-desc">
          iPhone(iOS) 일반 브라우저 탭에서 실행하면 7일 이상 미접속 시 브라우저 정책으로 저장 데이터가 지워질 수 있습니다. 홈 화면에 추가하여 앱(Standalone)으로 사용하고, 주기적으로 JSON 백업 파일을 보관해 주세요.
        </p>
      </section>
    </section>
  );
};
