import React, { useState, useEffect, useRef } from 'react';
import { Search, User, FileText, ArrowRight, X } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { Customer, Bill } from '../../types';
import { formatCurrency, formatDate } from '../../lib/utils';
import { StatusBadge } from '../ui/Badge';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCustomer: (customer: Customer) => void;
  onSelectBill: (bill: Bill) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectCustomer,
  onSelectBill,
}) => {
  const [query, setQuery] = useState('');
  const { searchRecords } = useData();
  const inputRef = useRef<HTMLInputElement>(null);

  const { customers, bills } = searchRecords(query);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-full items-start justify-center p-4 pt-16 sm:pt-24">
        <div
          className="relative w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all border border-slate-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Input Box */}
          <div className="flex items-center border-b border-slate-200 px-4 py-3.5 bg-slate-50/50">
            <Search className="w-5 h-5 text-slate-400 mr-3" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by customer name, 10-digit mobile, or bill number (e.g. BILL-2026-0001)..."
              className="w-full bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 mr-2"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <kbd className="text-[10px] uppercase font-bold text-slate-400 border border-slate-200 rounded px-1.5 py-0.5 bg-white">
              ESC
            </kbd>
          </div>

          {/* Results Area */}
          <div className="max-h-96 overflow-y-auto p-4 space-y-4">
            {!query.trim() ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Type a name, mobile number, or invoice code to search...
              </div>
            ) : customers.length === 0 && bills.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No matching records found for "{query}"
              </div>
            ) : (
              <>
                {/* Customers Result Section */}
                {customers.length > 0 && (
                  <div>
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 px-2">
                      Customers ({customers.length})
                    </h4>
                    <div className="space-y-1">
                      {customers.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => {
                            onSelectCustomer(c);
                            onClose();
                          }}
                          className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 text-left transition-colors group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center font-bold text-xs">
                              <User className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-900 group-hover:text-brand-600">
                                {c.name}
                              </p>
                              <p className="text-[11px] text-slate-500 font-mono">
                                +91 {c.mobile} {c.city ? `• ${c.city}` : ''}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-bold text-slate-900 font-mono">
                              Total: {formatCurrency(c.total_purchases)}
                            </p>
                            {(c.outstanding_balance || 0) > 0 && (
                              <p className="text-[11px] font-semibold text-rose-600 font-mono">
                                Due: {formatCurrency(c.outstanding_balance)}
                              </p>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bills Result Section */}
                {bills.length > 0 && (
                  <div>
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 px-2">
                      Bills / Invoices ({bills.length})
                    </h4>
                    <div className="space-y-1">
                      {bills.map((b) => (
                        <button
                          key={b.id}
                          onClick={() => {
                            onSelectBill(b);
                            onClose();
                          }}
                          className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 text-left transition-colors group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-900 group-hover:text-brand-600 font-mono">
                                  {b.bill_number}
                                </span>
                                <StatusBadge status={b.payment_status} />
                              </div>
                              <p className="text-[11px] text-slate-500">
                                {b.customer_name} • {formatDate(b.bill_date)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-bold text-slate-900 font-mono">
                              {formatCurrency(b.total_amount)}
                            </p>
                            {b.remaining_amount > 0 ? (
                              <p className="text-[11px] text-rose-600 font-mono font-medium">
                                Rem: {formatCurrency(b.remaining_amount)}
                              </p>
                            ) : (
                              <p className="text-[11px] text-emerald-600 font-medium">Fully Paid</p>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
