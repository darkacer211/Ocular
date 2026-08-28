import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { Payment, Bill } from '../types';
import { formatCurrency, formatDate, exportToCSV } from '../lib/utils';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ModeBadge } from '../components/ui/Badge';
import {
  CreditCard,
  Banknote,
  QrCode,
  Search,
  Download,
  Eye,
} from 'lucide-react';

interface PaymentsPageProps {
  onViewBill: (bill: Bill) => void;
}

export const PaymentsPage: React.FC<PaymentsPageProps> = ({ onViewBill }) => {
  const { payments, bills } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [modeFilter, setModeFilter] = useState<'all' | 'CASH' | 'UPI'>('all');
  const [dateFilter, setDateFilter] = useState('');

  const filteredPayments = payments.filter((p: Payment) => {
    const matchesSearch =
      p.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.bill_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.customer_mobile.includes(searchTerm.trim()) ||
      (p.reference_number && p.reference_number.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesMode = modeFilter === 'all' || p.payment_mode === modeFilter;
    const matchesDate = !dateFilter || p.payment_date === dateFilter;

    return matchesSearch && matchesMode && matchesDate;
  });

  const totalCollected = filteredPayments.reduce((sum: number, p: Payment) => sum + p.amount, 0);
  const totalCash = filteredPayments
    .filter((p: Payment) => p.payment_mode === 'CASH')
    .reduce((sum: number, p: Payment) => sum + p.amount, 0);
  const totalUpi = filteredPayments
    .filter((p: Payment) => p.payment_mode === 'UPI')
    .reduce((sum: number, p: Payment) => sum + p.amount, 0);

  const handleExportCSV = () => {
    const rows = filteredPayments.map((p: Payment) => ({
      'Payment ID': p.id,
      Date: p.payment_date,
      'Bill Number': p.bill_number,
      Customer: p.customer_name,
      Mobile: p.customer_mobile,
      Mode: p.payment_mode,
      'Amount (INR)': p.amount,
      'UPI Ref / Notes': p.reference_number || p.notes || '',
    }));
    exportToCSV(`payments_report_${new Date().toISOString().split('T')[0]}`, rows);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-600" />
            <span>Payment Tracking Log</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Log of all Cash and UPI payments received across initial advances and installments.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCSV}
          leftIcon={<Download className="w-4 h-4" />}
          className="font-semibold text-xs"
        >
          Export Payments (CSV)
        </Button>
      </div>

      {/* Summary Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-emerald-600">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Total Received (Filtered)
          </span>
          <p className="text-2xl font-extrabold font-mono text-emerald-700 mt-1">
            {formatCurrency(totalCollected)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">{filteredPayments.length} entries</p>
        </Card>

        <Card className="border-l-4 border-l-teal-600">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 text-teal-700">
              <Banknote className="w-4 h-4" /> Cash Received
            </span>
          </div>
          <p className="text-2xl font-extrabold font-mono text-slate-900 mt-1">
            {formatCurrency(totalCash)}
          </p>
        </Card>

        <Card className="border-l-4 border-l-indigo-600">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 text-indigo-700">
              <QrCode className="w-4 h-4" /> UPI Received
            </span>
          </div>
          <p className="text-2xl font-extrabold font-mono text-slate-900 mt-1">
            {formatCurrency(totalUpi)}
          </p>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-soft">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            placeholder="Search by customer, bill no, mobile, txn id..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-1.5 text-xs rounded-lg border border-slate-300 bg-slate-50 focus:border-brand-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          {/* Mode Selector */}
          <div className="flex items-center rounded-lg border border-slate-300 p-0.5 bg-slate-100 text-xs">
            {(['all', 'CASH', 'UPI'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setModeFilter(m)}
                className={`px-3 py-1 rounded-md font-semibold transition-all ${
                  modeFilter === m
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {m === 'all' ? 'All Modes' : m}
              </button>
            ))}
          </div>

          {/* Date Picker Filter */}
          <div className="flex items-center gap-1">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none"
            />
            {dateFilter && (
              <button
                onClick={() => setDateFilter('')}
                className="text-xs text-slate-400 hover:text-slate-600 p-1"
                title="Clear date"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/75 text-slate-700 font-semibold border-b border-slate-200">
                <th className="p-3.5">Date</th>
                <th className="p-3.5">Bill Number</th>
                <th className="p-3.5">Customer</th>
                <th className="p-3.5">Payment Mode</th>
                <th className="p-3.5 text-right">Amount (₹)</th>
                <th className="p-3.5">Reference / Notes</th>
                <th className="p-3.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No payment records found.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((pay: Payment) => {
                  const bill = bills.find((b: Bill) => b.id === pay.bill_id);
                  return (
                    <tr key={pay.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 text-slate-700 font-medium">
                        {formatDate(pay.payment_date)}
                      </td>
                      <td className="p-3.5 font-mono font-bold text-slate-900">
                        {pay.bill_number}
                      </td>
                      <td className="p-3.5">
                        <p className="font-bold text-slate-900">{pay.customer_name}</p>
                        <p className="text-[11px] text-slate-500 font-mono">+91 {pay.customer_mobile}</p>
                      </td>
                      <td className="p-3.5">
                        <ModeBadge mode={pay.payment_mode} />
                      </td>
                      <td className="p-3.5 text-right font-mono font-extrabold text-emerald-700 text-sm">
                        {formatCurrency(pay.amount)}
                      </td>
                      <td className="p-3.5 text-slate-600 text-[11px]">
                        {pay.reference_number && (
                          <span className="block font-mono text-slate-500">
                            Ref: {pay.reference_number}
                          </span>
                        )}
                        {pay.notes && <span className="block text-slate-600">{pay.notes}</span>}
                        {!pay.reference_number && !pay.notes && '-'}
                      </td>
                      <td className="p-3.5 text-center">
                        {bill && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onViewBill(bill)}
                            className="px-2.5 py-1 text-xs"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            View Bill
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
