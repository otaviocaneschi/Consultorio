-- =============================================================================
-- Migration: Update professional permissions for appointments
-- Purpose: Allow professionals to create and update their own appointments
-- =============================================================================

UPDATE public.roles
SET permissions = jsonb_set(
  permissions,
  '{appointments}',
  '{"read": true, "create": true, "update": true, "delete": false}'::jsonb
)
WHERE name = 'professional';
