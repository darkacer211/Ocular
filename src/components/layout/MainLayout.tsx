import React, { useState } from 'react';
import { Sidebar, ActiveTab } from './Sidebar';
import { Topbar } from './Topbar';
import { GlobalSearchModal } from '../common/GlobalSearchModal';
import { Customer, Bill } from '../../types';

interface MainLayoutProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenNewBill: () => void;
  onSelectCustomer: (customer: Customer) => void;
  onSelectBill: (bill: Bill) => void;
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewBill,
  onSelectCustomer,
  onSelectBill,
  children,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar
          onOpenSidebar={() => setIsSidebarOpen(true)}
          onOpenNewBill={onOpenNewBill}
          onOpenSearch={() => setIsSearchOpen(true)}
          setActiveTab={setActiveTab}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* Global Fast Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectCustomer={(c) => {
          onSelectCustomer(c);
          setActiveTab('customers');
        }}
        onSelectBill={(b) => {
          onSelectBill(b);
        }}
      />
    </div>
  );
};
