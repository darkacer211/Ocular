import { Customer, Bill, Payment, ShopSettings, AuditLog, DashboardMetrics, CashWithdrawal } from '../types';
import { initialCustomers, initialBills, initialPayments, initialShopSettings, initialAuditLogs } from './mockData';
import { getTodayDateString } from './utils';

const STORAGE_KEYS = {
  CUSTOMERS: 'shriramwar_customers_v1',
  BILLS: 'shriramwar_bills_v1',
  PAYMENTS: 'shriramwar_payments_v1',
  SETTINGS: 'shriramwar_settings_v1',
  AUDIT_LOGS: 'shriramwar_audit_logs_v1',
  WITHDRAWALS: 'shriramwar_withdrawals_v1',
};

// Safe JSON parser with fallback
function getLocalItem<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (error) {
    console.error(`Error reading ${key} from localStorage:`, error);
    return fallback;
  }
}

function setLocalItem<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
}
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID();
    } catch (_) {}
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export class LocalStoreManager {
  // Initialize storage with sample data if empty
  static initialize(): void {
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      setLocalItem(STORAGE_KEYS.SETTINGS, initialShopSettings);
    }
    if (!localStorage.getItem(STORAGE_KEYS.CUSTOMERS)) {
      setLocalItem(STORAGE_KEYS.CUSTOMERS, initialCustomers);
    }
    if (!localStorage.getItem(STORAGE_KEYS.BILLS)) {
      setLocalItem(STORAGE_KEYS.BILLS, initialBills);
    }
    if (!localStorage.getItem(STORAGE_KEYS.PAYMENTS)) {
      setLocalItem(STORAGE_KEYS.PAYMENTS, initialPayments);
    }
    if (!localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS)) {
      setLocalItem(STORAGE_KEYS.AUDIT_LOGS, initialAuditLogs);
    }
    if (!localStorage.getItem(STORAGE_KEYS.WITHDRAWALS)) {
      setLocalItem(STORAGE_KEYS.WITHDRAWALS, []);
    }
  }

  static clearAllData(): void {
    setLocalItem(STORAGE_KEYS.CUSTOMERS, []);
    setLocalItem(STORAGE_KEYS.BILLS, []);
    setLocalItem(STORAGE_KEYS.PAYMENTS, []);
    setLocalItem(STORAGE_KEYS.WITHDRAWALS, []);
    setLocalItem(STORAGE_KEYS.AUDIT_LOGS, []);
  }

  static resetToDemo(): void {
    this.clearAllData();
  }

  // --- SETTINGS ---
  static getSettings(): ShopSettings {
    return getLocalItem<ShopSettings>(STORAGE_KEYS.SETTINGS, initialShopSettings);
  }

  static saveSettings(settings: ShopSettings): ShopSettings {
    const updated = { ...settings, updated_at: new Date().toISOString() };
    setLocalItem(STORAGE_KEYS.SETTINGS, updated);
    this.addAuditLog('SETTINGS_UPDATED', 'settings', 'Settings', `Updated shop profile for ${settings.shop_name}`);
    return updated;
  }

  // --- CUSTOMERS ---
  static getCustomers(): Customer[] {
    const customers = getLocalItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, initialCustomers);
    const bills = this.getBills();

    // Dynamically calculate aggregate stats per customer
    return customers.map(cust => {
      const custBills = bills.filter(b => b.customer_id === cust.id && !b.is_cancelled);
      const totalPurchases = custBills.reduce((sum, b) => sum + (b.total_amount || 0), 0);
      const totalPaid = custBills.reduce((sum, b) => sum + (b.total_paid || 0), 0);
      const outstandingBalance = Math.max(0, totalPurchases - totalPaid);
      
      const lastBill = custBills.sort((a, b) => (b.bill_date > a.bill_date ? 1 : -1))[0];

      return {
        ...cust,
        total_purchases: totalPurchases,
        total_paid: totalPaid,
        outstanding_balance: outstandingBalance,
        bill_count: custBills.length,
        last_purchase_date: lastBill ? lastBill.bill_date : cust.created_at.split('T')[0],
      };
    });
  }

  static getCustomerById(id: string): Customer | undefined {
    return this.getCustomers().find(c => c.id === id);
  }

  // Mirror a customer record from Supabase into localStorage (for offline continuity)
  static upsertCustomerLocal(customer: Customer): void {
    const customers = getLocalItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
    const index = customers.findIndex(c => c.id === customer.id);
    if (index >= 0) {
      customers[index] = { ...customers[index], ...customer };
    } else {
      customers.push(customer);
    }
    setLocalItem(STORAGE_KEYS.CUSTOMERS, customers);
  }

  static setCustomers(customers: Customer[]): void {
    setLocalItem(STORAGE_KEYS.CUSTOMERS, customers);
  }

  static saveCustomer(custData: Omit<Customer, 'id' | 'created_at'> & { id?: string }): Customer {
    const customers = getLocalItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, initialCustomers);
    const now = new Date().toISOString();

    if (custData.id) {
      // Update
      const index = customers.findIndex(c => c.id === custData.id);
      if (index >= 0) {
        const updated = { ...customers[index], ...custData, updated_at: now };
        customers[index] = updated;
        setLocalItem(STORAGE_KEYS.CUSTOMERS, customers);
        this.addAuditLog('CUSTOMER_EDITED', 'customer', updated.name, `Updated customer record for ${updated.name}`);
        return updated;
      }
    }

    // Create New
    const newCustomer: Customer = {
      ...custData,
      id: generateUUID(),
      created_at: now,
      total_purchases: 0,
      total_paid: 0,
      outstanding_balance: 0,
      bill_count: 0,
    };
    customers.unshift(newCustomer);
    setLocalItem(STORAGE_KEYS.CUSTOMERS, customers);
    this.addAuditLog('CUSTOMER_CREATED', 'customer', newCustomer.name, `Added new customer ${newCustomer.name} (${newCustomer.mobile})`);
    return newCustomer;
  }

  // --- BILLS ---
  static getBills(): Bill[] {
    return getLocalItem<Bill[]>(STORAGE_KEYS.BILLS, initialBills);
  }

  static getBillById(id: string): Bill | undefined {
    return this.getBills().find(b => b.id === id);
  }

  static createBill(billData: Omit<Bill, 'id' | 'created_at' | 'updated_at'>): Bill {
    const bills = this.getBills();
    const now = new Date().toISOString();

    // Ensure customer exists or update
    let customer = this.getCustomers().find(c => c.id === billData.customer_id || c.mobile === billData.customer_mobile);
    if (!customer) {
      customer = this.saveCustomer({
        name: billData.customer_name,
        mobile: billData.customer_mobile,
        address: billData.customer_address,
      });
    }

    const newBill: Bill = {
      ...billData,
      id: generateUUID(),
      customer_id: customer.id,
      created_at: now,
      updated_at: now,
    };

    bills.unshift(newBill);
    setLocalItem(STORAGE_KEYS.BILLS, bills);

    // If an advance was received, record initial payment logs
    if (newBill.total_paid > 0) {
      if (newBill.payment_mode === 'SPLIT') {
        if (newBill.cash_amount > 0) {
          this.addPayment({
            bill_id: newBill.id,
            bill_number: newBill.bill_number,
            customer_id: customer.id,
            customer_name: customer.name,
            customer_mobile: customer.mobile,
            payment_date: newBill.bill_date,
            amount: newBill.cash_amount,
            payment_mode: 'CASH',
            notes: 'Advance Cash portion on bill creation',
          });
        }
        if (newBill.upi_amount > 0) {
          this.addPayment({
            bill_id: newBill.id,
            bill_number: newBill.bill_number,
            customer_id: customer.id,
            customer_name: customer.name,
            customer_mobile: customer.mobile,
            payment_date: newBill.bill_date,
            amount: newBill.upi_amount,
            payment_mode: 'UPI',
            notes: 'Advance UPI portion on bill creation',
          });
        }
      } else {
        this.addPayment({
          bill_id: newBill.id,
          bill_number: newBill.bill_number,
          customer_id: customer.id,
          customer_name: customer.name,
          customer_mobile: customer.mobile,
          payment_date: newBill.bill_date,
          amount: newBill.total_paid,
          payment_mode: newBill.payment_mode as 'CASH' | 'UPI',
          notes: `Advance payment on bill creation (${newBill.payment_mode})`,
        });
      }
    }

    this.addAuditLog(
      'BILL_CREATED',
      'bill',
      newBill.bill_number,
      `Created Bill #${newBill.bill_number} for ${newBill.customer_name}. Total: ₹${newBill.total_amount}, Paid: ₹${newBill.total_paid}`
    );

    return newBill;
  }

  static cancelBill(billId: string, reason: string): Bill | null {
    const bills = this.getBills();
    const index = bills.findIndex(b => b.id === billId);
    if (index === -1) return null;

    const bill = bills[index];
    const now = new Date().toISOString();

    const updatedBill: Bill = {
      ...bill,
      is_cancelled: true,
      cancellation_date: now,
      cancellation_reason: reason,
      payment_status: 'CANCELLED',
      updated_at: now,
    };

    bills[index] = updatedBill;
    setLocalItem(STORAGE_KEYS.BILLS, bills);

    this.addAuditLog(
      'BILL_CANCELLED',
      'bill',
      bill.bill_number,
      `Cancelled Bill #${bill.bill_number}. Reason: ${reason}`
    );

    return updatedBill;
  }

  // Permanently delete a bill and all its associated payments
  static deleteBill(billId: string): Bill | null {
    const bills = this.getBills();
    const index = bills.findIndex(b => b.id === billId);
    if (index === -1) return null;

    const bill = bills[index];
    // Remove the bill
    bills.splice(index, 1);
    setLocalItem(STORAGE_KEYS.BILLS, bills);

    // Also delete all payments linked to this bill
    const payments = this.getPayments().filter(p => p.bill_id !== billId);
    setLocalItem(STORAGE_KEYS.PAYMENTS, payments);

    this.addAuditLog(
      'BILL_CANCELLED',
      'bill',
      bill.bill_number,
      `Permanently deleted Bill #${bill.bill_number} for ${bill.customer_name}`
    );

    return bill;
  }

  // --- PAYMENTS ---
  static getPayments(): Payment[] {
    const payments = getLocalItem<Payment[]>(STORAGE_KEYS.PAYMENTS, initialPayments);
    const bills = this.getBills();
    const validBillIds = new Set(bills.map(b => b.id));
    return payments.filter(p => !p.bill_id || validBillIds.has(p.bill_id));
  }

  static addPayment(paymentData: Omit<Payment, 'id' | 'created_at'>): Payment {
    const payments = this.getPayments();
    const now = new Date().toISOString();

    const newPayment: Payment = {
      ...paymentData,
      id: generateUUID(),
      created_at: now,
    };

    payments.unshift(newPayment);
    setLocalItem(STORAGE_KEYS.PAYMENTS, payments);

    // Recompute bill's total_paid and remaining
    const bills = this.getBills();
    const billIndex = bills.findIndex(b => b.id === paymentData.bill_id);
    if (billIndex >= 0) {
      const bill = bills[billIndex];
      const billPayments = payments.filter(p => p.bill_id === bill.id);
      const totalPaid = billPayments.reduce((sum, p) => sum + p.amount, 0);
      const remaining = Math.max(0, bill.total_amount - totalPaid);
      
      const newStatus = remaining === 0 ? 'PAID' : totalPaid > 0 ? 'PARTIAL' : 'UNPAID';
      
      const cashSum = billPayments.filter(p => p.payment_mode === 'CASH').reduce((sum, p) => sum + p.amount, 0);
      const upiSum = billPayments.filter(p => p.payment_mode === 'UPI').reduce((sum, p) => sum + p.amount, 0);

      bills[billIndex] = {
        ...bill,
        total_paid: totalPaid,
        remaining_amount: remaining,
        cash_amount: cashSum,
        upi_amount: upiSum,
        payment_status: newStatus,
        updated_at: now,
      };
      setLocalItem(STORAGE_KEYS.BILLS, bills);
    }

    this.addAuditLog(
      'PAYMENT_ADDED',
      'payment',
      paymentData.bill_number,
      `Received ₹${paymentData.amount} (${paymentData.payment_mode}) from ${paymentData.customer_name} against #${paymentData.bill_number}`
    );

    return newPayment;
  }

  // --- CASH WITHDRAWALS ---
  static getWithdrawals(): CashWithdrawal[] {
    return getLocalItem<CashWithdrawal[]>(STORAGE_KEYS.WITHDRAWALS, []);
  }

  static addWithdrawal(data: Omit<CashWithdrawal, 'id' | 'created_at'>): CashWithdrawal {
    const withdrawals = this.getWithdrawals();
    const now = new Date().toISOString();

    const newWithdrawal: CashWithdrawal = {
      ...data,
      id: generateUUID(),
      created_at: now,
    };

    withdrawals.unshift(newWithdrawal);
    setLocalItem(STORAGE_KEYS.WITHDRAWALS, withdrawals);

    this.addAuditLog(
      'WITHDRAWAL_ADDED',
      'settings',
      data.category,
      `Cash withdrawal of ₹${data.amount} — ${data.category}: ${data.remarks}`
    );

    return newWithdrawal;
  }

  static deleteWithdrawal(id: string): void {
    const withdrawals = this.getWithdrawals().filter(w => w.id !== id);
    setLocalItem(STORAGE_KEYS.WITHDRAWALS, withdrawals);
  }

  // --- AUDIT LOGS ---
  static getAuditLogs(): AuditLog[] {
    return getLocalItem<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, initialAuditLogs);
  }

  static addAuditLog(
    action: AuditLog['action'],
    recordType: AuditLog['record_type'],
    recordIdentifier: string,
    details: string
  ): void {
    const logs = this.getAuditLogs();
    const newLog: AuditLog = {
      id: generateUUID(),
      user_email: 'owner@shriramwaropticals.com',
      action,
      record_type: recordType,
      record_identifier: recordIdentifier,
      details,
      created_at: new Date().toISOString(),
    };
    logs.unshift(newLog);
    // Keep last 500 logs
    setLocalItem(STORAGE_KEYS.AUDIT_LOGS, logs.slice(0, 500));
  }

  // --- METRICS ---
  // Sync in-memory React state to localStorage so getMetrics() always reads fresh data
  static syncStateToLocal(bills: Bill[], payments: Payment[]): void {
    setLocalItem(STORAGE_KEYS.BILLS, bills);
    setLocalItem(STORAGE_KEYS.PAYMENTS, payments);
  }

  static getMetrics(filterDate: string = getTodayDateString()): DashboardMetrics {
    const bills = this.getBills().filter(b => !b.is_cancelled);
    const validBillIds = new Set(bills.map(b => b.id));
    const payments = this.getPayments().filter(p => !p.bill_id || validBillIds.has(p.bill_id));
    const customers = this.getCustomers();
    const withdrawals = this.getWithdrawals();

    const isSameDay = (d?: string) => Boolean(d && (d === filterDate || d.startsWith(filterDate) || d.split('T')[0] === filterDate));

    // Today's metrics
    const todayBills = bills.filter(b => isSameDay(b.bill_date));
    const todaySales = todayBills.reduce((sum, b) => sum + (b.total_amount || 0), 0);
    const todayAdvance = todayBills.reduce((sum, b) => sum + (b.advance_amount || 0), 0);

    const todayPayments = payments.filter(p => isSameDay(p.payment_date));
    let todayPaymentsTotal = todayPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    let todayCash = todayPayments.filter(p => p.payment_mode === 'CASH').reduce((sum, p) => sum + p.amount, 0);
    let todayUpi = todayPayments.filter(p => p.payment_mode === 'UPI').reduce((sum, p) => sum + p.amount, 0);

    // Fallback: If payments array is empty but todayBills have paid amounts, derive from bills
    if (todayPayments.length === 0 && todayBills.length > 0) {
      todayPaymentsTotal = todayBills.reduce((sum, b) => sum + (b.total_paid || 0), 0);
      todayCash = todayBills.reduce((sum, b) => sum + (b.cash_amount || (b.payment_mode === 'CASH' ? b.total_paid : 0)), 0);
      todayUpi = todayBills.reduce((sum, b) => sum + (b.upi_amount || (b.payment_mode === 'UPI' ? b.total_paid : 0)), 0);
    }

    // Today's withdrawals
    const todayWithdrawals = withdrawals.filter(w => isSameDay(w.date)).reduce((sum, w) => sum + w.amount, 0);

    // Payments collected today on old bills (recovered outstanding)
    const recoveredOutstanding = todayPayments
      .filter(p => {
        const bill = bills.find(b => b.id === p.bill_id);
        return bill && !isSameDay(bill.bill_date);
      })
      .reduce((sum, p) => sum + p.amount, 0);

    const totalOutstanding = bills.reduce((sum, b) => sum + (b.remaining_amount || 0), 0);

    const topOutstanding = customers
      .filter(c => (c.outstanding_balance || 0) > 0)
      .sort((a, b) => (b.outstanding_balance || 0) - (a.outstanding_balance || 0))
      .slice(0, 5)
      .map(c => ({
        customer_id: c.id,
        customer_name: c.name,
        customer_mobile: c.mobile,
        outstanding: c.outstanding_balance || 0,
        last_bill_date: c.last_purchase_date || '-',
        bill_count: c.bill_count || 0,
      }));

    // Lifetime Total Earned & Withdrawn Balances (Bank vs Cash Drawer)
    const totalEarnedLifetime = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalWithdrawnLifetime = withdrawals.reduce((sum, w) => sum + (w.amount || 0), 0);

    const totalCashEarned = payments.filter(p => p.payment_mode === 'CASH').reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalUpiEarned = payments.filter(p => p.payment_mode === 'UPI').reduce((sum, p) => sum + (p.amount || 0), 0);

    const totalCashWithdrawn = withdrawals.filter(w => w.payment_mode === 'CASH').reduce((sum, w) => sum + (w.amount || 0), 0);
    const totalUpiWithdrawn = withdrawals.filter(w => w.payment_mode === 'UPI').reduce((sum, w) => sum + (w.amount || 0), 0);

    const netCashInDrawer = totalCashEarned - totalCashWithdrawn;
    const netBankBalance = totalUpiEarned - totalUpiWithdrawn;
    const netBusinessBalance = totalEarnedLifetime - totalWithdrawnLifetime;

    return {
      today_sales: todaySales,
      today_payments: todayPaymentsTotal,
      today_cash: todayCash,
      today_upi: todayUpi,
      today_bills_count: todayBills.length,
      total_outstanding: totalOutstanding,
      total_advance: todayAdvance,
      total_customers: customers.length,
      recovered_outstanding_today: recoveredOutstanding,
      today_withdrawals: todayWithdrawals,
      total_earned_lifetime: totalEarnedLifetime,
      total_withdrawn_lifetime: totalWithdrawnLifetime,
      net_cash_in_drawer: netCashInDrawer,
      net_bank_balance: netBankBalance,
      net_business_balance: netBusinessBalance,
      recent_bills: bills.slice(0, 5),
      top_outstanding_customers: topOutstanding,
    };
  }
}
