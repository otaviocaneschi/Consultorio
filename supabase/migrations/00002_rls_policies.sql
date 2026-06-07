-- =============================================================================
-- Row Level Security Policies
-- Authorization via profiles.role_id + roles.permissions JSONB
-- =============================================================================

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.name
  FROM public.profiles p
  INNER JOIN public.roles r ON r.id = p.role_id
  WHERE p.id = auth.uid()
    AND p.is_active = true;
$$;

COMMENT ON FUNCTION public.get_user_role() IS
  'Returns the active role name for the current authenticated user.';

CREATE OR REPLACE FUNCTION public.has_permission(p_module TEXT, p_action TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT (r.permissions -> p_module ->> p_action)::boolean
      FROM public.profiles p
      INNER JOIN public.roles r ON r.id = p.role_id
      WHERE p.id = auth.uid()
        AND p.is_active = true
    ),
    false
  );
$$;

COMMENT ON FUNCTION public.has_permission(TEXT, TEXT) IS
  'Checks roles.permissions JSONB for module.action (e.g. patients.read).';

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_user_role() = 'admin';
$$;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_user_role() IS NOT NULL;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_permission(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff() TO authenticated;

-- =============================================================================
-- ENABLE RLS ON ALL TABLES
-- =============================================================================

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_record_procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_record_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- ROLES
-- =============================================================================

CREATE POLICY "roles_select_staff"
  ON public.roles
  FOR SELECT
  TO authenticated
  USING (public.is_staff());

CREATE POLICY "roles_manage_admin"
  ON public.roles
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =============================================================================
-- PROFILES
-- =============================================================================

CREATE POLICY "profiles_select_staff"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    public.is_staff()
    AND (
      public.is_admin()
      OR public.has_permission('users', 'read')
      OR id = auth.uid()
    )
  );

CREATE POLICY "profiles_insert_admin"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin() OR public.has_permission('users', 'create'));

CREATE POLICY "profiles_update_admin_or_self"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (
    public.is_admin()
    OR public.has_permission('users', 'update')
    OR id = auth.uid()
  )
  WITH CHECK (
    public.is_admin()
    OR public.has_permission('users', 'update')
    OR (
      id = auth.uid()
      AND role_id = (SELECT role_id FROM public.profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "profiles_delete_admin"
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING (public.is_admin() OR public.has_permission('users', 'delete'));

-- =============================================================================
-- CLINIC SETTINGS
-- =============================================================================

CREATE POLICY "clinic_settings_select_staff"
  ON public.clinic_settings
  FOR SELECT
  TO authenticated
  USING (public.is_staff() AND public.has_permission('settings', 'read'));

CREATE POLICY "clinic_settings_manage_admin"
  ON public.clinic_settings
  FOR ALL
  TO authenticated
  USING (public.is_admin() OR public.has_permission('settings', 'update'))
  WITH CHECK (public.is_admin() OR public.has_permission('settings', 'update'));

-- =============================================================================
-- PATIENTS
-- =============================================================================

CREATE POLICY "patients_select"
  ON public.patients
  FOR SELECT
  TO authenticated
  USING (public.is_staff() AND public.has_permission('patients', 'read'));

CREATE POLICY "patients_insert"
  ON public.patients
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_staff() AND public.has_permission('patients', 'create'));

CREATE POLICY "patients_update"
  ON public.patients
  FOR UPDATE
  TO authenticated
  USING (public.is_staff() AND public.has_permission('patients', 'update'))
  WITH CHECK (public.is_staff() AND public.has_permission('patients', 'update'));

CREATE POLICY "patients_delete"
  ON public.patients
  FOR DELETE
  TO authenticated
  USING (public.is_staff() AND public.has_permission('patients', 'delete'));

-- =============================================================================
-- PROCEDURES
-- =============================================================================

CREATE POLICY "procedures_select"
  ON public.procedures
  FOR SELECT
  TO authenticated
  USING (public.is_staff() AND public.has_permission('procedures', 'read'));

CREATE POLICY "procedures_insert"
  ON public.procedures
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_staff() AND public.has_permission('procedures', 'create'));

CREATE POLICY "procedures_update"
  ON public.procedures
  FOR UPDATE
  TO authenticated
  USING (public.is_staff() AND public.has_permission('procedures', 'update'))
  WITH CHECK (public.is_staff() AND public.has_permission('procedures', 'update'));

CREATE POLICY "procedures_delete"
  ON public.procedures
  FOR DELETE
  TO authenticated
  USING (public.is_staff() AND public.has_permission('procedures', 'delete'));

-- =============================================================================
-- APPOINTMENTS
-- =============================================================================

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
    )
  );

