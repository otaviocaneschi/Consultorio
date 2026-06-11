-- =============================================================================
-- Migration: Isolate patients and fix profiles visibility
-- Purpose: 
-- 1. Ensure professionals only see their own patients or shared patients.
-- 2. Allow all staff to read basic profiles to fix 'Partilhado' bug on joined queries.
-- =============================================================================

-- 1. Fix profiles visibility so staff can see each other's names (needed for dropdowns and joins)
DROP POLICY IF EXISTS "profiles_select_staff" ON public.profiles;
CREATE POLICY "profiles_select_staff"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.is_staff());

-- 2. Isolate patients so professionals only see their own or shared patients
DROP POLICY IF EXISTS "patients_select" ON public.patients;
CREATE POLICY "patients_select"
  ON public.patients
  FOR SELECT
  TO authenticated
  USING (
    public.is_staff() 
    AND public.has_permission('patients', 'read')
    AND (
      public.is_admin()
      OR public.get_user_role() = 'receptionist'
      OR primary_dentist_id IS NULL
      OR primary_dentist_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "patients_update" ON public.patients;
CREATE POLICY "patients_update"
  ON public.patients
  FOR UPDATE
  TO authenticated
  USING (
    public.is_staff() 
    AND public.has_permission('patients', 'update')
    AND (
      public.is_admin()
      OR public.get_user_role() = 'receptionist'
      OR primary_dentist_id IS NULL
      OR primary_dentist_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_staff() 
    AND public.has_permission('patients', 'update')
    AND (
      public.is_admin()
      OR public.get_user_role() = 'receptionist'
      OR primary_dentist_id IS NULL
      OR primary_dentist_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "patients_delete" ON public.patients;
CREATE POLICY "patients_delete"
  ON public.patients
  FOR DELETE
  TO authenticated
  USING (
    public.is_staff() 
    AND public.has_permission('patients', 'delete')
    AND (
      public.is_admin()
      OR public.get_user_role() = 'receptionist'
      OR primary_dentist_id IS NULL
      OR primary_dentist_id = auth.uid()
    )
  );
