-- =============================================================================
-- SEED: Dados de teste realistas
-- Roda como ADMIN no SQL Editor do Supabase
-- =============================================================================
-- =============================================================================
-- IMPORTANTE: Este script busca IDs dinamicamente.
-- Ele detecta automaticamente Ana, Marcela e os procedimentos cadastrados.
-- ATENÇÃO: ELE VAI APAGAR TODOS OS PACIENTES E AGENDAMENTOS EXISTENTES!
-- =============================================================================

-- Limpeza de todos os dados de pacientes, atendimentos e transações
TRUNCATE TABLE 
  public.financial_transactions,
  public.medical_records,
  public.appointments,
  public.patients
RESTART IDENTITY CASCADE;

DO $$
DECLARE
  -- Profissionais
  v_ana_id       UUID;
  v_marcela_id   UUID;

  -- Procedimentos (buscados por nome)
  v_proc_curativo      UUID;
  v_proc_avaliacao     UUID;
  v_proc_botox         UUID;
  v_proc_laser         UUID;
  v_proc_ozonio        UUID;
  v_proc_prfprp        UUID;
  v_proc_retorno       UUID;

  -- Pacientes criados
  v_p1  UUID; v_p2  UUID; v_p3  UUID; v_p4  UUID; v_p5  UUID;
  v_p6  UUID; v_p7  UUID; v_p8  UUID; v_p9  UUID; v_p10 UUID;
  v_p11 UUID; v_p12 UUID; v_p13 UUID; v_p14 UUID; v_p15 UUID;

