-- =====================================================================
-- RPC create_appointment com Server-Side Capacity Validation
-- Schema: agenda_sobral
-- Versão do app: 2.14.0
-- Data: 2026-07-22
-- CRÍTICA: Resolve race condition (múltiplos usuários simultâneos)
-- =====================================================================

-- ---------------------------------------------------------------
-- Tabela de Agendamentos (nova, para persistência Supabase)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agenda_sobral.appointments (
  id                  uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_code    text          UNIQUE NOT NULL,  -- ex: MUS-024
  department_id       text          NOT NULL,         -- ex: 'musica', 'coworking'
  appointment_date    date          NOT NULL,
  appointment_time    text          NOT NULL,         -- ex: '08:00-10:00'
  num_participants    integer       NOT NULL CHECK (num_participants > 0),
  citizen_name        text          NOT NULL,
  citizen_email       text          NOT NULL,
  citizen_phone       text,
  citizen_cpf_cnpj    text,
  status              text          DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE', 'VALIDADO', 'CONCLUÍDO', 'NAO_COMPARECEU')),
  form_data           jsonb         DEFAULT '{}',     -- perguntas customizadas do formulário
  lgpd_accepted       boolean       DEFAULT false,
  privacy_accepted    boolean       DEFAULT false,
  cookies_accepted    boolean       DEFAULT false,
  consent_id          uuid          REFERENCES agenda_sobral.lgpd_consents(id) ON DELETE SET NULL,
  created_at          timestamptz   DEFAULT now(),
  updated_at          timestamptz   DEFAULT now(),
  approved_at         timestamptz,
  approved_by         text,
  marked_complete_at  timestamptz,
  marked_complete_by  text,
  marked_noshow_at    timestamptz,
  marked_noshow_by    text
);

COMMENT ON TABLE agenda_sobral.appointments IS
  'Agendamentos centralizados com validação server-side de capacidade e status flow.';

-- Índices para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_appointments_date
  ON agenda_sobral.appointments (appointment_date DESC);

CREATE INDEX IF NOT EXISTS idx_appointments_department
  ON agenda_sobral.appointments (department_id);

CREATE INDEX IF NOT EXISTS idx_appointments_status
  ON agenda_sobral.appointments (status);

CREATE INDEX IF NOT EXISTS idx_appointments_email
  ON agenda_sobral.appointments (citizen_email);

CREATE INDEX IF NOT EXISTS idx_appointments_dept_date
  ON agenda_sobral.appointments (department_id, appointment_date);

-- Índice composto para queries de ocupação (pico de pessoas em um horário)
CREATE INDEX IF NOT EXISTS idx_appointments_occupancy
  ON agenda_sobral.appointments (department_id, appointment_date, appointment_time, status)
  WHERE status IN ('PENDENTE', 'VALIDADO', 'CONCLUÍDO');

-- ---------------------------------------------------------------
-- Tabela de Slots (para rastreamento de capacidade e versioning)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agenda_sobral.slots (
  id              uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  department_id   text          NOT NULL,
  slot_date       date          NOT NULL,
  start_time      text          NOT NULL,           -- ex: '08:00'
  end_time        text          NOT NULL,           -- ex: '10:00'
  capacity        integer       NOT NULL,           -- capacidade máxima do departamento
  booked_count    integer       DEFAULT 0,          -- pessoas confirmadas neste slot
  status          text          DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'FULL', 'ARCHIVED')),
  version         bigint        DEFAULT 1,          -- optimistic concurrency control (incrementar a cada mudança)
  created_at      timestamptz   DEFAULT now(),
  updated_at      timestamptz   DEFAULT now(),
  UNIQUE(department_id, slot_date, start_time)
);

COMMENT ON TABLE agenda_sobral.slots IS
  'Rastreamento de ocupação de slots com versioning para optimistic concurrency control.';

CREATE INDEX IF NOT EXISTS idx_slots_available
  ON agenda_sobral.slots (department_id, slot_date, status);

