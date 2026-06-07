-- =============================================================================
-- Triggers and Functions
-- =============================================================================

-- =============================================================================
-- UPDATED_AT TRIGGER
-- =============================================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_roles_updated_at
  BEFORE UPDATE ON public.roles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_clinic_settings_updated_at
  BEFORE UPDATE ON public.clinic_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_patients_updated_at
  BEFORE UPDATE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_procedures_updated_at
  BEFORE UPDATE ON public.procedures
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_medical_records_updated_at
  BEFORE UPDATE ON public.medical_records
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_financial_transactions_updated_at
  BEFORE UPDATE ON public.financial_transactions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- APPOINTMENT: sync completed_at and patient last_appointment
-- =============================================================================

CREATE OR REPLACE FUNCTION public.sync_appointment_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'completed' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'completed') THEN
    NEW.completed_at = COALESCE(NEW.completed_at, now());
  ELSIF NEW.status <> 'completed' AND OLD.status = 'completed' THEN
    NEW.completed_at = NULL;
  END IF;

  IF NEW.status = 'cancelled' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'cancelled') THEN
    NEW.cancelled_at = COALESCE(NEW.cancelled_at, now());
  ELSIF NEW.status <> 'cancelled' THEN
    NEW.cancelled_at = NULL;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_appointments_sync_completion
  BEFORE INSERT OR UPDATE OF status, completed_at, cancelled_at ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.sync_appointment_completion();

CREATE OR REPLACE FUNCTION public.update_patient_last_appointment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'completed'
     AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'completed') THEN
    UPDATE public.patients
    SET last_appointment_at = COALESCE(NEW.completed_at, NEW.scheduled_at, now())
    WHERE id = NEW.patient_id
      AND (
        last_appointment_at IS NULL
        OR last_appointment_at < COALESCE(NEW.completed_at, NEW.scheduled_at, now())
      );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_appointments_update_patient_last
  AFTER INSERT OR UPDATE OF status, completed_at, scheduled_at ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_patient_last_appointment();

-- =============================================================================
-- APPOINTMENT NOTIFICATIONS
-- =============================================================================

CREATE OR REPLACE FUNCTION public.generate_appointment_notifications()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_patient_name TEXT;
  v_procedure_name TEXT;
  v_reminder_days INTEGER;
  v_reminder_at TIMESTAMPTZ;
