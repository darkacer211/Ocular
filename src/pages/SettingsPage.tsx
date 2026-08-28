import React, { useState } from 'react';
import { useShopSettings } from '../contexts/ShopSettingsContext';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import { ShopSettings } from '../types';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import {
  Settings as SettingsIcon,
  Store,
  FileText,
  QrCode,
  Sparkles,
  Save,
  Image as ImageIcon,
  KeyRound,
  Upload,
  Trash2,
  Lock,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings, resetSettings } = useShopSettings();
  const { resetDemoData } = useData();
  const { success, warning } = useToast();

  const [form, setForm] = useState<ShopSettings>({ ...settings });
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [newAdminPassword, setNewAdminPassword] = useState(settings.admin_password || 'admin');

  const handleChange = (field: keyof ShopSettings, value: any) => {
    setForm((prev: ShopSettings) => ({ ...prev, [field]: value }));
  };

  // Handle Logo Upload from Local Computer File
  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      warning('Invalid File', 'Please select an image file (PNG, JPG, SVG, WebP)');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      warning('File Too Large', 'Please upload a logo image under 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      handleChange('logo_url', base64);
      success('Logo Loaded', 'Image loaded. Click "Save Store Settings" to apply.');
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedForm = {
      ...form,
      admin_password: newAdminPassword.trim() || 'admin',
    };
    updateSettings(updatedForm);
    success('Settings Saved', 'Optical shop settings, logo, and admin password updated.');
  };

  const handleConfirmReset = () => {
    resetSettings();
    resetDemoData();
    setForm(settings);
    setNewAdminPassword('admin');
    setIsResetConfirmOpen(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-brand-600" />
            <span>Store & Billing Settings</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure optical store branding, logo, admin security password, and receipt parameters.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsResetConfirmOpen(true)}
          leftIcon={<Trash2 className="w-4 h-4 text-rose-500" />}
          className="text-xs text-rose-600 hover:bg-rose-50 border-rose-200 font-semibold"
        >
          Clear All Data (Fresh Start)
        </Button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. Store Logo & Branding */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-brand-600" />
              <CardTitle>Optical Shop Logo & Brand Icon</CardTitle>
            </div>
          </CardHeader>

          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* Logo Preview Area */}
            <div className="flex flex-col items-center gap-2">
              <div className="w-28 h-28 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center p-2 overflow-hidden shadow-inner">
                {form.logo_url ? (
                  <img
                    src={form.logo_url}
                    alt="Logo Preview"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-center text-slate-400">
                    <ImageIcon className="w-8 h-8 mx-auto mb-1 opacity-50" />
                    <span className="text-[10px] font-semibold">No Logo</span>
                  </div>
                )}
              </div>

              {form.logo_url && (
                <button
                  type="button"
                  onClick={() => handleChange('logo_url', '')}
                  className="inline-flex items-center gap-1 text-[11px] text-rose-600 font-semibold hover:underline"
                >
                  <Trash2 className="w-3 h-3" /> Remove
                </button>
              )}
            </div>

            {/* Upload Controls */}
            <div className="flex-1 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Upload Logo Image File
                </label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-50 text-brand-700 border border-brand-200 text-xs font-bold hover:bg-brand-100 transition-colors shadow-sm">
                    <Upload className="w-4 h-4" />
                    <span>Choose Image from Computer</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoFileUpload}
                      className="hidden"
                    />
                  </label>
                  <span className="text-[11px] text-slate-400">PNG, JPG, SVG up to 2MB</span>
                </div>
              </div>

              <div>
                <Input
                  label="Or Paste Image Logo URL"
                  placeholder="https://example.com/logo.png"
                  value={form.logo_url || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('logo_url', e.target.value)}
                  helperText="Your logo appears on Invoices, Topbar, Sidebar, and Login screen."
                />
              </div>
            </div>
          </div>
        </Card>

        {/* 2. Admin Master Password & Security */}
        <Card className="border-l-4 border-l-brand-600">
          <CardHeader>
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-brand-600" />
              <CardTitle>Owner Admin Security Password</CardTitle>
            </div>
          </CardHeader>

          <div className="space-y-3">
            <p className="text-xs text-slate-600">
              Set a master password so that only you (the shop owner) can log in and manage the store.
            </p>
            <div className="max-w-md">
              <Input
                label="Master Admin Password"
                type="password"
                required
                value={newAdminPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewAdminPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                helperText="Use this password to log in directly on the Login page."
              />
            </div>
          </div>
        </Card>

        {/* 3. Store Profile Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 text-brand-600" />
              <CardTitle>Optical Shop Profile & Branding</CardTitle>
            </div>
          </CardHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Optical Shop Name"
              required
              value={form.shop_name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('shop_name', e.target.value)}
            />
            <Input
              label="Tagline / Slogan"
              value={form.tagline}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('tagline', e.target.value)}
            />
            <Input
              label="Primary Phone Number"
              required
              value={form.phone_number}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('phone_number', e.target.value)}
            />
            <Input
              label="Secondary Phone / WhatsApp"
              value={form.secondary_phone || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('secondary_phone', e.target.value)}
            />
            <Input
              label="Email Address"
              type="email"
              value={form.email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('email', e.target.value)}
            />
            <Input
              label="GSTIN Number (Optional)"
              value={form.gst_number || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('gst_number', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            <div className="sm:col-span-2">
              <Input
                label="Shop Street Address"
                value={form.address}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('address', e.target.value)}
              />
            </div>
            <Input
              label="City"
              value={form.city}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('city', e.target.value)}
            />
          </div>
        </Card>

        {/* 4. Invoicing & Receipt Preferences */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-brand-600" />
              <CardTitle>Invoice & Receipt Configuration</CardTitle>
            </div>
          </CardHeader>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Invoice Number Prefix"
              value={form.invoice_prefix}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('invoice_prefix', e.target.value)}
              helperText="e.g. BILL -> BILL-2026-0001"
            />
            <Input
              label="Currency Symbol"
              value={form.currency_symbol}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('currency_symbol', e.target.value)}
            />
            <Input
              label="Optical License / DL No."
              value={form.dl_number || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('dl_number', e.target.value)}
            />
          </div>

          <div className="mt-4">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
              Receipt Footer Message
            </label>
            <textarea
              rows={2}
              value={form.receipt_footer_text}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange('receipt_footer_text', e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div className="mt-4">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
              Terms & Conditions (Printed on receipts)
            </label>
            <textarea
              rows={3}
              value={form.terms_conditions || ''}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange('terms_conditions', e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-brand-500 focus:outline-none"
            />
          </div>
        </Card>

        {/* 5. UPI & Digital Payments */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <QrCode className="w-4 h-4 text-indigo-600" />
              <CardTitle>UPI QR Code & Payments</CardTitle>
            </div>
          </CardHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Store UPI VPA / ID (e.g. yourname@okicici)"
              placeholder="e.g. shriramwaropticals@okicici"
              value={form.upi_id || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('upi_id', e.target.value)}
            />
            <Input
              label="UPI Payee Display Name"
              placeholder="e.g. Shriramwar Opticals"
              value={form.upi_payee_name || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('upi_payee_name', e.target.value)}
            />
          </div>

          <div className="mt-4 flex items-center gap-3">
            <input
              type="checkbox"
              id="enable_upi_qr"
              checked={form.enable_upi_qr}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('enable_upi_qr', e.target.checked)}
              className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
            />
            <label htmlFor="enable_upi_qr" className="text-xs font-semibold text-slate-800">
              Print UPI QR Code Box on Invoices with Remaining Balances
            </label>
          </div>
        </Card>

        {/* Save Bar */}
        <div className="flex items-center justify-end gap-3 p-4 rounded-xl bg-white border border-slate-200 shadow-soft">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setForm(settings);
              setNewAdminPassword(settings.admin_password || 'admin');
            }}
          >
            Discard Changes
          </Button>
          <Button
            type="submit"
            variant="primary"
            leftIcon={<Save className="w-4 h-4" />}
            className="font-bold"
          >
            Save Store Settings
          </Button>
        </div>
      </form>

      {/* Reset Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={handleConfirmReset}
        title="Clear All Data & Start Fresh?"
        message="This will clear all bills, customer ledgers, payments, and expense withdrawals to zero. Your shop profile, logo, and admin password will be kept."
        confirmText="Yes, Clear All & Start Fresh"
        variant="danger"
      />
    </div>
  );
};
