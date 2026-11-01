
-- ==============================================================================
-- ClinicFlow — Migration 05: Multi-Tenant Healthcare Hierarchy
-- Introduces Hospitals, Supercoordinator, and Standalone Hospital-Owned Patients
-- ==============================================================================

-- ==============================================================================
-- 1. EXTEND USER ROLE
-- ==============================================================================

DO $$
BEGIN
    ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'supercoordinator';
EXCEPTION
    WHEN duplicate_object THEN
        NULL;
END $$;


-- ==============================================================================
-- 2. CREATE HOSPITALS TABLE
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.hospitals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name TEXT NOT NULL,

    slug TEXT NOT NULL UNIQUE,

    email TEXT,

    phone TEXT,

    address TEXT,

    whatsapp_phone_number_id TEXT,

    whatsapp_business_account_id TEXT,

    whatsapp_enabled BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hospitals_slug
    ON public.hospitals(slug);

CREATE INDEX IF NOT EXISTS idx_hospitals_whatsapp_phone_id
    ON public.hospitals(whatsapp_phone_number_id);


-- ==============================================================================
-- 3. HOSPITAL updated_at TRIGGER
-- ==============================================================================

DROP TRIGGER IF EXISTS set_hospitals_updated_at
ON public.hospitals;

CREATE TRIGGER set_hospitals_updated_at
    BEFORE UPDATE ON public.hospitals
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();


-- ==============================================================================
-- 4. ADD hospital_id TO PROFILES
-- Supercoordinator can have NULL hospital_id.
-- Hospital users must eventually have a hospital_id.
-- ==============================================================================

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS hospital_id UUID
    REFERENCES public.hospitals(id)
    ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_hospital
    ON public.profiles(hospital_id);


-- ==============================================================================
-- 5. ADD hospital_id TO DEPARTMENTS
-- ==============================================================================

ALTER TABLE public.departments
    ADD COLUMN IF NOT EXISTS hospital_id UUID
    REFERENCES public.hospitals(id)
    ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_departments_hospital
    ON public.departments(hospital_id);


-- ==============================================================================
-- 6. CREATE STANDALONE PATIENTS TABLE
-- Patients are NOT authenticated users.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    hospital_id UUID NOT NULL
        REFERENCES public.hospitals(id)
        ON DELETE CASCADE,

    full_name TEXT NOT NULL,

    phone_number TEXT,

    whatsapp_number TEXT NOT NULL,

    date_of_birth DATE,

    gender public.gender_type,

    blood_group public.blood_group_type,

    emergency_contact_name TEXT,

    emergency_contact_phone TEXT,

    address TEXT,

    allergies TEXT,

    medical_history_summary TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_hospital_patient_whatsapp
        UNIQUE (hospital_id, whatsapp_number)
);

CREATE INDEX IF NOT EXISTS idx_patients_hospital
    ON public.patients(hospital_id);

CREATE INDEX IF NOT EXISTS idx_patients_whatsapp
    ON public.patients(whatsapp_number);


-- ==============================================================================
-- 7. PATIENT updated_at TRIGGER
-- ==============================================================================

DROP TRIGGER IF EXISTS set_patients_updated_at
ON public.patients;

CREATE TRIGGER set_patients_updated_at
    BEFORE UPDATE ON public.patients
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();


-- ==============================================================================
-- 8. ADD hospital_id TO EXISTING CLINICAL TABLES
-- ==============================================================================

ALTER TABLE public.appointments
    ADD COLUMN IF NOT EXISTS hospital_id UUID
    REFERENCES public.hospitals(id)
    ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_appointments_hospital
    ON public.appointments(hospital_id);


ALTER TABLE public.medical_records
    ADD COLUMN IF NOT EXISTS hospital_id UUID

