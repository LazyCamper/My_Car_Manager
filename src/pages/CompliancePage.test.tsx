import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import { ActiveVehicleProvider } from '../app/ActiveVehicleContext';
import { RepositoryProvider } from '../app/RepositoryContext';
import { AppRoutes } from '../app/router';
import { Inspection, Insurance, Vehicle } from '../domain/models';
import { AppRepositories } from '../repositories/interfaces';
import { formatDateDot } from '../shared/utils';

function addDays(base: Date, days: number): string {
  const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + days);
  return formatDateDot(d);
}

function createComplianceTestRepositories(initial?: {
  vehicles?: Vehicle[];
  inspections?: Inspection[];
  insurances?: Insurance[];
}): AppRepositories {
  const vehicles = [...(initial?.vehicles ?? [])];
  let inspections = [...(initial?.inspections ?? [])];
  let insurances = [...(initial?.insurances ?? [])];
  const meta: Record<string, unknown> = {};

  return {
    vehicleRepo: {
      getAll: async () => [...vehicles],
      getById: async (id) => vehicles.find((v) => v.id === id),
      save: async (input) => ({
        id: input.id ?? 'v-1',
        name: input.name,
        plateNumber: input.plateNumber,
        manufacturerModel: input.manufacturerModel,
        modelYear: input.modelYear,
        currentMileage: input.currentMileage,
        displayOrder: 0,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      }),
      delete: async () => undefined,
    },
    complianceRepo: {
      getCurrentInspection: async (vehicleId) => {
        const list = inspections.filter((i) => i.vehicleId === vehicleId);
        return (
          list.find((i) => i.isCurrent) ??
          list.sort((a, b) => b.expiryDate.localeCompare(a.expiryDate))[0]
        );
      },
      getInspectionsByVehicle: async (vehicleId) =>
        inspections
          .filter((i) => i.vehicleId === vehicleId)
          .sort((a, b) => b.expiryDate.localeCompare(a.expiryDate)),
      saveInspection: async (input) => {
        const id = input.id ?? `insp-${inspections.length + 1}`;
        const record: Inspection = { ...input, id };
        if (record.isCurrent) {
          inspections = inspections.map((item) =>
            item.vehicleId === record.vehicleId && item.id !== record.id
              ? { ...item, isCurrent: false }
              : item,
          );
        }
        const existingIdx = inspections.findIndex((i) => i.id === id);
        if (existingIdx >= 0) {
          inspections[existingIdx] = record;
        } else {
          inspections.push(record);
        }
        return record;
      },
      deleteInspection: async (id) => {
        inspections = inspections.filter((i) => i.id !== id);
      },
      getCurrentInsurance: async (vehicleId) => {
        const list = insurances.filter((i) => i.vehicleId === vehicleId);
        return (
          list.find((i) => i.isCurrent) ??
          list.sort((a, b) => b.endDate.localeCompare(a.endDate))[0]
        );
      },
      getInsurancesByVehicle: async (vehicleId) =>
        insurances
          .filter((i) => i.vehicleId === vehicleId)
          .sort((a, b) => b.endDate.localeCompare(a.endDate)),
      saveInsurance: async (input) => {
        const id = input.id ?? `ins-${insurances.length + 1}`;
        const record: Insurance = { ...input, id };
        if (record.isCurrent) {
          insurances = insurances.map((item) =>
            item.vehicleId === record.vehicleId && item.id !== record.id
              ? { ...item, isCurrent: false }
              : item,
          );
        }
        const existingIdx = insurances.findIndex((i) => i.id === id);
        if (existingIdx >= 0) {
          insurances[existingIdx] = record;
        } else {
          insurances.push(record);
        }
        return record;
      },
      deleteInsurance: async (id) => {
        insurances = insurances.filter((i) => i.id !== id);
      },
    },
    maintenanceRepo: {
      getByVehicle: async () => [],
      getUpcomingDueByVehicle: async () => [],
      save: async (input) => ({
        ...input,
        id: 'maint-1',
        createdAt: new Date().toISOString(),
      }),
      delete: async () => undefined,
    },
    attachmentRepo: {
      getByIds: async () => [],
      getByParent: async () => [],
      save: async (input) => ({
        id: input.id ?? 'att-1',
        parentType: input.parentType,
        parentId: input.parentId,
        blob: input.blob,
        mimeType: input.mimeType ?? 'image/jpeg',
        fileName: input.fileName,
        size: input.blob.size,
        createdAt: new Date().toISOString(),
      }),
      delete: async () => undefined,
      deleteMany: async () => undefined,
    },
    backupRepo: {
      exportSnapshot: async () => ({
        vehicles: [],
        maintenanceLogs: [],
        inspections: [],
        insurances: [],
        attachments: [],
      }),
      restoreSnapshot: async () => undefined,
    },
    appMetaRepo: {
      get: async <T,>(key: string) => meta[key] as T | undefined,
      set: async (key, value) => {
        meta[key] = value;
      },
    },
  };
}

const DEFAULT_VEHICLE: Vehicle = {
  id: 'v-1',
  name: '쏘렌토',
  plateNumber: '12가 3456',
  manufacturerModel: '기아 쏘렌토',
  modelYear: 2023,
  currentMileage: 35000,
  displayOrder: 0,
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
};

