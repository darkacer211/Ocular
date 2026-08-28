import React from 'react';
import {
  LayoutDashboard,
  FilePlus2,
  Users,
  CreditCard,
  BookOpenText,
  AlertCircle,
  CalendarCheck,
  BarChart3,
  History,
  Settings,
  Database,
  Glasses,
  X,
  ArrowDownCircle,
} from 'lucide-react';
import { useShopSettings } from '../../contexts/ShopSettingsContext';
import { useData } from '../../contexts/DataContext';

export type ActiveTab =
  | 'dashboard'
  | 'billing'
  | 'customers'
  | 'payments'
  | 'ledger'
  | 'outstanding'
  | 'withdrawals'
  | 'daily_summary'
  | 'reports'
  | 'audit'
  | 'settings'
  | 'supabase_guide';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isOpen, onClose }) => {
  const { settings } = useShopSettings();
  const { metrics, isSupabaseLive } = useData();

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'billing', label: 'New Bill / Billing', icon: FilePlus2, highlight: true },
    { id: 'customers', label: 'Customers & CRM', icon: Users },
    { id: 'payments', label: 'Payment Tracker', icon: CreditCard },
    { id: 'ledger', label: 'Accounts / Ledger', icon: BookOpenText },
    {
      id: 'outstanding',
      label: 'Outstanding Dues',
      icon: AlertCircle,
      badge: metrics.total_outstanding > 0 ? `₹${(metrics.total_outstanding / 1000).toFixed(1)}k` : undefined,
      badgeColor: 'bg-rose-500 text-white',
    },
    { id: 'withdrawals', label: 'Cash Withdrawals', icon: ArrowDownCircle },
    { id: 'daily_summary', label: 'Daily Cash / UPI', icon: CalendarCheck },
    { id: 'reports', label: 'Reports & Export', icon: BarChart3 },
    { id: 'audit', label: 'Audit Log', icon: History },
    { id: 'settings', label: 'Shop Settings', icon: Settings },
    { id: 'supabase_guide', label: 'Supabase Guide', icon: Database, isGuide: true },
  ];

  const handleSelect = (tab: ActiveTab) => {
    setActiveTab(tab);
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-optic-navy text-white flex flex-col transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } border-r border-slate-800`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-optic-dark/50">
          <div className="flex items-center gap-3">
            {settings.logo_url ? (
              <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center shadow-md overflow-hidden flex-shrink-0">
                <img
                  src={settings.logo_url}
                  alt={settings.shop_name}
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-sky-400 flex items-center justify-center shadow-md flex-shrink-0">
                <Glasses className="w-6 h-6 text-white" />
              </div>
            )}
            <div className="overflow-hidden">
              <h1 className="text-sm font-bold tracking-tight text-white truncate uppercase">
                {settings.shop_name}
              </h1>
              <p className="text-[11px] text-slate-400 truncate">Optical Billing System</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Database Indicator */}
        <div className="px-5 py-2.5 bg-slate-900/80 border-b border-slate-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isSupabaseLive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span className="text-slate-300 font-medium text-[11px]">
              {isSupabaseLive ? 'Supabase Live' : 'Offline / Demo Mode'}
            </span>
          </div>
          <button
            onClick={() => handleSelect('supabase_guide')}
            className="text-[10px] text-brand-400 hover:underline font-mono"
          >
            Setup Guide
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id as ActiveTab)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 group ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                    : item.highlight
                    ? 'bg-slate-800/90 text-brand-300 hover:bg-slate-800 hover:text-white'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <Icon
                    className={`w-4 h-4 flex-shrink-0 transition-colors ${
                      isActive
                        ? 'text-white'
                        : item.highlight
                        ? 'text-brand-400'
                        : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      item.badgeColor || 'bg-slate-700 text-slate-200'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Quick Footer */}
        <div className="p-4 border-t border-slate-800 bg-optic-dark/60 text-[11px] text-slate-400 flex items-center justify-between">
          <div>
            <p className="font-semibold text-slate-200 truncate">{settings.city}, {settings.state}</p>
            <p className="text-[10px] text-slate-500 font-mono">{settings.phone_number}</p>
          </div>
          <span className="px-2 py-1 rounded bg-slate-800 text-[10px] font-mono text-slate-300">v1.0</span>
        </div>
      </aside>
    </>
  );
};
