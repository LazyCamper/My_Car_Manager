import {
  Attachment,
  BACKUP_SCHEMA_VERSION,
  BackupDataSnapshot,
  BackupFilePayload,
  SerializedAttachment,
} from '../../domain/models';
import { calculateDday, formatDateDot } from '../../shared/utils';

export const BACKUP_REMINDER_DAYS = 30;

export function buildBackupFileName(date: Date | string = new Date()): string {
  const formatted = formatDateDot(date);
  return `my-car-backup-${formatted}.json`;
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('Blob을 Base64로 변환하지 못했습니다.'));
        return;
      }
      const commaIndex = result.indexOf(',');
      resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result);
    };
    reader.onerror = () => {
      reject(new Error('파일을 읽는 중 오류가 발생했습니다.'));
    };
    reader.readAsDataURL(blob);
  });
}

export function base64ToBlob(base64: string, mimeType: string): Blob {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i += 1) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType || 'image/jpeg' });
}

export async function serializeBackupSnapshot(
  snapshot: BackupDataSnapshot,
  exportedAt: string = new Date().toISOString(),
): Promise<string> {
  const serializedAttachments: SerializedAttachment[] = [];

  for (const att of snapshot.attachments) {
    const base64Data = await blobToBase64(att.blob);
    serializedAttachments.push({
      id: att.id,
      parentType: att.parentType,
      parentId: att.parentId,
      base64Data,
      mimeType: att.mimeType,
      fileName: att.fileName,
      size: att.size,
      createdAt: att.createdAt,
    });
  }

  const payload: BackupFilePayload = {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt,
    data: {
      vehicles: snapshot.vehicles,
      maintenanceLogs: snapshot.maintenanceLogs,
      inspections: snapshot.inspections,
      insurances: snapshot.insurances,
      attachments: serializedAttachments,
    },
  };

  return JSON.stringify(payload, null, 2);
}

export function parseAndValidateBackupJson(jsonText: string): BackupFilePayload {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error('유효한 JSON 형식의 백업 파일이 아닙니다.');
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('백업 파일 형식이 올바르지 않습니다.');
  }

  const candidate = parsed as Partial<BackupFilePayload>;

  if (typeof candidate.schemaVersion !== 'number') {
    throw new Error('백업 파일에 스키마 버전(schemaVersion) 정보가 없습니다.');
  }

  if (candidate.schemaVersion !== BACKUP_SCHEMA_VERSION) {
    throw new Error(
      `지원하지 않는 백업 스키마 버전입니다. (파일 버전: v${candidate.schemaVersion}, 지원 버전: v${BACKUP_SCHEMA_VERSION})`,
    );
  }

  if (typeof candidate.data !== 'object' || candidate.data === null) {
    throw new Error('백업 파일에 데이터(data) 영역이 없습니다.');
  }

  const { vehicles, maintenanceLogs, inspections, insurances, attachments } =
    candidate.data as Record<string, unknown>;

  if (
    !Array.isArray(vehicles) ||
    !Array.isArray(maintenanceLogs) ||
    !Array.isArray(inspections) ||
    !Array.isArray(insurances) ||
    !Array.isArray(attachments)
  ) {
    throw new Error(
      '백업 파일 내부의 차량·정비·검사·보험·첨부파일 목록 형식이 손상되었습니다.',
    );
  }

  for (const v of vehicles) {
    if (
      typeof v !== 'object' ||
      v === null ||
      typeof (v as { id?: unknown }).id !== 'string' ||
      typeof (v as { name?: unknown }).name !== 'string'
    ) {
      throw new Error('백업 파일의 차량 데이터 형식이 올바르지 않습니다.');
    }
  }

  for (const att of attachments) {
    if (
      typeof att !== 'object' ||
      att === null ||
      typeof (att as { id?: unknown }).id !== 'string' ||
      typeof (att as { base64Data?: unknown }).base64Data !== 'string'
    ) {
      throw new Error('백업 파일의 첨부 사진 데이터 형식이 올바르지 않습니다.');
    }
  }

  return candidate as BackupFilePayload;
}

export function deserializeBackupPayload(
  payload: BackupFilePayload,
): BackupDataSnapshot {
  const attachments: Attachment[] = payload.data.attachments.map((item) => {
    const blob = base64ToBlob(item.base64Data, item.mimeType);
    return {
      id: item.id,
      parentType: item.parentType,
      parentId: item.parentId,
      blob,
      mimeType: item.mimeType,
      fileName: item.fileName,
      size: item.size,
      createdAt: item.createdAt,
    };
  });

  return {
    vehicles: payload.data.vehicles,
    maintenanceLogs: payload.data.maintenanceLogs,
    inspections: payload.data.inspections,
    insurances: payload.data.insurances,
    attachments,
  };
}

/**
 * 마지막 백업 날짜(YYYY.MM.DD)로부터 경과한 일수를 반환합니다.
 * 백업 기록이 없으면 null을 반환합니다.
 */
export function getDaysSinceLastBackup(
  lastBackupDate: string | undefined,
  baseDate: Date | string = new Date(),
): number | null {
  if (!lastBackupDate) return null;
  try {
    const dday = calculateDday(lastBackupDate, baseDate);
    return -dday.daysRemaining;
  } catch {
    return null;
  }
}

/**
 * 마지막 백업일로부터 30일이 초과(> 30일)되었는지 판별합니다.
 */
export function isBackupOverdue(
  lastBackupDate: string | undefined,
  baseDate: Date | string = new Date(),
): boolean {
  const elapsed = getDaysSinceLastBackup(lastBackupDate, baseDate);
  if (elapsed === null) return false;
  return elapsed > BACKUP_REMINDER_DAYS;
}