-- ---------------------------------------------------------------
-- RPC: create_appointment com Validação de Capacidade Atômica
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION agenda_sobral.create_appointment(
  p_department_id     text,
  p_appointment_date  date,
  p_appointment_time  text,
  p_num_participants  integer,
  p_citizen_name      text,
  p_citizen_email     text,
  p_citizen_phone     text,
  p_citizen_cpf_cnpj  text,
  p_form_data         jsonb,
  p_lgpd_accepted     boolean DEFAULT false,
  p_privacy_accepted  boolean DEFAULT false,
  p_cookies_accepted  boolean DEFAULT false,
  p_consent_id        uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = agenda_sobral, public
AS $$
DECLARE
  v_appointment_id      uuid;
  v_appointment_code    text;
  v_dept_capacity       integer;
  v_current_occupancy   integer;
  v_slot_id             uuid;
  v_slot_version        bigint;
  v_error_msg           text;
BEGIN
  -- Validação de entrada
  IF p_num_participants <= 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Número de participantes deve ser > 0',
      'code', 'INVALID_PARTICIPANTS'
    );
  END IF;

  IF p_appointment_date < CURRENT_DATE THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Data não pode ser no passado',
      'code', 'INVALID_DATE'
    );
  END IF;

  -- Obter capacidade máxima do departamento
  SELECT CASE p_department_id
    WHEN 'coworking' THEN 70
    WHEN 'linklab' THEN 120
    WHEN 'salatreinamento' THEN 30
    WHEN 'atrio' THEN 150
    WHEN 'musica' THEN 10
    ELSE NULL
  END INTO v_dept_capacity;

  IF v_dept_capacity IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Departamento inválido: ' || p_department_id,
      'code', 'INVALID_DEPARTMENT'
    );
  END IF;

  -- ====== CRÍTICO: Atualizar/criar slot com concorrência controlada ======
  BEGIN
    -- Tentar atualizar slot existente com validação de capacidade
    UPDATE agenda_sobral.slots
    SET
      booked_count = booked_count + p_num_participants,
      version = version + 1,
      updated_at = now(),
      status = CASE
        WHEN (booked_count + p_num_participants) >= capacity THEN 'FULL'
        ELSE 'AVAILABLE'
      END
    WHERE department_id = p_department_id
      AND slot_date = p_appointment_date
      AND start_time = (p_appointment_time)  -- assumindo p_appointment_time = start_time
      AND booked_count + p_num_participants <= capacity  -- *** VALIDAÇÃO CRÍTICA ***
    RETURNING id, version INTO v_slot_id, v_slot_version;

    IF v_slot_id IS NULL THEN
      -- Slot não existe ou está cheio — verificar qual é o caso
      SELECT booked_count, version INTO v_current_occupancy, v_slot_version
      FROM agenda_sobral.slots
      WHERE department_id = p_department_id
        AND slot_date = p_appointment_date
        AND start_time = (p_appointment_time);

      IF v_current_occupancy IS NOT NULL THEN
        -- Slot existe mas está cheio
        RETURN jsonb_build_object(
          'success', false,
          'error', 'Slot cheio: ' || v_current_occupancy || '/' || v_dept_capacity,
          'code', 'SLOT_FULL',
          'occupancy', v_current_occupancy,
          'capacity', v_dept_capacity
        );
      ELSE
        -- Criar novo slot
        INSERT INTO agenda_sobral.slots (department_id, slot_date, start_time, end_time, capacity, booked_count, status)
        VALUES (p_department_id, p_appointment_date, p_appointment_time,
                (p_appointment_time::time + interval '2 hours')::text,  -- default 2h
                v_dept_capacity, p_num_participants, 'AVAILABLE')
        RETURNING id, version INTO v_slot_id, v_slot_version;
      END IF;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_error_msg := SQLERRM;
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Erro ao atualizar slot: ' || v_error_msg,
      'code', 'SLOT_UPDATE_ERROR'
    );
  END;

  -- ====== Criar appointment ======
  BEGIN
    v_appointment_code := p_department_id || '-' || LPAD(NEXTVAL('appointment_seq')::text, 3, '0');

    INSERT INTO agenda_sobral.appointments (
      appointment_code, department_id, appointment_date, appointment_time,
      num_participants, citizen_name, citizen_email, citizen_phone, citizen_cpf_cnpj,
      form_data, lgpd_accepted, privacy_accepted, cookies_accepted, consent_id
    ) VALUES (
      v_appointment_code, p_department_id, p_appointment_date, p_appointment_time,
      p_num_participants, p_citizen_name, p_citizen_email, p_citizen_phone, p_citizen_cpf_cnpj,
      p_form_data, p_lgpd_accepted, p_privacy_accepted, p_cookies_accepted, p_consent_id
    )
    RETURNING id INTO v_appointment_id;

    -- ====== Sucesso: retornar appointment ======
    RETURN jsonb_build_object(
      'success', true,
      'appointment_id', v_appointment_id,
      'appointment_code', v_appointment_code,
      'slot_version', v_slot_version,
      'occupancy', (SELECT booked_count FROM agenda_sobral.slots WHERE id = v_slot_id),
      'capacity', v_dept_capacity,
      'created_at', now()
    );

  EXCEPTION WHEN OTHERS THEN
    v_error_msg := SQLERRM;
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Erro ao criar agendamento: ' || v_error_msg,
      'code', 'APPOINTMENT_CREATE_ERROR'
    );
  END;
END;
$$;

COMMENT ON FUNCTION agenda_sobral.create_appointment IS
  'Cria um novo agendamento com validação atômica de capacidade. Retorna {success, appointment_id, error}.';

-- Sequência para gerar IDs de agendamento
CREATE SEQUENCE IF NOT EXISTS appointment_seq START 1;

-- Permissões
GRANT EXECUTE ON FUNCTION agenda_sobral.create_appointment TO anon, authenticated;

-- ---------------------------------------------------------------
-- RLS (Row-Level Security) para Appointments
-- ---------------------------------------------------------------
ALTER TABLE agenda_sobral.appointments ENABLE ROW LEVEL SECURITY;

-- Cidadãos veem apenas seus próprios agendamentos
CREATE POLICY "appointments_citizen_access"
  ON agenda_sobral.appointments FOR SELECT
  USING (citizen_email = current_user_email() OR current_user_id() IS NULL);

-- Admins (via admin panel autenticado) veem agendamentos de seus departamentos
CREATE POLICY "appointments_admin_access"
  ON agenda_sobral.appointments FOR ALL
  USING (is_admin_for_dept(department_id));

-- Função helper: verificar email do usuário atual (implementar conforme sua auth)
CREATE OR REPLACE FUNCTION current_user_email() RETURNS text AS $$
  SELECT email FROM auth.users WHERE id = auth.uid();
$$ LANGUAGE sql STABLE;

-- Função helper: verificar ID do usuário atual
CREATE OR REPLACE FUNCTION current_user_id() RETURNS uuid AS $$
  SELECT auth.uid();
$$ LANGUAGE sql STABLE;

-- Função helper: verificar se admin (stub — implementar conforme sua auth)
CREATE OR REPLACE FUNCTION is_admin_for_dept(dept_id text) RETURNS boolean AS $$
  SELECT true;  -- TODO: implementar lógica de admin por departamento
$$ LANGUAGE sql STABLE;
