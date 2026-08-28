import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Customer, Bill, Payment, AuditLog, DashboardMetrics, DateFilterType, CashWithdrawal } from '../types';
import { LocalStoreManager, generateUUID } from '../lib/storage';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { useToast } from './ToastContext';
import { getTodayDateString } from '../lib/utils';

interface DataContextType {
  customers: Customer[];
  bills: Bill[];
  payments: Payment[];
  auditLogs: AuditLog[];
  withdrawals: CashWithdrawal[];
  metrics: DashboardMetrics;
  isLoading: boolean;
  isSupabaseLive: boolean;
  selectedDateFilter: DateFilterType;
  setSelectedDateFilter: (filter: DateFilterType) => void;
  customDateRange: { from: string; to: string };
  setCustomDateRange: (range: { from: string; to: string }) => void;

  // Actions
  refreshData: () => Promise<void>;
  createBill: (billData: Omit<Bill, 'id' | 'created_at' | 'updated_at'>) => Promise<Bill>;
  cancelBill: (billId: string, reason: string) => Promise<boolean>;
  deleteBill: (billId: string) => Promise<boolean>;
  addPayment: (paymentData: Omit<Payment, 'id' | 'created_at'>) => Promise<Payment>;
  saveCustomer: (custData: Omit<Customer, 'id' | 'created_at'> & { id?: string }) => Promise<Customer>;
  addWithdrawal: (data: Omit<CashWithdrawal, 'id' | 'created_at'>) => Promise<CashWithdrawal>;
  deleteWithdrawal: (id: string) => void;
  resetDemoData: () => void;
  clearAllData: () => Promise<void>;
  searchRecords: (query: string) => { customers: Customer[]; bills: Bill[] };
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { success, error, warning } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [withdrawals, setWithdrawals] = useState<CashWithdrawal[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics>(() => LocalStoreManager.getMetrics());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSupabaseLive, setIsSupabaseLive] = useState<boolean>(false);
  const [selectedDateFilter, setSelectedDateFilter] = useState<DateFilterType>('today');
  const [customDateRange, setCustomDateRange] = useState<{ from: string; to: string }>({
    from: getTodayDateString(),
    to: getTodayDateString(),
  });

  const loadLocalData = () => {
    LocalStoreManager.initialize();
    setCustomers(LocalStoreManager.getCustomers());
    setBills(LocalStoreManager.getBills());
    setPayments(LocalStoreManager.getPayments());
    setAuditLogs(LocalStoreManager.getAuditLogs());
    setWithdrawals(LocalStoreManager.getWithdrawals());
    setMetrics(LocalStoreManager.getMetrics());
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);

    // ALWAYS load localStorage first — instant, offline-safe, never empty on re-login
    LocalStoreManager.initialize();
    loadLocalData();
    setIsLoading(false);

