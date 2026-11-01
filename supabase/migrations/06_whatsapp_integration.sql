-- ==============================================================================
-- ClinicFlow — Migration 06: WhatsApp Patient Interface Integration
-- Adds Tables for Meta WhatsApp Cloud API Sessions, Messages & Idempotency
-- ==============================================================================

-- 1. Custom Enum Types for WhatsApp Integration
DO $$ BEGIN
    CREATE TYPE whatsapp_session_state AS ENUM (
        'IDLE',
        'MAIN_MENU',
        'SELECTING_DOCTOR',
        'SELECTING_DATE',
        'SELECTING_SLOT',
        'CONFIRMING_APPOINTMENT',
        'COMPLETED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE whatsapp_direction AS ENUM ('INBOUND', 'OUTBOUND');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE whatsapp_message_type AS ENUM (
        'TEXT',
        'BUTTON',
        'LIST',
        'DOCUMENT',
        'IMAGE',
        'TEMPLATE'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. WhatsApp Conversation Sessions Table
CREATE TABLE IF NOT EXISTS public.whatsapp_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
    whatsapp_number TEXT NOT NULL,
    state whatsapp_session_state NOT NULL DEFAULT 'IDLE',
    state_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '24 hours'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_whatsapp_session_hospital_number UNIQUE (hospital_id, whatsapp_number)
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_hospital ON public.whatsapp_sessions(hospital_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_patient ON public.whatsapp_sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_number ON public.whatsapp_sessions(whatsapp_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_expires_at ON public.whatsapp_sessions(expires_at);

DROP TRIGGER IF EXISTS set_whatsapp_sessions_updated_at ON public.whatsapp_sessions;
CREATE TRIGGER set_whatsapp_sessions_updated_at
    BEFORE UPDATE ON public.whatsapp_sessions
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. WhatsApp Messages Table (Stores Message Logs & Enforces Webhook Idempotency)
CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
    session_id UUID REFERENCES public.whatsapp_sessions(id) ON DELETE SET NULL,
    direction whatsapp_direction NOT NULL,
    whatsapp_message_id TEXT NOT NULL UNIQUE, -- Crucial for Idempotency
    message_type whatsapp_message_type NOT NULL DEFAULT 'TEXT',
    message_status TEXT NOT NULL DEFAULT 'received',
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_hospital ON public.whatsapp_messages(hospital_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_patient ON public.whatsapp_messages(patient_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_session ON public.whatsapp_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_msg_id ON public.whatsapp_messages(whatsapp_message_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_created_at ON public.whatsapp_messages(created_at DESC);
