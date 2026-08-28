import React, { useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import { MainLayout } from './components/layout/MainLayout';
import { ActiveTab } from './components/layout/Sidebar';
import { Customer, Bill } from './types';

// Pages
import { DashboardPage } from './pages/DashboardPage';
import { BillingPage } from './pages/BillingPage';
import { CustomersPage } from './pages/CustomersPage';
import { PaymentsPage } from './pages/PaymentsPage';
import { LedgerPage } from './pages/LedgerPage';
import { OutstandingPage } from './pages/OutstandingPage';
import { WithdrawalsPage } from './pages/WithdrawalsPage';
import { DailySummaryPage } from './pages/DailySummaryPage';
import { ReportsPage } from './pages/ReportsPage';
import { AuditLogPage } from './pages/AuditLogPage';
import { SettingsPage } from './pages/SettingsPage';
import { SupabaseGuidePage } from './pages/SupabaseGuidePage';
import { LoginPage } from './pages/LoginPage';

// Global Modals
import { ReceiptModal } from './components/receipt/ReceiptModal';
import { PaymentCollectorModal } from './components/payments/PaymentCollectorModal';
import { BillCancelModal } from './components/billing/BillCancelModal';

export const App: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Modal & Selection States
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [billingCustomer, setBillingCustomer] = useState<Customer | null>(null);
  const [viewingBill, setViewingBill] = useState<Bill | null>(null);
  const [paymentBill, setPaymentBill] = useState<Bill | null>(null);
  const [cancellingBill, setCancellingBill] = useState<Bill | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-mono">Initializing Shriramwar Opticals...</p>
        </div>
      </div>
    );
  }

  // Unauthenticated view
  if (!user) {
    return <LoginPage onLoginSuccess={() => setActiveTab('dashboard')} />;
  }

  // Handlers
  const handleOpenNewBill = (customer?: Customer) => {
    setBillingCustomer(customer || null);
    setActiveTab('billing');
  };

  const handleSelectCustomer = (customer: Customer | null) => {
    setSelectedCustomer(customer);
    if (customer) {
      setActiveTab('customers');
    }
  };

  return (
    <MainLayout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      onOpenNewBill={() => handleOpenNewBill()}
      onSelectCustomer={handleSelectCustomer}
      onSelectBill={(b) => setViewingBill(b)}
    >
      {/* Page Routing */}
      {activeTab === 'dashboard' && (
        <DashboardPage
          onOpenNewBill={() => handleOpenNewBill()}
          onViewBill={(b) => setViewingBill(b)}
          onViewCustomer={handleSelectCustomer}
          onCollectPayment={(b) => setPaymentBill(b)}
          onNavigate={(tab) => setActiveTab(tab)}
        />
      )}

      {activeTab === 'billing' && (
        <BillingPage
          initialCustomer={billingCustomer}
          onBillCreated={(b) => {
            setViewingBill(b);
          }}
        />
      )}

      {activeTab === 'customers' && (
        <CustomersPage
          selectedCustomer={selectedCustomer}
          onSelectCustomer={setSelectedCustomer}
          onOpenNewBillForCustomer={(c) => handleOpenNewBill(c)}
          onViewBill={(b) => setViewingBill(b)}
          onCollectPayment={(b) => setPaymentBill(b)}
        />
      )}

      {activeTab === 'payments' && (
        <PaymentsPage onViewBill={(b) => setViewingBill(b)} />
      )}

      {activeTab === 'ledger' && (
        <LedgerPage
          onViewBill={(b) => setViewingBill(b)}
          onCollectPayment={(b) => setPaymentBill(b)}
          onCancelBill={(b) => setCancellingBill(b)}
        />
      )}

      {activeTab === 'outstanding' && (
        <OutstandingPage
          onViewBill={(b) => setViewingBill(b)}
          onCollectPayment={(b) => setPaymentBill(b)}
        />
      )}

      {activeTab === 'daily_summary' && <DailySummaryPage />}

      {activeTab === 'withdrawals' && <WithdrawalsPage />}

      {activeTab === 'reports' && <ReportsPage />}

      {activeTab === 'audit' && <AuditLogPage />}

      {activeTab === 'settings' && <SettingsPage />}

      {activeTab === 'supabase_guide' && <SupabaseGuidePage />}

      {/* Global Modals */}
      <ReceiptModal
        bill={viewingBill}
        isOpen={Boolean(viewingBill)}
        onClose={() => setViewingBill(null)}
      />

      <PaymentCollectorModal
        bill={paymentBill}
        isOpen={Boolean(paymentBill)}
        onClose={() => setPaymentBill(null)}
      />

      <BillCancelModal
        bill={cancellingBill}
        isOpen={Boolean(cancellingBill)}
        onClose={() => setCancellingBill(null)}
      />
    </MainLayout>
  );
};
