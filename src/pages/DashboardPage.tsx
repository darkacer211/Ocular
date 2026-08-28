import React from 'react';
import { useData } from '../contexts/DataContext';
import { useShopSettings } from '../contexts/ShopSettingsContext';
import { Bill, Customer } from '../types';
import { formatCurrency, formatDate, exportWeeklyBackup } from '../lib/utils';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/Badge';
import {
  Receipt,
  TrendingUp,
  Banknote,
  QrCode,
  AlertCircle,
  FilePlus2,
  ArrowDownCircle,
  Download,
  Building2,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

interface DashboardPageProps {
  onOpenNewBill: () => void;
  onViewBill: (bill: Bill) => void;
  onViewCustomer: (customer: Customer | null) => void;
  onCollectPayment: (bill: Bill) => void;
  onNavigate: (tab: any) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onOpenNewBill,
  onViewBill,
  onCollectPayment,
  onNavigate,
}) => {
  const { metrics, bills, payments, customers, withdrawals } = useData();
  const { settings } = useShopSettings();

  const recentBills = bills.filter((b: Bill) => !b.is_cancelled).slice(0, 8);

  const handleWeeklyBackup = () => {
    exportWeeklyBackup({
      bills: bills.map((b: Bill) => ({
        'Bill No': b.bill_number,
        'Date': b.bill_date,
        'Customer': b.customer_name,
        'Mobile': b.customer_mobile,
        'Total (₹)': b.total_amount,
        'Paid (₹)': b.total_paid,
        'Remaining (₹)': b.remaining_amount,
        'Status': b.payment_status,
        'Mode': b.payment_mode,
        'Cancelled': b.is_cancelled ? 'Yes' : 'No',
      })),
      payments: payments.map((p: any) => ({
        'Date': p.payment_date,
        'Bill No': p.bill_number,
        'Customer': p.customer_name,
        'Mode': p.payment_mode,
        'Amount (₹)': p.amount,
        'Notes': p.notes || '',
      })),
      customers: customers.map((c: Customer) => ({
        'Name': c.name,
        'Mobile': c.mobile,
        'Address': c.address || '',
        'Total Purchases (₹)': c.total_purchases || 0,
        'Outstanding (₹)': c.outstanding_balance || 0,
        'Bills Count': c.bill_count || 0,
      })),
      withdrawals: withdrawals.map((w: any) => ({
        'Date': w.date,
        'Category': w.category,
        'Mode': w.payment_mode,
        'Amount (₹)': w.amount,
        'Remarks': w.remarks,
      })),
    });
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner with Quick Bill Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-950 via-slate-900 to-brand-950 rounded-2xl p-5 text-white shadow-elevation border border-slate-800">
        <div className="flex items-center gap-3.5">
          {settings.logo_url ? (
            <div className="w-12 h-12 rounded-xl bg-white p-1 flex items-center justify-center shadow-md overflow-hidden flex-shrink-0">
              <img
                src={settings.logo_url}
                alt={settings.shop_name}
                className="w-full h-full object-contain"
              />
            </div>
          ) : null}
          <div>
            <p className="text-xs font-mono text-brand-300 uppercase tracking-widest">Shop Owner Dashboard</p>
            <h2 className="text-xl font-extrabold text-white mt-0.5">{settings.shop_name}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{formatDate(new Date().toISOString())} — {settings.city}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="primary"
            size="lg"
            onClick={onOpenNewBill}
            leftIcon={<FilePlus2 className="w-5 h-5" />}
            className="bg-brand-500 hover:bg-brand-400 font-extrabold shadow-lg shadow-brand-600/40 text-sm"
          >
            + Create New Bill
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleWeeklyBackup}
            leftIcon={<Download className="w-4 h-4" />}
            className="bg-white/10 text-white border-white/20 hover:bg-white/20 text-xs font-semibold"
          >
            Weekly Excel Backup
          </Button>
        </div>
      </div>

      {/* 🏦 TOTAL BANK & NET FINANCIAL HEALTH SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Net Total Business Balance */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-5 shadow-elevation border border-slate-700/60 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-brand-300 uppercase tracking-wider flex items-center gap-1.5">
              <Wallet className="w-4 h-4 text-brand-400" /> Total Net Optical Funds
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              In Hand + Bank
            </span>
          </div>
          <p className="text-3xl font-extrabold font-mono text-white mt-2">
            {formatCurrency(metrics.net_business_balance || 0)}
          </p>
          <div className="mt-3 pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-1 text-emerald-400 font-semibold">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Earned: {formatCurrency(metrics.total_earned_lifetime || 0)}</span>
            </div>
            <div className="flex items-center gap-1 text-rose-400 font-semibold">
              <ArrowDownRight className="w-3.5 h-3.5" />
              <span>Out: {formatCurrency(metrics.total_withdrawn_lifetime || 0)}</span>
            </div>
          </div>
        </div>

        {/* Net Bank / UPI Balance */}
        <div className="bg-white rounded-2xl p-5 shadow-soft border border-slate-200 border-l-4 border-l-indigo-600 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 text-indigo-700">
                <Building2 className="w-4 h-4" /> Net Bank / UPI Balance
              </span>
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                Digital Bank
              </span>
            </div>
            <p className="text-2xl font-extrabold font-mono text-indigo-900 mt-2">
              {formatCurrency(metrics.net_bank_balance || 0)}
            </p>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            All UPI collections minus UPI online payments/expenses
          </p>
        </div>

        {/* Net Cash in Drawer */}
        <div className="bg-white rounded-2xl p-5 shadow-soft border border-slate-200 border-l-4 border-l-teal-600 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 text-teal-700">
                <Banknote className="w-4 h-4" /> Net Cash Drawer Balance
              </span>
              <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">
                Cash in Hand
              </span>
            </div>
            <p className="text-2xl font-extrabold font-mono text-teal-900 mt-2">
              {formatCurrency(metrics.net_cash_in_drawer || 0)}
            </p>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Total cash collected minus cash withdrawals/salaries
          </p>
        </div>
      </div>

      {/* Today's Daily Shift Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
        <Card className="border-l-4 border-l-brand-600">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Today's Sales</span>
          <p className="text-xl font-extrabold font-mono text-slate-900 mt-1">{formatCurrency(metrics.today_sales)}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">{metrics.today_bills_count} invoices</p>
        </Card>

        <Card className="border-l-4 border-l-emerald-600">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Today's Received</span>
          <p className="text-xl font-extrabold font-mono text-emerald-700 mt-1">{formatCurrency(metrics.today_payments)}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Cash + UPI</p>
        </Card>

        <Card className="border-l-4 border-l-teal-600">
          <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider flex items-center gap-1"><Banknote className="w-3.5 h-3.5" /> Cash (Today)</span>
          <p className="text-xl font-extrabold font-mono text-slate-900 mt-1">{formatCurrency(metrics.today_cash)}</p>
        </Card>

        <Card className="border-l-4 border-l-indigo-600">
          <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1"><QrCode className="w-3.5 h-3.5" /> UPI (Today)</span>
          <p className="text-xl font-extrabold font-mono text-slate-900 mt-1">{formatCurrency(metrics.today_upi)}</p>
        </Card>

        <Card className="border-l-4 border-l-rose-600">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Outstanding</span>
          <p className="text-xl font-extrabold font-mono text-rose-600 mt-1">{formatCurrency(metrics.total_outstanding)}</p>
          <button
            onClick={() => onNavigate('outstanding')}
            className="text-[10px] text-rose-500 hover:underline mt-0.5 font-semibold"
          >
            View all dues →
          </button>
        </Card>
      </div>

      {/* Quick-Action Shortcut Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: 'New Bill',
            icon: <FilePlus2 className="w-6 h-6 text-brand-600" />,
            onClick: onOpenNewBill,
            color: 'hover:border-brand-400 hover:bg-brand-50',
          },
          {
            label: 'Outstanding Dues',
            icon: <AlertCircle className="w-6 h-6 text-rose-600" />,
            onClick: () => onNavigate('outstanding'),
            color: 'hover:border-rose-400 hover:bg-rose-50',
          },
          {
            label: 'Daily Summary',
            icon: <TrendingUp className="w-6 h-6 text-emerald-600" />,
            onClick: () => onNavigate('daily_summary'),
            color: 'hover:border-emerald-400 hover:bg-emerald-50',
          },
          {
            label: 'Record Expense',
            icon: <ArrowDownCircle className="w-6 h-6 text-amber-600" />,
            onClick: () => onNavigate('withdrawals'),
            color: 'hover:border-amber-400 hover:bg-amber-50',
          },
        ].map((tile) => (
          <button
            key={tile.label}
            onClick={tile.onClick}
            className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 border-slate-200 bg-white text-center font-bold text-xs text-slate-700 transition-all duration-150 shadow-soft ${tile.color}`}
          >
            {tile.icon}
            <span>{tile.label}</span>
          </button>
        ))}
      </div>

      {/* Recent Bills — last 8 */}
      <Card className="p-0 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-brand-600" />
            <h3 className="text-sm font-extrabold text-slate-900">Recent Bills</h3>
          </div>
          <button
            onClick={() => onNavigate('ledger')}
            className="text-xs text-brand-600 font-bold hover:underline"
          >
            View all in Ledger →
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-100">
                <th className="p-3">Bill No.</th>
                <th className="p-3">Customer</th>
                <th className="p-3 hidden sm:table-cell">Date</th>
                <th className="p-3 text-right">Total (₹)</th>
                <th className="p-3 text-right">Remaining (₹)</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentBills.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-400">
                    No bills yet. Click <strong>"+ Create New Bill"</strong> to get started!
                  </td>
                </tr>
              ) : (
                recentBills.map((b: Bill) => (
                  <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-mono font-bold text-slate-900">{b.bill_number}</td>
                    <td className="p-3">
                      <p className="font-semibold text-slate-900">{b.customer_name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">+91 {b.customer_mobile}</p>
                    </td>
                    <td className="p-3 text-slate-600 hidden sm:table-cell">{formatDate(b.bill_date)}</td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900">{formatCurrency(b.total_amount)}</td>
                    <td className="p-3 text-right font-mono font-bold">
                      {b.remaining_amount > 0 ? (
                        <span className="text-rose-600">{formatCurrency(b.remaining_amount)}</span>
                      ) : (
                        <span className="text-emerald-600 text-[11px]">✓ Paid</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <StatusBadge status={b.payment_status} />
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onViewBill(b)}
                          className="px-2 py-0.5 text-[11px]"
                        >
                          View
                        </Button>
                        {b.remaining_amount > 0 && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => onCollectPayment(b)}
                            className="px-2 py-0.5 text-[11px] bg-emerald-600 hover:bg-emerald-700"
                          >
                            Pay
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
