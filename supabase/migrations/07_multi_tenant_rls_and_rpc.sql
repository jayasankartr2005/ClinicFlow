-- ==============================================================================
-- ClinicFlow — Migration 07: Multi-Tenant Row Level Security & Enhanced Atomic Booking
-- Zero-Trust Cross-Tenant Isolation + Supercoordinator & Hospital Scoping
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Helper Functions for Role & Tenant Resolution
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

CREATE OR REPLACE FUNCTION public.get_current_user_hospital_id()
RETURNS UUID AS $$
DECLARE
    v_hospital_id UUID;
BEGIN
    SELECT hospital_id INTO v_hospital_id
    FROM public.profiles
    WHERE id = auth.uid();
    
    RETURN v_hospital_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_supercoordinator()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (public.get_current_user_role() = 'supercoordinator');
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

-- Enable RLS on all relevant tables
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 2. Hospitals RLS Policies
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Hospitals read policy" ON public.hospitals;
CREATE POLICY "Hospitals read policy" ON public.hospitals
    FOR SELECT USING (
        public.is_supercoordinator()
        OR id = public.get_current_user_hospital_id()
        OR auth.uid() IS NULL -- Public/unauthenticated webhook lookup by phone_number_id
    );

DROP POLICY IF EXISTS "Hospitals supercoordinator manage" ON public.hospitals;
CREATE POLICY "Hospitals supercoordinator manage" ON public.hospitals
    FOR ALL USING (
        public.is_supercoordinator()
    );

DROP POLICY IF EXISTS "Hospitals admin update own" ON public.hospitals;
CREATE POLICY "Hospitals admin update own" ON public.hospitals
    FOR UPDATE USING (
        public.is_admin() AND id = public.get_current_user_hospital_id()
    );

-- ------------------------------------------------------------------------------
-- 3. Profiles Policies (Hospital Isolated)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Profiles read policy" ON public.profiles;
CREATE POLICY "Profiles read policy" ON public.profiles
    FOR SELECT USING (
        public.is_supercoordinator()
        OR auth.uid() = id
        OR (hospital_id = public.get_current_user_hospital_id() AND (
            public.is_admin()
            OR public.is_receptionist()
            OR (public.is_doctor() AND role = 'doctor')
        ))
        OR (role = 'doctor' AND is_active = true) -- Allow looking up active doctors for appointment booking
    );

DROP POLICY IF EXISTS "Profiles update policy" ON public.profiles;
CREATE POLICY "Profiles update policy" ON public.profiles
    FOR UPDATE USING (
        public.is_supercoordinator()
        OR auth.uid() = id
        OR (public.is_admin() AND hospital_id = public.get_current_user_hospital_id())
    );

DROP POLICY IF EXISTS "Profiles insert policy" ON public.profiles;
CREATE POLICY "Profiles insert policy" ON public.profiles
    FOR INSERT WITH CHECK (
        public.is_supercoordinator()
        OR auth.uid() = id
        OR (public.is_admin() AND hospital_id = public.get_current_user_hospital_id())
    );

-- ------------------------------------------------------------------------------
-- 4. Departments & Specializations Policies (Hospital Isolated)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Departments read policy" ON public.departments;
CREATE POLICY "Departments read policy" ON public.departments
    FOR SELECT USING (
        public.is_supercoordinator()
        OR hospital_id = public.get_current_user_hospital_id()
        OR hospital_id IS NULL
    );

DROP POLICY IF EXISTS "Departments admin modify" ON public.departments;
CREATE POLICY "Departments admin modify" ON public.departments
    FOR ALL USING (
        public.is_supercoordinator()
        OR (public.is_admin() AND hospital_id = public.get_current_user_hospital_id())
    );

-- ------------------------------------------------------------------------------
-- 5. Standalone Patients Policies (Hospital Isolated)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Patients read policy" ON public.patients;
CREATE POLICY "Patients read policy" ON public.patients
    FOR SELECT USING (
        public.is_supercoordinator()
        OR (hospital_id = public.get_current_user_hospital_id() AND (
            public.is_admin()
            OR public.is_receptionist()
            OR (public.is_doctor() AND id IN (
                SELECT patient_id FROM public.appointments 
                WHERE doctor_id = auth.uid() AND hospital_id = public.get_current_user_hospital_id()
            ))
        ))
    );

