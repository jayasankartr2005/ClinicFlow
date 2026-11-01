// ==============================================================================
// ClinicFlow — Supercoordinator: Platform Operator Dashboard
// Multi-Tenant Platform Oversight, Hospital Network & WhatsApp Telemetry
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { Hospital, AuditLog, Profile } from '@/types';
import { StatCard, LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { DataTable, Column } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatDate } from '@/lib/dateUtils';
import { 
  Building2, 
  Users, 
  Stethoscope, 
  Calendar, 
  MessageSquare, 
  ShieldCheck, 
  Activity, 
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const SupercoordinatorDashboard: React.FC = () => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [messageCount, setMessageCount] = useState(0);
  const [appointmentCount, setAppointmentCount] = useState(0);
  const [patientCount, setPatientCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPlatformData = async () => {
      try {
        setIsLoading(true);
        const [hList, uList, logs, msgs, appts, pats] = await Promise.all([
          api.hospitals.getAll(),
          api.users.getAll(),
          api.auditLogs.getAll(),
          api.whatsapp.getMessages(),
          api.appointments.getAll(),
          api.patients.getAll(),
        ]);

        setHospitals(hList);
        setUsers(uList);
        setAuditLogs(logs.slice(0, 5));
        setMessageCount(msgs.length);
        setAppointmentCount(appts.length);
        setPatientCount(pats.length);
      } catch (err) {
        console.error('Failed to load supercoordinator dashboard', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadPlatformData();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton type="cards" rows={4} />
        <LoadingSkeleton type="table" rows={5} />
      </div>
    );
  }

  const doctorsCount = users.filter(u => u.role === 'doctor').length;
  const activeHospitals = hospitals.filter(h => h.whatsapp_enabled).length;

  const hospitalColumns: Column<Hospital>[] = [
    {
      key: 'name',
      header: 'Hospital Entity',
      render: (h) => (
        <div>
          <p className="font-bold text-slate-900 text-sm">{h.name}</p>
          <p className="text-xs text-slate-500">{h.address || h.email}</p>
        </div>
      ),
    },
    {
      key: 'slug',
      header: 'Slug / Domain',
      render: (h) => (
        <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
          {h.slug}
        </span>
      ),
    },
    {
      key: 'whatsapp',
      header: 'WhatsApp Cloud Status',
      render: (h) => (
        <div className="flex items-center gap-2">
          {h.whatsapp_enabled ? (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Connected
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
              <AlertCircle className="w-3 h-3 text-slate-400" />
              Disabled
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'whatsapp_phone_id',
      header: 'Phone Number ID',
      render: (h) => (
        <span className="font-mono text-[11px] text-slate-500">
          {h.whatsapp_phone_number_id || 'Not configured'}
        </span>
      ),
    },
    {
      key: 'created_at',
      header: 'Onboarded',
      render: (h) => (
        <span className="text-xs text-slate-600">{formatDate(h.created_at)}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-md border border-slate-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              ClinicFlow Platform Operator Context
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">
              Supercoordinator Control Center
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              Multi-tenant healthcare administration, cross-hospital governance, and Meta WhatsApp integration telemetry
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/supercoordinator/hospitals"
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors flex items-center gap-2"
            >
              <Building2 className="w-4 h-4" />
              Manage Hospitals
            </Link>
            <Link
              to="/supercoordinator/whatsapp"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              WhatsApp Monitor
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Onboarded Hospitals"
          value={hospitals.length}
          subtitle={`${activeHospitals} WhatsApp active`}
          icon={Building2}
          color="sky"
        />
        <StatCard
          title="Medical Specialists"
          value={doctorsCount}
          subtitle="Across network"
          icon={Stethoscope}
          color="emerald"
        />
        <StatCard
          title="Registered Patients"
          value={patientCount}
          subtitle="Hospital DB entities"
          icon={Users}
          color="purple"
        />
        <StatCard
          title="Total Consultations"
          value={appointmentCount}
          subtitle="Atomic bookings"
          icon={Calendar}
          color="amber"
        />
        <StatCard
          title="WhatsApp Telemetry"
          value={messageCount}
          subtitle="Processed events"
          icon={MessageSquare}
          color="rose"
        />
      </div>

      {/* Hospitals Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Registered Hospital Network</h2>
            <p className="text-xs text-slate-500">Autonomous tenants with strict row-level database isolation</p>
          </div>
          <Link
            to="/supercoordinator/hospitals"
            className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
          >
            Manage all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <DataTable
          columns={hospitalColumns}
          data={hospitals}
          keyExtractor={(h) => h.id}
        />
      </div>

      {/* Bottom Grid: Platform Telemetry & Audit Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* WhatsApp Cloud API Integration Status */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">WhatsApp Integration Architecture</h3>
                <p className="text-[11px] text-slate-500">Meta Cloud API $\rightarrow$ Edge Function Webhook</p>
              </div>
            </div>
            <Link
              to="/supercoordinator/whatsapp"
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              Open simulator <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-slate-500 block">Webhook Verification State</span>
                <span className="font-semibold text-slate-800">GET Verification Handler Ready</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px]">
                ACTIVE
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-slate-500 block">Concurrency Engine</span>
                <span className="font-semibold text-slate-800">book_appointment_atomic() RPC</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 font-bold text-[10px]">
                TRANSACTIONAL
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-slate-500 block">Webhook Idempotency Key</span>
                <span className="font-semibold text-slate-800">whatsapp_message_id unique guard</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[10px]">
                ENFORCED
              </span>
            </div>
          </div>
        </div>

        {/* Security & Audit Events */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Platform Security Audit Log</h3>
                <p className="text-[11px] text-slate-500">Cross-tenant operational event stream</p>
              </div>
            </div>
            <Link
              to="/supercoordinator/audit-logs"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 flex items-start justify-between text-xs"
              >
                <div className="space-y-0.5">
                  <span className="font-mono font-semibold text-indigo-700 text-[11px] block">
                    {log.action}
                  </span>
                  <p className="text-slate-600 text-[11px]">{log.entity_type} {log.entity_id ? `(#${log.entity_id.slice(0, 8)})` : ''}</p>
                </div>
                <span className="text-[10px] text-slate-400">{formatDate(log.created_at)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
