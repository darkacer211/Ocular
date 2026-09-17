import React, { useRef, useState } from 'react';
import { Bill } from '../../types';
import { useShopSettings } from '../../contexts/ShopSettingsContext';
import { useData } from '../../contexts/DataContext';
import { formatCurrency, formatDate } from '../../lib/utils';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { StatusBadge, ModeBadge } from '../ui/Badge';
import { Printer, Download, Glasses, CheckCircle, QrCode, Trash2, AlertTriangle } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ReceiptModalProps {
  bill: Bill | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ bill, isOpen, onClose }) => {
  const { settings } = useShopSettings();
  const { deleteBill } = useData();
  const printRef = useRef<HTMLDivElement>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!bill) return null;

  const handleDeleteBill = async () => {
    setIsDeleting(true);
    const ok = await deleteBill(bill.id);
    setIsDeleting(false);
    if (ok) {
      setShowDeleteConfirm(false);
      onClose();
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();

    // Store Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(11, 25, 44);
    doc.text(settings.shop_name.toUpperCase(), 14, 20);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(settings.tagline, 14, 26);
    doc.text(`${settings.address}, ${settings.city}, ${settings.state} - ${settings.pincode}`, 14, 31);
    doc.text(`Phone: ${settings.phone_number} | GSTIN: ${settings.gst_number || 'N/A'}`, 14, 36);

    doc.setDrawColor(226, 232, 240);
    doc.line(14, 40, 196, 40);

    // Bill & Customer Metadata
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE / RECEIPT', 14, 48);

    doc.setFont('helvetica', 'normal');
    doc.text(`Bill Number: ${bill.bill_number}`, 14, 55);
    doc.text(`Bill Date: ${formatDate(bill.bill_date)}`, 14, 61);
    doc.text(`Status: ${bill.payment_status}`, 14, 67);

    doc.text(`Customer Name: ${bill.customer_name}`, 120, 55);
    doc.text(bill.customer_mobile ? `Mobile: +91 ${bill.customer_mobile}` : 'Mobile: N/A', 120, 61);
    if (bill.customer_address) {
      doc.text(`Address: ${bill.customer_address}`, 120, 67);
    }

    let startY = 74;

    // Optical Prescription if present
    if (bill.prescription) {
      const p = bill.prescription;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('PRESCRIPTION DETAILS', 14, startY);

      autoTable(doc, {
        startY: startY + 2,
        head: [['Eye', 'SPH', 'CYL', 'AXIS', 'ADD']],
        body: [
          ['OD (Right)', p.sphere_od || '-', p.cylinder_od || '-', p.axis_od || '-', p.add_od || '-'],
          ['OS (Left)', p.sphere_os || '-', p.cylinder_os || '-', p.axis_os || '-', p.add_os || '-'],
        ],
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42], textColor: 255, fontSize: 8 },
        styles: { fontSize: 8, cellPadding: 2 },
        margin: { left: 14, right: 14 },
      });

      startY = (doc as any).lastAutoTable.finalY + 8;
    }

    // Bill Items Table
    const billItems = bill.items && bill.items.length > 0 ? bill.items : [
      {
        id: 'default-1',
        item_type: 'general',
        product_name: 'Optical Goods / Services',
        brand: '',
        quantity: 1,
        unit_price: bill.total_amount,
        discount: bill.discount_amount || 0,
        total_price: bill.total_amount,
      }
    ];

    const tableRows = billItems.map((item, index) => [
      index + 1,
      `${item.product_name} ${item.brand ? `(${item.brand})` : ''}`,
      (item.item_type || 'item').toUpperCase(),
      item.quantity,
      `₹${item.unit_price}`,
      `₹${item.discount}`,
      `₹${item.total_price}`,
    ]);

    autoTable(doc, {
      startY: startY,
      head: [['#', 'Description', 'Type', 'Qty', 'Rate', 'Disc', 'Total']],
      body: tableRows,
      theme: 'striped',
      headStyles: { fillColor: [2, 112, 199], textColor: 255, fontSize: 8 },
      styles: { fontSize: 8, cellPadding: 2.5 },
      margin: { left: 14, right: 14 },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 6;

    // Financial Summary
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Subtotal: ₹${bill.subtotal}`, 130, finalY);
    if (bill.discount_amount > 0) {
      doc.text(`Discount: ₹${bill.discount_amount}`, 130, finalY + 5);
    }
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Amount: ₹${bill.total_amount}`, 130, finalY + 11);
    doc.text(`Total Paid: ₹${bill.total_paid}`, 130, finalY + 17);
    doc.setTextColor(bill.remaining_amount > 0 ? 190 : 16, bill.remaining_amount > 0 ? 18 : 185, bill.remaining_amount > 0 ? 60 : 129);
    doc.text(`Remaining Due: ₹${bill.remaining_amount}`, 130, finalY + 23);

    // Terms & Footer
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(settings.receipt_footer_text, 14, finalY + 32);

    doc.save(`${bill.bill_number}_${bill.customer_name.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Receipt #${bill.bill_number}`} maxWidth="4xl">
      {/* Top Action Bar */}
      <div className="no-print space-y-3 pb-4 mb-4 border-b border-slate-200">
        {/* Row 1: Status badges + Print/Download */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <StatusBadge status={bill.payment_status} />
            <ModeBadge mode={bill.payment_mode} />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadPDF}
              leftIcon={<Download className="w-4 h-4" />}
            >
              <span className="hidden sm:inline">Download PDF</span>
              <span className="sm:hidden">PDF</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handlePrint}
              leftIcon={<Printer className="w-4 h-4" />}
            >
              <span className="hidden sm:inline">Print Receipt</span>
              <span className="sm:hidden">Print</span>
            </Button>
          </div>
        </div>

        {/* Row 2: Delete Bill — always on its own row, always visible */}
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors text-xs font-bold"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete This Bill Permanently</span>
          </button>
        ) : (
          <div className="w-full flex flex-wrap items-center justify-between gap-2 bg-rose-50 border border-rose-300 rounded-xl px-4 py-3">
            <div className="flex items-center gap-2 text-rose-700">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span className="text-xs font-bold">This will permanently delete Bill #{bill.bill_number} and all its payments. Cannot be undone!</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
              >
                No, Keep It
              </button>
              <button
                onClick={handleDeleteBill}
                disabled={isDeleting}
                className="px-4 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors disabled:opacity-60"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete Forever'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Printable Receipt Paper Container */}
      <div
        ref={printRef}
        className="print-receipt-container bg-white rounded-xl border border-slate-200 p-6 sm:p-8 space-y-6 text-slate-800"
      >
        {/* Store Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-200 pb-5 gap-4">
          <div className="flex items-center gap-3.5">
            {settings.logo_url ? (
              <div className="w-14 h-14 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center shadow-sm flex-shrink-0">
                <img
                  src={settings.logo_url}
                  alt={settings.shop_name}
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-md flex-shrink-0">
                <Glasses className="w-7 h-7 text-brand-400" />
              </div>
            )}
            <div>
              <h2 className="text-xl font-extrabold tracking-tight text-slate-900 uppercase">
                {settings.shop_name}
              </h2>
              <p className="text-xs text-brand-600 font-medium">{settings.tagline}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {settings.address}, {settings.city}, {settings.state} - {settings.pincode}
              </p>
              <p className="text-xs text-slate-500 font-mono">
                Phone: {settings.phone_number} {settings.gst_number ? `| GSTIN: ${settings.gst_number}` : ''}
              </p>
            </div>
          </div>
          <div className="sm:text-right">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400">
              TAX INVOICE
            </span>
            <p className="text-lg font-extrabold font-mono text-slate-900">{bill.bill_number}</p>
            <p className="text-xs text-slate-500">Date: {formatDate(bill.bill_date)}</p>
          </div>
        </div>

        {/* Customer Information Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 rounded-xl p-4 border border-slate-200/80 text-xs">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Billed To
            </span>
            <p className="text-sm font-bold text-slate-900 mt-0.5">{bill.customer_name}</p>
            {bill.customer_mobile ? (
              <p className="text-slate-600 font-mono mt-0.5">+91 {bill.customer_mobile}</p>
            ) : (
              <p className="text-slate-400 text-[11px] mt-0.5 italic">No mobile provided</p>
            )}
            {bill.customer_address && <p className="text-slate-500 mt-0.5">{bill.customer_address}</p>}
          </div>
          <div className="sm:text-right flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Payment Mode
              </span>
              <p className="text-xs font-bold text-slate-800 mt-0.5">{bill.payment_mode}</p>
            </div>
            {bill.prescription?.doctor_name && (
              <p className="text-[11px] text-slate-500 mt-2">
                Dr. Ref: <span className="font-semibold">{bill.prescription.doctor_name}</span>
              </p>
            )}
          </div>
        </div>

        {/* Prescription Box if available */}
        {bill.prescription && (
          <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50">
            <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-2">
              Optical Prescription
            </h5>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-center border-collapse">
                <thead>
                  <tr className="bg-slate-200/70 text-slate-700 font-semibold text-[11px]">
                    <th className="p-1.5 text-left">Eye</th>
                    <th className="p-1.5">SPH</th>
                    <th className="p-1.5">CYL</th>
                    <th className="p-1.5">AXIS</th>
                    <th className="p-1.5">ADD</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono text-xs">
                  <tr>
                    <td className="p-1.5 font-bold text-left text-brand-700">OD (Right Eye)</td>
                    <td className="p-1.5">{bill.prescription.sphere_od || '-'}</td>
                    <td className="p-1.5">{bill.prescription.cylinder_od || '-'}</td>
                    <td className="p-1.5">{bill.prescription.axis_od ? `${bill.prescription.axis_od}°` : '-'}</td>
                    <td className="p-1.5">{bill.prescription.add_od || '-'}</td>
                  </tr>
                  <tr>
                    <td className="p-1.5 font-bold text-left text-sky-700">OS (Left Eye)</td>
                    <td className="p-1.5">{bill.prescription.sphere_os || '-'}</td>
                    <td className="p-1.5">{bill.prescription.cylinder_os || '-'}</td>
                    <td className="p-1.5">{bill.prescription.axis_os ? `${bill.prescription.axis_os}°` : '-'}</td>
                    <td className="p-1.5">{bill.prescription.add_os || '-'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            {bill.prescription.pd && (
              <p className="text-[11px] text-slate-600 mt-2 font-mono">
                PD: <span className="font-bold">{bill.prescription.pd} mm</span>
              </p>
            )}
          </div>
        )}

        {/* Itemized Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-300 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-2">#</th>
                <th className="py-2.5 px-2">Description</th>
                <th className="py-2.5 px-2">Type</th>
                <th className="py-2.5 px-2 text-center">Qty</th>
                <th className="py-2.5 px-2 text-right">Price</th>
                <th className="py-2.5 px-2 text-right">Discount</th>
                <th className="py-2.5 px-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(bill.items && bill.items.length > 0) ? (
                bill.items.map((item, index) => (
                  <tr key={item.id || index} className="text-slate-800">
                    <td className="py-2.5 px-2 font-mono text-slate-400">{index + 1}</td>
                    <td className="py-2.5 px-2">
                      <p className="font-semibold text-slate-900">{item.product_name}</p>
                      {item.brand && <p className="text-[11px] text-slate-500">Brand: {item.brand}</p>}
                    </td>
                    <td className="py-2.5 px-2 uppercase text-[10px] font-bold text-slate-500">
                      {item.item_type || 'item'}
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono">{item.quantity}</td>
                    <td className="py-2.5 px-2 text-right font-mono">{formatCurrency(item.unit_price)}</td>
                    <td className="py-2.5 px-2 text-right font-mono text-slate-500">
                      {item.discount > 0 ? formatCurrency(item.discount) : '-'}
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(item.total_price)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="text-slate-800">
                  <td className="py-2.5 px-2 font-mono text-slate-400">1</td>
                  <td className="py-2.5 px-2">
                    <p className="font-semibold text-slate-900">Optical Products / Services</p>
                  </td>
                  <td className="py-2.5 px-2 uppercase text-[10px] font-bold text-slate-500">GENERAL</td>
                  <td className="py-2.5 px-2 text-center font-mono">1</td>
                  <td className="py-2.5 px-2 text-right font-mono">{formatCurrency(bill.total_amount)}</td>
                  <td className="py-2.5 px-2 text-right font-mono text-slate-500">-</td>
                  <td className="py-2.5 px-2 text-right font-mono font-bold text-slate-900">{formatCurrency(bill.total_amount)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Financial Summary & Split Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 border-t border-slate-200">
          <div className="space-y-2 text-xs text-slate-600">
            {settings.enable_upi_qr && settings.upi_id && bill.remaining_amount > 0 && (
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center gap-3">
                <QrCode className="w-10 h-10 text-slate-800 flex-shrink-0" />
                <div>
                  <p className="font-bold text-slate-900 text-xs">Pay via UPI</p>
                  <p className="font-mono text-[11px] text-brand-600">{settings.upi_id}</p>
                  <p className="text-[10px] text-slate-500">Scan & pay remaining balance</p>
                </div>
              </div>
            )}
            {bill.notes && (
              <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                Notes: {bill.notes}
              </p>
            )}
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-mono font-semibold">{formatCurrency(bill.subtotal)}</span>
            </div>
            {bill.discount_amount > 0 && (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Discount:</span>
                <span className="font-mono">-{formatCurrency(bill.discount_amount)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-extrabold text-slate-900 border-t border-slate-200 pt-2">
              <span>Total Bill:</span>
              <span className="font-mono">{formatCurrency(bill.total_amount)}</span>
            </div>

            {/* Split Breakdown */}
            <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200 space-y-1 mt-2">
              {bill.cash_amount > 0 && (
                <div className="flex justify-between text-teal-700 text-xs">
                  <span>Cash Paid:</span>
                  <span className="font-mono font-bold">{formatCurrency(bill.cash_amount)}</span>
                </div>
              )}
              {bill.upi_amount > 0 && (
                <div className="flex justify-between text-indigo-700 text-xs">
                  <span>UPI Paid:</span>
                  <span className="font-mono font-bold">{formatCurrency(bill.upi_amount)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-900 font-bold border-t border-slate-200 pt-1">
                <span>Total Received:</span>
                <span className="font-mono text-emerald-700">{formatCurrency(bill.total_paid)}</span>
              </div>
            </div>

            <div className="flex justify-between items-center text-sm font-bold pt-1">
              <span className="text-slate-800">Remaining Due:</span>
              <span
                className={`font-mono text-base ${
                  bill.remaining_amount > 0 ? 'text-rose-600' : 'text-emerald-600'
                }`}
              >
                {formatCurrency(bill.remaining_amount)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Terms */}
        <div className="border-t border-slate-200 pt-4 text-center text-[10px] text-slate-500 space-y-1">
          <p className="font-medium text-slate-700">{settings.receipt_footer_text}</p>
          {settings.terms_conditions && (
            <p className="whitespace-pre-line text-slate-400">{settings.terms_conditions}</p>
          )}
        </div>
      </div>
    </Modal>
  );
};
