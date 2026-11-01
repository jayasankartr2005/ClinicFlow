// ==============================================================================
// ClinicFlow — Receptionist: New Patient Registration Form
// ==============================================================================

import React, { useState } from 'react';
import { api } from '@/services/api';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/common/Button';
import { Input, Textarea } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { BookingModal } from '@/components/appointment/BookingModal';
import { UserPlus, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export const PatientRegistration: React.FC = () => {
  const { success, error } = useToast();
  const { hospital } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    gender: 'male' as 'male' | 'female' | 'other',
    blood_group: 'O+',
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    allergies: '',
    medical_history_summary: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdPatientId, setCreatedPatientId] = useState<string | null>(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name || !formData.phone || !formData.date_of_birth || !formData.address) {
      error('Please complete all mandatory patient demographic fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const newPatient = await api.patients.registerPatient({
        full_name: formData.full_name,
        email: formData.email || `patient_${Date.now()}@clinicflow.local`,
        phone: formData.phone,
        date_of_birth: formData.date_of_birth,
        gender: formData.gender,
        blood_group: formData.blood_group,
        address: formData.address,
        emergency_contact_name: formData.emergency_contact_name || 'Relative',
        emergency_contact_phone: formData.emergency_contact_phone || formData.phone,
        allergies: formData.allergies,
        medical_history_summary: formData.medical_history_summary,
      }, hospital?.id);

      setCreatedPatientId(newPatient.id);
      success(`Patient ${newPatient.full_name} registered successfully!`);
    } catch (err: any) {
      error(err.message || 'Failed to register patient.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">New Patient Intake & Registration</h1>
        <p className="text-xs text-slate-500">
          Create permanent outpatient profile, record emergency contacts, and log baseline allergies
        </p>
      </div>

      {createdPatientId ? (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Patient Registration Completed</h3>
          <p className="text-xs text-slate-600 max-w-sm mx-auto">
            {formData.full_name} is now registered in the clinic database. Would you like to schedule an appointment right away?
          </p>

          <div className="flex items-center justify-center gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setCreatedPatientId(null);
                setFormData({
                  full_name: '',
                  email: '',
                  phone: '',
                  date_of_birth: '',
                  gender: 'male',
                  blood_group: 'O+',
                  address: '',
                  emergency_contact_name: '',
                  emergency_contact_phone: '',
                  allergies: '',
                  medical_history_summary: '',
                });
              }}
            >
              Register Another Patient
            </Button>
            <Button
              variant="primary"
              onClick={() => setIsBookingOpen(true)}
              leftIcon={<ArrowRight className="w-4 h-4" />}
            >
              Book Appointment Now
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-100">
              Personal Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <Input
                  label="Full Name"
                  required
                  placeholder="e.g. Vikramaditya Verma"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                />
              </div>
              <Input
                label="Phone Number"
                type="tel"
                required
                placeholder="+91 98111 00000"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="Email Address"
                type="email"
                placeholder="patient@domain.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              <Input
                label="Date of Birth"
                type="date"
                required
                value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
              />
              <Select
                label="Gender"
                required
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                options={[
                  { value: 'male', label: 'Male' },
                  { value: 'female', label: 'Female' },
                  { value: 'other', label: 'Other' },
                ]}
              />
            </div>
          </div>

          <div className="space-y-4 pt-3 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-100">
              Emergency Contact & Clinical Background
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Select
                label="Blood Group"
                value={formData.blood_group}
                onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
                options={[
                  { value: 'A+', label: 'A+' },
                  { value: 'A-', label: 'A-' },
                  { value: 'B+', label: 'B+' },
                  { value: 'B-', label: 'B-' },
                  { value: 'AB+', label: 'AB+' },
                  { value: 'AB-', label: 'AB-' },
                  { value: 'O+', label: 'O+' },
                  { value: 'O-', label: 'O-' },
                ]}
              />
              <Input
                label="Emergency Contact Name"
                placeholder="e.g. Spouse / Parent"
                value={formData.emergency_contact_name}
                onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
              />
              <Input
                label="Emergency Contact Phone"
                placeholder="+91 98111 99999"
                value={formData.emergency_contact_phone}
                onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
              />
            </div>

            <div>
              <Input
                label="Residential Address"
                required
                placeholder="e.g. 42 Gandhi Nagar, Adyar, Chennai - 600020"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Known Drug / Food Allergies"
                placeholder="e.g. Penicillin, Sulfa, Dust mites (or 'None')"
                value={formData.allergies}
                onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
              />
              <Input
                label="Medical History Summary"
                placeholder="e.g. Hypertension, Diabetes, Asthma"
                value={formData.medical_history_summary}
                onChange={(e) => setFormData({ ...formData, medical_history_summary: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              leftIcon={<UserPlus className="w-4 h-4" />}
            >
              Save & Register Patient
            </Button>
          </div>
        </form>
      )}

      {/* Direct Booking Modal for newly created patient */}
      {isBookingOpen && createdPatientId && (
        <BookingModal
          isOpen={isBookingOpen}
          onClose={() => {
            setIsBookingOpen(false);
            navigate('/receptionist/dashboard');
          }}
          initialPatientId={createdPatientId}
          onSuccess={() => navigate('/receptionist/dashboard')}
        />
      )}
    </div>
  );
};