CREATE POLICY "appointments_insert"
  ON public.appointments
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_staff() AND public.has_permission('appointments', 'create'));

CREATE POLICY "appointments_update"
  ON public.appointments
  FOR UPDATE
  TO authenticated
  USING (
    public.is_staff()
    AND public.has_permission('appointments', 'update')
    AND (
      public.is_admin()
      OR public.get_user_role() = 'receptionist'
      OR professional_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_staff()
    AND public.has_permission('appointments', 'update')
  );

CREATE POLICY "appointments_delete"
  ON public.appointments
  FOR DELETE
  TO authenticated
  USING (public.is_staff() AND public.has_permission('appointments', 'delete'));

-- =============================================================================
-- MEDICAL RECORDS
-- =============================================================================

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
    )
  );

CREATE POLICY "medical_records_insert"
  ON public.medical_records
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_staff()
    AND public.has_permission('medical_records', 'create')
    AND (
      public.is_admin()
      OR professional_id = auth.uid()
    )
  );

CREATE POLICY "medical_records_update"
  ON public.medical_records
  FOR UPDATE
  TO authenticated
  USING (
    public.is_staff()
    AND public.has_permission('medical_records', 'update')
    AND (
      public.is_admin()
      OR professional_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_staff()
    AND public.has_permission('medical_records', 'update')
  );

CREATE POLICY "medical_records_delete"
  ON public.medical_records
  FOR DELETE
  TO authenticated
  USING (public.is_admin() AND public.has_permission('medical_records', 'delete'));

-- =============================================================================
-- MEDICAL RECORD PROCEDURES
-- =============================================================================

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
        )
    )
  );

CREATE POLICY "medical_record_procedures_insert"
  ON public.medical_record_procedures
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_staff()
    AND public.has_permission('medical_records', 'create')
    AND EXISTS (
      SELECT 1
      FROM public.medical_records mr
      WHERE mr.id = medical_record_id
        AND (public.is_admin() OR mr.professional_id = auth.uid())
    )
  );

CREATE POLICY "medical_record_procedures_update"
  ON public.medical_record_procedures
  FOR UPDATE
  TO authenticated
  USING (
    public.is_staff()
    AND public.has_permission('medical_records', 'update')
    AND EXISTS (
      SELECT 1
      FROM public.medical_records mr
      WHERE mr.id = medical_record_id
        AND (public.is_admin() OR mr.professional_id = auth.uid())
    )
  )
  WITH CHECK (public.is_staff() AND public.has_permission('medical_records', 'update'));

CREATE POLICY "medical_record_procedures_delete"
  ON public.medical_record_procedures
  FOR DELETE
  TO authenticated
  USING (
    public.is_admin()
    AND public.has_permission('medical_records', 'delete')
  );

-- =============================================================================
-- MEDICAL RECORD ATTACHMENTS
-- =============================================================================

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
        )
    )
  );

CREATE POLICY "medical_record_attachments_insert"
  ON public.medical_record_attachments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_staff()
    AND public.has_permission('medical_records', 'create')
    AND EXISTS (
      SELECT 1
      FROM public.medical_records mr
      WHERE mr.id = medical_record_id
        AND (public.is_admin() OR mr.professional_id = auth.uid())
    )
  );

CREATE POLICY "medical_record_attachments_update"
  ON public.medical_record_attachments
  FOR UPDATE
  TO authenticated
  USING (
    public.is_staff()
    AND public.has_permission('medical_records', 'update')
    AND EXISTS (
      SELECT 1
      FROM public.medical_records mr
      WHERE mr.id = medical_record_id
        AND (public.is_admin() OR mr.professional_id = auth.uid())
    )
  )
  WITH CHECK (public.is_staff() AND public.has_permission('medical_records', 'update'));

CREATE POLICY "medical_record_attachments_delete"
  ON public.medical_record_attachments
  FOR DELETE
  TO authenticated
  USING (
    public.is_admin()
    AND public.has_permission('medical_records', 'delete')
  );

-- =============================================================================
-- FINANCIAL TRANSACTIONS
-- =============================================================================

CREATE POLICY "financial_transactions_select"
  ON public.financial_transactions
  FOR SELECT
  TO authenticated
  USING (public.is_staff() AND public.has_permission('financial', 'read'));

CREATE POLICY "financial_transactions_insert"
  ON public.financial_transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_staff() AND public.has_permission('financial', 'create'));

CREATE POLICY "financial_transactions_update"
  ON public.financial_transactions
  FOR UPDATE
  TO authenticated
  USING (public.is_staff() AND public.has_permission('financial', 'update'))
  WITH CHECK (public.is_staff() AND public.has_permission('financial', 'update'));

