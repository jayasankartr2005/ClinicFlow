// ==============================================================================
// ClinicFlow — Administrator: Security & Action Audit Logs
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { AuditLog } from '@/types';
import { DataTable, Column } from '@/components/common/DataTable';
import { formatDateTime } from '@/lib/dateUtils';
import { ShieldCheck, User, Activity, Clock } from 'lucide-react';

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadLogs = async () => {
      try {
        setIsLoading(true);
        const data = await api.auditLogs.getAll();
        setLogs(data);
      } catch (err) {
        console.error('Failed to load audit logs', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadLogs();
  }, []);

  const columns: Column<AuditLog>[] = [
    {
      key: 'timestamp',
      header: 'Timestamp',
      render: (l) => (
        <div className="flex items-center gap-2 text-xs text-slate-600 font-mono">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{formatDateTime(l.created_at)}</span>
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Event Action',
      render: (l) => (
        <span className="font-mono text-xs font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
          {l.action}
        </span>
      ),
    },
    {
      key: 'entity',
      header: 'Resource Target',
      render: (l) => (
        <span className="text-xs font-semibold text-slate-800">
          {l.entity_type} {l.entity_id ? `(#${l.entity_id.slice(0, 8)})` : ''}
        </span>
      ),
    },
    {
      key: 'user',
      header: 'Actor Identity',
      render: (l) => (
        <span className="text-xs text-slate-700 font-medium">
          {l.user?.full_name || 'System / Service Trigger'}
        </span>
      ),
    },
    {
      key: 'details',
      header: 'Event Details',
      render: (l) => (
        <pre className="text-[11px] font-mono text-slate-600 bg-slate-100/60 p-1.5 rounded max-w-xs truncate">
          {JSON.stringify(l.details)}
        </pre>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Security & Activity Audit Logs</h1>
          <p className="text-xs text-slate-500">
            Immutable log record of system mutations, access checks, and clinical data modifications
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 font-semibold">
          <ShieldCheck className="w-4 h-4" />
          <span>Zero-Trust PostgreSQL Audit Trail</span>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={logs}
        keyExtractor={(l) => l.id}
        isLoading={isLoading}
        emptyTitle="No audit logs available"
        emptyDescription="System actions will be recorded here automatically."
      />
    </div>
  );
};
