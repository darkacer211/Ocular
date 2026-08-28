import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { Customer, Bill, Payment } from '../types';
import { formatCurrency, formatDate } from '../lib/utils';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { StatusBadge, ModeBadge } from '../components/ui/Badge';
import {
  Users,
  Search,
  Plus,
  User,
  Phone,
  MapPin,
  FileText,
  CreditCard,
  Eye,
  PlusCircle,
  ArrowLeft,
} from 'lucide-react';

interface CustomersPageProps {
  selectedCustomer: Customer | null;
  onSelectCustomer: (customer: Customer | null) => void;
  onOpenNewBillForCustomer: (customer: Customer) => void;
  onViewBill: (bill: Bill) => void;
  onCollectPayment: (bill: Bill) => void;
}

export const CustomersPage: React.FC<CustomersPageProps> = ({
  selectedCustomer,
  onSelectCustomer,
  onOpenNewBillForCustomer,
  onViewBill,
  onCollectPayment,
}) => {
  const { customers, bills, payments, saveCustomer } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formMobile, setFormMobile] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredCustomers = customers.filter(
    (c: Customer) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.mobile.includes(searchTerm.trim()) ||
      (c.city && c.city.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleOpenAddModal = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormName(customer.name);
      setFormMobile(customer.mobile);
      setFormAddress(customer.address || '');
      setFormNotes(customer.notes || '');
    } else {
      setEditingCustomer(null);
      setFormName('');
      setFormMobile('');
      setFormAddress('');
      setFormNotes('');
    }
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleSaveCustomerForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Customer name is required');
      return;
    }
    if (formMobile.trim().length !== 10) {
      setFormError('Please provide a 10-digit mobile number');
      return;
    }

    setIsSubmitting(true);
    try {
      const saved = await saveCustomer({
        id: editingCustomer?.id,
        name: formName.trim(),
        mobile: formMobile.trim(),
        address: formAddress.trim() || undefined,
        notes: formNotes.trim() || undefined,
      });

      if (selectedCustomer && selectedCustomer.id === saved.id) {
        onSelectCustomer(saved);
      }
      setIsAddModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- DRILLDOWN CUSTOMER LEDGER VIEW ---
  if (selectedCustomer) {
    const customerBills = bills.filter((b: Bill) => b.customer_id === selectedCustomer.id);
    const customerPayments = payments.filter((p: Payment) => p.customer_id === selectedCustomer.id);

    return (
      <div className="space-y-6">
        {/* Back navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSelectCustomer(null)}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Back to Customers
            </Button>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <span>{selectedCustomer.name}</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-slate-100 text-slate-700">
                  +91 {selectedCustomer.mobile}
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Individual Customer Account Ledger & History
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenAddModal(selectedCustomer)}
            >
              Edit Details
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => onOpenNewBillForCustomer(selectedCustomer)}
              leftIcon={<PlusCircle className="w-4 h-4" />}
            >
              + Create Bill
            </Button>
          </div>
        </div>

        {/* Customer Snapshot Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Purchases
            </span>
            <p className="text-xl font-extrabold font-mono text-slate-900 mt-1">
              {formatCurrency(selectedCustomer.total_purchases)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">{selectedCustomer.bill_count} invoices</p>
          </Card>

          <Card>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Paid
            </span>
            <p className="text-xl font-extrabold font-mono text-emerald-600 mt-1">
              {formatCurrency(selectedCustomer.total_paid)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">{customerPayments.length} transactions</p>
          </Card>

          <Card className="border-l-4 border-l-rose-500">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Outstanding Due
            </span>
            <p className="text-xl font-extrabold font-mono text-rose-600 mt-1">
              {formatCurrency(selectedCustomer.outstanding_balance)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              {(selectedCustomer.outstanding_balance || 0) === 0 ? 'Fully Cleared' : 'Pending Payment'}
            </p>
          </Card>

          <Card>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Last Visit
            </span>
            <p className="text-base font-bold text-slate-800 mt-1">
              {formatDate(selectedCustomer.last_purchase_date)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1 truncate">
              {selectedCustomer.address || 'No address logged'}
            </p>
          </Card>
        </div>

        {/* Two Tables: Bills History & Payment History */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bills Issued */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-600" />
                <CardTitle>Invoices / Bills ({customerBills.length})</CardTitle>
              </div>
            </CardHeader>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-100">
                    <th className="p-2.5">Bill No.</th>
                    <th className="p-2.5">Date</th>
                    <th className="p-2.5 text-right">Total</th>
                    <th className="p-2.5 text-right">Remaining</th>
                    <th className="p-2.5 text-center">Status</th>
                    <th className="p-2.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customerBills.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-slate-400">
                        No bills on record for this customer.
                      </td>
                    </tr>
                  ) : (
                    customerBills.map((b: Bill) => (
                      <tr key={b.id} className="hover:bg-slate-50">
                        <td className="p-2.5 font-mono font-bold text-slate-900">{b.bill_number}</td>
                        <td className="p-2.5 text-slate-600">{formatDate(b.bill_date)}</td>
                        <td className="p-2.5 text-right font-mono font-semibold">
                          {formatCurrency(b.total_amount)}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-rose-600">
                          {b.remaining_amount > 0 ? formatCurrency(b.remaining_amount) : '-'}
                        </td>
                        <td className="p-2.5 text-center">
                          <StatusBadge status={b.payment_status} />
                        </td>
                        <td className="p-2.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onViewBill(b)}
                              className="px-2 py-0.5 text-[11px]"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                            {b.remaining_amount > 0 && (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => onCollectPayment(b)}
                                className="px-2 py-0.5 text-[11px] bg-emerald-600 hover:bg-emerald-700"
                              >
                                Pay
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Payment Receipts History */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <CardTitle>Payments Received ({customerPayments.length})</CardTitle>
              </div>
            </CardHeader>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-100">
                    <th className="p-2.5">Date</th>
                    <th className="p-2.5">Bill No.</th>
                    <th className="p-2.5">Mode</th>
                    <th className="p-2.5 text-right">Amount (₹)</th>
                    <th className="p-2.5">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customerPayments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-slate-400">
                        No payments recorded yet.
                      </td>
                    </tr>
                  ) : (
                    customerPayments.map((p: Payment) => (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="p-2.5 text-slate-600">{formatDate(p.payment_date)}</td>
                        <td className="p-2.5 font-mono font-semibold text-slate-900">
                          {p.bill_number}
                        </td>
                        <td className="p-2.5">
                          <ModeBadge mode={p.payment_mode} />
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-emerald-600">
                          {formatCurrency(p.amount)}
                        </td>
                        <td className="p-2.5 text-slate-500 truncate max-w-[120px]">
                          {p.notes || p.reference_number || '-'}
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
  }

  // --- MAIN CUSTOMER DIRECTORY TABLE ---
  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-600" />
            <span>Customer Management & Ledgers</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Directory of all registered customers with purchase histories and outstanding balances.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => handleOpenAddModal()}
          leftIcon={<Plus className="w-4 h-4" />}
          className="font-bold"
        >
          Add New Customer
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Search by customer name, 10-digit mobile, or city..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:border-brand-500 focus:outline-none"
        />
      </div>

      {/* Customer Directory Table */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/75 text-slate-700 font-semibold border-b border-slate-200">
                <th className="p-3.5">Customer Name</th>
                <th className="p-3.5">Mobile Number</th>
                <th className="p-3.5">City / Address</th>
                <th className="p-3.5 text-center">Bills</th>
                <th className="p-3.5 text-right">Total Purchases</th>
                <th className="p-3.5 text-right">Total Paid</th>
                <th className="p-3.5 text-right">Outstanding</th>
                <th className="p-3.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    No customers found matching "{searchTerm}"
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust: Customer) => (
                  <tr
                    key={cust.id}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    onClick={() => onSelectCustomer(cust)}
                  >
                    <td className="p-3.5">
                      <p className="font-bold text-slate-900 text-sm hover:text-brand-600">
                        {cust.name}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Since {formatDate(cust.created_at)}
                      </p>
                    </td>
                    <td className="p-3.5 font-mono font-medium text-slate-700">
                      +91 {cust.mobile}
                    </td>
                    <td className="p-3.5 text-slate-600 truncate max-w-[180px]">
                      {cust.address || cust.city || '-'}
                    </td>
                    <td className="p-3.5 text-center font-mono font-bold text-slate-800">
                      {cust.bill_count || 0}
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(cust.total_purchases)}
                    </td>
                    <td className="p-3.5 text-right font-mono font-semibold text-emerald-600">
                      {formatCurrency(cust.total_paid)}
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold">
                      {(cust.outstanding_balance || 0) > 0 ? (
                        <span className="text-rose-600">
                          {formatCurrency(cust.outstanding_balance)}
                        </span>
                      ) : (
                        <span className="text-emerald-600 text-[11px]">₹0 (Paid)</span>
                      )}
                    </td>
                    <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onSelectCustomer(cust)}
                          className="px-2.5 py-1 text-xs"
                        >
                          View Ledger
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => onOpenNewBillForCustomer(cust)}
                          className="px-2.5 py-1 text-xs"
                        >
                          + Bill
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

      {/* Add / Edit Customer Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={editingCustomer ? 'Edit Customer Details' : 'Add New Customer'}
        maxWidth="md"
      >
        <form onSubmit={handleSaveCustomerForm} className="space-y-4">
          <Input
            label="Customer Full Name"
            placeholder="e.g. Rahul Sharma"
            required
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            leftIcon={<User className="w-4 h-4" />}
          />
          <Input
            label="10-Digit Mobile Number"
            placeholder="e.g. 9822011223"
            required
            maxLength={10}
            value={formMobile}
            onChange={(e) => setFormMobile(e.target.value)}
            leftIcon={<Phone className="w-4 h-4" />}
          />
          <Input
            label="Address / Area"
            placeholder="e.g. Shivaji Nagar, Nanded"
            value={formAddress}
            onChange={(e) => setFormAddress(e.target.value)}
            leftIcon={<MapPin className="w-4 h-4" />}
          />
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
              Customer Notes / Preferences
            </label>
            <textarea
              rows={2}
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="e.g. Prefers progressive lenses, titanium frames"
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-brand-500 focus:outline-none"
            />
          </div>

          {formError && <p className="text-xs font-semibold text-rose-600">{formError}</p>}

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              {editingCustomer ? 'Update Customer' : 'Save Customer'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
