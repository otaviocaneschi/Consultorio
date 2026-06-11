-- =============================================================================
-- Migration: Update professional permissions
-- Purpose: Allow professionals to create and delete their own/shared patients
-- =============================================================================

UPDATE public.roles
SET permissions = jsonb_set(
  permissions,
  '{patients}',
  '{"read": true, "create": true, "update": true, "delete": true}'::jsonb
)
WHERE name = 'professional';
