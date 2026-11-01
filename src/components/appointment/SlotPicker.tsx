// ==============================================================================
// ClinicFlow — Interactive Time Slot Picker Component
// Dynamically generates doctor time slots & prevents double-booking selection
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { generateDoctorTimeSlots } from '@/lib/dateUtils';
import { TimeSlot, DoctorProfile } from '@/types';
import { Clock, AlertCircle, CheckCircle2 } from 'lucide-react';

interface SlotPickerProps {
  doctorId: string;
  selectedDate: string; // YYYY-MM-DD
  selectedSlot: { startTime: string; endTime: string } | null;
  onSelectSlot: (startTime: string, endTime: string) => void;
}

export const SlotPicker: React.FC<SlotPickerProps> = ({
  doctorId,
  selectedDate,
  selectedSlot,
  onSelectSlot,
}) => {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null);

  useEffect(() => {
    if (!doctorId || !selectedDate) {
      setSlots([]);
      return;
    }

    const loadDoctorSlots = async () => {
      setIsLoading(true);
      try {
        const doc = await api.doctors.getById(doctorId);
        if (!doc || !doc.doctor_profile) {
          setSlots([]);
          return;
        }

        setDoctorProfile(doc.doctor_profile);

        // Fetch existing appointments on this date for this doctor
        const appts = await api.appointments.getAll({
          doctorId,
          dateFrom: selectedDate,
          dateTo: selectedDate,
        });

        const generated = generateDoctorTimeSlots(
          doc.doctor_profile.start_time,
          doc.doctor_profile.end_time,
          doc.doctor_profile.slot_duration_minutes || 30,
          appts.map(a => ({ start_time: a.start_time, end_time: a.end_time, status: a.status }))
        );

        setSlots(generated);
      } catch (e) {
        console.error('Error generating slots', e);
      } finally {
        setIsLoading(false);
      }
    };

    loadDoctorSlots();
  }, [doctorId, selectedDate]);

  if (!doctorId || !selectedDate) {
    return (
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-center text-xs text-slate-500">
        Please select both a doctor and a date to view available time slots.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-10 bg-slate-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-center text-xs text-amber-700 flex items-center justify-center gap-2">
        <AlertCircle className="w-4 h-4 shrink-0" />
        <span>No working hours configured for this doctor on this day.</span>
      </div>
    );
  }

  const availableCount = slots.filter(s => s.isAvailable).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-1.5 font-medium text-slate-700">
          <Clock className="w-3.5 h-3.5 text-sky-600" />
          <span>Select Consultation Slot</span>
        </div>
        <span>
          <span className="font-semibold text-emerald-600">{availableCount}</span> of {slots.length} available
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
        {slots.map(slot => {
          const isSelected = selectedSlot?.startTime === slot.startTime;

          if (!slot.isAvailable) {
            return (
              <button
                key={slot.startTime}
                type="button"
                disabled
                className="px-2.5 py-2 rounded-lg border border-slate-200 bg-slate-100 text-slate-400 text-xs font-medium cursor-not-allowed text-center line-through"
                title="Slot already booked"
              >
                {slot.formattedTime}
              </button>
            );
          }

          return (
            <button
              key={slot.startTime}
              type="button"
              onClick={() => onSelectSlot(slot.startTime, slot.endTime)}
              className={`px-2.5 py-2 rounded-lg border text-xs font-medium transition-all text-center flex items-center justify-between gap-1 ${
                isSelected
                  ? 'bg-sky-600 border-sky-600 text-white shadow-sm ring-2 ring-sky-500/20'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-sky-300 hover:bg-sky-50/50'
              }`}
            >
              <span>{slot.formattedTime}</span>
              {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};
