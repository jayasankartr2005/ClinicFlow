// ==============================================================================
// ClinicFlow — Shared Application Types
// ==============================================================================

import { 
  Profile, 
  PatientProfile, 
  DoctorProfile, 
  Department, 
  Specialization, 
  Appointment, 
  MedicalRecord, 
  Prescription, 
  Notification, 
  AuditLog, 
  UserRole, 
  AppointmentStatus,
  Hospital,
  Patient,
  WhatsAppSession,
  WhatsAppMessage
} from './database.types';

export * from './database.types';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  hospital_id?: string | null;
  profile: Profile;
  hospital?: Hospital;
  patient_profile?: PatientProfile;
  doctor_profile?: DoctorProfile;
}

export interface TimeSlot {
  startTime: string; // "09:00:00"
  endTime: string;   // "09:30:00"
  formattedTime: string; // "09:00 AM - 09:30 AM"
  isAvailable: boolean;
  appointmentId?: string;
}

export interface DoctorWithDetails extends Profile {
  doctor_profile: DoctorProfile & {
    department: Department | null;
    specialization: Specialization | null;
  };
}

export interface PatientWithDetails {
  id: string;
  hospital_id?: string | null;
  full_name: string;
  email?: string;
  phone?: string | null;
  whatsapp_number?: string;
  avatar_url?: string | null;
  is_active?: boolean;
  date_of_birth?: string | null;
  gender?: any;
  blood_group?: any;
  address?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  allergies?: string | null;
  medical_history_summary?: string | null;
  patient_profile?: PatientProfile | null;
  recent_appointments?: Appointment[];
  medical_records?: MedicalRecord[];
  created_at?: string;
  updated_at?: string;
}

export interface AppointmentFilter {
  dateFrom?: string;
  dateTo?: string;
  doctorId?: string;
  patientId?: string;
  departmentId?: string;
  hospitalId?: string;
  status?: AppointmentStatus | 'all';
  searchQuery?: string;
}

export interface ConsultationFormData {
  chiefComplaint: string;
  vitalSigns: {
    bp: string;
    pulse: string;
    temp: string;
    weight: string;
    height: string;
    spo2: string;
  };
  clinicalNotes: string;
  diagnosis: string;
  treatmentPlan: string;
  followUpDate: string;
  followUpNotes: string;
  prescriptions: Array<{
    id?: string;
    medication_name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
  }>;
}

export interface ReportSummary {
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  totalPatients: number;
  totalDoctors: number;
  departmentBreakdown: Array<{ name: string; count: number; code: string }>;
  doctorWorkload: Array<{ doctorName: string; total: number; completed: number; cancelled: number }>;
  dailyTrends: Array<{ date: string; bookings: number; completed: number }>;
  statusDistribution: Array<{ status: string; count: number }>;
}
