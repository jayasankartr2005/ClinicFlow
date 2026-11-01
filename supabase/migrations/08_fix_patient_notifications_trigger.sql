-- ==============================================================================
-- ClinicFlow — Migration 08: Fix Patient Notifications Triggers
-- Decouples in-app notifications from standalone patients (who use WhatsApp)
-- Prevents Foreign Key Violations on notifications_user_id_fkey
-- ==============================================================================

-- 1. Redefine Appointment Notifications Trigger Function
CREATE OR REPLACE FUNCTION public.notify_appointment_events()
RETURNS TRIGGER AS $$
DECLARE
    v_doctor_name TEXT;
    v_patient_name TEXT;
    v_doctor_exists BOOLEAN;
BEGIN
    -- Resolve doctor name from profiles
    SELECT full_name INTO v_doctor_name FROM public.profiles WHERE id = NEW.doctor_id;
    
    -- Resolve patient name from public.patients first, fallback to profiles
    SELECT full_name INTO v_patient_name FROM public.patients WHERE id = NEW.patient_id;
    IF v_patient_name IS NULL THEN
        SELECT full_name INTO v_patient_name FROM public.profiles WHERE id = NEW.patient_id;
    END IF;

    -- Check if doctor exists in profiles to receive in-app notification
    SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.doctor_id) INTO v_doctor_exists;

    IF (TG_OP = 'INSERT') THEN
        -- Only insert in-app notification for the doctor/staff profile
        IF v_doctor_exists THEN
            INSERT INTO public.notifications (user_id, title, message, type, link)
            VALUES (
                NEW.doctor_id,
                'New Appointment Scheduled',
                format('Patient %s has booked a consultation on %s at %s.', COALESCE(v_patient_name, 'Patient'), NEW.appointment_date, NEW.start_time),
                'appointment_booked',
                '/doctor/appointments'
            );
        END IF;

    ELSIF (TG_OP = 'UPDATE') THEN
        -- Status change notifications for doctor
        IF (OLD.status <> NEW.status) THEN
            IF (NEW.status = 'cancelled' AND v_doctor_exists) THEN
                INSERT INTO public.notifications (user_id, title, message, type, link)
                VALUES (
                    NEW.doctor_id,
                    'Appointment Cancelled',
                    format('Appointment with %s on %s has been cancelled.', COALESCE(v_patient_name, 'Patient'), NEW.appointment_date),
                    'appointment_cancelled',
                    '/doctor/appointments'
                );
            END IF;
        END IF;

        -- Rescheduling notification for doctor
        IF ((OLD.appointment_date <> NEW.appointment_date OR OLD.start_time <> NEW.start_time) AND v_doctor_exists) THEN
            INSERT INTO public.notifications (user_id, title, message, type, link)
            VALUES (
                NEW.doctor_id,
                'Appointment Rescheduled',
                format('Appointment with %s was rescheduled to %s at %s.', COALESCE(v_patient_name, 'Patient'), NEW.appointment_date, NEW.start_time),
                'appointment_rescheduled',
                '/doctor/appointments'
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Redefine Medical Record Notifications Trigger Function
CREATE OR REPLACE FUNCTION public.notify_medical_record_created()
RETURNS TRIGGER AS $$
DECLARE
    v_doctor_name TEXT;
    v_patient_is_profile BOOLEAN;
BEGIN
    -- If patient also happens to have a legacy profile in profiles, optionally notify
    SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.patient_id) INTO v_patient_is_profile;

    IF v_patient_is_profile THEN
        SELECT full_name INTO v_doctor_name FROM public.profiles WHERE id = NEW.doctor_id;

        INSERT INTO public.notifications (user_id, title, message, type, link)
        VALUES (
            NEW.patient_id,
            'Medical Record & Prescription Available',
            format('Dr. %s has recorded your consultation notes and prescription for your recent visit.', COALESCE(v_doctor_name, 'Physician')),
            'record_ready',
            '/patient/records'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
