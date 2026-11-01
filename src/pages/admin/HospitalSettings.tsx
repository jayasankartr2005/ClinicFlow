// ==============================================================================
// ClinicFlow — Administrator: Hospital Details & Settings Management
// Enables Hospital Admins to manage hospital profile, contact, and WhatsApp config
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/services/api';
import { Hospital } from '@/types';
import { Button } from '@/components/common/Button';
import { Input, Textarea } from '@/components/common/Input';
import { 
  Building2, 
  Save, 
  MessageSquare, 
  CheckCircle2, 
  XCircle, 
  Phone, 
  Mail, 
  Users, 
  Stethoscope, 
  Calendar 
} from 'lucide-react';

export const HospitalSettings: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const { success, error } = useToast();

  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    email: '',
    phone: '',
    address: '',
    whatsapp_phone_number_id: '',
    whatsapp_business_account_id: '',
    whatsapp_enabled: true,
  });

  // Stats
  const [stats, setStats] = useState({
    doctorsCount: 0,
    departmentsCount: 0,
    patientsCount: 0,
    appointmentsCount: 0,
  });

  const loadHospitalData = async () => {
    if (!user?.hospital_id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const [hosp, docs, depts, patients, appts] = await Promise.all([
        api.hospitals.getById(user.hospital_id),
        api.doctors.getAll(user.hospital_id),
        api.departments.getAll(user.hospital_id),
        api.patients.getAll(user.hospital_id),
        api.appointments.getAll({ hospitalId: user.hospital_id }),
      ]);

      if (hosp) {
        setHospital(hosp);
        setFormData({
          name: hosp.name || '',
          slug: hosp.slug || '',
          email: hosp.email || '',
          phone: hosp.phone || '',
          address: hosp.address || '',
          whatsapp_phone_number_id: hosp.whatsapp_phone_number_id || '',
          whatsapp_business_account_id: hosp.whatsapp_business_account_id || '',
          whatsapp_enabled: hosp.whatsapp_enabled ?? true,
        });
      }

      setStats({
        doctorsCount: docs.length,
        departmentsCount: depts.length,
        patientsCount: patients.length,
        appointmentsCount: appts.length,
      });
    } catch (err: any) {
      console.error('Failed to load hospital details:', err);
      error(err.message || 'Failed to load hospital details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHospitalData();
  }, [user?.hospital_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hospital?.id) return;

    if (!formData.name || !formData.phone) {
      error('Hospital name and phone number are required.');
      return;
    }

    setIsSaving(true);
    try {
      await api.hospitals.update(hospital.id, {
        name: formData.name,
        email: formData.email || null,
        phone: formData.phone,
        address: formData.address || null,
        whatsapp_phone_number_id: formData.whatsapp_phone_number_id || null,
        whatsapp_business_account_id: formData.whatsapp_business_account_id || null,
        whatsapp_enabled: formData.whatsapp_enabled,
      });

      success('Hospital profile & WhatsApp configuration updated successfully!');
      await refreshProfile();
      await loadHospitalData();
    } catch (err: any) {
      console.error('Failed to update hospital:', err);
      error(err.message || 'Failed to update hospital details.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-sky-600" />
            <span>Hospital Details & Configuration</span>
          </h1>
          <p className="text-xs text-slate-500">
            Manage your medical center's facility identity, contact lines, and WhatsApp Bot integration
          </p>
        </div>
      </div>

      {/* Hospital Metrics Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Stethoscope className="w-4 h-4 text-emerald-600" />
            <span>Doctors</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.doctorsCount}</p>
          <span className="text-[11px] text-slate-500">Active medical staff</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Building2 className="w-4 h-4 text-sky-600" />
            <span>Departments</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.departmentsCount}</p>
          <span className="text-[11px] text-slate-500">Clinical wings</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Users className="w-4 h-4 text-purple-600" />
            <span>Patients</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.patientsCount}</p>
          <span className="text-[11px] text-slate-500">Registered records</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Calendar className="w-4 h-4 text-amber-600" />
            <span>Appointments</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.appointmentsCount}</p>
          <span className="text-[11px] text-slate-500">Bookings recorded</span>
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* General Hospital Profile */}
        <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-sky-600" />
              <h2 className="font-bold text-slate-900 text-sm">Facility Identification</h2>
            </div>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 font-mono text-slate-600 font-medium">
              Slug: {formData.slug || 'N/A'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Hospital Name"
              required
              placeholder="e.g. Apollo Health Center"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />

            <Input
              label="Official Contact Phone"
              required
              placeholder="+91 44 2829 0200"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              leftIcon={<Phone className="w-4 h-4 text-slate-400" />}
            />

            <Input
              label="Official Contact Email"
              type="email"
              placeholder="contact@apollohealth.demo"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
            />

            <div className="sm:col-span-2">
              <Textarea
                label="Physical Facility Address"
                placeholder="Street address, city, state, postal code..."
                rows={2}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* WhatsApp Cloud API Configuration */}
        <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-emerald-600" />
              <h2 className="font-bold text-slate-900 text-sm">Meta WhatsApp Cloud API Gateway</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                formData.whatsapp_enabled 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {formData.whatsapp_enabled ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>WhatsApp Bot Active</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-3.5 h-3.5 text-slate-400" />
                    <span>Disabled</span>
                  </>
                )}
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Configure the Meta Business Account IDs associated with this hospital. Inbound patient messages to this Phone Number ID are automatically scoped to this facility.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="WhatsApp Phone Number ID"
              placeholder="e.g. 1306370622559093"
              value={formData.whatsapp_phone_number_id}
              onChange={(e) => setFormData({ ...formData, whatsapp_phone_number_id: e.target.value })}
            />

            <Input
              label="WhatsApp Business Account ID (WABA)"
              placeholder="e.g. 27441804745496109"
              value={formData.whatsapp_business_account_id}
              onChange={(e) => setFormData({ ...formData, whatsapp_business_account_id: e.target.value })}
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="whatsapp-enabled-toggle"
              checked={formData.whatsapp_enabled}
              onChange={(e) => setFormData({ ...formData, whatsapp_enabled: e.target.checked })}
              className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
            <label htmlFor="whatsapp-enabled-toggle" className="text-xs font-semibold text-slate-700 cursor-pointer">
              Enable automated WhatsApp appointment booking & notifications for this hospital
            </label>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end gap-3">
          <Button
            type="submit"
            variant="primary"
            isLoading={isSaving}
            leftIcon={<Save className="w-4 h-4" />}
            className="px-6"
          >
            Save Hospital Details
          </Button>
        </div>
      </form>
    </div>
  );
};
