import React, { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { useShopSettings } from '../contexts/ShopSettingsContext';
import { useToast } from '../contexts/ToastContext';
import {
  Bill,
  BillItem,
  PaymentMode,
  Customer,
} from '../types';
import {
  generateNextBillNumber,
  getTodayDateString,
  isValidIndianMobile,
  formatCurrency,
} from '../lib/utils';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { BillItemsTable } from '../components/billing/BillItemsTable';
import { SplitPaymentCalculator } from '../components/billing/SplitPaymentCalculator';
import { ReceiptModal } from '../components/receipt/ReceiptModal';
import { User, Phone, MapPin, Sparkles, Receipt, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';

interface BillingPageProps {
  initialCustomer?: Customer | null;
  onBillCreated?: (bill: Bill) => void;
}

export const BillingPage: React.FC<BillingPageProps> = ({
  initialCustomer,
  onBillCreated,
}) => {
  const { bills, customers, createBill } = useData();
  const { settings } = useShopSettings();
  const { warning } = useToast();

  // Customer State
  const [customerName, setCustomerName] = useState(initialCustomer?.name || '');
  const [customerMobile, setCustomerMobile] = useState(initialCustomer?.mobile || '');
  const [customerAddress, setCustomerAddress] = useState(initialCustomer?.address || '');
  const [matchedCustomer, setMatchedCustomer] = useState<Customer | null>(initialCustomer || null);

  // Bill Metadata
  const [billDate, setBillDate] = useState(getTodayDateString());
  const [billNumber, setBillNumber] = useState('');
  const [notes, setNotes] = useState('');

  // Line Items State
  const [items, setItems] = useState<BillItem[]>([
    {
      id: `item-${Date.now()}-1`,
      item_type: 'frame',
      product_name: 'Designer Optical Frame',
      brand: '',
      quantity: 1,
      unit_price: 2500,
      discount: 0,
      total_price: 2500,
    },
    {
      id: `item-${Date.now()}-2`,
      item_type: 'lens',
      product_name: 'Anti-Glare Blue Cut Lenses (Pair)',
      brand: 'Essilor',
      quantity: 1,
      unit_price: 1500,
      discount: 0,
      total_price: 1500,
    },
  ]);

  // Payment State
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('CASH');
  const [cashAmount, setCashAmount] = useState<number>(0);
  const [upiAmount, setUpiAmount] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Success Modal State
  const [createdBill, setCreatedBill] = useState<Bill | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  // Auto-generate Bill Number
  useEffect(() => {
    const nextBillNo = generateNextBillNumber(bills.length, settings.invoice_prefix || 'BILL');
    setBillNumber(nextBillNo);
  }, [bills.length, settings.invoice_prefix]);

  // Customer Auto-fill on mobile input
  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomerMobile(val);

    const found = customers.find((c: Customer) => c.mobile === val.trim());
    if (found) {
      setMatchedCustomer(found);
      setCustomerName(found.name);
      if (found.address) setCustomerAddress(found.address);
    } else {
      setMatchedCustomer(null);
    }
  };

  // Financial Calculations
  const subtotal = items.reduce((sum: number, item: BillItem) => sum + (item.quantity * item.unit_price), 0);
  const totalDiscount = items.reduce((sum: number, item: BillItem) => sum + item.discount, 0);
  const totalAmount = Math.max(0, subtotal - totalDiscount);

  let totalPaid = 0;
  if (paymentMode === 'CASH') {
    totalPaid = cashAmount;
  } else if (paymentMode === 'UPI') {
    totalPaid = upiAmount;
  } else {
    totalPaid = cashAmount + upiAmount;
  }

  const remainingAmount = Math.max(0, totalAmount - totalPaid);

  const handleResetForm = () => {
    setCustomerName('');
    setCustomerMobile('');
    setCustomerAddress('');
    setMatchedCustomer(null);
    setItems([
      {
        id: `item-${Date.now()}-1`,
        item_type: 'frame',
        product_name: 'Optical Frame',
        brand: '',
        quantity: 1,
        unit_price: 2000,
        discount: 0,
        total_price: 2000,
      },
    ]);
    setCashAmount(0);
    setUpiAmount(0);
    setNotes('');
    const nextBillNo = generateNextBillNumber(bills.length, settings.invoice_prefix || 'BILL');
    setBillNumber(nextBillNo);
  };

  const handleSaveBill = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!customerName.trim()) {
      warning('Customer Name Required', 'Please enter customer full name');
      return;
    }
    if (!isValidIndianMobile(customerMobile)) {
      warning('Invalid Mobile Number', 'Please enter a valid 10-digit Indian mobile number');
      return;
    }
    if (items.length === 0 || totalAmount <= 0) {
      warning('Empty Bill', 'Please add at least one bill item with a valid price');
      return;
    }
    if (totalPaid > totalAmount) {
      warning('Payment Error', 'Total payment received cannot exceed total bill amount');
      return;
    }

    setIsSubmitting(true);
    try {
      const paymentStatus = remainingAmount === 0 ? 'PAID' : totalPaid > 0 ? 'PARTIAL' : 'UNPAID';

      const newBill = await createBill({
        customer_id: matchedCustomer?.id || '',
        customer_name: customerName.trim(),
        customer_mobile: customerMobile.trim(),
        customer_address: customerAddress.trim() || undefined,
        bill_number: billNumber,
        bill_date: billDate,
        prescription: undefined,
        items,
        subtotal,
        discount_amount: totalDiscount,
        tax_amount: 0,
        total_amount: totalAmount,
        advance_amount: totalPaid,
        cash_amount: paymentMode === 'CASH' ? totalPaid : paymentMode === 'SPLIT' ? cashAmount : 0,
        upi_amount: paymentMode === 'UPI' ? totalPaid : paymentMode === 'SPLIT' ? upiAmount : 0,
        total_paid: totalPaid,
        remaining_amount: remainingAmount,
        payment_status: paymentStatus,
        payment_mode: paymentMode,
        notes: notes.trim() || undefined,
        is_cancelled: false,
      });

      // Confetti celebration
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}

      setCreatedBill(newBill);
      setShowReceipt(true);
      if (onBillCreated) onBillCreated(newBill);
      handleResetForm();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-brand-600" />
            <span>New Optical Bill</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Create an optical invoice with prescription, products, and split payments.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleResetForm}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Clear Form
          </Button>
          <div className="px-3 py-1.5 rounded-lg bg-slate-900 text-white font-mono text-xs font-bold shadow-sm">
            {billNumber}
          </div>
        </div>
      </div>

      <form onSubmit={handleSaveBill} className="space-y-6">
        {/* Customer Details */}
        <Card>
          <CardHeader className="flex items-center justify-between pb-3 mb-3">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-brand-600" />
              <CardTitle>1. Customer Details</CardTitle>
            </div>
            {matchedCustomer && (
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                ✓ Returning Customer ({matchedCustomer.bill_count} bills)
              </span>
            )}
          </CardHeader>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Customer Full Name"
              placeholder="e.g. Rahul Sharma"
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              leftIcon={<User className="w-4 h-4" />}
            />
            <Input
              label="10-Digit Mobile Number"
              placeholder="e.g. 9822011223"
              required
              maxLength={10}
              value={customerMobile}
              onChange={handleMobileChange}
              leftIcon={<Phone className="w-4 h-4" />}
              helperText={
                matchedCustomer
                  ? `Due: ${formatCurrency(matchedCustomer.outstanding_balance)}`
                  : undefined
              }
            />
            <Input
              label="Invoice Date"
              type="date"
              required
              value={billDate}
              onChange={(e) => setBillDate(e.target.value)}
            />
          </div>

          <div className="mt-3">
            <Input
              label="Customer Address (Optional)"
              placeholder="e.g. Flat 402, Shivam Enclave, Nanded"
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              leftIcon={<MapPin className="w-4 h-4" />}
            />
          </div>
        </Card>

        {/* Optical Items Table */}
        <Card>
          <BillItemsTable items={items} onChange={setItems} />
        </Card>

        {/* Split Payments & Advance Calculation Section */}
        <SplitPaymentCalculator
          totalAmount={totalAmount}
          paymentMode={paymentMode}
          cashAmount={cashAmount}
          upiAmount={upiAmount}
          onPaymentModeChange={setPaymentMode}
          onCashAmountChange={setCashAmount}
          onUpiAmountChange={setUpiAmount}
        />

        {/* Remarks */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
            Bill Remarks / Instructions (Optional)
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Delivery committed by Saturday. Special anti-scratch coating applied."
            className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>

        {/* Submit Action Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-white border border-slate-200 shadow-soft">
          <div>
            <span className="text-xs text-slate-500">Bill Total:</span>
            <p className="text-lg font-extrabold font-mono text-slate-900">
              {formatCurrency(totalAmount)}
            </p>
            <p className="text-[11px] text-slate-500">
              Paid: <strong className="text-emerald-600">{formatCurrency(totalPaid)}</strong> | Remaining:{' '}
              <strong className="text-rose-600">{formatCurrency(remainingAmount)}</strong>
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isSubmitting}
              leftIcon={<Sparkles className="w-5 h-5" />}
              className="w-full sm:w-auto font-bold shadow-lg shadow-brand-600/30"
            >
              Generate Bill & Print Receipt
            </Button>
          </div>
        </div>
      </form>

      {/* Generated Receipt Modal */}
      {createdBill && (
        <ReceiptModal
          bill={createdBill}
          isOpen={showReceipt}
          onClose={() => setShowReceipt(false)}
        />
      )}
    </div>
  );
};
