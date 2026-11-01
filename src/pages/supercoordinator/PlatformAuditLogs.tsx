// ==============================================================================
// ClinicFlow — Supercoordinator: Cross-Tenant Security Audit Logs
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { AuditLog, Hospital } from '@/types';
import { DataTable, Column } from '@/components/common/DataTable';
import { SearchFilterBar } from '@/components/common/SearchFilterBar';
import { formatDate, formatDateTime } from '@/lib/dateUtils';
import { ShieldCheck, Building2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/common/Button';

export const PlatformAuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [hList, logsList] = await Promise.all([
        api.hospitals.getAll(),
        api.auditLogs.getAll(selectedHospitalId === 'all' ? undefined : selectedHospitalId),
      ]);
      setHospitals(hList);
      setLogs(logsList);
    } catch (err) {
      console.error('Failed to load audit logs', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedHospitalId]);

  const filteredLogs = logs.filter(log => {
    if (actionFilter !== 'all' && !log.action.toLowerCase().includes(actionFilter.toLowerCase())) {
      return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchAction = log.action.toLowerCase().includes(q);
      const matchType = log.entity_type.toLowerCase().includes(q);
      const matchDetails = JSON.stringify(log.details || {}).toLowerCase().includes(q);
      return matchAction || matchType || matchDetails;
    }
    return true;
  });

  const columns: Column<AuditLog>[] = [
    {
      key: 'action',
      header: 'Event Action',
      render: (log) => (
        <div>
          <span className="font-mono text-xs font-bold text-indigo-700 block">
            {log.action}
          </span>
          <span className="text-[10px] text-slate-400">
            {log.entity_type} {log.entity_id ? `(#${log.entity_id.slice(0, 8)})` : ''}
          </span>
        </div>
      ),
    },
    {
      key: 'hospital',
      header: 'Hospital Tenant',
      render: (log) => {
        const h = hospitals.find(item => item.id === log.hospital_id);
        return (
          <div className="flex items-center gap-1.5 text-xs text-slate-700">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold">{h ? h.name : 'Platform System'}</span>
          </div>
        );
      },
    },
    {
      key: 'details',
      header: 'Operational Details',
      render: (log) => (
        <pre className="text-[11px] font-mono text-slate-600 bg-slate-50 p-1.5 rounded max-w-md truncate">
          {JSON.stringify(log.details)}
        </pre>
      ),
    },
    {
      key: 'created_at',
      header: 'Timestamp',
      render: (log) => (
        <span className="text-xs text-slate-500">{formatDateTime(log.created_at)}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Platform Security Audit Stream</h1>
          <p className="text-xs text-slate-500">
            Immutable log of system events, authentication triggers, WhatsApp bookings, and compliance mutations
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedHospitalId}
            onChange={(e) => setSelectedHospitalId(e.target.value)}
            className="text-xs font-semibold px-3 py-2 bg-white border border-slate-300 rounded-xl focus:outline-none"
          >
            <option value="all">All Hospital Tenants</option>
            {hospitals.map(h => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
          </select>
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <SearchFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Filter by action or details..."
          statusFilter={actionFilter}
          onStatusFilterChange={setActionFilter}
          statusOptions={[
            { value: 'all', label: 'All Actions' },
            { value: 'whatsapp', label: 'WhatsApp Events' },
            { value: 'appointment', label: 'Appointments' },
            { value: 'hospital', label: 'Hospital Config' },
          ]}
        />

        <DataTable
          columns={columns}
          data={filteredLogs}
          keyExtractor={(l) => l.id}
        />
      </div>
    </div>
  );
};
