-- =============================================================================
-- Migration: Add primary_dentist_id to patients
-- Purpose: Associate each patient with a primary professional (dentist/doctor).
--          NULL means the patient is shared across the clinic.
-- =============================================================================

ALTER TABLE public.patients
  ADD COLUMN primary_dentist_id UUID REFERENCES public.profiles (id) ON DELETE SET NULL;

COMMENT ON COLUMN public.patients.primary_dentist_id
  IS 'Primary responsible professional. NULL = shared patient.';

-- Index for filtering by primary dentist
CREATE INDEX idx_patients_primary_dentist_id
  ON public.patients (primary_dentist_id)
  WHERE primary_dentist_id IS NOT NULL;
