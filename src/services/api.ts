// ==============================================================================
// ClinicFlow — Unified Multi-Tenant API & Cloud Service Layer
// Bridges Supabase Cloud Backend with Local Mock Engine
// Enforces Tenant Isolation, Concurrency Protection & WhatsApp Operations
// ==============================================================================

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { getMockDB, saveMockDB } from '@/lib/mockData';
import { 
  Hospital,
  Profile, 
  Department, 
  Specialization, 
  DoctorProfile, 
  PatientProfile, 
  Patient,
  PatientWithDetails,
  Appointment, 
  MedicalRecord, 
  Prescription, 
  Notification, 
  AuditLog, 
  AppointmentFilter,
  ConsultationFormData,
  ReportSummary,
  UserRole,
  AppointmentStatus,
  WhatsAppSession,
  WhatsAppMessage,
  TimeSlot
} from '@/types';
import { format, addDays } from 'date-fns';
import { generateDoctorTimeSlots } from '@/lib/dateUtils';

export const api = {
  // ----------------------------------------------------------------------------
  // 1. Hospitals (Tenant Management)
  // ----------------------------------------------------------------------------
  hospitals: {
    async getAll(): Promise<Hospital[]> {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase
          .from('hospitals')
          .select('*')
          .order('name');
        if (error) throw new Error(error.message);
        return (data as Hospital[]) || [];
      }

      const db = getMockDB();
      return db.hospitals;
    },

    async getById(id: string): Promise<Hospital | null> {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase
          .from('hospitals')
          .select('*')
          .eq('id', id)
          .single();
        if (error) return null;
        return data as Hospital;
      }

      const db = getMockDB();
      return db.hospitals.find(h => h.id === id) || null;
    },

    async create(hospitalData: Omit<Hospital, 'id' | 'created_at' | 'updated_at'>): Promise<Hospital> {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase
          .from('hospitals')
          .insert(hospitalData)
          .select()
          .single();
        if (error) throw new Error(error.message);
        return data as Hospital;
      }

      const db = getMockDB();
      const newHospital: Hospital = {
        ...hospitalData,
        id: `h-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      db.hospitals.push(newHospital);
      saveMockDB(db);
      return newHospital;
    },

    async update(id: string, updates: Partial<Hospital>): Promise<Hospital> {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase
          .from('hospitals')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select()
          .single();
        if (error) throw new Error(error.message);
        return data as Hospital;
      }

      const db = getMockDB();
      const idx = db.hospitals.findIndex(h => h.id === id);
      if (idx === -1) throw new Error('Hospital not found');
      db.hospitals[idx] = { ...db.hospitals[idx], ...updates, updated_at: new Date().toISOString() };
      saveMockDB(db);
      return db.hospitals[idx];
    },

    async updateWhatsAppConfig(
      id: string,
      config: { whatsapp_phone_number_id?: string; whatsapp_business_account_id?: string; whatsapp_enabled?: boolean }
    ): Promise<Hospital> {
      return api.hospitals.update(id, config);
    },
  },

  // ----------------------------------------------------------------------------
  // 2. Authentication & Profiles
  // ----------------------------------------------------------------------------
  auth: {
    async getCurrentProfile(userId: string): Promise<Profile | null> {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*, hospital:hospitals(*)')
          .eq('id', userId)
          .single();
        if (error) {
          console.error('Supabase profile fetch error:', error);
          return null;
        }
        return data as Profile;
      }

      const db = getMockDB();
      const prof = db.profiles.find(p => p.id === userId);
      if (!prof) return null;
      return {
        ...prof,
        hospital: prof.hospital_id ? db.hospitals.find(h => h.id === prof.hospital_id) : undefined,
      };
    },

    async getPatientProfile(userId: string): Promise<PatientProfile | null> {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase
          .from('patient_profiles')
          .select('*')
          .eq('id', userId)
          .single();
        if (error) return null;
        return data as PatientProfile;
      }

      const db = getMockDB();
      return db.patientProfiles.find(p => p.id === userId) || null;
    },

    async getDoctorProfile(userId: string): Promise<DoctorProfile | null> {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase
          .from('doctor_profiles')
          .select('*, department:departments(*), specialization:specializations(*)')
          .eq('id', userId)
          .single();
        if (error) return null;
        return data as DoctorProfile;
      }

      const db = getMockDB();
      const doc = db.doctorProfiles.find(p => p.id === userId);
      if (!doc) return null;
      return {
        ...doc,
        department: db.departments.find(d => d.id === doc.department_id),
        specialization: db.specializations.find(s => s.id === doc.specialization_id),
      };
    },

    async updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile> {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', userId)
          .select()
          .single();
        if (error) throw new Error(error.message);
        return data as Profile;
      }

      const db = getMockDB();
      const idx = db.profiles.findIndex(p => p.id === userId);
      if (idx === -1) throw new Error('Profile not found');
      db.profiles[idx] = { ...db.profiles[idx], ...updates, updated_at: new Date().toISOString() };
      saveMockDB(db);
      return db.profiles[idx];
    },

    async updatePatientProfile(userId: string, updates: Partial<PatientProfile>): Promise<PatientProfile> {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase
          .from('patient_profiles')
          .upsert({ id: userId, ...updates, updated_at: new Date().toISOString() })
          .select()
          .single();
        if (error) throw new Error(error.message);
        return data as PatientProfile;
      }

      const db = getMockDB();
      const idx = db.patientProfiles.findIndex(p => p.id === userId);
      if (idx === -1) {
        const newRecord: PatientProfile = {
          id: userId,
          date_of_birth: updates.date_of_birth || null,
          gender: updates.gender || null,
          blood_group: updates.blood_group || null,
          emergency_contact_name: updates.emergency_contact_name || null,
          emergency_contact_phone: updates.emergency_contact_phone || null,
          address: updates.address || null,
          allergies: updates.allergies || null,
          medical_history_summary: updates.medical_history_summary || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        db.patientProfiles.push(newRecord);
        saveMockDB(db);
        return newRecord;
      } else {
        db.patientProfiles[idx] = { ...db.patientProfiles[idx], ...updates, updated_at: new Date().toISOString() };
        saveMockDB(db);
        return db.patientProfiles[idx];
      }
    }
  },

  // ----------------------------------------------------------------------------
  // 3. Departments & Specializations
  // ----------------------------------------------------------------------------
  departments: {
    async getAll(hospitalId?: string): Promise<Department[]> {
      if (isSupabaseConfigured()) {
        let query = supabase.from('departments').select('*');
        if (hospitalId) {
          query = query.or(`hospital_id.eq.${hospitalId},hospital_id.is.null`);
        }
        const { data, error } = await query.order('name');
        if (error) throw new Error(error.message);
        return (data as Department[]) || [];
      }

      const db = getMockDB();
      if (!hospitalId) return db.departments;
      return db.departments.filter(d => !d.hospital_id || d.hospital_id === hospitalId);
    },

    async create(dept: Omit<Department, 'id' | 'created_at'>): Promise<Department> {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase
          .from('departments')
          .insert(dept)
          .select()
          .single();
        if (error) throw new Error(error.message);
        return data as Department;
      }

      const db = getMockDB();
      const newDept: Department = {
        ...dept,
        id: `d-${Date.now()}`,
        created_at: new Date().toISOString(),
      };
      db.departments.push(newDept);
      saveMockDB(db);
      return newDept;
    },

    async update(id: string, updates: Partial<Department>): Promise<Department> {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase
          .from('departments')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        if (error) throw new Error(error.message);
        return data as Department;
      }

      const db = getMockDB();
      const idx = db.departments.findIndex(d => d.id === id);
      if (idx === -1) throw new Error('Department not found');
      db.departments[idx] = { ...db.departments[idx], ...updates };
      saveMockDB(db);
      return db.departments[idx];
    },

    async getSpecializations(departmentId?: string): Promise<Specialization[]> {
      if (isSupabaseConfigured()) {
        let query = supabase.from('specializations').select('*, department:departments(*)');
        if (departmentId) {
          query = query.eq('department_id', departmentId);
        }
        const { data, error } = await query.order('name');
        if (error) throw new Error(error.message);
        return (data as Specialization[]) || [];
      }

      const db = getMockDB();
      let list = db.specializations;
      if (departmentId) {
        list = list.filter(s => s.department_id === departmentId);
      }
      return list.map(s => ({
        ...s,
        department: db.departments.find(d => d.id === s.department_id),
      }));
    },

    async createSpecialization(spec: Omit<Specialization, 'id' | 'created_at'>): Promise<Specialization> {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase
          .from('specializations')
          .insert(spec)
          .select()
          .single();
        if (error) throw new Error(error.message);
        return data as Specialization;
      }

      const db = getMockDB();
      const newSpec: Specialization = {
        ...spec,
        id: `s-${Date.now()}`,
        created_at: new Date().toISOString(),
      };
      db.specializations.push(newSpec);
      saveMockDB(db);
      return newSpec;
    }
  },

  // ----------------------------------------------------------------------------
  // 4. Doctors & Clinical Staff
  // ----------------------------------------------------------------------------
  doctors: {
    async getAll(hospitalId?: string): Promise<Array<Profile & { doctor_profile: DoctorProfile; department: Department | null; specialization: Specialization | null }>> {
      if (isSupabaseConfigured()) {
        let query = supabase
          .from('profiles')
          .select('*, doctor_profile:doctor_profiles(*, department:departments(*), specialization:specializations(*))')
          .eq('role', 'doctor')
          .eq('is_active', true);

        if (hospitalId) {
          query = query.eq('hospital_id', hospitalId);
        }

        const { data, error } = await query;
        if (error) throw new Error(error.message);
        return (data || []).map((d: any) => ({
          ...d,
          department: d.doctor_profile?.department || null,
          specialization: d.doctor_profile?.specialization || null,
        }));
      }

      const db = getMockDB();
      let doctors = db.profiles.filter(p => p.role === 'doctor' && p.is_active);
      if (hospitalId) {
        doctors = doctors.filter(d => d.hospital_id === hospitalId);
      }

      return doctors.map(doc => {
        const dp = db.doctorProfiles.find(d => d.id === doc.id) || {
          id: doc.id,
          hospital_id: doc.hospital_id,
          department_id: null,
          specialization_id: null,
          license_number: null,
          consultation_fee: 500,
          bio: null,
          room_number: null,
          available_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          start_time: '09:00:00',
          end_time: '17:00:00',
          slot_duration_minutes: 30,
          created_at: doc.created_at,
          updated_at: doc.updated_at,
        };
        const dept = db.departments.find(d => d.id === dp.department_id) || null;
        const spec = db.specializations.find(s => s.id === dp.specialization_id) || null;
        return {
          ...doc,
          doctor_profile: dp,
          department: dept,
          specialization: spec,
        };
      });
    },

    async getById(id: string) {
      const all = await api.doctors.getAll();
      return all.find(d => d.id === id) || null;
    },

    async updateDoctorProfile(id: string, updates: Partial<DoctorProfile>): Promise<DoctorProfile> {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase
          .from('doctor_profiles')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select('*, department:departments(*), specialization:specializations(*)')
          .single();
        if (error) throw new Error(error.message);
        return data as DoctorProfile;
      }

      const db = getMockDB();
      const idx = db.doctorProfiles.findIndex(d => d.id === id);
      if (idx === -1) {
        const newDoc: DoctorProfile = {
          id,
          hospital_id: updates.hospital_id || null,
          department_id: updates.department_id || null,
          specialization_id: updates.specialization_id || null,
          license_number: updates.license_number || null,
          consultation_fee: updates.consultation_fee || 500,
          bio: updates.bio || null,
          room_number: updates.room_number || null,
          available_days: updates.available_days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          start_time: updates.start_time || '09:00:00',
          end_time: updates.end_time || '17:00:00',
          slot_duration_minutes: updates.slot_duration_minutes || 30,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        db.doctorProfiles.push(newDoc);
        saveMockDB(db);
        return newDoc;
      }
      db.doctorProfiles[idx] = { ...db.doctorProfiles[idx], ...updates, updated_at: new Date().toISOString() };
      saveMockDB(db);
      return db.doctorProfiles[idx];
    }
  },

  // ----------------------------------------------------------------------------
  // 5. Patients & Registrations (Decoupled Database Entities)
  // ----------------------------------------------------------------------------
  patients: {
    async getAll(hospitalId?: string): Promise<PatientWithDetails[]> {
      if (isSupabaseConfigured()) {
        let query = supabase.from('patients').select('*, hospital:hospitals(*)');
        if (hospitalId) {
          query = query.eq('hospital_id', hospitalId);
        }
        const { data, error } = await query.order('full_name');
        if (error) throw new Error(error.message);
        return (data as PatientWithDetails[]) || [];
      }

      const db = getMockDB();
      let patients = db.patients;
      if (hospitalId) {
        patients = patients.filter(p => p.hospital_id === hospitalId);
      }
      return patients.map(p => ({
        ...p,
        email: `${p.phone_number?.replace(/\D/g, '') || p.id.slice(0, 8)}@patient.clinicflow.local`,
        phone: p.phone_number,
        patient_profile: db.patientProfiles.find(pp => pp.id === p.id) || null,
        recent_appointments: db.appointments.filter(a => a.patient_id === p.id),
      }));
    },

    async getById(id: string): Promise<PatientWithDetails | null> {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase
          .from('patients')
          .select('*, hospital:hospitals(*)')
          .eq('id', id)
          .single();
        if (error) return null;
        return data as PatientWithDetails;
      }

      const db = getMockDB();
      const p = db.patients.find(pat => pat.id === id);
      if (!p) return null;
      return {
        ...p,
        email: `${p.phone_number?.replace(/\D/g, '') || p.id.slice(0, 8)}@patient.clinicflow.local`,
        phone: p.phone_number,
        patient_profile: db.patientProfiles.find(pp => pp.id === p.id) || null,
        recent_appointments: db.appointments.filter(a => a.patient_id === p.id),
      };
    },

    async registerPatient(
      data: {
        full_name: string;
        email?: string;
        phone: string;
        whatsapp_number?: string;
        date_of_birth: string;
        gender: 'male' | 'female' | 'other';
        blood_group?: string;
        address: string;
        emergency_contact_name: string;
        emergency_contact_phone: string;
        allergies?: string;
        medical_history_summary?: string;
      },
      hospitalId?: string
    ): Promise<PatientWithDetails> {
      const resolvedHospitalId = hospitalId || 'a1000000-0000-0000-0000-000000000001';
      const formattedWhatsapp = data.whatsapp_number || (data.phone.startsWith('+') ? data.phone : `+91${data.phone.replace(/\D/g, '')}`);

      if (isSupabaseConfigured()) {
        const newId = crypto.randomUUID();
        const { data: patientRecord, error: patErr } = await supabase
          .from('patients')
          .insert({
            id: newId,
            hospital_id: resolvedHospitalId,
            full_name: data.full_name,
            phone_number: data.phone,
            whatsapp_number: formattedWhatsapp,
            date_of_birth: data.date_of_birth,
            gender: data.gender,
            blood_group: data.blood_group,
            address: data.address,
            emergency_contact_name: data.emergency_contact_name,
            emergency_contact_phone: data.emergency_contact_phone,
            allergies: data.allergies,
            medical_history_summary: data.medical_history_summary,
          })
          .select()
          .single();

        if (patErr) throw new Error(patErr.message);
        return patientRecord as PatientWithDetails;
      }

      const db = getMockDB();
      // Check existing WhatsApp number in this hospital
      const existing = db.patients.find(
        p => p.hospital_id === resolvedHospitalId && p.whatsapp_number === formattedWhatsapp
      );
      if (existing) {
        throw new Error('A patient with this WhatsApp number already exists in this hospital.');
      }

      const newId = `p-${Date.now()}`;
      const newPatient: Patient = {
        id: newId,
        hospital_id: resolvedHospitalId,
        full_name: data.full_name,
        phone_number: data.phone,
        whatsapp_number: formattedWhatsapp,
        date_of_birth: data.date_of_birth,
        gender: data.gender,
        blood_group: (data.blood_group as any) || null,
        address: data.address,
        emergency_contact_name: data.emergency_contact_name,
        emergency_contact_phone: data.emergency_contact_phone,
        allergies: data.allergies || null,
        medical_history_summary: data.medical_history_summary || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      db.patients.push(newPatient);

      // Keep patientProfiles synchronized for UI compatibility
      db.patientProfiles.push({
        id: newId,
        date_of_birth: data.date_of_birth,
        gender: data.gender,
        blood_group: (data.blood_group as any) || null,
        address: data.address,
        emergency_contact_name: data.emergency_contact_name,
        emergency_contact_phone: data.emergency_contact_phone,
        allergies: data.allergies || null,
        medical_history_summary: data.medical_history_summary || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      saveMockDB(db);
      return (await api.patients.getById(newId))!;
    },

    async update(id: string, updates: Partial<Patient>): Promise<Patient> {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase
          .from('patients')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select()
          .single();
        if (error) throw new Error(error.message);
        return data as Patient;
      }

      const db = getMockDB();
      const idx = db.patients.findIndex(p => p.id === id);
      if (idx === -1) throw new Error('Patient not found');
      db.patients[idx] = { ...db.patients[idx], ...updates, updated_at: new Date().toISOString() };
      saveMockDB(db);
      return db.patients[idx];
    }
  },

  // ----------------------------------------------------------------------------
  // 6. Appointments & Concurrency Protected Scheduling
  // ----------------------------------------------------------------------------
  appointments: {
    async getAll(filter?: AppointmentFilter): Promise<Appointment[]> {
      if (isSupabaseConfigured()) {
        let query = supabase
          .from('appointments')
          .select('*, patient:patients(*), doctor:profiles!appointments_doctor_id_fkey(*, doctor_profile:doctor_profiles(*, department:departments(*))), hospital:hospitals(*)');

        if (filter?.hospitalId) query = query.eq('hospital_id', filter.hospitalId);
        if (filter?.doctorId) query = query.eq('doctor_id', filter.doctorId);
        if (filter?.patientId) query = query.eq('patient_id', filter.patientId);
        if (filter?.status && filter.status !== 'all') query = query.eq('status', filter.status);
        if (filter?.dateFrom) query = query.gte('appointment_date', filter.dateFrom);
        if (filter?.dateTo) query = query.lte('appointment_date', filter.dateTo);

        const { data, error } = await query.order('appointment_date', { ascending: false }).order('start_time');
        if (error) throw new Error(error.message);
        return (data as Appointment[]) || [];
      }

      const db = getMockDB();
      let list = db.appointments.map(appt => {
        const pat = db.patients.find(p => p.id === appt.patient_id) || db.profiles.find(p => p.id === appt.patient_id);
        const doctorProf = db.profiles.find(p => p.id === appt.doctor_id);
        const docExtra = db.doctorProfiles.find(d => d.id === appt.doctor_id);
        const dept = docExtra ? db.departments.find(d => d.id === docExtra.department_id) : undefined;
        const medRecord = db.medicalRecords.find(m => m.appointment_id === appt.id);
        const hosp = db.hospitals.find(h => h.id === appt.hospital_id);

        return {
          ...appt,
          patient: pat,
          doctor: doctorProf ? {
            ...doctorProf,
            doctor_profile: docExtra ? { ...docExtra, department: dept } : undefined,
          } as any : undefined,
          medical_record: medRecord,
          hospital: hosp,
        };
      });

      if (filter) {
        if (filter.hospitalId) list = list.filter(a => a.hospital_id === filter.hospitalId);
        if (filter.doctorId) list = list.filter(a => a.doctor_id === filter.doctorId);
        if (filter.patientId) list = list.filter(a => a.patient_id === filter.patientId);
        if (filter.status && filter.status !== 'all') list = list.filter(a => a.status === filter.status);
        if (filter.dateFrom) list = list.filter(a => a.appointment_date >= filter.dateFrom!);
        if (filter.dateTo) list = list.filter(a => a.appointment_date <= filter.dateTo!);
        if (filter.searchQuery) {
          const q = filter.searchQuery.toLowerCase();
          list = list.filter(a => 
            a.patient?.full_name?.toLowerCase().includes(q) ||
            a.doctor?.full_name?.toLowerCase().includes(q) ||
            a.chief_complaint?.toLowerCase().includes(q)
          );
        }
      }

      return list.sort((a, b) => {
        const dDiff = new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime();
        if (dDiff !== 0) return dDiff;
        return a.start_time.localeCompare(b.start_time);
      });
    },

    async getById(id: string): Promise<Appointment | null> {
      const all = await api.appointments.getAll();
      return all.find(a => a.id === id) || null;
    },

    async getAvailableSlots(doctorId: string, date: string): Promise<TimeSlot[]> {
      const doc = await api.doctors.getById(doctorId);
      if (!doc || !doc.doctor_profile) return [];
      const appts = await api.appointments.getAll({
        doctorId,
        dateFrom: date,
        dateTo: date,
      });
      return generateDoctorTimeSlots(
        doc.doctor_profile.start_time,
        doc.doctor_profile.end_time,
        doc.doctor_profile.slot_duration_minutes || 30,
        appts.map(a => ({ start_time: a.start_time, end_time: a.end_time, status: a.status }))
      );
    },

    /**
     * Anti-Double-Booking Atomic Booking Method
     */
    async bookAppointment(data: {
      patient_id: string;
      doctor_id: string;
      appointment_date: string;
      start_time: string;
      end_time: string;
      chief_complaint?: string;
      hospital_id?: string;
    }): Promise<Appointment> {
      const resolvedHospitalId = data.hospital_id || 'a1000000-0000-0000-0000-000000000001';

      if (isSupabaseConfigured()) {
        const { data: rpcResult, error: rpcErr } = await supabase.rpc('book_appointment_atomic', {
          p_patient_id: data.patient_id,
          p_doctor_id: data.doctor_id,
          p_appointment_date: data.appointment_date,
          p_start_time: data.start_time,
          p_end_time: data.end_time,
          p_chief_complaint: data.chief_complaint || null,
          p_hospital_id: resolvedHospitalId,
        });

        if (rpcErr) throw new Error(rpcErr.message);
        if (!rpcResult.success) {
          throw new Error(rpcResult.error || 'Double booking conflict detected. Please select another slot.');
        }

        const appt = await api.appointments.getById(rpcResult.appointment_id);
        if (!appt) throw new Error('Appointment created but could not be loaded.');
        return appt;
      }

      // Local transactional double-booking prevention check
      const db = getMockDB();
      const slotStart = data.start_time.slice(0, 5);
      const slotEnd = data.end_time.slice(0, 5);

      const conflict = db.appointments.some(a => {
        if (a.doctor_id !== data.doctor_id) return false;
        if (a.appointment_date !== data.appointment_date) return false;
        if (a.status === 'cancelled') return false;

        const aStart = a.start_time.slice(0, 5);
        const aEnd = a.end_time.slice(0, 5);

        // Overlap formula: (StartA < EndB) and (EndA > StartB)
        return (slotStart < aEnd && slotEnd > aStart);
      });

      if (conflict) {
        throw new Error('Double-booking conflict: The selected doctor already has an appointment during this time slot.');
      }

      const newAppt: Appointment = {
        id: `b-${Date.now()}`,
        hospital_id: resolvedHospitalId,
        patient_id: data.patient_id,
        doctor_id: data.doctor_id,
        appointment_date: data.appointment_date,
        start_time: data.start_time,
        end_time: data.end_time,
        status: 'confirmed',
        chief_complaint: data.chief_complaint || null,
        cancellation_reason: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      db.appointments.push(newAppt);

      // Trigger automatic notification for doctor
      const patientName = db.patients.find(p => p.id === data.patient_id)?.full_name || 'Patient';
      db.notifications.push({
        id: `n-${Date.now()}-2`,
        user_id: data.doctor_id,
        title: 'New Consultation Scheduled',
        message: `Patient ${patientName} booked a consultation for ${data.appointment_date} at ${data.start_time.slice(0, 5)}.`,
        type: 'appointment_booked',
        is_read: false,
        link: '/doctor/appointments',
        created_at: new Date().toISOString(),
      });

      saveMockDB(db);
      return (await api.appointments.getById(newAppt.id))!;
    },

    async reschedule(appointmentId: string, newDate: string, newStartTime: string, newEndTime: string): Promise<Appointment> {
      if (isSupabaseConfigured()) {
        const { data: rpcRes, error } = await supabase.rpc('reschedule_appointment_atomic', {
          p_appointment_id: appointmentId,
          p_new_date: newDate,
          p_new_start_time: newStartTime,
          p_new_end_time: newEndTime,
        });
        if (error) throw new Error(error.message);
        if (!rpcRes.success) throw new Error(rpcRes.error || 'Reschedule conflict');
        return (await api.appointments.getById(appointmentId))!;
      }

      const db = getMockDB();
      const apptIdx = db.appointments.findIndex(a => a.id === appointmentId);
      if (apptIdx === -1) throw new Error('Appointment not found');

      const appt = db.appointments[apptIdx];
      const slotStart = newStartTime.slice(0, 5);
      const slotEnd = newEndTime.slice(0, 5);

      const conflict = db.appointments.some(a => {
        if (a.id === appointmentId) return false;
        if (a.doctor_id !== appt.doctor_id) return false;
        if (a.appointment_date !== newDate) return false;
        if (a.status === 'cancelled') return false;

        const aStart = a.start_time.slice(0, 5);
        const aEnd = a.end_time.slice(0, 5);
        return (slotStart < aEnd && slotEnd > aStart);
      });

      if (conflict) {
        throw new Error('Reschedule conflict: Doctor has another appointment during this slot.');
      }

      db.appointments[apptIdx] = {
        ...appt,
        appointment_date: newDate,
        start_time: newStartTime,
        end_time: newEndTime,
        status: 'confirmed',
        updated_at: new Date().toISOString(),
      };

      saveMockDB(db);
      return (await api.appointments.getById(appointmentId))!;
    },

    async cancel(appointmentId: string, reason: string): Promise<Appointment> {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase
          .from('appointments')
          .update({
            status: 'cancelled',
            cancellation_reason: reason,
            updated_at: new Date().toISOString(),
          })
          .eq('id', appointmentId)
          .select()
          .single();
        if (error) throw new Error(error.message);
        return data as Appointment;
      }

      const db = getMockDB();
      const idx = db.appointments.findIndex(a => a.id === appointmentId);
      if (idx === -1) throw new Error('Appointment not found');

      db.appointments[idx] = {
        ...db.appointments[idx],
        status: 'cancelled',
        cancellation_reason: reason,
        updated_at: new Date().toISOString(),
      };

      saveMockDB(db);
      return (await api.appointments.getById(appointmentId))!;
    },

    async updateStatus(appointmentId: string, status: AppointmentStatus): Promise<Appointment> {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase
          .from('appointments')
          .update({ status, updated_at: new Date().toISOString() })
          .eq('id', appointmentId)
          .select()
          .single();
        if (error) throw new Error(error.message);
        return data as Appointment;
      }

      const db = getMockDB();
      const idx = db.appointments.findIndex(a => a.id === appointmentId);
      if (idx === -1) throw new Error('Appointment not found');

      db.appointments[idx] = {
        ...db.appointments[idx],
        status,
        updated_at: new Date().toISOString(),
      };

      saveMockDB(db);
      return (await api.appointments.getById(appointmentId))!;
    }
  },

  // ----------------------------------------------------------------------------
  // 7. Consultations, Medical Records & Prescriptions
  // ----------------------------------------------------------------------------
  medicalRecords: {
    async getAll(filter?: { patientId?: string; doctorId?: string; hospitalId?: string }): Promise<MedicalRecord[]> {
      if (isSupabaseConfigured()) {
        let query = supabase
          .from('medical_records')
          .select('*, patient:patients(*), doctor:profiles!medical_records_doctor_id_fkey(*), prescriptions(*), appointment:appointments(*)');

        if (filter?.hospitalId) query = query.eq('hospital_id', filter.hospitalId);
        if (filter?.patientId) query = query.eq('patient_id', filter.patientId);
        if (filter?.doctorId) query = query.eq('doctor_id', filter.doctorId);

        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw new Error(error.message);
        return (data as MedicalRecord[]) || [];
      }

      const db = getMockDB();
      let list = db.medicalRecords.map(rec => ({
        ...rec,
        patient: db.patients.find(p => p.id === rec.patient_id) || db.profiles.find(p => p.id === rec.patient_id),
        doctor: db.profiles.find(p => p.id === rec.doctor_id),
        prescriptions: db.prescriptions.filter(rx => rx.medical_record_id === rec.id),
        appointment: db.appointments.find(a => a.id === rec.appointment_id),
      }));

      if (filter?.hospitalId) list = list.filter(r => r.hospital_id === filter.hospitalId);
      if (filter?.patientId) list = list.filter(r => r.patient_id === filter.patientId);
      if (filter?.doctorId) list = list.filter(r => r.doctor_id === filter.doctorId);

      return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    },

    async getByAppointmentId(appointmentId: string): Promise<MedicalRecord | null> {
      const records = await api.medicalRecords.getAll();
      return records.find(r => r.appointment_id === appointmentId) || null;
    },

    async completeConsultation(
      appointmentId: string,
      data: ConsultationFormData,
      doctorId: string,
      patientId: string,
      hospitalId?: string
    ): Promise<MedicalRecord> {
      const resolvedHospitalId = hospitalId || 'a1000000-0000-0000-0000-000000000001';

      if (isSupabaseConfigured()) {
        const recordId = crypto.randomUUID();
        const { data: record, error: recErr } = await supabase
          .from('medical_records')
          .upsert({
            id: recordId,
            hospital_id: resolvedHospitalId,
            appointment_id: appointmentId,
            patient_id: patientId,
            doctor_id: doctorId,
            chief_complaint: data.chiefComplaint,
            vital_signs: data.vitalSigns,
            clinical_notes: data.clinicalNotes,
            diagnosis: data.diagnosis,
            treatment_plan: data.treatmentPlan,
            follow_up_date: data.followUpDate || null,
            follow_up_notes: data.followUpNotes || null,
          })
          .select()
          .single();

        if (recErr) throw new Error(recErr.message);

        if (data.prescriptions && data.prescriptions.length > 0) {
          const rxInserts = data.prescriptions.map(rx => ({
            hospital_id: resolvedHospitalId,
            medical_record_id: record.id,
            patient_id: patientId,
            doctor_id: doctorId,
            medication_name: rx.medication_name,
            dosage: rx.dosage,
            frequency: rx.frequency,
            duration: rx.duration,
            instructions: rx.instructions || null,
          }));
          await supabase.from('prescriptions').insert(rxInserts);
        }

        await supabase
          .from('appointments')
          .update({ status: 'completed', updated_at: new Date().toISOString() })
          .eq('id', appointmentId);

        return (await api.medicalRecords.getByAppointmentId(appointmentId))!;
      }

      const db = getMockDB();
      const newRecId = `m-${Date.now()}`;
      const newRecord: MedicalRecord = {
        id: newRecId,
        hospital_id: resolvedHospitalId,
        appointment_id: appointmentId,
        patient_id: patientId,
        doctor_id: doctorId,
        chief_complaint: data.chiefComplaint,
        vital_signs: {
          bp: data.vitalSigns.bp,
          pulse: Number(data.vitalSigns.pulse) || 72,
          temp: Number(data.vitalSigns.temp) || 98.6,
          weight: Number(data.vitalSigns.weight) || 70,
          height: Number(data.vitalSigns.height) || 170,
          spo2: Number(data.vitalSigns.spo2) || 99,
        },
        clinical_notes: data.clinicalNotes,
        diagnosis: data.diagnosis,
        treatment_plan: data.treatmentPlan,
        follow_up_date: data.followUpDate || null,
        follow_up_notes: data.followUpNotes || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const newPrescriptions: Prescription[] = (data.prescriptions || []).map((rx, i) => ({
        id: `rx-${Date.now()}-${i}`,
        hospital_id: resolvedHospitalId,
        medical_record_id: newRecId,
        patient_id: patientId,
        doctor_id: doctorId,
        medication_name: rx.medication_name,
        dosage: rx.dosage,
        frequency: rx.frequency,
        duration: rx.duration,
        instructions: rx.instructions || null,
        created_at: new Date().toISOString(),
      }));

      db.medicalRecords.push(newRecord);
      db.prescriptions.push(...newPrescriptions);

      const apptIdx = db.appointments.findIndex(a => a.id === appointmentId);
      if (apptIdx !== -1) {
        db.appointments[apptIdx].status = 'completed';
        db.appointments[apptIdx].updated_at = new Date().toISOString();
      }

      saveMockDB(db);
      return (await api.medicalRecords.getByAppointmentId(appointmentId))!;
    }
  },

  // ----------------------------------------------------------------------------
  // 8. Prescriptions Direct Access
  // ----------------------------------------------------------------------------
  prescriptions: {
    async getAll(patientId?: string, hospitalId?: string): Promise<Array<Prescription & { doctor?: Profile; record?: MedicalRecord }>> {
      if (isSupabaseConfigured()) {
        let query = supabase
          .from('prescriptions')
          .select('*, doctor:profiles!prescriptions_doctor_id_fkey(*), record:medical_records(*)');
        if (hospitalId) query = query.eq('hospital_id', hospitalId);
        if (patientId) query = query.eq('patient_id', patientId);

        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw new Error(error.message);
        return (data as any[]) || [];
      }

      const db = getMockDB();
      let list = db.prescriptions.map(rx => ({
        ...rx,
        doctor: db.profiles.find(p => p.id === rx.doctor_id),
        record: db.medicalRecords.find(m => m.id === rx.medical_record_id),
      }));

      if (hospitalId) list = list.filter(r => r.hospital_id === hospitalId);
      if (patientId) list = list.filter(r => r.patient_id === patientId);
      return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  },

  // ----------------------------------------------------------------------------
  // 9. In-App Notifications
  // ----------------------------------------------------------------------------
  notifications: {
    async getAll(userId: string): Promise<Notification[]> {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        if (error) throw new Error(error.message);
        return (data as Notification[]) || [];
      }

      const db = getMockDB();
      return db.notifications
        .filter(n => n.user_id === userId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    },

    async markAsRead(notificationId: string): Promise<void> {
      if (isSupabaseConfigured()) {
        await supabase.from('notifications').update({ is_read: true }).eq('id', notificationId);
        return;
      }

      const db = getMockDB();
      const n = db.notifications.find(item => item.id === notificationId);
      if (n) {
        n.is_read = true;
        saveMockDB(db);
      }
    },

    async markAllAsRead(userId: string): Promise<void> {
      if (isSupabaseConfigured()) {
        await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId);
        return;
      }

      const db = getMockDB();
      db.notifications.forEach(n => {
        if (n.user_id === userId) n.is_read = true;
      });
      saveMockDB(db);
    }
  },

  // ----------------------------------------------------------------------------
  // 10. Admin & Supercoordinator Reports & Analytics Engine
  // ----------------------------------------------------------------------------
  reports: {
    async getSummary(hospitalId?: string): Promise<ReportSummary> {
      const appointments = await api.appointments.getAll(hospitalId ? { hospitalId } : undefined);
      const patients = await api.patients.getAll(hospitalId);
      const doctors = await api.doctors.getAll(hospitalId);
      const departments = await api.departments.getAll(hospitalId);

      const totalAppointments = appointments.length;
      const completedAppointments = appointments.filter(a => a.status === 'completed').length;
      const cancelledAppointments = appointments.filter(a => a.status === 'cancelled').length;

      // Department breakdown
      const departmentBreakdown = departments.map(dept => {
        const count = appointments.filter(a => {
          const doc = doctors.find(d => d.id === a.doctor_id);
          return doc?.doctor_profile?.department_id === dept.id;
        }).length;
        return { name: dept.name, code: dept.code, count };
      });

      // Doctor workload
      const doctorWorkload = doctors.map(doc => {
        const docAppts = appointments.filter(a => a.doctor_id === doc.id);
        return {
          doctorName: doc.full_name,
          total: docAppts.length,
          completed: docAppts.filter(a => a.status === 'completed').length,
          cancelled: docAppts.filter(a => a.status === 'cancelled').length,
        };
      });

      // Daily trends (last 7 days)
      const dailyTrends: Array<{ date: string; bookings: number; completed: number }> = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dStr = format(d, 'yyyy-MM-dd');
        const dayAppts = appointments.filter(a => a.appointment_date === dStr);
        dailyTrends.push({
          date: format(d, 'MMM dd'),
          bookings: dayAppts.length,
          completed: dayAppts.filter(a => a.status === 'completed').length,
        });
      }

      // Status distribution
      const statusCounts: Record<string, number> = {};
      appointments.forEach(a => {
        statusCounts[a.status] = (statusCounts[a.status] || 0) + 1;
      });
      const statusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
        status: status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' '),
        count,
      }));

      return {
        totalAppointments,
        completedAppointments,
        cancelledAppointments,
        totalPatients: patients.length,
        totalDoctors: doctors.length,
        departmentBreakdown,
        doctorWorkload,
        dailyTrends,
        statusDistribution,
      };
    }
  },

  // ----------------------------------------------------------------------------
  // 11. Security Audit Logs
  // ----------------------------------------------------------------------------
  auditLogs: {
    async getAll(hospitalId?: string): Promise<AuditLog[]> {
      if (isSupabaseConfigured()) {
        let query = supabase
          .from('audit_logs')
          .select('*, user:profiles(*), hospital:hospitals(*)');

        if (hospitalId) {
          query = query.or(`hospital_id.eq.${hospitalId},hospital_id.is.null`);
        }

        const { data, error } = await query
          .order('created_at', { ascending: false })
          .limit(100);

        if (error) return [];
        return (data as AuditLog[]) || [];
      }

      const db = getMockDB();
      let list = db.auditLogs.map(al => ({
        ...al,
        user: db.profiles.find(p => p.id === al.user_id),
        hospital: al.hospital_id ? db.hospitals.find(h => h.id === al.hospital_id) : undefined,
      }));

      if (hospitalId) {
        list = list.filter(a => !a.hospital_id || a.hospital_id === hospitalId);
      }

      return list;
    },

    async create(log: Omit<AuditLog, 'id' | 'created_at'>): Promise<AuditLog> {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase
          .from('audit_logs')
          .insert(log)
          .select()
          .single();
        if (error) throw new Error(error.message);
        return data as AuditLog;
      }

      const db = getMockDB();
      const newLog: AuditLog = {
        ...log,
        id: `al-${Date.now()}`,
        created_at: new Date().toISOString(),
      };
      db.auditLogs.unshift(newLog);
      saveMockDB(db);
      return newLog;
    }
  },

  // ----------------------------------------------------------------------------
  // 12. User Governance (Admin / Supercoordinator)
  // ----------------------------------------------------------------------------
  users: {
    async getAll(hospitalId?: string): Promise<Profile[]> {
      if (isSupabaseConfigured()) {
        let query = supabase.from('profiles').select('*, hospital:hospitals(*)');
        if (hospitalId) {
          query = query.eq('hospital_id', hospitalId);
        }
        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw new Error(error.message);
        return (data as Profile[]) || [];
      }

      const db = getMockDB();
      if (!hospitalId) return db.profiles;
      return db.profiles.filter(p => p.hospital_id === hospitalId);
    },

    async toggleStatus(userId: string, isActive: boolean): Promise<Profile> {
      return api.auth.updateProfile(userId, { is_active: isActive });
    },

    async updateRole(userId: string, role: UserRole): Promise<Profile> {
      return api.auth.updateProfile(userId, { role });
    },

    async createStaff(data: {
      full_name: string;
      email: string;
      phone: string;
      role: UserRole;
      hospital_id?: string;
      department_id?: string;
      specialization_id?: string;
      license_number?: string;
      consultation_fee?: number;
      room_number?: string;
      available_days?: string[];
      start_time?: string;
      end_time?: string;
      slot_duration_minutes?: number;
    }): Promise<Profile> {
      if (isSupabaseConfigured()) {
        // Call the Edge Function which uses admin API to create auth user + profile
        const { data: result, error } = await supabase.functions.invoke('create-staff-user', {
          body: data,
        });
        if (error) throw new Error(error.message);
        if (!result?.success) throw new Error(result?.error || 'Failed to create staff user');
        return result.user as Profile;
      }

      // Mock mode fallback
      const newId = `u-${Date.now()}`;
      const resolvedHospitalId = data.hospital_id || 'a1000000-0000-0000-0000-000000000001';
      const db = getMockDB();
      const newProfile: Profile = {
        id: newId,
        hospital_id: resolvedHospitalId,
        role: data.role,
        full_name: data.full_name,
        email: data.email,
        phone: data.phone,
        avatar_url: null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (data.role === 'doctor') {
        db.doctorProfiles.push({
          id: newId,
          hospital_id: resolvedHospitalId,
          department_id: data.department_id || null,
          specialization_id: data.specialization_id || null,
          license_number: data.license_number || null,
          consultation_fee: data.consultation_fee || 500,
          bio: null,
          room_number: data.room_number || null,
          available_days: data.available_days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          start_time: data.start_time || '09:00:00',
          end_time: data.end_time || '17:00:00',
          slot_duration_minutes: data.slot_duration_minutes || 30,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      db.profiles.push(newProfile);
      saveMockDB(db);
      return newProfile;
    }
  },

  // ----------------------------------------------------------------------------
  // 13. WhatsApp Operations & In-App Simulator
  // ----------------------------------------------------------------------------
  whatsapp: {
    async getSessions(hospitalId?: string): Promise<WhatsAppSession[]> {
      if (isSupabaseConfigured()) {
        let query = supabase.from('whatsapp_sessions').select('*, patient:patients(*), hospital:hospitals(*)');
        if (hospitalId) query = query.eq('hospital_id', hospitalId);
        const { data, error } = await query.order('last_message_at', { ascending: false });
        if (error) return [];
        return (data as WhatsAppSession[]) || [];
      }

      const db = getMockDB();
      let list = db.whatsappSessions.map(s => ({
        ...s,
        patient: db.patients.find(p => p.id === s.patient_id),
        hospital: db.hospitals.find(h => h.id === s.hospital_id),
      }));

      if (hospitalId) list = list.filter(s => s.hospital_id === hospitalId);
      return list;
    },

    async getMessages(hospitalId?: string): Promise<WhatsAppMessage[]> {
      if (isSupabaseConfigured()) {
        let query = supabase.from('whatsapp_messages').select('*, patient:patients(*), hospital:hospitals(*)');
        if (hospitalId) query = query.eq('hospital_id', hospitalId);
        const { data, error } = await query.order('created_at', { ascending: false }).limit(100);
        if (error) return [];
        return (data as WhatsAppMessage[]) || [];
      }

      const db = getMockDB();
      let list = db.whatsappMessages.map(m => ({
        ...m,
        patient: db.patients.find(p => p.id === m.patient_id),
        hospital: db.hospitals.find(h => h.id === m.hospital_id),
      }));

      if (hospitalId) list = list.filter(m => m.hospital_id === hospitalId);
      return list;
    },

    async logMessage(msg: {
      hospital_id: string;
      patient_id?: string | null;
      session_id?: string | null;
      direction: 'INBOUND' | 'OUTBOUND';
      whatsapp_message_id: string;
      message_type: 'TEXT' | 'BUTTON' | 'LIST' | 'DOCUMENT' | 'IMAGE' | 'TEMPLATE';
      message_status?: string;
      metadata?: any;
    }): Promise<WhatsAppMessage> {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase
          .from('whatsapp_messages')
          .insert(msg)
          .select()
          .single();
        if (error) throw error;
        return data as WhatsAppMessage;
      }

      const db = getMockDB();
      const newMsg: WhatsAppMessage = {
        id: `wm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        hospital_id: msg.hospital_id,
        patient_id: msg.patient_id || null,
        session_id: msg.session_id || null,
        direction: msg.direction,
        whatsapp_message_id: msg.whatsapp_message_id,
        message_type: msg.message_type,
        message_status: msg.message_status || 'received',
        metadata: msg.metadata || {},
        created_at: new Date().toISOString(),
      };
      db.whatsappMessages.unshift(newMsg);
      saveMockDB(db);
      return newMsg;
    },

    /**
     * Deterministic WhatsApp Flow Simulation for Local & Evaluation Testing
     */
    async simulateMessage(
      hospitalId: string,
      fromNumber: string,
      userText: string,
      actionId?: string
    ): Promise<{ replyText: string; buttons?: Array<{ id: string; title: string }>; state: string }> {
      const db = getMockDB();
      const hospital = db.hospitals.find(h => h.id === hospitalId) || db.hospitals[0];
      const formattedNumber = fromNumber.startsWith('+') ? fromNumber : `+${fromNumber}`;
      const rawNumber = fromNumber.replace(/\D/g, '');

      // Identify patient
      let patient = db.patients.find(
        p => p.hospital_id === hospital.id && (p.whatsapp_number === formattedNumber || p.phone_number?.includes(rawNumber))
      );

      // Get or create session
      let session = db.whatsappSessions.find(
        s => s.hospital_id === hospital.id && s.whatsapp_number === formattedNumber
      );

      if (!session) {
        session = {
          id: `ws-${Date.now()}`,
          hospital_id: hospital.id,
          patient_id: patient?.id || null,
          whatsapp_number: formattedNumber,
          state: patient ? 'MAIN_MENU' : 'IDLE',
          state_data: {},
          last_message_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 86400000).toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        db.whatsappSessions.push(session);
      }

      // Log inbound message
      db.whatsappMessages.unshift({
        id: `wm-${Date.now()}-in`,
        hospital_id: hospital.id,
        patient_id: patient?.id || null,
        session_id: session.id,
        direction: 'INBOUND',
        whatsapp_message_id: `sim.in.${Date.now()}.${Math.random().toString(36).slice(2, 7)}`,
        message_type: actionId ? 'BUTTON' : 'TEXT',
        message_status: 'received',
        metadata: { body: userText, actionId },
        created_at: new Date().toISOString(),
      });

      const effectiveAction = (actionId || userText).toLowerCase();
      const isGreeting = ['hi', 'hello', 'hey', 'start', 'menu', 'restart'].includes(effectiveAction);

      let replyText = '';
      let buttons: Array<{ id: string; title: string }> | undefined = undefined;

      // Patient Onboarding if unknown
      if (!patient) {
        if (session.state === 'IDLE' || isGreeting) {
          session.state = 'IDLE';
          session.state_data = { awaiting_name: true };
          replyText = `Welcome to *${hospital.name}* on ClinicFlow.\n\nPlease enter your *full name* to register for consultations:`;
        } else if (session.state_data.awaiting_name && userText.trim().length >= 2) {
          const newPat: Patient = {
            id: `p-${Date.now()}`,
            hospital_id: hospital.id,
            full_name: userText.trim(),
            phone_number: rawNumber,
            whatsapp_number: formattedNumber,
            date_of_birth: '1995-01-01',
            gender: 'male',
            blood_group: 'O+',
            emergency_contact_name: 'Emergency Contact',
            emergency_contact_phone: formattedNumber,
            address: 'Chennai, India',
            allergies: null,
            medical_history_summary: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          db.patients.push(newPat);
          patient = newPat;
          session.patient_id = newPat.id;
          session.state = 'MAIN_MENU';
          session.state_data = {};

          replyText = `Thank you, *${newPat.full_name}*! Your profile has been created at *${hospital.name}*.\n\nHow can we help you today?`;
          buttons = [
            { id: 'btn_book', title: 'Book Appointment' },
            { id: 'btn_my_appts', title: 'My Appointments' },
            { id: 'btn_records', title: 'Prescriptions & Reports' },
          ];
        } else {
          replyText = `Please enter your *full name* to register at ${hospital.name}.`;
        }
      } else if (isGreeting || effectiveAction === 'btn_main_menu') {
        session.state = 'MAIN_MENU';
        session.state_data = {};
        replyText = `Welcome to *${hospital.name}*.\n\nHow can we help you today?`;
        buttons = [
          { id: 'btn_book', title: 'Book Appointment' },
          { id: 'btn_my_appts', title: 'My Appointments' },
          { id: 'btn_records', title: 'Prescriptions & Reports' },
        ];
      } else if (session.state === 'MAIN_MENU') {
        if (effectiveAction === 'btn_book' || effectiveAction.includes('book')) {
          const hospitalDocs = db.profiles.filter(p => p.role === 'doctor' && p.hospital_id === hospital.id && p.is_active);
          if (hospitalDocs.length === 0) {
            replyText = `There are currently no doctors available at ${hospital.name}. Please contact reception.`;
          } else {
            session.state = 'SELECTING_DOCTOR';
            replyText = `👨‍⚕️ *Choose a Doctor at ${hospital.name}:*`;
            buttons = hospitalDocs.slice(0, 3).map(d => ({
              id: `doc_${d.id}`,
              title: `Dr. ${d.full_name.replace(/^Dr\.\s*/i, '').slice(0, 18)}`,
            }));
          }
        } else if (effectiveAction === 'btn_my_appts' || effectiveAction.includes('appointment')) {
          const appts = db.appointments.filter(a => a.hospital_id === hospital.id && a.patient_id === patient?.id && a.status !== 'cancelled');
          if (appts.length === 0) {
            replyText = `You have no upcoming appointments scheduled at *${hospital.name}*.\n\nReply 'Book' to schedule one.`;
          } else {
            replyText = `📅 *Your Appointments at ${hospital.name}:*\n\n` + appts.map((a, i) => {
              const doc = db.profiles.find(p => p.id === a.doctor_id)?.full_name || 'Doctor';
              return `${i + 1}. *${a.appointment_date}* at ${a.start_time.slice(0, 5)}\n   • Doctor: Dr. ${doc}\n   • Status: ${a.status.toUpperCase()}\n   • Ref: CF-${a.id.slice(0, 8).toUpperCase()}`;
            }).join('\n\n');
          }
        } else if (effectiveAction === 'btn_records' || effectiveAction.includes('prescription')) {
          const records = db.medicalRecords.filter(r => r.hospital_id === hospital.id && r.patient_id === patient?.id);
          if (records.length === 0) {
            replyText = `No medical records or prescriptions found for you at *${hospital.name}*.`;
          } else {
            replyText = `📑 *Your Records & Prescriptions at ${hospital.name}:*\n\n` + records.map((r, i) => {
              const doc = db.profiles.find(p => p.id === r.doctor_id)?.full_name || 'Doctor';
              const rxs = db.prescriptions.filter(rx => rx.medical_record_id === r.id);
              return `*Encounter #${i + 1}* (${r.created_at.slice(0, 10)})\n• Physician: Dr. ${doc}\n• Diagnosis: ${r.diagnosis}\n` +
                (rxs.length > 0 ? `• Prescriptions:\n` + rxs.map(rx => `   - ${rx.medication_name} (${rx.dosage})`).join('\n') : '');
            }).join('\n\n');
          }
        }
      } else if (session.state === 'SELECTING_DOCTOR' && effectiveAction.startsWith('doc_')) {
        const docId = effectiveAction.replace('doc_', '');
        const doctor = db.profiles.find(p => p.id === docId && p.hospital_id === hospital.id);
        if (doctor) {
          session.state = 'SELECTING_DATE';
          session.state_data = { doctor_id: doctor.id, doctor_name: doctor.full_name };
          replyText = `Consultation with *Dr. ${doctor.full_name}*\n\nPlease select an appointment date:`;
          const d1 = format(addDays(new Date(), 1), 'yyyy-MM-dd');
          const d2 = format(addDays(new Date(), 2), 'yyyy-MM-dd');
          const d3 = format(addDays(new Date(), 3), 'yyyy-MM-dd');
          buttons = [
            { id: `date_${d1}`, title: format(addDays(new Date(), 1), 'dd MMM (EEE)') },
            { id: `date_${d2}`, title: format(addDays(new Date(), 2), 'dd MMM (EEE)') },
            { id: `date_${d3}`, title: format(addDays(new Date(), 3), 'dd MMM (EEE)') },
          ];
        }
      } else if (session.state === 'SELECTING_DATE' && effectiveAction.startsWith('date_')) {
        const selectedDate = effectiveAction.replace('date_', '');
        session.state = 'SELECTING_SLOT';
        session.state_data.appointment_date = selectedDate;
        replyText = `Available slots for *Dr. ${session.state_data.doctor_name}* on *${selectedDate}*:`;
        buttons = [
          { id: 'slot_09:30:00_10:00:00', title: '09:30 AM' },
          { id: 'slot_10:30:00_11:00:00', title: '10:30 AM' },
          { id: 'slot_11:30:00_12:00:00', title: '11:30 AM' },
        ];
      } else if (session.state === 'SELECTING_SLOT' && effectiveAction.startsWith('slot_')) {
        const parts = effectiveAction.replace('slot_', '').split('_');
        session.state = 'CONFIRMING_APPOINTMENT';
        session.state_data.start_time = parts[0];
        session.state_data.end_time = parts[1];
        replyText = `📋 *Confirm Appointment Details:*\n\n` +
          `• Hospital: ${hospital.name}\n` +
          `• Doctor: Dr. ${session.state_data.doctor_name}\n` +
          `• Date: ${session.state_data.appointment_date}\n` +
          `• Time: ${parts[0].slice(0, 5)} - ${parts[1].slice(0, 5)}\n\nConfirm booking?`;
        buttons = [
          { id: 'btn_confirm', title: 'Confirm' },
          { id: 'btn_cancel', title: 'Cancel' },
        ];
      } else if (session.state === 'CONFIRMING_APPOINTMENT') {
        if (effectiveAction === 'btn_confirm') {
          try {
            const appt = await api.appointments.bookAppointment({
              patient_id: patient!.id,
              doctor_id: session.state_data.doctor_id,
              appointment_date: session.state_data.appointment_date,
              start_time: session.state_data.start_time,
              end_time: session.state_data.end_time,
              chief_complaint: 'WhatsApp Patient Booking',
              hospital_id: hospital.id,
            });
            session.state = 'COMPLETED';
            replyText = `✅ *Appointment Confirmed!*\n\n` +
              `• Hospital: ${hospital.name}\n` +
              `• Doctor: Dr. ${session.state_data.doctor_name}\n` +
              `• Date: ${appt.appointment_date}\n` +
              `• Time: ${appt.start_time.slice(0, 5)}\n` +
              `• Ref ID: *CF-${appt.id.slice(0, 8).toUpperCase()}*\n\nThank you!`;
          } catch (e: any) {
            replyText = `⚠️ Conflict: ${e.message}\n\nPlease choose another slot or reply 'menu'.`;
            session.state = 'MAIN_MENU';
          }
        } else {
          session.state = 'MAIN_MENU';
          replyText = 'Booking cancelled. Returning to main menu.';
          buttons = [
            { id: 'btn_book', title: 'Book Appointment' },
            { id: 'btn_my_appts', title: 'My Appointments' },
          ];
        }
      }

      session.last_message_at = new Date().toISOString();
      session.updated_at = new Date().toISOString();

      // Log outbound reply
      db.whatsappMessages.unshift({
        id: `wm-${Date.now()}-out`,
        hospital_id: hospital.id,
        patient_id: patient?.id || null,
        session_id: session.id,
        direction: 'OUTBOUND',
        whatsapp_message_id: `sim.out.${Date.now()}.${Math.random().toString(36).slice(2, 7)}`,
        message_type: buttons ? 'BUTTON' : 'TEXT',
        message_status: 'sent',
        metadata: { body: replyText, buttons },
        created_at: new Date().toISOString(),
      });

      saveMockDB(db);
      return { replyText, buttons, state: session.state };
    }
  }
};
