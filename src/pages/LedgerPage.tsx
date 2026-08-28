import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { Bill } from '../types';
import { formatCurrency, formatDate, exportToCSV, exportToExcel } from '../lib/utils';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/Badge';
import {
  BookOpenText,
  Search,
  Download,
  Eye,
  CreditCard,
  Ban,
  ArrowUpDown,
} from 'lucide-react';

interface LedgerPageProps {
  onViewBill: (bill: Bill) => void;
  onCollectPayment: (bill: Bill) => void;
  onCancelBill: (bill: Bill) => void;
}

export const LedgerPage: React.FC<LedgerPageProps> = ({
  onViewBill,
  onCollectPayment,
  onCancelBill,
}) => {
  const { bills } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'PAID' | 'PARTIAL' | 'UNPAID' | 'CANCELLED'>('all');
  const [modeFilter, setModeFilter] = useState<'all' | 'CASH' | 'UPI' | 'SPLIT'>('all');
  const [dateFilter, setDateFilter] = useState('');
  const [sortField, setSortField] = useState<'bill_date' | 'total_amount' | 'remaining_amount'>('bill_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const filteredBills = bills.filter((b: Bill) => {
    const matchesSearch =
      b.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.bill_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.customer_mobile.includes(searchTerm.trim());

    const matchesStatus = statusFilter === 'all' || b.payment_status === statusFilter;
    const matchesMode = modeFilter === 'all' || b.payment_mode === modeFilter;
    const matchesDate = !dateFilter || b.bill_date === dateFilter;

    return matchesSearch && matchesStatus && matchesMode && matchesDate;
  });

  const sortedBills = [...filteredBills].sort((a: Bill, b: Bill) => {
    let valA = a[sortField];
    let valB = b[sortField];
    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // Financial Totals of Filtered Ledger
  const grandTotalSales = sortedBills.filter((b: Bill) => !b.is_cancelled).reduce((sum: number, b: Bill) => sum + b.total_amount, 0);
  const grandTotalCash = sortedBills.filter((b: Bill) => !b.is_cancelled).reduce((sum: number, b: Bill) => sum + b.cash_amount, 0);
  const grandTotalUpi = sortedBills.filter((b: Bill) => !b.is_cancelled).reduce((sum: number, b: Bill) => sum + b.upi_amount, 0);
  const grandTotalPaid = sortedBills.filter((b: Bill) => !b.is_cancelled).reduce((sum: number, b: Bill) => sum + b.total_paid, 0);
  const grandTotalRemaining = sortedBills.filter((b: Bill) => !b.is_cancelled).reduce((sum: number, b: Bill) => sum + b.remaining_amount, 0);

  const toggleSort = (field: 'bill_date' | 'total_amount' | 'remaining_amount') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleExportCSV = () => {
    const rows = sortedBills.map((b: Bill) => ({
      Date: b.bill_date,
      'Bill No': b.bill_number,
      Customer: b.customer_name,
      Mobile: b.customer_mobile,
      'Total (INR)': b.total_amount,
      'Advance (INR)': b.advance_amount,
      'Cash (INR)': b.cash_amount,
      'UPI (INR)': b.upi_amount,
      'Total Paid (INR)': b.total_paid,
      'Remaining (INR)': b.remaining_amount,
      Status: b.payment_status,
      Mode: b.payment_mode,
      Notes: b.notes || '',
    }));
    exportToCSV(`daily_ledger_${new Date().toISOString().split('T')[0]}`, rows);
  };

  const handleExportExcel = () => {
    const rows = sortedBills.map((b: Bill) => ({
      Date: b.bill_date,
      'Bill No': b.bill_number,
      Customer: b.customer_name,
      Mobile: b.customer_mobile,
      'Total (INR)': b.total_amount,
      'Advance (INR)': b.advance_amount,
      'Cash (INR)': b.cash_amount,
      'UPI (INR)': b.upi_amount,
      'Total Paid (INR)': b.total_paid,
      'Remaining (INR)': b.remaining_amount,
      Status: b.payment_status,
      Mode: b.payment_mode,
    }));
    exportToExcel(`daily_ledger_${new Date().toISOString().split('T')[0]}`, 'Ledger', rows);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <BookOpenText className="w-5 h-5 text-brand-600" />
            <span>Tally-Style Accounts Ledger</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Complete daily accounting register with split payments, advance receipts, and balances.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            leftIcon={<Download className="w-4 h-4" />}
            className="text-xs font-semibold"
          >
            CSV Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            leftIcon={<Download className="w-4 h-4" />}
            className="text-xs font-semibold"
          >
            Excel (.xlsx)
          </Button>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-soft">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            placeholder="Search by customer, bill no, mobile..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-1.5 text-xs rounded-lg border border-slate-300 bg-slate-50 focus:border-brand-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Status Filter */}
          <div className="flex items-center rounded-lg border border-slate-300 p-0.5 bg-slate-100">
            {(['all', 'PAID', 'PARTIAL', 'UNPAID', 'CANCELLED'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  statusFilter === st
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st === 'all' ? 'All' : st}
              </button>
            ))}
          </div>

          {/* Date Filter */}
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none"
          />
          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              className="text-xs text-slate-400 hover:text-slate-600 px-1"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Ledger Table (Tally Style) */}
      <Card className="overflow-hidden p-0 border border-slate-200 shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white font-bold tracking-wider text-[11px] uppercase border-b border-slate-800">
                <th
                  className="p-3 cursor-pointer hover:bg-slate-800"
                  onClick={() => toggleSort('bill_date')}
                >
                  <div className="flex items-center gap-1">
                    <span>Date</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="p-3">Bill No.</th>
                <th className="p-3">Customer Name</th>
                <th className="p-3">Mobile</th>
                <th
                  className="p-3 text-right cursor-pointer hover:bg-slate-800"
                  onClick={() => toggleSort('total_amount')}
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Total Bill (₹)</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="p-3 text-right">Advance (₹)</th>
                <th className="p-3 text-right">Cash (₹)</th>
                <th className="p-3 text-right">UPI (₹)</th>
                <th className="p-3 text-right">Total Paid (₹)</th>
                <th
                  className="p-3 text-right cursor-pointer hover:bg-slate-800"
                  onClick={() => toggleSort('remaining_amount')}
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Remaining (₹)</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {sortedBills.length === 0 ? (
                <tr>
                  <td colSpan={12} className="p-8 text-center text-slate-400">
                    No ledger records match the selected filters.
                  </td>
                </tr>
              ) : (
                sortedBills.map((b: Bill) => (
                  <tr
                    key={b.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      b.is_cancelled ? 'bg-slate-50/60 opacity-60' : ''
                    }`}
                  >
                    <td className="p-3 text-slate-700 whitespace-nowrap">
                      {formatDate(b.bill_date)}
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {b.bill_number}
                    </td>
                    <td className="p-3 font-semibold text-slate-900">{b.customer_name}</td>
                    <td className="p-3 font-mono text-slate-600 whitespace-nowrap">
                      +91 {b.customer_mobile}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(b.total_amount)}
                    </td>
                    <td className="p-3 text-right font-mono text-slate-600">
                      {formatCurrency(b.advance_amount)}
                    </td>
                    <td className="p-3 text-right font-mono text-teal-700 font-medium">
                      {formatCurrency(b.cash_amount)}
                    </td>
                    <td className="p-3 text-right font-mono text-indigo-700 font-medium">
                      {formatCurrency(b.upi_amount)}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-700">
                      {formatCurrency(b.total_paid)}
                    </td>
                    <td className="p-3 text-right font-mono font-bold">
                      {b.remaining_amount > 0 ? (
                        <span className="text-rose-600">
                          {formatCurrency(b.remaining_amount)}
                        </span>
                      ) : (
                        <span className="text-emerald-600 font-semibold">₹0</span>
                      )}
                    </td>
                    <td className="p-3 text-center whitespace-nowrap">
                      <StatusBadge status={b.payment_status} />
                    </td>
                    <td className="p-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onViewBill(b)}
                          className="px-2 py-0.5 text-xs"
                          title="View / Print Receipt"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        {!b.is_cancelled && b.remaining_amount > 0 && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => onCollectPayment(b)}
                            className="px-2 py-0.5 text-xs bg-emerald-600 hover:bg-emerald-700"
                            title="Collect Payment"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        {!b.is_cancelled && (
                          <button
                            onClick={() => onCancelBill(b)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600"
                            title="Cancel Bill"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {/* Tally Grand Total Summary Row */}
            <tfoot className="bg-slate-100/90 font-bold border-t-2 border-slate-300 text-xs">
              <tr>
                <td colSpan={4} className="p-3 text-slate-800 uppercase tracking-wider">
                  Grand Total ({sortedBills.filter((b: Bill) => !b.is_cancelled).length} active bills):
                </td>
                <td className="p-3 text-right font-mono font-extrabold text-slate-900">
                  {formatCurrency(grandTotalSales)}
                </td>
                <td className="p-3 text-right font-mono text-slate-700"></td>
                <td className="p-3 text-right font-mono text-teal-800">
                  {formatCurrency(grandTotalCash)}
                </td>
                <td className="p-3 text-right font-mono text-indigo-800">
                  {formatCurrency(grandTotalUpi)}
                </td>
                <td className="p-3 text-right font-mono font-extrabold text-emerald-800">
                  {formatCurrency(grandTotalPaid)}
                </td>
                <td className="p-3 text-right font-mono font-extrabold text-rose-700">
                  {formatCurrency(grandTotalRemaining)}
                </td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </div>
  );
};
