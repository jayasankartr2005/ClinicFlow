// ==============================================================================
// ClinicFlow — Realistic In-Memory & LocalStorage Synchronized Mock Database
// Multi-Tenant Hierarchy (Supercoordinator, Hospitals, Admin, Doctor, Receptionist, Patients)
// Meta WhatsApp Cloud API Simulation Store
// ==============================================================================

import { format, addDays, subDays } from 'date-fns';
import { 
  Hospital,
  Profile, 
  Department, 
  Specialization, 
  DoctorProfile, 
  PatientProfile, 
  Patient,
  Appointment, 
  MedicalRecord, 
  Prescription, 
  Notification, 
  AuditLog,
  WhatsAppSession,
  WhatsAppMessage
} from '@/types';

const STORAGE_KEY = 'clinicflow_db_v2'; // Bumped for multi-tenant migration

const today = new Date();
const todayStr = format(today, 'yyyy-MM-dd');
const yesterdayStr = format(subDays(today, 1), 'yyyy-MM-dd');
const twoDaysAgoStr = format(subDays(today, 2), 'yyyy-MM-dd');
const threeDaysAgoStr = format(subDays(today, 3), 'yyyy-MM-dd');
const inTwoDaysStr = format(addDays(today, 2), 'yyyy-MM-dd');
const inThreeDaysStr = format(addDays(today, 3), 'yyyy-MM-dd');
const inFourDaysStr = format(addDays(today, 4), 'yyyy-MM-dd');

// ------------------------------------------------------------------------------
// 1. Initial Hospitals
// ------------------------------------------------------------------------------
export const INITIAL_HOSPITALS: Hospital[] = [
  {
    id: 'a1000000-0000-0000-0000-000000000001',
    name: 'Apollo Health Center',
    slug: 'apollo-health',
    email: 'contact@apollohealth.demo',
    phone: '+91 44 2829 0200',
    address: '21 Greams Lane, Thousand Lights, Chennai - 600006',
    whatsapp_phone_number_id: '109283746501928',
    whatsapp_business_account_id: '982019284710293',
    whatsapp_enabled: true,
    created_at: subDays(today, 30).toISOString(),
    updated_at: subDays(today, 30).toISOString(),
  },
  {
    id: 'a1000000-0000-0000-0000-000000000002',
    name: 'Fortis Multi-Specialty Hospital',
    slug: 'fortis-care',
    email: 'care@fortishospital.demo',
    phone: '+91 44 4921 1000',
    address: '52 First Main Road, Gandhi Nagar, Adyar, Chennai - 600020',
    whatsapp_phone_number_id: '209283746501929',
    whatsapp_business_account_id: '982019284710294',
    whatsapp_enabled: true,
    created_at: subDays(today, 20).toISOString(),
    updated_at: subDays(today, 20).toISOString(),
  },
];

