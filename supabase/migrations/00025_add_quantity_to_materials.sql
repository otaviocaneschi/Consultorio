-- =============================================================================
-- Migration 00025: Add quantity to appointment_materials
-- =============================================================================

ALTER TABLE public.appointment_materials
ADD COLUMN quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0);

COMMENT ON COLUMN public.appointment_materials.quantity IS 'Quantity of the material used in the appointment.';
