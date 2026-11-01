// ==============================================================================
// ClinicFlow — Reusable Appointment Booking Modal Component
// Supports both Receptionist-side and Patient-side booking with Anti-Double-Booking
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input, Textarea } from '../common/Input';
import { Select } from '../common/Select';
import { SlotPicker } from './SlotPicker';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/services/api';
import { Department, DoctorWithDetails, Profile, PatientProfile, PatientWithDetails } from '@/types';
import { getTodayDateString } from '@/lib/dateUtils';
import { Calendar, User, Stethoscope, FileText } from 'lucide-react';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialDoctorId?: string;
  initialPatientId?: string;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialDoctorId = '',
  initialPatientId = '',
}) => {
  const { user, role } = useAuth();
  const { success, error } = useToast();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [patients, setPatients] = useState<PatientWithDetails[]>([]);

  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState(initialDoctorId);
  const [selectedPatientId, setSelectedPatientId] = useState(
    role === 'patient' ? user?.id || '' : initialPatientId
  );
  const [appointmentDate, setAppointmentDate] = useState(getTodayDateString());
  const [selectedSlot, setSelectedSlot] = useState<{ startTime: string; endTime: string } | null>(null);
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const loadFormData = async () => {
      try {
        const [deptsData, docsData] = await Promise.all([
          api.departments.getAll(),
          api.doctors.getAll(),
        ]);
        setDepartments(deptsData);
        setDoctors(docsData);

        if (role === 'receptionist' || role === 'admin') {
          const patientsData = await api.patients.getAll();
          setPatients(patientsData);
        }

        if (initialDoctorId) {
          setSelectedDoctorId(initialDoctorId);
        }
      } catch (err) {
        console.error('Error loading booking data', err);
      }
    };

    loadFormData();
  }, [isOpen, initialDoctorId, role]);

  const filteredDoctors = selectedDeptId
    ? doctors.filter(d => d.doctor_profile?.department_id === selectedDeptId)
    : doctors;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const patientIdToBook = role === 'patient' ? user?.id : selectedPatientId;

    if (!patientIdToBook) {
      error('Please select a patient for this appointment.');
      return;
    }
    if (!selectedDoctorId) {
      error('Please select a doctor.');
      return;
    }
    if (!appointmentDate) {
      error('Please select a valid date.');
      return;
    }
    if (!selectedSlot) {
      error('Please select an available time slot.');
      return;
    }
    if (!chiefComplaint.trim()) {
      error('Please describe the reason for your visit.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.appointments.bookAppointment({
        patient_id: patientIdToBook,
        doctor_id: selectedDoctorId,
        appointment_date: appointmentDate,
        start_time: selectedSlot.startTime,
        end_time: selectedSlot.endTime,
        chief_complaint: chiefComplaint.trim(),
      });

      success('Appointment booked and confirmed successfully!');
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      error(err.message || 'Failed to book appointment. Slot may have been taken.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedDoctorObj = doctors.find(d => d.id === selectedDoctorId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Book Consultation Appointment"
      subtitle="Schedule an appointment with an authorized specialist"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Patient Selection (for Receptionist / Admin) */}
        {(role === 'receptionist' || role === 'admin') && (
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <Select
              label="Select Patient"
              required
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              options={patients.map(p => ({
                value: p.id,
                label: `${p.full_name} (${p.phone || p.email})`,
              }))}
              placeholder="Search / Choose registered patient..."
            />
          </div>
        )}

        {/* Department & Doctor Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="Department (Optional Filter)"
            value={selectedDeptId}
            onChange={(e) => {
              setSelectedDeptId(e.target.value);
              setSelectedDoctorId('');
              setSelectedSlot(null);
            }}
            options={departments.map(d => ({ value: d.id, label: `${d.name} (${d.code})` }))}
            placeholder="All Clinical Departments"
          />

          <Select
            label="Consulting Doctor"
            required
            value={selectedDoctorId}
            onChange={(e) => {
              setSelectedDoctorId(e.target.value);
              setSelectedSlot(null);
            }}
            options={filteredDoctors.map(d => ({
              value: d.id,
              label: `${d.full_name} — ${d.specialization?.name || d.department?.name || 'Specialist'} (₹${d.doctor_profile?.consultation_fee || 500})`,
            }))}
            placeholder="Select Specialist..."
          />
        </div>

        {/* Doctor Summary Banner if selected */}
        {selectedDoctorObj && (
          <div className="p-3 bg-sky-50/70 border border-sky-200 rounded-lg flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-sky-600 text-white rounded-lg">
                <Stethoscope className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-slate-800">{selectedDoctorObj.full_name}</p>
                <p className="text-slate-500">{selectedDoctorObj.specialization?.name} • {selectedDoctorObj.doctor_profile?.room_number}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-semibold uppercase text-slate-500">Consultation Fee</span>
              <p className="text-sm font-bold text-sky-700">₹{selectedDoctorObj.doctor_profile?.consultation_fee || 500}</p>
            </div>
          </div>
        )}

        {/* Date Selection */}
        <div>
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
        </div>

        {/* Live Slot Picker */}
        {selectedDoctorId && appointmentDate && (
          <div className="pt-2 border-t border-slate-100">
            <SlotPicker
              doctorId={selectedDoctorId}
              selectedDate={appointmentDate}
              selectedSlot={selectedSlot}
              onSelectSlot={(s, e) => setSelectedSlot({ startTime: s, endTime: e })}
            />
          </div>
        )}

        {/* Reason for Visit / Chief Complaint */}
        <div>
          <Textarea
            label="Chief Complaint / Reason for Visit"
            required
            placeholder="Please describe symptoms, discomfort, or purpose of visit..."
            rows={2}
            value={chiefComplaint}
            onChange={(e) => setChiefComplaint(e.target.value)}
          />
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            disabled={!selectedDoctorId || !selectedSlot || !chiefComplaint.trim()}
          >
            Confirm & Reserve Slot
          </Button>
        </div>
      </form>
    </Modal>
  );
};
