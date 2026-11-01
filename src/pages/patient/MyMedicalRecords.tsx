// ==============================================================================
// ClinicFlow — Patient: Medical Records & Clinical Encounters Timeline
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import { MedicalRecord } from '@/types';
import { MedicalRecordViewModal } from '@/components/medical/MedicalRecordViewModal';
import { PrescriptionPrintModal } from '@/components/medical/PrescriptionPrintModal';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { Button } from '@/components/common/Button';
import { formatDate } from '@/lib/dateUtils';
import { 
  FileText, 
  Stethoscope, 
  Heart, 
  Activity, 
  Calendar, 
  Printer, 
  Pill,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export const MyMedicalRecords: React.FC = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [printRecord, setPrintRecord] = useState<MedicalRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadRecords = async () => {
      if (!user?.id) return;
      try {
        setIsLoading(true);
        const data = await api.medicalRecords.getAll({ patientId: user.id });
        setRecords(data);
      } catch (err) {
        console.error('Failed to load patient medical records', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadRecords();
  }, [user?.id]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Electronic Medical Records</h1>
          <p className="text-xs text-slate-500">
            Confidential history of clinical consultations, doctor diagnoses, and vitals tracking
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 font-semibold">
          <ShieldCheck className="w-4 h-4" />
          <span>HIPAA & RLS Protected Access</span>
        </div>
      </div>

      {isLoading ? (
        <LoadingSkeleton type="cards" rows={3} />
      ) : records.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center shadow-xs">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h4 className="text-sm font-semibold text-slate-800">No medical records on file yet</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Clinical summaries and prescriptions will appear here following your completed consultations.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {records.map(rec => (
            <div
              key={rec.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs hover:shadow-card transition-shadow space-y-4"
            >
              {/* Record Top Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{rec.diagnosis}</h3>
                    <p className="text-xs text-slate-500">
                      Consulting Physician: <span className="font-semibold text-slate-700">{rec.doctor?.full_name}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Calendar className="w-3.5 h-3.5 text-sky-600" />
                  <span>Encounter Date: {formatDate(rec.created_at)}</span>
                </div>
              </div>

              {/* Vitals Summary Strip */}
              {rec.vital_signs && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center gap-2">
                    <Heart className="w-4 h-4 text-rose-500 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">BP</span>
                      <span className="font-semibold text-slate-800">{rec.vital_signs.bp || '120/80'}</span>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-500 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Pulse</span>
                      <span className="font-semibold text-slate-800">{rec.vital_signs.pulse || 72} bpm</span>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-sky-500 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">SpO2</span>
                      <span className="font-semibold text-slate-800">{rec.vital_signs.spo2 || 99}%</span>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center gap-2">
                    <Pill className="w-4 h-4 text-purple-500 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Prescribed Rx</span>
                      <span className="font-semibold text-slate-800">{rec.prescriptions?.length || 0} Drugs</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Treatment Summary */}
              <div className="text-xs text-slate-600 bg-slate-50/70 p-3.5 rounded-xl border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Physician Treatment Plan & Advice
                </span>
                <p className="whitespace-pre-line leading-relaxed">{rec.treatment_plan}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-[11px] font-mono text-slate-400">ID: #{rec.id.slice(0, 8)}</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPrintRecord(rec)}
                    leftIcon={<Printer className="w-3.5 h-3.5" />}
                  >
                    Print Rx Slip
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setSelectedRecord(rec)}
                    leftIcon={<FileText className="w-3.5 h-3.5" />}
                  >
                    View Full Clinical Report
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Record Modal */}
      {selectedRecord && (
        <MedicalRecordViewModal
          isOpen={Boolean(selectedRecord)}
          onClose={() => setSelectedRecord(null)}
          record={selectedRecord}
        />
      )}

      {/* Print Modal */}
      {printRecord && (
        <PrescriptionPrintModal
          isOpen={Boolean(printRecord)}
          onClose={() => setPrintRecord(null)}
          record={printRecord}
        />
      )}
    </div>
  );
};