CREATE POLICY "financial_transactions_delete"
  ON public.financial_transactions
  FOR DELETE
  TO authenticated
  USING (public.is_staff() AND public.has_permission('financial', 'delete'));

-- =============================================================================
-- NOTIFICATIONS
-- =============================================================================

CREATE POLICY "notifications_select_own"
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (
    public.is_staff()
    AND public.has_permission('notifications', 'read')
    AND (
      public.is_admin()
      OR user_id = auth.uid()
    )
  );

CREATE POLICY "notifications_insert"
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_staff()
    AND (
      public.is_admin()
      OR public.has_permission('notifications', 'create')
    )
  );

CREATE POLICY "notifications_update_own"
  ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (
    public.is_staff()
    AND public.has_permission('notifications', 'update')
    AND (public.is_admin() OR user_id = auth.uid())
  )
  WITH CHECK (
    public.is_staff()
    AND (public.is_admin() OR user_id = auth.uid())
  );

CREATE POLICY "notifications_delete"
  ON public.notifications
  FOR DELETE
  TO authenticated
  USING (
    public.is_staff()
    AND (
      public.is_admin()
      OR (public.has_permission('notifications', 'delete') AND user_id = auth.uid())
    )
  );

-- =============================================================================
-- AUDIT LOGS (read-only for admin)
-- =============================================================================

CREATE POLICY "audit_logs_select_admin"
  ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (public.is_admin() AND public.has_permission('audit_logs', 'read'));

CREATE POLICY "audit_logs_insert_system"
  ON public.audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_staff());

-- =============================================================================
-- STORAGE BUCKETS
-- =============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'patient-photos',
    'patient-photos',
    false,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
  ),
  (
    'medical-attachments',
    'medical-attachments',
    false,
    10485760,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']::text[]
  ),
  (
    'clinic-assets',
    'clinic-assets',
    true,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']::text[]
  )
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- STORAGE POLICIES - patient-photos
-- =============================================================================

CREATE POLICY "patient_photos_select"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'patient-photos'
    AND public.is_staff()
    AND public.has_permission('patients', 'read')
  );

CREATE POLICY "patient_photos_insert"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'patient-photos'
    AND public.is_staff()
    AND public.has_permission('patients', 'update')
  );

CREATE POLICY "patient_photos_update"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'patient-photos'
    AND public.is_staff()
    AND public.has_permission('patients', 'update')
  )
  WITH CHECK (
    bucket_id = 'patient-photos'
    AND public.is_staff()
    AND public.has_permission('patients', 'update')
  );

CREATE POLICY "patient_photos_delete"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'patient-photos'
    AND public.is_staff()
    AND (
      public.is_admin()
      OR public.has_permission('patients', 'delete')
    )
  );

-- =============================================================================
-- STORAGE POLICIES - medical-attachments
-- =============================================================================

CREATE POLICY "medical_attachments_select"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'medical-attachments'
    AND public.is_staff()
    AND public.has_permission('medical_records', 'read')
  );

CREATE POLICY "medical_attachments_insert"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'medical-attachments'
    AND public.is_staff()
    AND public.has_permission('medical_records', 'create')
  );

CREATE POLICY "medical_attachments_update"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'medical-attachments'
    AND public.is_staff()
    AND public.has_permission('medical_records', 'update')
  )
  WITH CHECK (
    bucket_id = 'medical-attachments'
    AND public.is_staff()
    AND public.has_permission('medical_records', 'update')
  );

CREATE POLICY "medical_attachments_delete"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'medical-attachments'
    AND public.is_staff()
    AND (
      public.is_admin()
      OR public.has_permission('medical_records', 'delete')
    )
  );

-- =============================================================================
-- STORAGE POLICIES - clinic-assets (public read, admin write)
-- =============================================================================

CREATE POLICY "clinic_assets_select_public"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'clinic-assets');

CREATE POLICY "clinic_assets_insert_admin"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'clinic-assets'
    AND public.is_admin()
    AND public.has_permission('settings', 'update')
  );

CREATE POLICY "clinic_assets_update_admin"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'clinic-assets'
    AND public.is_admin()
    AND public.has_permission('settings', 'update')
  )
  WITH CHECK (
    bucket_id = 'clinic-assets'
    AND public.is_admin()
    AND public.has_permission('settings', 'update')
  );

CREATE POLICY "clinic_assets_delete_admin"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'clinic-assets'
    AND public.is_admin()
    AND public.has_permission('settings', 'update')
  );
