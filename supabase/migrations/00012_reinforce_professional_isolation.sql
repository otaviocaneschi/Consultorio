-- =============================================================================
-- Migration: Reinforce professional data isolation
-- Purpose: 
-- 1. Financial transactions: professionals only see their own (created_by)
--    or transactions shared with them (shared_with_id).
-- 2. Keep patient isolation via primary_dentist_id (from migration 00009).
-- 3. Ensure appointments RLS consistently filters by professional_id.
-- =============================================================================

-- 1. Financial transactions: professional only sees own + shared
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
      OR created_by = auth.uid()
      OR shared_with_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "financial_transactions_update" ON public.financial_transactions;
CREATE POLICY "financial_transactions_update"
  ON public.financial_transactions
  FOR UPDATE
  TO authenticated
  USING (
    public.is_staff()
    AND public.has_permission('financial', 'update')
    AND (
      public.is_admin()
      OR public.get_user_role() = 'receptionist'
      OR created_by = auth.uid()
    )
  )
  WITH CHECK (
    public.is_staff()
    AND public.has_permission('financial', 'update')
    AND (
      public.is_admin()
      OR public.get_user_role() = 'receptionist'
      OR created_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS "financial_transactions_delete" ON public.financial_transactions;
CREATE POLICY "financial_transactions_delete"
  ON public.financial_transactions
  FOR DELETE
  TO authenticated
  USING (
    public.is_staff()
    AND public.has_permission('financial', 'delete')
    AND (
      public.is_admin()
      OR created_by = auth.uid()
    )
  );

-- =============================================================================
-- 2. Procedures: add owner_id for per-professional isolation
-- =============================================================================

-- Add owner_id column (nullable initially for migration)
ALTER TABLE public.procedures
  ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES public.profiles (id) ON DELETE CASCADE;

-- Remove the global unique constraint on name (each professional can have same-named procedures)
ALTER TABLE public.procedures
  DROP CONSTRAINT IF EXISTS procedures_name_unique;

-- Add a unique constraint per owner instead
ALTER TABLE public.procedures
  ADD CONSTRAINT procedures_name_per_owner_unique UNIQUE (owner_id, name);

-- Create index for owner_id lookups
CREATE INDEX IF NOT EXISTS idx_procedures_owner_id ON public.procedures (owner_id);

-- Update RLS: professional only sees their own procedures
DROP POLICY IF EXISTS "procedures_select" ON public.procedures;
CREATE POLICY "procedures_select"
  ON public.procedures
  FOR SELECT
  TO authenticated
  USING (
    public.is_staff()
    AND public.has_permission('procedures', 'read')
    AND (
      public.is_admin()
      OR public.get_user_role() = 'receptionist'
      OR owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "procedures_insert" ON public.procedures;
CREATE POLICY "procedures_insert"
  ON public.procedures
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_staff()
    AND public.has_permission('procedures', 'create')
    AND (
      public.is_admin()
      OR owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "procedures_update" ON public.procedures;
CREATE POLICY "procedures_update"
  ON public.procedures
  FOR UPDATE
  TO authenticated
  USING (
    public.is_staff()
    AND public.has_permission('procedures', 'update')
    AND (
      public.is_admin()
      OR owner_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_staff()
    AND public.has_permission('procedures', 'update')
    AND (
      public.is_admin()
      OR owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "procedures_delete" ON public.procedures;
CREATE POLICY "procedures_delete"
  ON public.procedures
  FOR DELETE
  TO authenticated
  USING (
    public.is_staff()
    AND public.has_permission('procedures', 'delete')
    AND (
      public.is_admin()
      OR owner_id = auth.uid()
    )
  );

-- =============================================================================
-- 3. Materials: add owner_id for per-professional isolation
-- =============================================================================

-- Add owner_id column
ALTER TABLE public.materials
  ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES public.profiles (id) ON DELETE CASCADE;

-- Remove the global unique constraint on name
ALTER TABLE public.materials
  DROP CONSTRAINT IF EXISTS materials_name_unique;

-- Add unique constraint per owner
ALTER TABLE public.materials
  ADD CONSTRAINT materials_name_per_owner_unique UNIQUE (owner_id, name);

-- Create index
CREATE INDEX IF NOT EXISTS idx_materials_owner_id ON public.materials (owner_id);

-- Update RLS: professional only sees their own materials
DROP POLICY IF EXISTS "materials_select" ON public.materials;
CREATE POLICY "materials_select"
  ON public.materials
  FOR SELECT
  TO authenticated
  USING (
    public.is_staff()
    AND (
      public.is_admin()
      OR public.get_user_role() = 'receptionist'
      OR owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "materials_insert" ON public.materials;
CREATE POLICY "materials_insert"
  ON public.materials
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_staff()
    AND (
      public.is_admin()
      OR owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "materials_update" ON public.materials;
CREATE POLICY "materials_update"
  ON public.materials
  FOR UPDATE
  TO authenticated
  USING (
    public.is_staff()
    AND (
      public.is_admin()
      OR owner_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_staff()
    AND (
      public.is_admin()
      OR owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "materials_delete" ON public.materials;
CREATE POLICY "materials_delete"
  ON public.materials
  FOR DELETE
  TO authenticated
  USING (
    public.is_staff()
    AND (
      public.is_admin()
      OR owner_id = auth.uid()
    )
  );
