-- =============================================================================
-- Migration 00022: Fix Patient Sharing Logic in Triggers
-- =============================================================================
-- The previous trigger (00019) incorrectly checked if the appointment's
-- professional_id was NULL to determine if the patient was shared.
-- However, appointments always have a professional_id. The correct way
-- is to check if the PATIENT's primary_dentist_id is NULL.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.auto_generate_financial_transaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_base_price NUMERIC(10, 2);
  v_num_profs INTEGER;
  v_prof RECORD;
  v_split_amount NUMERIC(10, 2);
  v_patient_primary_dentist UUID;
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    SELECT base_price INTO v_base_price
    FROM public.procedures
    WHERE id = NEW.procedure_id;

    IF v_base_price IS NOT NULL AND v_base_price > 0 THEN
      -- Fix: check for both 'professional' and 'dentist' roles to be safe
      SELECT COUNT(*) INTO v_num_profs
      FROM public.profiles p
      JOIN public.roles r ON r.id = p.role_id
      WHERE r.name IN ('professional', 'dentist');

      -- Check if the PATIENT is shared (primary_dentist_id is NULL)
      SELECT primary_dentist_id INTO v_patient_primary_dentist
      FROM public.patients
      WHERE id = NEW.patient_id;

      IF v_patient_primary_dentist IS NULL THEN
        -- SHARED PATIENT
        IF v_num_profs > 1 THEN
          v_split_amount := ROUND(v_base_price / v_num_profs, 2);
          
          -- 1. Transaction for the professional who did it
          INSERT INTO public.financial_transactions (
            patient_id, appointment_id, type, status, amount,
            description, due_date, paid_at, payment_method,
            split_type, shared_with_id, split_amount, created_by
          ) VALUES (
            NEW.patient_id, NEW.id, 'income', 'paid', v_base_price,
            'Procedimento: ' || (SELECT name FROM public.procedures WHERE id = NEW.procedure_id) || ' (Original)',
            CURRENT_DATE, CURRENT_DATE, 'pix',
            '50_50', NEW.created_by, v_split_amount, NEW.created_by
          );

          -- 2. Transaction for the other professionals
          FOR v_prof IN 
            SELECT p.id 
            FROM public.profiles p
            JOIN public.roles r ON r.id = p.role_id
            WHERE r.name IN ('professional', 'dentist')
              AND p.id != NEW.created_by
          LOOP
            INSERT INTO public.financial_transactions (
              patient_id, appointment_id, type, status, amount,
              description, due_date, paid_at, payment_method,
              split_type, shared_with_id, split_amount, created_by
            ) VALUES (
              NEW.patient_id, NEW.id, 'income', 'paid', v_base_price,
              'Procedimento: ' || (SELECT name FROM public.procedures WHERE id = NEW.procedure_id) || ' (Cópia)',
              CURRENT_DATE, CURRENT_DATE, 'pix',
              '50_50', v_prof.id, v_split_amount, NEW.created_by
            );
          END LOOP;
        ELSE
          -- Fallback if only 1 professional exists
          INSERT INTO public.financial_transactions (
            patient_id, appointment_id, type, status, amount,
            description, due_date, paid_at, payment_method,
            split_type, shared_with_id, split_amount, created_by
          ) VALUES (
            NEW.patient_id, NEW.id, 'income', 'paid', v_base_price,
            'Procedimento: ' || (SELECT name FROM public.procedures WHERE id = NEW.procedure_id),
            CURRENT_DATE, CURRENT_DATE, 'pix',
            '100_percent', NEW.created_by, v_base_price, NEW.created_by
          );
        END IF;
      ELSE
        -- OWN PATIENT
        INSERT INTO public.financial_transactions (
          patient_id, appointment_id, type, status, amount,
          description, due_date, paid_at, payment_method,
          split_type, shared_with_id, split_amount, created_by
        ) VALUES (
          NEW.patient_id, NEW.id, 'income', 'paid', v_base_price,
          'Procedimento: ' || (SELECT name FROM public.procedures WHERE id = NEW.procedure_id),
          CURRENT_DATE, CURRENT_DATE, 'pix',
          '100_percent', NEW.professional_id, v_base_price, NEW.professional_id
        );
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
