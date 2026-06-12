-- =============================================================================
-- Migration: Auto Financial Transactions
-- Purpose: Automatically create income transactions when an appointment is completed
-- =============================================================================

CREATE OR REPLACE FUNCTION public.auto_create_financial_transaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_base_price NUMERIC;
  v_margin NUMERIC;
  v_primary_dentist_id UUID;
  v_split_amount NUMERIC;
  v_split_type public.split_type;
  v_procedure_name TEXT;
BEGIN
  -- If status changes TO 'completed'
  IF NEW.status = 'completed' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'completed') THEN
    
    -- Only generate if there is a procedure
    IF NEW.procedure_id IS NOT NULL THEN
      -- Get procedure info
      SELECT base_price, margin_percentage, name
      INTO v_base_price, v_margin, v_procedure_name
      FROM public.procedures
      WHERE id = NEW.procedure_id;

      IF v_base_price > 0 THEN
        -- Get patient info
        SELECT primary_dentist_id
        INTO v_primary_dentist_id
        FROM public.patients
        WHERE id = NEW.patient_id;

        -- Calculate split
        IF v_primary_dentist_id IS NULL THEN
          -- Shared patient: apply margin
          v_split_type := 'custom_margin';
          v_split_amount := v_base_price * (v_margin / 100.0);
        ELSE
          -- Not shared (or primary dentist is the same)
          v_split_type := '100_percent';
          v_split_amount := v_base_price;
        END IF;

        -- Insert transaction
        INSERT INTO public.financial_transactions (
          patient_id,
          appointment_id,
          type,
          status,
          amount,
          description,
          due_date,
          paid_at,
          payment_method,
          split_type,
          shared_with_id,
          split_amount,
          created_by
        ) VALUES (
          NEW.patient_id,
          NEW.id,
          'income',
          'paid',
          v_base_price,
          'Consulta: ' || v_procedure_name,
          NEW.scheduled_at::date,
          now(),
          'cash',
          v_split_type,
          NEW.professional_id,
          v_split_amount,
          NEW.professional_id
        );
      END IF;
    END IF;

  -- If status changes FROM 'completed' to something else (e.g. pending/cancelled)
  ELSIF NEW.status <> 'completed' AND OLD.status = 'completed' THEN
    -- Delete the auto-created transaction for this appointment
    DELETE FROM public.financial_transactions
    WHERE appointment_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_appointments_auto_financial ON public.appointments;
CREATE TRIGGER trg_appointments_auto_financial
  AFTER INSERT OR UPDATE OF status ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.auto_create_financial_transaction();
