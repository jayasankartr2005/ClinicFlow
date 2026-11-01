// ==============================================================================
// ClinicFlow — Patient: Self-Service Healthcare Portal
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import { Appointment, MedicalRecord, Prescription } from '@/types';
import { StatCard, LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/common/Button';
import { MedicalRecordViewModal } from '@/components/medical/MedicalRecordViewModal';
import { PrescriptionPrintModal } from '@/components/medical/PrescriptionPrintModal';
import { RescheduleModal } from '@/components/appointment/RescheduleModal';
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog';
import { useToast } from '@/contexts/ToastContext';
import { formatDate, formatTime, formatRelativeDate } from '@/lib/dateUtils';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  CalendarPlus, 
  FileText, 
  Pill, 
  Clock, 
  Stethoscope, 
  ArrowRight, 
  Heart, 
  RefreshCw,
  XCircle,
  AlertCircle
} from 'lucide-react';

export const PatientDashboard: React.FC = () => {
  const { user, patientProfile } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [reschedulingAppt, setReschedulingAppt] = useState<Appointment | null>(null);
  const [cancellingAppt, setCancellingAppt] = useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadPatientData = async () => {
    if (!user?.id) return;
    try {
      setIsLoading(true);
      const [appts, records, rxs] = await Promise.all([
        api.appointments.getAll({ patientId: user.id }),
        api.medicalRecords.getAll({ patientId: user.id }),
        api.prescriptions.getAll(user.id),
      ]);
      setAppointments(appts);
      setMedicalRecords(records);
      setPrescriptions(rxs);
    } catch (err) {
      console.error('Error loading patient dashboard', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPatientData();
  }, [user?.id]);

  const handleCancelAppointment = async () => {
    if (!cancellingAppt) return;
    try {
      await api.appointments.cancel(cancellingAppt.id, 'Patient self-cancellation');
      success('Your appointment has been cancelled.');
      setCancellingAppt(null);
      loadPatientData();
    } catch (err: any) {
      error(err.message || 'Failed to cancel appointment.');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton type="cards" rows={3} />
        <LoadingSkeleton type="table" rows={5} />
      </div>
    );
  }

  const upcomingAppointments = appointments.filter(
    a => a.status === 'confirmed' || a.status === 'pending'
  );
  const nextAppointment = upcomingAppointments[0];

  return (
    <div className="space-y-6">
      {/* Patient Greeting & Quick Booking CTA Banner */}
      <div className="bg-gradient-to-r from-sky-900 to-slate-900 text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 border border-sky-800">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-sky-300">Welcome Back</span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-sky-200">Blood Group: {patientProfile?.blood_group || 'O+'}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            {user?.full_name || 'Patient'}
          </h1>
          <p className="text-xs text-slate-300 max-w-xl">
            Book specialist consultations, view digital prescriptions, and monitor your personal medical records securely.
          </p>
        </div>

        <Button
          variant="primary"
          size="lg"
          onClick={() => navigate('/patient/book')}
          className="bg-white text-slate-900 hover:bg-sky-50 font-bold border-none shrink-0"
          leftIcon={<CalendarPlus className="w-5 h-5 text-sky-600" />}
        >
          Book Consultation
        </Button>
      </div>

      {/* Next Upcoming Appointment Spotlight */}
      {nextAppointment ? (
        <div className="bg-white p-5 rounded-2xl border-2 border-sky-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
              <Clock className="w-3.5 h-3.5" />
              Upcoming Encounter • {formatRelativeDate(nextAppointment.appointment_date)}
            </span>
            <StatusBadge status={nextAppointment.status} variant="status" size="sm" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Specialist</span>
              <p className="text-sm font-bold text-slate-900">{nextAppointment.doctor?.full_name}</p>
              <p className="text-xs text-slate-500">{nextAppointment.doctor?.doctor_profile?.department?.name || 'Department'}</p>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Date & Slot</span>
              <p className="text-sm font-bold text-slate-900">{formatDate(nextAppointment.appointment_date)}</p>
              <p className="text-xs text-slate-500">
                {formatTime(nextAppointment.start_time)} – {formatTime(nextAppointment.end_time)}
              </p>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Clinic Location</span>
              <p className="text-sm font-bold text-slate-900">
                {nextAppointment.doctor?.doctor_profile?.room_number || 'Room 102 (1st Floor)'}
              </p>
              <p className="text-xs text-slate-500">VIT Chennai Healthcare Complex</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <span className="text-xs text-slate-500 italic">
              Reason: "{nextAppointment.chief_complaint || 'Consultation'}"
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReschedulingAppt(nextAppointment)}
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                Reschedule
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCancellingAppt(nextAppointment)}
                className="text-rose-600 hover:bg-rose-50"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-xl text-slate-500">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800">No Upcoming Appointments</h4>
              <p className="text-xs text-slate-400">Schedule your next health checkup with an authorized physician</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/patient/book')}>
            Browse Specialists
          </Button>
        </div>
      )}

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Active Encounters"
          value={upcomingAppointments.length}
          icon={Calendar}
          color="sky"
          subtitle="Scheduled upcoming bookings"
        />
        <StatCard
          title="Medical Encounters"
          value={medicalRecords.length}
          icon={FileText}
          color="emerald"
          subtitle="Completed clinical consultations"
        />
        <StatCard
          title="Prescriptions"
          value={prescriptions.length}
          icon={Pill}
          color="purple"
          subtitle="Electronic prescription records"
        />
      </div>

      {/* Recent Prescriptions & Medical Records Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Prescriptions */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Pill className="w-4 h-4 text-sky-600" />
              <h3 className="text-sm font-bold text-slate-800">Prescribed Medications</h3>
            </div>
            <Link
              to="/patient/prescriptions"
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
            >
              All Prescriptions <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {prescriptions.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">No medications prescribed yet.</div>
            ) : (
              prescriptions.slice(0, 3).map(rx => (
                <div key={rx.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">{rx.medication_name}</span>
                    <span className="text-[11px] font-semibold text-sky-700">{rx.dosage}</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    {rx.frequency} • {rx.duration}
                  </p>
                  {rx.instructions && (
                    <p className="text-[11px] text-slate-400 italic">{rx.instructions}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Medical Summaries */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-800">Recent Medical Records</h3>
            </div>
            <Link
              to="/patient/records"
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
            >
              All Records <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {medicalRecords.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">No medical summaries recorded yet.</div>
            ) : (
              medicalRecords.slice(0, 3).map(rec => (
                <div
                  key={rec.id}
                  onClick={() => setSelectedRecord(rec)}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1 hover:bg-sky-50/50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">{rec.diagnosis}</span>
                    <span className="text-[10px] text-slate-400">{formatDate(rec.created_at)}</span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-1">{rec.treatment_plan}</p>
                  <span className="text-[10px] font-semibold text-sky-700 hover:underline">
                    View Full Clinical Slip →
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Record Modal */}
      {selectedRecord && (
        <MedicalRecordViewModal
          isOpen={Boolean(selectedRecord)}
          onClose={() => setSelectedRecord(null)}
          record={selectedRecord}
        />
      )}

      {/* Reschedule Modal */}
      {reschedulingAppt && (
        <RescheduleModal
          isOpen={Boolean(reschedulingAppt)}
          onClose={() => setReschedulingAppt(null)}
          appointment={reschedulingAppt}
          onSuccess={loadPatientData}
        />
      )}

      {/* Cancel Dialog */}
      {cancellingAppt && (
        <ConfirmationDialog
          isOpen={Boolean(cancellingAppt)}
          onClose={() => setCancellingAppt(null)}
          onConfirm={handleCancelAppointment}
          title="Cancel Appointment"
          message={`Are you sure you want to cancel your appointment with ${cancellingAppt.doctor?.full_name} on ${formatDate(cancellingAppt.appointment_date)}?`}
          confirmText="Yes, Cancel Booking"
          variant="danger"
        />
      )}
    </div>
  );
};
