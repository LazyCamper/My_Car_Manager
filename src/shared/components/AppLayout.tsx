import React from 'react';
import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { PwaUpdatePrompt } from './PwaUpdatePrompt';

export const AppLayout: React.FC = () => {
  return (
    <div className="app-shell">
      <PwaUpdatePrompt />
      <main className="app-main">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
};
