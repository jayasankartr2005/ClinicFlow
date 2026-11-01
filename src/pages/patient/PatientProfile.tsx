// ==============================================================================
// ClinicFlow — Patient: Health Profile & Demographics Settings
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/services/api';
import { Button } from '@/components/common/Button';
import { Input, Textarea } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { User, Heart, Phone, AlertTriangle, Save } from 'lucide-react';

export const PatientProfile: React.FC = () => {
  const { user, patientProfile, refreshProfile } = useAuth();
  const { success, error } = useToast();

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

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        email: user.email || '',
        phone: user.phone || '',
        date_of_birth: patientProfile?.date_of_birth || '1990-01-01',
        gender: patientProfile?.gender || 'male',
        blood_group: patientProfile?.blood_group || 'O+',
        address: patientProfile?.address || '',
        emergency_contact_name: patientProfile?.emergency_contact_name || '',
        emergency_contact_phone: patientProfile?.emergency_contact_phone || '',
        allergies: patientProfile?.allergies || '',
        medical_history_summary: patientProfile?.medical_history_summary || '',
      });
    }
  }, [user, patientProfile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    try {
      // Update core profile
      await api.auth.updateProfile(user.id, {
        full_name: formData.full_name,
        phone: formData.phone,
      });

      // Update patient profile
      await api.auth.updatePatientProfile(user.id, {
        date_of_birth: formData.date_of_birth,
        gender: formData.gender,
        blood_group: formData.blood_group as any,
        address: formData.address,
        emergency_contact_name: formData.emergency_contact_name,
        emergency_contact_phone: formData.emergency_contact_phone,
        allergies: formData.allergies,
        medical_history_summary: formData.medical_history_summary,
      });

      success('Health profile updated successfully!');
      await refreshProfile();
    } catch (err: any) {
      error(err.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Personal Health Profile</h1>
        <p className="text-xs text-slate-500">
          Manage your outpatient demographics, verified emergency contacts, and vital medical disclosures
        </p>
      </div>

      <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        {/* Basic Identity */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-100 flex items-center gap-2">
            <User className="w-4 h-4 text-sky-600" />
            <span>Identity & Contact Details</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <Input
                label="Full Legal Name"
                required
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              />
            </div>
            <Input
              label="Phone Number"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Registered Email (Account ID)"
              disabled
              value={formData.email}
              helperText="Email is managed via authenticated credentials."
            />
            <Input
              label="Residential Address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>
        </div>

        {/* Demographics & Blood Group */}
        <div className="space-y-3 pt-3 border-t border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-100 flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-600" />
            <span>Clinical Demographics</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Date of Birth"
              type="date"
              required
              value={formData.date_of_birth}
              onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
            />
            <Select
              label="Biological Gender"
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
              options={[
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
                { value: 'other', label: 'Other' },
              ]}
            />
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
          </div>
        </div>

        {/* Emergency Contacts */}
        <div className="space-y-3 pt-3 border-t border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-100 flex items-center gap-2">
            <Phone className="w-4 h-4 text-emerald-600" />
            <span>Emergency Contacts</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Emergency Contact Name"
              placeholder="e.g. Spouse / Parent / Guardian"
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
        </div>

        {/* Allergies & Medical History */}
        <div className="space-y-3 pt-3 border-t border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-100 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Allergies & Medical Disclosures</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Known Drug / Food Allergies"
              placeholder="e.g. Penicillin, Sulfa, Peanuts"
              value={formData.allergies}
              onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
            />
            <Input
              label="Chronic Medical History"
              placeholder="e.g. Hypertension, Diabetes, Asthma"
              value={formData.medical_history_summary}
              onChange={(e) => setFormData({ ...formData, medical_history_summary: e.target.value })}
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t border-slate-100">
          <Button
            type="submit"
            variant="primary"
            isLoading={isSaving}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Save Profile Updates
          </Button>
        </div>
      </form>
    </div>
  );
};
