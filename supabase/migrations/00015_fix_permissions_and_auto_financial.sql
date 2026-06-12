-- =============================================================================
-- Migration 00015: Fix permissions + auto financial transactions
-- =============================================================================
-- This migration:
-- 1. Grants professionals full CRUD on procedures
-- 2. Grants professionals full CRUD on financial (needed for the trigger)
-- 3. Creates the auto-financial-transaction trigger (SECURITY DEFINER bypasses RLS)
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Grant professionals full permissions on procedures
-- ─────────────────────────────────────────────────────────────────────────────
UPDATE public.roles
SET permissions = jsonb_set(
  permissions,
  '{procedures}',
  '{"read": true, "create": true, "update": true, "delete": true}'::jsonb
)
WHERE name = 'professional';

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Grant professionals read permission on financial (so they can see
--    the auto-generated transactions in their dashboard)
-- ─────────────────────────────────────────────────────────────────────────────
UPDATE public.roles
SET permissions = jsonb_set(
  permissions,
  '{financial}',
  '{"read": true, "create": true, "update": false, "delete": false}'::jsonb
)
WHERE name = 'professional';

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Auto financial transaction trigger
--    Uses SECURITY DEFINER to bypass RLS when inserting/deleting transactions
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.auto_create_financial_transaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_base_price NUMERIC;
  v_primary_dentist_id UUID;
  v_split_amount NUMERIC;
  v_procedure_name TEXT;
  v_prof RECORD;
BEGIN
  -- ── DELETE: always clean up financial transactions ──────────────────────
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.financial_transactions
    WHERE appointment_id = OLD.id;
    RETURN OLD;
  END IF;

  -- ── Status changed TO 'completed' ──────────────────────────────────────
  IF NEW.status = 'completed' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'completed') THEN

    -- Only generate if there is a procedure
    IF NEW.procedure_id IS NOT NULL THEN
      -- Get procedure info
      SELECT base_price, name
      INTO v_base_price, v_procedure_name
      FROM public.procedures
      WHERE id = NEW.procedure_id;

      IF v_base_price IS NOT NULL AND v_base_price > 0 THEN
        -- Check if patient is shared (primary_dentist_id IS NULL = shared)
        SELECT primary_dentist_id
        INTO v_primary_dentist_id
        FROM public.patients
        WHERE id = NEW.patient_id;

        IF v_primary_dentist_id IS NULL THEN
          -- ── SHARED PATIENT: create one transaction per professional (50% each) ──
          v_split_amount := ROUND(v_base_price * 0.50, 2);

          FOR v_prof IN
            SELECT p.id
            FROM public.profiles p
            JOIN public.roles r ON r.id = p.role_id
            WHERE r.name = 'professional'
          LOOP
            INSERT INTO public.financial_transactions (
              patient_id, appointment_id, type, status, amount,
              description, due_date, paid_at, payment_method,
              split_type, shared_with_id, split_amount, created_by
            ) VALUES (
              NEW.patient_id, NEW.id, 'income', 'paid', v_base_price,
              'Consulta: ' || COALESCE(v_procedure_name, 'Procedimento'),
              (NEW.scheduled_at AT TIME ZONE 'America/Sao_Paulo')::date,
              now(), 'cash', 'custom_margin',
              v_prof.id, v_split_amount, v_prof.id
            );
          END LOOP;

        ELSE
          -- ── OWN PATIENT: one transaction, 100% for the professional ──
          INSERT INTO public.financial_transactions (
            patient_id, appointment_id, type, status, amount,
            description, due_date, paid_at, payment_method,
            split_type, shared_with_id, split_amount, created_by
          ) VALUES (
            NEW.patient_id, NEW.id, 'income', 'paid', v_base_price,
            'Consulta: ' || COALESCE(v_procedure_name, 'Procedimento'),
            (NEW.scheduled_at AT TIME ZONE 'America/Sao_Paulo')::date,
            now(), 'cash', '100_percent',
            NEW.professional_id, v_base_price, NEW.professional_id
          );
        END IF;

      END IF;
    END IF;

  -- ── Status changed FROM 'completed' to something else ──────────────────
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'completed' AND NEW.status <> 'completed' THEN
    DELETE FROM public.financial_transactions
    WHERE appointment_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

-- Drop old trigger if exists, then create new one (now also fires on DELETE)
DROP TRIGGER IF EXISTS trg_appointments_auto_financial ON public.appointments;
CREATE TRIGGER trg_appointments_auto_financial
  AFTER INSERT OR UPDATE OF status OR DELETE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.auto_create_financial_transaction();

