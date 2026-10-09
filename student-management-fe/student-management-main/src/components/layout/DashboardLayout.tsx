'use client';

import React, { useState } from 'react';import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-on-surface antialiased flex flex-col">
      {/* Sidebar (Desktop + Mobile Drawer) */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Column Wrapper offset by sidebar width on desktop */}
      <div className="lg:pl-72 flex flex-col flex-1 min-h-screen">
        <Header onToggleSidebar={() => setSidebarOpen(true)} />
        <main className="w-full pt-16 flex-1 px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-7xl mx-auto w-full">{children}</div>
        </main>
      </div>
    </div>
  );
};