// ------------------------------------------------------------------------------
// 2. Initial Departments
// ------------------------------------------------------------------------------
export const INITIAL_DEPARTMENTS: Department[] = [
  {
    id: 'd1000000-0000-0000-0000-000000000001',
    hospital_id: 'a1000000-0000-0000-0000-000000000001',
    name: 'Cardiology',
    code: 'CARD',
    description: 'Diagnosis, treatment and management of cardiovascular conditions and heart disorders.',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'd1000000-0000-0000-0000-000000000002',
    hospital_id: 'a1000000-0000-0000-0000-000000000001',
    name: 'Pediatrics',
    code: 'PEDS',
    description: 'Comprehensive healthcare and developmental screening for infants, children, and adolescents.',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'd1000000-0000-0000-0000-000000000003',
    hospital_id: 'a1000000-0000-0000-0000-000000000001',
    name: 'Orthopedics',
    code: 'ORTH',
    description: 'Specialized care for bones, joints, ligaments, tendons, and musculoskeletal trauma.',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'd1000000-0000-0000-0000-000000000004',
    hospital_id: 'a1000000-0000-0000-0000-000000000001',
    name: 'General Medicine',
    code: 'GENM',
    description: 'Primary clinical care, chronic disease management, and preventive medical health.',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'd1000000-0000-0000-0000-000000000005',
    hospital_id: 'a1000000-0000-0000-0000-000000000001',
    name: 'Dermatology',
    code: 'DERM',
    description: 'Clinical and procedural management of skin, hair, nails, and cutaneous disorders.',
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

// ------------------------------------------------------------------------------
// 3. Initial Specializations
// ------------------------------------------------------------------------------
export const INITIAL_SPECIALIZATIONS: Specialization[] = [
  {
    id: 's1000000-0000-0000-0000-000000000001',
    department_id: 'd1000000-0000-0000-0000-000000000001',
    name: 'Interventional Cardiology',
    description: 'Catheter-based structural heart and coronary interventions',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 's1000000-0000-0000-0000-000000000002',
    department_id: 'd1000000-0000-0000-0000-000000000001',
    name: 'Electrophysiology & Arrhythmia',
    description: 'Cardiac rhythm management and pacemakers',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 's1000000-0000-0000-0000-000000000003',
    department_id: 'd1000000-0000-0000-0000-000000000002',
    name: 'General Pediatrics',
    description: 'Neonatal care, immunizations, and pediatric wellness',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 's1000000-0000-0000-0000-000000000004',
    department_id: 'd1000000-0000-0000-0000-000000000002',
    name: 'Pediatric Pulmonology',
    description: 'Pediatric asthma, allergies, and respiratory health',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 's1000000-0000-0000-0000-000000000005',
    department_id: 'd1000000-0000-0000-0000-000000000003',
    name: 'Joint Replacement & Arthroscopy',
    description: 'Hip and knee arthroplasty and ligament reconstructions',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 's1000000-0000-0000-0000-000000000006',
    department_id: 'd1000000-0000-0000-0000-000000000003',
    name: 'Sports Medicine & Spine Care',
    description: 'Musculoskeletal rehabilitation and sports injuries',
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

// ------------------------------------------------------------------------------
// 4. Initial User Profiles (Supercoordinator, Admins, Doctors, Receptionists)
// ------------------------------------------------------------------------------
export const INITIAL_PROFILES: Profile[] = [
  // Platform Supercoordinator (No single hospital restriction)
  {
    id: 'sc100000-0000-0000-0000-000000000001',
    hospital_id: null,
    role: 'supercoordinator',
    full_name: 'Vikram Mehta (Platform Operator)',
    email: 'super@clinicflow.demo',
    phone: '+91 99999 88888',
    avatar_url: null,
    is_active: true,
    created_at: subDays(today, 60).toISOString(),
    updated_at: new Date().toISOString(),
  },

  // Hospital A: Administrator
  {
    id: 'a1000000-0000-0000-0000-000000000001',
    hospital_id: 'a1000000-0000-0000-0000-000000000001',
    role: 'admin',
    full_name: 'Dr. Arvind Mehra (Apollo Admin)',
    email: 'admin@clinicflow.demo',
    phone: '+91 98401 23456',
    avatar_url: null,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },

  // Hospital A: Doctors
  {
    id: 'd2000000-0000-0000-0000-000000000001',
    hospital_id: 'a1000000-0000-0000-0000-000000000001',
    role: 'doctor',
    full_name: 'Dr. Rajesh Sharma',
    email: 'dr.sharma@clinicflow.demo',
    phone: '+91 98765 43210',
    avatar_url: null,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'd2000000-0000-0000-0000-000000000002',
    hospital_id: 'a1000000-0000-0000-0000-000000000001',
    role: 'doctor',
    full_name: 'Dr. Priya Patel',
    email: 'dr.patel@clinicflow.demo',
    phone: '+91 98765 43211',
    avatar_url: null,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'd2000000-0000-0000-0000-000000000003',
    hospital_id: 'a1000000-0000-0000-0000-000000000001',
    role: 'doctor',
    full_name: 'Dr. Ananya Iyer',
    email: 'dr.ananya@clinicflow.demo',
    phone: '+91 98765 43212',
    avatar_url: null,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },

  // Hospital A: Receptionist
  {
    id: 'r1000000-0000-0000-0000-000000000001',
    hospital_id: 'a1000000-0000-0000-0000-000000000001',
    role: 'receptionist',
    full_name: 'Sunita Rao (Front Desk)',
    email: 'reception@clinicflow.demo',
    phone: '+91 98400 11223',
    avatar_url: null,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },

  // Hospital B: Administrator
  {
    id: 'a1000000-0000-0000-0000-000000000002',
    hospital_id: 'a1000000-0000-0000-0000-000000000002',
    role: 'admin',
    full_name: 'Dr. Nandini Sen (Fortis Admin)',
    email: 'admin.fortis@clinicflow.demo',
    phone: '+91 98401 99999',
    avatar_url: null,
    is_active: true,
    created_at: subDays(today, 15).toISOString(),
    updated_at: new Date().toISOString(),
  },

  // Hospital B: Doctor
  {
    id: 'd2000000-0000-0000-0000-000000000004',
    hospital_id: 'a1000000-0000-0000-0000-000000000002',
    role: 'doctor',
    full_name: 'Dr. Suresh Varma',
    email: 'dr.varma@clinicflow.demo',
    phone: '+91 98765 88888',
    avatar_url: null,
    is_active: true,
    created_at: subDays(today, 15).toISOString(),
    updated_at: new Date().toISOString(),
  },

  // Hospital B: Receptionist
  {
    id: 'r1000000-0000-0000-0000-000000000002',
    hospital_id: 'a1000000-0000-0000-0000-000000000002',
    role: 'receptionist',
    full_name: 'Pooja Nair (Fortis Front Desk)',
    email: 'reception.fortis@clinicflow.demo',
    phone: '+91 98400 77777',
    avatar_url: null,
    is_active: true,
    created_at: subDays(today, 15).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// ------------------------------------------------------------------------------
// 5. Initial Doctor Profiles Extension
// ------------------------------------------------------------------------------
export const INITIAL_DOCTOR_PROFILES: DoctorProfile[] = [
  {
    id: 'd2000000-0000-0000-0000-000000000001',
    hospital_id: 'a1000000-0000-0000-0000-000000000001',
    department_id: 'd1000000-0000-0000-0000-000000000001',
    specialization_id: 's1000000-0000-0000-0000-000000000001',
    license_number: 'MCI-CARD-88321',
    consultation_fee: 800,
    bio: 'Senior Consultant Interventional Cardiologist with 14+ years experience in coronary interventions and preventative cardiology.',
    room_number: 'Consultation Room 102 (1st Floor)',
    available_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    start_time: '09:00:00',
    end_time: '17:00:00',
    slot_duration_minutes: 30,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'd2000000-0000-0000-0000-000000000002',
    hospital_id: 'a1000000-0000-0000-0000-000000000001',
    department_id: 'd1000000-0000-0000-0000-000000000002',
    specialization_id: 's1000000-0000-0000-0000-000000000003',
    license_number: 'MCI-PEDS-55194',
    consultation_fee: 600,
    bio: 'Pediatrician specializing in child development, pediatric immunizations, and wellness care.',
    room_number: 'Consultation Room 204 (2nd Floor)',
    available_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    start_time: '09:30:00',
    end_time: '16:30:00',
    slot_duration_minutes: 30,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'd2000000-0000-0000-0000-000000000003',
    hospital_id: 'a1000000-0000-0000-0000-000000000001',
    department_id: 'd1000000-0000-0000-0000-000000000003',
    specialization_id: 's1000000-0000-0000-0000-000000000005',
    license_number: 'MCI-ORTH-23945',
    consultation_fee: 750,
    bio: 'Orthopedic surgeon with expertise in joint replacement, sports injury rehabilitation, and arthroscopy.',
    room_number: 'Consultation Room 301 (3rd Floor)',
    available_days: ['Monday', 'Wednesday', 'Friday', 'Saturday'],
    start_time: '10:00:00',
    end_time: '18:00:00',
    slot_duration_minutes: 30,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'd2000000-0000-0000-0000-000000000004',
    hospital_id: 'a1000000-0000-0000-0000-000000000002',
    department_id: 'd1000000-0000-0000-0000-000000000004',
    specialization_id: null,
    license_number: 'MCI-GENM-11928',
    consultation_fee: 550,
    bio: 'Consultant Physician specialized in adult chronic care, diabetes management, and lifestyle disorders.',
    room_number: 'Room 105 (Ground Floor)',
    available_days: ['Monday', 'Tuesday', 'Thursday', 'Friday'],
    start_time: '09:00:00',
    end_time: '16:00:00',
    slot_duration_minutes: 30,
    created_at: subDays(today, 15).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// ------------------------------------------------------------------------------
// 6. Standalone Patients Entity (Hospital-Owned Database Entities)
// ------------------------------------------------------------------------------
export const INITIAL_PATIENTS: Patient[] = [
  {
    id: 'p1000000-0000-0000-0000-000000000001',
    hospital_id: 'a1000000-0000-0000-0000-000000000001',
    full_name: 'Vikramaditya Verma',
    phone_number: '+91 98111 00001',
    whatsapp_number: '+919811100001',
    date_of_birth: '1984-06-15',
    gender: 'male',
    blood_group: 'O+',
    emergency_contact_name: 'Ananya Verma (Spouse)',
    emergency_contact_phone: '+91 98111 99991',
    address: '42 Gandhi Nagar, Adyar, Chennai - 600020',
    allergies: 'Penicillin, Sulfa drugs',
    medical_history_summary: 'History of mild hypertension managed with lifestyle modifications.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'p1000000-0000-0000-0000-000000000002',
    hospital_id: 'a1000000-0000-0000-0000-000000000001',
    full_name: 'Deepika Sundaram',
    phone_number: '+91 98111 00002',
    whatsapp_number: '+919811100002',
    date_of_birth: '1992-11-20',
    gender: 'female',
    blood_group: 'B+',
    emergency_contact_name: 'Karthik Sundaram (Brother)',
    emergency_contact_phone: '+91 98111 99992',
    address: '18 Anna Salai, T. Nagar, Chennai - 600017',
    allergies: 'Dust mites, Shellfish',
    medical_history_summary: 'Seasonal allergic rhinitis and mild asthma.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'p1000000-0000-0000-0000-000000000003',
    hospital_id: 'a1000000-0000-0000-0000-000000000001',
    full_name: 'Kavitha Nambiar',
    phone_number: '+91 98111 00003',
    whatsapp_number: '+919811100003',
    date_of_birth: '1976-03-10',
    gender: 'female',
    blood_group: 'A+',
    emergency_contact_name: 'Madhavan Nambiar (Spouse)',
    emergency_contact_phone: '+91 98111 99993',
    address: '77 Harrington Road, Chetpet, Chennai - 600031',
    allergies: 'No known drug allergies',
    medical_history_summary: 'Type 2 Diabetes Mellitus diagnosed 2019, well-controlled.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'p1000000-0000-0000-0000-000000000004',
    hospital_id: 'a1000000-0000-0000-0000-000000000001',
    full_name: 'Rohan Sengupta',
    phone_number: '+91 98111 00004',
    whatsapp_number: '+919811100004',
    date_of_birth: '2018-08-04',
    gender: 'male',
    blood_group: 'O-',
    emergency_contact_name: 'Debashish Sengupta (Father)',
    emergency_contact_phone: '+91 98111 99994',
    address: '12 Velachery Main Road, Chennai - 600042',
    allergies: 'Peanuts',
    medical_history_summary: 'Pediatric patient; completed primary immunization schedule.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'p1000000-0000-0000-0000-000000000005',
    hospital_id: 'a1000000-0000-0000-0000-000000000001',
    full_name: 'Sneha Kulkarni',
    phone_number: '+91 98111 00005',
    whatsapp_number: '+919811100005',
    date_of_birth: '1990-01-25',
    gender: 'female',
    blood_group: 'AB+',
    emergency_contact_name: 'Vijay Kulkarni (Father)',
    emergency_contact_phone: '+91 98111 99995',
    address: '56 GST Road, Tambaram, Chennai - 600045',
    allergies: 'Aspirin',
    medical_history_summary: 'Occasional migraine headaches, normal BMI.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'p1000000-0000-0000-0000-000000000006',
    hospital_id: 'a1000000-0000-0000-0000-000000000001',
    full_name: 'Arjun Kapoor',
    phone_number: '+91 98111 00006',
    whatsapp_number: '+919811100006',
    date_of_birth: '1988-09-12',
    gender: 'male',
    blood_group: 'A-',
    emergency_contact_name: 'Renu Kapoor (Mother)',
    emergency_contact_phone: '+91 98111 99996',
    address: '88 ECR, Thiruvanmiyur, Chennai - 600041',
    allergies: 'No known allergies',
    medical_history_summary: 'Right knee ACL sprain from sports in 2022.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'p1000000-0000-0000-0000-000000000007',
    hospital_id: 'a1000000-0000-0000-0000-000000000001',
    full_name: 'Meera Subramanian',
    phone_number: '+91 98111 00007',
    whatsapp_number: '+919811100007',
    date_of_birth: '1965-04-18',
    gender: 'female',
    blood_group: 'O+',
    emergency_contact_name: 'Suresh Subramanian (Son)',
    emergency_contact_phone: '+91 98111 99997',
    address: '34 Cathedral Road, Gopalapuram, Chennai - 600086',
    allergies: 'Ciprofloxacin',
    medical_history_summary: 'Osteoarthritis of bilateral knees and lumbar spondylosis.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'p1000000-0000-0000-0000-000000000008',
    hospital_id: 'a1000000-0000-0000-0000-000000000001',
    full_name: 'Harish Chandra',
    phone_number: '+91 98111 00008',
    whatsapp_number: '+919811100008',
    date_of_birth: '1981-12-05',
    gender: 'male',
    blood_group: 'B-',
    emergency_contact_name: 'Geeta Chandra (Spouse)',
    emergency_contact_phone: '+91 98111 99998',
    address: '29 OMR, Sholinganallur, Chennai - 600119',
    allergies: 'No known drug allergies',
    medical_history_summary: 'Dyslipidemia on Atorvastatin.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'p1000000-0000-0000-0000-000000000009',
    hospital_id: 'a1000000-0000-0000-0000-000000000001',
    full_name: 'Pooja Bhattacharya',
    phone_number: '+91 98111 00009',
    whatsapp_number: '+919811100009',
    date_of_birth: '2016-02-14',
    gender: 'female',
    blood_group: 'A+',
    emergency_contact_name: 'Sourav Bhattacharya (Father)',
    emergency_contact_phone: '+91 98111 99999',
    address: '15 Luz Church Road, Mylapore, Chennai - 600004',
    allergies: 'Egg whites',
    medical_history_summary: 'Childhood eczema; routine growth milestones normal.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'p1000000-0000-0000-0000-000000000010',
    hospital_id: 'a1000000-0000-0000-0000-000000000001',
    full_name: 'Naveen Reddy',
    phone_number: '+91 98111 00010',
    whatsapp_number: '+919811100010',
    date_of_birth: '1995-07-29',
    gender: 'male',
    blood_group: 'AB-',
    emergency_contact_name: 'Preethi Reddy (Sister)',
    emergency_contact_phone: '+91 98111 99910',
    address: '92 Nungambakkam High Road, Chennai - 600034',
    allergies: 'No known drug allergies',
    medical_history_summary: 'No significant prior chronic illness.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  // Patient belonging to Hospital B (Fortis)
  {
    id: 'p2000000-0000-0000-0000-000000000001',
    hospital_id: 'a1000000-0000-0000-0000-000000000002',
    full_name: 'Kiran Kumar (Fortis Patient)',
    phone_number: '+91 98222 00001',
    whatsapp_number: '+919822200001',
    date_of_birth: '1989-03-22',
    gender: 'male',
    blood_group: 'B+',
    emergency_contact_name: 'Lalitha Kumar (Spouse)',
    emergency_contact_phone: '+91 98222 99991',
    address: '71 Besant Avenue, Adyar, Chennai - 600020',
    allergies: 'None',
    medical_history_summary: 'Annual executive physical checkup.',
    created_at: subDays(today, 10).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const INITIAL_PATIENT_PROFILES: PatientProfile[] = INITIAL_PATIENTS.map(p => ({
  id: p.id,
  date_of_birth: p.date_of_birth,
  gender: p.gender,
  blood_group: p.blood_group,
  emergency_contact_name: p.emergency_contact_name,
  emergency_contact_phone: p.emergency_contact_phone,
  address: p.address,
  allergies: p.allergies,
  medical_history_summary: p.medical_history_summary,
  created_at: p.created_at,
  updated_at: p.updated_at,
}));

// ------------------------------------------------------------------------------
// 7. Initial Appointments (All assigned to correct hospital_id)
// ------------------------------------------------------------------------------
export const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: 'b1000000-0000-0000-0000-000000000001',
    hospital_id: 'a1000000-0000-0000-0000-000000000001',
    patient_id: 'p1000000-0000-0000-0000-000000000001',
    doctor_id: 'd2000000-0000-0000-0000-000000000001',
    appointment_date: threeDaysAgoStr,
    start_time: '10:00:00',
    end_time: '10:30:00',
    status: 'completed',
    chief_complaint: 'Chest tightness during morning brisk walking and mild shortness of breath.',
    cancellation_reason: null,
    created_at: subDays(today, 5).toISOString(),
    updated_at: subDays(today, 3).toISOString(),
  },
  {
    id: 'b1000000-0000-0000-0000-000000000002',
    hospital_id: 'a1000000-0000-0000-0000-000000000001',
    patient_id: 'p1000000-0000-0000-0000-000000000004',
    doctor_id: 'd2000000-0000-0000-0000-000000000002',
    appointment_date: twoDaysAgoStr,
    start_time: '11:00:00',
    end_time: '11:30:00',
    status: 'completed',
    chief_complaint: 'Persistent dry cough for 5 days with mild evening fever.',
    cancellation_reason: null,
    created_at: subDays(today, 4).toISOString(),
    updated_at: subDays(today, 2).toISOString(),
  },
  {
    id: 'b1000000-0000-0000-0000-000000000003',
    hospital_id: 'a1000000-0000-0000-0000-000000000001',
    patient_id: 'p1000000-0000-0000-0000-000000000006',
    doctor_id: 'd2000000-0000-0000-0000-000000000003',
    appointment_date: yesterdayStr,
    start_time: '14:00:00',
    end_time: '14:30:00',
    status: 'completed',
    chief_complaint: 'Right knee pain and clicking sensation when climbing stairs.',
    cancellation_reason: null,
    created_at: subDays(today, 3).toISOString(),
    updated_at: subDays(today, 1).toISOString(),
  },
  // Today's Appointments
  {
    id: 'b1000000-0000-0000-0000-000000000004',
    hospital_id: 'a1000000-0000-0000-0000-000000000001',
    patient_id: 'p1000000-0000-0000-0000-000000000003',
    doctor_id: 'd2000000-0000-0000-0000-000000000001',
    appointment_date: todayStr,
    start_time: '09:30:00',
    end_time: '10:00:00',
    status: 'confirmed',
    chief_complaint: 'Routine diabetic cardiac clearance & blood pressure review.',
    cancellation_reason: null,
    created_at: yesterdayStr,
    updated_at: yesterdayStr,
  },
  {
    id: 'b1000000-0000-0000-0000-000000000005',
    hospital_id: 'a1000000-0000-0000-0000-000000000001',
    patient_id: 'p1000000-0000-0000-0000-000000000002',
    doctor_id: 'd2000000-0000-0000-0000-000000000001',
    appointment_date: todayStr,
    start_time: '10:30:00',
    end_time: '11:00:00',
    status: 'confirmed',
    chief_complaint: 'Occasional palpitations after heavy exercise and fatigue.',
    cancellation_reason: null,
    created_at: yesterdayStr,
    updated_at: yesterdayStr,
  },
  // Hospital B Appointment
  {
    id: 'b2000000-0000-0000-0000-000000000001',
    hospital_id: 'a1000000-0000-0000-0000-000000000002',
    patient_id: 'p2000000-0000-0000-0000-000000000001',
    doctor_id: 'd2000000-0000-0000-0000-000000000004',
    appointment_date: inTwoDaysStr,
    start_time: '10:00:00',
    end_time: '10:30:00',
    status: 'confirmed',
    chief_complaint: 'Executive health physical at Fortis Hospital.',
    cancellation_reason: null,
    created_at: yesterdayStr,
    updated_at: yesterdayStr,
  }
];

// ------------------------------------------------------------------------------
// 8. Initial Medical Records
// ------------------------------------------------------------------------------
export const INITIAL_MEDICAL_RECORDS: MedicalRecord[] = [
  {
    id: 'm1000000-0000-0000-0000-000000000001',
    hospital_id: 'a1000000-0000-0000-0000-000000000001',
    appointment_id: 'b1000000-0000-0000-0000-000000000001',
    patient_id: 'p1000000-0000-0000-0000-000000000001',
    doctor_id: 'd2000000-0000-0000-0000-000000000001',
    chief_complaint: 'Chest tightness during morning brisk walking and mild shortness of breath.',
    vital_signs: { bp: '138/88', pulse: 78, temp: 98.4, weight: 74.5, height: 174, spo2: 98 },
    clinical_notes: 'Patient presents with exertion-induced retrosternal tightness, resolving with rest. Heart sounds S1 S2 normal, no murmurs.',
    diagnosis: 'Stable Angina Pectoris / Essential Hypertension Stage 1 (ICD-10 I20.9)',
    treatment_plan: '1. Initiate beta-blocker and statin therapy.\n2. Low sodium DASH diet.\n3. Schedule Treadmill Stress Test next week.',
    follow_up_date: inTwoDaysStr,
    follow_up_notes: 'Review TMT and Echo reports; re-evaluate dosage.',
    created_at: subDays(today, 3).toISOString(),
    updated_at: subDays(today, 3).toISOString(),
  },
  {
    id: 'm1000000-0000-0000-0000-000000000002',
    hospital_id: 'a1000000-0000-0000-0000-000000000001',
    appointment_id: 'b1000000-0000-0000-0000-000000000002',
    patient_id: 'p1000000-0000-0000-0000-000000000004',
    doctor_id: 'd2000000-0000-0000-0000-000000000002',
    chief_complaint: 'Persistent dry cough for 5 days with mild evening fever.',
    vital_signs: { bp: '95/60', pulse: 96, temp: 99.8, weight: 21.0, height: 112, spo2: 99 },
    clinical_notes: 'Pediatric patient alert, throat mildly congested, bilateral breath sounds vesicular with scattered rhonchi.',
    diagnosis: 'Acute Viral Bronchitis (ICD-10 J20.9)',
    treatment_plan: '1. Pediatric cough syrup.\n2. Paracetamol for fever spikes.\n3. Warm steam inhalation.',
    follow_up_date: inThreeDaysStr,
    follow_up_notes: 'Follow up if fever persists beyond 3 days.',
    created_at: subDays(today, 2).toISOString(),
    updated_at: subDays(today, 2).toISOString(),
  }
];

// ------------------------------------------------------------------------------
// 9. Initial Prescriptions
// ------------------------------------------------------------------------------
export const INITIAL_PRESCRIPTIONS: Prescription[] = [
  {
    id: 'rx000000-0000-0000-0000-000000000001',
    hospital_id: 'a1000000-0000-0000-0000-000000000001',
    medical_record_id: 'm1000000-0000-0000-0000-000000000001',
    patient_id: 'p1000000-0000-0000-0000-000000000001',
    doctor_id: 'd2000000-0000-0000-0000-000000000001',
    medication_name: 'Aspirin Gastro-resistant',
    dosage: '75 mg',
    frequency: '1-0-0 (Once daily after lunch)',
    duration: '30 days',
    instructions: 'Take with a glass of water. Do not crush.',
    created_at: subDays(today, 3).toISOString(),
  },
  {
    id: 'rx000000-0000-0000-0000-000000000002',
    hospital_id: 'a1000000-0000-0000-0000-000000000001',
    medical_record_id: 'm1000000-0000-0000-0000-000000000001',
    patient_id: 'p1000000-0000-0000-0000-000000000001',
    doctor_id: 'd2000000-0000-0000-0000-000000000001',
    medication_name: 'Metoprolol Tartrate',
    dosage: '25 mg',
    frequency: '1-0-1 (Twice daily after meals)',
    duration: '30 days',
    instructions: 'Check pulse before taking; maintain steady timing.',
    created_at: subDays(today, 3).toISOString(),
  }
];

// ------------------------------------------------------------------------------
// 10. Initial Notifications
// ------------------------------------------------------------------------------
export const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 'n1000000-0000-0000-0000-000000000001',
    user_id: 'p1000000-0000-0000-0000-000000000001',
    title: 'Medical Record Ready',
    message: 'Dr. Rajesh Sharma has recorded your consultation notes and prescription for your visit.',
    type: 'record_ready',
    is_read: false,
    link: '/patient/records',
    created_at: yesterdayStr,
  },
  {
    id: 'n1000000-0000-0000-0000-000000000003',
    user_id: 'd2000000-0000-0000-0000-000000000001',
    title: 'Today Schedule',
    message: 'You have 2 consultations scheduled for today.',
    type: 'system',
    is_read: false,
    link: '/doctor/appointments',
    created_at: todayStr,
  },
  {
    id: 'n1000000-0000-0000-0000-000000000004',
    user_id: 'r1000000-0000-0000-0000-000000000001',
    title: 'Clinic Ready',
    message: 'ClinicFlow Apollo front desk station initialized for today.',
    type: 'system',
    is_read: true,
    link: '/receptionist/dashboard',
    created_at: todayStr,
  },
];

// ------------------------------------------------------------------------------
// 11. Initial Audit Logs
// ------------------------------------------------------------------------------
export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'al000000-0000-0000-0000-000000000001',
    hospital_id: null,
    user_id: 'sc100000-0000-0000-0000-000000000001',
    action: 'PLATFORM_BOOTSTRAP',
    entity_type: 'SYSTEM',
    entity_id: null,
    details: { message: 'ClinicFlow Multi-Tenant Cloud Platform initialized with Supercoordinator and 2 Hospitals.' },
    created_at: subDays(today, 10).toISOString(),
  },
  {
    id: 'al000000-0000-0000-0000-000000000002',
    hospital_id: 'a1000000-0000-0000-0000-000000000001',
    user_id: 'a1000000-0000-0000-0000-000000000001',
    action: 'HOSPITAL_WHATSAPP_CONFIGURED',
    entity_type: 'HOSPITAL',
    entity_id: 'a1000000-0000-0000-0000-000000000001',
    details: { whatsapp_phone_number_id: '109283746501928', whatsapp_enabled: true },
    created_at: subDays(today, 5).toISOString(),
  },
  {
    id: 'al000000-0000-0000-0000-000000000003',
    hospital_id: 'a1000000-0000-0000-0000-000000000001',
    user_id: null,
    action: 'WHATSAPP_APPOINTMENT_BOOKED',
    entity_type: 'APPOINTMENT',
    entity_id: 'b1000000-0000-0000-0000-000000000004',
    details: { whatsapp_number: '+919811100003', short_ref: 'CF-B1000000' },
    created_at: yesterdayStr,
  },
];

// ------------------------------------------------------------------------------
// 12. Initial WhatsApp Sessions & Messages
// ------------------------------------------------------------------------------
export const INITIAL_WHATSAPP_SESSIONS: WhatsAppSession[] = [
  {
    id: 'ws000000-0000-0000-0000-000000000001',
    hospital_id: 'a1000000-0000-0000-0000-000000000001',
    patient_id: 'p1000000-0000-0000-0000-000000000001',
    whatsapp_number: '+919811100001',
    state: 'MAIN_MENU',
    state_data: {},
    last_message_at: subDays(today, 1).toISOString(),
    expires_at: addDays(today, 1).toISOString(),
    created_at: subDays(today, 2).toISOString(),
    updated_at: subDays(today, 1).toISOString(),
  },
  {
    id: 'ws000000-0000-0000-0000-000000000002',
    hospital_id: 'a1000000-0000-0000-0000-000000000001',
    patient_id: 'p1000000-0000-0000-0000-000000000003',
    whatsapp_number: '+919811100003',
    state: 'COMPLETED',
    state_data: { last_appointment_id: 'b1000000-0000-0000-0000-000000000004' },
    last_message_at: yesterdayStr,
    expires_at: addDays(today, 1).toISOString(),
    created_at: yesterdayStr,
    updated_at: yesterdayStr,
  }
];

export const INITIAL_WHATSAPP_MESSAGES: WhatsAppMessage[] = [
  {
    id: 'wm000000-0000-0000-0000-000000000001',
    hospital_id: 'a1000000-0000-0000-0000-000000000001',
    patient_id: 'p1000000-0000-0000-0000-000000000001',
    session_id: 'ws000000-0000-0000-0000-000000000001',
    direction: 'INBOUND',
    whatsapp_message_id: 'wamid.HBgMOTE5ODExMTAwMDAxFAARABsAFDY2Mzk4OTA1NDk3MjhGMjE3RDkA',
    message_type: 'TEXT',
    message_status: 'received',
    metadata: { body: 'Hi' },
    created_at: subDays(today, 1).toISOString(),
  },
  {
    id: 'wm000000-0000-0000-0000-000000000002',
    hospital_id: 'a1000000-0000-0000-0000-000000000001',
    patient_id: 'p1000000-0000-0000-0000-000000000001',
    session_id: 'ws000000-0000-0000-0000-000000000001',
    direction: 'OUTBOUND',
    whatsapp_message_id: 'wamid.out.HBgMOTE5ODExMTAwMDAxFAARABsAFDY2Mzk4OTA1NDk3MjhGMjE3REUB',
    message_type: 'BUTTON',
    message_status: 'sent',
    metadata: { body: 'Welcome to Apollo Health Center. How can we help you today?' },
    created_at: subDays(today, 1).toISOString(),
  }
];

// ------------------------------------------------------------------------------
// Mock Database Store Interface
// ------------------------------------------------------------------------------
export interface MockDB {
  hospitals: Hospital[];
  departments: Department[];
  specializations: Specialization[];
  profiles: Profile[];
  doctorProfiles: DoctorProfile[];
  patients: Patient[];
  patientProfiles: PatientProfile[];
  appointments: Appointment[];
  medicalRecords: MedicalRecord[];
  prescriptions: Prescription[];
  notifications: Notification[];
  auditLogs: AuditLog[];
  whatsappSessions: WhatsAppSession[];
  whatsappMessages: WhatsAppMessage[];
}

let inMemoryMockDB: MockDB | null = null;

export function getMockDB(): MockDB {
  if (typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.hospitals && parsed.patients) {
          return parsed;
        }
      }
    } catch (e) {
      // ignore
    }
  } else if (inMemoryMockDB) {
    return inMemoryMockDB;
  }

  const initial: MockDB = {
    hospitals: INITIAL_HOSPITALS,
    departments: INITIAL_DEPARTMENTS,
    specializations: INITIAL_SPECIALIZATIONS,
    profiles: INITIAL_PROFILES,
    doctorProfiles: INITIAL_DOCTOR_PROFILES,
    patients: INITIAL_PATIENTS,
    patientProfiles: INITIAL_PATIENT_PROFILES,
    appointments: INITIAL_APPOINTMENTS,
    medicalRecords: INITIAL_MEDICAL_RECORDS,
    prescriptions: INITIAL_PRESCRIPTIONS,
    notifications: INITIAL_NOTIFICATIONS,
    auditLogs: INITIAL_AUDIT_LOGS,
    whatsappSessions: INITIAL_WHATSAPP_SESSIONS,
    whatsappMessages: INITIAL_WHATSAPP_MESSAGES,
  };

  saveMockDB(initial);
  return initial;
}

export function saveMockDB(db: MockDB): void {
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    } catch (e) {
      // ignore
    }
  } else {
    inMemoryMockDB = db;
  }
}

export function resetMockDB(): void {
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      // ignore
    }
  } else {
    inMemoryMockDB = null;
  }
}
