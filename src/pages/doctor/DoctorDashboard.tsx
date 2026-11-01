// ==============================================================================
// ClinicFlow — Doctor: Clinical Dashboard & Live Queue
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import { Appointment, MedicalRecord } from '@/types';
import { StatCard, LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/common/Button';
import { MedicalRecordViewModal } from '@/components/medical/MedicalRecordViewModal';
import { formatDate, formatTime, getTodayDateString } from '@/lib/dateUtils';
import { useNavigate } from 'react-router-dom';
import { 
  Stethoscope, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  User, 
  ArrowRight, 
  FileText,
  Activity
} from 'lucide-react';

export const DoctorDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [recentRecords, setRecentRecords] = useState<MedicalRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadDoctorData = async () => {
    if (!user?.id) return;
    try {
      setIsLoading(true);
      const todayStr = getTodayDateString();
      const [appts, records] = await Promise.all([
        api.appointments.getAll({
          doctorId: user.id,
          dateFrom: todayStr,
          dateTo: todayStr,
        }),
        api.medicalRecords.getAll({ doctorId: user.id }),
      ]);

      setTodayAppointments(appts);
      setRecentRecords(records.slice(0, 5));
    } catch (err) {
      console.error('Error loading doctor dashboard', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDoctorData();
  }, [user?.id]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton type="cards" rows={4} />
        <LoadingSkeleton type="table" rows={5} />
      </div>
    );
  }

  const completedToday = todayAppointments.filter(a => a.status === 'completed').length;
  const pendingToday = todayAppointments.filter(a => a.status === 'confirmed' || a.status === 'pending').length;
  const nextInLine = todayAppointments.find(a => a.status === 'confirmed');

  return (
    <div className="space-y-6">
      {/* Doctor Header Banner */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-600 text-white font-bold flex items-center justify-center text-lg shadow-sm">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {user?.full_name || 'Dr. Specialist'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Consultation Room 102 • Active Clinic Session • {formatDate(new Date())}
            </p>
          </div>
        </div>

        <Button
          variant="primary"
          onClick={() => navigate('/doctor/appointments')}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          View Full Schedule
        </Button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Today's Consultation Queue"
          value={todayAppointments.length}
          icon={Calendar}
          color="sky"
          subtitle="Scheduled encounters for today"
        />
        <StatCard
          title="Pending Patient Visits"
          value={pendingToday}
          icon={Clock}
          color="amber"
          subtitle="Waiting in consultation queue"
        />
        <StatCard
          title="Completed Today"
          value={completedToday}
          icon={CheckCircle2}
          color="emerald"
          subtitle="Consultations with recorded Rx"
        />
      </div>

      {/* Next Patient Spotlight Card */}
      {nextInLine && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-sky-900 to-slate-900 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 border border-sky-800">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-500/30 text-sky-200 border border-sky-400/30">
                Next Up in Queue
              </span>
              <span className="text-xs text-slate-300 font-mono">
                {formatTime(nextInLine.start_time)} – {formatTime(nextInLine.end_time)}
              </span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                {nextInLine.patient?.full_name}
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Chief Complaint: "{nextInLine.chief_complaint || 'Routine checkup'}"
              </p>
            </div>
          </div>

          <Button
            variant="primary"
            className="bg-white text-slate-900 hover:bg-sky-50 border-none font-bold shrink-0"
            onClick={() => navigate(`/doctor/consultation/${nextInLine.id}`)}
            leftIcon={<Stethoscope className="w-4 h-4 text-sky-600" />}
          >
            Start Clinical Consultation
          </Button>
        </div>
      )}

      {/* Today's Queue Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800 tracking-tight">Today's Appointment Schedule</h3>
            <p className="text-xs text-slate-500">Live sequence of today's booked patient visits</p>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
            {todayAppointments.length} Bookings
          </span>
        </div>

        {todayAppointments.length === 0 ? (
          <div className="p-8 bg-white rounded-xl border border-slate-200 text-center text-slate-400">
            <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs font-semibold">No appointments scheduled for today.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {todayAppointments.map(appt => (
              <div
                key={appt.id}
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between gap-3 hover:shadow-card transition-shadow"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs border border-slate-200">
                      {appt.patient?.full_name?.charAt(0) || 'P'}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{appt.patient?.full_name}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-sky-600" />
                        {formatTime(appt.start_time)} – {formatTime(appt.end_time)}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={appt.status} variant="status" size="sm" />
                </div>

                <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 italic line-clamp-1">
                  "{appt.chief_complaint || 'Consultation'}"
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-[11px] text-slate-400 font-mono">#{appt.id.slice(0, 8)}</span>
                  {appt.status === 'confirmed' || appt.status === 'in_progress' ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => navigate(`/doctor/consultation/${appt.id}`)}
                      leftIcon={<Stethoscope className="w-3.5 h-3.5" />}
                    >
                      Conduct Visit
                    </Button>
                  ) : appt.status === 'completed' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        const rec = await api.medicalRecords.getByAppointmentId(appt.id);
                        setSelectedRecord(rec);
                      }}
                      leftIcon={<FileText className="w-3.5 h-3.5 text-sky-600" />}
                    >
                      View Notes & Rx
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Completed Encounters */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-800">Recent Completed Consultation Records</h3>
        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
          {recentRecords.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">No recent completed consultations.</div>
          ) : (
            recentRecords.map(rec => (
              <div key={rec.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-slate-900">{rec.patient?.full_name}</p>
                    <span className="text-[10px] text-slate-400">{formatDate(rec.created_at)}</span>
                  </div>
                  <p className="text-xs text-sky-700 font-medium line-clamp-1">{rec.diagnosis}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedRecord(rec)}
                  leftIcon={<FileText className="w-3.5 h-3.5" />}
                >
                  View Summary
                </Button>
              </div>
            ))
          )}
        </div>
      </div>

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
