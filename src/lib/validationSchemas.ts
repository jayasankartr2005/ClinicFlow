// ==============================================================================
// ClinicFlow — Zod Validation Schemas
// Enforces strict client-side type-safe form validation
// ==============================================================================

import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Please enter a valid phone number (min 10 digits)'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirm_password: z.string(),
  date_of_birth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  blood_group: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
  address: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  allergies: z.string().optional(),
}).refine((data) => data.password === data.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
});

export const bookAppointmentSchema = z.object({
  doctor_id: z.string().min(1, 'Please select a doctor'),
  appointment_date: z.string().min(1, 'Please select an appointment date'),
  start_time: z.string().min(1, 'Please select a time slot'),
  end_time: z.string().min(1, 'End time is required'),
  chief_complaint: z.string().min(3, 'Please specify your primary concern/reason for visit'),
});

export const rescheduleSchema = z.object({
  appointment_date: z.string().min(1, 'Please select a new date'),
  start_time: z.string().min(1, 'Please select a new time slot'),
  end_time: z.string().min(1, 'End time is required'),
});

export const cancelAppointmentSchema = z.object({
  cancellation_reason: z.string().min(3, 'Please provide a reason for cancellation'),
});

export const patientRegistrationSchema = z.object({
  full_name: z.string().min(2, 'Full name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(10, 'Valid 10-digit phone number is required'),
  date_of_birth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['male', 'female', 'other']),
  blood_group: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
  address: z.string().min(5, 'Address is required'),
  emergency_contact_name: z.string().min(2, 'Emergency contact name is required'),
  emergency_contact_phone: z.string().min(10, 'Emergency contact phone is required'),
  allergies: z.string().optional(),
  medical_history_summary: z.string().optional(),
});

export const prescriptionItemSchema = z.object({
  medication_name: z.string().min(2, 'Medication name is required'),
  dosage: z.string().min(1, 'Dosage is required (e.g. 500mg)'),
  frequency: z.string().min(1, 'Frequency is required (e.g. 1-0-1 After food)'),
  duration: z.string().min(1, 'Duration is required (e.g. 5 days)'),
  instructions: z.string().optional(),
});

export const consultationSchema = z.object({
  chief_complaint: z.string().min(3, 'Chief complaint is required'),
  bp: z.string().optional(),
  pulse: z.string().optional(),
  temp: z.string().optional(),
  weight: z.string().optional(),
  height: z.string().optional(),
  spo2: z.string().optional(),
  clinical_notes: z.string().min(5, 'Clinical notes and examination findings are required'),
  diagnosis: z.string().min(3, 'Diagnosis / ICD description is required'),
  treatment_plan: z.string().min(5, 'Treatment plan is required'),
  follow_up_date: z.string().optional(),
  follow_up_notes: z.string().optional(),
  prescriptions: z.array(prescriptionItemSchema),
});

export const departmentSchema = z.object({
  name: z.string().min(2, 'Department name is required'),
  code: z.string().min(2, 'Code is required (e.g. CARD, PEDS)').max(10),
  description: z.string().optional(),
  is_active: z.boolean().default(true),
});

export const specializationSchema = z.object({
  department_id: z.string().min(1, 'Department selection is required'),
  name: z.string().min(2, 'Specialization name is required'),
  description: z.string().optional(),
  is_active: z.boolean().default(true),
});

export const userManagementSchema = z.object({
  full_name: z.string().min(2, 'Full name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(10, 'Valid phone is required'),
  role: z.enum(['admin', 'doctor', 'receptionist', 'patient']),
  is_active: z.boolean().default(true),
  // Doctor specific
  department_id: z.string().optional(),
  specialization_id: z.string().optional(),
  license_number: z.string().optional(),
  consultation_fee: z.number().min(0).optional(),
  room_number: z.string().optional(),
});
