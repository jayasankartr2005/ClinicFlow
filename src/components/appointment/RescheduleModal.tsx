// ==============================================================================
// ClinicFlow — Appointment Rescheduling Modal Component
// ==============================================================================

import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { SlotPicker } from './SlotPicker';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/services/api';
import { Appointment } from '@/types';
import { getTodayDateString, formatDate, formatTime } from '@/lib/dateUtils';
import { Calendar, Clock, Stethoscope } from 'lucide-react';

interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onSuccess?: () => void;
}

export const RescheduleModal: React.FC<RescheduleModalProps> = ({
  isOpen,
  onClose,
  appointment,
  onSuccess,
}) => {
  const { success, error } = useToast();
  const [newDate, setNewDate] = useState(getTodayDateString());
  const [selectedSlot, setSelectedSlot] = useState<{ startTime: string; endTime: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!appointment) return null;

  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) {
      error('Please select an available time slot.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.appointments.reschedule(
        appointment.id,
        newDate,
        selectedSlot.startTime,
        selectedSlot.endTime
      );

      success('Appointment rescheduled successfully!');
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      error(err.message || 'Failed to reschedule appointment. Conflict detected.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reschedule Appointment"
      subtitle="Select a new date and available time slot"
      maxWidth="lg"
    >
      <form onSubmit={handleReschedule} className="space-y-4">
        {/* Current Schedule Summary */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1.5">
          <div className="flex items-center justify-between text-slate-700 font-semibold">
            <span>Current Booking</span>
            <span className="text-slate-500">{formatDate(appointment.appointment_date)}</span>
          </div>
          <div className="flex items-center gap-4 text-slate-600">
            <span className="flex items-center gap-1">
              <Stethoscope className="w-3.5 h-3.5 text-sky-600" />
              {appointment.doctor?.full_name || 'Doctor'}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-sky-600" />
              {formatTime(appointment.start_time)} – {formatTime(appointment.end_time)}
            </span>
          </div>
        </div>

        {/* New Date Picker */}
        <div>
          <Input
            label="Select New Date"
            type="date"
            required
            min={getTodayDateString()}
            value={newDate}
            onChange={(e) => {
              setNewDate(e.target.value);
              setSelectedSlot(null);
            }}
          />
        </div>

        {/* Slot Picker */}
        <div className="pt-2 border-t border-slate-100">
          <SlotPicker
            doctorId={appointment.doctor_id}
            selectedDate={newDate}
            selectedSlot={selectedSlot}
            onSelectSlot={(s, e) => setSelectedSlot({ startTime: s, endTime: e })}
          />
        </div>

        <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            disabled={!selectedSlot}
          >
            Confirm Reschedule
          </Button>
        </div>
      </form>
    </Modal>
  );
};
