// ==============================================================================
// ClinicFlow — Printable Digital Prescription & Clinic Slip Modal
// Formatted for standard medical documentation and browser printing
// ==============================================================================

import React from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { MedicalRecord } from '@/types';
import { formatDate } from '@/lib/dateUtils';
import { Printer, X, ShieldCheck, Activity } from 'lucide-react';

interface PrescriptionPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: MedicalRecord;
}

export const PrescriptionPrintModal: React.FC<PrescriptionPrintModalProps> = ({
  isOpen,
  onClose,
  record,
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Print Digital Prescription" maxWidth="2xl">
      <div className="space-y-4">
        {/* Printable Paper Canvas */}
        <div id="printable-prescription" className="bg-white border-2 border-slate-300 rounded-xl p-6 sm:p-8 font-serif text-slate-900 shadow-sm space-y-5">
          {/* Clinic Header */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-slate-900 text-white rounded">
                  <Activity className="w-5 h-5" />
                </div>
                <h1 className="text-xl font-bold font-sans tracking-tight text-slate-950">
                  Clinic<span className="text-sky-600">Flow</span> Health Network
                </h1>
              </div>
              <p className="text-xs font-sans text-slate-500 mt-1">
                Multi-Specialty Cloud Outpatient Center • ISO 9001:2026 Certified
              </p>
              <p className="text-xs font-sans text-slate-500">
                VIT Chennai Healthcare Complex, Vandalur-Kelambakkam Road, Chennai - 600127
              </p>
            </div>
            <div className="text-right font-sans">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Rx Slip ID</span>
              <span className="text-xs font-mono font-bold text-slate-800">#{record.id.slice(0, 8).toUpperCase()}</span>
              <p className="text-xs text-slate-500 mt-1">Date: {formatDate(record.created_at)}</p>
            </div>
          </div>

          {/* Doctor & Patient Information Strip */}
          <div className="grid grid-cols-2 gap-4 font-sans text-xs bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <div>
              <p className="font-bold text-slate-900 text-sm">{record.doctor?.full_name || 'Dr. Specialist'}</p>
              <p className="text-slate-600">License: MCI-SPEC-2026</p>
              <p className="text-slate-500">{record.doctor?.phone || 'Emergency Desk: +91 98401 23456'}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-slate-900 text-sm">Patient: {record.patient?.full_name}</p>
              <p className="text-slate-600">Phone: {record.patient?.phone || 'N/A'}</p>
              <p className="text-slate-500">Diagnosis: <span className="font-semibold text-slate-800">{record.diagnosis}</span></p>
            </div>
          </div>

          {/* Vitals Ribbon */}
          {record.vital_signs && (
            <div className="font-sans text-[11px] flex items-center justify-between bg-slate-100/70 px-3 py-1.5 rounded border border-slate-200 text-slate-700">
              <span><strong>BP:</strong> {record.vital_signs.bp || '120/80'}</span>
              <span><strong>Pulse:</strong> {record.vital_signs.pulse || 72} bpm</span>
              <span><strong>Temp:</strong> {record.vital_signs.temp || 98.6}°F</span>
              <span><strong>SpO2:</strong> {record.vital_signs.spo2 || 99}%</span>
              <span><strong>Weight:</strong> {record.vital_signs.weight || 70} kg</span>
            </div>
          )}

          {/* Rx Section */}
          <div className="pt-2">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl font-bold font-serif text-sky-800 italic">Rx</span>
              <span className="text-xs font-sans font-bold uppercase tracking-wider text-slate-400">
                Prescription Details
              </span>
            </div>

            <table className="w-full text-left font-sans text-xs border border-slate-300">
              <thead className="bg-slate-100 border-b border-slate-300 text-[10px] font-bold uppercase text-slate-600">
                <tr>
                  <th className="p-2.5">#</th>
                  <th className="p-2.5">Medication Name & Strength</th>
                  <th className="p-2.5">Dosage</th>
                  <th className="p-2.5">Frequency</th>
                  <th className="p-2.5">Duration</th>
                  <th className="p-2.5">Instructions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {record.prescriptions && record.prescriptions.length > 0 ? (
                  record.prescriptions.map((rx, idx) => (
                    <tr key={idx}>
                      <td className="p-2.5 font-bold text-slate-500">{idx + 1}</td>
                      <td className="p-2.5 font-bold text-slate-900">{rx.medication_name}</td>
                      <td className="p-2.5">{rx.dosage}</td>
                      <td className="p-2.5 font-semibold text-sky-800">{rx.frequency}</td>
                      <td className="p-2.5">{rx.duration}</td>
                      <td className="p-2.5 text-slate-600 italic">{rx.instructions || 'As directed'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-slate-400 italic">
                      No pharmacological medications prescribed during this encounter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Clinical Advice & Follow Up */}
          <div className="font-sans text-xs space-y-2 pt-2 border-t border-slate-200">
            <div>
              <span className="font-bold text-slate-800">Dietary & Clinical Advice:</span>
              <p className="text-slate-600 whitespace-pre-line mt-0.5">{record.treatment_plan}</p>
            </div>
            {record.follow_up_date && (
              <div className="pt-1">
                <span className="font-bold text-slate-800">Next Review:</span>{' '}
                <span className="text-sky-700 font-semibold">{formatDate(record.follow_up_date)}</span>{' '}
                {record.follow_up_notes && <span className="text-slate-500">({record.follow_up_notes})</span>}
              </div>
            )}
          </div>

          {/* Doctor Digital Signature Stamp */}
          <div className="flex items-end justify-between pt-6 border-t-2 border-slate-800 font-sans">
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-700">
              <ShieldCheck className="w-4 h-4" />
              <span>Digitally Verified & Signed via ClinicFlow Cloud SaaS</span>
            </div>
            <div className="text-center">
              <div className="font-serif italic text-base font-bold text-slate-800 tracking-wide mb-1">
                {record.doctor?.full_name || 'Dr. Specialist'}
              </div>
              <p className="text-[10px] uppercase tracking-wider text-slate-500 border-t border-slate-300 pt-1">
                Authorized Medical Practitioner
              </p>
            </div>
          </div>
        </div>

        {/* Modal Controls */}
        <div className="flex justify-end gap-2.5 pt-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button variant="primary" onClick={handlePrint} leftIcon={<Printer className="w-4 h-4" />}>
            Print / Save PDF
          </Button>
        </div>
      </div>
    </Modal>
  );
};
