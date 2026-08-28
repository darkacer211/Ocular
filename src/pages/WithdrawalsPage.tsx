import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { CashWithdrawal, WithdrawalCategory } from '../types';
import { formatCurrency, formatDate, getTodayDateString, exportToCSV } from '../lib/utils';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import {
  ArrowDownCircle,
  Plus,
  Download,
  Trash2,
  Banknote,
  QrCode,
  Search,
} from 'lucide-react';

const CATEGORY_LABELS: Record<WithdrawalCategory, string> = {
  SALARY: '👤 Salary / Wages',
  PERSONAL: '🏠 Personal Use',
  SHOP_EXPENSE: '🛒 Shop Expense',
  RENT: '🏢 Rent',
  UTILITIES: '💡 Electricity / Utilities',
  PURCHASE: '📦 Stock Purchase',
  OTHER: '📝 Other',
};

const CATEGORY_COLORS: Record<WithdrawalCategory, string> = {
  SALARY: 'bg-blue-100 text-blue-800',
  PERSONAL: 'bg-purple-100 text-purple-800',
  SHOP_EXPENSE: 'bg-amber-100 text-amber-800',
  RENT: 'bg-slate-100 text-slate-800',
  UTILITIES: 'bg-yellow-100 text-yellow-800',
  PURCHASE: 'bg-green-100 text-green-800',
  OTHER: 'bg-rose-100 text-rose-800',
};

