-- =============================================================================
-- Seed Data - Roles, Clinic Settings, Default Procedures
-- =============================================================================

-- =============================================================================
-- ROLES
-- =============================================================================

INSERT INTO public.roles (name, display_name, description, permissions)
VALUES
  (
    'admin',
    'Administrador',
    'Acesso total ao sistema da clínica.',
    '{
      "patients":         {"read": true,  "create": true,  "update": true,  "delete": true},
      "appointments":     {"read": true,  "create": true,  "update": true,  "delete": true},
      "medical_records":  {"read": true,  "create": true,  "update": true,  "delete": true},
      "financial":        {"read": true,  "create": true,  "update": true,  "delete": true},
      "procedures":       {"read": true,  "create": true,  "update": true,  "delete": true},
      "settings":         {"read": true,  "create": true,  "update": true,  "delete": true},
      "users":            {"read": true,  "create": true,  "update": true,  "delete": true},
      "notifications":    {"read": true,  "create": true,  "update": true,  "delete": true},
      "audit_logs":       {"read": true,  "create": false, "update": false, "delete": false}
    }'::jsonb
  ),
  (
    'receptionist',
    'Recepcionista',
    'Gestão de pacientes, agendamentos e financeiro.',
    '{
      "patients":         {"read": true,  "create": true,  "update": true,  "delete": false},
      "appointments":     {"read": true,  "create": true,  "update": true,  "delete": false},
      "medical_records":  {"read": true,  "create": false, "update": false, "delete": false},
      "financial":        {"read": true,  "create": true,  "update": true,  "delete": false},
      "procedures":       {"read": true,  "create": false, "update": false, "delete": false},
      "settings":         {"read": true,  "create": false, "update": false, "delete": false},
      "users":            {"read": true,  "create": false, "update": false, "delete": false},
      "notifications":    {"read": true,  "create": true,  "update": true,  "delete": true},
      "audit_logs":       {"read": false, "create": false, "update": false, "delete": false}
    }'::jsonb
  ),
  (
    'professional',
    'Profissional',
    'Atendimento clínico, prontuários e consultas próprias.',
    '{
      "patients":         {"read": true,  "create": false, "update": true,  "delete": false},
      "appointments":     {"read": true,  "create": false, "update": true,  "delete": false},
      "medical_records":  {"read": true,  "create": true,  "update": true,  "delete": false},
      "financial":        {"read": false, "create": false, "update": false, "delete": false},
      "procedures":       {"read": true,  "create": false, "update": false, "delete": false},
      "settings":         {"read": true,  "create": false, "update": false, "delete": false},
      "users":            {"read": false, "create": false, "update": false, "delete": false},
      "notifications":    {"read": true,  "create": false, "update": true,  "delete": true},
      "audit_logs":       {"read": false, "create": false, "update": false, "delete": false}
    }'::jsonb
  )
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  permissions = EXCLUDED.permissions,
  updated_at = now();

-- =============================================================================
-- CLINIC SETTINGS
-- =============================================================================

INSERT INTO public.clinic_settings (
  clinic_name,
  trade_name,
  address_city,
  address_state,
  phone,
  whatsapp,
  email,
  working_hours,
  default_appointment_duration,
  timezone,
  currency,
  appointment_reminder_days,
  return_visit_days
)
SELECT
  'Marcela Caneschi - Ozonioterapia e Laserterapia',
  'Clínica Marcela Caneschi',
  'São Paulo',
  'SP',
  NULL,
  NULL,
  NULL,
  '{
    "monday":    {"open": "08:00", "close": "18:00", "enabled": true},
    "tuesday":   {"open": "08:00", "close": "18:00", "enabled": true},
    "wednesday": {"open": "08:00", "close": "18:00", "enabled": true},
    "thursday":  {"open": "08:00", "close": "18:00", "enabled": true},
    "friday":    {"open": "08:00", "close": "18:00", "enabled": true},
    "saturday":  {"open": "08:00", "close": "12:00", "enabled": false},
    "sunday":    {"open": null,      "close": null,    "enabled": false}
  }'::jsonb,
  60,
  'America/Sao_Paulo',
  'BRL',
  1,
  30
WHERE NOT EXISTS (SELECT 1 FROM public.clinic_settings);

-- =============================================================================
-- DEFAULT PROCEDURES
-- =============================================================================

INSERT INTO public.procedures (name, description, category, duration_minutes, base_price, is_active)
VALUES
  (
    'Ozonioterapia',
    'Tratamento com ozônio medicinal para diversas condições clínicas.',
    'ozonioterapy',
    60,
    250.00,
    true
  ),
  (
    'Laserterapia',
    'Tratamento com laser de baixa intensidade para reabilitação e alívio de dor.',
    'lasertherapy',
    45,
    200.00,
    true
  ),
  (
    'Avaliação Inicial',
    'Consulta de avaliação inicial do paciente com anamnese completa.',
    'evaluation',
    60,
    150.00,
    true
  ),
  (
    'Sessão de Retorno',
    'Consulta de acompanhamento e continuidade do tratamento.',
    'follow_up',
    45,
    180.00,
    true
  )
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  duration_minutes = EXCLUDED.duration_minutes,
  base_price = EXCLUDED.base_price,
  is_active = EXCLUDED.is_active,
  updated_at = now();
