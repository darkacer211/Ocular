import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import {
  ExternalLink,
  ShieldCheck,
  Copy,
  PlayCircle,
} from 'lucide-react';

export const SupabaseGuidePage: React.FC = () => {
  const { isSupabaseLive, refreshData } = useData();
  const { success, error } = useToast();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);

  const copyToClipboard = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    success('Copied to Clipboard!', `${keyName} copied.`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    try {
      await refreshData();
      if (isSupabaseLive) {
        success('Supabase Connected!', 'Connected successfully to your PostgreSQL database.');
      } else {
        error(
          'Not Connected to Supabase',
          'Operating in local demo mode. Make sure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are saved in your .env file and restart the dev server.'
        );
      }
    } catch (err: any) {
      error('Connection Failed', err.message || 'Check your URL and Anon public key');
    } finally {
      setTestingConnection(false);
    }
  };

  const envTemplate = `# .env file for Shriramwar Opticals
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_ENABLE_DEMO_DATA=true`;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-optic-navy to-brand-950 p-6 rounded-2xl text-white shadow-elevation flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isSupabaseLive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span className="text-xs font-bold uppercase tracking-wider text-brand-300">
              {isSupabaseLive ? 'Supabase Live Connected' : 'Local Offline Mode (Ready to Connect)'}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight mt-1">
            Supabase Free-Tier Setup Guide
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Follow this 12-step click-by-click walkthrough to link your free PostgreSQL cloud database.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="sm"
            onClick={handleTestConnection}
            isLoading={testingConnection}
            leftIcon={<PlayCircle className="w-4 h-4" />}
            className="font-bold"
          >
            Test Connection
          </Button>
          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-white text-slate-900 rounded-lg hover:bg-slate-100 transition-colors shadow-sm"
          >
            <span>Open Supabase</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Critical Security Warning Callout */}
      <div className="bg-rose-50 border-2 border-rose-300 rounded-xl p-4 text-xs text-rose-900 space-y-2">
        <div className="flex items-center gap-2 font-bold text-rose-800 text-sm">
          <ShieldCheck className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span>CRITICAL SECURITY RULE: API KEY SAFETY</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="p-3 bg-white rounded-lg border border-rose-200">
            <span className="font-bold text-emerald-700 block mb-1">
              ✓ SAFE for `.env` & Frontend:
            </span>
            <p className="text-slate-700 font-mono text-[11px]">
              <strong>Project URL</strong> & <strong>anon public</strong> key
            </p>
            <p className="text-slate-500 text-[10px] mt-1">
              These are designed to be public and are strictly protected by Row Level Security (RLS).
            </p>
          </div>

          <div className="p-3 bg-white rounded-lg border border-rose-300">
            <span className="font-bold text-rose-700 block mb-1">
              ✕ NEVER Expose or Paste in Frontend:
            </span>
            <p className="text-slate-700 font-mono text-[11px]">
              <strong>service_role secret</strong> key
            </p>
            <p className="text-slate-500 text-[10px] mt-1">
              The service_role key bypasses RLS and gives root database access. Never use it in React code!
            </p>
          </div>
        </div>
      </div>

      {/* 12-Step Walkthrough */}
      <div className="space-y-4">
        {/* Step 1 & 2 */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs">
                1
              </span>
              <CardTitle>Create a Free Supabase Account & Project</CardTitle>
            </div>
          </CardHeader>
          <div className="text-xs text-slate-700 space-y-2">
            <p>
              1. Visit{' '}
              <a
                href="https://supabase.com"
                target="_blank"
                rel="noreferrer"
                className="text-brand-600 underline font-semibold"
              >
                supabase.com
              </a>{' '}
              and click <strong>"Start your project"</strong> (Sign up free with GitHub or Email).
            </p>
            <p>
              2. Click <strong>"New Project"</strong> on your dashboard.
            </p>
            <p>
              3. <strong>Project Name</strong>: Enter <code className="bg-slate-100 px-1 py-0.5 rounded font-bold">Shriramwar Opticals</code>.
            </p>
            <p>
              4. <strong>Database Password</strong>: Choose a strong password and save it securely.
            </p>
            <p>
              5. <strong>Region</strong>: Select{' '}
              <strong className="text-brand-700">South Asia (Mumbai - ap-south-1)</strong> or the closest region to India for maximum speed.
            </p>
            <p>6. Pricing Plan: Choose <strong>Free Tier ($0/month)</strong>.</p>
          </div>
        </Card>

        {/* Step 3: Extract Keys */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs">
                2
              </span>
              <CardTitle>Obtain Project URL and Publishable Anon Key</CardTitle>
            </div>
          </CardHeader>
          <div className="text-xs text-slate-700 space-y-2">
            <p>
              1. In your project dashboard, navigate to the left sidebar and click{' '}
              <strong>Project Settings (gear icon)</strong> &rarr; <strong>API</strong>.
            </p>
            <p>
              2. Under <strong>Project URL</strong>, copy the URL (e.g.{' '}
              <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-[11px]">
                https://abcdefghijkl.supabase.co
              </code>
              ).
            </p>
            <p>
              3. Under <strong>Project API Keys</strong>, locate the key labeled{' '}
              <span className="font-bold text-emerald-700">anon public</span>. Copy it.
            </p>
            <p className="text-slate-500 italic">
              (Leave the secret service_role key untouched).
            </p>
          </div>
        </Card>

        {/* Step 4: Run SQL Schema */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs">
                3
              </span>
              <CardTitle>Run Database Schema in SQL Editor</CardTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(envTemplate, '.env Configuration')}
              leftIcon={<Copy className="w-3.5 h-3.5" />}
              className="text-xs"
            >
              {copiedKey === '.env Configuration' ? 'Copied!' : 'Copy .env Template'}
            </Button>
          </CardHeader>
          <div className="text-xs text-slate-700 space-y-2">
            <p>
              1. In Supabase, click <strong>SQL Editor</strong> on the left menu.
            </p>
            <p>
              2. Click <strong>"New Query"</strong>.
            </p>
            <p>
              3. Open the file{' '}
              <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-brand-700">
                supabase_schema.sql
              </code>{' '}
              in your project workspace, copy all lines, paste them into the SQL editor, and click{' '}
              <strong>"RUN"</strong>.
            </p>
            <p>
              4. This creates all tables (<code className="font-mono">customers</code>,{' '}
              <code className="font-mono">bills</code>, <code className="font-mono">payments</code>,{' '}
              <code className="font-mono">audit_logs</code>, <code className="font-mono">settings</code>
              ), calculation triggers, and Row Level Security policies automatically.
            </p>
          </div>
        </Card>

        {/* Step 5: Configure .env */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs">
                4
              </span>
              <CardTitle>Update .env in Your Workspace</CardTitle>
            </div>
          </CardHeader>
          <div className="text-xs text-slate-700 space-y-3">
            <p>
              Open <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono">.env</code> in your
              root folder and paste your keys:
            </p>
            <pre className="bg-slate-900 text-slate-100 p-3 rounded-xl font-mono text-[11px] overflow-x-auto">
              {envTemplate}
            </pre>
            <p>
              After saving <code className="font-mono">.env</code>, restart your Vite dev server (<code className="font-mono">npm run dev</code>), and click <strong>"Test Connection"</strong> at the top of this page!
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};
