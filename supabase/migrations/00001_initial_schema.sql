-- =============================================================================
-- Clinic Management System - Initial Schema
-- Single clinic (no multi-tenancy). Roles stored in profiles.role_id.
-- =============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =============================================================================
-- ENUMS
-- =============================================================================

CREATE TYPE public.appointment_status AS ENUM (
  'pending',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
  'no_show'
);

CREATE TYPE public.gender_type AS ENUM (
  'male',
  'female',
  'other',
  'prefer_not_to_say'
);

CREATE TYPE public.transaction_type AS ENUM (
  'income',
  'expense'
);

CREATE TYPE public.transaction_status AS ENUM (
  'pending',
  'paid',
  'overdue',
  'cancelled',
  'partial'
);

CREATE TYPE public.notification_type AS ENUM (
  'appointment_reminder',
  'appointment_confirmation',
  'birthday',
  'payment_overdue',
  'payment_received',
  'system',
  'general'
);

CREATE TYPE public.procedure_category AS ENUM (
  'ozonioterapy',
  'lasertherapy',
  'evaluation',
  'follow_up',
  'general',
  'other'
);

-- =============================================================================
-- TABLES
-- =============================================================================

-- Roles -----------------------------------------------------------------------
CREATE TABLE public.roles (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL UNIQUE
                          CHECK (name IN ('admin', 'receptionist', 'professional')),
  display_name TEXT       NOT NULL,
  description TEXT,
  permissions JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.roles IS 'Application roles with JSONB permission matrix per module/action.';

-- Profiles (linked to auth.users) ---------------------------------------------
CREATE TABLE public.profiles (
  id           UUID        PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  role_id      UUID        NOT NULL REFERENCES public.roles (id) ON DELETE RESTRICT,
  full_name    TEXT        NOT NULL,
  email        TEXT        NOT NULL,
  phone        TEXT,
  cpf          TEXT,
  specialty    TEXT,
  license_number TEXT,
  avatar_url   TEXT,
  is_active    BOOLEAN     NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT profiles_email_unique UNIQUE (email),
  CONSTRAINT profiles_cpf_unique UNIQUE (cpf)
);

COMMENT ON TABLE public.profiles IS 'Staff profiles. Authorization via role_id, never user_metadata.';

-- Clinic settings (single row) ------------------------------------------------
CREATE TABLE public.clinic_settings (
  id                           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_name                  TEXT        NOT NULL,
  trade_name                   TEXT,
  cnpj                         TEXT,
  address_street               TEXT,
  address_number               TEXT,
  address_complement           TEXT,
  address_neighborhood         TEXT,
  address_city                 TEXT        NOT NULL DEFAULT 'São Paulo',
  address_state                TEXT        NOT NULL DEFAULT 'SP',
  address_zip                  TEXT,
  phone                        TEXT,
  whatsapp                     TEXT,
  email                        TEXT,
  website                      TEXT,
  logo_url                     TEXT,
  working_hours                JSONB       NOT NULL DEFAULT '{
    "monday":    {"open": "08:00", "close": "18:00", "enabled": true},
    "tuesday":   {"open": "08:00", "close": "18:00", "enabled": true},
    "wednesday": {"open": "08:00", "close": "18:00", "enabled": true},
    "thursday":  {"open": "08:00", "close": "18:00", "enabled": true},
    "friday":    {"open": "08:00", "close": "18:00", "enabled": true},
    "saturday":  {"open": "08:00", "close": "12:00", "enabled": false},
    "sunday":    {"open": null,      "close": null,    "enabled": false}
  }'::jsonb,
  default_appointment_duration INTEGER     NOT NULL DEFAULT 60
                               CHECK (default_appointment_duration > 0),
  timezone                     TEXT        NOT NULL DEFAULT 'America/Sao_Paulo',
  currency                     TEXT        NOT NULL DEFAULT 'BRL',
  appointment_reminder_days    INTEGER     NOT NULL DEFAULT 1
                               CHECK (appointment_reminder_days >= 0),
  return_visit_days            INTEGER     NOT NULL DEFAULT 30
                               CHECK (return_visit_days > 0),
  created_at                   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                   TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.clinic_settings IS 'Singleton clinic configuration.';

-- Patients --------------------------------------------------------------------
CREATE TABLE public.patients (
  id                       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name                TEXT        NOT NULL,
  cpf                      TEXT,
  rg                       TEXT,
  birth_date               DATE,
  gender                   public.gender_type,
  email                    TEXT,
  phone                    TEXT        NOT NULL,
  phone_secondary          TEXT,
  address_street           TEXT,
  address_number           TEXT,
  address_complement       TEXT,
  address_neighborhood     TEXT,
  address_city             TEXT,
  address_state            TEXT,
  address_zip              TEXT,
  emergency_contact_name   TEXT,
  emergency_contact_phone  TEXT,
  health_insurance         TEXT,
  health_insurance_number  TEXT,
  allergies                TEXT,
  medical_notes            TEXT,
  photo_url                TEXT,
  last_appointment_at      TIMESTAMPTZ,
  is_active                BOOLEAN     NOT NULL DEFAULT true,
  created_by               UUID        REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT patients_cpf_unique UNIQUE (cpf),
  CONSTRAINT patients_cpf_format CHECK (
    cpf IS NULL OR cpf ~ '^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$'
  )
);

COMMENT ON TABLE public.patients IS 'Patient registry for the clinic.';

-- Procedures ------------------------------------------------------------------
CREATE TABLE public.procedures (
  id               UUID                      PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT                      NOT NULL,
  description      TEXT,
  category         public.procedure_category NOT NULL,
  duration_minutes INTEGER                   NOT NULL DEFAULT 60
                                       CHECK (duration_minutes > 0),
  base_price       NUMERIC(10, 2)            NOT NULL DEFAULT 0
                                       CHECK (base_price >= 0),
  is_active        BOOLEAN                   NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ               NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ               NOT NULL DEFAULT now(),

  CONSTRAINT procedures_name_unique UNIQUE (name)
);

COMMENT ON TABLE public.procedures IS 'Catalog of clinic procedures and services.';

-- Appointments ----------------------------------------------------------------
CREATE TABLE public.appointments (
  id                  UUID                      PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id          UUID                      NOT NULL
                        REFERENCES public.patients (id) ON DELETE RESTRICT,
  professional_id     UUID                      NOT NULL
                        REFERENCES public.profiles (id) ON DELETE RESTRICT,
  procedure_id        UUID
                        REFERENCES public.procedures (id) ON DELETE SET NULL,
  scheduled_at        TIMESTAMPTZ               NOT NULL,
  duration_minutes    INTEGER                   NOT NULL DEFAULT 60
                        CHECK (duration_minutes > 0),
  status              public.appointment_status NOT NULL DEFAULT 'pending',
  notes               TEXT,
  internal_notes      TEXT,
  cancellation_reason TEXT,
  cancelled_at        TIMESTAMPTZ,
  completed_at        TIMESTAMPTZ,
  created_by          UUID                      REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ               NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ               NOT NULL DEFAULT now(),

  CONSTRAINT appointments_cancelled_requires_reason CHECK (
    status <> 'cancelled' OR cancellation_reason IS NOT NULL
  )
);

COMMENT ON TABLE public.appointments IS 'Scheduled patient visits.';

-- Medical records -------------------------------------------------------------
CREATE TABLE public.medical_records (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id          UUID        NOT NULL
                        REFERENCES public.patients (id) ON DELETE RESTRICT,
  appointment_id      UUID
                        REFERENCES public.appointments (id) ON DELETE SET NULL,
  professional_id     UUID        NOT NULL
                        REFERENCES public.profiles (id) ON DELETE RESTRICT,
  chief_complaint     TEXT,
  anamnesis           TEXT,
  physical_examination TEXT,
  diagnosis           TEXT,
  treatment_plan      TEXT,
  evolution           TEXT,
  prescriptions       TEXT,
  vital_signs         JSONB       NOT NULL DEFAULT '{}'::jsonb,
  is_confidential     BOOLEAN     NOT NULL DEFAULT false,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.medical_records IS 'Clinical documentation per patient visit.';

-- Medical record procedures (junction) ----------------------------------------
CREATE TABLE public.medical_record_procedures (
  id                UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  medical_record_id UUID           NOT NULL
                      REFERENCES public.medical_records (id) ON DELETE CASCADE,
  procedure_id      UUID           NOT NULL
                      REFERENCES public.procedures (id) ON DELETE RESTRICT,
  quantity          INTEGER        NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price        NUMERIC(10, 2) CHECK (unit_price IS NULL OR unit_price >= 0),
  notes             TEXT,
  performed_at      TIMESTAMPTZ    NOT NULL DEFAULT now(),
  created_at        TIMESTAMPTZ    NOT NULL DEFAULT now(),

  CONSTRAINT medical_record_procedures_unique UNIQUE (medical_record_id, procedure_id)
);

COMMENT ON TABLE public.medical_record_procedures IS 'Procedures performed during a medical record entry.';

-- Medical record attachments --------------------------------------------------
CREATE TABLE public.medical_record_attachments (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  medical_record_id UUID        NOT NULL
                        REFERENCES public.medical_records (id) ON DELETE CASCADE,
  file_name         TEXT        NOT NULL,
  file_path         TEXT        NOT NULL,
  file_type         TEXT,
  file_size         BIGINT      CHECK (file_size IS NULL OR file_size >= 0),
  description       TEXT,
  uploaded_by       UUID        REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT medical_record_attachments_path_unique UNIQUE (file_path)
);

COMMENT ON TABLE public.medical_record_attachments IS 'Files linked to medical records (stored in medical-attachments bucket).';

-- Financial transactions ------------------------------------------------------
CREATE TABLE public.financial_transactions (
  id               UUID                         PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id       UUID
                     REFERENCES public.patients (id) ON DELETE SET NULL,
  appointment_id   UUID
                     REFERENCES public.appointments (id) ON DELETE SET NULL,
  type             public.transaction_type      NOT NULL,
  status           public.transaction_status    NOT NULL DEFAULT 'pending',
  amount           NUMERIC(10, 2)               NOT NULL CHECK (amount >= 0),
  description      TEXT                         NOT NULL,
  category         TEXT,
  due_date         DATE,
  paid_at          TIMESTAMPTZ,
  payment_method   TEXT,
  reference_number TEXT,
  notes            TEXT,
  created_by       UUID                         REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ                  NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ                  NOT NULL DEFAULT now(),

  CONSTRAINT financial_transactions_paid_consistency CHECK (
    (status IN ('paid', 'partial') AND paid_at IS NOT NULL)
    OR (status NOT IN ('paid', 'partial'))
  )
);

COMMENT ON TABLE public.financial_transactions IS 'Income and expense ledger.';

-- Notifications ---------------------------------------------------------------
CREATE TABLE public.notifications (
  id           UUID                       PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID                       REFERENCES public.profiles (id) ON DELETE CASCADE,
  patient_id   UUID                       REFERENCES public.patients (id) ON DELETE CASCADE,
  type         public.notification_type   NOT NULL,
  title        TEXT                       NOT NULL,
  message      TEXT                       NOT NULL,
  is_read      BOOLEAN                    NOT NULL DEFAULT false,
  read_at      TIMESTAMPTZ,
  scheduled_at TIMESTAMPTZ,
  sent_at      TIMESTAMPTZ,
  metadata     JSONB                      NOT NULL DEFAULT '{}'::jsonb,
  created_at   TIMESTAMPTZ                NOT NULL DEFAULT now(),

  CONSTRAINT notifications_target_required CHECK (
    user_id IS NOT NULL OR patient_id IS NOT NULL
  )
);

COMMENT ON TABLE public.notifications IS 'In-app and scheduled notifications.';

-- Audit logs ------------------------------------------------------------------
CREATE TABLE public.audit_logs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        REFERENCES public.profiles (id) ON DELETE SET NULL,
  table_name  TEXT        NOT NULL,
  record_id   UUID        NOT NULL,
  action      TEXT        NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data    JSONB,
  new_data    JSONB,
  ip_address  INET,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.audit_logs IS 'Immutable audit trail for sensitive operations.';

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Roles
CREATE INDEX idx_roles_name ON public.roles (name);

-- Profiles
CREATE INDEX idx_profiles_role_id ON public.profiles (role_id);
CREATE INDEX idx_profiles_email ON public.profiles (email);
CREATE INDEX idx_profiles_is_active ON public.profiles (is_active) WHERE is_active = true;

-- Patients
CREATE INDEX idx_patients_full_name_trgm ON public.patients USING gin (full_name gin_trgm_ops);
CREATE INDEX idx_patients_cpf ON public.patients (cpf) WHERE cpf IS NOT NULL;
CREATE INDEX idx_patients_phone ON public.patients (phone);
CREATE INDEX idx_patients_birth_date ON public.patients (birth_date) WHERE birth_date IS NOT NULL;
CREATE INDEX idx_patients_last_appointment_at ON public.patients (last_appointment_at);
CREATE INDEX idx_patients_is_active ON public.patients (is_active) WHERE is_active = true;
CREATE INDEX idx_patients_created_by ON public.patients (created_by);

-- Procedures
CREATE INDEX idx_procedures_category ON public.procedures (category);
CREATE INDEX idx_procedures_is_active ON public.procedures (is_active) WHERE is_active = true;

-- Appointments
CREATE INDEX idx_appointments_patient_id ON public.appointments (patient_id);
CREATE INDEX idx_appointments_professional_id ON public.appointments (professional_id);
CREATE INDEX idx_appointments_procedure_id ON public.appointments (procedure_id);
CREATE INDEX idx_appointments_scheduled_at ON public.appointments (scheduled_at);
CREATE INDEX idx_appointments_status ON public.appointments (status);
CREATE INDEX idx_appointments_scheduled_status ON public.appointments (scheduled_at, status);
CREATE INDEX idx_appointments_created_by ON public.appointments (created_by);

-- Medical records
CREATE INDEX idx_medical_records_patient_id ON public.medical_records (patient_id);
CREATE INDEX idx_medical_records_appointment_id ON public.medical_records (appointment_id)
  WHERE appointment_id IS NOT NULL;
CREATE INDEX idx_medical_records_professional_id ON public.medical_records (professional_id);
CREATE INDEX idx_medical_records_created_at ON public.medical_records (created_at DESC);

-- Medical record procedures
CREATE INDEX idx_medical_record_procedures_record ON public.medical_record_procedures (medical_record_id);
CREATE INDEX idx_medical_record_procedures_procedure ON public.medical_record_procedures (procedure_id);

-- Medical record attachments
CREATE INDEX idx_medical_record_attachments_record ON public.medical_record_attachments (medical_record_id);
CREATE INDEX idx_medical_record_attachments_uploaded_by ON public.medical_record_attachments (uploaded_by);

-- Financial transactions
CREATE INDEX idx_financial_transactions_patient_id ON public.financial_transactions (patient_id)
  WHERE patient_id IS NOT NULL;
CREATE INDEX idx_financial_transactions_appointment_id ON public.financial_transactions (appointment_id)
  WHERE appointment_id IS NOT NULL;
CREATE INDEX idx_financial_transactions_type ON public.financial_transactions (type);
CREATE INDEX idx_financial_transactions_status ON public.financial_transactions (status);
CREATE INDEX idx_financial_transactions_due_date ON public.financial_transactions (due_date)
  WHERE due_date IS NOT NULL;
CREATE INDEX idx_financial_transactions_paid_at ON public.financial_transactions (paid_at)
  WHERE paid_at IS NOT NULL;
CREATE INDEX idx_financial_transactions_created_at ON public.financial_transactions (created_at DESC);

-- Notifications
CREATE INDEX idx_notifications_user_id ON public.notifications (user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_notifications_patient_id ON public.notifications (patient_id) WHERE patient_id IS NOT NULL;
CREATE INDEX idx_notifications_is_read ON public.notifications (user_id, is_read) WHERE user_id IS NOT NULL;
CREATE INDEX idx_notifications_scheduled_at ON public.notifications (scheduled_at)
  WHERE scheduled_at IS NOT NULL AND sent_at IS NULL;
CREATE INDEX idx_notifications_type ON public.notifications (type);

-- Audit logs
CREATE INDEX idx_audit_logs_table_record ON public.audit_logs (table_name, record_id);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs (user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs (created_at DESC);
CREATE INDEX idx_audit_logs_action ON public.audit_logs (action);

-- =============================================================================
-- GRANTS (Supabase roles)
-- =============================================================================

GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO postgres, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO postgres, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
