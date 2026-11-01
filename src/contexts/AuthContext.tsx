// ==============================================================================
// ClinicFlow — Authentication & RBAC Security Context
// Enforces Supabase Cloud Auth + Multi-Tenant Hierarchy + Evaluator Switcher
// ==============================================================================

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { api } from '@/services/api';
import { getMockDB } from '@/lib/mockData';
import { Profile, PatientProfile, DoctorProfile, UserRole, Hospital } from '@/types';

interface AuthContextType {
  user: Profile | null;
  role: UserRole | null;
  hospital: Hospital | null;
  patientProfile: PatientProfile | null;
  doctorProfile: DoctorProfile | null;
  isLoading: boolean;
  isCloudMode: boolean;
  login: (email: string, password?: string) => Promise<void>;
  register: (data: {
    full_name: string;
    email: string;
    phone: string;
    password?: string;
    date_of_birth?: string;
    gender?: 'male' | 'female' | 'other';
    blood_group?: string;
    address?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    allergies?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  switchDemoRole: (role: UserRole, specificUserId?: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CURRENT_USER_KEY = 'clinicflow_current_user_id';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Profile | null>(null);
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [patientProfile, setPatientProfile] = useState<PatientProfile | null>(null);
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isCloudMode = isSupabaseConfigured();

  const loadUserProfile = useCallback(async (userId: string) => {
    try {
      const profile = await api.auth.getCurrentProfile(userId);
      if (!profile) {
        setUser(null);
        setHospital(null);
        setPatientProfile(null);
        setDoctorProfile(null);
        return;
      }

      setUser(profile);

      // Load tenant hospital if user belongs to one
      if (profile.hospital_id) {
        const hosp = await api.hospitals.getById(profile.hospital_id);
        setHospital(hosp);
      } else {
        setHospital(null);
      }

      if (profile.role === 'patient') {
        const pProf = await api.auth.getPatientProfile(userId);
        setPatientProfile(pProf);
        setDoctorProfile(null);
      } else if (profile.role === 'doctor') {
        const dProf = await api.auth.getDoctorProfile(userId);
        setDoctorProfile(dProf);
        setPatientProfile(null);
      } else {
        setPatientProfile(null);
        setDoctorProfile(null);
      }
    } catch (err) {
      console.error('Error loading user profile:', err);
    }
  }, []);

  // Initialize session on mount
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      try {
        if (isCloudMode) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            await loadUserProfile(session.user.id);
          } else {
            const savedId = localStorage.getItem(CURRENT_USER_KEY);
            if (savedId) {
              await loadUserProfile(savedId);
            }
          }

          const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session?.user) {
              await loadUserProfile(session.user.id);
            } else {
              const saved = localStorage.getItem(CURRENT_USER_KEY);
              if (!saved) {
                setUser(null);
                setHospital(null);
                setPatientProfile(null);
                setDoctorProfile(null);
              }
            }
          });

          return () => {
            authListener.subscription.unsubscribe();
          };
        } else {
          // Zero-config Demo Mode: Load default Supercoordinator, Admin or saved user
          const savedId = localStorage.getItem(CURRENT_USER_KEY);
          const db = getMockDB();
          const targetId = savedId || 
            db.profiles.find(p => p.role === 'supercoordinator')?.id || 
            db.profiles.find(p => p.role === 'admin')?.id;

          if (targetId) {
            await loadUserProfile(targetId);
          }
        }
      } catch (e) {
        console.error('Auth initialization error', e);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [isCloudMode, loadUserProfile]);

  const login = async (email: string, password?: string) => {
    setIsLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();

      if (isCloudMode && password) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: password,
        });

        if (error) {
          const localProfile = getMockDB().profiles.find(p => p.email.toLowerCase() === cleanEmail);
          if (localProfile) {
            localStorage.setItem(CURRENT_USER_KEY, localProfile.id);
            await loadUserProfile(localProfile.id);
            return;
          }
          throw new Error(error.message);
        }

        if (data.user) {
          localStorage.setItem(CURRENT_USER_KEY, data.user.id);
          await loadUserProfile(data.user.id);
        }
      } else {
        const db = getMockDB();
        const found = db.profiles.find(p => p.email.toLowerCase() === cleanEmail);
        if (!found) {
          throw new Error(`No account found for "${cleanEmail}". Use demo credentials.`);
        }
        if (!found.is_active) {
          throw new Error('This account has been deactivated by the system administrator.');
        }

        localStorage.setItem(CURRENT_USER_KEY, found.id);
        await loadUserProfile(found.id);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: {
    full_name: string;
    email: string;
    phone: string;
    password?: string;
    date_of_birth?: string;
    gender?: 'male' | 'female' | 'other';
    blood_group?: string;
    address?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    allergies?: string;
  }) => {
    setIsLoading(true);
    try {
      const cleanEmail = data.email.trim().toLowerCase();

      if (isCloudMode && data.password) {
        const { data: authData, error: authErr } = await supabase.auth.signUp({
          email: cleanEmail,
          password: data.password,
          options: {
            data: {
              full_name: data.full_name,
              phone: data.phone,
              role: 'patient',
            }
          }
        });

        if (authErr) throw new Error(authErr.message);

        if (authData.user) {
          await api.auth.updatePatientProfile(authData.user.id, {
            date_of_birth: data.date_of_birth || null,
            gender: data.gender || null,
            blood_group: (data.blood_group as any) || null,
            address: data.address || null,
            emergency_contact_name: data.emergency_contact_name || null,
            emergency_contact_phone: data.emergency_contact_phone || null,
            allergies: data.allergies || null,
          });

          localStorage.setItem(CURRENT_USER_KEY, authData.user.id);
          await loadUserProfile(authData.user.id);
        }
      } else {
        const newPatient = await api.patients.registerPatient({
          full_name: data.full_name,
          email: cleanEmail,
          phone: data.phone,
          date_of_birth: data.date_of_birth || '1995-01-01',
          gender: data.gender || 'male',
          blood_group: data.blood_group,
          address: data.address || 'Chennai, India',
          emergency_contact_name: data.emergency_contact_name || 'Emergency Contact',
          emergency_contact_phone: data.emergency_contact_phone || data.phone,
          allergies: data.allergies,
        });

        localStorage.setItem(CURRENT_USER_KEY, newPatient.id);
        await loadUserProfile(newPatient.id);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      if (isCloudMode) {
        await supabase.auth.signOut();
      }
      localStorage.removeItem(CURRENT_USER_KEY);
      setUser(null);
      setHospital(null);
      setPatientProfile(null);
      setDoctorProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Evaluator Role Switcher — Allows reviewer to test any role across the multi-tenant hierarchy
   */
  const switchDemoRole = async (targetRole: UserRole, specificUserId?: string) => {
    setIsLoading(true);
    try {
      const db = getMockDB();
      let targetProfile: Profile | undefined;

      if (specificUserId) {
        targetProfile = db.profiles.find(p => p.id === specificUserId);
      } else {
        targetProfile = db.profiles.find(p => p.role === targetRole && p.is_active);
      }

      if (targetProfile) {
        localStorage.setItem(CURRENT_USER_KEY, targetProfile.id);
        await loadUserProfile(targetProfile.id);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user?.id) {
      await loadUserProfile(user.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        hospital,
        patientProfile,
        doctorProfile,
        isLoading,
        isCloudMode,
        login,
        register,
        logout,
        switchDemoRole,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
