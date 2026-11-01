// ==============================================================================
// ClinicFlow — Administrator: Executive Dashboard & Analytics
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { ReportSummary, Appointment } from '@/types';
import { StatCard, LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { DataTable, Column } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatDate, formatTime } from '@/lib/dateUtils';
import { 
  Users, 
  Stethoscope, 
  Calendar, 
  CheckCircle2, 
  Building2, 
  TrendingUp, 
  FileSpreadsheet, 
  ArrowRight,
  UserPlus
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';

const COLORS = ['#0284c7', '#0d9488', '#059669', '#d97706', '#8b5cf6', '#e11d48'];

import { useAuth } from '@/contexts/AuthContext';
import { MessageSquare } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user, hospital } = useAuth();
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [recentAppointments, setRecentAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        const [sum, appts] = await Promise.all([
          api.reports.getSummary(user?.hospital_id || undefined),
          api.appointments.getAll({ hospitalId: user?.hospital_id || undefined }),
        ]);
        setSummary(sum);
        setRecentAppointments(appts.slice(0, 6));
      } catch (err) {
        console.error('Error loading admin dashboard', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [user?.hospital_id]);

  if (isLoading || !summary) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton type="cards" rows={4} />
        <LoadingSkeleton type="table" rows={6} />
      </div>
    );
  }

  const columns: Column<Appointment>[] = [
    {
      key: 'date',
      header: 'Date & Time',
      render: (appt) => (
        <div>
          <p className="font-semibold text-slate-800">{formatDate(appt.appointment_date)}</p>
          <p className="text-[11px] text-slate-400">{formatTime(appt.start_time)}</p>
        </div>
      ),
    },
    {
      key: 'patient',
      header: 'Patient',
      render: (appt) => (
        <div>
          <p className="font-medium text-slate-900">{appt.patient?.full_name || 'Patient'}</p>
          <p className="text-[11px] text-slate-400">{appt.patient?.phone || appt.patient?.email}</p>
        </div>
      ),
    },
    {
      key: 'doctor',
      header: 'Doctor',
      render: (appt) => (
        <div>
          <p className="font-medium text-slate-900">{appt.doctor?.full_name || 'Doctor'}</p>
          <p className="text-[11px] text-slate-400">{appt.doctor?.doctor_profile?.department?.name || 'Specialist'}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (appt) => <StatusBadge status={appt.status} variant="status" size="sm" />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
              {hospital ? hospital.name : 'Hospital Tenant'}
            </span>
            {hospital?.whatsapp_enabled && (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                <MessageSquare className="w-3 h-3" /> WhatsApp Live
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Hospital Operations Center
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            System administration, clinical workload distribution, and patient appointment management
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/admin/reports"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Audit & Export Reports
          </Link>
          <Link
            to="/admin/users"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Manage Users
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Registered Patients"
          value={summary.totalPatients}
          icon={Users}
          color="emerald"
          subtitle="Active outpatient records"
        />
        <StatCard
          title="Practicing Specialists"
          value={summary.totalDoctors}
          icon={Stethoscope}
          color="sky"
          subtitle="Across all departments"
        />
        <StatCard
          title="Total Booked Encounters"
          value={summary.totalAppointments}
          icon={Calendar}
          color="purple"
          subtitle="Lifetime appointments"
        />
        <StatCard
          title="Completed Consultations"
          value={summary.completedAppointments}
          icon={CheckCircle2}
          color="amber"
          subtitle={`${Math.round((summary.completedAppointments / (summary.totalAppointments || 1)) * 100)}% completion rate`}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Appointment Volume Trend */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Weekly Patient Booking Velocity</h3>
              <p className="text-xs text-slate-400">Total appointments vs completed consultations</p>
            </div>
            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">
              Last 7 Days
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary.dailyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="bookings" name="Scheduled" fill="#0284c7" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completed" name="Completed" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Distribution */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Department Volume</h3>
            <p className="text-xs text-slate-400">Consultation distribution by specialty</p>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={summary.departmentBreakdown}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={3}
                >
                  {summary.departmentBreakdown.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '10px' }} layout="horizontal" verticalAlign="bottom" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Doctor Workload Breakdown */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Physician Clinical Workload</h3>
            <p className="text-xs text-slate-400">Consultation throughput across active medical staff</p>
          </div>
          <Link
            to="/admin/reports"
            className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
          >
            Full Report <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {summary.doctorWorkload.map((doc, idx) => (
            <div key={idx} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-sky-100 text-sky-700">
                  <Stethoscope className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <p className="text-xs font-bold text-slate-900 truncate">{doc.doctorName}</p>
                  <p className="text-[10px] text-slate-400">{doc.total} Total Consultations</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200">
                <span className="text-emerald-700 font-medium">✓ {doc.completed} Completed</span>
                <span className="text-rose-600 font-medium">✗ {doc.cancelled} Cancelled</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Appointments Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">Recent Appointments</h3>
          <Link
            to="/admin/reports"
            className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
          >
            View All Appointments <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <DataTable
          columns={columns}
          data={recentAppointments}
          keyExtractor={(item) => item.id}
          pageSize={6}
        />
      </div>
    </div>
  );
};
