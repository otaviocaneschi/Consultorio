-- =============================================================================
-- Migration 00017: Auto-share expenses between professionals
-- =============================================================================
-- When a professional creates an expense, automatically create a copy
-- for each OTHER professional, splitting 50/50.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.auto_share_expense()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_num_profs INTEGER;
  v_split NUMERIC;
  v_prof RECORD;
BEGIN
  -- Only act on NEW expenses (not income, not copies)
  -- A copy has shared_with_id != created_by, so we skip those
  IF NEW.type = 'expense'
     AND NEW.appointment_id IS NULL
     AND (NEW.shared_with_id IS NULL OR NEW.shared_with_id = NEW.created_by)
  THEN
    -- Count total professionals
    SELECT COUNT(*) INTO v_num_profs
    FROM public.profiles p
    JOIN public.roles r ON r.id = p.role_id
    WHERE r.name = 'professional';

    IF v_num_profs > 1 THEN
      v_split := ROUND(NEW.amount / v_num_profs, 2);

      -- Update the original record with split info
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
        WHERE r.name = 'professional'
          AND p.id != NEW.created_by
      LOOP
        INSERT INTO public.financial_transactions (
          type, status, amount, split_amount, description,
          due_date, paid_at, payment_method,
          split_type, shared_with_id, created_by
        ) VALUES (
          NEW.type, NEW.status, NEW.amount, v_split, NEW.description,
          NEW.due_date, NEW.paid_at, NEW.payment_method,
          'custom_margin', v_prof.id, NEW.created_by
        );
      END LOOP;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_financial_auto_share_expense ON public.financial_transactions;
CREATE TRIGGER trg_financial_auto_share_expense
  AFTER INSERT ON public.financial_transactions
  FOR EACH ROW EXECUTE FUNCTION public.auto_share_expense();
