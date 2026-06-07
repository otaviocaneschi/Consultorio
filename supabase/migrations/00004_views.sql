-- =============================================================================
-- Reporting Views (security_invoker = true — respects RLS of calling user)
-- =============================================================================

CREATE OR REPLACE VIEW public.v_dashboard_stats
WITH (security_invoker = true)
AS
SELECT
  (SELECT count(*) FROM public.patients WHERE is_active = true) AS active_patients,
  (SELECT count(*) FROM public.patients) AS total_patients,
  (
    SELECT count(*)
    FROM public.appointments a
    WHERE a.scheduled_at >= date_trunc('day', now())
      AND a.scheduled_at < date_trunc('day', now()) + interval '1 day'
      AND a.status NOT IN ('cancelled', 'no_show')
  ) AS appointments_today,
  (
    SELECT count(*)
    FROM public.appointments a
    WHERE a.status = 'pending'
      AND a.scheduled_at >= now()
  ) AS pending_appointments,
  (
    SELECT count(*)
    FROM public.appointments a
    WHERE a.status = 'completed'
      AND a.completed_at >= date_trunc('month', now())
  ) AS completed_appointments_month,
  (
    SELECT COALESCE(sum(ft.amount), 0)
    FROM public.financial_transactions ft
    WHERE ft.type = 'income'
      AND ft.status IN ('paid', 'partial')
      AND ft.paid_at >= date_trunc('month', now())
  ) AS revenue_month,
  (
    SELECT COALESCE(sum(ft.amount), 0)
    FROM public.financial_transactions ft
    WHERE ft.type = 'expense'
      AND ft.status IN ('paid', 'partial')
      AND ft.paid_at >= date_trunc('month', now())
  ) AS expenses_month,
  (
    SELECT count(*)
    FROM public.financial_transactions ft
    WHERE ft.status IN ('pending', 'overdue')
      AND ft.type = 'income'
  ) AS pending_receivables,
  (
    SELECT COALESCE(sum(ft.amount), 0)
    FROM public.financial_transactions ft
    WHERE ft.status IN ('pending', 'overdue')
      AND ft.type = 'income'
  ) AS pending_receivables_amount,
  (
    SELECT count(*)
    FROM public.notifications n
    WHERE n.user_id = auth.uid()
      AND n.is_read = false
  ) AS unread_notifications;

COMMENT ON VIEW public.v_dashboard_stats IS
  'Aggregated KPIs for the clinic dashboard.';

-- -----------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.v_appointments_today
WITH (security_invoker = true)
AS
SELECT
  a.id,
  a.scheduled_at,
  a.duration_minutes,
  a.status,
  a.notes,
  p.id AS patient_id,
  p.full_name AS patient_name,
  p.phone AS patient_phone,
  p.photo_url AS patient_photo_url,
  pr.id AS professional_id,
  pr.full_name AS professional_name,
  proc.id AS procedure_id,
  proc.name AS procedure_name,
  proc.category AS procedure_category
FROM public.appointments a
INNER JOIN public.patients p ON p.id = a.patient_id
INNER JOIN public.profiles pr ON pr.id = a.professional_id
LEFT JOIN public.procedures proc ON proc.id = a.procedure_id
WHERE a.scheduled_at >= date_trunc('day', now())
  AND a.scheduled_at < date_trunc('day', now()) + interval '1 day'
ORDER BY a.scheduled_at ASC;

COMMENT ON VIEW public.v_appointments_today IS
  'Today''s appointments with patient and professional details.';

-- -----------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.v_monthly_revenue
WITH (security_invoker = true)
AS
SELECT
  date_trunc('month', ft.paid_at) AS month,
  ft.type,
  count(*) AS transaction_count,
  COALESCE(sum(ft.amount), 0) AS total_amount
FROM public.financial_transactions ft
WHERE ft.status IN ('paid', 'partial')
  AND ft.paid_at IS NOT NULL
GROUP BY date_trunc('month', ft.paid_at), ft.type
ORDER BY month DESC, ft.type;

COMMENT ON VIEW public.v_monthly_revenue IS
  'Monthly income and expense totals from paid transactions.';

-- -----------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.v_top_procedures
WITH (security_invoker = true)
AS
SELECT
  proc.id AS procedure_id,
  proc.name AS procedure_name,
  proc.category,
  count(DISTINCT a.id) AS appointment_count,
  count(DISTINCT mrp.medical_record_id) AS medical_record_count,
  COALESCE(sum(mrp.quantity), 0) AS total_performed,
  COALESCE(sum(mrp.quantity * COALESCE(mrp.unit_price, proc.base_price)), 0) AS estimated_revenue
