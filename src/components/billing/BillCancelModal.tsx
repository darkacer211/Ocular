import React, { useState } from 'react';
import { Bill } from '../../types';
import { useData } from '../../contexts/DataContext';
import { formatCurrency } from '../../lib/utils';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { AlertTriangle } from 'lucide-react';

interface BillCancelModalProps {
  bill: Bill | null;
  isOpen: boolean;
  onClose: () => void;
}

export const BillCancelModal: React.FC<BillCancelModalProps> = ({ bill, isOpen, onClose }) => {
  const { cancelBill } = useData();
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!bill) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setErrorMsg('Please specify a cancellation reason');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const success = await cancelBill(bill.id, reason.trim());
      if (success) {
        setReason('');
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to cancel bill');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cancel Bill / Invoice"
      subtitle={`Bill #${bill.bill_number} • ${bill.customer_name}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
          <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Non-Destructive Financial Audit Rule</p>
            <p className="text-rose-700 mt-0.5">
              Financial records are never erased. This invoice will be marked as{' '}
              <strong>CANCELLED</strong> in the audit log and customer ledger.
            </p>
          </div>
        </div>

        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs space-y-1">
          <div className="flex justify-between text-slate-600">
            <span>Bill Total:</span>
            <span className="font-mono font-bold text-slate-900">{formatCurrency(bill.total_amount)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Amount Collected:</span>
            <span className="font-mono font-semibold text-emerald-600">{formatCurrency(bill.total_paid)}</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
            Cancellation Reason *
          </label>
          <textarea
            required
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Customer cancelled order / Prescription changed / Wrong entry created in error"
            className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-900 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
          />
        </div>

        {errorMsg && <p className="text-xs font-semibold text-rose-600">{errorMsg}</p>}

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Keep Bill
          </Button>
          <Button type="submit" variant="danger" isLoading={isSubmitting}>
            Confirm Cancellation
          </Button>
        </div>
      </form>
    </Modal>
  );
};