DROP POLICY IF EXISTS "Patients modify policy" ON public.patients;
CREATE POLICY "Patients modify policy" ON public.patients
    FOR ALL USING (
        public.is_supercoordinator()
        OR (hospital_id = public.get_current_user_hospital_id() AND (
            public.is_admin()
            OR public.is_receptionist()
        ))
    );

-- ------------------------------------------------------------------------------
-- 6. Appointments Policies (Hospital Isolated)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Appointments read policy" ON public.appointments;
CREATE POLICY "Appointments read policy" ON public.appointments
    FOR SELECT USING (
        public.is_supercoordinator()
        OR (hospital_id = public.get_current_user_hospital_id() AND (
            public.is_admin()
            OR public.is_receptionist()
            OR (public.is_doctor() AND doctor_id = auth.uid())
        ))
    );

DROP POLICY IF EXISTS "Appointments insert policy" ON public.appointments;
CREATE POLICY "Appointments insert policy" ON public.appointments
    FOR INSERT WITH CHECK (
        public.is_supercoordinator()
        OR (hospital_id = public.get_current_user_hospital_id() AND (
            public.is_admin()
            OR public.is_receptionist()
        ))
    );

DROP POLICY IF EXISTS "Appointments update policy" ON public.appointments;
CREATE POLICY "Appointments update policy" ON public.appointments
    FOR UPDATE USING (
        public.is_supercoordinator()
        OR (hospital_id = public.get_current_user_hospital_id() AND (
            public.is_admin()
            OR public.is_receptionist()
            OR (public.is_doctor() AND doctor_id = auth.uid())
        ))
    );

DROP POLICY IF EXISTS "Appointments delete policy" ON public.appointments;
CREATE POLICY "Appointments delete policy" ON public.appointments
    FOR DELETE USING (
        public.is_supercoordinator()
        OR (public.is_admin() AND hospital_id = public.get_current_user_hospital_id())
    );

-- ------------------------------------------------------------------------------
-- 7. Medical Records & Prescriptions (Hospital Isolated & Strict Clinical Boundary)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Medical records read policy" ON public.medical_records;
CREATE POLICY "Medical records read policy" ON public.medical_records
    FOR SELECT USING (
        public.is_supercoordinator()
        OR (hospital_id = public.get_current_user_hospital_id() AND (
            public.is_admin()
            OR (public.is_doctor() AND doctor_id = auth.uid())
        ))
    );

DROP POLICY IF EXISTS "Medical records doctor modify policy" ON public.medical_records;
CREATE POLICY "Medical records doctor modify policy" ON public.medical_records
    FOR ALL USING (
        public.is_supercoordinator()
        OR (hospital_id = public.get_current_user_hospital_id() AND (
            (public.is_doctor() AND doctor_id = auth.uid())
            OR public.is_admin()
        ))
    );

DROP POLICY IF EXISTS "Prescriptions read policy" ON public.prescriptions;
CREATE POLICY "Prescriptions read policy" ON public.prescriptions
    FOR SELECT USING (
        public.is_supercoordinator()
        OR (hospital_id = public.get_current_user_hospital_id() AND (
            public.is_admin()
            OR (public.is_doctor() AND doctor_id = auth.uid())
        ))
    );

DROP POLICY IF EXISTS "Prescriptions doctor modify policy" ON public.prescriptions;
CREATE POLICY "Prescriptions doctor modify policy" ON public.prescriptions
    FOR ALL USING (
        public.is_supercoordinator()
        OR (hospital_id = public.get_current_user_hospital_id() AND (
            (public.is_doctor() AND doctor_id = auth.uid())
            OR public.is_admin()
        ))
    );

-- ------------------------------------------------------------------------------
-- 8. WhatsApp Sessions & Messages Policies
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "WhatsApp sessions read policy" ON public.whatsapp_sessions;
CREATE POLICY "WhatsApp sessions read policy" ON public.whatsapp_sessions
    FOR SELECT USING (
        public.is_supercoordinator()
        OR (hospital_id = public.get_current_user_hospital_id() AND (
            public.is_admin() OR public.is_receptionist()
        ))
    );

