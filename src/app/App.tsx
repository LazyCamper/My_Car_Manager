import React from 'react';
import { HashRouter } from 'react-router-dom';
import { ActiveVehicleProvider } from './ActiveVehicleContext';
import { RepositoryProvider } from './RepositoryContext';
import { AppRoutes } from './router';

export const App: React.FC = () => {
  return (
    <RepositoryProvider>
      <ActiveVehicleProvider>
        <HashRouter>
          <AppRoutes />
        </HashRouter>
      </ActiveVehicleProvider>
    </RepositoryProvider>
  );
};
