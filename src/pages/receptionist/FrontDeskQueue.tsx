// ==============================================================================
// ClinicFlow — Receptionist: Live Patient Queue Manager
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { Appointment } from '@/types';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/common/Button';
import { useToast } from '@/contexts/ToastContext';
import { formatDate, formatTime, getTodayDateString } from '@/lib/dateUtils';
import { ListOrdered, CheckCircle2, UserCheck, Clock, UserX } from 'lucide-react';

export const FrontDeskQueue: React.FC = () => {
  const { success, error } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadQueue = async () => {
    try {
      setIsLoading(true);
      const todayStr = getTodayDateString();
      const data = await api.appointments.getAll({
        dateFrom: todayStr,
        dateTo: todayStr,
      });
      setAppointments(data);
    } catch (err) {
      console.error('Failed to load queue', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const handleSetStatus = async (id: string, status: any) => {
    try {
      await api.appointments.updateStatus(id, status);
      success(`Patient queue status changed to ${status}.`);
      loadQueue();
    } catch (err: any) {
      error(err.message || 'Failed to update queue state.');
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Daily Live Queue Dispatcher</h1>
        <p className="text-xs text-slate-500">
          Manage patient queue lifecycle: Waiting Room Check-In → Physician Cabin → Completed
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Waiting / Confirmed Column */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
              <Clock className="w-4 h-4" /> Waiting Area ({appointments.filter(a => a.status === 'confirmed').length})
            </span>
          </div>

          <div className="space-y-2.5 max-h-[600px] overflow-y-auto">
            {appointments.filter(a => a.status === 'confirmed').map(appt => (
              <div key={appt.id} className="p-3 bg-amber-50/50 border border-amber-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">{appt.patient?.full_name}</span>
                  <span className="text-[11px] font-mono text-slate-500">{formatTime(appt.start_time)}</span>
                </div>
                <p className="text-[11px] text-slate-600">With {appt.doctor?.full_name}</p>
                <div className="flex items-center justify-between pt-2 border-t border-amber-200/60">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSetStatus(appt.id, 'no_show')}
                    className="text-slate-500 text-[11px]"
                  >
                    No Show
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleSetStatus(appt.id, 'in_progress')}
                    leftIcon={<UserCheck className="w-3.5 h-3.5" />}
                  >
                    Send to Doctor
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* In Progress Column */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-700 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4" /> Inside Cabin ({appointments.filter(a => a.status === 'in_progress').length})
            </span>
          </div>

          <div className="space-y-2.5 max-h-[600px] overflow-y-auto">
            {appointments.filter(a => a.status === 'in_progress').map(appt => (
              <div key={appt.id} className="p-3 bg-sky-50/60 border border-sky-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">{appt.patient?.full_name}</span>
                  <span className="text-[11px] font-mono text-slate-500">{formatTime(appt.start_time)}</span>
                </div>
                <p className="text-[11px] text-sky-900">Dr. {appt.doctor?.full_name} ({appt.doctor?.doctor_profile?.room_number || 'Room 101'})</p>
                <div className="pt-2 border-t border-sky-200 flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSetStatus(appt.id, 'completed')}
                    leftIcon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                  >
                    Mark Done
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Completed Column */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Completed Today ({appointments.filter(a => a.status === 'completed').length})
            </span>
          </div>

          <div className="space-y-2.5 max-h-[600px] overflow-y-auto">
            {appointments.filter(a => a.status === 'completed').map(appt => (
              <div key={appt.id} className="p-3 bg-emerald-50/40 border border-emerald-200 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">{appt.patient?.full_name}</span>
                  <span className="text-[10px] text-emerald-700 font-bold">Done</span>
                </div>
                <p className="text-[11px] text-slate-500">{appt.doctor?.full_name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
