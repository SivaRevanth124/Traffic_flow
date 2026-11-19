import React, { ReactNode } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { NavPage } from '../types';

interface MainLayoutProps {
  currentPage: NavPage;
  onSelectPage: (page: NavPage) => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  currentPage,
  onSelectPage,
  title,
  subtitle,
  children,
  onRefresh,
  isRefreshing
}) => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0B0F19]">
      <Sidebar currentPage={currentPage} onSelectPage={onSelectPage} />
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header
          title={title}
          subtitle={subtitle}
          onRefresh={onRefresh}
          isRefreshing={isRefreshing}
        />
        <main className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-[#0B0F19] to-[#0A0D14]">
          {children}
        </main>
      </div>
    </div>
  );
};
