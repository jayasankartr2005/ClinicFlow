// ==============================================================================
// ClinicFlow — Appointment Card Component
// ==============================================================================

import React from 'react';
import { Appointment } from '@/types';
import { formatDate, formatTime } from '@/lib/dateUtils';
import { StatusBadge } from '../common/StatusBadge';
import { Calendar, Clock, User, Stethoscope, FileText, XCircle, RefreshCw } from 'lucide-react';
import { Button } from '../common/Button';

interface AppointmentCardProps {
  appointment: Appointment;
  perspective?: 'doctor' | 'patient' | 'receptionist';
  onStartConsultation?: (appt: Appointment) => void;
  onViewRecord?: (appt: Appointment) => void;
  onReschedule?: (appt: Appointment) => void;
  onCancel?: (appt: Appointment) => void;
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  perspective = 'patient',
  onStartConsultation,
  onViewRecord,
  onReschedule,
  onCancel,
}) => {
  const isPast = new Date(`${appointment.appointment_date}T${appointment.end_time}`) < new Date();
  const canCancel = appointment.status === 'pending' || appointment.status === 'confirmed';

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs hover:shadow-card transition-shadow">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <StatusBadge status={appointment.status} variant="status" />
          <span className="text-xs text-slate-400 font-mono">#{appointment.id.slice(0, 8)}</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-sky-600" />
            {formatDate(appointment.appointment_date)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-sky-600" />
            {formatTime(appointment.start_time)} – {formatTime(appointment.end_time)}
          </span>
        </div>
      </div>

      <div className="py-3.5 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Doctor info or Patient info depending on perspective */}
        {perspective === 'patient' ? (
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
              Consulting Specialist
            </span>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-sky-50 text-sky-600">
                <Stethoscope className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">{appointment.doctor?.full_name || 'Specialist Doctor'}</p>
                <p className="text-xs text-slate-500">
                  {appointment.doctor?.doctor_profile?.department?.name || 'Clinical Care'} • {appointment.doctor?.doctor_profile?.room_number || 'Room 101'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
              Patient Information
            </span>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                <User className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">{appointment.patient?.full_name || 'Registered Patient'}</p>
                <p className="text-xs text-slate-500">{appointment.patient?.phone || appointment.patient?.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Chief Complaint */}
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
            Chief Complaint / Reason
          </span>
          <p className="text-xs text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100 italic line-clamp-2">
            "{appointment.chief_complaint || 'General medical consultation'}"
          </p>
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs text-slate-400">
          Fee: <span className="font-semibold text-slate-700">₹{appointment.doctor?.doctor_profile?.consultation_fee || 500}</span>
        </div>

        <div className="flex items-center gap-2">
          {perspective === 'doctor' && (appointment.status === 'confirmed' || appointment.status === 'in_progress') && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onStartConsultation && onStartConsultation(appointment)}
              leftIcon={<Stethoscope className="w-3.5 h-3.5" />}
            >
              Start Consultation
            </Button>
          )}

          {appointment.status === 'completed' && onViewRecord && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewRecord(appointment)}
              leftIcon={<FileText className="w-3.5 h-3.5 text-sky-600" />}
            >
              View Clinical Record
            </Button>
          )}

          {canCancel && onReschedule && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onReschedule(appointment)}
              leftIcon={<RefreshCw className="w-3.5 h-3.5 text-slate-500" />}
            >
              Reschedule
            </Button>
          )}

          {canCancel && onCancel && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCancel(appointment)}
              leftIcon={<XCircle className="w-3.5 h-3.5 text-rose-500" />}
              className="text-rose-600 hover:bg-rose-50"
            >
              Cancel
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
