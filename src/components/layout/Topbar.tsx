import React, { useState } from 'react';
import {
  Menu,
  Search,
  PlusCircle,
  Calendar,
  User,
  LogOut,
  Sparkles,
  HelpCircle,
  Database,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { formatDate, getTodayDateString } from '../../lib/utils';
import { ActiveTab } from './Sidebar';

interface TopbarProps {
  onOpenSidebar: () => void;
  onOpenNewBill: () => void;
  onOpenSearch: () => void;
  setActiveTab: (tab: ActiveTab) => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  onOpenSidebar,
  onOpenNewBill,
  onOpenSearch,
  setActiveTab,
}) => {
  const { userEmail, signOut, isDemoMode } = useAuth();
  const { isSupabaseLive, resetDemoData } = useData();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const todayStr = formatDate(getTodayDateString(), 'EEEE, dd MMM yyyy');

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 shadow-sm">
      {/* Left: Mobile menu button & Global search trigger */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Bar */}
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs text-slate-500 hover:border-slate-300 hover:bg-slate-100 transition-colors w-48 sm:w-72 justify-between"
        >
          <div className="flex items-center gap-2 truncate">
            <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <span className="truncate">Search customer, mobile, bill...</span>
          </div>
          <kbd className="hidden sm:inline-block rounded bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 shadow-sm border border-slate-200">
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* Right: Actions, Date, New Bill, User Menu */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Date Display */}
        <div className="hidden md:flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700">
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
          <span>{todayStr}</span>
        </div>

        {/* Quick New Bill Action Button */}
        <Button
          variant="primary"
          size="sm"
          onClick={onOpenNewBill}
          leftIcon={<PlusCircle className="w-4 h-4" />}
          className="shadow-brand-600/20 font-semibold"
        >
          <span className="hidden sm:inline">New Bill</span>
          <span className="sm:hidden">Bill</span>
        </Button>

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 rounded-full border border-slate-200 p-1 hover:border-slate-300 focus:outline-none bg-slate-50"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-white shadow-sm">
              <User className="w-4 h-4" />
            </div>
          </button>

          {showProfileMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowProfileMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-elevation z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="font-bold text-slate-900 truncate">Shop Owner</p>
                  <p className="text-slate-500 truncate text-[11px]">{userEmail}</p>
                  <div className="mt-2 flex items-center gap-1.5">
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${
                        isSupabaseLive ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                    />
                    <span className="text-[10px] text-slate-600 font-medium">
                      {isSupabaseLive ? 'Connected to Supabase' : 'Offline / Mock Store'}
                    </span>
                  </div>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      setActiveTab('supabase_guide');
                      setShowProfileMenu(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    <Database className="w-4 h-4 text-brand-600" />
                    <span>Supabase Setup Guide</span>
                  </button>

                  <button
                    onClick={() => {
                      resetDemoData();
                      setShowProfileMenu(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Reset Demo Data</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('settings');
                      setShowProfileMenu(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    <HelpCircle className="w-4 h-4 text-slate-500" />
                    <span>Store Settings</span>
                  </button>
                </div>

                <div className="border-t border-slate-100 pt-1">
                  <button
                    onClick={() => {
                      signOut();
                      setShowProfileMenu(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-rose-600 hover:bg-rose-50 transition-colors font-semibold"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
