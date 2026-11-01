// ==============================================================================
// ClinicFlow — Doctor: Clinical Consultation Room Workflow
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/services/api';
import { Appointment, ConsultationFormData } from '@/types';
import { PrescriptionBuilder, PrescriptionItem } from '@/components/medical/PrescriptionBuilder';
import { Button } from '@/components/common/Button';
import { Input, Textarea } from '@/components/common/Input';
import { formatDate, calculateAge, getTodayDateString } from '@/lib/dateUtils';
import { 
  Stethoscope, 
  User, 
  Activity, 
  Heart, 
  Thermometer, 
  Weight, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowLeft,
  Calendar,
  Pill
} from 'lucide-react';

export const ConsultationRoom: React.FC = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const { user } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState<ConsultationFormData>({
    chiefComplaint: '',
    vitalSigns: {
      bp: '120/80',
      pulse: '72',
      temp: '98.6',
      weight: '70',
      height: '172',
      spo2: '99',
    },
    clinicalNotes: '',
    diagnosis: '',
    treatmentPlan: '',
    followUpDate: '',
    followUpNotes: '',
    prescriptions: [
      {
        medication_name: 'Paracetamol 650mg',
        dosage: '1 tablet',
        frequency: '1-0-1 (After food)',
        duration: '3 days',
        instructions: 'Take with warm water after meals.',
      },
    ],
  });

  useEffect(() => {
    if (!appointmentId) return;

    const loadAppointment = async () => {
      try {
        setIsLoading(true);
        const appt = await api.appointments.getById(appointmentId);
        if (!appt) {
          error('Appointment not found.');
          navigate('/doctor/dashboard');
          return;
        }

        setAppointment(appt);
        setFormData(prev => ({
          ...prev,
          chiefComplaint: appt.chief_complaint || 'Patient presents for routine clinical consultation.',
        }));
      } catch (err) {
        console.error('Error loading appointment', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadAppointment();
  }, [appointmentId, navigate]);

  const handleVitalChange = (field: string, val: string) => {
    setFormData(prev => ({
      ...prev,
      vitalSigns: {
        ...prev.vitalSigns,
        [field]: val,
      },
    }));
  };

  const handlePrescriptionsChange = (prescriptions: PrescriptionItem[]) => {
    setFormData(prev => ({
      ...prev,
      prescriptions,
    }));
  };

  const handleCompleteConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointment || !user) return;

    if (!formData.diagnosis.trim()) {
      error('Please specify a clinical diagnosis or observation.');
      return;
    }
    if (!formData.clinicalNotes.trim()) {
      error('Please write clinical examination notes.');
      return;
    }
    if (!formData.treatmentPlan.trim()) {
      error('Please provide a treatment plan or clinical advice.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.medicalRecords.completeConsultation(
        appointment.id,
        formData,
        user.id,
        appointment.patient_id
      );

      success('Consultation encounter completed and medical record generated!');
      navigate('/doctor/dashboard');
    } catch (err: any) {
      error(err.message || 'Failed to complete consultation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !appointment) {
    return (
      <div className="p-12 text-center text-slate-400">
        <Activity className="w-8 h-8 mx-auto animate-spin mb-2" />
        <p className="text-xs">Opening consultation encounter...</p>
      </div>
    );
  }

  const patient = appointment.patient;
  const patientProfile = patient?.patient_profile;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Breadcrumb & Return */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/doctor/dashboard')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Exit Consultation Room
        </button>
        <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded">
          Encounter #{appointment.id.slice(0, 8)}
        </span>
      </div>

      {/* Patient Clinical Demographics Header */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-md space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-sky-600 font-bold flex items-center justify-center text-base">
              {patient?.full_name?.charAt(0) || 'P'}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">{patient?.full_name}</h2>
              <p className="text-xs text-slate-300">
                {patient?.email} • {patient?.phone || 'No phone'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 border border-slate-700 text-slate-300">
              Age: {calculateAge(patientProfile?.date_of_birth)}
            </span>
            <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 border border-slate-700 text-slate-300 capitalize">
              Gender: {patientProfile?.gender || 'N/A'}
            </span>
            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-950/80 border border-rose-800 text-rose-300">
              Blood Group: {patientProfile?.blood_group || 'N/A'}
            </span>
          </div>
        </div>

        {/* Allergy Alert if present */}
        {patientProfile?.allergies && (
          <div className="p-2.5 rounded-lg bg-amber-950/60 border border-amber-800/80 text-amber-200 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span><strong>Allergy Warning:</strong> {patientProfile.allergies}</span>
          </div>
        )}
      </div>

      {/* Consultation Entry Form */}
      <form onSubmit={handleCompleteConsultation} className="space-y-6">
        {/* 1. Vital Signs Box */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
              <Heart className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Clinical Vital Signs
              </h3>
              <p className="text-[11px] text-slate-500">Record baseline physiological markers</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            <Input
              label="BP (mmHg)"
              placeholder="120/80"
              value={formData.vitalSigns.bp}
              onChange={(e) => handleVitalChange('bp', e.target.value)}
            />
            <Input
              label="Pulse (bpm)"
              placeholder="72"
              type="number"
              value={formData.vitalSigns.pulse}
              onChange={(e) => handleVitalChange('pulse', e.target.value)}
            />
            <Input
              label="Temp (°F)"
              placeholder="98.6"
              value={formData.vitalSigns.temp}
              onChange={(e) => handleVitalChange('temp', e.target.value)}
            />
            <Input
              label="SpO2 (%)"
              placeholder="99"
              type="number"
              value={formData.vitalSigns.spo2}
              onChange={(e) => handleVitalChange('spo2', e.target.value)}
            />
            <Input
              label="Weight (kg)"
              placeholder="70"
              type="number"
              value={formData.vitalSigns.weight}
              onChange={(e) => handleVitalChange('weight', e.target.value)}
            />
            <Input
              label="Height (cm)"
              placeholder="172"
              type="number"
              value={formData.vitalSigns.height}
              onChange={(e) => handleVitalChange('height', e.target.value)}
            />
          </div>
        </div>

        {/* 2. Chief Complaint & Clinical Examination */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <div className="p-1.5 rounded-lg bg-sky-50 text-sky-600">
              <Stethoscope className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Examination & Clinical Notes
              </h3>
              <p className="text-[11px] text-slate-500">Document symptoms, physical exam, and observations</p>
            </div>
          </div>

          <div className="space-y-3">
            <Input
              label="Chief Complaint / Primary Concern"
              required
              value={formData.chiefComplaint}
              onChange={(e) => setFormData({ ...formData, chiefComplaint: e.target.value })}
            />

            <Textarea
              label="Clinical Examination & Findings *"
              required
              rows={3}
              placeholder="e.g. Chest sounds clear, S1/S2 heard, no pedal edema, abdominal palpation soft..."
              value={formData.clinicalNotes}
              onChange={(e) => setFormData({ ...formData, clinicalNotes: e.target.value })}
            />

            <div className="p-3.5 bg-sky-50/70 border border-sky-200 rounded-xl">
              <Input
                label="Clinical Diagnosis (ICD-10 / Description) *"
                required
                placeholder="e.g. Stable Angina Pectoris (I20.9), Essential Hypertension"
                value={formData.diagnosis}
                onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
              />
            </div>

            <Textarea
              label="Treatment Plan & Dietary Advice *"
              required
              rows={3}
              placeholder="e.g. Low sodium DASH diet, moderate aerobic walking 30 mins, avoid heavy lifting..."
              value={formData.treatmentPlan}
              onChange={(e) => setFormData({ ...formData, treatmentPlan: e.target.value })}
            />
          </div>
        </div>

        {/* 3. Prescription Builder */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <PrescriptionBuilder
            prescriptions={formData.prescriptions}
            onChange={handlePrescriptionsChange}
          />
        </div>

        {/* 4. Follow-up Scheduler */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Follow-up Review
              </h3>
              <p className="text-[11px] text-slate-500">Recommend subsequent consultation date</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Follow-up Date"
              type="date"
              min={getTodayDateString()}
              value={formData.followUpDate}
              onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
            />
            <Input
              label="Follow-up Instructions / Tests to bring"
              placeholder="e.g. Bring repeat fasting lipid profile and ECG report"
              value={formData.followUpNotes}
              onChange={(e) => setFormData({ ...formData, followUpNotes: e.target.value })}
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 shadow-sm sticky bottom-4 z-20">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/doctor/dashboard')}
            disabled={isSubmitting}
          >
            Cancel & Keep In Queue
          </Button>

          <Button
            type="submit"
            variant="success"
            size="lg"
            isLoading={isSubmitting}
            leftIcon={<CheckCircle2 className="w-5 h-5" />}
          >
            Complete Consultation & Generate Rx
          </Button>
        </div>
      </form>
    </div>
  );
};
