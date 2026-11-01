// ==============================================================================
// ClinicFlow — Receptionist: Master Appointment Scheduler
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { Appointment, Department, DoctorWithDetails } from '@/types';
import { DataTable, Column } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { SearchFilterBar } from '@/components/common/SearchFilterBar';
import { Button } from '@/components/common/Button';
import { BookingModal } from '@/components/appointment/BookingModal';
import { RescheduleModal } from '@/components/appointment/RescheduleModal';
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog';
import { useToast } from '@/contexts/ToastContext';
import { formatDate, formatTime } from '@/lib/dateUtils';
import { Calendar, CalendarPlus, RefreshCw, XCircle } from 'lucide-react';

export const MasterSchedule: React.FC = () => {
  const { success, error } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedDeptId, setSelectedDeptId] = useState('all');

  // Modals
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [reschedulingAppt, setReschedulingAppt] = useState<Appointment | null>(null);
  const [cancellingAppt, setCancellingAppt] = useState<Appointment | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const loadSchedule = async () => {
    try {
      setIsLoading(true);
      const [appts, depts, docs] = await Promise.all([
        api.appointments.getAll(),
        api.departments.getAll(),
        api.doctors.getAll(),
      ]);
      setAppointments(appts);
      setDepartments(depts);
      setDoctors(docs);
    } catch (err) {
      console.error('Failed to load master schedule', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSchedule();
  }, []);

  const handleConfirmCancel = async () => {
    if (!cancellingAppt) return;
    setIsCancelling(true);
    try {
      await api.appointments.cancel(cancellingAppt.id, 'Cancelled via reception master desk');
      success('Appointment cancelled successfully.');
      setCancellingAppt(null);
      loadSchedule();
    } catch (err: any) {
      error(err.message || 'Failed to cancel appointment.');
    } finally {
      setIsCancelling(false);
    }
  };

  const filteredAppointments = appointments.filter(a => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (a.patient?.full_name || '').toLowerCase().includes(q) ||
      (a.doctor?.full_name || '').toLowerCase().includes(q) ||
      (a.chief_complaint || '').toLowerCase().includes(q);

    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    const matchesDept =
      selectedDeptId === 'all' || a.doctor?.doctor_profile?.department_id === selectedDeptId;

    return matchesSearch && matchesStatus && matchesDept;
  });

  const columns: Column<Appointment>[] = [
    {
      key: 'date',
      header: 'Date & Time',
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
          <p className="font-bold text-slate-900 text-sm">{a.patient?.full_name}</p>
          <p className="text-xs text-slate-500">{a.patient?.phone || a.patient?.email}</p>
        </div>
      ),
    },
    {
      key: 'doctor',
      header: 'Consulting Physician',
      render: (a) => (
        <div>
          <p className="font-semibold text-slate-900">{a.doctor?.full_name}</p>
          <p className="text-xs text-sky-700">{a.doctor?.doctor_profile?.department?.name || 'Department'}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (a) => <StatusBadge status={a.status} variant="status" size="sm" />,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (a) => (
        <div className="flex items-center gap-1.5">
          {(a.status === 'confirmed' || a.status === 'pending') && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReschedulingAppt(a)}
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                Reschedule
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCancellingAppt(a)}
                className="text-rose-600 hover:bg-rose-50"
              >
                Cancel
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Master Appointment Scheduler</h1>
          <p className="text-xs text-slate-500">
            Clinic-wide booking coordinator with automated collision checks
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setIsBookingOpen(true)}
          leftIcon={<CalendarPlus className="w-4 h-4" />}
        >
          New Booking
        </Button>
      </div>

      <SearchFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by patient, physician, or symptoms..."
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        statusOptions={[
          { label: 'Confirmed', value: 'confirmed' },
          { label: 'In Progress', value: 'in_progress' },
          { label: 'Completed', value: 'completed' },
          { label: 'Pending', value: 'pending' },
          { label: 'Cancelled', value: 'cancelled' },
        ]}
        departmentFilter={selectedDeptId}
        onDepartmentFilterChange={setSelectedDeptId}
        departmentOptions={departments.map(d => ({ label: d.name, value: d.id }))}
      />

      <DataTable
        columns={columns}
        data={filteredAppointments}
        keyExtractor={(a) => a.id}
        isLoading={isLoading}
        emptyTitle="No scheduled appointments match filters"
        emptyDescription="Try selecting 'All Departments' or resetting your status filter."
      />

      {isBookingOpen && (
        <BookingModal
          isOpen={isBookingOpen}
          onClose={() => setIsBookingOpen(false)}
          onSuccess={loadSchedule}
        />
      )}

      {reschedulingAppt && (
        <RescheduleModal
          isOpen={Boolean(reschedulingAppt)}
          onClose={() => setReschedulingAppt(null)}
          appointment={reschedulingAppt}
          onSuccess={loadSchedule}
        />
      )}

      {cancellingAppt && (
        <ConfirmationDialog
          isOpen={Boolean(cancellingAppt)}
          onClose={() => setCancellingAppt(null)}
          onConfirm={handleConfirmCancel}
          title="Cancel Appointment"
          message={`Are you sure you want to cancel the consultation for ${cancellingAppt.patient?.full_name}?`}
          confirmText="Yes, Cancel Booking"
          variant="danger"
          isLoading={isCancelling}
        />
      )}
    </div>
  );
};
