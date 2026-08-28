import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useShopSettings } from '../contexts/ShopSettingsContext';
import { useToast } from '../contexts/ToastContext';
import { Glasses, Lock, Mail, ArrowRight, ShieldCheck, KeyRound } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export const LoginPage: React.FC<{ onLoginSuccess?: () => void }> = ({ onLoginSuccess }) => {
  const { signIn, signInWithAdminPassword } = useAuth();
  const { settings } = useShopSettings();
  const { success, error } = useToast();

  const [authMethod, setAuthMethod] = useState<'admin_pin' | 'email'>('admin_pin');
  const [adminPin, setAdminPin] = useState('');
  const [email, setEmail] = useState(settings.email || 'owner@shriramwaropticals.com');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAdminPinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPin) {
      error('Password Required', 'Please enter your Admin Password');
      return;
    }
    setIsLoading(true);
    const { error: pinError } = await signInWithAdminPassword(adminPin);
    if (pinError) {
      error('Access Denied', pinError.message);
    } else {
      success('Welcome Back!', `Signed in as ${settings.shop_name} Owner`);
      if (onLoginSuccess) onLoginSuccess();
    }
    setIsLoading(false);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const { error: signInError } = await signIn(email, password);
    if (signInError) {
      error('Login Failed', signInError.message);
    } else {
      success('Welcome Back!', `Signed in as ${email}`);
      if (onLoginSuccess) onLoginSuccess();
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Gradient Glow */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-500 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-sky-500 rounded-full blur-3xl" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        {/* Brand Logo or Icon */}
        <div className="flex justify-center mb-3">
          {settings.logo_url ? (
            <div className="p-2 bg-white/10 backdrop-blur rounded-2xl border border-white/20 shadow-elevation">
              <img
                src={settings.logo_url}
                alt={settings.shop_name}
                className="h-16 w-auto max-w-[220px] object-contain rounded-xl"
              />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-sky-400 flex items-center justify-center shadow-elevation">
              <Glasses className="w-10 h-10 text-white" />
            </div>
          )}
        </div>

        <h2 className="text-2xl font-extrabold tracking-tight text-white uppercase">
          {settings.shop_name}
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          Optical Shop Billing & Accounts Management
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-100 space-y-6">
          {/* Method Selector */}
          <div className="flex rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setAuthMethod('admin_pin')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                authMethod === 'admin_pin'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              🔑 Owner Admin Password
            </button>
            <button
              type="button"
              onClick={() => setAuthMethod('email')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                authMethod === 'email'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              ✉️ Email Sign In
            </button>
          </div>

          {authMethod === 'admin_pin' ? (
            <form className="space-y-4" onSubmit={handleAdminPinSubmit}>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Owner Security Password / PIN
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    placeholder="Enter Admin Password (default: admin)"
                    value={adminPin}
                    onChange={(e) => setAdminPin(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Default password is <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono font-bold text-slate-700">admin</code>. You can change this in <strong>Settings</strong> anytime.
                </p>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="w-full font-bold shadow-lg shadow-brand-600/30"
              >
                Unlock & Open Store
              </Button>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={handleEmailSubmit}>
              <Input
                label="Email Address"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4" />}
              />

              <Input
                label="Password"
                type="password"
                required
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="w-full font-bold shadow-lg shadow-brand-600/30"
              >
                Sign In to Dashboard
              </Button>
            </form>
          )}

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 pt-2 border-t border-slate-100">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Authorized Access Only • Protected Store</span>
          </div>
        </div>
      </div>
    </div>
  );
};
