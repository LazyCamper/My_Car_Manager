import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { ActiveVehicleProvider } from '../app/ActiveVehicleContext';
import { RepositoryProvider } from '../app/RepositoryContext';
import { AppRoutes } from '../app/router';
import { Attachment, MaintenanceLog, Vehicle } from '../domain/models';
import { AppRepositories } from '../repositories/interfaces';
import * as imageCompression from '../shared/utils/imageCompression';

function createMaintenanceTestRepositories(initial?: {
  vehicles?: Vehicle[];
  logs?: MaintenanceLog[];
  attachments?: Attachment[];
}): AppRepositories {
  const vehicles = [...(initial?.vehicles ?? [])];
  let logs = [...(initial?.logs ?? [])];
  let attachments = [...(initial?.attachments ?? [])];
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
      getCurrentInspection: async () => undefined,
      getInspectionsByVehicle: async () => [],
      saveInspection: async (input) => ({ ...input, id: 'insp-1' }),
      deleteInspection: async () => undefined,
      getCurrentInsurance: async () => undefined,
      getInsurancesByVehicle: async () => [],
      saveInsurance: async (input) => ({ ...input, id: 'ins-1' }),
      deleteInsurance: async () => undefined,
    },
    maintenanceRepo: {
      getByVehicle: async (vehicleId) =>
        logs.filter((l) => l.vehicleId === vehicleId),
      getUpcomingDueByVehicle: async (vehicleId) =>
        logs.filter(
          (l) =>
            l.vehicleId === vehicleId &&
            Boolean(l.nextDueDate) &&
            !l.isDueCompleted,
        ),
      save: async (input) => {
        if (input.id) {
          const idx = logs.findIndex((l) => l.id === input.id);
          if (idx >= 0) {
            const updated: MaintenanceLog = {
              ...logs[idx],
              ...input,
              id: input.id,
            };
            logs[idx] = updated;
            return updated;
          }
        }
        const created: MaintenanceLog = {
          ...input,
          id: `maint-${logs.length + 1}`,
          createdAt: new Date().toISOString(),
        };
        logs.push(created);
        return created;
      },
      delete: async (id) => {
        logs = logs.filter((l) => l.id !== id);
      },
    },
    attachmentRepo: {
      getByIds: async (ids) => attachments.filter((a) => ids.includes(a.id)),
      getByParent: async (parentType, parentId) =>
        attachments.filter(
          (a) => a.parentType === parentType && a.parentId === parentId,
        ),
      save: async (input) => {
        const record: Attachment = {
          id: input.id ?? `att-${attachments.length + 1}`,
          parentType: input.parentType,
          parentId: input.parentId,
          blob: input.blob,
          mimeType: input.mimeType ?? 'image/jpeg',
          fileName: input.fileName,
          size: input.blob.size,
          createdAt: new Date().toISOString(),
        };
        attachments.push(record);
        return record;
      },
      delete: async (id) => {
        attachments = attachments.filter((a) => a.id !== id);
      },
      deleteMany: async (ids) => {
        attachments = attachments.filter((a) => !ids.includes(a.id));
      },
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

describe('정비 내역 화면 (MaintenancePage) 통합 테스트', () => {
  it('입력 검증(날짜 필수, 주행거리/비용 음수 불가)이 동작하고 새 정비 내역을 등록하면 누적 비용이 갱신된다', async () => {
    const repos = createMaintenanceTestRepositories({
      vehicles: [DEFAULT_VEHICLE],
      logs: [],
    });

    render(
      <RepositoryProvider repositories={repos}>
        <ActiveVehicleProvider>
          <MemoryRouter initialEntries={['/maintenance']}>
            <AppRoutes />
          </MemoryRouter>
        </ActiveVehicleProvider>
      </RepositoryProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('total-maintenance-cost')).toHaveTextContent(
        '₩0',
      );
    });

    // + 정비 등록 모달 열기
    fireEvent.click(screen.getByRole('button', { name: '+ 정비 등록' }));

    // 1. 날짜 필수 검증
    fireEvent.change(screen.getByLabelText(/정비 날짜/), {
      target: { value: '' },
    });
    fireEvent.click(screen.getByRole('button', { name: '정비 등록' }));
    expect(screen.getByRole('alert')).toHaveTextContent(
      '정비 날짜를 입력해 주세요.',
    );

    // 2. 주행거리 음수 불가 검증
    fireEvent.change(screen.getByLabelText(/정비 날짜/), {
      target: { value: '2026.11.10' },
    });
    fireEvent.change(screen.getByLabelText(/주행거리/), {
      target: { value: '-100' },
    });
    fireEvent.change(screen.getByLabelText(/비용 \(원\)/), {
      target: { value: '95000' },
    });
    fireEvent.click(screen.getByRole('button', { name: '정비 등록' }));
    expect(screen.getByRole('alert')).toHaveTextContent(
      '주행거리는 0 이상의 숫자로 입력해 주세요.',
    );

    // 3. 비용 음수 불가 검증
    fireEvent.change(screen.getByLabelText(/주행거리/), {
      target: { value: '35200' },
    });
    fireEvent.change(screen.getByLabelText(/비용 \(원\)/), {
      target: { value: '-5000' },
    });
    fireEvent.click(screen.getByRole('button', { name: '정비 등록' }));
    expect(screen.getByRole('alert')).toHaveTextContent(
      '비용은 0원 이상의 숫자로 입력해 주세요.',
    );

    // 4. 정상 입력 및 직접 입력 항목 테스트
    fireEvent.change(screen.getByLabelText(/정비 항목 분류/), {
      target: { value: 'other' },
    });
    fireEvent.change(screen.getByLabelText(/정비 항목 상세명/), {
      target: { value: '와이퍼 블레이드 교체' },
    });
    fireEvent.change(screen.getByLabelText(/비용 \(원\)/), {
      target: { value: '32000' },
    });
    fireEvent.change(screen.getByLabelText(/정비소/), {
      target: { value: '오토큐 역삼점' },
    });
    fireEvent.change(screen.getByLabelText(/메모/), {
      target: { value: '발수 코팅 와이퍼 장착' },
    });

    fireEvent.click(screen.getByRole('button', { name: '정비 등록' }));

    await waitFor(() => {
      expect(screen.getByText('와이퍼 블레이드 교체')).toBeInTheDocument();
    });
    expect(screen.getByTestId('total-maintenance-cost')).toHaveTextContent(
      '₩32,000',
    );
    expect(screen.getByText(/오토큐 역삼점/)).toBeInTheDocument();
    expect(screen.getByText('발수 코팅 와이퍼 장착')).toBeInTheDocument();
  });

  it('최신순 타임라인 정렬, 항목별 필터, 탭하여 상세/수정, 삭제 시 확인창이 동작한다', async () => {
    const repos = createMaintenanceTestRepositories({
      vehicles: [DEFAULT_VEHICLE],
      logs: [
        {
          id: 'maint-old',
          vehicleId: 'v-1',
          date: '2026.05.10',
          mileage: 28000,
          category: 'engine_oil',
          title: '엔진오일 및 오일필터 교체',
          cost: 90000,
          shopName: '기아오토큐',
          attachmentIds: [],
          createdAt: '2026-05-10T09:00:00.000Z',
        },
        {
          id: 'maint-new',
          vehicleId: 'v-1',
          date: '2026.10.20',
          mileage: 34000,
          category: 'tire',
          title: '앞타이어 2본 교체',
          cost: 340000,
          shopName: '타이어뱅크',
          attachmentIds: [],
          createdAt: '2026-10-20T09:00:00.000Z',
        },
      ],
    });

    render(
      <RepositoryProvider repositories={repos}>
        <ActiveVehicleProvider>
          <MemoryRouter initialEntries={['/maintenance']}>
            <AppRoutes />
          </MemoryRouter>
        </ActiveVehicleProvider>
      </RepositoryProvider>,
    );

    // 누적 비용: 90,000 + 340,000 = 430,000
    await waitFor(() => {
      expect(screen.getByTestId('total-maintenance-cost')).toHaveTextContent(
        '₩430,000',
      );
    });

    // 최신순 정렬 확인 (2026.10.20 앞타이어가 첫 번째)
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('앞타이어 2본 교체');
    expect(items[1]).toHaveTextContent('엔진오일 및 오일필터 교체');

    // 항목별 필터: '엔진오일' 클릭 시 1건만 표시
    fireEvent.click(screen.getByRole('button', { name: '엔진오일' }));
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
    expect(screen.getByText('엔진오일 및 오일필터 교체')).toBeInTheDocument();

    // 다시 '전체' 필터로 복귀
    fireEvent.click(screen.getByRole('button', { name: '전체' }));
    expect(screen.getAllByRole('listitem')).toHaveLength(2);

    // 타임라인 항목 탭하여 상세/수정 모달 열기
    fireEvent.click(screen.getByText('앞타이어 2본 교체'));
    expect(
      screen.getByRole('heading', { name: '정비 내역 상세 · 수정' }),
    ).toBeInTheDocument();

    // 비용을 340,000 -> 360,000으로 수정 저장
    fireEvent.change(screen.getByLabelText(/비용 \(원\)/), {
      target: { value: '360000' },
    });
    fireEvent.click(screen.getByRole('button', { name: '수정 저장' }));

    await waitFor(() => {
      expect(screen.getByTestId('total-maintenance-cost')).toHaveTextContent(
        '₩450,000',
      );
    });

    // 다시 항목 탭 후 삭제 및 삭제 확인창 검증
    fireEvent.click(screen.getByText('앞타이어 2본 교체'));
    fireEvent.click(screen.getByRole('button', { name: '삭제' }));

    expect(
      screen.getByRole('alertdialog', { name: '정비 내역 삭제 확인' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('이 정비 내역을 정말 삭제하시겠습니까?'),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '삭제 확인' }));

    await waitFor(() => {
      expect(
        screen.queryByText('앞타이어 2본 교체'),
      ).not.toBeInTheDocument();
    });
    expect(screen.getByTestId('total-maintenance-cost')).toHaveTextContent(
      '₩90,000',
    );
  });

  it('사진 첨부(최대 5장 제한, 썸네일 표시, 확대 보기, 사진 삭제)가 저장소 계층을 통해 동작한다', async () => {
    URL.createObjectURL = vi.fn(() => 'blob:test-preview');
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(imageCompression, 'compressImageFile').mockImplementation(
      async () => new Blob(['compressed'], { type: 'image/jpeg' }),
    );

    const repos = createMaintenanceTestRepositories({
      vehicles: [DEFAULT_VEHICLE],
      logs: [],
    });

    render(
      <RepositoryProvider repositories={repos}>
        <ActiveVehicleProvider>
          <MemoryRouter initialEntries={['/maintenance']}>
            <AppRoutes />
          </MemoryRouter>
        </ActiveVehicleProvider>
      </RepositoryProvider>,
    );

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: '+ 정비 등록' }),
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: '+ 정비 등록' }));

    const galleryInput = screen.getByTestId('gallery-file-input');

    // 6장 선택 시 최대 5장 제한 안내 표시
    const sixFiles = Array.from({ length: 6 }, (_, idx) =>
      new File(['img'], `receipt-${idx + 1}.jpg`, { type: 'image/jpeg' }),
    );
    fireEvent.change(galleryInput, { target: { files: sixFiles } });
    expect(screen.getByRole('alert')).toHaveTextContent(
      '사진은 최대 5장까지만 첨부할 수 있습니다.',
    );

    // 2장 정상 첨부
    const twoFiles = [
      new File(['img1'], 'receipt-1.jpg', { type: 'image/jpeg' }),
      new File(['img2'], 'receipt-2.jpg', { type: 'image/jpeg' }),
    ];
    fireEvent.change(galleryInput, { target: { files: twoFiles } });

    await waitFor(() => {
      expect(
        screen.getByLabelText('receipt-1.jpg 확대 보기'),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByLabelText('receipt-2.jpg 확대 보기'),
    ).toBeInTheDocument();

    // 썸네일 클릭 시 확대 보기 모달 열기/닫기
    fireEvent.click(screen.getByLabelText('receipt-1.jpg 확대 보기'));
    expect(
      screen.getByRole('dialog', { name: '첨부 사진 확대 보기' }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '확대 보기 닫기' }));

    // 2번째 사진 삭제
    fireEvent.click(screen.getByLabelText('receipt-2.jpg 사진 삭제'));
    expect(
      screen.queryByLabelText('receipt-2.jpg 확대 보기'),
    ).not.toBeInTheDocument();

    // 필수값 입력 후 정비 내역 저장
    fireEvent.change(screen.getByLabelText(/비용 \(원\)/), {
      target: { value: '75000' },
    });
    fireEvent.click(screen.getByRole('button', { name: '정비 등록' }));

    await waitFor(() => {
      expect(screen.getByText('📷 1장')).toBeInTheDocument();
    });
  });

  it('복수 카테고리 태그 필터링과 축약 날짜(26.3.12), 주행거리·비용 미입력 저장이 정상 동작한다', async () => {
    const repos = createMaintenanceTestRepositories({
      vehicles: [DEFAULT_VEHICLE],
      logs: [
        {
          id: 'maint-multi',
          vehicleId: 'v-1',
          date: '2026.05.12',
          mileage: 50748,
          category: 'engine_oil',
          categories: ['engine_oil', 'filter'],
          title: '엔진오일, 에어필터, 연료필터, 에어컨필터 교환',
          cost: 0,
          shopName: '구미서비스센터',
          attachmentIds: [],
          createdAt: '2026-05-12T09:00:00.000Z',
        },
      ],
    });

    render(
      <RepositoryProvider repositories={repos}>
        <ActiveVehicleProvider>
          <MemoryRouter initialEntries={['/maintenance']}>
            <AppRoutes />
          </MemoryRouter>
        </ActiveVehicleProvider>
      </RepositoryProvider>,
    );

    await waitFor(() => {
      expect(
        screen.getByText('엔진오일, 에어필터, 연료필터, 에어컨필터 교환'),
      ).toBeInTheDocument();
    });

    // '엔진오일' 필터와 '에어컨·필터' 필터 양쪽 모두에서 조회됨
    fireEvent.click(screen.getByRole('button', { name: '엔진오일' }));
    expect(
      screen.getByText('엔진오일, 에어필터, 연료필터, 에어컨필터 교환'),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '에어컨·필터' }));
    expect(
      screen.getByText('엔진오일, 에어필터, 연료필터, 에어컨필터 교환'),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '전체' }));

    // 새 정비 등록: 축약 날짜(26.3.12) + 주행거리 비움 + 비용 비움
    fireEvent.click(screen.getByRole('button', { name: '+ 정비 등록' }));
    fireEvent.change(screen.getByLabelText(/정비 날짜/), {
      target: { value: '26.3.12' },
    });
    fireEvent.change(screen.getByLabelText(/주행거리/), {
      target: { value: '' },
    });
    fireEvent.change(screen.getByLabelText(/정비 항목 분류/), {
      target: { value: 'accident_repair' },
    });
    fireEvent.change(screen.getByLabelText(/정비 항목 상세명/), {
      target: { value: '앞범퍼, 운전석 앞휀더, 앞바퀴휠 교체' },
    });
    fireEvent.change(screen.getByLabelText(/비용 \(원\)/), {
      target: { value: '' },
    });

    fireEvent.click(screen.getByRole('button', { name: '정비 등록' }));

    await waitFor(() => {
      expect(
        screen.getByText('앞범퍼, 운전석 앞휀더, 앞바퀴휠 교체'),
      ).toBeInTheDocument();
    });
    expect(screen.getByText('2026.03.12')).toBeInTheDocument();
    expect(screen.getByText(/주행거리 미기재/)).toBeInTheDocument();
  });
});