FROM public.procedures proc
LEFT JOIN public.appointments a ON a.procedure_id = proc.id AND a.status = 'completed'
LEFT JOIN public.medical_record_procedures mrp ON mrp.procedure_id = proc.id
GROUP BY proc.id, proc.name, proc.category
ORDER BY total_performed DESC, appointment_count DESC;

COMMENT ON VIEW public.v_top_procedures IS
  'Most performed procedures by appointments and medical records.';

-- -----------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.v_patients_without_return
WITH (security_invoker = true)
AS
SELECT
  p.id AS patient_id,
  p.full_name,
  p.phone,
  p.email,
  p.last_appointment_at,
  (
    SELECT max(a.scheduled_at)
    FROM public.appointments a
    WHERE a.patient_id = p.id
      AND a.status = 'completed'
  ) AS last_completed_appointment,
  (
    SELECT cs.return_visit_days
    FROM public.clinic_settings cs
    LIMIT 1
  ) AS return_visit_days,
  EXTRACT(DAY FROM (
    now() - COALESCE(
      p.last_appointment_at,
      (
        SELECT max(a.scheduled_at)
        FROM public.appointments a
        WHERE a.patient_id = p.id AND a.status = 'completed'
      )
    )
  ))::integer AS days_since_last_visit
FROM public.patients p
WHERE p.is_active = true
  AND COALESCE(
    p.last_appointment_at,
    (
      SELECT max(a.scheduled_at)
      FROM public.appointments a
      WHERE a.patient_id = p.id AND a.status = 'completed'
    )
  ) IS NOT NULL
  AND COALESCE(
    p.last_appointment_at,
    (
      SELECT max(a.scheduled_at)
      FROM public.appointments a
      WHERE a.patient_id = p.id AND a.status = 'completed'
    )
  ) < now() - (
    COALESCE(
      (SELECT cs.return_visit_days FROM public.clinic_settings cs LIMIT 1),
      30
    ) || ' days'
  )::interval
  AND NOT EXISTS (
    SELECT 1
    FROM public.appointments a
    WHERE a.patient_id = p.id
      AND a.status IN ('pending', 'confirmed', 'in_progress')
      AND a.scheduled_at >= now()
  )
ORDER BY days_since_last_visit DESC;

COMMENT ON VIEW public.v_patients_without_return IS
  'Active patients overdue for a return visit with no upcoming appointments.';

-- -----------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.v_upcoming_birthdays
WITH (security_invoker = true)
AS
SELECT
  p.id AS patient_id,
  p.full_name,
  p.phone,
  p.email,
  p.birth_date,
  EXTRACT(YEAR FROM age(p.birth_date))::integer AS age,
  (
    CASE
      WHEN make_date(
        EXTRACT(YEAR FROM CURRENT_DATE)::integer,
        EXTRACT(MONTH FROM p.birth_date)::integer,
        LEAST(
          EXTRACT(DAY FROM p.birth_date)::integer,
          EXTRACT(DAY FROM (
            date_trunc('month', make_date(
              EXTRACT(YEAR FROM CURRENT_DATE)::integer,
              EXTRACT(MONTH FROM p.birth_date)::integer,
              1
            )) + interval '1 month - 1 day'
          ))::integer
        )
      ) >= CURRENT_DATE
      THEN make_date(
        EXTRACT(YEAR FROM CURRENT_DATE)::integer,
        EXTRACT(MONTH FROM p.birth_date)::integer,
        LEAST(
          EXTRACT(DAY FROM p.birth_date)::integer,
          EXTRACT(DAY FROM (
            date_trunc('month', make_date(
              EXTRACT(YEAR FROM CURRENT_DATE)::integer,
              EXTRACT(MONTH FROM p.birth_date)::integer,
              1
            )) + interval '1 month - 1 day'
          ))::integer
        )
      )
      ELSE make_date(
        EXTRACT(YEAR FROM CURRENT_DATE)::integer + 1,
        EXTRACT(MONTH FROM p.birth_date)::integer,
        LEAST(
          EXTRACT(DAY FROM p.birth_date)::integer,
          EXTRACT(DAY FROM (
            date_trunc('month', make_date(
              EXTRACT(YEAR FROM CURRENT_DATE)::integer + 1,
              EXTRACT(MONTH FROM p.birth_date)::integer,
              1
            )) + interval '1 month - 1 day'
          ))::integer
        )
      )
    END
  ) AS next_birthday,
  (
    CASE
      WHEN make_date(
        EXTRACT(YEAR FROM CURRENT_DATE)::integer,
        EXTRACT(MONTH FROM p.birth_date)::integer,
        LEAST(
          EXTRACT(DAY FROM p.birth_date)::integer,
          EXTRACT(DAY FROM (
            date_trunc('month', make_date(
              EXTRACT(YEAR FROM CURRENT_DATE)::integer,
              EXTRACT(MONTH FROM p.birth_date)::integer,
              1
            )) + interval '1 month - 1 day'
          ))::integer
        )
      ) >= CURRENT_DATE
      THEN make_date(
        EXTRACT(YEAR FROM CURRENT_DATE)::integer,
        EXTRACT(MONTH FROM p.birth_date)::integer,
        LEAST(
          EXTRACT(DAY FROM p.birth_date)::integer,
          EXTRACT(DAY FROM (
            date_trunc('month', make_date(
              EXTRACT(YEAR FROM CURRENT_DATE)::integer,
              EXTRACT(MONTH FROM p.birth_date)::integer,
              1
            )) + interval '1 month - 1 day'
          ))::integer
        )
      )
      ELSE make_date(
        EXTRACT(YEAR FROM CURRENT_DATE)::integer + 1,
        EXTRACT(MONTH FROM p.birth_date)::integer,
        LEAST(
          EXTRACT(DAY FROM p.birth_date)::integer,
          EXTRACT(DAY FROM (
            date_trunc('month', make_date(
              EXTRACT(YEAR FROM CURRENT_DATE)::integer + 1,
              EXTRACT(MONTH FROM p.birth_date)::integer,
              1
            )) + interval '1 month - 1 day'
          ))::integer
        )
      )
    END - CURRENT_DATE
  ) AS days_until_birthday
