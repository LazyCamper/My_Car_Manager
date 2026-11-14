import React, { createContext, useContext, useMemo } from 'react';
import { AppRepositories } from '../repositories/interfaces';
import { createDexieRepositories } from '../repositories/dexie';

const RepositoryContext = createContext<AppRepositories | null>(null);

export interface RepositoryProviderProps {
  repositories?: AppRepositories;
  children: React.ReactNode;
}

export const RepositoryProvider: React.FC<RepositoryProviderProps> = ({
  repositories,
  children,
}) => {
  const value = useMemo(
    () => repositories ?? createDexieRepositories(),
    [repositories],
  );

  return (
    <RepositoryContext.Provider value={value}>
      {children}
    </RepositoryContext.Provider>
  );
};

export function useRepositories(): AppRepositories {
  const context = useContext(RepositoryContext);
  if (!context) {
    throw new Error(
      'useRepositories must be used within a RepositoryProvider',
    );
  }
  return context;
}
