import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { Vehicle, VehicleInput } from '../domain/models';
import { useRepositories } from './RepositoryContext';

const LAST_SELECTED_VEHICLE_KEY = 'lastSelectedVehicleId';

export interface ActiveVehicleContextValue {
  vehicles: Vehicle[];
  activeVehicle: Vehicle | null;
  activeVehicleId: string | null;
  isLoading: boolean;
  selectVehicle: (vehicleId: string) => Promise<void>;
  saveVehicle: (input: VehicleInput) => Promise<Vehicle>;
  deleteVehicle: (vehicleId: string) => Promise<void>;
  refreshVehicles: () => Promise<void>;
}

const ActiveVehicleContext = createContext<ActiveVehicleContextValue | null>(
  null,
);

export const ActiveVehicleProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { vehicleRepo, appMetaRepo } = useRepositories();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [activeVehicleId, setActiveVehicleId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadVehicles = useCallback(async () => {
    setIsLoading(true);
    try {
      const [allVehicles, savedVehicleId] = await Promise.all([
        vehicleRepo.getAll(),
        appMetaRepo.get<string>(LAST_SELECTED_VEHICLE_KEY),
      ]);
      setVehicles(allVehicles);

      if (allVehicles.length === 0) {
        setActiveVehicleId(null);
      } else {
        const matched = allVehicles.find((v) => v.id === savedVehicleId);
        const targetId = matched ? matched.id : allVehicles[0].id;
        setActiveVehicleId(targetId);
        if (targetId !== savedVehicleId) {
          await appMetaRepo.set(LAST_SELECTED_VEHICLE_KEY, targetId);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [vehicleRepo, appMetaRepo]);

  useEffect(() => {
    void loadVehicles();
  }, [loadVehicles]);

  const selectVehicle = useCallback(
    async (vehicleId: string) => {
      setActiveVehicleId(vehicleId);
      await appMetaRepo.set(LAST_SELECTED_VEHICLE_KEY, vehicleId);
    },
    [appMetaRepo],
  );

  const saveVehicle = useCallback(
    async (input: VehicleInput): Promise<Vehicle> => {
      const saved = await vehicleRepo.save(input);
      const updatedList = await vehicleRepo.getAll();
      setVehicles(updatedList);
      setActiveVehicleId(saved.id);
      await appMetaRepo.set(LAST_SELECTED_VEHICLE_KEY, saved.id);
      return saved;
    },
    [vehicleRepo, appMetaRepo],
  );

  const deleteVehicle = useCallback(
    async (vehicleId: string): Promise<void> => {
      await vehicleRepo.delete(vehicleId);
      const updatedList = await vehicleRepo.getAll();
      setVehicles(updatedList);
      const nextId = updatedList[0]?.id ?? null;
      setActiveVehicleId(nextId);
      if (nextId) {
        await appMetaRepo.set(LAST_SELECTED_VEHICLE_KEY, nextId);
      }
    },
    [vehicleRepo, appMetaRepo],
  );

  const activeVehicle =
    vehicles.find((v) => v.id === activeVehicleId) ?? vehicles[0] ?? null;

  return (
    <ActiveVehicleContext.Provider
      value={{
        vehicles,
        activeVehicle,
        activeVehicleId: activeVehicle?.id ?? null,
        isLoading,
        selectVehicle,
        saveVehicle,
        deleteVehicle,
        refreshVehicles: loadVehicles,
      }}
    >
      {children}
    </ActiveVehicleContext.Provider>
  );
};

export function useActiveVehicle(): ActiveVehicleContextValue {
  const context = useContext(ActiveVehicleContext);
  if (!context) {
    throw new Error(
      'useActiveVehicle must be used within an ActiveVehicleProvider',
    );
  }
  return context;
}
