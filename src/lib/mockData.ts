import { Customer, Bill, Payment, ShopSettings, AuditLog } from '../types';

export const initialShopSettings: ShopSettings = {
  shop_name: 'SHRIRAMWAR OPTICALS',
  tagline: 'Precision Eye Care & Designer Eyewear',
  address: 'Near Baliram patil school, besides shiva medical,CIDCO-N9, Chh. Sambhajinagar, Maharashtra - 431601',
  city: 'Chh. Sambhajinagar',
  state: 'Maharashtra',
  pincode: '431601',
  phone_number: '+91 9765062611',
  secondary_phone: '',
  email: 'contact@shriramwaropticals.com',
  gst_number: '',
  dl_number: '',
  invoice_prefix: 'BILL',
  currency_symbol: '₹',
  receipt_footer_text: 'Thank you for choosing Shriramwar Opticals! Please visit again.',
  upi_id: 'anusurya611-1@okicici',
  upi_payee_name: 'Shriramwar Opticals',
  enable_upi_qr: true,
  logo_url: '/logo.jpg',
  admin_password: 'admin',
  terms_conditions: '1. Goods once sold will not be taken back without original receipt.\n2. Warranty on frames/coatings as per manufacturer policy.',
};

export const initialCustomers: Customer[] = [];
export const initialBills: Bill[] = [];
export const initialPayments: Payment[] = [];
export const initialAuditLogs: AuditLog[] = [];
