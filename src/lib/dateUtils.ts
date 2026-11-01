// ==============================================================================
// ClinicFlow — Date & Time Utility Functions
// ==============================================================================

import { format, parse, isValid, differenceInYears, isToday, isTomorrow, isYesterday } from 'date-fns';
import { TimeSlot } from '@/types';

export function formatDate(dateStr: string | Date | null | undefined, formatStr: string = 'dd MMM yyyy'): string {
  if (!dateStr) return 'N/A';
  try {
    const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    if (!isValid(date)) return dateStr.toString();
    return format(date, formatStr);
  } catch {
    return String(dateStr);
  }
}

export function formatDateTime(dateTimeStr: string | Date | null | undefined): string {
  if (!dateTimeStr) return 'N/A';
  try {
    const date = typeof dateTimeStr === 'string' ? new Date(dateTimeStr) : dateTimeStr;
    if (!isValid(date)) return dateTimeStr.toString();
    return format(date, 'dd MMM yyyy, hh:mm a');
  } catch {
    return String(dateTimeStr);
  }
}

export function formatTime(timeStr: string | null | undefined): string {
  if (!timeStr) return 'N/A';
  try {
    // If time is in "HH:mm:ss" or "HH:mm"
    const cleaned = timeStr.slice(0, 5);
    const parsed = parse(cleaned, 'HH:mm', new Date());
    if (isValid(parsed)) {
      return format(parsed, 'hh:mm a');
    }
    return timeStr;
  } catch {
    return timeStr;
  }
}

export function formatTimeRange(startTime: string, endTime: string): string {
  return `${formatTime(startTime)} – ${formatTime(endTime)}`;
}

export function formatRelativeDate(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return 'N/A';
  try {
    const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    if (!isValid(date)) return String(dateStr);
    
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    if (isYesterday(date)) return 'Yesterday';
    
    return format(date, 'EEE, dd MMM');
  } catch {
    return String(dateStr);
  }
}

export function calculateAge(dobStr: string | null | undefined): string {
  if (!dobStr) return 'Age N/A';
  try {
    const dob = new Date(dobStr);
    if (!isValid(dob)) return 'Age N/A';
    const age = differenceInYears(new Date(), dob);
    return `${age} yrs`;
  } catch {
    return 'Age N/A';
  }
}

export function getDayName(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return format(date, 'EEEE'); // 'Monday', 'Tuesday', etc.
  } catch {
    return '';
  }
}

export function getTodayDateString(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

/**
 * Generate 30-min time slots for a doctor and determine availability
 */
export function generateDoctorTimeSlots(
  startTimeStr: string = '09:00:00',
  endTimeStr: string = '17:00:00',
  slotDurationMinutes: number = 30,
  bookedAppointments: Array<{ start_time: string; end_time: string; status: string }> = []
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  
  const startHour = parseInt(startTimeStr.split(':')[0], 10) || 9;
  const startMinute = parseInt(startTimeStr.split(':')[1], 10) || 0;
  const endHour = parseInt(endTimeStr.split(':')[0], 10) || 17;
  const endMinute = parseInt(endTimeStr.split(':')[1], 10) || 0;

  const totalStartMinutes = startHour * 60 + startMinute;
  const totalEndMinutes = endHour * 60 + endMinute;

  for (let currentMinutes = totalStartMinutes; currentMinutes + slotDurationMinutes <= totalEndMinutes; currentMinutes += slotDurationMinutes) {
    const sH = Math.floor(currentMinutes / 60);
    const sM = currentMinutes % 60;
    const eMinutes = currentMinutes + slotDurationMinutes;
    const eH = Math.floor(eMinutes / 60);
    const eM = eMinutes % 60;

    const startFormatted = `${String(sH).padStart(2, '0')}:${String(sM).padStart(2, '0')}:00`;
    const endFormatted = `${String(eH).padStart(2, '0')}:${String(eM).padStart(2, '0')}:00`;

    // Check conflict: slot overlaps with an active booked appointment
    const isBooked = bookedAppointments.some(appt => {
      if (appt.status === 'cancelled') return false;
      const apptStart = appt.start_time.slice(0, 5);
      const apptEnd = appt.end_time.slice(0, 5);
      const slotStart = startFormatted.slice(0, 5);
      const slotEnd = endFormatted.slice(0, 5);

      return (slotStart < apptEnd && slotEnd > apptStart);
    });

    slots.push({
      startTime: startFormatted,
      endTime: endFormatted,
      formattedTime: `${formatTime(startFormatted)} - ${formatTime(endFormatted)}`,
      isAvailable: !isBooked,
    });
  }

  return slots;
}