FROM public.patients p
WHERE p.is_active = true
  AND p.birth_date IS NOT NULL
  AND (
    CASE
      WHEN make_date(
        EXTRACT(YEAR FROM CURRENT_DATE)::integer,
        EXTRACT(MONTH FROM p.birth_date)::integer,
        LEAST(
          EXTRACT(DAY FROM p.birth_date)::integer,
          EXTRACT(DAY FROM (
            date_trunc('month', make_date(
              EXTRACT(YEAR FROM CURRENT_DATE)::integer,
              EXTRACT(MONTH FROM p.birth_date)::integer,
              1
            )) + interval '1 month - 1 day'
          ))::integer
        )
      ) >= CURRENT_DATE
      THEN make_date(
        EXTRACT(YEAR FROM CURRENT_DATE)::integer,
        EXTRACT(MONTH FROM p.birth_date)::integer,
        LEAST(
          EXTRACT(DAY FROM p.birth_date)::integer,
          EXTRACT(DAY FROM (
            date_trunc('month', make_date(
              EXTRACT(YEAR FROM CURRENT_DATE)::integer,
              EXTRACT(MONTH FROM p.birth_date)::integer,
              1
            )) + interval '1 month - 1 day'
          ))::integer
        )
      )
      ELSE make_date(
        EXTRACT(YEAR FROM CURRENT_DATE)::integer + 1,
        EXTRACT(MONTH FROM p.birth_date)::integer,
        LEAST(
          EXTRACT(DAY FROM p.birth_date)::integer,
          EXTRACT(DAY FROM (
            date_trunc('month', make_date(
              EXTRACT(YEAR FROM CURRENT_DATE)::integer + 1,
              EXTRACT(MONTH FROM p.birth_date)::integer,
              1
            )) + interval '1 month - 1 day'
          ))::integer
        )
      )
    END - CURRENT_DATE
  ) BETWEEN 0 AND 30
ORDER BY days_until_birthday ASC, p.full_name ASC;

COMMENT ON VIEW public.v_upcoming_birthdays IS
  'Patient birthdays within the next 30 days.';

-- =============================================================================
-- GRANTS
-- =============================================================================

GRANT SELECT ON public.v_dashboard_stats TO authenticated;
GRANT SELECT ON public.v_appointments_today TO authenticated;
GRANT SELECT ON public.v_monthly_revenue TO authenticated;
GRANT SELECT ON public.v_top_procedures TO authenticated;
GRANT SELECT ON public.v_patients_without_return TO authenticated;
GRANT SELECT ON public.v_upcoming_birthdays TO authenticated;