describe('자동차 검사·보험 관리 화면 (CompliancePage) 통합 테스트', () => {
  it('새 검사 및 보험 등록 시 현재 유효한 항목은 맨 위에, 이전 항목은 지난 이력에 표시되며 홈 화면 D-day에 즉시 반영된다', async () => {
    const today = new Date();
    const nextInspExpiry = addDays(today, 20); // D-20
    const nextInsEnd = addDays(today, 10); // D-10

    const repos = createComplianceTestRepositories({
      vehicles: [DEFAULT_VEHICLE],
      inspections: [
        {
          id: 'insp-old',
          vehicleId: 'v-1',
          inspectionDate: '2022.11.01',
          expiryDate: '2024.11.01',
          stationName: '구로검사소',
          cost: 52000,
          attachmentIds: [],
          isCurrent: true,
        },
      ],
      insurances: [
        {
          id: 'ins-old',
          vehicleId: 'v-1',
          companyName: 'DB손해보험',
          productName: '다이렉트 이전보험',
          startDate: '2024.11.01',
          endDate: '2025.11.01',
          premiumCost: 610000,
          attachmentIds: [],
          isCurrent: true,
        },
      ],
    });

    render(
      <RepositoryProvider repositories={repos}>
        <ActiveVehicleProvider>
          <MemoryRouter initialEntries={['/compliance']}>
            <AppRoutes />
          </MemoryRouter>
        </ActiveVehicleProvider>
      </RepositoryProvider>,
    );

    // 초기 상태 확인
    await waitFor(() => {
      expect(screen.getByTestId('current-inspection-card')).toHaveTextContent(
        '구로검사소',
      );
    });
    expect(screen.getByTestId('current-insurance-card')).toHaveTextContent(
      'DB손해보험',
    );

    // 1. 새 자동차 검사 등록
    fireEvent.click(screen.getByRole('button', { name: '+ 검사 등록' }));
    fireEvent.change(screen.getByLabelText(/검사일/), {
      target: { value: '2024.11.14' },
    });
    fireEvent.change(screen.getByLabelText(/다음 만기일/), {
      target: { value: nextInspExpiry },
    });
    fireEvent.change(screen.getByLabelText(/검사소/), {
      target: { value: '성산검사소' },
    });
    fireEvent.change(screen.getByLabelText(/검사 비용/), {
      target: { value: '56000' },
    });
    fireEvent.change(screen.getByLabelText(/메모/), {
      target: { value: '종합검사 적합' },
    });
    fireEvent.click(screen.getByRole('button', { name: '검사 등록' }));

    // 현재 유효한 검사는 '성산검사소'로 바뀌고 '구로검사소'는 지난 검사 이력으로 이동
    await waitFor(() => {
      expect(screen.getByTestId('current-inspection-card')).toHaveTextContent(
        '성산검사소',
      );
    });
    const inspHistoryList = screen.getByRole('list', {
      name: '지난 자동차 검사 이력',
    });
    expect(within(inspHistoryList).getByText(/구로검사소/)).toBeInTheDocument();

    // 2. 새 자동차 보험 등록 (증권번호 입력 필드가 없는지 함께 검증)
    fireEvent.click(screen.getByRole('button', { name: '+ 보험 등록' }));
    expect(screen.queryByLabelText(/증권번호/)).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/보험사/), {
      target: { value: '삼성화재' },
    });
    fireEvent.change(screen.getByLabelText(/상품명/), {
      target: { value: '애니카 다이렉트' },
    });
    fireEvent.change(screen.getByLabelText(/보험 시작일/), {
      target: { value: '2025.11.14' },
    });
    fireEvent.change(screen.getByLabelText(/보험 만기일/), {
      target: { value: nextInsEnd },
    });
    fireEvent.change(screen.getByLabelText(/보험료/), {
      target: { value: '680000' },
    });
    fireEvent.change(screen.getByLabelText(/연락처/), {
      target: { value: '1588-5114' },
    });
    fireEvent.change(screen.getByLabelText(/담보 메모/), {
      target: { value: '대물 10억 / 자상' },
    });
    fireEvent.click(screen.getByRole('button', { name: '보험 등록' }));

    // 현재 유효한 보험은 '삼성화재'로 바뀌고 'DB손해보험'은 지난 보험 이력으로 이동
    await waitFor(() => {
      expect(screen.getByTestId('current-insurance-card')).toHaveTextContent(
        '삼성화재',
      );
    });
    expect(screen.getByTestId('current-insurance-card')).toHaveTextContent(
      '애니카 다이렉트',
    );
    const insHistoryList = screen.getByRole('list', {
      name: '지난 자동차 보험 이력',
    });
    expect(within(insHistoryList).getByText(/DB손해보험/)).toBeInTheDocument();

    // 3. 하단 탭에서 '나의 차고'로 이동 시 새로 등록한 보험(D-10)과 검사(D-20)가 가까운 순으로 즉시 반영됨
    fireEvent.click(screen.getByRole('link', { name: /나의 차고/ }));

    await waitFor(() => {
      expect(
        screen.getByText('삼성화재 자동차 보험 만기'),
      ).toBeInTheDocument();
    });
    const dueItems = screen.getAllByRole('listitem');
    expect(dueItems).toHaveLength(2);
    expect(dueItems[0]).toHaveTextContent('삼성화재 자동차 보험 만기');
    expect(dueItems[0]).toHaveTextContent('D-10');
    expect(dueItems[1]).toHaveTextContent('자동차 정기/종합검사 (성산검사소)');
    expect(dueItems[1]).toHaveTextContent('D-20');
  });
});
