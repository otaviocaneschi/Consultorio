-- =============================================================================
-- Migration 00026: Make materials shared among all staff
-- =============================================================================

-- 1. Drop the old RLS policies that depend on owner_id FIRST
DROP POLICY IF EXISTS "materials_select" ON public.materials;
DROP POLICY IF EXISTS "materials_insert" ON public.materials;
DROP POLICY IF EXISTS "materials_update" ON public.materials;
DROP POLICY IF EXISTS "materials_delete" ON public.materials;

-- 2. Remove per-owner unique constraint
ALTER TABLE public.materials
  DROP CONSTRAINT IF EXISTS materials_name_per_owner_unique;

-- 3. Drop the owner_id column (it is no longer individual)
ALTER TABLE public.materials
  DROP COLUMN IF EXISTS owner_id;

-- 4. Restore global unique constraint on name
ALTER TABLE public.materials
  DROP CONSTRAINT IF EXISTS materials_name_unique;
ALTER TABLE public.materials
  ADD CONSTRAINT materials_name_unique UNIQUE (name);

-- 5. Create new RLS policies so any staff can manage materials
CREATE POLICY "materials_select"
  ON public.materials
  FOR SELECT
  TO authenticated
  USING (public.is_staff());

CREATE POLICY "materials_insert"
  ON public.materials
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_staff());

CREATE POLICY "materials_update"
  ON public.materials
  FOR UPDATE
  TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

CREATE POLICY "materials_delete"
  ON public.materials
  FOR DELETE
  TO authenticated
  USING (public.is_staff());
