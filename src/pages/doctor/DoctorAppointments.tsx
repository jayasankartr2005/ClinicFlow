// ==============================================================================
// ClinicFlow — Doctor: Appointments Queue & History
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import { Appointment, MedicalRecord } from '@/types';
import { SearchFilterBar } from '@/components/common/SearchFilterBar';
import { AppointmentCard } from '@/components/appointment/AppointmentCard';
import { MedicalRecordViewModal } from '@/components/medical/MedicalRecordViewModal';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { useNavigate } from 'react-router-dom';
import { Calendar, Filter } from 'lucide-react';

export const DoctorAppointments: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Tab & Filters
  const [activeTab, setActiveTab] = useState<'today' | 'upcoming' | 'completed' | 'all'>('today');
  const [searchQuery, setSearchQuery] = useState('');

  const loadAppointments = async () => {
    if (!user?.id) return;
    try {
      setIsLoading(true);
      const data = await api.appointments.getAll({ doctorId: user.id });
      setAppointments(data);
    } catch (err) {
      console.error('Failed to load appointments', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, [user?.id]);

  const todayStr = new Date().toISOString().slice(0, 10);

  const filteredAppointments = appointments.filter(a => {
    const matchesSearch =
      (a.patient?.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.chief_complaint || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === 'today') {
      return a.appointment_date === todayStr;
    } else if (activeTab === 'upcoming') {
      return a.appointment_date > todayStr && a.status !== 'cancelled';
    } else if (activeTab === 'completed') {
      return a.status === 'completed';
    }
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Physician Appointment Queue</h1>
          <p className="text-xs text-slate-500">
            View patient schedule, start clinical encounters, and review medical summaries
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('today')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'today'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'upcoming'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'completed'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Completed
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All History
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <SearchFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search patients or symptoms..."
      />

      {/* Appointment Cards List */}
      {isLoading ? (
        <LoadingSkeleton type="cards" rows={4} />
      ) : filteredAppointments.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center shadow-xs">
          <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h4 className="text-sm font-semibold text-slate-800">No appointments found in this view</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            There are no appointments matching the selected tab or search query.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAppointments.map(appt => (
            <AppointmentCard
              key={appt.id}
              appointment={appt}
              perspective="doctor"
              onStartConsultation={(a) => navigate(`/doctor/consultation/${a.id}`)}
              onViewRecord={async (a) => {
                const rec = await api.medicalRecords.getByAppointmentId(a.id);
                setSelectedRecord(rec);
              }}
            />
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
    </div>
  );
};
