// ==============================================================================
// ClinicFlow — Doctor: Working Hours & Availability Settings
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/services/api';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { Clock, Calendar, Check, Save } from 'lucide-react';

const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const DoctorSchedule: React.FC = () => {
  const { user, doctorProfile, refreshProfile } = useAuth();
  const { success, error } = useToast();

  const [availableDays, setAvailableDays] = useState<string[]>([
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'
  ]);
  const [startTime, setStartTime] = useState('09:00:00');
  const [endTime, setEndTime] = useState('17:00:00');
  const [slotDuration, setSlotDuration] = useState('30');
  const [fee, setFee] = useState('500');
  const [roomNumber, setRoomNumber] = useState('Consultation Room 102');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (doctorProfile) {
      if (doctorProfile.available_days) setAvailableDays(doctorProfile.available_days);
      if (doctorProfile.start_time) setStartTime(doctorProfile.start_time.slice(0, 5));
      if (doctorProfile.end_time) setEndTime(doctorProfile.end_time.slice(0, 5));
      if (doctorProfile.slot_duration_minutes) setSlotDuration(String(doctorProfile.slot_duration_minutes));
      if (doctorProfile.consultation_fee) setFee(String(doctorProfile.consultation_fee));
      if (doctorProfile.room_number) setRoomNumber(doctorProfile.room_number);
    }
  }, [doctorProfile]);

  const toggleDay = (day: string) => {
    if (availableDays.includes(day)) {
      setAvailableDays(availableDays.filter(d => d !== day));
    } else {
      setAvailableDays([...availableDays, day]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (availableDays.length === 0) {
      error('Please select at least one available working day.');
      return;
    }

    setIsSaving(true);
    try {
      if (user?.id) {
        await api.doctors.updateDoctorProfile(user.id, {
          available_days: availableDays,
          start_time: startTime.includes(':') && startTime.split(':').length === 2 ? `${startTime}:00` : startTime,
          end_time: endTime.includes(':') && endTime.split(':').length === 2 ? `${endTime}:00` : endTime,
          slot_duration_minutes: Number(slotDuration),
          consultation_fee: Number(fee),
          room_number: roomNumber,
        });
        success('Clinical schedule and working hours updated successfully!');
        await refreshProfile();
      }
    } catch (err: any) {
      error(err.message || 'Failed to update schedule.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Clinical Schedule & Working Hours</h1>
        <p className="text-xs text-slate-500">
          Configure active practice days, daily operating hours, and consultation slot intervals
        </p>
      </div>

      <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        {/* Available Practice Days */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Active Practice Days
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {ALL_DAYS.map(day => {
              const isSelected = availableDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-between transition-all ${
                    isSelected
                      ? 'bg-sky-50 border-sky-400 text-sky-900 shadow-2xs'
                      : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  <span>{day}</span>
                  {isSelected && <Check className="w-4 h-4 text-sky-600 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Operating Hours */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
          <Input
            label="Shift Start Time"
            type="time"
            required
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
          <Input
            label="Shift End Time"
            type="time"
            required
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </div>

        {/* Slot Interval & Fee */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
          <Select
            label="Consultation Slot Interval"
            value={slotDuration}
            onChange={(e) => setSlotDuration(e.target.value)}
            options={[
              { value: '15', label: '15 Minutes' },
              { value: '20', label: '20 Minutes' },
              { value: '30', label: '30 Minutes (Recommended)' },
              { value: '45', label: '45 Minutes' },
              { value: '60', label: '60 Minutes' },
            ]}
          />
          <Input
            label="Consultation Fee (₹)"
            type="number"
            required
            value={fee}
            onChange={(e) => setFee(e.target.value)}
          />
          <Input
            label="Room / Cabin Number"
            required
            value={roomNumber}
            onChange={(e) => setRoomNumber(e.target.value)}
          />
        </div>

        {/* Save CTA */}
        <div className="flex justify-end pt-4 border-t border-slate-100">
          <Button
            type="submit"
            variant="primary"
            isLoading={isSaving}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Save Schedule Preferences
          </Button>
        </div>
      </form>
    </div>
  );
};
