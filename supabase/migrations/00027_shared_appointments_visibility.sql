-- =============================================================================
-- Migration 00027: Make shared patients' appointments and records visible to all professionals
-- =============================================================================

-- Update appointments_select
DROP POLICY IF EXISTS "appointments_select" ON public.appointments;
CREATE POLICY "appointments_select"
  ON public.appointments
  FOR SELECT
  TO authenticated
  USING (
    public.is_staff()
    AND public.has_permission('appointments', 'read')
    AND (
      public.is_admin()
      OR public.get_user_role() IN ('receptionist', 'admin')
      OR professional_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.patients p
        WHERE p.id = patient_id
        AND p.primary_dentist_id IS NULL
      )
    )
  );

-- Update medical_records_select
DROP POLICY IF EXISTS "medical_records_select" ON public.medical_records;
CREATE POLICY "medical_records_select"
  ON public.medical_records
  FOR SELECT
  TO authenticated
  USING (
    public.is_staff()
    AND public.has_permission('medical_records', 'read')
    AND (
      public.is_admin()
      OR public.get_user_role() = 'receptionist'
      OR professional_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.patients p
        WHERE p.id = patient_id
        AND p.primary_dentist_id IS NULL
      )
    )
  );

-- Update medical_record_procedures_select
DROP POLICY IF EXISTS "medical_record_procedures_select" ON public.medical_record_procedures;
CREATE POLICY "medical_record_procedures_select"
  ON public.medical_record_procedures
  FOR SELECT
  TO authenticated
  USING (
    public.is_staff()
    AND public.has_permission('medical_records', 'read')
    AND EXISTS (
      SELECT 1
      FROM public.medical_records mr
      WHERE mr.id = medical_record_id
        AND (
          public.is_admin()
          OR public.get_user_role() = 'receptionist'
          OR mr.professional_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.patients p
            WHERE p.id = mr.patient_id
            AND p.primary_dentist_id IS NULL
          )
        )
    )
  );

-- Update medical_record_attachments_select
DROP POLICY IF EXISTS "medical_record_attachments_select" ON public.medical_record_attachments;
CREATE POLICY "medical_record_attachments_select"
  ON public.medical_record_attachments
  FOR SELECT
  TO authenticated
  USING (
    public.is_staff()
    AND public.has_permission('medical_records', 'read')
    AND EXISTS (
      SELECT 1
      FROM public.medical_records mr
      WHERE mr.id = medical_record_id
        AND (
          public.is_admin()
          OR public.get_user_role() = 'receptionist'
          OR mr.professional_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.patients p
            WHERE p.id = mr.patient_id
            AND p.primary_dentist_id IS NULL
          )
        )
    )
  );
