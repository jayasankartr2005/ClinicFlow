// ==============================================================================
// ClinicFlow — Receptionist: Patient Directory & Search
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { Profile, PatientProfile, PatientWithDetails } from '@/types';
import { DataTable, Column } from '@/components/common/DataTable';
import { SearchFilterBar } from '@/components/common/SearchFilterBar';
import { Button } from '@/components/common/Button';
import { BookingModal } from '@/components/appointment/BookingModal';
import { formatDate, calculateAge } from '@/lib/dateUtils';
import { Users, CalendarPlus, UserPlus, Phone, Mail, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const PatientDirectory: React.FC = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<PatientWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [bookingPatientId, setBookingPatientId] = useState<string | null>(null);

  const loadPatients = async () => {
    try {
      setIsLoading(true);
      const data = await api.patients.getAll();
      setPatients(data);
    } catch (err) {
      console.error('Error loading patients', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  const filteredPatients = patients.filter(p =>
    p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.email && p.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (p.phone && p.phone.includes(searchQuery)) ||
    (p.whatsapp_number && p.whatsapp_number.includes(searchQuery))
  );

  const columns: Column<PatientWithDetails>[] = [
    {
      key: 'name',
      header: 'Patient Name & Contact',
      render: (p) => (
        <div>
          <p className="font-bold text-slate-900 text-sm">{p.full_name}</p>
          <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
            {p.whatsapp_number && (
              <span className="flex items-center gap-1 font-mono text-emerald-700">
                <MessageSquare className="w-3 h-3 text-emerald-600" />
                {p.whatsapp_number}
              </span>
            )}
            {p.phone && (
              <span className="flex items-center gap-1 font-mono">
                <Phone className="w-3 h-3 text-slate-400" />
                {p.phone}
              </span>
            )}
            {p.email && (
              <span className="flex items-center gap-1">
                <Mail className="w-3 h-3 text-slate-400" />
                {p.email}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'demographics',
      header: 'Demographics',
      render: (p) => (
        <span className="text-xs text-slate-700">
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
      key: 'emergency',
      header: 'Emergency Contact',
      render: (p) => (
        <div className="text-xs text-slate-600">
          <p className="font-medium text-slate-800">{p.emergency_contact_name || p.patient_profile?.emergency_contact_name || '—'}</p>
          <p className="text-[11px] text-slate-400 font-mono">{p.emergency_contact_phone || p.patient_profile?.emergency_contact_phone || ''}</p>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (p) => (
        <Button
          variant="primary"
          size="sm"
          onClick={() => setBookingPatientId(p.id)}
          leftIcon={<CalendarPlus className="w-3.5 h-3.5" />}
        >
          Book Slot
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Patient Directory</h1>
          <p className="text-xs text-slate-500">
            Search patient records, emergency contacts, and book physician consultations
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => navigate('/receptionist/register')}
          leftIcon={<UserPlus className="w-4 h-4" />}
        >
          Register New Patient
        </Button>
      </div>

      <SearchFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search patients by name, phone, or email..."
      />

      <DataTable
        columns={columns}
        data={filteredPatients}
        keyExtractor={(p) => p.id}
        isLoading={isLoading}
        emptyTitle="No matching patients found"
        emptyDescription="Try adjusting your search criteria."
      />

      {/* Booking Modal */}
      {bookingPatientId && (
        <BookingModal
          isOpen={Boolean(bookingPatientId)}
          onClose={() => setBookingPatientId(null)}
          initialPatientId={bookingPatientId}
          onSuccess={() => {
            setBookingPatientId(null);
            navigate('/receptionist/dashboard');
          }}
        />
      )}
    </div>
  );
};
