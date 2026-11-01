// ==============================================================================
// ClinicFlow — Export & Reporting Utilities
// ==============================================================================

import { Appointment } from '@/types';
import { formatDate, formatTime } from './dateUtils';

/**
 * Exports appointment dataset to a CSV file and triggers download in browser
 */
export function exportAppointmentsToCSV(appointments: Appointment[], filename: string = 'clinicflow_appointments.csv'): void {
  if (!appointments || appointments.length === 0) {
    alert('No appointment records to export.');
    return;
  }

  const headers = [
    'Appointment ID',
    'Date',
    'Start Time',
    'End Time',
    'Status',
    'Patient Name',
    'Patient Email',
    'Patient Phone',
    'Doctor Name',
    'Chief Complaint',
    'Cancellation Reason',
    'Created At',
  ];

  const rows = appointments.map(appt => [
    `"${appt.id}"`,
    `"${formatDate(appt.appointment_date, 'yyyy-MM-dd')}"`,
    `"${formatTime(appt.start_time)}"`,
    `"${formatTime(appt.end_time)}"`,
    `"${appt.status.toUpperCase()}"`,
    `"${appt.patient?.full_name || 'N/A'}"`,
    `"${appt.patient?.email || 'N/A'}"`,
    `"${appt.patient?.phone || 'N/A'}"`,
    `"${appt.doctor?.full_name || 'N/A'}"`,
    `"${(appt.chief_complaint || '').replace(/"/g, '""')}"`,
    `"${(appt.cancellation_reason || '').replace(/"/g, '""')}"`,
    `"${formatDate(appt.created_at, 'yyyy-MM-dd HH:mm')}"`,
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Exports general tabular data to CSV
 */
export function exportTableToCSV(headers: string[], dataRows: string[][], filename: string): void {
  const csvContent = 'data:text/csv;charset=utf-8,' + [
    headers.map(h => `"${h}"`).join(','),
    ...dataRows.map(row => row.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
