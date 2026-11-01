// ==============================================================================
// ClinicFlow — Medical Record & Consultation Summary Modal Component
// ==============================================================================

import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { MedicalRecord } from '@/types';
import { formatDate, formatTime } from '@/lib/dateUtils';
import { PrescriptionPrintModal } from './PrescriptionPrintModal';
import { 
  FileText, 
  Stethoscope, 
  User, 
  Calendar, 
  Heart, 
  Activity, 
  Thermometer, 
  Weight, 
  Printer, 
  Pill,
  Clock
} from 'lucide-react';

interface MedicalRecordViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: MedicalRecord | null;
}

export const MedicalRecordViewModal: React.FC<MedicalRecordViewModalProps> = ({
  isOpen,
  onClose,
  record,
}) => {
  const [showPrintModal, setShowPrintModal] = useState(false);

  if (!record) return null;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Clinical Medical Record"
        subtitle={`Encounter Record ID: #${record.id.slice(0, 8)} • Completed on ${formatDate(record.created_at)}`}
        maxWidth="2xl"
      >
        <div className="space-y-5 text-slate-800">
          {/* Patient & Doctor Header Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
                <User className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Patient</span>
                <p className="text-sm font-bold text-slate-900">{record.patient?.full_name || 'Patient'}</p>
                <p className="text-xs text-slate-500">{record.patient?.phone || record.patient?.email}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 border-t sm:border-t-0 sm:border-l sm:pl-3 border-slate-200 pt-2 sm:pt-0">
              <div className="p-2 rounded-lg bg-sky-100 text-sky-700">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Consulting Physician</span>
                <p className="text-sm font-bold text-slate-900">{record.doctor?.full_name || 'Doctor'}</p>
                <p className="text-xs text-slate-500">Authorized Medical Specialist</p>
              </div>
            </div>
          </div>

          {/* Vitals Summary Grid */}
          {record.vital_signs && (
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
                Recorded Vital Signs
              </span>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                <div className="p-2.5 bg-rose-50/50 border border-rose-100 rounded-lg text-center">
                  <Heart className="w-3.5 h-3.5 text-rose-500 mx-auto mb-1" />
                  <span className="text-[10px] text-slate-500 block">Blood Pressure</span>
                  <span className="text-xs font-bold text-slate-800">{record.vital_signs.bp || '120/80'}</span>
                </div>
                <div className="p-2.5 bg-emerald-50/50 border border-emerald-100 rounded-lg text-center">
                  <Activity className="w-3.5 h-3.5 text-emerald-500 mx-auto mb-1" />
                  <span className="text-[10px] text-slate-500 block">Pulse Rate</span>
                  <span className="text-xs font-bold text-slate-800">{record.vital_signs.pulse || 72} bpm</span>
                </div>
                <div className="p-2.5 bg-amber-50/50 border border-amber-100 rounded-lg text-center">
                  <Thermometer className="w-3.5 h-3.5 text-amber-500 mx-auto mb-1" />
                  <span className="text-[10px] text-slate-500 block">Temperature</span>
                  <span className="text-xs font-bold text-slate-800">{record.vital_signs.temp || 98.6}°F</span>
                </div>
                <div className="p-2.5 bg-sky-50/50 border border-sky-100 rounded-lg text-center">
                  <Activity className="w-3.5 h-3.5 text-sky-500 mx-auto mb-1" />
                  <span className="text-[10px] text-slate-500 block">SpO2 Level</span>
                  <span className="text-xs font-bold text-slate-800">{record.vital_signs.spo2 || 99}%</span>
                </div>
                <div className="p-2.5 bg-purple-50/50 border border-purple-100 rounded-lg text-center">
                  <Weight className="w-3.5 h-3.5 text-purple-500 mx-auto mb-1" />
                  <span className="text-[10px] text-slate-500 block">Weight</span>
                  <span className="text-xs font-bold text-slate-800">{record.vital_signs.weight || 70} kg</span>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-center">
                  <Activity className="w-3.5 h-3.5 text-slate-400 mx-auto mb-1" />
                  <span className="text-[10px] text-slate-500 block">Height</span>
                  <span className="text-xs font-bold text-slate-800">{record.vital_signs.height || 170} cm</span>
                </div>
              </div>
            </div>
          )}

          {/* Chief Complaint & Notes */}
          <div className="space-y-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Chief Complaint & Presenting Symptoms
              </span>
              <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200 leading-relaxed">
                {record.chief_complaint || 'General medical follow up'}
              </p>
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Clinical Examination & Notes
              </span>
              <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200 whitespace-pre-line leading-relaxed">
                {record.clinical_notes}
              </p>
            </div>

            <div className="p-3 bg-sky-50/50 border border-sky-200 rounded-lg">
              <span className="text-[11px] font-bold uppercase tracking-wider text-sky-800 block mb-0.5">
                Clinical Diagnosis
              </span>
              <p className="text-sm font-bold text-sky-950">{record.diagnosis}</p>
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Treatment Plan & Advice
              </span>
              <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200 whitespace-pre-line leading-relaxed">
                {record.treatment_plan}
              </p>
            </div>
          </div>

          {/* Prescriptions List */}
          {record.prescriptions && record.prescriptions.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Pill className="w-4 h-4 text-sky-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Prescribed Medications ({record.prescriptions.length})
                </span>
              </div>
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/70 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Medication</th>
                      <th className="px-3 py-2">Dosage</th>
                      <th className="px-3 py-2">Frequency</th>
                      <th className="px-3 py-2">Duration</th>
                      <th className="px-3 py-2">Instructions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {record.prescriptions.map((rx, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="px-3 py-2 font-semibold text-slate-900">{rx.medication_name}</td>
                        <td className="px-3 py-2 text-slate-600">{rx.dosage}</td>
                        <td className="px-3 py-2 text-sky-700 font-medium">{rx.frequency}</td>
                        <td className="px-3 py-2 text-slate-600">{rx.duration}</td>
                        <td className="px-3 py-2 text-slate-500 italic">{rx.instructions || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Follow-up Note */}
          {record.follow_up_date && (
            <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-600" />
                <div>
                  <span className="font-bold text-amber-900">Follow-up Appointment Recommended</span>
                  {record.follow_up_notes && <p className="text-amber-800 text-[11px]">{record.follow_up_notes}</p>}
                </div>
              </div>
              <span className="font-bold text-amber-900 px-2 py-1 bg-amber-100 rounded">
                {formatDate(record.follow_up_date)}
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPrintModal(true)}
              leftIcon={<Printer className="w-4 h-4" />}
            >
              Print Prescription Slip
            </Button>
            <Button variant="secondary" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* Printable Prescription Modal */}
      {showPrintModal && (
        <PrescriptionPrintModal
          isOpen={showPrintModal}
          onClose={() => setShowPrintModal(false)}
          record={record}
        />
      )}
    </>
  );
};
