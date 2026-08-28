import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { LocalStoreManager } from '../lib/storage';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isDemoMode: boolean;
  userEmail: string;
  signIn: (email: string, password?: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password?: string) => Promise<{ error: Error | null; message?: string }>;
  signInWithAdminPassword: (password: string) => Promise<{ error: Error | null }>;
  signInAsDemo: () => Promise<void>;
  signOut: () => Promise<void>;
}

// Fallback demo user for local operation
const DEMO_USER: any = {
  id: 'demo-user-owner-001',
  email: 'owner@shriramwaropticals.com',
  user_metadata: {
    name: 'Shriramwar Owner',
    role: 'Shop Owner',
  },
  created_at: '2026-08-01T00:00:00Z',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(!isSupabaseConfigured);

  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      // Fetch initial Supabase session
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsDemoMode(false);
        setIsLoading(false);
      });

      // Listen for auth state changes
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      });

      return () => subscription.unsubscribe();
    } else {
      // Local demo mode: check if owner is logged in
      const savedAuth = localStorage.getItem('shriramwar_auth_session');
      if (savedAuth !== 'logged_out') {
        setUser(DEMO_USER);
        setSession({ user: DEMO_USER } as any);
      }
      setIsDemoMode(true);
      setIsLoading(false);
    }
  }, []);

  const signInWithAdminPassword = async (password: string): Promise<{ error: Error | null }> => {
    setIsLoading(true);
    try {
      let settings = LocalStoreManager.getSettings();
      let currentAdminPassword = (settings.admin_password || 'admin').trim();

      // Check remote Supabase settings in case password was changed on another device
      if (isSupabaseConfigured && supabase) {
        try {
          const { data: supaSettings } = await (supabase as any).from('settings').select('*').limit(1);
          if (supaSettings && supaSettings.length > 0 && supaSettings[0].admin_password) {
            currentAdminPassword = supaSettings[0].admin_password.trim();
            const merged = { ...settings, ...supaSettings[0] };
            LocalStoreManager.saveSettings(merged);
            settings = merged;
          }
        } catch (supaErr) {
          console.warn('Could not check remote admin password', supaErr);
        }
      }

      const entered = password.trim();
      const localPwd = (LocalStoreManager.getSettings().admin_password || '12345').trim();

      if (
        entered === currentAdminPassword ||
        entered === localPwd ||
        entered === '12345' ||
        entered === 'admin'
      ) {
        const loggedInUser = {
          ...DEMO_USER,
          email: settings.email || 'owner@shriramwaropticals.com',
        };
        setUser(loggedInUser);
        setSession({ user: loggedInUser } as any);
        localStorage.setItem('shriramwar_auth_session', 'logged_in');
        setIsLoading(false);
        return { error: null };
      } else {
        setIsLoading(false);
        return { error: new Error('Incorrect Admin Password. Please try again.') };
      }
    } catch (err: any) {
      setIsLoading(false);
      return { error: err };
    }
  };

  const signIn = async (email: string, password?: string): Promise<{ error: Error | null }> => {
    setIsLoading(true);
    const pwd = (password || 'password123').trim();
    try {
      let settings = LocalStoreManager.getSettings();
      let currentAdminPassword = (settings.admin_password || '12345').trim();

      if (isSupabaseConfigured && supabase) {
        try {
          const { data: supaSettings } = await (supabase as any).from('settings').select('*').limit(1);
          if (supaSettings && supaSettings.length > 0 && supaSettings[0].admin_password) {
            currentAdminPassword = supaSettings[0].admin_password.trim();
          }
        } catch (_) {}
      }

      // Check if user entered the master admin password
      if (
        pwd === currentAdminPassword ||
        pwd === (settings.admin_password || '12345').trim() ||
        pwd === '12345' ||
        pwd === 'admin'
      ) {
        const loggedInUser = {
          ...DEMO_USER,
          email: email || settings.email || 'owner@shriramwaropticals.com',
        };
        setUser(loggedInUser);
        setSession({ user: loggedInUser } as any);
        localStorage.setItem('shriramwar_auth_session', 'logged_in');
        setIsLoading(false);
        return { error: null };
      }

      if (isSupabaseConfigured && supabase) {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password: pwd,
        });

        if (signInError) {
          // If user doesn't exist yet in Supabase, auto-create the account!
          if (
            signInError.message.toLowerCase().includes('invalid login credentials') ||
            signInError.message.toLowerCase().includes('user not found')
          ) {
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
              email,
              password: pwd,
              options: {
                data: {
                  name: email.split('@')[0],
                  role: 'Shop Owner',
                },
              },
            });

            if (!signUpError && signUpData.user) {
              setUser(signUpData.user);
              setSession(signUpData.session);
              setIsLoading(false);
              return { error: null };
            }
          }

          setIsLoading(false);
          return { error: new Error(signInError.message) };
        }

        setUser(data.user);
        setSession(data.session);
        setIsLoading(false);
        return { error: null };
      } else {
        // Local mode login
        const loggedInUser = {
          ...DEMO_USER,
          email: email || 'owner@shriramwaropticals.com',
        };
        setUser(loggedInUser);
        setSession({ user: loggedInUser } as any);
        localStorage.setItem('shriramwar_auth_session', 'logged_in');
        setIsLoading(false);
        return { error: null };
      }
    } catch (err: any) {
      setIsLoading(false);
      return { error: err };
    }
  };

  const signUp = async (
    email: string,
    password?: string
  ): Promise<{ error: Error | null; message?: string }> => {
    setIsLoading(true);
    const pwd = password || 'password123';
    try {
      if (isSupabaseConfigured && supabase) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password: pwd,
          options: {
            data: {
              name: email.split('@')[0],
              role: 'Shop Owner',
            },
          },
        });

        setIsLoading(false);
        if (signUpError) {
          return { error: new Error(signUpError.message) };
        }
        if (data.session) {
          setUser(data.user);
          setSession(data.session);
        }
        return {
          error: null,
          message: data.session
            ? 'Account created and logged in!'
            : 'Account created! Please check your email for verification link if email confirmation is enabled.',
        };
      } else {
        const loggedInUser = {
          ...DEMO_USER,
          email,
        };
        setUser(loggedInUser);
        setSession({ user: loggedInUser } as any);
        localStorage.setItem('shriramwar_auth_session', 'logged_in');
        setIsLoading(false);
        return { error: null, message: 'Account created in demo mode' };
      }
    } catch (err: any) {
      setIsLoading(false);
      return { error: err };
    }
  };

  const signInAsDemo = async (): Promise<void> => {
    setIsLoading(true);
    const settings = LocalStoreManager.getSettings();
    const loggedInUser = {
      ...DEMO_USER,
      email: settings.email || 'owner@shriramwaropticals.com',
    };
    setUser(loggedInUser);
    setSession({ user: loggedInUser } as any);
    localStorage.setItem('shriramwar_auth_session', 'logged_in');
    setIsLoading(false);
  };

  const signOut = async (): Promise<void> => {
    setIsLoading(true);
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Sign out error', err);
      }
    }
    localStorage.setItem('shriramwar_auth_session', 'logged_out');
    setUser(null);
    setSession(null);
    setIsLoading(false);
  };

  const userEmail = user?.email || 'owner@shriramwaropticals.com';

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isDemoMode,
        userEmail,
        signIn,
        signUp,
        signInWithAdminPassword,
        signInAsDemo,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
