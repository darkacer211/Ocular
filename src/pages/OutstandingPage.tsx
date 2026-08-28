import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { Bill } from '../types';
import { formatCurrency, formatDate, exportToCSV } from '../lib/utils';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/Badge';
import {
  AlertCircle,
  Search,
  Download,
  CreditCard,
  Eye,
  PhoneCall,
} from 'lucide-react';

interface OutstandingPageProps {
  onViewBill: (bill: Bill) => void;
  onCollectPayment: (bill: Bill) => void;
}

export const OutstandingPage: React.FC<OutstandingPageProps> = ({
  onViewBill,
  onCollectPayment,
}) => {
  const { bills } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [amountThreshold, setAmountThreshold] = useState<'all' | '1000' | '5000'>('all');
  const [customMin, setCustomMin] = useState<string>('');
  const [sortBy, setSortBy] = useState<'highest' | 'oldest' | 'newest'>('highest');

  // Filter bills that have remaining amount > 0 and are not cancelled
  const outstandingBills = bills.filter((b: Bill) => !b.is_cancelled && b.remaining_amount > 0);

  const filteredBills = outstandingBills.filter((b: Bill) => {
    const matchesSearch =
      b.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.bill_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.customer_mobile.includes(searchTerm.trim());

    let matchesThreshold = true;
    if (customMin && !isNaN(Number(customMin))) {
      matchesThreshold = b.remaining_amount >= Number(customMin);
    } else if (amountThreshold === '1000') {
      matchesThreshold = b.remaining_amount >= 1000;
    } else if (amountThreshold === '5000') {
      matchesThreshold = b.remaining_amount >= 5000;
    }

    return matchesSearch && matchesThreshold;
  });

  const sortedBills = [...filteredBills].sort((a: Bill, b: Bill) => {
    if (sortBy === 'highest') {
      return b.remaining_amount - a.remaining_amount;
    } else if (sortBy === 'oldest') {
      return a.bill_date.localeCompare(b.bill_date);
    } else {
      return b.bill_date.localeCompare(a.bill_date);
    }
  });

  const totalOutstandingSum = filteredBills.reduce((sum: number, b: Bill) => sum + b.remaining_amount, 0);

  const handleExportCSV = () => {
    const rows = sortedBills.map((b: Bill) => ({
      Customer: b.customer_name,
      Mobile: b.customer_mobile,
      'Bill Number': b.bill_number,
      'Bill Date': b.bill_date,
      'Total Bill (INR)': b.total_amount,
      'Paid (INR)': b.total_paid,
      'Outstanding (INR)': b.remaining_amount,
      Status: b.payment_status,
    }));
    exportToCSV(`outstanding_dues_${new Date().toISOString().split('T')[0]}`, rows);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600" />
            <span>Outstanding Payments Tracker</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor customer pending dues, aging debts, and collect outstanding balances.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCSV}
          leftIcon={<Download className="w-4 h-4" />}
          className="text-xs font-semibold"
        >
          Export Outstanding (CSV)
        </Button>
      </div>

      {/* Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-rose-600 bg-rose-50/20">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Total Outstanding (Filtered)
          </span>
          <p className="text-2xl font-extrabold font-mono text-rose-600 mt-1">
            {formatCurrency(totalOutstandingSum)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">{filteredBills.length} pending bills</p>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Bills Over ₹1,000
          </span>
          <p className="text-2xl font-extrabold font-mono text-amber-600 mt-1">
            {outstandingBills.filter((b: Bill) => b.remaining_amount >= 1000).length}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Moderate dues</p>
        </Card>

        <Card className="border-l-4 border-l-red-700">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Major Dues (Over ₹5,000)
          </span>
          <p className="text-2xl font-extrabold font-mono text-red-700 mt-1">
            {outstandingBills.filter((b: Bill) => b.remaining_amount >= 5000).length}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">High priority recovery</p>
        </Card>
      </div>

      {/* Filter and Sort Toolbar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-soft">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            placeholder="Search by customer name, mobile, bill no..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-1.5 text-xs rounded-lg border border-slate-300 bg-slate-50 focus:border-brand-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Threshold Filters */}
          <div className="flex items-center rounded-lg border border-slate-300 p-0.5 bg-slate-100">
            <button
              onClick={() => {
                setAmountThreshold('all');
                setCustomMin('');
              }}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                amountThreshold === 'all' && !customMin
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600'
              }`}
            >
              All Dues
            </button>
            <button
              onClick={() => {
                setAmountThreshold('1000');
                setCustomMin('');
              }}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                amountThreshold === '1000' && !customMin
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600'
              }`}
            >
              &gt; ₹1,000
            </button>
            <button
              onClick={() => {
                setAmountThreshold('5000');
                setCustomMin('');
              }}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                amountThreshold === '5000' && !customMin
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600'
              }`}
            >
              &gt; ₹5,000
            </button>
          </div>

          {/* Custom Min Input */}
          <input
            type="number"
            placeholder="Min ₹..."
            value={customMin}
            onChange={(e) => {
              setCustomMin(e.target.value);
              setAmountThreshold('all');
            }}
            className="w-20 px-2 py-1 border border-slate-300 rounded-lg text-xs font-mono"
          />

          {/* Sort Selector */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 text-xs font-medium focus:outline-none"
          >
            <option value="highest">Highest Outstanding First</option>
            <option value="oldest">Oldest Bill First (Aging)</option>
            <option value="newest">Newest Bill First</option>
          </select>
        </div>
      </div>

      {/* Outstanding Table */}
      <Card className="overflow-hidden p-0 border border-slate-200 shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/75 text-slate-700 font-semibold border-b border-slate-200">
                <th className="p-3.5">Customer Name</th>
                <th className="p-3.5">Mobile</th>
                <th className="p-3.5">Bill Number</th>
                <th className="p-3.5">Bill Date</th>
                <th className="p-3.5 text-right">Total Bill (₹)</th>
                <th className="p-3.5 text-right">Paid (₹)</th>
                <th className="p-3.5 text-right">Remaining Due (₹)</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedBills.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    🎉 No outstanding bills found matching criteria!
                  </td>
                </tr>
              ) : (
                sortedBills.map((b: Bill) => (
                  <tr key={b.id} className="hover:bg-rose-50/30 transition-colors">
                    <td className="p-3.5">
                      <p className="font-bold text-slate-900">{b.customer_name}</p>
                      {b.customer_address && (
                        <p className="text-[11px] text-slate-400 truncate max-w-[160px]">
                          {b.customer_address}
                        </p>
                      )}
                    </td>
                    <td className="p-3.5 font-mono text-slate-700 whitespace-nowrap">
                      <a
                        href={`tel:${b.customer_mobile}`}
                        className="hover:underline text-brand-600 font-semibold flex items-center gap-1"
                      >
                        <PhoneCall className="w-3 h-3" />
                        +91 {b.customer_mobile}
                      </a>
                    </td>
                    <td className="p-3.5 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {b.bill_number}
                    </td>
                    <td className="p-3.5 text-slate-600 whitespace-nowrap">
                      {formatDate(b.bill_date)}
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(b.total_amount)}
                    </td>
                    <td className="p-3.5 text-right font-mono font-semibold text-emerald-600">
                      {formatCurrency(b.total_paid)}
                    </td>
                    <td className="p-3.5 text-right font-mono font-extrabold text-rose-600 text-sm">
                      {formatCurrency(b.remaining_amount)}
                    </td>
                    <td className="p-3.5 text-center whitespace-nowrap">
                      <StatusBadge status={b.payment_status} />
                    </td>
                    <td className="p-3.5 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onViewBill(b)}
                          className="px-2.5 py-1 text-xs"
                          title="View Bill"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => onCollectPayment(b)}
                          leftIcon={<CreditCard className="w-3.5 h-3.5" />}
                          className="px-3 py-1 text-xs bg-emerald-600 hover:bg-emerald-700 font-bold"
                        >
                          Collect
                        </Button>
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
