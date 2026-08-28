export type PaymentMode = 'CASH' | 'UPI' | 'SPLIT';
export type PaymentStatus = 'PAID' | 'PARTIAL' | 'UNPAID' | 'CANCELLED';
export type ItemType = 'frame' | 'lens' | 'contact_lens' | 'sunglasses' | 'accessories' | 'solution' | 'service' | 'other';
export type WithdrawalCategory = 'SALARY' | 'PERSONAL' | 'SHOP_EXPENSE' | 'RENT' | 'UTILITIES' | 'PURCHASE' | 'OTHER';

export interface CashWithdrawal {
  id: string;
  date: string; // YYYY-MM-DD
  amount: number;
  category: WithdrawalCategory;
  payment_mode: 'CASH' | 'UPI';
  remarks: string;
  created_at: string;
}

export interface EyePrescription {
  sphere_od?: string;
  cylinder_od?: string;
  axis_od?: string;
  add_od?: string;
  sphere_os?: string;
  cylinder_os?: string;
  axis_os?: string;
  add_os?: string;
  pd?: string;
  doctor_name?: string;
  prescription_date?: string;
  notes?: string;
}

export interface BillItem {
  id: string;
  bill_id?: string;
  item_type: ItemType;
  product_name: string;
  brand?: string;
  model_number?: string;
  quantity: number;
  unit_price: number;
  discount: number;
  tax_rate?: number;
  tax_amount?: number;
  total_price: number;
}

export interface Customer {
  id: string;
  organization_id?: string;
  name: string;
  mobile: string;
  email?: string;
  address?: string;
  city?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
  // Computed aggregations
  total_purchases?: number;
  total_paid?: number;
  outstanding_balance?: number;
  bill_count?: number;
  last_purchase_date?: string;
}

export interface Bill {
  id: string;
  organization_id?: string;
  customer_id: string;
  customer_name: string;
  customer_mobile: string;
  customer_address?: string;
  bill_number: string;
  bill_date: string; // ISO date string YYYY-MM-DD
  due_date?: string;
  prescription?: EyePrescription;
  items: BillItem[];
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  
  // Payment math
  advance_amount: number;
  cash_amount: number;
  upi_amount: number;
  total_paid: number;
  remaining_amount: number;
  
  payment_status: PaymentStatus;
  payment_mode: PaymentMode;
  notes?: string;
  
  // Audit / Cancellation
  is_cancelled: boolean;
  cancellation_date?: string;
  cancellation_reason?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  organization_id?: string;
  bill_id: string;
  bill_number: string;
  customer_id: string;
  customer_name: string;
  customer_mobile: string;
  payment_date: string; // YYYY-MM-DD
  amount: number;
  payment_mode: 'CASH' | 'UPI';
  reference_number?: string; // UPI txn ref or receipt no
  notes?: string;
  created_by?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  organization_id?: string;
  user_email: string;
  action: 
    | 'BILL_CREATED' 
    | 'BILL_EDITED' 
    | 'PAYMENT_ADDED' 
    | 'PAYMENT_EDITED' 
    | 'BILL_CANCELLED' 
    | 'CUSTOMER_CREATED' 
    | 'CUSTOMER_EDITED' 
    | 'SETTINGS_UPDATED'
    | 'WITHDRAWAL_ADDED'
    | 'DEMO_DATA_RESET';
  record_type: 'bill' | 'payment' | 'customer' | 'settings' | 'system';
  record_id?: string;
  record_identifier?: string; // e.g. BILL-2026-0001
  details: string;
  ip_address?: string;
  created_at: string;
}

export interface ShopSettings {
  id?: string;
  organization_id?: string;
  shop_name: string;
  tagline: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone_number: string;
  secondary_phone?: string;
  email: string;
  gst_number?: string;
  dl_number?: string; // Drug license / Optical license
  invoice_prefix: string;
  currency_symbol: string;
  receipt_footer_text: string;
  upi_id?: string;
  upi_payee_name?: string;
  enable_upi_qr: boolean;
  terms_conditions?: string;
  logo_url?: string;
  admin_password?: string; // Master admin security password
  created_at?: string;
  updated_at?: string;
}

export type DateFilterType = 'today' | 'yesterday' | 'week' | 'month' | 'this_year' | 'custom';

export interface DashboardMetrics {
  today_sales: number;
  today_payments: number;
  today_cash: number;
  today_upi: number;
  today_bills_count: number;
  total_outstanding: number;
  total_advance: number;
  total_customers: number;
  recovered_outstanding_today: number;
  today_withdrawals: number;
  
  // Total Bank & Business Balances
  total_earned_lifetime: number;
  total_withdrawn_lifetime: number;
  net_cash_in_drawer: number;
  net_bank_balance: number;
  net_business_balance: number;
  
  recent_bills: Bill[];
  top_outstanding_customers: {
    customer_id: string;
    customer_name: string;
    customer_mobile: string;
    outstanding: number;
    last_bill_date: string;
    bill_count: number;
  }[];
}
