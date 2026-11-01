// ==============================================================================
// ClinicFlow — Receptionist: Front Desk Operations Dashboard
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { Appointment, Profile, PatientProfile } from '@/types';
import { StatCard, LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/common/Button';
import { BookingModal } from '@/components/appointment/BookingModal';
import { RescheduleModal } from '@/components/appointment/RescheduleModal';
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog';
import { useToast } from '@/contexts/ToastContext';
import { formatDate, formatTime, getTodayDateString } from '@/lib/dateUtils';
import { Link, useNavigate } from 'react-router-dom';
import { 
  UserPlus, 
  CalendarPlus, 
  Clock, 
  CheckCircle2, 
  Calendar, 
  Users, 
  Search, 
  ArrowRight,
  RefreshCw,
  XCircle
} from 'lucide-react';

export const ReceptionistDashboard: React.FC = () => {
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [reschedulingAppt, setReschedulingAppt] = useState<Appointment | null>(null);
  const [cancellingAppt, setCancellingAppt] = useState<Appointment | null>(null);
  const [cancelReason, setCancelReason] = useState('Patient requested cancellation');
  const [isCancelling, setIsCancelling] = useState(false);

  const loadTodayQueue = async () => {
    try {
      setIsLoading(true);
      const todayStr = getTodayDateString();
      const data = await api.appointments.getAll({
        dateFrom: todayStr,
        dateTo: todayStr,
      });
      setTodayAppointments(data);
    } catch (err) {
      console.error('Error loading front desk queue', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTodayQueue();
  }, []);

  const handleUpdateStatus = async (apptId: string, newStatus: any) => {
    try {
      await api.appointments.updateStatus(apptId, newStatus);
      success(`Appointment status updated to ${newStatus}.`);
      loadTodayQueue();
    } catch (err: any) {
      error(err.message || 'Failed to update status.');
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancellingAppt) return;
    setIsCancelling(true);
    try {
      await api.appointments.cancel(cancellingAppt.id, cancelReason);
      success('Appointment cancelled.');
      setCancellingAppt(null);
      loadTodayQueue();
    } catch (err: any) {
      error(err.message || 'Failed to cancel appointment.');
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton type="cards" rows={4} />
        <LoadingSkeleton type="table" rows={6} />
      </div>
    );
  }

  const confirmedCount = todayAppointments.filter(a => a.status === 'confirmed').length;
  const inProgressCount = todayAppointments.filter(a => a.status === 'in_progress').length;
  const completedCount = todayAppointments.filter(a => a.status === 'completed').length;
  const cancelledCount = todayAppointments.filter(a => a.status === 'cancelled').length;

  return (
    <div className="space-y-6">
      {/* Front Desk Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Front Desk Station</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Patient intake, doctor appointment dispatching, and queue management
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            onClick={() => navigate('/receptionist/register')}
            leftIcon={<UserPlus className="w-4 h-4 text-sky-600" />}
          >
            Register Patient
          </Button>
          <Button
            variant="primary"
            onClick={() => setIsBookingOpen(true)}
            leftIcon={<CalendarPlus className="w-4 h-4" />}
          >
            Book Appointment
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          title="Today's Bookings"
          value={todayAppointments.length}
          icon={Calendar}
          color="sky"
          subtitle="Total schedule load"
        />
        <StatCard
          title="Confirmed / Waiting"
          value={confirmedCount}
          icon={Clock}
          color="amber"
          subtitle="In reception waiting area"
        />
        <StatCard
          title="Completed Consults"
          value={completedCount}
          icon={CheckCircle2}
          color="emerald"
          subtitle="Finished encounters"
        />
        <StatCard
          title="Cancelled Today"
          value={cancelledCount}
          icon={XCircle}
          color="rose"
          subtitle="Rescheduled or revoked"
        />
      </div>

      {/* Today's Live Queue */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Live Intake & Consultation Queue</h3>
            <p className="text-xs text-slate-400">Manage patient arrivals and clinic check-ins</p>
          </div>
          <Link
            to="/receptionist/queue"
            className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
          >
            Expanded Queue <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {todayAppointments.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No patient appointments scheduled for today yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500">
                <tr>
                  <th className="px-3.5 py-2.5">Time Slot</th>
                  <th className="px-3.5 py-2.5">Patient Details</th>
                  <th className="px-3.5 py-2.5">Assigned Physician</th>
                  <th className="px-3.5 py-2.5">Status</th>
                  <th className="px-3.5 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {todayAppointments.map(appt => (
                  <tr key={appt.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-3.5 py-3 font-semibold text-slate-900 whitespace-nowrap">
                      {formatTime(appt.start_time)} – {formatTime(appt.end_time)}
                    </td>
                    <td className="px-3.5 py-3">
                      <p className="font-bold text-slate-900">{appt.patient?.full_name}</p>
                      <p className="text-[11px] text-slate-400">{appt.patient?.phone || appt.patient?.email}</p>
                    </td>
                    <td className="px-3.5 py-3">
                      <p className="font-medium text-slate-800">{appt.doctor?.full_name}</p>
                      <p className="text-[11px] text-sky-700">{appt.doctor?.doctor_profile?.department?.name || 'Department'}</p>
                    </td>
                    <td className="px-3.5 py-3">
                      <StatusBadge status={appt.status} variant="status" size="sm" />
                    </td>
                    <td className="px-3.5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {appt.status === 'confirmed' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateStatus(appt.id, 'in_progress')}
                          >
                            Check In
                          </Button>
                        )}
                        {(appt.status === 'confirmed' || appt.status === 'pending') && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setReschedulingAppt(appt)}
                              title="Reschedule slot"
                            >
                              Reschedule
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setCancellingAppt(appt)}
                              className="text-rose-600 hover:bg-rose-50"
                            >
                              Cancel
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {isBookingOpen && (
        <BookingModal
          isOpen={isBookingOpen}
          onClose={() => setIsBookingOpen(false)}
          onSuccess={loadTodayQueue}
        />
      )}

      {/* Reschedule Modal */}
      {reschedulingAppt && (
        <RescheduleModal
          isOpen={Boolean(reschedulingAppt)}
          onClose={() => setReschedulingAppt(null)}
          appointment={reschedulingAppt}
          onSuccess={loadTodayQueue}
        />
      )}

      {/* Cancel Dialog */}
      {cancellingAppt && (
        <ConfirmationDialog
          isOpen={Boolean(cancellingAppt)}
          onClose={() => setCancellingAppt(null)}
          onConfirm={handleConfirmCancel}
          title="Cancel Appointment"
          message={`Are you sure you want to cancel the appointment for ${cancellingAppt.patient?.full_name} on ${formatDate(cancellingAppt.appointment_date)}?`}
          confirmText="Yes, Cancel Appointment"
          variant="danger"
          isLoading={isCancelling}
        />
      )}
    </div>
  );
};
