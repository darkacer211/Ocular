import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { Bill, Payment } from '../types';
import { formatCurrency, formatDate, exportToCSV, exportToExcel } from '../lib/utils';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ModeBadge } from '../components/ui/Badge';
import {
  BarChart3,
  Download,
  Printer,
  FileSpreadsheet,
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { bills, payments } = useData();
  const [activeReportTab, setActiveReportTab] = useState<'daily' | 'monthly' | 'payments' | 'outstanding'>('daily');

  // 1. Daily Aggregations
  const activeBills = bills.filter((b: Bill) => !b.is_cancelled);
  const dates = Array.from(new Set(activeBills.map((b: Bill) => b.bill_date))).sort().reverse();

  const dailyReportData = dates.map((d: string) => {
    const dayBills = activeBills.filter((b: Bill) => b.bill_date === d);
    const dayPayments = payments.filter((p: Payment) => p.payment_date === d);
    const sales = dayBills.reduce((sum: number, b: Bill) => sum + b.total_amount, 0);
    const cash = dayPayments.filter((p: Payment) => p.payment_mode === 'CASH').reduce((sum: number, p: Payment) => sum + p.amount, 0);
    const upi = dayPayments.filter((p: Payment) => p.payment_mode === 'UPI').reduce((sum: number, p: Payment) => sum + p.amount, 0);
    const remaining = dayBills.reduce((sum: number, b: Bill) => sum + b.remaining_amount, 0);

    return {
      date: d,
      billCount: dayBills.length,
      totalSales: sales,
      cashReceived: cash,
      upiReceived: upi,
      totalReceived: cash + upi,
      outstanding: remaining,
    };
  });

  // 2. Monthly Aggregations
  const months = Array.from(new Set(activeBills.map((b: Bill) => b.bill_date.substring(0, 7)))).sort().reverse();
  const monthlyReportData = months.map((m: string) => {
    const monthBills = activeBills.filter((b: Bill) => b.bill_date.startsWith(m));
    const monthPayments = payments.filter((p: Payment) => p.payment_date.startsWith(m));
    const sales = monthBills.reduce((sum: number, b: Bill) => sum + b.total_amount, 0);
    const cash = monthPayments.filter((p: Payment) => p.payment_mode === 'CASH').reduce((sum: number, p: Payment) => sum + p.amount, 0);
    const upi = monthPayments.filter((p: Payment) => p.payment_mode === 'UPI').reduce((sum: number, p: Payment) => sum + p.amount, 0);
    const remaining = monthBills.reduce((sum: number, b: Bill) => sum + b.remaining_amount, 0);

    return {
      month: m,
      billCount: monthBills.length,
      totalSales: sales,
      cashReceived: cash,
      upiReceived: upi,
      totalReceived: cash + upi,
      outstanding: remaining,
    };
  });

  // 3. Outstanding Report
  const outstandingReportData = activeBills
    .filter((b: Bill) => b.remaining_amount > 0)
    .sort((a: Bill, b: Bill) => b.remaining_amount - a.remaining_amount);

  const handleExportCSV = () => {
    if (activeReportTab === 'daily') {
      const rows = dailyReportData.map((r) => ({
        Date: r.date,
        'Bills Count': r.billCount,
        'Total Sales (INR)': r.totalSales,
        'Cash Collected (INR)': r.cashReceived,
        'UPI Collected (INR)': r.upiReceived,
        'Total Received (INR)': r.totalReceived,
        'Outstanding Generated (INR)': r.outstanding,
      }));
      exportToCSV('daily_sales_report', rows);
    } else if (activeReportTab === 'monthly') {
      const rows = monthlyReportData.map((r) => ({
        Month: r.month,
        'Bills Count': r.billCount,
        'Total Sales (INR)': r.totalSales,
        'Cash Collected (INR)': r.cashReceived,
        'UPI Collected (INR)': r.upiReceived,
        'Total Received (INR)': r.totalReceived,
        'Outstanding (INR)': r.outstanding,
      }));
      exportToCSV('monthly_sales_report', rows);
    } else if (activeReportTab === 'payments') {
      const rows = payments.map((p: Payment) => ({
        Date: p.payment_date,
        'Bill No': p.bill_number,
        Customer: p.customer_name,
        Mobile: p.customer_mobile,
        Mode: p.payment_mode,
        'Amount (INR)': p.amount,
        Notes: p.notes || '',
      }));
      exportToCSV('payments_report', rows);
    } else {
      const rows = outstandingReportData.map((b: Bill) => ({
        Customer: b.customer_name,
        Mobile: b.customer_mobile,
        'Bill No': b.bill_number,
        'Bill Date': b.bill_date,
        'Total (INR)': b.total_amount,
        'Paid (INR)': b.total_paid,
        'Outstanding Due (INR)': b.remaining_amount,
      }));
      exportToCSV('outstanding_dues_report', rows);
    }
  };

  const handleExportExcel = () => {
    if (activeReportTab === 'daily') {
      exportToExcel('daily_sales_report', 'Daily Sales', dailyReportData);
    } else if (activeReportTab === 'monthly') {
      exportToExcel('monthly_sales_report', 'Monthly Sales', monthlyReportData);
    } else if (activeReportTab === 'payments') {
      exportToExcel('payments_report', 'Payments', payments);
    } else {
      exportToExcel('outstanding_dues_report', 'Outstanding', outstandingReportData);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-brand-600" />
            <span>Business Reports & Financial Analytics</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Detailed sales reports, monthly registers, payment logs, and outstanding debt summaries.
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
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            leftIcon={<FileSpreadsheet className="w-4 h-4" />}
            className="text-xs font-semibold"
          >
            Export Excel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => window.print()}
            leftIcon={<Printer className="w-4 h-4" />}
            className="text-xs font-semibold no-print"
          >
            Print Report
          </Button>
        </div>
      </div>

      {/* Report Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveReportTab('daily')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
            activeReportTab === 'daily'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Daily Sales Report
        </button>
        <button
          onClick={() => setActiveReportTab('monthly')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
            activeReportTab === 'monthly'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Monthly Sales Report
        </button>
        <button
          onClick={() => setActiveReportTab('payments')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
            activeReportTab === 'payments'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Payment Collections Report
        </button>
        <button
          onClick={() => setActiveReportTab('outstanding')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
            activeReportTab === 'outstanding'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Outstanding Debtors Report
        </button>
      </div>

      {/* REPORT CONTENT TABLES */}

      {/* 1. Daily Sales Report */}
      {activeReportTab === 'daily' && (
        <Card className="p-0 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">Daily Sales & Collections Summary</h3>
            <p className="text-xs text-slate-500">Day-by-day sales, cash, UPI and pending balances</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/80 text-slate-700 font-semibold border-b border-slate-200">
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5 text-center">Bills Count</th>
                  <th className="p-3.5 text-right">Total Sales (₹)</th>
                  <th className="p-3.5 text-right">Cash Received (₹)</th>
                  <th className="p-3.5 text-right">UPI Received (₹)</th>
                  <th className="p-3.5 text-right">Total Collected (₹)</th>
                  <th className="p-3.5 text-right">Outstanding (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dailyReportData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      No daily records found.
                    </td>
                  </tr>
                ) : (
                  dailyReportData.map((row) => (
                    <tr key={row.date} className="hover:bg-slate-50">
                      <td className="p-3.5 font-semibold text-slate-900">{formatDate(row.date)}</td>
                      <td className="p-3.5 text-center font-mono font-bold text-slate-700">
                        {row.billCount}
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(row.totalSales)}
                      </td>
                      <td className="p-3.5 text-right font-mono text-teal-700 font-semibold">
                        {formatCurrency(row.cashReceived)}
                      </td>
                      <td className="p-3.5 text-right font-mono text-indigo-700 font-semibold">
                        {formatCurrency(row.upiReceived)}
                      </td>
                      <td className="p-3.5 text-right font-mono text-emerald-700 font-bold">
                        {formatCurrency(row.totalReceived)}
                      </td>
                      <td className="p-3.5 text-right font-mono text-rose-600 font-bold">
                        {row.outstanding > 0 ? formatCurrency(row.outstanding) : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* 2. Monthly Sales Report */}
      {activeReportTab === 'monthly' && (
        <Card className="p-0 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">Monthly Sales & Collections Register</h3>
            <p className="text-xs text-slate-500">Monthly business totals and tax turnover</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/80 text-slate-700 font-semibold border-b border-slate-200">
                  <th className="p-3.5">Month</th>
                  <th className="p-3.5 text-center">Invoices</th>
                  <th className="p-3.5 text-right">Total Sales (₹)</th>
                  <th className="p-3.5 text-right">Cash Received (₹)</th>
                  <th className="p-3.5 text-right">UPI Received (₹)</th>
                  <th className="p-3.5 text-right">Total Received (₹)</th>
                  <th className="p-3.5 text-right">Outstanding (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {monthlyReportData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      No monthly records found.
                    </td>
                  </tr>
                ) : (
                  monthlyReportData.map((row) => (
                    <tr key={row.month} className="hover:bg-slate-50">
                      <td className="p-3.5 font-bold text-slate-900">{row.month}</td>
                      <td className="p-3.5 text-center font-mono font-bold">{row.billCount}</td>
                      <td className="p-3.5 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(row.totalSales)}
                      </td>
                      <td className="p-3.5 text-right font-mono text-teal-700 font-semibold">
                        {formatCurrency(row.cashReceived)}
                      </td>
                      <td className="p-3.5 text-right font-mono text-indigo-700 font-semibold">
                        {formatCurrency(row.upiReceived)}
                      </td>
                      <td className="p-3.5 text-right font-mono text-emerald-700 font-bold">
                        {formatCurrency(row.totalReceived)}
                      </td>
                      <td className="p-3.5 text-right font-mono text-rose-600 font-bold">
                        {row.outstanding > 0 ? formatCurrency(row.outstanding) : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* 3. Payment Collections Report */}
      {activeReportTab === 'payments' && (
        <Card className="p-0 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">All Payment Transactions Log</h3>
            <p className="text-xs text-slate-500">Every installment and advance collected</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/80 text-slate-700 font-semibold border-b border-slate-200">
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Customer</th>
                  <th className="p-3.5">Bill Number</th>
                  <th className="p-3.5">Mode</th>
                  <th className="p-3.5 text-right">Amount (₹)</th>
                  <th className="p-3.5">Reference / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p: Payment) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="p-3.5">{formatDate(p.payment_date)}</td>
                    <td className="p-3.5 font-bold text-slate-900">{p.customer_name}</td>
                    <td className="p-3.5 font-mono text-slate-700">{p.bill_number}</td>
                    <td className="p-3.5">
                      <ModeBadge mode={p.payment_mode} />
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-emerald-700">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="p-3.5 text-slate-500">{p.reference_number || p.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* 4. Outstanding Debtors Report */}
      {activeReportTab === 'outstanding' && (
        <Card className="p-0 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">Pending Debtors Statement</h3>
            <p className="text-xs text-slate-500">All unrecovered balances across customer accounts</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/80 text-slate-700 font-semibold border-b border-slate-200">
                  <th className="p-3.5">Customer Name</th>
                  <th className="p-3.5">Mobile</th>
                  <th className="p-3.5">Bill No.</th>
                  <th className="p-3.5">Bill Date</th>
                  <th className="p-3.5 text-right">Total Bill (₹)</th>
                  <th className="p-3.5 text-right">Paid (₹)</th>
                  <th className="p-3.5 text-right">Remaining Due (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {outstandingReportData.map((b: Bill) => (
                  <tr key={b.id} className="hover:bg-slate-50">
                    <td className="p-3.5 font-bold text-slate-900">{b.customer_name}</td>
                    <td className="p-3.5 font-mono text-slate-600">+91 {b.customer_mobile}</td>
                    <td className="p-3.5 font-mono text-slate-700">{b.bill_number}</td>
                    <td className="p-3.5 text-slate-600">{formatDate(b.bill_date)}</td>
                    <td className="p-3.5 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(b.total_amount)}
                    </td>
                    <td className="p-3.5 text-right font-mono text-emerald-600 font-semibold">
                      {formatCurrency(b.total_paid)}
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-rose-600">
                      {formatCurrency(b.remaining_amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};
