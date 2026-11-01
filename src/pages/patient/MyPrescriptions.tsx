// ==============================================================================
// ClinicFlow — Patient: Digital Prescriptions & Pharmacy Orders
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import { Prescription, MedicalRecord } from '@/types';
import { DataTable, Column } from '@/components/common/DataTable';
import { Button } from '@/components/common/Button';
import { PrescriptionPrintModal } from '@/components/medical/PrescriptionPrintModal';
import { formatDate } from '@/lib/dateUtils';
import { Pill, Printer, Stethoscope, Clock, ShieldCheck } from 'lucide-react';

export const MyPrescriptions: React.FC = () => {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState<Array<Prescription & { doctor?: any; record?: any }>>([]);
  const [selectedPrintRecord, setSelectedPrintRecord] = useState<MedicalRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPrescriptions = async () => {
      if (!user?.id) return;
      try {
        setIsLoading(true);
        const data = await api.prescriptions.getAll(user.id);
        setPrescriptions(data);
      } catch (err) {
        console.error('Failed to load prescriptions', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadPrescriptions();
  }, [user?.id]);

  const columns: Column<Prescription & { doctor?: any; record?: any }>[] = [
    {
      key: 'medication',
      header: 'Medication & Dosage',
      render: (rx) => (
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-sky-50 text-sky-600">
            <Pill className="w-4 h-4" />
          </div>
          <div>
            <p className="font-bold text-slate-900 text-sm">{rx.medication_name}</p>
            <span className="text-xs font-semibold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">
              {rx.dosage}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'frequency',
      header: 'Schedule / Frequency',
      render: (rx) => (
        <div>
          <p className="text-xs font-semibold text-slate-800">{rx.frequency}</p>
          <p className="text-[11px] text-slate-500">Duration: {rx.duration}</p>
        </div>
      ),
    },
    {
      key: 'instructions',
      header: 'Instructions',
      render: (rx) => (
        <span className="text-xs text-slate-600 italic">
          {rx.instructions || 'As directed by physician'}
        </span>
      ),
    },
    {
      key: 'doctor',
      header: 'Prescribing Physician',
      render: (rx) => (
        <div>
          <p className="text-xs font-semibold text-slate-800">{rx.doctor?.full_name || 'Dr. Specialist'}</p>
          <p className="text-[10px] text-slate-400">{formatDate(rx.created_at)}</p>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (rx) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (rx.record) {
              setSelectedPrintRecord({
                ...rx.record,
                doctor: rx.doctor,
                patient: user as any,
                prescriptions: [rx],
              });
            }
          }}
          leftIcon={<Printer className="w-3.5 h-3.5" />}
        >
          Print Slip
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Electronic Prescriptions</h1>
          <p className="text-xs text-slate-500">
            Active medication schedules, dosage instructions, and printable clinical pharmacy slips
          </p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={prescriptions}
        keyExtractor={(rx) => rx.id}
        isLoading={isLoading}
        emptyTitle="No prescriptions on record"
        emptyDescription="Prescriptions written by your doctor during encounters will appear here."
      />

      {/* Print Slip Modal */}
      {selectedPrintRecord && (
        <PrescriptionPrintModal
          isOpen={Boolean(selectedPrintRecord)}
          onClose={() => setSelectedPrintRecord(null)}
          record={selectedPrintRecord}
        />
      )}
    </div>
  );
};
