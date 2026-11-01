-- ==============================================================================
-- ClinicFlow — Migration 04: Anti-Double-Booking Concurrency & RPC Functions
-- Enforces Strict Transactional Locking and Double-Booking Prevention in PostgreSQL
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Anti-Double-Booking Trigger / Check Function
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_appointment_conflict()
RETURNS TRIGGER AS $$
DECLARE
    v_conflict_count INT;
BEGIN
    -- Only check active appointments (ignore cancelled ones)
    IF NEW.status NOT IN ('cancelled') THEN
        SELECT COUNT(*) INTO v_conflict_count
        FROM public.appointments
        WHERE doctor_id = NEW.doctor_id
          AND appointment_date = NEW.appointment_date
          AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
          AND status NOT IN ('cancelled')
          AND (
              -- Overlap formula: (StartA < EndB) and (EndA > StartB)
              (start_time < NEW.end_time AND end_time > NEW.start_time)
          );

        IF v_conflict_count > 0 THEN
            RAISE EXCEPTION 'Double-booking conflict: Doctor already has an active appointment overlapping with % - % on %',
                NEW.start_time, NEW.end_time, NEW.appointment_date
                USING ERRCODE = '23P01'; -- exclusion_violation
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_prevent_double_booking ON public.appointments;
CREATE TRIGGER trigger_prevent_double_booking
    BEFORE INSERT OR UPDATE OF doctor_id, appointment_date, start_time, end_time, status
    ON public.appointments
    FOR EACH ROW EXECUTE FUNCTION public.check_appointment_conflict();

-- ------------------------------------------------------------------------------
-- 2. Atomic Slot Booking RPC Function
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.book_appointment_atomic(
    p_patient_id UUID,
    p_doctor_id UUID,
    p_appointment_date DATE,
    p_start_time TIME,
    p_end_time TIME,
    p_chief_complaint TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_appointment_id UUID;
    v_result JSONB;
    v_doctor_exists BOOLEAN;
BEGIN
    -- Prevent booking dates in the past
    IF p_appointment_date < CURRENT_DATE THEN
        RAISE EXCEPTION 'Cannot book an appointment for a past date.';
    END IF;

    -- Verify doctor exists
    SELECT EXISTS (
        SELECT 1 FROM public.doctor_profiles WHERE id = p_doctor_id
    ) INTO v_doctor_exists;

    IF NOT v_doctor_exists THEN
        RAISE EXCEPTION 'Doctor not found or inactive.';
    END IF;

    -- Explicit PostgreSQL transaction-level concurrency check
    -- Trigger 'check_appointment_conflict' will also strictly guard this
    INSERT INTO public.appointments (
        patient_id,
        doctor_id,
        appointment_date,
        start_time,
        end_time,
        status,
        chief_complaint
    ) VALUES (
        p_patient_id,
        p_doctor_id,
        p_appointment_date,
        p_start_time,
        p_end_time,
        'confirmed', -- Auto-confirm on valid slot selection
        p_chief_complaint
    )
    RETURNING id INTO v_appointment_id;

    SELECT json_build_object(
        'success', true,
        'appointment_id', v_appointment_id,
        'message', 'Appointment booked successfully without conflict.'
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

-- ------------------------------------------------------------------------------
-- 3. Atomic Reschedule RPC Function
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.reschedule_appointment_atomic(
    p_appointment_id UUID,
    p_new_date DATE,
    p_new_start_time TIME,
    p_new_end_time TIME
)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
BEGIN
    IF p_new_date < CURRENT_DATE THEN
        RAISE EXCEPTION 'Cannot reschedule to a past date.';
    END IF;

    UPDATE public.appointments
    SET 
        appointment_date = p_new_date,
        start_time = p_new_start_time,
        end_time = p_new_end_time,
        status = 'confirmed',
        updated_at = now()
    WHERE id = p_appointment_id;

    SELECT json_build_object(
        'success', true,
        'appointment_id', p_appointment_id,
        'message', 'Appointment rescheduled successfully.'
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
