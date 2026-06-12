-- =============================================================================
-- Migration 00019: Fix triggers and RLS for financial transactions
-- =============================================================================

-- 1. FIX THE RLS POLICY SO PROFESSIONALS ONLY SEE THEIR OWN OR SHARED TRANSACTIONS
DROP POLICY IF EXISTS "financial_transactions_select" ON public.financial_transactions;
CREATE POLICY "financial_transactions_select"
  ON public.financial_transactions
  FOR SELECT
  TO authenticated
  USING (
    public.is_staff()
    AND public.has_permission('financial', 'read')
    AND (
      public.is_admin()
      OR public.get_user_role() = 'receptionist'
      OR shared_with_id = auth.uid()
      OR (shared_with_id IS NULL AND created_by = auth.uid())
    )
  );

-- 2. FIX THE INCOMES TRIGGER (00015) TO CORRECTLY COUNT PROFESSIONALS
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

      IF NEW.professional_id IS NULL THEN
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
              'Procedimento: ' || (SELECT name FROM public.procedures WHERE id = NEW.procedure_id) || ' (Cópia Compartilhada)',
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

-- 3. FIX THE EXPENSES TRIGGER (00017) TO CORRECTLY COUNT PROFESSIONALS
CREATE OR REPLACE FUNCTION public.auto_share_expense()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_num_profs INTEGER;
  v_split NUMERIC(10, 2);
  v_prof RECORD;
BEGIN
  IF NEW.type = 'expense'
     AND NEW.appointment_id IS NULL
     AND (NEW.shared_with_id IS NULL OR NEW.shared_with_id = NEW.created_by)
     AND NEW.split_amount IS NULL
  THEN
    SELECT COUNT(*) INTO v_num_profs
    FROM public.profiles p
    JOIN public.roles r ON r.id = p.role_id
    WHERE r.name IN ('professional', 'dentist');

    IF v_num_profs > 1 THEN
      v_split := ROUND(NEW.amount / v_num_profs, 2);

      -- Update the original record
      UPDATE public.financial_transactions
      SET split_amount = v_split,
          shared_with_id = NEW.created_by,
          split_type = 'custom_margin'
      WHERE id = NEW.id;

      -- Create a copy for each OTHER professional
      FOR v_prof IN 
        SELECT p.id 
        FROM public.profiles p
        JOIN public.roles r ON r.id = p.role_id
        WHERE r.name IN ('professional', 'dentist')
          AND p.id != NEW.created_by
      LOOP
        INSERT INTO public.financial_transactions (
          type, status, amount, split_amount, description,
          due_date, paid_at, payment_method,
          split_type, shared_with_id, created_by
        ) VALUES (
          NEW.type, NEW.status, NEW.amount, v_split, NEW.description || ' (Cópia)',
          NEW.due_date, NEW.paid_at, NEW.payment_method,
          'custom_margin', v_prof.id, NEW.created_by
        );
      END LOOP;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- 4. APPLY THE NEW TRIGGERS

-- (Re-apply the triggers just in case)
DROP TRIGGER IF EXISTS trg_financial_auto_generate ON public.appointments;
CREATE TRIGGER trg_financial_auto_generate
  AFTER INSERT OR UPDATE OF status ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.auto_generate_financial_transaction();

DROP TRIGGER IF EXISTS trg_financial_auto_share_expense ON public.financial_transactions;
CREATE TRIGGER trg_financial_auto_share_expense
  AFTER INSERT ON public.financial_transactions
  FOR EACH ROW EXECUTE FUNCTION public.auto_share_expense();

