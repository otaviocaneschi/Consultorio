-- =============================================================================
-- Migration 00023: Move materials from medical records to appointments
-- =============================================================================
-- The users requested the ability to log materials directly on the appointment
-- rather than in the clinical medical record. This table stores the link
-- between appointments and materials used.
-- =============================================================================

CREATE TABLE public.appointment_materials (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id    UUID        NOT NULL REFERENCES public.appointments (id) ON DELETE CASCADE,
  material_id       UUID        NOT NULL REFERENCES public.materials (id) ON DELETE RESTRICT,
  cost_at_time      NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (cost_at_time >= 0),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT appointment_materials_unique UNIQUE (appointment_id, material_id)
);

COMMENT ON TABLE public.appointment_materials IS 'Materials used during an appointment.';

ALTER TABLE public.appointment_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "appointment_materials_select"
  ON public.appointment_materials FOR SELECT TO authenticated
  USING (public.is_staff());

CREATE POLICY "appointment_materials_insert"
  ON public.appointment_materials FOR INSERT TO authenticated
  WITH CHECK (public.is_staff());

CREATE POLICY "appointment_materials_update"
  ON public.appointment_materials FOR UPDATE TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());

CREATE POLICY "appointment_materials_delete"
  ON public.appointment_materials FOR DELETE TO authenticated
  USING (public.is_staff());
