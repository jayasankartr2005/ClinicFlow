// ==============================================================================
// ClinicFlow — TypeScript Database Type Definitions
// Multi-Tenant Healthcare Hierarchy + Meta WhatsApp Cloud API Types
// ==============================================================================

export type UserRole = 'supercoordinator' | 'admin' | 'doctor' | 'receptionist' | 'patient';
export type AppointmentStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
export type GenderType = 'male' | 'female' | 'other';
export type BloodGroupType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
export type NotificationType = 
  | 'appointment_booked' 
  | 'appointment_confirmed' 
  | 'appointment_cancelled' 
  | 'appointment_rescheduled' 
  | 'record_ready' 
  | 'system';

export type WhatsAppSessionState = 
  | 'IDLE'
  | 'MAIN_MENU'
  | 'SELECTING_DOCTOR'
  | 'SELECTING_DATE'
  | 'SELECTING_SLOT'
  | 'CONFIRMING_APPOINTMENT'
  | 'COMPLETED';

export type WhatsAppDirection = 'INBOUND' | 'OUTBOUND';
export type WhatsAppMessageType = 'TEXT' | 'BUTTON' | 'LIST' | 'DOCUMENT' | 'IMAGE' | 'TEMPLATE';

export interface Hospital {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  whatsapp_phone_number_id: string | null;
  whatsapp_business_account_id: string | null;
  whatsapp_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  hospital_id?: string | null;
  role: UserRole;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  hospital?: Hospital;
}

export interface Department {
  id: string;
  hospital_id?: string | null;
  name: string;
  code: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Specialization {
  id: string;
  department_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  department?: Department;
}

export interface DoctorProfile {
  id: string; // references Profile.id
  hospital_id?: string | null;
  department_id: string | null;
  specialization_id: string | null;
  license_number: string | null;
  consultation_fee: number;
  bio: string | null;
  room_number: string | null;
  available_days: string[];
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
  created_at: string;
  updated_at: string;
  // Joined fields
  profile?: Profile;
  department?: Department;
  specialization?: Specialization;
}

export interface PatientProfile {
  id: string; // references Profile.id
  date_of_birth: string | null;
  gender: GenderType | null;
  blood_group: BloodGroupType | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  address: string | null;
  allergies: string | null;
  medical_history_summary: string | null;
  created_at: string;
  updated_at: string;
  profile?: Profile;
}

export interface Patient {
  id: string;
  hospital_id: string;
  full_name: string;
  phone_number: string | null;
  whatsapp_number: string;
  date_of_birth: string | null;
  gender: GenderType | null;
  blood_group: BloodGroupType | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  address: string | null;
  allergies: string | null;
  medical_history_summary: string | null;
  created_at: string;
  updated_at: string;
  hospital?: Hospital;
}

export interface Appointment {
  id: string;
  hospital_id?: string | null;
  patient_id: string;
  doctor_id: string;
  appointment_date: string; // YYYY-MM-DD
  start_time: string;       // HH:MM:SS
  end_time: string;         // HH:MM:SS
  status: AppointmentStatus;
  chief_complaint: string | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  patient?: any; // Patient or Profile with patient_profile
  doctor?: Profile & { doctor_profile?: DoctorProfile };
  medical_record?: MedicalRecord;
  hospital?: Hospital;
}

export interface VitalSigns {
  bp?: string;          // e.g. "120/80"
  pulse?: number;       // bpm e.g. 72
  temp?: number;        // °F e.g. 98.6
  weight?: number;      // kg e.g. 70.5
  height?: number;      // cm e.g. 175
  spo2?: number;        // % e.g. 99
  respiratory_rate?: number; // breaths/min
}

export interface MedicalRecord {
  id: string;
  hospital_id?: string | null;
  appointment_id: string;
  patient_id: string;
  doctor_id: string;
  chief_complaint: string | null;
  vital_signs: VitalSigns;
  clinical_notes: string;
  diagnosis: string;
  treatment_plan: string;
  follow_up_date: string | null;
  follow_up_notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  patient?: any;
  doctor?: Profile;
  prescriptions?: Prescription[];
  appointment?: Appointment;
  hospital?: Hospital;
}

export interface Prescription {
  id: string;
  hospital_id?: string | null;
  medical_record_id: string;
  patient_id: string;
  doctor_id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string | null;
  created_at: string;
  doctor?: Profile;
  record?: MedicalRecord;
  patient?: any;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  link: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  hospital_id?: string | null;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown>;
  ip_address?: string | null;
  created_at: string;
  user?: Profile;
  hospital?: Hospital;
}

export interface WhatsAppSession {
  id: string;
  hospital_id: string;
  patient_id: string | null;
  whatsapp_number: string;
  state: WhatsAppSessionState;
  state_data: Record<string, any>;
  last_message_at: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
  patient?: Patient;
  hospital?: Hospital;
}

export interface WhatsAppMessage {
  id: string;
  hospital_id: string;
  patient_id: string | null;
  session_id: string | null;
  direction: WhatsAppDirection;
  whatsapp_message_id: string;
  message_type: WhatsAppMessageType;
  message_status: string;
  metadata: Record<string, any>;
  created_at: string;
  patient?: Patient;
  hospital?: Hospital;
}
