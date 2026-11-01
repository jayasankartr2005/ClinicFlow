// ==============================================================================
// ClinicFlow — Administrator: System Reports & CSV Export Hub
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { Appointment, Department, DoctorWithDetails } from '@/types';
import { DataTable, Column } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { exportAppointmentsToCSV } from '@/lib/exportUtils';
import { formatDate, formatTime } from '@/lib/dateUtils';
import { Download, FileSpreadsheet, Filter, RefreshCw, Calendar, TrendingUp, DollarSign } from 'lucide-react';

export const SystemReports: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Multi-dimensional filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('all');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const loadReportData = async () => {
    try {
      setIsLoading(true);
      const [appts, depts, docs] = await Promise.all([
        api.appointments.getAll({
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
          doctorId: selectedDoctorId !== 'all' ? selectedDoctorId : undefined,
          status: selectedStatus !== 'all' ? (selectedStatus as any) : undefined,
        }),
        api.departments.getAll(),
        api.doctors.getAll(),
      ]);

      let filtered = appts;
      if (selectedDepartmentId !== 'all') {
        filtered = filtered.filter(a => a.doctor?.doctor_profile?.department_id === selectedDepartmentId);
      }

      setAppointments(filtered);
      setDepartments(depts);
      setDoctors(docs);
    } catch (err) {
      console.error('Error loading reports', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, [dateFrom, dateTo, selectedDoctorId, selectedDepartmentId, selectedStatus]);

  const handleExportCSV = () => {
    exportAppointmentsToCSV(appointments, `clinicflow_report_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const resetFilters = () => {
    setDateFrom('');
    setDateTo('');
    setSelectedDoctorId('all');
    setSelectedDepartmentId('all');
    setSelectedStatus('all');
  };

  // Aggregations
  const totalVolume = appointments.length;
  const completedCount = appointments.filter(a => a.status === 'completed').length;
  const cancelledCount = appointments.filter(a => a.status === 'cancelled').length;
  const estimatedRevenue = appointments
    .filter(a => a.status === 'completed')
    .reduce((sum, a) => sum + (a.doctor?.doctor_profile?.consultation_fee || 500), 0);

  const columns: Column<Appointment>[] = [
    {
      key: 'id',
      header: 'Encounter #',
      render: (a) => <span className="font-mono text-xs text-slate-500 font-bold">#{a.id.slice(0, 8)}</span>,
    },
    {
      key: 'date',
      header: 'Schedule Date',
      render: (a) => (
        <div>
          <p className="font-semibold text-slate-900">{formatDate(a.appointment_date)}</p>
          <p className="text-[11px] text-slate-400">{formatTime(a.start_time)} – {formatTime(a.end_time)}</p>
        </div>
      ),
    },
    {
      key: 'patient',
      header: 'Patient Details',
      render: (a) => (
        <div>
          <p className="font-semibold text-slate-900">{a.patient?.full_name}</p>
          <p className="text-[11px] text-slate-500">{a.patient?.phone || a.patient?.email}</p>
        </div>
      ),
    },
    {
      key: 'doctor',
      header: 'Consulting Physician',
      render: (a) => (
        <div>
          <p className="font-semibold text-slate-900">{a.doctor?.full_name}</p>
          <p className="text-[11px] text-sky-700 font-medium">{a.doctor?.doctor_profile?.department?.name || 'Care Unit'}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (a) => <StatusBadge status={a.status} variant="status" size="sm" />,
    },
    {
      key: 'fee',
      header: 'Billed Fee',
      render: (a) => (
        <span className="font-semibold text-slate-800">
          ₹{a.doctor?.doctor_profile?.consultation_fee || 500}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Clinical Reports & Export</h1>
          <p className="text-xs text-slate-500">
            Multi-parameter audit filters, clinical workload metrics, and CSV dataset export
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={resetFilters}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Reset Filters
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleExportCSV}
            leftIcon={<Download className="w-3.5 h-3.5" />}
            disabled={appointments.length === 0}
          >
            Export to CSV
          </Button>
        </div>
      </div>

      {/* Filter Matrix Card */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-100">
          <Filter className="w-4 h-4 text-sky-600" />
          <span>Report Filter Parameters</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          <Input
            label="Date From"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
          <Input
            label="Date To"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
          <Select
            label="Department"
            value={selectedDepartmentId}
            onChange={(e) => setSelectedDepartmentId(e.target.value)}
            options={[
              { value: 'all', label: 'All Departments' },
              ...departments.map(d => ({ value: d.id, label: d.name })),
            ]}
          />
          <Select
            label="Physician"
            value={selectedDoctorId}
            onChange={(e) => setSelectedDoctorId(e.target.value)}
            options={[
              { value: 'all', label: 'All Doctors' },
              ...doctors.map(d => ({ value: d.id, label: d.full_name })),
            ]}
          />
          <Select
            label="Status"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'confirmed', label: 'Confirmed' },
              { value: 'completed', label: 'Completed' },
              { value: 'pending', label: 'Pending' },
              { value: 'cancelled', label: 'Cancelled' },
              { value: 'no_show', label: 'No Show' },
            ]}
          />
        </div>
      </div>

      {/* Summary KPI Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-center shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Filtered Encounters</span>
          <span className="text-xl font-bold text-slate-900 mt-0.5 block">{totalVolume}</span>
        </div>
        <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200 text-center shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">Completed Consultations</span>
          <span className="text-xl font-bold text-emerald-900 mt-0.5 block">{completedCount}</span>
        </div>
        <div className="bg-rose-50/70 p-3.5 rounded-xl border border-rose-200 text-center shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 block">Cancelled Bookings</span>
          <span className="text-xl font-bold text-rose-900 mt-0.5 block">{cancelledCount}</span>
        </div>
        <div className="bg-sky-50/70 p-3.5 rounded-xl border border-sky-200 text-center shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 block">Estimated Revenue</span>
          <span className="text-xl font-bold text-sky-950 mt-0.5 block">₹{estimatedRevenue.toLocaleString()}</span>
        </div>
      </div>

      {/* Filtered Data Table */}
      <DataTable
        columns={columns}
        data={appointments}
        keyExtractor={(a) => a.id}
        isLoading={isLoading}
        emptyTitle="No appointments match the selected filters"
        emptyDescription="Try clearing date bounds or selecting 'All Departments'."
        pageSize={12}
      />
    </div>
  );
};
