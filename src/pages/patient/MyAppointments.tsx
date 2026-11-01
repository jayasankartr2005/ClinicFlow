// ==============================================================================
// ClinicFlow — Patient: My Booked Appointments & Management
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import { Appointment, MedicalRecord } from '@/types';
import { AppointmentCard } from '@/components/appointment/AppointmentCard';
import { RescheduleModal } from '@/components/appointment/RescheduleModal';
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog';
import { MedicalRecordViewModal } from '@/components/medical/MedicalRecordViewModal';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { Button } from '@/components/common/Button';
import { useToast } from '@/contexts/ToastContext';
import { useNavigate } from 'react-router-dom';
import { Calendar, CalendarPlus, Filter } from 'lucide-react';

export const MyAppointments: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed' | 'cancelled' | 'all'>('upcoming');

  const [reschedulingAppt, setReschedulingAppt] = useState<Appointment | null>(null);
  const [cancellingAppt, setCancellingAppt] = useState<Appointment | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);

  const loadAppointments = async () => {
    if (!user?.id) return;
    try {
      setIsLoading(true);
      const data = await api.appointments.getAll({ patientId: user.id });
      setAppointments(data);
    } catch (err) {
      console.error('Error loading appointments', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, [user?.id]);

  const handleConfirmCancel = async () => {
    if (!cancellingAppt) return;
    try {
      await api.appointments.cancel(cancellingAppt.id, 'Cancelled by patient');
      success('Appointment cancelled successfully.');
      setCancellingAppt(null);
      loadAppointments();
    } catch (err: any) {
      error(err.message || 'Failed to cancel appointment.');
    }
  };

  const filteredAppointments = appointments.filter(a => {
    if (activeTab === 'upcoming') {
      return a.status === 'confirmed' || a.status === 'pending';
    } else if (activeTab === 'completed') {
      return a.status === 'completed';
    } else if (activeTab === 'cancelled') {
      return a.status === 'cancelled';
    }
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">My Appointments</h1>
          <p className="text-xs text-slate-500">
            View upcoming consultations, reschedule dates, and browse clinical history
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => navigate('/patient/book')}
          leftIcon={<CalendarPlus className="w-4 h-4" />}
        >
          Book New Consultation
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'upcoming'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Upcoming ({appointments.filter(a => a.status === 'confirmed' || a.status === 'pending').length})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'completed'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Completed ({appointments.filter(a => a.status === 'completed').length})
        </button>
        <button
          onClick={() => setActiveTab('cancelled')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'cancelled'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Cancelled
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'all'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          All
        </button>
      </div>

      {/* Appointments List */}
      {isLoading ? (
        <LoadingSkeleton type="cards" rows={4} />
      ) : filteredAppointments.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center shadow-xs">
          <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h4 className="text-sm font-semibold text-slate-800">No appointments found in this category</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            You don't have any appointments matching this tab filter.
          </p>
          <Button variant="outline" size="sm" onClick={() => navigate('/patient/book')}>
            Book an Appointment
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAppointments.map(appt => (
            <AppointmentCard
              key={appt.id}
              appointment={appt}
              perspective="patient"
              onReschedule={(a) => setReschedulingAppt(a)}
              onCancel={(a) => setCancellingAppt(a)}
              onViewRecord={async (a) => {
                const rec = await api.medicalRecords.getByAppointmentId(a.id);
                setSelectedRecord(rec);
              }}
            />
          ))}
        </div>
      )}

      {/* Reschedule Modal */}
      {reschedulingAppt && (
        <RescheduleModal
          isOpen={Boolean(reschedulingAppt)}
          onClose={() => setReschedulingAppt(null)}
          appointment={reschedulingAppt}
          onSuccess={loadAppointments}
        />
      )}

      {/* Cancel Dialog */}
      {cancellingAppt && (
        <ConfirmationDialog
          isOpen={Boolean(cancellingAppt)}
          onClose={() => setCancellingAppt(null)}
          onConfirm={handleConfirmCancel}
          title="Cancel Appointment"
          message={`Are you sure you want to cancel your consultation with ${cancellingAppt.doctor?.full_name}?`}
          confirmText="Yes, Cancel Booking"
          variant="danger"
        />
      )}

      {/* Medical Record Modal */}
      {selectedRecord && (
        <MedicalRecordViewModal
          isOpen={Boolean(selectedRecord)}
          onClose={() => setSelectedRecord(null)}
          record={selectedRecord}
        />
      )}
    </div>
  );
};
