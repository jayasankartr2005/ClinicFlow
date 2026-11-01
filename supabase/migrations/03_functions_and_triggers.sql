-- ==============================================================================
-- ClinicFlow — Migration 03: PostgreSQL Functions, Triggers & Automation
-- Automates Auth Profile Sync, Audit Logging, and In-App Notifications
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Automatic Profile Initialization from Supabase Auth
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_role user_role := 'patient';
    v_full_name TEXT;
BEGIN
    -- Extract role from user_metadata if present, default to 'patient'
    IF NEW.raw_user_meta_data->>'role' IS NOT NULL THEN
        v_role := (NEW.raw_user_meta_data->>'role')::user_role;
    END IF;

    -- Extract full name
    v_full_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        split_part(NEW.email, '@', 1)
    );

    -- Insert into public.profiles
    INSERT INTO public.profiles (id, role, full_name, email, phone, avatar_url, is_active)
    VALUES (
        NEW.id,
        v_role,
        v_full_name,
        NEW.email,
        NEW.raw_user_meta_data->>'phone',
        NEW.raw_user_meta_data->>'avatar_url',
        true
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email;

    -- If patient, initialize patient profile
    IF v_role = 'patient' THEN
        INSERT INTO public.patient_profiles (id)
        VALUES (NEW.id)
        ON CONFLICT (id) DO NOTHING;
    END IF;

    -- If doctor, initialize doctor profile
    IF v_role = 'doctor' THEN
        INSERT INTO public.doctor_profiles (id)
        VALUES (NEW.id)
        ON CONFLICT (id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 2. Timestamp update helper
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_appointments_updated_at ON public.appointments;
CREATE TRIGGER set_appointments_updated_at
    BEFORE UPDATE ON public.appointments
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_medical_records_updated_at ON public.medical_records;
CREATE TRIGGER set_medical_records_updated_at
    BEFORE UPDATE ON public.medical_records
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ------------------------------------------------------------------------------
-- 3. Automated In-App Notifications Generator for Appointments
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_appointment_events()
RETURNS TRIGGER AS $$
DECLARE
    v_doctor_name TEXT;
    v_patient_name TEXT;
BEGIN
    SELECT full_name INTO v_doctor_name FROM public.profiles WHERE id = NEW.doctor_id;
    SELECT full_name INTO v_patient_name FROM public.profiles WHERE id = NEW.patient_id;

    IF (TG_OP = 'INSERT') THEN
        -- Notify Patient
        INSERT INTO public.notifications (user_id, title, message, type, link)
        VALUES (
            NEW.patient_id,
            'Appointment Booked',
            format('Your appointment with Dr. %s is scheduled for %s at %s.', v_doctor_name, NEW.appointment_date, NEW.start_time),
            'appointment_booked',
            '/patient/appointments'
        );

        -- Notify Doctor
        INSERT INTO public.notifications (user_id, title, message, type, link)
        VALUES (
            NEW.doctor_id,
            'New Appointment Scheduled',
            format('Patient %s has booked a consultation on %s at %s.', v_patient_name, NEW.appointment_date, NEW.start_time),
            'appointment_booked',
            '/doctor/appointments'
        );
    ELSIF (TG_OP = 'UPDATE') THEN
        -- Status change notifications
        IF (OLD.status <> NEW.status) THEN
            IF (NEW.status = 'confirmed') THEN
                INSERT INTO public.notifications (user_id, title, message, type, link)
                VALUES (
                    NEW.patient_id,
                    'Appointment Confirmed',
                    format('Dr. %s has confirmed your appointment on %s at %s.', v_doctor_name, NEW.appointment_date, NEW.start_time),
                    'appointment_confirmed',
                    '/patient/appointments'
                );
            ELSIF (NEW.status = 'cancelled') THEN
                INSERT INTO public.notifications (user_id, title, message, type, link)
                VALUES (
                    NEW.patient_id,
                    'Appointment Cancelled',
                    format('Your appointment with Dr. %s on %s has been cancelled. %s', v_doctor_name, NEW.appointment_date, COALESCE('Reason: ' || NEW.cancellation_reason, '')),
                    'appointment_cancelled',
                    '/patient/appointments'
                );
                INSERT INTO public.notifications (user_id, title, message, type, link)
                VALUES (
                    NEW.doctor_id,
                    'Appointment Cancelled',
                    format('Appointment with %s on %s has been cancelled.', v_patient_name, NEW.appointment_date),
                    'appointment_cancelled',
                    '/doctor/appointments'
                );
            END IF;
        END IF;

        -- Rescheduling notification
        IF (OLD.appointment_date <> NEW.appointment_date OR OLD.start_time <> NEW.start_time) THEN
            INSERT INTO public.notifications (user_id, title, message, type, link)
            VALUES (
                NEW.patient_id,
                'Appointment Rescheduled',
                format('Your appointment with Dr. %s was rescheduled to %s at %s.', v_doctor_name, NEW.appointment_date, NEW.start_time),
                'appointment_rescheduled',
                '/patient/appointments'
            );
            INSERT INTO public.notifications (user_id, title, message, type, link)
            VALUES (
                NEW.doctor_id,
                'Appointment Rescheduled',
                format('Appointment with %s was rescheduled to %s at %s.', v_patient_name, NEW.appointment_date, NEW.start_time),
                'appointment_rescheduled',
                '/doctor/appointments'
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_appointment_notifications ON public.appointments;
CREATE TRIGGER trigger_appointment_notifications
    AFTER INSERT OR UPDATE ON public.appointments
    FOR EACH ROW EXECUTE FUNCTION public.notify_appointment_events();

-- ------------------------------------------------------------------------------
-- 4. Notification Generator for Medical Records
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_medical_record_created()
RETURNS TRIGGER AS $$
DECLARE
    v_doctor_name TEXT;
BEGIN
    SELECT full_name INTO v_doctor_name FROM public.profiles WHERE id = NEW.doctor_id;

    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (
        NEW.patient_id,
        'Medical Record & Prescription Available',
        format('Dr. %s has recorded your consultation notes and prescription for your recent visit.', v_doctor_name),
        'record_ready',
        '/patient/records'
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_medical_record_notification ON public.medical_records;
CREATE TRIGGER trigger_medical_record_notification
    AFTER INSERT ON public.medical_records
    FOR EACH ROW EXECUTE FUNCTION public.notify_medical_record_created();
