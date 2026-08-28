import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useShopSettings } from '../contexts/ShopSettingsContext';
import { formatCurrency, formatDate, getTodayDateString, exportToCSV } from '../lib/utils';
import { Bill, Payment } from '../types';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ModeBadge, StatusBadge } from '../components/ui/Badge';
import {
  CalendarCheck,
  Banknote,
  QrCode,
  Download,
  FileText,
  CreditCard,
  Printer,
} from 'lucide-react';

export const DailySummaryPage: React.FC = () => {
  const { bills, payments } = useData();
  const { settings } = useShopSettings();
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());

  // Filter bills & payments for the selected date
  const dayBills = bills.filter((b: Bill) => !b.is_cancelled && b.bill_date === selectedDate);
  const dayPayments = payments.filter((p: Payment) => p.payment_date === selectedDate);

  const totalSales = dayBills.reduce((sum: number, b: Bill) => sum + b.total_amount, 0);
  const totalReceived = dayPayments.reduce((sum: number, p: Payment) => sum + p.amount, 0);
  const cashCollected = dayPayments
    .filter((p: Payment) => p.payment_mode === 'CASH')
    .reduce((sum: number, p: Payment) => sum + p.amount, 0);
  const upiCollected = dayPayments
    .filter((p: Payment) => p.payment_mode === 'UPI')
    .reduce((sum: number, p: Payment) => sum + p.amount, 0);

  const newOutstandingGenerated = dayBills.reduce((sum: number, b: Bill) => sum + b.remaining_amount, 0);

  // Recovered from previous bills
  const recoveredOutstanding = dayPayments
    .filter((p: Payment) => {
      const bill = bills.find((b: Bill) => b.id === p.bill_id);
      return bill && bill.bill_date !== selectedDate;
    })
    .reduce((sum: number, p: Payment) => sum + p.amount, 0);

  const handleExportSummaryCSV = () => {
    const summaryData = [
      { Metric: 'Report Date', Value: selectedDate },
      { Metric: 'Total Sales', Value: totalSales },
      { Metric: 'Total Payments Received', Value: totalReceived },
      { Metric: 'Cash Collected', Value: cashCollected },
      { Metric: 'UPI Collected', Value: upiCollected },
      { Metric: 'Total Bills Count', Value: dayBills.length },
      { Metric: 'Outstanding Generated', Value: newOutstandingGenerated },
      { Metric: 'Outstanding Recovered from Past Bills', Value: recoveredOutstanding },
    ];
    exportToCSV(`daily_summary_${selectedDate}`, summaryData);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-brand-600" />
            <span>Daily Cash & UPI Accounts Summary</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Day-end cash drawer closure and UPI ledger reconciliation report.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportSummaryCSV}
            leftIcon={<Download className="w-4 h-4" />}
            className="text-xs font-semibold"
          >
            Export Day Summary
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => window.print()}
            leftIcon={<Printer className="w-4 h-4" />}
            className="text-xs font-semibold no-print"
          >
            Print Sheet
          </Button>
        </div>
      </div>

      {/* Date Selection Card */}
      <Card className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 text-white border-slate-800">
        <div>
          <span className="text-[11px] font-mono text-brand-400 uppercase tracking-widest">
            Summary for Date
          </span>
          <h3 className="text-xl font-extrabold text-white mt-0.5">
            {formatDate(selectedDate, 'EEEE, dd MMMM yyyy')}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">{settings.shop_name}</p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-medium text-white focus:outline-none focus:border-brand-500"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedDate(getTodayDateString())}
            className="bg-white/10 text-white border-white/20 hover:bg-white/20 text-xs"
          >
            Today
          </Button>
        </div>
      </Card>

      {/* Accounts Register Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales */}
        <Card className="border-l-4 border-l-brand-600">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Total Sales
          </span>
          <p className="text-2xl font-extrabold font-mono text-slate-900 mt-1">
            {formatCurrency(totalSales)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">{dayBills.length} invoices generated</p>
        </Card>

        {/* Total Payments Collected */}
        <Card className="border-l-4 border-l-emerald-600">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Total Payments Received
          </span>
          <p className="text-2xl font-extrabold font-mono text-emerald-700 mt-1">
            {formatCurrency(totalReceived)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">{dayPayments.length} transactions</p>
        </Card>

        {/* Cash Collected */}
        <Card className="border-l-4 border-l-teal-600">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 flex items-center gap-1">
              <Banknote className="w-4 h-4" /> Cash Drawer
            </span>
          </div>
          <p className="text-2xl font-extrabold font-mono text-slate-900 mt-1">
            {formatCurrency(cashCollected)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Cash in hand today</p>
        </Card>

        {/* UPI Collected */}
        <Card className="border-l-4 border-l-indigo-600">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1">
              <QrCode className="w-4 h-4" /> UPI Settlements
            </span>
          </div>
          <p className="text-2xl font-extrabold font-mono text-slate-900 mt-1">
            {formatCurrency(upiCollected)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Bank credit today</p>
        </Card>
      </div>

      {/* Outstanding Flow on Selected Date */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-l-4 border-l-amber-500">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            New Outstanding Generated Today
          </span>
          <p className="text-xl font-extrabold font-mono text-amber-600 mt-1">
            {formatCurrency(newOutstandingGenerated)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Credit extended on today's new bills
          </p>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Outstanding Recovered From Past Bills
          </span>
          <p className="text-xl font-extrabold font-mono text-emerald-600 mt-1">
            {formatCurrency(recoveredOutstanding)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Old debts collected during today's shift
          </p>
        </Card>
      </div>

      {/* Two Detailed Tables: Day's Bills & Day's Payment Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bills Generated on this date */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-brand-600" />
              <CardTitle>Invoices on {formatDate(selectedDate)} ({dayBills.length})</CardTitle>
            </div>
          </CardHeader>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-100">
                  <th className="p-2.5">Bill No.</th>
                  <th className="p-2.5">Customer</th>
                  <th className="p-2.5 text-right">Total (₹)</th>
                  <th className="p-2.5 text-right">Paid (₹)</th>
                  <th className="p-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dayBills.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-slate-400">
                      No invoices recorded for this date.
                    </td>
                  </tr>
                ) : (
                  dayBills.map((b: Bill) => (
                    <tr key={b.id} className="hover:bg-slate-50">
                      <td className="p-2.5 font-mono font-bold text-slate-900">{b.bill_number}</td>
                      <td className="p-2.5">
                        <p className="font-semibold text-slate-900">{b.customer_name}</p>
                        <p className="text-[10px] text-slate-400">+91 {b.customer_mobile}</p>
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(b.total_amount)}
                      </td>
                      <td className="p-2.5 text-right font-mono text-emerald-600 font-bold">
                        {formatCurrency(b.total_paid)}
                      </td>
                      <td className="p-2.5 text-center">
                        <StatusBadge status={b.payment_status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Payments Collected on this date */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <CardTitle>Cash/UPI Collections ({dayPayments.length})</CardTitle>
            </div>
          </CardHeader>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-100">
                  <th className="p-2.5">Bill No.</th>
                  <th className="p-2.5">Customer</th>
                  <th className="p-2.5">Mode</th>
                  <th className="p-2.5 text-right">Amount (₹)</th>
                  <th className="p-2.5">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dayPayments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-slate-400">
                      No payments received on this date.
                    </td>
                  </tr>
                ) : (
                  dayPayments.map((p: Payment) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="p-2.5 font-mono font-bold text-slate-900">{p.bill_number}</td>
                      <td className="p-2.5 font-medium text-slate-800">{p.customer_name}</td>
                      <td className="p-2.5">
                        <ModeBadge mode={p.payment_mode} />
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-emerald-700">
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="p-2.5 text-slate-500 text-[11px] truncate max-w-[120px]">
                        {p.reference_number || p.notes || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};
