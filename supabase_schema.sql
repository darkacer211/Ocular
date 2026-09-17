-- ==============================================================================
-- SHRIRAMWAR OPTICALS - COMPLETE PRODUCTION DATABASE SCHEMA & RLS
-- ==============================================================================
-- This script safely drops existing policies/triggers and recreates all tables,
-- indexes, triggers, and full-access RLS policies for instant multi-device sync.
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Organizations Table
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL DEFAULT 'SHRIRAMWAR OPTICALS',
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Settings Table
CREATE TABLE IF NOT EXISTS public.settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    shop_name TEXT NOT NULL DEFAULT 'SHRIRAMWAR OPTICALS',
    tagline TEXT DEFAULT 'Precision Eye Care & Designer Eyewear',
    address TEXT NOT NULL DEFAULT 'Near Baliram patil school, besides shiva medical,CIDCO-N9, Chh. Sambhajinagar, Maharashtra - 431601',
    city TEXT DEFAULT 'Chh. Sambhajinagar',
    state TEXT DEFAULT 'Maharashtra',
    pincode TEXT DEFAULT '431601',
    phone_number TEXT NOT NULL DEFAULT '+91 9765062611',
    secondary_phone TEXT DEFAULT '',
    email TEXT DEFAULT 'contact@shriramwaropticals.com',
    gst_number TEXT DEFAULT '',
    dl_number TEXT DEFAULT '',
    invoice_prefix TEXT NOT NULL DEFAULT 'BILL',
    currency_symbol TEXT NOT NULL DEFAULT '₹',
    receipt_footer_text TEXT DEFAULT 'Thank you for choosing Shriramwar Opticals! Please visit again.',
    upi_id TEXT DEFAULT 'anusurya611-1@okicici',
    upi_payee_name TEXT DEFAULT 'Shriramwar Opticals',
    enable_upi_qr BOOLEAN DEFAULT true,
    terms_conditions TEXT DEFAULT '1. Goods once sold will not be taken back without original receipt.\n2. Warranty on frames/coatings as per manufacturer policy.',
    logo_url TEXT,
    admin_password TEXT DEFAULT 'admin',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Customers Table
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    mobile TEXT NOT NULL,
    email TEXT,
    address TEXT,
    city TEXT DEFAULT 'Chh. Sambhajinagar',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customers_mobile ON public.customers(mobile);
CREATE INDEX IF NOT EXISTS idx_customers_name ON public.customers(name);

-- 5. Bills Table
CREATE TABLE IF NOT EXISTS public.bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_mobile TEXT NOT NULL,
    customer_address TEXT,
    bill_number TEXT NOT NULL,
    bill_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    prescription JSONB,
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount >= 0),
    advance_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (advance_amount >= 0),
    cash_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (cash_amount >= 0),
    upi_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (upi_amount >= 0),
    total_paid NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (total_paid >= 0),
    remaining_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (remaining_amount >= 0),
    payment_status TEXT NOT NULL DEFAULT 'UNPAID' CHECK (payment_status IN ('PAID', 'PARTIAL', 'UNPAID', 'CANCELLED')),
    payment_mode TEXT NOT NULL DEFAULT 'CASH' CHECK (payment_mode IN ('CASH', 'UPI', 'SPLIT')),
    notes TEXT,
    is_cancelled BOOLEAN NOT NULL DEFAULT false,
    cancellation_date TIMESTAMPTZ,
    cancellation_reason TEXT,
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bills_date ON public.bills(bill_date);
CREATE INDEX IF NOT EXISTS idx_bills_status ON public.bills(payment_status);
CREATE INDEX IF NOT EXISTS idx_bills_number ON public.bills(bill_number);
CREATE INDEX IF NOT EXISTS idx_bills_customer ON public.bills(customer_id);

-- 6. Bill Items Table
CREATE TABLE IF NOT EXISTS public.bill_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_id UUID NOT NULL REFERENCES public.bills(id) ON DELETE CASCADE,
    item_type TEXT NOT NULL DEFAULT 'frame',
    product_name TEXT NOT NULL,
    brand TEXT,
    model_number TEXT,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
    discount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (discount >= 0),
    tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00 CHECK (tax_rate >= 0),
    tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (tax_amount >= 0),
    total_price NUMERIC(12, 2) NOT NULL CHECK (total_price >= 0)
);

CREATE INDEX IF NOT EXISTS idx_bill_items_bill_id ON public.bill_items(bill_id);

-- 7. Payments Table
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    bill_id UUID NOT NULL REFERENCES public.bills(id) ON DELETE CASCADE,
    bill_number TEXT NOT NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_mobile TEXT NOT NULL,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    payment_mode TEXT NOT NULL CHECK (payment_mode IN ('CASH', 'UPI')),
    reference_number TEXT,
    notes TEXT,
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_bill_id ON public.payments(bill_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON public.payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_mode ON public.payments(payment_mode);

-- 8. Withdrawals / Cash-Out Table
CREATE TABLE IF NOT EXISTS public.withdrawals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    category TEXT NOT NULL DEFAULT 'MISC_EXPENSE',
    payment_mode TEXT NOT NULL DEFAULT 'CASH' CHECK (payment_mode IN ('CASH', 'UPI')),
    remarks TEXT NOT NULL,
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_withdrawals_date ON public.withdrawals(date);

-- 9. Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL,
    action TEXT NOT NULL,
    record_type TEXT NOT NULL,
    record_id UUID,
    record_identifier TEXT,
    details TEXT NOT NULL,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_created ON public.audit_logs(created_at DESC);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES (IDEMPOTENT)
-- ==============================================================================

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop old policies to avoid "policy already exists" errors
DROP POLICY IF EXISTS "Full access to organizations" ON public.organizations;
DROP POLICY IF EXISTS "Authenticated users have full access to organizations" ON public.organizations;
DROP POLICY IF EXISTS "Full access to settings" ON public.settings;
DROP POLICY IF EXISTS "Authenticated users access to settings" ON public.settings;
DROP POLICY IF EXISTS "Full access to customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users access to customers" ON public.customers;
DROP POLICY IF EXISTS "Full access to bills" ON public.bills;
DROP POLICY IF EXISTS "Authenticated users access to bills" ON public.bills;
DROP POLICY IF EXISTS "Full access to bill_items" ON public.bill_items;
DROP POLICY IF EXISTS "Authenticated users access to bill_items" ON public.bill_items;
DROP POLICY IF EXISTS "Full access to payments" ON public.payments;
DROP POLICY IF EXISTS "Authenticated users access to payments" ON public.payments;
DROP POLICY IF EXISTS "Full access to withdrawals" ON public.withdrawals;
DROP POLICY IF EXISTS "Full access to audit_logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Authenticated users access to audit_logs" ON public.audit_logs;

-- Allow full access to anon & authenticated clients (Single store / Admin auth)
CREATE POLICY "Full access to organizations" ON public.organizations FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Full access to settings" ON public.settings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Full access to customers" ON public.customers FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Full access to bills" ON public.bills FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Full access to bill_items" ON public.bill_items FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Full access to payments" ON public.payments FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Full access to withdrawals" ON public.withdrawals FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Full access to audit_logs" ON public.audit_logs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
