import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AppLayout } from '../shared/components/AppLayout';
import { HomePage } from '../pages/HomePage';
import { MaintenancePage } from '../pages/MaintenancePage';
import { CompliancePage } from '../pages/CompliancePage';
import { SettingsPage } from '../pages/SettingsPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="maintenance" element={<MaintenancePage />} />
        <Route path="compliance" element={<CompliancePage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
};