BEGIN
  -- ═══════════════════════════════════════════════════════════════════════════
  -- 1. Buscar IDs dos profissionais
  -- ═══════════════════════════════════════════════════════════════════════════
  SELECT id INTO v_ana_id     FROM public.profiles WHERE full_name ILIKE '%Ana%'     LIMIT 1;
  SELECT id INTO v_marcela_id FROM public.profiles WHERE full_name ILIKE '%Marcela%' LIMIT 1;

  IF v_ana_id IS NULL OR v_marcela_id IS NULL THEN
    RAISE EXCEPTION 'Não encontrei Ana e/ou Marcela nos profiles. Verifique os nomes.';
  END IF;

  -- ═══════════════════════════════════════════════════════════════════════════
  -- 2. Buscar IDs dos procedimentos
  -- ═══════════════════════════════════════════════════════════════════════════
  SELECT id INTO v_proc_curativo  FROM public.procedures WHERE name ILIKE '%Curativo%'          LIMIT 1;
  SELECT id INTO v_proc_avaliacao FROM public.procedures WHERE name ILIKE '%Avalia%Inicial%'    LIMIT 1;
  SELECT id INTO v_proc_botox     FROM public.procedures WHERE name ILIKE '%Botox%'             LIMIT 1;
  SELECT id INTO v_proc_laser     FROM public.procedures WHERE name ILIKE '%Laser%'             LIMIT 1;
  SELECT id INTO v_proc_ozonio    FROM public.procedures WHERE name ILIKE '%Ozon%'              LIMIT 1;
  SELECT id INTO v_proc_prfprp    FROM public.procedures WHERE name ILIKE '%PRF%'               LIMIT 1;
  SELECT id INTO v_proc_retorno   FROM public.procedures WHERE name ILIKE '%Retorno%'           LIMIT 1;

  -- ═══════════════════════════════════════════════════════════════════════════
  -- 3. Criar pacientes
  -- ═══════════════════════════════════════════════════════════════════════════

  -- ── Pacientes da ANA (primary_dentist_id = Ana) ──
  INSERT INTO public.patients (full_name, phone, birth_date, gender, email, primary_dentist_id, created_by)
  VALUES ('Lucas Oliveira Santos', '11987651234', '1990-03-15', 'male', 'lucas.santos@email.com', v_ana_id, v_ana_id)
  RETURNING id INTO v_p1;

  INSERT INTO public.patients (full_name, phone, birth_date, gender, email, primary_dentist_id, created_by)
  VALUES ('Maria Fernanda Silva', '11976543210', '1985-07-22', 'female', 'maria.silva@email.com', v_ana_id, v_ana_id)
  RETURNING id INTO v_p2;

  INSERT INTO public.patients (full_name, phone, birth_date, gender, email, primary_dentist_id, created_by)
  VALUES ('João Pedro Almeida', '11965432109', '2000-01-10', 'male', 'joao.almeida@email.com', v_ana_id, v_ana_id)
  RETURNING id INTO v_p3;

  INSERT INTO public.patients (full_name, phone, birth_date, gender, email, primary_dentist_id, created_by)
  VALUES ('Beatriz Souza Lima', '11954321098', '1978-11-05', 'female', 'bia.lima@email.com', v_ana_id, v_ana_id)
  RETURNING id INTO v_p4;

  INSERT INTO public.patients (full_name, phone, birth_date, gender, email, primary_dentist_id, created_by)
  VALUES ('Roberto Carlos Mendes', '11943210987', '1965-05-20', 'male', 'roberto.mendes@email.com', v_ana_id, v_ana_id)
  RETURNING id INTO v_p5;

  -- ── Pacientes da MARCELA (primary_dentist_id = Marcela) ──
  INSERT INTO public.patients (full_name, phone, birth_date, gender, email, primary_dentist_id, created_by)
  VALUES ('Camila Rodrigues Costa', '21987654321', '1992-09-18', 'female', 'camila.costa@email.com', v_marcela_id, v_marcela_id)
  RETURNING id INTO v_p6;

  INSERT INTO public.patients (full_name, phone, birth_date, gender, email, primary_dentist_id, created_by)
  VALUES ('André Luiz Pereira', '21976543210', '1988-04-30', 'male', 'andre.pereira@email.com', v_marcela_id, v_marcela_id)
  RETURNING id INTO v_p7;

  INSERT INTO public.patients (full_name, phone, birth_date, gender, email, primary_dentist_id, created_by)
  VALUES ('Isabela Martins Rocha', '21965432109', '1995-12-03', 'female', 'isabela.rocha@email.com', v_marcela_id, v_marcela_id)
  RETURNING id INTO v_p8;

  INSERT INTO public.patients (full_name, phone, birth_date, gender, email, primary_dentist_id, created_by)
  VALUES ('Fernando Souza Neto', '21954321098', '1970-08-14', 'male', 'fernando.neto@email.com', v_marcela_id, v_marcela_id)
  RETURNING id INTO v_p9;

  INSERT INTO public.patients (full_name, phone, birth_date, gender, email, primary_dentist_id, created_by)
  VALUES ('Larissa Gomes Dias', '21943210987', '2001-06-25', 'female', 'larissa.dias@email.com', v_marcela_id, v_marcela_id)
  RETURNING id INTO v_p10;

  -- ── Pacientes COMPARTILHADOS (primary_dentist_id = NULL) ──
  INSERT INTO public.patients (full_name, phone, birth_date, gender, email, primary_dentist_id, created_by)
  VALUES ('Rafael Henrique Mori', '11998765432', '1993-02-28', 'male', 'rafael.mori@email.com', NULL, v_ana_id)
  RETURNING id INTO v_p11;

  INSERT INTO public.patients (full_name, phone, birth_date, gender, email, primary_dentist_id, created_by)
  VALUES ('Juliana Prado Ferreira', '11988654321', '1987-10-12', 'female', 'juliana.ferreira@email.com', NULL, v_marcela_id)
  RETURNING id INTO v_p12;

  INSERT INTO public.patients (full_name, phone, birth_date, gender, email, primary_dentist_id, created_by)
  VALUES ('Carlos Eduardo Braga', '21997654321', '1975-04-07', 'male', 'carlos.braga@email.com', NULL, v_ana_id)
  RETURNING id INTO v_p13;

  INSERT INTO public.patients (full_name, phone, birth_date, gender, email, primary_dentist_id, created_by)
  VALUES ('Patrícia Vieira Lopes', '21986543210', '1998-01-19', 'female', 'patricia.lopes@email.com', NULL, v_marcela_id)
  RETURNING id INTO v_p14;

  INSERT INTO public.patients (full_name, phone, birth_date, gender, email, primary_dentist_id, created_by)
  VALUES ('Thiago Nascimento Reis', '11977654321', '1982-07-30', 'male', 'thiago.reis@email.com', NULL, v_ana_id)
  RETURNING id INTO v_p15;

  -- ═══════════════════════════════════════════════════════════════════════════
  -- 4. Criar agendamentos
  -- ═══════════════════════════════════════════════════════════════════════════
  -- Datas: maio e junho de 2026, com vários status

  -- ────────────────────────────────────────
  -- ANA: Atendimentos concluídos (maio)
  -- ────────────────────────────────────────
  INSERT INTO public.appointments (patient_id, professional_id, procedure_id, scheduled_at, duration_minutes, status, notes, created_by)
  VALUES
    (v_p1, v_ana_id, v_proc_avaliacao, '2026-05-05 09:00:00-03', 60, 'completed', 'Primeira consulta do Lucas', v_ana_id),
    (v_p2, v_ana_id, v_proc_curativo,  '2026-05-08 10:00:00-03', 60, 'completed', 'Curativo pós-operatório', v_ana_id),
    (v_p3, v_ana_id, v_proc_laser,     '2026-05-12 14:00:00-03', 45, 'completed', 'Sessão de laserterapia', v_ana_id),
    (v_p4, v_ana_id, v_proc_ozonio,    '2026-05-15 11:00:00-03', 60, 'completed', 'Ozonioterapia - 3ª sessão', v_ana_id),
    (v_p1, v_ana_id, v_proc_retorno,   '2026-05-20 09:00:00-03', 45, 'completed', 'Retorno do Lucas', v_ana_id);

  -- ANA: Atendimentos concluídos (junho)
  INSERT INTO public.appointments (patient_id, professional_id, procedure_id, scheduled_at, duration_minutes, status, notes, created_by)
  VALUES
    (v_p2, v_ana_id, v_proc_laser,     '2026-06-02 10:00:00-03', 45, 'completed', 'Laser para Maria Fernanda', v_ana_id),
    (v_p5, v_ana_id, v_proc_avaliacao, '2026-06-05 09:00:00-03', 60, 'completed', 'Avaliação inicial Roberto', v_ana_id),
    (v_p3, v_ana_id, v_proc_curativo,  '2026-06-09 14:00:00-03', 60, 'completed', 'Curativo João Pedro', v_ana_id);

  -- ANA: Atendimentos cancelados
  INSERT INTO public.appointments (patient_id, professional_id, procedure_id, scheduled_at, duration_minutes, status, cancellation_reason, cancelled_at, created_by)
  VALUES
    (v_p4, v_ana_id, v_proc_botox,     '2026-06-03 15:00:00-03', 60, 'cancelled', 'Paciente desmarcou por motivos pessoais', '2026-06-02 18:00:00-03', v_ana_id),
    (v_p5, v_ana_id, v_proc_ozonio,    '2026-05-25 10:00:00-03', 60, 'cancelled', 'Reagendado para próxima semana', '2026-05-24 09:00:00-03', v_ana_id);

  -- ANA: Atendimentos pendentes/confirmados (futuro)
  INSERT INTO public.appointments (patient_id, professional_id, procedure_id, scheduled_at, duration_minutes, status, notes, created_by)
  VALUES
    (v_p1, v_ana_id, v_proc_laser,     '2026-06-13 09:00:00-03', 45, 'confirmed', 'Sessão de laser agendada', v_ana_id),
    (v_p4, v_ana_id, v_proc_botox,     '2026-06-16 14:00:00-03', 60, 'pending', 'Botox reagendado', v_ana_id),
    (v_p5, v_ana_id, v_proc_ozonio,    '2026-06-18 10:00:00-03', 60, 'pending', 'Ozonioterapia Roberto', v_ana_id);

  -- ────────────────────────────────────────
  -- MARCELA: Atendimentos concluídos (maio)
  -- ────────────────────────────────────────
  INSERT INTO public.appointments (patient_id, professional_id, procedure_id, scheduled_at, duration_minutes, status, notes, created_by)
  VALUES
    (v_p6,  v_marcela_id, v_proc_avaliacao, '2026-05-06 09:00:00-03', 60, 'completed', 'Primeira consulta Camila', v_marcela_id),
    (v_p7,  v_marcela_id, v_proc_botox,     '2026-05-10 10:00:00-03', 60, 'completed', 'Botox André', v_marcela_id),
    (v_p8,  v_marcela_id, v_proc_laser,     '2026-05-14 14:00:00-03', 45, 'completed', 'Laser Isabela', v_marcela_id),
    (v_p9,  v_marcela_id, v_proc_curativo,  '2026-05-19 11:00:00-03', 60, 'completed', 'Curativo Fernando', v_marcela_id),
    (v_p6,  v_marcela_id, v_proc_retorno,   '2026-05-22 09:00:00-03', 45, 'completed', 'Retorno Camila', v_marcela_id);

  -- MARCELA: Atendimentos concluídos (junho)
  INSERT INTO public.appointments (patient_id, professional_id, procedure_id, scheduled_at, duration_minutes, status, notes, created_by)
  VALUES
    (v_p7,  v_marcela_id, v_proc_ozonio,    '2026-06-03 10:00:00-03', 60, 'completed', 'Ozônio André', v_marcela_id),
    (v_p10, v_marcela_id, v_proc_avaliacao, '2026-06-06 09:00:00-03', 60, 'completed', 'Avaliação Larissa', v_marcela_id),
    (v_p8,  v_marcela_id, v_proc_curativo,  '2026-06-10 14:00:00-03', 60, 'completed', 'Curativo Isabela', v_marcela_id);

  -- MARCELA: Atendimentos cancelados
  INSERT INTO public.appointments (patient_id, professional_id, procedure_id, scheduled_at, duration_minutes, status, cancellation_reason, cancelled_at, created_by)
  VALUES
    (v_p9,  v_marcela_id, v_proc_laser,  '2026-06-04 15:00:00-03', 45, 'cancelled', 'Paciente não compareceu', '2026-06-04 15:30:00-03', v_marcela_id),
    (v_p10, v_marcela_id, v_proc_botox,  '2026-05-28 10:00:00-03', 60, 'cancelled', 'Desmarcou - viagem', '2026-05-27 16:00:00-03', v_marcela_id);

  -- MARCELA: Atendimentos pendentes/confirmados (futuro)
  INSERT INTO public.appointments (patient_id, professional_id, procedure_id, scheduled_at, duration_minutes, status, notes, created_by)
  VALUES
    (v_p6,  v_marcela_id, v_proc_laser,  '2026-06-13 10:00:00-03', 45, 'confirmed', 'Laser Camila', v_marcela_id),
    (v_p9,  v_marcela_id, v_proc_ozonio, '2026-06-17 14:00:00-03', 60, 'pending', 'Ozônio Fernando', v_marcela_id),
    (v_p10, v_marcela_id, v_proc_botox,  '2026-06-19 10:00:00-03', 60, 'pending', 'Botox Larissa', v_marcela_id);

  -- ────────────────────────────────────────
  -- COMPARTILHADOS: Atendimentos concluídos
  -- (o trigger vai criar transações para AMBAS profissionais com 50%)
  -- ────────────────────────────────────────
  -- ANA atende pacientes compartilhados
  INSERT INTO public.appointments (patient_id, professional_id, procedure_id, scheduled_at, duration_minutes, status, notes, created_by)
  VALUES
    (v_p11, v_ana_id, v_proc_curativo,  '2026-05-07 09:00:00-03', 60, 'completed', 'Curativo Rafael (compartilhado)', v_ana_id),
    (v_p13, v_ana_id, v_proc_avaliacao, '2026-06-04 11:00:00-03', 60, 'completed', 'Avaliação Carlos Eduardo (compartilhado)', v_ana_id),
    (v_p15, v_ana_id, v_proc_laser,     '2026-06-11 14:00:00-03', 45, 'completed', 'Laser Thiago (compartilhado)', v_ana_id);

  -- MARCELA atende pacientes compartilhados
  INSERT INTO public.appointments (patient_id, professional_id, procedure_id, scheduled_at, duration_minutes, status, notes, created_by)
  VALUES
    (v_p12, v_marcela_id, v_proc_botox,     '2026-05-09 10:00:00-03', 60, 'completed', 'Botox Juliana (compartilhado)', v_marcela_id),
    (v_p14, v_marcela_id, v_proc_ozonio,    '2026-06-05 09:00:00-03', 60, 'completed', 'Ozônio Patrícia (compartilhado)', v_marcela_id),
    (v_p11, v_marcela_id, v_proc_avaliacao, '2026-06-08 10:00:00-03', 60, 'completed', 'Avaliação Rafael (compartilhado)', v_marcela_id);

  -- Compartilhados: pendentes/futuros
  INSERT INTO public.appointments (patient_id, professional_id, procedure_id, scheduled_at, duration_minutes, status, notes, created_by)
  VALUES
    (v_p12, v_ana_id,     v_proc_retorno, '2026-06-14 09:00:00-03', 45, 'confirmed', 'Retorno Juliana', v_ana_id),
    (v_p14, v_marcela_id, v_proc_laser,   '2026-06-15 14:00:00-03', 45, 'pending', 'Laser Patrícia', v_marcela_id);

  -- ═══════════════════════════════════════════════════════════════════════════
  -- 5. Despesas da clínica (o trigger auto_share_expense duplica 50/50)
  -- ═══════════════════════════════════════════════════════════════════════════
  -- Basta inserir UMA VEZ — o trigger cria a cópia para a outra profissional

  INSERT INTO public.financial_transactions (type, status, amount, description, due_date, paid_at, payment_method, created_by)
  VALUES
    ('expense', 'paid', 3500.00, 'Aluguel - Junho 2026',           '2026-06-01', '2026-06-01 10:00:00-03', 'bank_transfer', v_ana_id),
    ('expense', 'paid',  280.00, 'Conta de Luz - Maio 2026',       '2026-06-05', '2026-06-05 09:00:00-03', 'bank_transfer', v_ana_id),
    ('expense', 'paid',  150.00, 'Conta de Água - Maio 2026',      '2026-06-05', '2026-06-05 09:30:00-03', 'bank_transfer', v_marcela_id),
    ('expense', 'paid',  450.00, 'Material de consumo',            '2026-06-03', '2026-06-03 14:00:00-03', 'credit_card', v_marcela_id),
    ('expense', 'paid',  200.00, 'Internet e Telefone',            '2026-06-10', '2026-06-10 08:00:00-03', 'bank_transfer', v_ana_id),
    ('expense', 'pending', 120.00, 'Produtos de limpeza',          '2026-06-15', NULL, NULL, v_marcela_id),
    ('expense', 'pending', 800.00, 'Manutenção do equipamento',    '2026-06-20', NULL, NULL, v_ana_id);

  RAISE NOTICE '✅ Seed concluído com sucesso!';
  RAISE NOTICE '   → 15 pacientes criados (5 Ana, 5 Marcela, 5 compartilhados)';
  RAISE NOTICE '   → ~30 agendamentos (concluídos, cancelados, pendentes, confirmados)';
  RAISE NOTICE '   → 7 despesas (5 pagas, 2 pendentes)';
  RAISE NOTICE '   → Transações de receita serão criadas automaticamente pelo trigger!';

END $$;
