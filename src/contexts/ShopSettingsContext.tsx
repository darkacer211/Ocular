import React, { createContext, useContext, useState, useEffect } from 'react';
import { ShopSettings } from '../types';
import { LocalStoreManager } from '../lib/storage';
import { initialShopSettings } from '../lib/mockData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface ShopSettingsContextType {
  settings: ShopSettings;
  updateSettings: (newSettings: ShopSettings) => void;
  resetSettings: () => void;
}

const ShopSettingsContext = createContext<ShopSettingsContextType | undefined>(undefined);

export const ShopSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<ShopSettings>(() => {
    LocalStoreManager.initialize();
    return LocalStoreManager.getSettings();
  });

  // Sync settings with Supabase on mount
  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      (supabase as any)
        .from('settings')
        .select('*')
        .limit(1)
        .then(async ({ data, error }: any) => {
          if (!error && data && data.length > 0) {
            const remoteSettings = data[0];
            const currentLocal = LocalStoreManager.getSettings();
            
            // Merge remote into local
            const merged: ShopSettings = { ...currentLocal, ...remoteSettings };
            LocalStoreManager.saveSettings(merged);
            setSettings(merged);
          } else if (!error && (!data || data.length === 0)) {
            // Supabase settings table is empty: Push current local settings to Supabase!
            try {
              const currentLocal = LocalStoreManager.getSettings();
              await (supabase as any).from('settings').insert([currentLocal]);
            } catch (insertErr) {
              console.warn('Could not seed initial settings to Supabase', insertErr);
            }
          }
        });
    }
  }, []);

  const updateSettings = async (newSettings: ShopSettings) => {
    const saved = LocalStoreManager.saveSettings(newSettings);
    setSettings(saved);

    if (isSupabaseConfigured && supabase) {
      try {
        const { data: existing } = await (supabase as any).from('settings').select('id').limit(1);
        const { admin_password, ...dbPayload } = saved as any;
        
        // Try saving full payload, fallback without admin_password if column doesn't exist yet
        try {
          if (existing && existing.length > 0) {
            await (supabase as any).from('settings').update(saved).eq('id', existing[0].id);
          } else {
            await (supabase as any).from('settings').insert([saved]);
          }
        } catch (_) {
          if (existing && existing.length > 0) {
            await (supabase as any).from('settings').update(dbPayload).eq('id', existing[0].id);
          } else {
            await (supabase as any).from('settings').insert([dbPayload]);
          }
        }
      } catch (err) {
        console.warn('Failed to sync settings to Supabase', err);
      }
    }
  };

  const resetSettings = () => {
    const saved = LocalStoreManager.saveSettings(initialShopSettings);
    setSettings(saved);
  };

  return (
    <ShopSettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </ShopSettingsContext.Provider>
  );
};

export const useShopSettings = (): ShopSettingsContextType => {
  const context = useContext(ShopSettingsContext);
  if (!context) {
    throw new Error('useShopSettings must be used within a ShopSettingsProvider');
  }
  return context;
};
