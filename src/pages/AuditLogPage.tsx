import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { formatDate } from '../lib/utils';
import { AuditLog } from '../types';
import { Card } from '../components/ui/Card';
import { History, ShieldCheck, Search } from 'lucide-react';

export const AuditLogPage: React.FC = () => {
  const { auditLogs } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const filteredLogs = auditLogs.filter((log: AuditLog) => {
    const matchesSearch =
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.record_identifier && log.record_identifier.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesAction = actionFilter === 'all' || log.action === actionFilter;

    return matchesSearch && matchesAction;
  });

  const getActionBadgeColor = (action: string) => {
    if (action.includes('CREATED') || action.includes('ADDED')) {
      return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    }
    if (action.includes('CANCELLED')) {
      return 'bg-rose-100 text-rose-800 border-rose-300';
    }
    if (action.includes('EDITED') || action.includes('UPDATED')) {
      return 'bg-amber-100 text-amber-800 border-amber-300';
    }
    return 'bg-slate-100 text-slate-800 border-slate-300';
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5 text-brand-600" />
            <span>Audit Trail & Security Logs</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable tracking of all financial actions, invoice creations, cancellations, and edits.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
          <ShieldCheck className="w-4 h-4" />
          <span>Non-Destructive Audit Mode Active</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-soft">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            placeholder="Search audit trail by bill no, user, detail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-1.5 text-xs rounded-lg border border-slate-300 bg-slate-50 focus:border-brand-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none"
          >
            <option value="all">All Actions</option>
            <option value="BILL_CREATED">Bill Created</option>
            <option value="BILL_CANCELLED">Bill Cancelled</option>
            <option value="PAYMENT_ADDED">Payment Added</option>
            <option value="CUSTOMER_CREATED">Customer Created</option>
            <option value="CUSTOMER_EDITED">Customer Edited</option>
            <option value="SETTINGS_UPDATED">Settings Updated</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <Card className="overflow-hidden p-0 border border-slate-200 shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/80 text-slate-700 font-semibold border-b border-slate-200">
                <th className="p-3.5 w-44">Timestamp</th>
                <th className="p-3.5 w-44">Action</th>
                <th className="p-3.5 w-36">Identifier</th>
                <th className="p-3.5">Audit Details</th>
                <th className="p-3.5 w-48 text-right">User</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    No audit records match the selected search.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log: AuditLog) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                      {formatDate(log.created_at, 'dd MMM yyyy, HH:mm:ss')}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getActionBadgeColor(
                          log.action
                        )}`}
                      >
                        {log.action.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono font-bold text-slate-900">
                      {log.record_identifier || '-'}
                    </td>
                    <td className="p-3.5 text-slate-800 font-medium">{log.details}</td>
                    <td className="p-3.5 text-right font-mono text-slate-500 text-[11px] truncate">
                      {log.user_email}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
