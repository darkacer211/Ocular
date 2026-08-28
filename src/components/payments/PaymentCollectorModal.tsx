import React, { useState } from 'react';
import { Bill } from '../../types';
import { useData } from '../../contexts/DataContext';
import { formatCurrency, getTodayDateString } from '../../lib/utils';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Banknote, QrCode, CreditCard } from 'lucide-react';

interface PaymentCollectorModalProps {
  bill: Bill | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PaymentCollectorModal: React.FC<PaymentCollectorModalProps> = ({
  bill,
  isOpen,
  onClose,
}) => {
  const { addPayment } = useData();
  const [amount, setAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'UPI'>('CASH');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Update initial amount to full remaining balance when modal opens
  React.useEffect(() => {
    if (bill) {
      setAmount(bill.remaining_amount);
      setErrorMsg('');
      setReferenceNumber('');
      setNotes('');
      setPaymentMode('CASH');
    }
  }, [bill]);

  if (!bill) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      setErrorMsg('Payment amount must be greater than ₹0');
      return;
    }
    if (amount > bill.remaining_amount) {
      setErrorMsg(`Payment cannot exceed outstanding balance of ${formatCurrency(bill.remaining_amount)}`);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await addPayment({
        bill_id: bill.id,
        bill_number: bill.bill_number,
        customer_id: bill.customer_id,
        customer_name: bill.customer_name,
        customer_mobile: bill.customer_mobile,
        payment_date: getTodayDateString(),
        amount: Number(amount),
        payment_mode: paymentMode,
        reference_number: referenceNumber.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to add payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Collect Payment"
      subtitle={`Bill #${bill.bill_number} • ${bill.customer_name}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Bill Balance Summary */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-1.5">
          <div className="flex justify-between text-slate-600">
            <span>Total Bill:</span>
            <span className="font-mono font-bold text-slate-900">{formatCurrency(bill.total_amount)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Already Paid:</span>
            <span className="font-mono font-semibold text-emerald-600">{formatCurrency(bill.total_paid)}</span>
          </div>
          <div className="flex justify-between text-slate-900 font-bold border-t border-slate-200 pt-1.5 text-sm">
            <span>Outstanding Balance:</span>
            <span className="font-mono text-rose-600">{formatCurrency(bill.remaining_amount)}</span>
          </div>
        </div>

        {/* Payment Mode Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
            Payment Mode *
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPaymentMode('CASH')}
              className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold border transition-all ${
                paymentMode === 'CASH'
                  ? 'bg-teal-600 text-white border-teal-600 shadow-md'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Banknote className="w-4 h-4" />
              <span>Cash Payment</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMode('UPI')}
              className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold border transition-all ${
                paymentMode === 'UPI'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>UPI (GPay/PhonePe)</span>
            </button>
          </div>
        </div>

        {/* Amount Input */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Amount to Collect (₹) *
            </label>
            <button
              type="button"
              onClick={() => setAmount(bill.remaining_amount)}
              className="text-xs text-brand-600 hover:underline font-semibold"
            >
              Set Full Balance ({formatCurrency(bill.remaining_amount)})
            </button>
          </div>
          <input
            type="number"
            min="1"
            max={bill.remaining_amount}
            step="1"
            required
            value={amount || ''}
            onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-base font-mono font-bold text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>

        {/* UPI Ref / Notes */}
        {paymentMode === 'UPI' && (
          <Input
            label="UPI Reference / Transaction ID (Optional)"
            placeholder="e.g. UPI/20260827/9842"
            value={referenceNumber}
            onChange={(e) => setReferenceNumber(e.target.value)}
          />
        )}

        <Input
          label="Payment Remarks / Notes (Optional)"
          placeholder="e.g. Received balance upon frame delivery"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        {errorMsg && <p className="text-xs font-semibold text-rose-600">{errorMsg}</p>}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            leftIcon={<CreditCard className="w-4 h-4" />}
          >
            Confirm & Save Payment
          </Button>
        </div>
      </form>
    </Modal>
  );
};
