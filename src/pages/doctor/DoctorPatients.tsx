// ==============================================================================
// ClinicFlow — Doctor: Patient Directory & Clinical History
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import { Profile, PatientProfile, MedicalRecord, PatientWithDetails } from '@/types';
import { DataTable, Column } from '@/components/common/DataTable';
import { SearchFilterBar } from '@/components/common/SearchFilterBar';
import { Button } from '@/components/common/Button';
import { MedicalRecordViewModal } from '@/components/medical/MedicalRecordViewModal';
import { formatDate, calculateAge } from '@/lib/dateUtils';
import { Users, FileText, AlertTriangle, ShieldCheck, Heart } from 'lucide-react';

export const DoctorPatients: React.FC = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState<PatientWithDetails[]>([]);
  const [selectedPatientRecords, setSelectedPatientRecords] = useState<MedicalRecord[]>([]);
  const [activeRecord, setActiveRecord] = useState<MedicalRecord | null>(null);
  const [viewingPatient, setViewingPatient] = useState<PatientWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadPatients = async () => {
      try {
        setIsLoading(true);
        const data = await api.patients.getAll();
        setPatients(data);
      } catch (err) {
        console.error('Failed to load doctor patients', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadPatients();
  }, []);

  const handleViewHistory = async (patient: PatientWithDetails) => {
    setViewingPatient(patient);
    try {
      const records = await api.medicalRecords.getAll({ patientId: patient.id });
      setSelectedPatientRecords(records);
    } catch (e) {
      console.error('Failed to load patient records', e);
    }
  };

  const filteredPatients = patients.filter(p =>
    p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.email && p.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (p.phone && p.phone.includes(searchQuery)) ||
    (p.whatsapp_number && p.whatsapp_number.includes(searchQuery))
  );

  const columns: Column<PatientWithDetails>[] = [
    {
      key: 'name',
      header: 'Patient Identity',
      render: (p) => (
        <div>
          <p className="font-bold text-slate-900 text-sm">{p.full_name}</p>
          <p className="text-xs text-slate-500">{p.whatsapp_number || p.phone || p.email || 'No contact'}</p>
        </div>
      ),
    },
    {
      key: 'demographics',
      header: 'Age / Gender',
      render: (p) => (
        <span className="text-xs text-slate-700 font-medium">
          {calculateAge(p.date_of_birth || p.patient_profile?.date_of_birth)} • <span className="capitalize">{p.gender || p.patient_profile?.gender || 'N/A'}</span>
        </span>
      ),
    },
    {
      key: 'blood_group',
      header: 'Blood Group',
      render: (p) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
          {p.blood_group || p.patient_profile?.blood_group || 'N/A'}
        </span>
      ),
    },
    {
      key: 'allergies',
      header: 'Known Allergies',
      render: (p) => (
        <div className="flex items-center gap-1.5 text-xs text-amber-700">
          {(p.allergies || p.patient_profile?.allergies) ? (
            <>
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate max-w-xs">{p.allergies || p.patient_profile?.allergies}</span>
            </>
          ) : (
            <span className="text-slate-400">None noted</span>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (p) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleViewHistory(p)}
          leftIcon={<FileText className="w-3.5 h-3.5 text-sky-600" />}
        >
          Medical History
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Patient Clinical Directory</h1>
          <p className="text-xs text-slate-500">
            Access authorized patient medical summaries, allergy records, and historical consultation notes
          </p>
        </div>
      </div>

      <SearchFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search patients by name, email, or phone..."
      />

      <DataTable
        columns={columns}
        data={filteredPatients}
        keyExtractor={(p) => p.id}
        isLoading={isLoading}
        emptyTitle="No matching patients found"
        emptyDescription="Try searching with a different name or keyword."
      />

      {/* Patient Clinical History Modal */}
      {viewingPatient && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setViewingPatient(null)} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl border border-slate-200 p-6 shadow-2xl max-w-2xl w-full space-y-4">
              <div className="flex items-start justify-between pb-3 border-b border-slate-200">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Clinical Encounter History — {viewingPatient.full_name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {viewingPatient.email} • {viewingPatient.phone}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setViewingPatient(null)}>
                  Close
                </Button>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {selectedPatientRecords.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    No prior medical records recorded for this patient.
                  </div>
                ) : (
                  selectedPatientRecords.map(rec => (
                    <div
                      key={rec.id}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2 hover:bg-white transition-colors"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-900">{formatDate(rec.created_at)}</span>
                        <span className="text-sky-700 font-semibold">{rec.doctor?.full_name}</span>
                      </div>
                      <p className="text-xs text-slate-800 font-semibold">{rec.diagnosis}</p>
                      <p className="text-xs text-slate-600 line-clamp-2">{rec.treatment_plan}</p>
                      <div className="pt-2 border-t border-slate-200 flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setActiveRecord(rec)}
                          leftIcon={<FileText className="w-3.5 h-3.5" />}
                        >
                          View Full Record
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full Record Modal */}
      {activeRecord && (
        <MedicalRecordViewModal
          isOpen={Boolean(activeRecord)}
          onClose={() => setActiveRecord(null)}
          record={activeRecord}
        />
      )}
    </div>
  );
};
