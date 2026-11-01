// ==============================================================================
// ClinicFlow — Reusable UI Components: StatusBadge
// ==============================================================================

import React from 'react';
import { AppointmentStatus, UserRole } from '@/types';

interface StatusBadgeProps {
  status?: AppointmentStatus | UserRole | string;
  variant?: 'status' | 'role' | 'active';
  size?: 'sm' | 'md';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status = 'pending',
  variant = 'status',
  size = 'md',
  className = '',
}) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-semibold';

  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';
  let label = String(status);

  if (variant === 'status') {
    switch (status) {
      case 'confirmed':
        colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        label = 'Confirmed';
        break;
      case 'completed':
        colorClasses = 'bg-sky-50 text-sky-700 border-sky-200';
        label = 'Completed';
        break;
      case 'in_progress':
        colorClasses = 'bg-indigo-50 text-indigo-700 border-indigo-200 animate-pulse';
        label = 'In Progress';
        break;
      case 'pending':
        colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
        label = 'Pending';
        break;
      case 'cancelled':
        colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
        label = 'Cancelled';
        break;
      case 'no_show':
        colorClasses = 'bg-slate-100 text-slate-600 border-slate-300';
        label = 'No Show';
        break;
      default:
        break;
    }
  } else if (variant === 'role') {
    switch (status) {
      case 'admin':
        colorClasses = 'bg-purple-50 text-purple-700 border-purple-200';
        label = 'Administrator';
        break;
      case 'doctor':
        colorClasses = 'bg-sky-50 text-sky-700 border-sky-200';
        label = 'Doctor';
        break;
      case 'receptionist':
        colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
        label = 'Receptionist';
        break;
      case 'patient':
        colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        label = 'Patient';
        break;
    }
  } else if (variant === 'active') {
    if (status === 'true' || String(status) === 'true' || status === 'active') {
      colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      label = 'Active';
    } else {
      colorClasses = 'bg-slate-100 text-slate-500 border-slate-200';
      label = 'Inactive';
    }
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium ${sizeClasses} ${colorClasses} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-75 shrink-0" />
      {label}
    </span>
  );
};