export const WithdrawalsPage: React.FC = () => {
  const { withdrawals, addWithdrawal, deleteWithdrawal } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | WithdrawalCategory>('all');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formDate, setFormDate] = useState(getTodayDateString());
  const [formAmount, setFormAmount] = useState('');
  const [formCategory, setFormCategory] = useState<WithdrawalCategory>('SALARY');
  const [formMode, setFormMode] = useState<'CASH' | 'UPI'>('CASH');
  const [formRemarks, setFormRemarks] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filtered = withdrawals.filter((w: CashWithdrawal) => {
    const matchSearch =
      w.remarks.toLowerCase().includes(searchTerm.toLowerCase()) ||
      CATEGORY_LABELS[w.category].toLowerCase().includes(searchTerm.toLowerCase());
    const matchDate = !dateFilter || w.date === dateFilter;
    const matchCat = categoryFilter === 'all' || w.category === categoryFilter;
    return matchSearch && matchDate && matchCat;
  });

  const totalWithdrawn = filtered.reduce((sum: number, w: CashWithdrawal) => sum + w.amount, 0);
  const totalCash = filtered.filter((w: CashWithdrawal) => w.payment_mode === 'CASH').reduce((s: number, w: CashWithdrawal) => s + w.amount, 0);
  const totalUpi = filtered.filter((w: CashWithdrawal) => w.payment_mode === 'UPI').reduce((s: number, w: CashWithdrawal) => s + w.amount, 0);

  const openModal = () => {
    setFormDate(getTodayDateString());
    setFormAmount('');
    setFormCategory('SALARY');
    setFormMode('CASH');
    setFormRemarks('');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(formAmount);
    if (!formAmount || isNaN(amount) || amount <= 0) {
      setFormError('Please enter a valid amount greater than 0');
      return;
    }
    if (!formRemarks.trim()) {
      setFormError('Please enter a remark for this withdrawal');
      return;
    }
    setIsSubmitting(true);
    try {
      await addWithdrawal({
        date: formDate,
        amount,
        category: formCategory,
        payment_mode: formMode,
        remarks: formRemarks.trim(),
      });
      setIsModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExport = () => {
    const rows = filtered.map((w: CashWithdrawal) => ({
      Date: w.date,
      Category: CATEGORY_LABELS[w.category],
      Mode: w.payment_mode,
      'Amount (INR)': w.amount,
      Remarks: w.remarks,
    }));
    exportToCSV(`withdrawals_${new Date().toISOString().split('T')[0]}`, rows);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <ArrowDownCircle className="w-5 h-5 text-rose-600" />
            <span>Cash Withdrawals & Expenses</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Track money taken out — salary, rent, personal use, stock purchases, and other shop expenses.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} leftIcon={<Download className="w-4 h-4" />} className="text-xs font-semibold">
            Export CSV
          </Button>
          <Button variant="primary" size="sm" onClick={openModal} leftIcon={<Plus className="w-4 h-4" />} className="font-bold">
            Record Withdrawal
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-rose-600">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Withdrawn (Filtered)</span>
          <p className="text-2xl font-extrabold font-mono text-rose-600 mt-1">{formatCurrency(totalWithdrawn)}</p>
          <p className="text-[11px] text-slate-400 mt-1">{filtered.length} entries</p>
        </Card>
        <Card className="border-l-4 border-l-teal-600">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1"><Banknote className="w-3.5 h-3.5 text-teal-600" /> Cash Out</span>
          <p className="text-2xl font-extrabold font-mono text-slate-900 mt-1">{formatCurrency(totalCash)}</p>
        </Card>
        <Card className="border-l-4 border-l-indigo-600">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1"><QrCode className="w-3.5 h-3.5 text-indigo-600" /> UPI Transferred Out</span>
          <p className="text-2xl font-extrabold font-mono text-slate-900 mt-1">{formatCurrency(totalUpi)}</p>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-soft">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            placeholder="Search by remarks or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-1.5 text-xs rounded-lg border border-slate-300 bg-slate-50 focus:border-brand-500 focus:outline-none"
          />
        </div>
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none"
        />
        {dateFilter && (
          <button onClick={() => setDateFilter('')} className="text-xs text-slate-400 hover:text-slate-700">Clear date</button>
        )}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as any)}
          className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none"
        >
          <option value="all">All Categories</option>
          {(Object.keys(CATEGORY_LABELS) as WithdrawalCategory[]).map(k => (
            <option key={k} value={k}>{CATEGORY_LABELS[k]}</option>
          ))}
        </select>
      </div>

      {/* Withdrawals Table */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/75 text-slate-700 font-semibold border-b border-slate-200">
                <th className="p-3.5">Date</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Mode</th>
                <th className="p-3.5 text-right">Amount (₹)</th>
                <th className="p-3.5">Remarks / Notes</th>
                <th className="p-3.5 text-center">Delete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No withdrawal records found. Click "Record Withdrawal" to start tracking expenses.
                  </td>
                </tr>
              ) : (
                filtered.map((w: CashWithdrawal) => (
                  <tr key={w.id} className="hover:bg-rose-50/20 transition-colors">
                    <td className="p-3.5 font-semibold text-slate-800">{formatDate(w.date)}</td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${CATEGORY_COLORS[w.category]}`}>
                        {CATEGORY_LABELS[w.category]}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${w.payment_mode === 'CASH' ? 'bg-teal-100 text-teal-800' : 'bg-indigo-100 text-indigo-800'}`}>
                        {w.payment_mode}
                      </span>
                    </td>
                    <td className="p-3.5 text-right font-mono font-extrabold text-rose-600">{formatCurrency(w.amount)}</td>
                    <td className="p-3.5 text-slate-700 max-w-xs truncate">{w.remarks}</td>
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => deleteWithdrawal(w.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Withdrawal Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Record Cash Withdrawal / Expense" maxWidth="sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Date" type="date" required value={formDate} onChange={(e) => setFormDate(e.target.value)} />
            <Input label="Amount (₹)" type="number" required min="1" placeholder="e.g. 5000" value={formAmount} onChange={(e) => setFormAmount(e.target.value)} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">Category</label>
            <select
              value={formCategory}
              onChange={(e) => setFormCategory(e.target.value as WithdrawalCategory)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-xs text-slate-900 focus:border-brand-500 focus:outline-none"
            >
              {(Object.keys(CATEGORY_LABELS) as WithdrawalCategory[]).map(k => (
                <option key={k} value={k}>{CATEGORY_LABELS[k]}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">Payment Mode</label>
            <div className="flex rounded-xl border border-slate-300 p-0.5 bg-slate-100">
              {(['CASH', 'UPI'] as const).map((m) => (
                <button key={m} type="button" onClick={() => setFormMode(m)}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${formMode === m ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
                  {m === 'CASH' ? '💵 Cash' : '📱 UPI'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">Remarks / Notes *</label>
            <textarea
              rows={2}
              required
              value={formRemarks}
              onChange={(e) => setFormRemarks(e.target.value)}
              placeholder="e.g. Monthly salary for Rahul, Electricity bill July, Personal petty cash"
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-brand-500 focus:outline-none"
            />
          </div>

          {formError && <p className="text-xs font-semibold text-rose-600">{formError}</p>}

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting} className="bg-rose-600 hover:bg-rose-700">
              Save Withdrawal
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
