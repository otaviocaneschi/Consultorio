-- =============================================================================
-- Migration 00021: Drop old duplicate auto financial trigger
-- =============================================================================
-- The trigger trg_appointments_auto_financial (from 00014) was running
-- ALONG WITH trg_financial_auto_generate (from 00019), causing DUPLICATE
-- incomes to be generated every time an appointment was completed.
-- We must drop the old trigger and its function.
-- =============================================================================

DROP TRIGGER IF EXISTS trg_appointments_auto_financial ON public.appointments;
DROP FUNCTION IF EXISTS public.auto_create_financial_transaction();