BEGIN
  SELECT p.full_name INTO v_patient_name
  FROM public.patients p
  WHERE p.id = NEW.patient_id;

  SELECT pr.name INTO v_procedure_name
  FROM public.procedures pr
  WHERE pr.id = NEW.procedure_id;

  SELECT cs.appointment_reminder_days INTO v_reminder_days
  FROM public.clinic_settings cs
  LIMIT 1;

  v_reminder_days := COALESCE(v_reminder_days, 1);
  v_reminder_at := NEW.scheduled_at - (v_reminder_days || ' days')::interval;

  -- Confirmation notification for assigned professional
  IF TG_OP = 'INSERT' OR (
    TG_OP = 'UPDATE'
    AND (
      OLD.scheduled_at IS DISTINCT FROM NEW.scheduled_at
      OR OLD.status IS DISTINCT FROM NEW.status
      OR OLD.professional_id IS DISTINCT FROM NEW.professional_id
    )
  ) THEN
    INSERT INTO public.notifications (
      user_id,
      patient_id,
      type,
      title,
      message,
      scheduled_at,
      metadata
    ) VALUES (
      NEW.professional_id,
      NEW.patient_id,
      'appointment_confirmation',
      'Consulta agendada',
      format(
        'Consulta com %s em %s (%s).',
        COALESCE(v_patient_name, 'paciente'),
        to_char(NEW.scheduled_at AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI'),
        COALESCE(v_procedure_name, 'procedimento')
      ),
      NULL,
      jsonb_build_object(
        'appointment_id', NEW.id,
        'scheduled_at', NEW.scheduled_at,
        'status', NEW.status
      )
    );
  END IF;

  -- Reminder notification (scheduled for future delivery)
  IF NEW.status IN ('pending', 'confirmed')
     AND v_reminder_at > now()
     AND (TG_OP = 'INSERT' OR OLD.scheduled_at IS DISTINCT FROM NEW.scheduled_at) THEN
    INSERT INTO public.notifications (
      user_id,
      patient_id,
      type,
      title,
      message,
      scheduled_at,
      metadata
    ) VALUES (
      NEW.professional_id,
      NEW.patient_id,
      'appointment_reminder',
      'Lembrete de consulta',
      format(
        'Consulta com %s amanhã às %s.',
        COALESCE(v_patient_name, 'paciente'),
        to_char(NEW.scheduled_at AT TIME ZONE 'America/Sao_Paulo', 'HH24:MI')
      ),
      v_reminder_at,
      jsonb_build_object(
        'appointment_id', NEW.id,
        'scheduled_at', NEW.scheduled_at
      )
    );
  END IF;

  -- Cancellation notification
  IF TG_OP = 'UPDATE'
     AND NEW.status = 'cancelled'
     AND OLD.status IS DISTINCT FROM 'cancelled' THEN
    INSERT INTO public.notifications (
      user_id,
      patient_id,
      type,
      title,
      message,
      metadata
    ) VALUES (
      NEW.professional_id,
      NEW.patient_id,
      'general',
      'Consulta cancelada',
      format(
        'Consulta com %s em %s foi cancelada. Motivo: %s',
        COALESCE(v_patient_name, 'paciente'),
        to_char(NEW.scheduled_at AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI'),
        COALESCE(NEW.cancellation_reason, 'não informado')
      ),
      jsonb_build_object(
        'appointment_id', NEW.id,
        'cancellation_reason', NEW.cancellation_reason
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_appointments_generate_notifications
  AFTER INSERT OR UPDATE OF scheduled_at, status, professional_id ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.generate_appointment_notifications();

-- =============================================================================
-- OVERDUE TRANSACTIONS
-- =============================================================================

CREATE OR REPLACE FUNCTION public.check_overdue_transactions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated_count INTEGER;
BEGIN
  WITH updated AS (
    UPDATE public.financial_transactions ft
    SET status = 'overdue'
    WHERE ft.status = 'pending'
      AND ft.due_date IS NOT NULL
      AND ft.due_date < CURRENT_DATE
    RETURNING ft.id, ft.patient_id, ft.description, ft.amount, ft.due_date
  ),
  notify AS (
    INSERT INTO public.notifications (
      user_id,
      patient_id,
      type,
      title,
      message,
      metadata
    )
    SELECT
      p.id,
      u.patient_id,
      'payment_overdue',
      'Pagamento em atraso',
      format(
        'Transação "%s" (R$ %s) venceu em %s.',
        u.description,
        to_char(u.amount, 'FM999999990.00'),
        to_char(u.due_date, 'DD/MM/YYYY')
      ),
      jsonb_build_object(
        'transaction_id', u.id,
        'amount', u.amount,
        'due_date', u.due_date
      )
    FROM updated u
    CROSS JOIN public.profiles p
    INNER JOIN public.roles r ON r.id = p.role_id
    WHERE p.is_active = true
      AND r.name IN ('admin', 'receptionist')
      AND NOT EXISTS (
        SELECT 1
        FROM public.notifications n
        WHERE n.type = 'payment_overdue'
          AND n.metadata ->> 'transaction_id' = u.id::text
          AND n.created_at > now() - interval '7 days'
      )
    RETURNING 1
  )
  SELECT count(*)::integer INTO v_updated_count FROM updated;

  RETURN COALESCE(v_updated_count, 0);
END;
$$;

COMMENT ON FUNCTION public.check_overdue_transactions() IS
  'Marks pending transactions past due_date as overdue and creates staff notifications.';

-- Trigger to check overdue on insert/update when due_date is in the past
CREATE OR REPLACE FUNCTION public.check_transaction_overdue_on_write()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'pending'
     AND NEW.due_date IS NOT NULL
     AND NEW.due_date < CURRENT_DATE THEN
    NEW.status = 'overdue';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_financial_transactions_check_overdue
  BEFORE INSERT OR UPDATE OF status, due_date ON public.financial_transactions
  FOR EACH ROW EXECUTE FUNCTION public.check_transaction_overdue_on_write();

-- =============================================================================
-- AUDIT LOG TRIGGER
-- =============================================================================

CREATE OR REPLACE FUNCTION public.audit_log_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_record_id UUID;
  v_old_data JSONB;
  v_new_data JSONB;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_record_id := OLD.id;
    v_old_data := to_jsonb(OLD);
    v_new_data := NULL;
  ELSIF TG_OP = 'INSERT' THEN
    v_record_id := NEW.id;
    v_old_data := NULL;
    v_new_data := to_jsonb(NEW);
  ELSE
    v_record_id := NEW.id;
    v_old_data := to_jsonb(OLD);
    v_new_data := to_jsonb(NEW);
  END IF;

  INSERT INTO public.audit_logs (
    user_id,
    table_name,
    record_id,
    action,
    old_data,
    new_data
  ) VALUES (
    auth.uid(),
    TG_TABLE_NAME,
    v_record_id,
    TG_OP,
    v_old_data,
    v_new_data
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_audit_patients
  AFTER INSERT OR UPDATE OR DELETE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

CREATE TRIGGER trg_audit_appointments
  AFTER INSERT OR UPDATE OR DELETE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

CREATE TRIGGER trg_audit_medical_records
  AFTER INSERT OR UPDATE OR DELETE ON public.medical_records
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

CREATE TRIGGER trg_audit_financial_transactions
  AFTER INSERT OR UPDATE OR DELETE ON public.financial_transactions
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

-- =============================================================================
-- MEDICAL RECORD: validate appointment belongs to patient
-- =============================================================================

CREATE OR REPLACE FUNCTION public.validate_medical_record_appointment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.appointment_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1
      FROM public.appointments a
      WHERE a.id = NEW.appointment_id
        AND a.patient_id = NEW.patient_id
    ) THEN
      RAISE EXCEPTION 'appointment_id does not belong to the specified patient';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_medical_records_validate_appointment
  BEFORE INSERT OR UPDATE OF appointment_id, patient_id ON public.medical_records
  FOR EACH ROW EXECUTE FUNCTION public.validate_medical_record_appointment();

-- =============================================================================
-- NEW USER: create profile on auth signup
-- Role assigned via profiles.role_id (NOT user_metadata)
-- Default role: receptionist — admin must promote users as needed
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_default_role_id UUID;
BEGIN
  SELECT id INTO v_default_role_id
  FROM public.roles
  WHERE name = 'receptionist'
  LIMIT 1;

  IF v_default_role_id IS NULL THEN
    RAISE EXCEPTION 'Default role "receptionist" not found. Run seed migration first.';
  END IF;

  INSERT INTO public.profiles (
    id,
    role_id,
    full_name,
    email,
    is_active
  ) VALUES (
    NEW.id,
    v_default_role_id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    true
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- GRANTS
-- =============================================================================

GRANT EXECUTE ON FUNCTION public.set_updated_at() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.check_overdue_transactions() TO authenticated, service_role;
