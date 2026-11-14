import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import { ActiveVehicleProvider } from './ActiveVehicleContext';
import { RepositoryProvider } from './RepositoryContext';
import { AppRoutes } from './router';
import { AppRepositories } from '../repositories/interfaces';

function createInMemoryRepositories(): AppRepositories {
  return {
    vehicleRepo: {
      getAll: async () => [],
      getById: async () => undefined,
      save: async (input) => ({
        id: input.id ?? 'v-1',
        name: input.name,
        plateNumber: input.plateNumber,
        manufacturerModel: input.manufacturerModel,
        modelYear: input.modelYear,
        currentMileage: input.currentMileage,
        displayOrder: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
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
      get: async () => undefined,
      set: async () => undefined,
    },
  };
}

describe('App routing & bottom tab navigation', () => {
  it('renders HomePage by default and switches between the 4 bottom tabs', async () => {
    const repos = createInMemoryRepositories();
    render(
      <RepositoryProvider repositories={repos}>
        <ActiveVehicleProvider>
          <MemoryRouter initialEntries={['/']}>
            <AppRoutes />
          </MemoryRouter>
        </ActiveVehicleProvider>
      </RepositoryProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: '홈' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('link', { name: /정비/ }));
    expect(screen.getByRole('heading', { name: '정비' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('link', { name: /검사·보험/ }));
    expect(screen.getByRole('heading', { name: '검사·보험' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('link', { name: /설정/ }));
    expect(screen.getByRole('heading', { name: '설정' })).toBeInTheDocument();
  });
});
