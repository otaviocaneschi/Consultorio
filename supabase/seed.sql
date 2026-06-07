-- =============================================================================
-- Local development seed (runs after migrations via supabase db reset)
-- Core reference data (roles, clinic, procedures) is in 00005_seed_data.sql
-- =============================================================================

-- Optional: create a local admin user for development.
-- Uncomment and adjust credentials before running `supabase db reset`.
--
-- INSERT INTO auth.users (
--   id,
--   instance_id,
--   aud,
--   role,
--   email,
--   encrypted_password,
--   email_confirmed_at,
--   raw_app_meta_data,
--   raw_user_meta_data,
--   created_at,
--   updated_at,
--   confirmation_token,
--   recovery_token
-- ) VALUES (
--   '00000000-0000-0000-0000-000000000001',
--   '00000000-0000-0000-0000-000000000000',
--   'authenticated',
--   'authenticated',
--   'admin@clinica.local',
--   crypt('admin123456', gen_salt('bf')),
--   now(),
--   '{"provider": "email", "providers": ["email"]}'::jsonb,
--   '{"full_name": "Administrador Local"}'::jsonb,
--   now(),
--   now(),
--   '',
--   ''
-- );
--
-- UPDATE public.profiles
-- SET role_id = (SELECT id FROM public.roles WHERE name = 'admin')
-- WHERE id = '00000000-0000-0000-0000-000000000001';

-- Sample patients for local UI testing (safe to delete in production)
INSERT INTO public.patients (
  full_name,
  cpf,
  birth_date,
  gender,
  email,
  phone,
  address_city,
  address_state,
  is_active
)
SELECT
  v.full_name,
  v.cpf,
  v.birth_date,
  v.gender,
  v.email,
  v.phone,
  v.address_city,
  v.address_state,
  v.is_active
FROM (
  VALUES
    (
      'Ana Paula Silva',
      '529.982.247-25',
      DATE '1985-03-15',
      'female'::public.gender_type,
      'ana.silva@example.com',
      '(11) 98765-4321',
      'São Paulo',
      'SP',
      true
    ),
    (
      'Carlos Eduardo Santos',
      '390.533.447-05',
      DATE '1978-07-22',
      'male'::public.gender_type,
      'carlos.santos@example.com',
      '(11) 97654-3210',
      'São Paulo',
      'SP',
      true
    ),
    (
      'Mariana Costa Oliveira',
      '153.509.460-00',
      DATE '1992-11-08',
      'female'::public.gender_type,
      'mariana.oliveira@example.com',
      '(11) 96543-2109',
      'Guarulhos',
      'SP',
      true
    )
) AS v (
  full_name,
  cpf,
  birth_date,
  gender,
  email,
  phone,
  address_city,
  address_state,
  is_active
)
WHERE NOT EXISTS (
  SELECT 1 FROM public.patients p WHERE p.cpf = v.cpf
);

-- Mark overdue check function available for manual/cron invocation
SELECT public.check_overdue_transactions();
