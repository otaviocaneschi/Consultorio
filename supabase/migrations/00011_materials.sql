-- =============================================================================
-- Migration: Add Materials Control
-- Purpose: Track materials and their costs during appointments
-- =============================================================================

CREATE TABLE public.materials (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  cost        NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (cost >= 0),
  is_active   BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT materials_name_unique UNIQUE (name)
);

COMMENT ON TABLE public.materials IS 'Catalog of materials and their costs.';

CREATE TABLE public.medical_record_materials (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  medical_record_id UUID        NOT NULL REFERENCES public.medical_records (id) ON DELETE CASCADE,
  material_id       UUID        NOT NULL REFERENCES public.materials (id) ON DELETE RESTRICT,
  cost_at_time      NUMERIC(10, 2) NOT NULL CHECK (cost_at_time >= 0),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT medical_record_materials_unique UNIQUE (medical_record_id, material_id)
);

COMMENT ON TABLE public.medical_record_materials IS 'Materials used during a medical record entry.';

-- RLS
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_record_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "materials_select"
  ON public.materials FOR SELECT TO authenticated
  USING (public.is_staff());

CREATE POLICY "materials_insert"
  ON public.materials FOR INSERT TO authenticated
  WITH CHECK (public.is_staff());

CREATE POLICY "materials_update"
  ON public.materials FOR UPDATE TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());

CREATE POLICY "materials_delete"
  ON public.materials FOR DELETE TO authenticated
  USING (public.is_staff());

CREATE POLICY "medical_record_materials_select"
  ON public.medical_record_materials FOR SELECT TO authenticated
  USING (public.is_staff());

CREATE POLICY "medical_record_materials_insert"
  ON public.medical_record_materials FOR INSERT TO authenticated
  WITH CHECK (public.is_staff());

CREATE POLICY "medical_record_materials_update"
  ON public.medical_record_materials FOR UPDATE TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());

CREATE POLICY "medical_record_materials_delete"
  ON public.medical_record_materials FOR DELETE TO authenticated
  USING (public.is_staff());

-- Give roles permissions to manage materials and stock module? We don't have a specific module in permissions JSON, but staff can manage it based on RLS directly.
