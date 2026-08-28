import React from 'react';
import { PaymentMode } from '../../types';
import { formatCurrency } from '../../lib/utils';
import { Banknote, QrCode, Layers, AlertCircle, CheckCircle2 } from 'lucide-react';

interface SplitPaymentCalculatorProps {
  totalAmount: number;
  paymentMode: PaymentMode;
  cashAmount: number;
  upiAmount: number;
  onPaymentModeChange: (mode: PaymentMode) => void;
  onCashAmountChange: (amount: number) => void;
  onUpiAmountChange: (amount: number) => void;
}

export const SplitPaymentCalculator: React.FC<SplitPaymentCalculatorProps> = ({
  totalAmount,
  paymentMode,
  cashAmount,
  upiAmount,
  onPaymentModeChange,
  onCashAmountChange,
  onUpiAmountChange,
}) => {
  // Ensure safe numbers
  const safeTotal = Math.max(0, totalAmount);
  const safeCash = Math.max(0, cashAmount);
  const safeUpi = Math.max(0, upiAmount);

  let totalPaid = 0;
  if (paymentMode === 'CASH') {
    totalPaid = safeCash;
  } else if (paymentMode === 'UPI') {
    totalPaid = safeUpi;
  } else {
    totalPaid = safeCash + safeUpi;
  }

  const remaining = Math.max(0, safeTotal - totalPaid);
  const isOverpaid = totalPaid > safeTotal;

  const handleSelectMode = (mode: PaymentMode) => {
    onPaymentModeChange(mode);
    if (mode === 'CASH') {
      onUpiAmountChange(0);
      if (safeCash === 0 && safeTotal > 0) {
        onCashAmountChange(safeTotal);
      }
    } else if (mode === 'UPI') {
      onCashAmountChange(0);
      if (safeUpi === 0 && safeTotal > 0) {
        onUpiAmountChange(safeTotal);
      }
    }
  };

  const handleSetFullPayment = () => {
    if (paymentMode === 'CASH') {
      onCashAmountChange(safeTotal);
      onUpiAmountChange(0);
    } else if (paymentMode === 'UPI') {
      onUpiAmountChange(safeTotal);
      onCashAmountChange(0);
    } else {
      // 50/50 split or all cash
      onCashAmountChange(safeTotal);
      onUpiAmountChange(0);
    }
  };

  return (
    <div className="bg-slate-900 text-white rounded-xl p-5 shadow-elevation space-y-4 border border-slate-800">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <Layers className="w-4 h-4 text-brand-400" />
          <span>Payment Mode & Advance Calculation</span>
        </h4>
        <button
          type="button"
          onClick={handleSetFullPayment}
          className="text-xs text-brand-400 hover:text-brand-300 underline font-medium"
        >
          Pay Full Amount
        </button>
      </div>

      {/* Payment Mode Selector Tabs */}
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => handleSelectMode('CASH')}
          className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
            paymentMode === 'CASH'
              ? 'bg-teal-600 text-white shadow-md'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
        >
          <Banknote className="w-4 h-4" />
          <span>Cash Only</span>
        </button>

        <button
          type="button"
          onClick={() => handleSelectMode('UPI')}
          className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
            paymentMode === 'UPI'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>UPI (GPay/PhonePe)</span>
        </button>

        <button
          type="button"
          onClick={() => handleSelectMode('SPLIT')}
          className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
            paymentMode === 'SPLIT'
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Cash + UPI (Split)</span>
        </button>
      </div>

      {/* Inputs for Cash and/or UPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
        {(paymentMode === 'CASH' || paymentMode === 'SPLIT') && (
          <div>
            <label className="block text-[11px] font-semibold text-teal-300 mb-1.5 flex items-center gap-1.5">
              <Banknote className="w-3.5 h-3.5" />
              <span>Cash Advance (₹)</span>
            </label>
            <input
              type="number"
              min="0"
              max={safeTotal}
              step="1"
              placeholder="0"
              value={cashAmount === 0 ? '' : cashAmount}
              onChange={(e) => onCashAmountChange(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-800 border border-teal-500/40 rounded-lg px-3.5 py-2 text-sm text-white font-mono font-bold focus:border-teal-400 focus:outline-none focus:ring-1 focus:ring-teal-400"
            />
          </div>
        )}

        {(paymentMode === 'UPI' || paymentMode === 'SPLIT') && (
          <div>
            <label className="block text-[11px] font-semibold text-indigo-300 mb-1.5 flex items-center gap-1.5">
              <QrCode className="w-3.5 h-3.5" />
              <span>UPI Advance (₹)</span>
            </label>
            <input
              type="number"
              min="0"
              max={safeTotal}
              step="1"
              placeholder="0"
              value={upiAmount === 0 ? '' : upiAmount}
              onChange={(e) => onUpiAmountChange(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-800 border border-indigo-500/40 rounded-lg px-3.5 py-2 text-sm text-white font-mono font-bold focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
          </div>
        )}
      </div>

      {/* Summary Math Breakdown Box */}
      <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 text-xs space-y-2">
        <div className="flex justify-between text-slate-400 font-medium">
          <span>Total Bill Amount:</span>
          <span className="font-mono text-white font-bold">{formatCurrency(safeTotal)}</span>
        </div>

        {paymentMode === 'SPLIT' && (
          <>
            <div className="flex justify-between text-teal-400">
              <span>• Cash Received:</span>
              <span className="font-mono font-semibold">{formatCurrency(safeCash)}</span>
            </div>
            <div className="flex justify-between text-indigo-400">
              <span>• UPI Received:</span>
              <span className="font-mono font-semibold">{formatCurrency(safeUpi)}</span>
            </div>
          </>
        )}

        <div className="flex justify-between text-slate-300 border-t border-slate-800 pt-2 font-semibold">
          <span>Total Payment Received:</span>
          <span className="font-mono text-emerald-400 font-bold">{formatCurrency(totalPaid)}</span>
        </div>

        <div className="flex justify-between items-center border-t border-slate-800 pt-2">
          <span className="font-bold text-sm text-slate-200">Balance Remaining:</span>
          <span
            className={`font-mono text-base font-bold ${
              remaining === 0 ? 'text-emerald-400' : 'text-amber-400'
            }`}
          >
            {formatCurrency(remaining)}
          </span>
        </div>

        {/* Validation Warning */}
        {isOverpaid && (
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-950/90 text-rose-300 border border-rose-800 text-xs mt-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>
              Total payment ({formatCurrency(totalPaid)}) cannot exceed total bill amount (
              {formatCurrency(safeTotal)})!
            </span>
          </div>
        )}

        {remaining === 0 && safeTotal > 0 && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-950/60 text-emerald-300 border border-emerald-800 text-xs mt-1">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
            <span>Bill is fully paid. Remaining balance is ₹0.</span>
          </div>
        )}
      </div>
    </div>
  );
};
