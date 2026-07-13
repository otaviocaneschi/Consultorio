-- =============================================================================
-- Migration 00028: Multiple procedures per appointment
-- =============================================================================

-- 1. Create junction table
CREATE TABLE IF NOT EXISTS public.appointment_procedures (
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE NOT NULL,
    procedure_id UUID REFERENCES public.procedures(id) ON DELETE CASCADE NOT NULL,
    price NUMERIC(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (appointment_id, procedure_id)
);

-- 2. RLS for junction table
ALTER TABLE public.appointment_procedures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View appointment procedures"
    ON public.appointment_procedures FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.appointments a 
            WHERE a.id = appointment_procedures.appointment_id
        )
    );

CREATE POLICY "Manage appointment procedures"
    ON public.appointment_procedures FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.appointments a 
            WHERE a.id = appointment_procedures.appointment_id
        )
    );

-- 3. Migrate existing data
INSERT INTO public.appointment_procedures (appointment_id, procedure_id, price)
SELECT 
  a.id, 
  a.procedure_id, 
  p.base_price
FROM public.appointments a
JOIN public.procedures p ON p.id = a.procedure_id
WHERE a.procedure_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- 4. Update the trigger to loop over appointment_procedures
CREATE OR REPLACE FUNCTION public.auto_generate_financial_transaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_num_profs INTEGER;
  v_prof RECORD;
  v_split_amount NUMERIC(10, 2);
  v_patient_primary_dentist UUID;
  v_proc RECORD;
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Check for both 'professional' and 'dentist' roles to be safe
    SELECT COUNT(*) INTO v_num_profs
    FROM public.profiles p
    JOIN public.roles r ON r.id = p.role_id
    WHERE r.name IN ('professional', 'dentist');

    -- Check if the PATIENT is shared (primary_dentist_id is NULL)
    SELECT primary_dentist_id INTO v_patient_primary_dentist
    FROM public.patients
    WHERE id = NEW.patient_id;

    -- Loop over all procedures associated with this appointment
    FOR v_proc IN (
        SELECT ap.procedure_id, p.name, p.base_price 
        FROM public.appointment_procedures ap
        JOIN public.procedures p ON p.id = ap.procedure_id
        WHERE ap.appointment_id = NEW.id
    )
    LOOP
        IF v_proc.base_price IS NOT NULL AND v_proc.base_price > 0 THEN
            IF v_patient_primary_dentist IS NULL THEN
                -- SHARED PATIENT
                IF v_num_profs > 1 THEN
                    v_split_amount := ROUND(v_proc.base_price / v_num_profs, 2);
                    
                    -- 1. Transaction for the professional who did it
                    INSERT INTO public.financial_transactions (
                        patient_id, appointment_id, type, status, amount,
                        description, due_date, paid_at, payment_method,
                        split_type, shared_with_id, split_amount, created_by
                    ) VALUES (
                        NEW.patient_id, NEW.id, 'income', 'paid', v_proc.base_price,
                        'Procedimento: ' || v_proc.name || ' (Original)',
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
                        NEW.patient_id, NEW.id, 'income', 'paid', v_proc.base_price,
                        'Procedimento: ' || v_proc.name || ' (Cópia)',
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
                        NEW.patient_id, NEW.id, 'income', 'paid', v_proc.base_price,
                        'Procedimento: ' || v_proc.name,
                        CURRENT_DATE, CURRENT_DATE, 'pix',
                        '100_percent', NEW.created_by, v_proc.base_price, NEW.created_by
                    );
                END IF;
            ELSE
                -- OWN PATIENT
                INSERT INTO public.financial_transactions (
                    patient_id, appointment_id, type, status, amount,
                    description, due_date, paid_at, payment_method,
                    split_type, shared_with_id, split_amount, created_by
                ) VALUES (
                    NEW.patient_id, NEW.id, 'income', 'paid', v_proc.base_price,
                    'Procedimento: ' || v_proc.name,
                    CURRENT_DATE, CURRENT_DATE, 'pix',
                    '100_percent', NEW.professional_id, v_proc.base_price, NEW.professional_id
                );
            END IF;
        END IF;
    END LOOP;

  -- If the appointment goes from completed to something else, remove the auto-generated transactions
  ELSIF NEW.status != 'completed' AND OLD.status = 'completed' THEN
    DELETE FROM public.financial_transactions
    WHERE appointment_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;