DROP POLICY IF EXISTS "WhatsApp messages read policy" ON public.whatsapp_messages;
CREATE POLICY "WhatsApp messages read policy" ON public.whatsapp_messages
    FOR SELECT USING (
        public.is_supercoordinator()
        OR (hospital_id = public.get_current_user_hospital_id() AND public.is_admin())
    );

-- ------------------------------------------------------------------------------
-- 9. Audit Logs Policies (Supercoordinator & Hospital Admin)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Audit logs read policy" ON public.audit_logs;
CREATE POLICY "Audit logs read policy" ON public.audit_logs
    FOR SELECT USING (
        public.is_supercoordinator()
        OR (hospital_id = public.get_current_user_hospital_id() AND public.is_admin())
    );

-- ------------------------------------------------------------------------------
-- 10. Multi-Tenant Atomic Slot Booking RPC Function
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.book_appointment_atomic(
    p_patient_id UUID,
    p_doctor_id UUID,
    p_appointment_date DATE,
    p_start_time TIME,
    p_end_time TIME,
    p_chief_complaint TEXT DEFAULT NULL,
    p_hospital_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_appointment_id UUID;
    v_hospital_id UUID;
    v_result JSONB;
    v_doctor_exists BOOLEAN;
    v_patient_exists BOOLEAN;
    v_conflict_count INT;
BEGIN
    -- Prevent past date booking
    IF p_appointment_date < CURRENT_DATE THEN
        RAISE EXCEPTION 'Cannot book an appointment for a past date.';
    END IF;

    -- Resolve hospital ID if not supplied
    IF p_hospital_id IS NOT NULL THEN
        v_hospital_id := p_hospital_id;
    ELSE
        SELECT hospital_id INTO v_hospital_id FROM public.profiles WHERE id = p_doctor_id;
    END IF;

    IF v_hospital_id IS NULL THEN
        RAISE EXCEPTION 'Hospital association not found for the requested booking.';
    END IF;

    -- Verify doctor exists and belongs to the hospital
    SELECT EXISTS (
        SELECT 1 FROM public.profiles p
        JOIN public.doctor_profiles dp ON dp.id = p.id
        WHERE p.id = p_doctor_id 
          AND p.is_active = true
          AND p.hospital_id = v_hospital_id
    ) INTO v_doctor_exists;

    IF NOT v_doctor_exists THEN
        RAISE EXCEPTION 'Doctor not found, inactive, or does not belong to this hospital.';
    END IF;

    -- Verify patient exists and belongs to the hospital
    SELECT EXISTS (
        SELECT 1 FROM public.patients 
        WHERE id = p_patient_id AND hospital_id = v_hospital_id
    ) INTO v_patient_exists;

    IF NOT v_patient_exists THEN
        RAISE EXCEPTION 'Patient not found or does not belong to this hospital.';
    END IF;

    -- Transactional concurrency check (Anti-Double-Booking)
    SELECT COUNT(*) INTO v_conflict_count
    FROM public.appointments
    WHERE doctor_id = p_doctor_id
      AND appointment_date = p_appointment_date
      AND status NOT IN ('cancelled')
      AND (start_time < p_end_time AND end_time > p_start_time);

    IF v_conflict_count > 0 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Sorry, this slot was just booked by another patient. Please choose another slot.',
            'code', 'SLOT_UNAVAILABLE'
        )::jsonb;
    END IF;

    -- Insert appointment atomically
    INSERT INTO public.appointments (
        hospital_id,
        patient_id,
        doctor_id,
        appointment_date,
        start_time,
        end_time,
        status,
        chief_complaint
    ) VALUES (
        v_hospital_id,
        p_patient_id,
        p_doctor_id,
        p_appointment_date,
        p_start_time,
        p_end_time,
        'confirmed',
        p_chief_complaint
    )
    RETURNING id INTO v_appointment_id;

    -- Return structured success
    SELECT json_build_object(
        'success', true,
        'appointment_id', v_appointment_id,
        'hospital_id', v_hospital_id,
        'message', 'Appointment booked successfully.'
    )::jsonb INTO v_result;

    RETURN v_result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM,
            'code', SQLSTATE
        )::jsonb;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
