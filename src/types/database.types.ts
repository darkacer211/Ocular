export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          owner_id: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          owner_id: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          owner_id?: string
          created_at?: string
        }
      }
      customers: {
        Row: {
          id: string
          organization_id: string
          name: string
          mobile: string
          email: string | null
          address: string | null
          city: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id?: string
          name: string
          mobile: string
          email?: string | null
          address?: string | null
          city?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          mobile?: string
          email?: string | null
          address?: string | null
          city?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      bills: {
        Row: {
          id: string
          organization_id: string
          customer_id: string
          customer_name: string
          customer_mobile: string
          customer_address: string | null
          bill_number: string
          bill_date: string
          due_date: string | null
          prescription: Json | null
          subtotal: number
          discount_amount: number
          tax_amount: number
          total_amount: number
          advance_amount: number
          cash_amount: number
          upi_amount: number
          total_paid: number
          remaining_amount: number
          payment_status: string
          payment_mode: string
          notes: string | null
          is_cancelled: boolean
          cancellation_date: string | null
          cancellation_reason: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id?: string
          customer_id: string
          customer_name: string
          customer_mobile: string
          customer_address?: string | null
          bill_number: string
          bill_date?: string
          due_date?: string | null
          prescription?: Json | null
          subtotal?: number
          discount_amount?: number
          tax_amount?: number
          total_amount: number
          advance_amount?: number
          cash_amount?: number
          upi_amount?: number
          total_paid?: number
          remaining_amount?: number
          payment_status?: string
          payment_mode?: string
          notes?: string | null
          is_cancelled?: boolean
          cancellation_date?: string | null
          cancellation_reason?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          customer_id?: string
          customer_name?: string
          customer_mobile?: string
          customer_address?: string | null
          bill_number?: string
          bill_date?: string
          due_date?: string | null
          prescription?: Json | null
          subtotal?: number
          discount_amount?: number
          tax_amount?: number
          total_amount?: number
          advance_amount?: number
          cash_amount?: number
          upi_amount?: number
          total_paid?: number
          remaining_amount?: number
          payment_status?: string
          payment_mode?: string
          notes?: string | null
          is_cancelled?: boolean
          cancellation_date?: string | null
          cancellation_reason?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      bill_items: {
        Row: {
          id: string
          bill_id: string
          item_type: string
          product_name: string
          brand: string | null
          model_number: string | null
          quantity: number
          unit_price: number
          discount: number
          tax_rate: number
          tax_amount: number
          total_price: number
        }
        Insert: {
          id?: string
          bill_id: string
          item_type: string
          product_name: string
          brand?: string | null
          model_number?: string | null
          quantity?: number
          unit_price: number
          discount?: number
          tax_rate?: number
          tax_amount?: number
          total_price: number
        }
        Update: {
          id?: string
          bill_id?: string
          item_type?: string
          product_name?: string
          brand?: string | null
          model_number?: string | null
          quantity?: number
          unit_price?: number
          discount?: number
          tax_rate?: number
          tax_amount?: number
          total_price?: number
        }
      }
      payments: {
        Row: {
          id: string
          organization_id: string
          bill_id: string
          bill_number: string
          customer_id: string
          customer_name: string
          customer_mobile: string
          payment_date: string
          amount: number
          payment_mode: string
          reference_number: string | null
          notes: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id?: string
          bill_id: string
          bill_number: string
          customer_id: string
          customer_name: string
          customer_mobile: string
          payment_date?: string
          amount: number
          payment_mode: string
          reference_number?: string | null
          notes?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          bill_id?: string
          bill_number?: string
          customer_id?: string
          customer_name?: string
          customer_mobile?: string
          payment_date?: string
          amount?: number
          payment_mode?: string
          reference_number?: string | null
          notes?: string | null
          created_by?: string | null
          created_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          organization_id: string
          user_email: string
          action: string
          record_type: string
          record_id: string | null
          record_identifier: string | null
          details: string
          ip_address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id?: string
          user_email: string
          action: string
          record_type: string
          record_id?: string | null
          record_identifier?: string | null
          details: string
          ip_address?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          user_email?: string
          action?: string
          record_type?: string
          record_id?: string | null
          record_identifier?: string | null
          details?: string
          ip_address?: string | null
          created_at?: string
        }
      }
      settings: {
        Row: {
          id: string
          organization_id: string
          shop_name: string
          tagline: string
          address: string
          city: string
          state: string
          pincode: string
          phone_number: string
          secondary_phone: string | null
          email: string
          gst_number: string | null
          dl_number: string | null
          invoice_prefix: string
          currency_symbol: string
          receipt_footer_text: string
          upi_id: string | null
          upi_payee_name: string | null
          enable_upi_qr: boolean
          terms_conditions: string | null
          logo_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id?: string
          shop_name?: string
          tagline?: string
          address?: string
          city?: string
          state?: string
          pincode?: string
          phone_number?: string
          secondary_phone?: string | null
          email?: string
          gst_number?: string | null
          dl_number?: string | null
          invoice_prefix?: string
          currency_symbol?: string
          receipt_footer_text?: string
          upi_id?: string | null
          upi_payee_name?: string | null
          enable_upi_qr?: boolean
          terms_conditions?: string | null
          logo_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          shop_name?: string
          tagline?: string
          address?: string
          city?: string
          state?: string
          pincode?: string
          phone_number?: string
          secondary_phone?: string | null
          email?: string
          gst_number?: string | null
          dl_number?: string | null
          invoice_prefix?: string
          currency_symbol?: string
          receipt_footer_text?: string
          upi_id?: string | null
          upi_payee_name?: string | null
          enable_upi_qr?: boolean
          terms_conditions?: string | null
          logo_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
