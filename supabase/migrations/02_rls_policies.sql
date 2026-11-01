-- ==============================================================================
-- ClinicFlow — Migration 02: PostgreSQL Row Level Security (RLS) Policies
-- Enforces Zero-Trust Database-Layer Access Control across 4 Roles
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- Helper Functions for Role Resolution (Security Definer avoids recursion)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role AS $$
DECLARE
    v_role user_role;
BEGIN
    SELECT role INTO v_role
    FROM public.profiles
    WHERE id = auth.uid();
    
    RETURN COALESCE(v_role, 'patient'::user_role);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (public.get_current_user_role() = 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_doctor()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (public.get_current_user_role() = 'doctor');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_receptionist()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (public.get_current_user_role() = 'receptionist');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.specializations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 1. Profiles Policies
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Profiles read policy" ON public.profiles;
CREATE POLICY "Profiles read policy" ON public.profiles
    FOR SELECT USING (
        auth.uid() = id
        OR public.is_admin()
        OR public.is_receptionist()
        OR (public.is_doctor() AND (
            -- Doctor can view profile of any patient with whom they have an appointment
            id IN (SELECT patient_id FROM public.appointments WHERE doctor_id = auth.uid())
            OR role = 'doctor' -- Doctors can view other doctor profiles
        ))
        OR role = 'doctor' -- Anyone can view doctor profiles to book
    );

DROP POLICY IF EXISTS "Profiles update policy" ON public.profiles;
CREATE POLICY "Profiles update policy" ON public.profiles
    FOR UPDATE USING (
        auth.uid() = id
        OR public.is_admin()
    );

DROP POLICY IF EXISTS "Profiles insert policy" ON public.profiles;
CREATE POLICY "Profiles insert policy" ON public.profiles
    FOR INSERT WITH CHECK (
        auth.uid() = id
        OR public.is_admin()
    );

-- ------------------------------------------------------------------------------
-- 2. Departments & Specializations Policies
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Departments read policy" ON public.departments;
CREATE POLICY "Departments read policy" ON public.departments
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Departments admin modify" ON public.departments;
CREATE POLICY "Departments admin modify" ON public.departments
    FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Specializations read policy" ON public.specializations;
CREATE POLICY "Specializations read policy" ON public.specializations
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Specializations admin modify" ON public.specializations;
CREATE POLICY "Specializations admin modify" ON public.specializations
    FOR ALL USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 3. Doctor Profiles Policies
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Doctor profiles read policy" ON public.doctor_profiles;
CREATE POLICY "Doctor profiles read policy" ON public.doctor_profiles
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Doctor profiles update policy" ON public.doctor_profiles;
CREATE POLICY "Doctor profiles update policy" ON public.doctor_profiles
    FOR UPDATE USING (
        auth.uid() = id
        OR public.is_admin()
    );

DROP POLICY IF EXISTS "Doctor profiles insert policy" ON public.doctor_profiles;
CREATE POLICY "Doctor profiles insert policy" ON public.doctor_profiles
    FOR INSERT WITH CHECK (
        auth.uid() = id
        OR public.is_admin()
    );

-- ------------------------------------------------------------------------------
-- 4. Patient Profiles Policies
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Patient profiles read policy" ON public.patient_profiles;
CREATE POLICY "Patient profiles read policy" ON public.patient_profiles
    FOR SELECT USING (
        auth.uid() = id
        OR public.is_admin()
        OR public.is_receptionist()
        OR (public.is_doctor() AND id IN (
            SELECT patient_id FROM public.appointments WHERE doctor_id = auth.uid()
        ))
    );

DROP POLICY IF EXISTS "Patient profiles modify policy" ON public.patient_profiles;
CREATE POLICY "Patient profiles modify policy" ON public.patient_profiles
    FOR ALL USING (
        auth.uid() = id
        OR public.is_admin()
        OR public.is_receptionist()
    );

-- ------------------------------------------------------------------------------
-- 5. Appointments Policies
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Appointments read policy" ON public.appointments;
CREATE POLICY "Appointments read policy" ON public.appointments
    FOR SELECT USING (
        patient_id = auth.uid()
        OR doctor_id = auth.uid()
        OR public.is_receptionist()
        OR public.is_admin()
    );

DROP POLICY IF EXISTS "Appointments insert policy" ON public.appointments;
CREATE POLICY "Appointments insert policy" ON public.appointments
    FOR INSERT WITH CHECK (
        patient_id = auth.uid()
        OR public.is_receptionist()
        OR public.is_admin()
    );

DROP POLICY IF EXISTS "Appointments update policy" ON public.appointments;
CREATE POLICY "Appointments update policy" ON public.appointments
    FOR UPDATE USING (
        patient_id = auth.uid()
        OR doctor_id = auth.uid()
        OR public.is_receptionist()
        OR public.is_admin()
    );

DROP POLICY IF EXISTS "Appointments delete policy" ON public.appointments;
CREATE POLICY "Appointments delete policy" ON public.appointments
    FOR DELETE USING (
        public.is_admin()
    );

-- ------------------------------------------------------------------------------
-- 6. Medical Records Policies (STRICT: Receptionists CANNOT access)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Medical records read policy" ON public.medical_records;
CREATE POLICY "Medical records read policy" ON public.medical_records
    FOR SELECT USING (
        patient_id = auth.uid()
        OR doctor_id = auth.uid()
        OR public.is_admin()
    );

DROP POLICY IF EXISTS "Medical records doctor insert policy" ON public.medical_records;
CREATE POLICY "Medical records doctor insert policy" ON public.medical_records
    FOR INSERT WITH CHECK (
        doctor_id = auth.uid()
        OR public.is_admin()
    );

DROP POLICY IF EXISTS "Medical records doctor update policy" ON public.medical_records;
CREATE POLICY "Medical records doctor update policy" ON public.medical_records
    FOR UPDATE USING (
        doctor_id = auth.uid()
        OR public.is_admin()
    );

-- ------------------------------------------------------------------------------
-- 7. Prescriptions Policies (STRICT: Receptionists CANNOT access)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Prescriptions read policy" ON public.prescriptions;
CREATE POLICY "Prescriptions read policy" ON public.prescriptions
    FOR SELECT USING (
        patient_id = auth.uid()
        OR doctor_id = auth.uid()
        OR public.is_admin()
    );

DROP POLICY IF EXISTS "Prescriptions doctor insert policy" ON public.prescriptions;
CREATE POLICY "Prescriptions doctor insert policy" ON public.prescriptions
    FOR INSERT WITH CHECK (
        doctor_id = auth.uid()
        OR public.is_admin()
    );

DROP POLICY IF EXISTS "Prescriptions doctor update policy" ON public.prescriptions;
CREATE POLICY "Prescriptions doctor update policy" ON public.prescriptions
    FOR UPDATE USING (
        doctor_id = auth.uid()
        OR public.is_admin()
    );

-- ------------------------------------------------------------------------------
-- 8. Notifications Policies
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Notifications user read policy" ON public.notifications;
CREATE POLICY "Notifications user read policy" ON public.notifications
    FOR SELECT USING (
        user_id = auth.uid()
        OR public.is_admin()
    );

DROP POLICY IF EXISTS "Notifications user update policy" ON public.notifications;
CREATE POLICY "Notifications user update policy" ON public.notifications
    FOR UPDATE USING (
        user_id = auth.uid()
        OR public.is_admin()
    );

DROP POLICY IF EXISTS "Notifications insert policy" ON public.notifications;
CREATE POLICY "Notifications insert policy" ON public.notifications
    FOR INSERT WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 9. Audit Logs Policies (Admin Only)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Audit logs read policy" ON public.audit_logs;
CREATE POLICY "Audit logs read policy" ON public.audit_logs
    FOR SELECT USING (
        public.is_admin()
    );

DROP POLICY IF EXISTS "Audit logs insert policy" ON public.audit_logs;
CREATE POLICY "Audit logs insert policy" ON public.audit_logs
    FOR INSERT WITH CHECK (true);