    // Then try Supabase in background as cloud sync layer
    if (isSupabaseConfigured && supabase) {
      try {
        const [custRes, billRes, payRes, auditRes] = await Promise.all([
          supabase.from('customers').select('*').order('created_at', { ascending: false }),
          supabase.from('bills').select('*').order('created_at', { ascending: false }),
          supabase.from('payments').select('*').order('created_at', { ascending: false }),
          supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(200),
        ]);

        if (!custRes.error && !billRes.error && !payRes.error) {
          const supaBills = (billRes.data as any) || [];
          const supaCustomers = (custRes.data as any) || [];
          const supaPayments = (payRes.data as any) || [];

          // Only replace local data with Supabase if Supabase actually has records.
          if (supaCustomers.length > 0 || supaBills.length > 0) {
            // Cross-validate: only include payments that have a matching bill in Supabase.
            // This automatically excludes payments from deleted bills even if the
            // Supabase DELETE failed (e.g. due to RLS) — orphaned payments won't count.
            const validBillIds = new Set(supaBills.map((b: any) => b.id));
            const cleanPayments = supaPayments.filter((p: any) => validBillIds.has(p.bill_id));

            // If bills have paid amounts but no explicit payment records in DB, synthesize them
            supaBills.forEach((b: any) => {
              if (b.total_paid > 0 && !cleanPayments.some((p: any) => p.bill_id === b.id)) {
                if (b.payment_mode === 'SPLIT') {
                  if (b.cash_amount > 0) {
                    cleanPayments.push({
                      id: generateUUID(),
                      bill_id: b.id,
                      bill_number: b.bill_number,
                      customer_id: b.customer_id,
                      customer_name: b.customer_name,
                      customer_mobile: b.customer_mobile,
                      payment_date: b.bill_date,
                      amount: b.cash_amount,
                      payment_mode: 'CASH',
                      notes: 'Advance Cash portion',
                      created_at: b.created_at || new Date().toISOString(),
                    });
                  }
                  if (b.upi_amount > 0) {
                    cleanPayments.push({
                      id: generateUUID(),
                      bill_id: b.id,
                      bill_number: b.bill_number,
                      customer_id: b.customer_id,
                      customer_name: b.customer_name,
                      customer_mobile: b.customer_mobile,
                      payment_date: b.bill_date,
                      amount: b.upi_amount,
                      payment_mode: 'UPI',
                      notes: 'Advance UPI portion',
                      created_at: b.created_at || new Date().toISOString(),
                    });
                  }
                } else {
                  cleanPayments.push({
                    id: generateUUID(),
                    bill_id: b.id,
                    bill_number: b.bill_number,
                    customer_id: b.customer_id,
                    customer_name: b.customer_name,
                    customer_mobile: b.customer_mobile,
                    payment_date: b.bill_date,
                    amount: b.total_paid,
                    payment_mode: b.payment_mode || 'CASH',
                    notes: 'Advance payment',
                    created_at: b.created_at || new Date().toISOString(),
                  });
                }
              }
            });

            setCustomers(supaCustomers);
            setBills(supaBills);
            setPayments(cleanPayments);
            setAuditLogs((auditRes.data as any) || []);
            setWithdrawals(LocalStoreManager.getWithdrawals());

            // Mirror back to localStorage so getMetrics() always reads clean data
            supaCustomers.forEach((c: any) => LocalStoreManager.upsertCustomerLocal(c));
            LocalStoreManager.syncStateToLocal(supaBills, cleanPayments);
            setMetrics(LocalStoreManager.getMetrics());
          }

          setIsSupabaseLive(true);
        } else {
          setIsSupabaseLive(false);
        }
      } catch (err) {
        console.warn('Supabase sync error, using local store', err);
        setIsSupabaseLive(false);
      }
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Keep metrics in sync with data changes
  useEffect(() => {
    setMetrics(LocalStoreManager.getMetrics());
  }, [bills, payments, customers, withdrawals]);

  const createBill = async (billData: Omit<Bill, 'id' | 'created_at' | 'updated_at'>): Promise<Bill> => {
    try {
      const created = LocalStoreManager.createBill(billData);
      
      if (isSupabaseConfigured && supabase) {
        try {
          // 1. Sync customer to Supabase
          const cust = LocalStoreManager.getCustomerById(created.customer_id);
          if (cust) {
            const { total_purchases, total_paid, outstanding_balance, bill_count, last_purchase_date, ...dbCust } = cust as any;
            await (supabase as any).from('customers').upsert([dbCust]);
          }

          // 2. Insert bill into Supabase (strip items object for table compatibility)
          const { items, ...dbBill } = created as any;
          await (supabase as any).from('bills').insert([dbBill]);

          // 3. Insert bill items into Supabase
          if (created.items && created.items.length > 0) {
            const dbItems = created.items.map((item: any) => ({
              ...item,
              id: item.id || generateUUID(),
              bill_id: created.id,
            }));
            await (supabase as any).from('bill_items').insert(dbItems);
          }

          // 4. Sync payments for this bill
          const billPayments = LocalStoreManager.getPayments().filter(p => p.bill_id === created.id);
          if (billPayments.length > 0) {
            await (supabase as any).from('payments').insert(billPayments);
          }
        } catch (supaErr) {
          console.warn('Supabase sync error on createBill:', supaErr);
        }
      }

      setBills(LocalStoreManager.getBills());
      setCustomers(LocalStoreManager.getCustomers());
      setPayments(LocalStoreManager.getPayments());
      setAuditLogs(LocalStoreManager.getAuditLogs());
      setMetrics(LocalStoreManager.getMetrics());
      success('Bill Created!', `Bill #${created.bill_number} generated for ${created.customer_name}`);
      return created;
    } catch (err: any) {
      error('Failed to create bill', err.message || 'An error occurred');
      throw err;
    }
  };

  const cancelBill = async (billId: string, reason: string): Promise<boolean> => {
    try {
      const updated = LocalStoreManager.cancelBill(billId, reason);
      if (!updated) { warning('Bill Not Found', 'Could not locate bill to cancel'); return false; }
      if (isSupabaseConfigured && supabase) {
        try {
          await (supabase as any).from('bills').update({
            is_cancelled: true,
            cancellation_reason: reason,
            cancellation_date: new Date().toISOString(),
          }).eq('id', billId);
        } catch (_) {}
      }
      setBills(LocalStoreManager.getBills());
      setCustomers(LocalStoreManager.getCustomers());
      setAuditLogs(LocalStoreManager.getAuditLogs());
      setMetrics(LocalStoreManager.getMetrics());
      warning('Bill Cancelled', `Bill #${updated.bill_number} has been cancelled.`);
      return true;
    } catch (err: any) {
      error('Error cancelling bill', err.message);
      return false;
    }
  };

  const deleteBill = async (billId: string): Promise<boolean> => {
    try {
      const deleted = LocalStoreManager.deleteBill(billId);
      if (!deleted) { error('Bill Not Found', 'Could not locate bill to delete'); return false; }
      if (isSupabaseConfigured && supabase) {
        try {
          await (supabase as any).from('payments').delete().eq('bill_id', billId);
          await (supabase as any).from('bill_items').delete().eq('bill_id', billId);
          await (supabase as any).from('bills').delete().eq('id', billId);
        } catch (_) {}
      }
      // Filter React state directly — this is the source of truth in Supabase mode
      const newBills = bills.filter(b => b.id !== billId);
      const newPayments = payments.filter(p => p.bill_id !== billId);
      // Sync filtered state to localStorage so getMetrics() reads fresh data
      LocalStoreManager.syncStateToLocal(newBills, newPayments);
      setBills(newBills);
      setPayments(newPayments);
      setWithdrawals(LocalStoreManager.getWithdrawals());
      setCustomers(LocalStoreManager.getCustomers());
      setAuditLogs(LocalStoreManager.getAuditLogs());
      // Now metrics reads from correct localStorage
      setMetrics(LocalStoreManager.getMetrics());
      error('Bill Deleted', `Bill #${deleted.bill_number} permanently removed.`);
      return true;
    } catch (err: any) {
      error('Error deleting bill', err.message);
      return false;
    }
  };

  const addPayment = async (paymentData: Omit<Payment, 'id' | 'created_at'>): Promise<Payment> => {
    try {
      const newPayment = LocalStoreManager.addPayment(paymentData);
      if (isSupabaseConfigured && supabase) {
        try {
          await (supabase as any).from('payments').insert([newPayment]);
          const updatedBill = LocalStoreManager.getBillById(newPayment.bill_id);
          if (updatedBill) {
            const { items, ...dbBill } = updatedBill as any;
            await (supabase as any).from('bills').update(dbBill).eq('id', updatedBill.id);
          }
        } catch (supaErr) {
          console.warn('Supabase payment sync error:', supaErr);
        }
      }
      setPayments(LocalStoreManager.getPayments());
      setBills(LocalStoreManager.getBills());
      setCustomers(LocalStoreManager.getCustomers());
      setAuditLogs(LocalStoreManager.getAuditLogs());
      setMetrics(LocalStoreManager.getMetrics());
      success('Payment Recorded!', `Received ₹${paymentData.amount} (${paymentData.payment_mode}) from ${paymentData.customer_name}`);
      return newPayment;
    } catch (err: any) {
      error('Failed to record payment', err.message);
      throw err;
    }
  };

  const saveCustomer = async (custData: Omit<Customer, 'id' | 'created_at'> & { id?: string }): Promise<Customer> => {
    try {
      const saved = LocalStoreManager.saveCustomer(custData);
      if (isSupabaseConfigured && supabase) {
        try {
          const { total_purchases, total_paid, outstanding_balance, bill_count, last_purchase_date, ...dbCust } = saved as any;
          if (custData.id) {
            await (supabase as any).from('customers').update(dbCust).eq('id', custData.id);
          } else {
            await (supabase as any).from('customers').insert([dbCust]);
          }
        } catch (supaErr) {
          console.warn('Supabase customer sync error:', supaErr);
        }
      }
      setCustomers(LocalStoreManager.getCustomers());
      setAuditLogs(LocalStoreManager.getAuditLogs());
      success('Customer Saved', `${saved.name}'s record has been updated.`);
      return saved;
    } catch (err: any) {
      error('Failed to save customer', err.message);
      throw err;
    }
  };

  const addWithdrawal = async (data: Omit<CashWithdrawal, 'id' | 'created_at'>): Promise<CashWithdrawal> => {
    const saved = LocalStoreManager.addWithdrawal(data);
    if (isSupabaseConfigured && supabase) {
      try {
        await (supabase as any).from('withdrawals').insert([saved]);
      } catch (supaErr) {
        console.warn('Supabase withdrawal sync error:', supaErr);
      }
    }
    setWithdrawals(LocalStoreManager.getWithdrawals());
    setAuditLogs(LocalStoreManager.getAuditLogs());
    setMetrics(LocalStoreManager.getMetrics());
    success('Withdrawal Recorded', `₹${data.amount} (${data.category}) recorded successfully.`);
    return saved;
  };

  const deleteWithdrawal = (id: string) => {
    LocalStoreManager.deleteWithdrawal(id);
    if (isSupabaseConfigured && supabase) {
      (supabase as any).from('withdrawals').delete().eq('id', id).then();
    }
    setWithdrawals(LocalStoreManager.getWithdrawals());
    setAuditLogs(LocalStoreManager.getAuditLogs());
    setMetrics(LocalStoreManager.getMetrics());
  };

  const clearAllData = async () => {
    LocalStoreManager.clearAllData();
    setCustomers([]);
    setBills([]);
    setPayments([]);
    setWithdrawals([]);
    setAuditLogs([]);
    setMetrics(LocalStoreManager.getMetrics());

    if (isSupabaseLive && supabase) {
      try {
        await (supabase as any).from('payments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await (supabase as any).from('bill_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await (supabase as any).from('bills').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await (supabase as any).from('customers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await (supabase as any).from('audit_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      } catch (err) {
        console.warn('Error clearing Supabase tables', err);
      }
    }

    success('All Data Cleared', 'System reset to clean zero-state. Ready for fresh optical shop billing!');
  };

  const resetDemoData = () => {
    clearAllData();
  };

  const searchRecords = (query: string) => {
    const q = query.trim().toLowerCase();
    if (!q) return { customers: [], bills: [] };
    const matchedCustomers = customers.filter(
      (c: Customer) => c.name.toLowerCase().includes(q) || c.mobile.includes(q) || (c.city && c.city.toLowerCase().includes(q))
    );
    const matchedBills = bills.filter(
      (b: Bill) => b.bill_number.toLowerCase().includes(q) || b.customer_name.toLowerCase().includes(q) || b.customer_mobile.includes(q)
    );
    return { customers: matchedCustomers, bills: matchedBills };
  };

  return (
    <DataContext.Provider value={{
      customers, bills, payments, auditLogs, withdrawals, metrics,
      isLoading, isSupabaseLive,
      selectedDateFilter, setSelectedDateFilter,
      customDateRange, setCustomDateRange,
      refreshData: loadData,
      createBill, cancelBill, deleteBill, addPayment, saveCustomer,
      addWithdrawal, deleteWithdrawal,
      resetDemoData, clearAllData, searchRecords,
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within a DataProvider');
  return context;
};
