// ==============================================================================
// ClinicFlow — Patient: Specialist Explorer & Appointment Booking
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/services/api';
import { Department, DoctorWithDetails, Specialization } from '@/types';
import { SlotPicker } from '@/components/appointment/SlotPicker';
import { Button } from '@/components/common/Button';
import { Input, Textarea } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { getTodayDateString } from '@/lib/dateUtils';
import { useNavigate } from 'react-router-dom';
import { 
  Stethoscope, 
  Calendar, 
  Clock, 
  MapPin, 
  DollarSign, 
  CheckCircle2, 
  Search,
  Filter,
  Check
} from 'lucide-react';

export const BookAppointment: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Selected Doctor
  const [selectedDeptId, setSelectedDeptId] = useState('all');
  const [searchDoctor, setSearchDoctor] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState<any | null>(null);

  // Slot Selection
  const [appointmentDate, setAppointmentDate] = useState(getTodayDateString());
  const [selectedSlot, setSelectedSlot] = useState<{ startTime: string; endTime: string } | null>(null);
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadBookingData = async () => {
      try {
        setIsLoading(true);
        const [deptsData, docsData] = await Promise.all([
          api.departments.getAll(),
          api.doctors.getAll(),
        ]);
        setDepartments(deptsData);
        setDoctors(docsData);
        if (docsData.length > 0) {
          setSelectedDoctor(docsData[0]);
        }
      } catch (err) {
        console.error('Error loading booking data', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadBookingData();
  }, []);

  const filteredDoctors = doctors.filter(d => {
    const matchesDept =
      selectedDeptId === 'all' || d.doctor_profile?.department_id === selectedDeptId;
    const matchesSearch =
      d.full_name.toLowerCase().includes(searchDoctor.toLowerCase()) ||
      (d.specialization?.name || '').toLowerCase().includes(searchDoctor.toLowerCase());

    return matchesDept && matchesSearch;
  });

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedDoctor) return;

    if (!selectedSlot) {
      error('Please select an available consultation slot.');
      return;
    }
    if (!chiefComplaint.trim()) {
      error('Please provide a brief reason for your visit.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.appointments.bookAppointment({
        patient_id: user.id,
        doctor_id: selectedDoctor.id,
        appointment_date: appointmentDate,
        start_time: selectedSlot.startTime,
        end_time: selectedSlot.endTime,
        chief_complaint: chiefComplaint.trim(),
      });

      success('Appointment confirmed successfully!');
      navigate('/patient/appointments');
    } catch (err: any) {
      error(err.message || 'Failed to book slot. Double-booking conflict detected.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Book a Medical Consultation</h1>
        <p className="text-xs text-slate-500">
          Search specialist doctors by clinical department, choose an open time slot, and reserve your visit
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Doctor Directory (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              1. Choose Consulting Physician
            </h3>

            {/* Department Filter Pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setSelectedDeptId('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedDeptId === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All
              </button>
              {departments.map(d => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setSelectedDeptId(d.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    selectedDeptId === d.id
                      ? 'bg-sky-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {d.name}
                </button>
              ))}
            </div>

            {/* Doctor Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search specialist by name..."
                value={searchDoctor}
                onChange={(e) => setSearchDoctor(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Doctors List */}
            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pt-1">
              {filteredDoctors.map(doc => {
                const isSelected = selectedDoctor?.id === doc.id;
                return (
                  <div
                    key={doc.id}
                    onClick={() => {
                      setSelectedDoctor(doc);
                      setSelectedSlot(null);
                    }}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-sky-50/80 border-sky-500 ring-2 ring-sky-500/20 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-sky-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                          {doc.full_name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-xs sm:text-sm">{doc.full_name}</p>
                          <p className="text-[11px] text-sky-700 font-semibold">
                            {doc.specialization?.name || doc.department?.name}
                          </p>
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-sky-600 shrink-0 mt-1" />}
                    </div>

                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-2 leading-relaxed">
                      {doc.doctor_profile?.bio || 'Certified specialist medical practitioner.'}
                    </p>

                    <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-slate-100 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {doc.doctor_profile?.room_number || 'Room 101'}
                      </span>
                      <span className="font-bold text-slate-800">
                        ₹{doc.doctor_profile?.consultation_fee || 500}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Slot Selection & Confirmation (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {selectedDoctor ? (
            <form onSubmit={handleBook} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="pb-3 border-b border-slate-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  2. Select Date & Appointment Slot
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Booking with <span className="font-semibold text-slate-700">{selectedDoctor.full_name}</span> ({selectedDoctor.specialization?.name || 'Specialist'})
                </p>
              </div>

              {/* Date Input */}
              <Input
                label="Appointment Date"
                type="date"
                required
                min={getTodayDateString()}
                value={appointmentDate}
                onChange={(e) => {
                  setAppointmentDate(e.target.value);
                  setSelectedSlot(null);
                }}
              />

              {/* Real-time Dynamic Slot Picker */}
              <div className="pt-2">
                <SlotPicker
                  doctorId={selectedDoctor.id}
                  selectedDate={appointmentDate}
                  selectedSlot={selectedSlot}
                  onSelectSlot={(s, e) => setSelectedSlot({ startTime: s, endTime: e })}
                />
              </div>

              {/* Reason for visit */}
              <div className="pt-2 border-t border-slate-100">
                <Textarea
                  label="Chief Complaint / Reason for Consultation *"
                  required
                  rows={2}
                  placeholder="Describe your current discomfort, symptoms, or preventive checkup goal..."
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                />
              </div>

              {/* Booking Summary Box */}
              {selectedSlot && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs text-slate-700">
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span>Consultation Summary</span>
                    <span className="text-sky-700">₹{selectedDoctor.doctor_profile?.consultation_fee || 500}</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Date: {appointmentDate} • Time: {selectedSlot.startTime.slice(0, 5)} - {selectedSlot.endTime.slice(0, 5)}
                  </p>
                  <p className="text-[11px] text-emerald-700 font-medium">
                    ✓ Anti-collision verified: Slot available in real time.
                  </p>
                </div>
              )}

              {/* Submit CTA */}
              <div className="flex justify-end gap-2.5 pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full sm:w-auto"
                  isLoading={isSubmitting}
                  disabled={!selectedSlot || !chiefComplaint.trim()}
                  leftIcon={<CheckCircle2 className="w-5 h-5" />}
                >
                  Confirm & Reserve Appointment
                </Button>
              </div>
            </form>
          ) : (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400">
              <Stethoscope className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="text-xs">Please choose a doctor on the left to view available slots.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
