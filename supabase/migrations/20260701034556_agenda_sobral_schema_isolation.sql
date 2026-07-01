-- Agenda Sobral - schema isolado para Supabase self-hosted no EasyPanel.
-- Modelo de acesso:
-- - usuario: agenda em qualquer secretaria/equipamento, mas ve apenas seus dados.
-- - secretaria/departamento: ve e opera apenas seus departamentos/equipamentos.
-- - equipamento/colaborador: ve e opera apenas seus equipamentos vinculados.
-- - super_admin: opera toda a base Agenda Sobral.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE SCHEMA IF NOT EXISTS agenda_sobral;

GRANT USAGE ON SCHEMA agenda_sobral TO anon, authenticated, service_role;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'agenda_sobral' AND t.typname = 'app_role'
  ) THEN
    CREATE TYPE agenda_sobral.app_role AS ENUM (
      'super_admin',
      'secretaria_admin',
      'departamento_admin',
      'equipamento_admin',
      'colaborador',
      'usuario'
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'agenda_sobral' AND t.typname = 'appointment_status'
  ) THEN
    CREATE TYPE agenda_sobral.appointment_status AS ENUM (
      'confirmado',
      'validado',
      'em_atendimento',
      'atendido',
      'cancelado',
      'falta'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS agenda_sobral.users (
  id BIGSERIAL PRIMARY KEY,
  auth_user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  role agenda_sobral.app_role NOT NULL DEFAULT 'usuario',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  full_name TEXT,
  cpf TEXT,
  phone TEXT,
  profile_data JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique_idx
  ON agenda_sobral.users (lower(email))
  WHERE email IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS users_cpf_unique_idx
  ON agenda_sobral.users (regexp_replace(cpf, '\D', '', 'g'))
  WHERE cpf IS NOT NULL AND regexp_replace(cpf, '\D', '', 'g') <> '';

CREATE INDEX IF NOT EXISTS users_auth_user_id_idx ON agenda_sobral.users (auth_user_id);
CREATE INDEX IF NOT EXISTS users_role_status_idx ON agenda_sobral.users (role, status);

CREATE TABLE IF NOT EXISTS agenda_sobral.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  acronym TEXT,
  portal_url TEXT,
  color TEXT,
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (external_id ~ '^[a-z0-9][a-z0-9_-]*$'),
  CHECK (slug ~ '^[a-z0-9][a-z0-9_-]*$')
);

CREATE TABLE IF NOT EXISTS agenda_sobral.equipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID NOT NULL REFERENCES agenda_sobral.departments(id) ON DELETE RESTRICT,
  external_id TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  equipment_type TEXT,
  address TEXT,
  district TEXT,
  phone TEXT,
  opening_hours TEXT,
  accepts_scheduling BOOLEAN NOT NULL DEFAULT true,
  active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (external_id ~ '^[a-z0-9][a-z0-9_-]*$'),
  CHECK (slug ~ '^[a-z0-9][a-z0-9_-]*$')
);

CREATE INDEX IF NOT EXISTS equipments_department_idx ON agenda_sobral.equipments(department_id);
CREATE INDEX IF NOT EXISTS equipments_scheduling_idx ON agenda_sobral.equipments(active, accepts_scheduling);

CREATE TABLE IF NOT EXISTS agenda_sobral.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES agenda_sobral.equipments(id) ON DELETE CASCADE,
  external_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  default_duration_minutes INTEGER NOT NULL DEFAULT 30 CHECK (default_duration_minutes BETWEEN 5 AND 480),
  active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (external_id ~ '^[a-zA-Z0-9][a-zA-Z0-9_-]*$')
);

CREATE INDEX IF NOT EXISTS services_equipment_idx ON agenda_sobral.services(equipment_id);
CREATE INDEX IF NOT EXISTS services_active_idx ON agenda_sobral.services(active);

CREATE TABLE IF NOT EXISTS agenda_sobral.service_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES agenda_sobral.services(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  required BOOLEAN NOT NULL DEFAULT true,
  instructions TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS service_requirements_service_idx ON agenda_sobral.service_requirements(service_id);

CREATE TABLE IF NOT EXISTS agenda_sobral.department_members (
  user_id BIGINT NOT NULL REFERENCES agenda_sobral.users(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES agenda_sobral.departments(id) ON DELETE CASCADE,
  role agenda_sobral.app_role NOT NULL CHECK (role IN ('super_admin', 'secretaria_admin', 'departamento_admin', 'colaborador')),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, department_id)
);

CREATE INDEX IF NOT EXISTS department_members_department_idx ON agenda_sobral.department_members(department_id, active);

CREATE TABLE IF NOT EXISTS agenda_sobral.equipment_members (
  user_id BIGINT NOT NULL REFERENCES agenda_sobral.users(id) ON DELETE CASCADE,
  equipment_id UUID NOT NULL REFERENCES agenda_sobral.equipments(id) ON DELETE CASCADE,
  role agenda_sobral.app_role NOT NULL CHECK (role IN ('super_admin', 'equipamento_admin', 'colaborador')),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, equipment_id)
);

CREATE INDEX IF NOT EXISTS equipment_members_equipment_idx ON agenda_sobral.equipment_members(equipment_id, active);

CREATE TABLE IF NOT EXISTS agenda_sobral.equipment_settings (
  equipment_id UUID PRIMARY KEY REFERENCES agenda_sobral.equipments(id) ON DELETE CASCADE,
  available_weekdays INTEGER[] NOT NULL DEFAULT ARRAY[1,2,3,4,5],
  opening_time TIME NOT NULL DEFAULT TIME '08:00',
  closing_time TIME NOT NULL DEFAULT TIME '14:00',
  slot_interval_minutes INTEGER NOT NULL DEFAULT 30 CHECK (slot_interval_minutes IN (10, 15, 20, 30, 45, 60)),
  default_capacity INTEGER NOT NULL DEFAULT 10 CHECK (default_capacity BETWEEN 1 AND 500),
  service_config JSONB NOT NULL DEFAULT '{}'::JSONB,
  updated_by BIGINT REFERENCES agenda_sobral.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agenda_sobral.availability_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES agenda_sobral.equipments(id) ON DELETE CASCADE,
  service_id UUID REFERENCES agenda_sobral.services(id) ON DELETE SET NULL,
  slot_date DATE NOT NULL,
  starts_at TIME NOT NULL,
  ends_at TIME NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 1 CHECK (capacity BETWEEN 1 AND 500),
  booked_count INTEGER NOT NULL DEFAULT 0 CHECK (booked_count >= 0),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'blocked')),
  notes TEXT,
  opened_by BIGINT REFERENCES agenda_sobral.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (ends_at > starts_at),
  CHECK (booked_count <= capacity)
);

CREATE UNIQUE INDEX IF NOT EXISTS availability_slots_unique_idx
  ON agenda_sobral.availability_slots(equipment_id, COALESCE(service_id, '00000000-0000-0000-0000-000000000000'::UUID), slot_date, starts_at);

CREATE INDEX IF NOT EXISTS availability_slots_lookup_idx
  ON agenda_sobral.availability_slots(equipment_id, slot_date, status, starts_at);

CREATE TABLE IF NOT EXISTS agenda_sobral.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  citizen_user_id BIGINT NOT NULL REFERENCES agenda_sobral.users(id) ON DELETE RESTRICT,
  department_id UUID NOT NULL REFERENCES agenda_sobral.departments(id) ON DELETE RESTRICT,
  equipment_id UUID NOT NULL REFERENCES agenda_sobral.equipments(id) ON DELETE RESTRICT,
  service_id UUID NOT NULL REFERENCES agenda_sobral.services(id) ON DELETE RESTRICT,
  slot_id UUID NOT NULL REFERENCES agenda_sobral.availability_slots(id) ON DELETE RESTRICT,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  subject TEXT,
  notes TEXT,
  virtual_ticket TEXT NOT NULL UNIQUE,
  validation_code TEXT NOT NULL UNIQUE,
  status agenda_sobral.appointment_status NOT NULL DEFAULT 'confirmado',
  checked_in_at TIMESTAMPTZ,
  attended_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  collaborator_user_id BIGINT REFERENCES agenda_sobral.users(id) ON DELETE SET NULL,
  outcome_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS appointments_active_user_slot_idx
  ON agenda_sobral.appointments(citizen_user_id, slot_id)
  WHERE status IN ('confirmado', 'validado', 'em_atendimento');

CREATE INDEX IF NOT EXISTS appointments_citizen_idx ON agenda_sobral.appointments(citizen_user_id, scheduled_date DESC);
CREATE INDEX IF NOT EXISTS appointments_scope_idx ON agenda_sobral.appointments(department_id, equipment_id, scheduled_date DESC, status);
CREATE INDEX IF NOT EXISTS appointments_validation_code_idx ON agenda_sobral.appointments(validation_code);

CREATE TABLE IF NOT EXISTS agenda_sobral.appointment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES agenda_sobral.appointments(id) ON DELETE CASCADE,
  status agenda_sobral.appointment_status,
  title TEXT NOT NULL,
  detail TEXT,
  actor_user_id BIGINT REFERENCES agenda_sobral.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS appointment_history_appointment_idx ON agenda_sobral.appointment_history(appointment_id, created_at);

CREATE TABLE IF NOT EXISTS agenda_sobral.nps_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL UNIQUE REFERENCES agenda_sobral.appointments(id) ON DELETE CASCADE,
  citizen_user_id BIGINT NOT NULL REFERENCES agenda_sobral.users(id) ON DELETE RESTRICT,
  department_id UUID NOT NULL REFERENCES agenda_sobral.departments(id) ON DELETE RESTRICT,
  equipment_id UUID NOT NULL REFERENCES agenda_sobral.equipments(id) ON DELETE RESTRICT,
  service_id UUID NOT NULL REFERENCES agenda_sobral.services(id) ON DELETE RESTRICT,
  collaborator_user_id BIGINT REFERENCES agenda_sobral.users(id) ON DELETE SET NULL,
  score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 10),
  nps_group TEXT GENERATED ALWAYS AS (
    CASE
      WHEN score >= 9 THEN 'promotor'
      WHEN score >= 7 THEN 'neutro'
      ELSE 'detrator'
    END
  ) STORED,
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS nps_scope_idx ON agenda_sobral.nps_surveys(department_id, equipment_id, service_id, created_at DESC);
CREATE INDEX IF NOT EXISTS nps_collaborator_idx ON agenda_sobral.nps_surveys(collaborator_user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS agenda_sobral.okr_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID REFERENCES agenda_sobral.departments(id) ON DELETE CASCADE,
  equipment_id UUID REFERENCES agenda_sobral.equipments(id) ON DELETE CASCADE,
  metric_key TEXT NOT NULL,
  metric_label TEXT NOT NULL,
  target_value NUMERIC NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_by BIGINT REFERENCES agenda_sobral.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (period_end >= period_start),
  CHECK (department_id IS NOT NULL OR equipment_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS okr_targets_scope_idx ON agenda_sobral.okr_targets(department_id, equipment_id, active);

CREATE TABLE IF NOT EXISTS agenda_sobral.audit_logs (
  id BIGSERIAL PRIMARY KEY,
  actor_user_id BIGINT REFERENCES agenda_sobral.users(id) ON DELETE SET NULL,
  department_id UUID REFERENCES agenda_sobral.departments(id) ON DELETE SET NULL,
  equipment_id UUID REFERENCES agenda_sobral.equipments(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_table TEXT,
  entity_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS audit_logs_scope_idx ON agenda_sobral.audit_logs(department_id, equipment_id, created_at DESC);

CREATE OR REPLACE FUNCTION agenda_sobral.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = pg_catalog, agenda_sobral
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  v_table TEXT;
BEGIN
  FOREACH v_table IN ARRAY ARRAY[
    'users', 'departments', 'equipments', 'services', 'service_requirements',
    'department_members', 'equipment_members', 'equipment_settings',
    'availability_slots', 'appointments', 'okr_targets'
  ]
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS set_updated_at ON agenda_sobral.%I', v_table);
    EXECUTE format(
      'CREATE TRIGGER set_updated_at BEFORE UPDATE ON agenda_sobral.%I FOR EACH ROW EXECUTE FUNCTION agenda_sobral.set_updated_at()',
      v_table
    );
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION agenda_sobral.current_auth_user_id()
RETURNS UUID
LANGUAGE plpgsql
STABLE
SET search_path = pg_catalog, auth, agenda_sobral
AS $$
DECLARE
  v_claims JSONB := NULLIF(current_setting('request.jwt.claims', true), '')::JSONB;
  v_sub TEXT;
BEGIN
  BEGIN
    RETURN auth.uid();
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  v_sub := COALESCE(v_claims->>'sub', v_claims->>'user_id');
  IF v_sub ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    RETURN v_sub::UUID;
  END IF;

  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION agenda_sobral.current_jwt_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SET search_path = pg_catalog
AS $$
  SELECT NULLIF((NULLIF(current_setting('request.jwt.claims', true), '')::JSONB ->> 'role'), '')
$$;

CREATE OR REPLACE FUNCTION agenda_sobral.is_service_role()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SET search_path = pg_catalog, agenda_sobral
AS $$
  SELECT COALESCE(agenda_sobral.current_jwt_role() = 'service_role', false)
$$;

CREATE OR REPLACE FUNCTION agenda_sobral.current_access_id()
RETURNS BIGINT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, agenda_sobral
AS $$
  SELECT u.id
  FROM agenda_sobral.users u
  WHERE u.auth_user_id = agenda_sobral.current_auth_user_id()
    AND u.status = 'active'
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION agenda_sobral.current_app_role()
RETURNS agenda_sobral.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, agenda_sobral
AS $$
  SELECT u.role
  FROM agenda_sobral.users u
  WHERE u.id = agenda_sobral.current_access_id()
    AND u.status = 'active'
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION agenda_sobral.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, agenda_sobral
AS $$
  SELECT COALESCE(agenda_sobral.current_app_role() = 'super_admin'::agenda_sobral.app_role, false)
$$;

CREATE OR REPLACE FUNCTION agenda_sobral.can_access_department(p_department_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, agenda_sobral
AS $$
  SELECT COALESCE(
    agenda_sobral.is_super_admin()
    OR EXISTS (
      SELECT 1
      FROM agenda_sobral.department_members dm
      WHERE dm.user_id = agenda_sobral.current_access_id()
        AND dm.department_id = p_department_id
        AND dm.active = true
    )
    OR EXISTS (
      SELECT 1
      FROM agenda_sobral.equipment_members em
      JOIN agenda_sobral.equipments e ON e.id = em.equipment_id
      WHERE em.user_id = agenda_sobral.current_access_id()
        AND e.department_id = p_department_id
        AND em.active = true
    ),
    false
  )
$$;

CREATE OR REPLACE FUNCTION agenda_sobral.can_access_equipment(p_equipment_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, agenda_sobral
AS $$
  SELECT COALESCE(
    agenda_sobral.is_super_admin()
    OR EXISTS (
      SELECT 1
      FROM agenda_sobral.equipment_members em
      WHERE em.user_id = agenda_sobral.current_access_id()
        AND em.equipment_id = p_equipment_id
        AND em.active = true
    )
    OR EXISTS (
      SELECT 1
      FROM agenda_sobral.department_members dm
      JOIN agenda_sobral.equipments e ON e.department_id = dm.department_id
      WHERE dm.user_id = agenda_sobral.current_access_id()
        AND e.id = p_equipment_id
        AND dm.active = true
    ),
    false
  )
$$;

CREATE OR REPLACE FUNCTION agenda_sobral.register_current_user(
  p_full_name TEXT,
  p_cpf TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL,
  p_profile_data JSONB DEFAULT '{}'::JSONB
)
RETURNS agenda_sobral.users
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, agenda_sobral
AS $$
DECLARE
  v_auth_user_id UUID := agenda_sobral.current_auth_user_id();
  v_user agenda_sobral.users;
BEGIN
  IF v_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario autenticado obrigatorio.';
  END IF;

  INSERT INTO agenda_sobral.users (
    auth_user_id, email, role, status, full_name, cpf, phone, profile_data
  )
  VALUES (
    v_auth_user_id,
    lower(NULLIF(trim(p_email), '')),
    'usuario',
    'active',
    NULLIF(trim(p_full_name), ''),
    NULLIF(trim(p_cpf), ''),
    NULLIF(trim(p_phone), ''),
    COALESCE(p_profile_data, '{}'::JSONB)
  )
  ON CONFLICT (auth_user_id) DO UPDATE
  SET email = COALESCE(EXCLUDED.email, agenda_sobral.users.email),
      full_name = COALESCE(EXCLUDED.full_name, agenda_sobral.users.full_name),
      cpf = COALESCE(EXCLUDED.cpf, agenda_sobral.users.cpf),
      phone = COALESCE(EXCLUDED.phone, agenda_sobral.users.phone),
      profile_data = agenda_sobral.users.profile_data || COALESCE(EXCLUDED.profile_data, '{}'::JSONB),
      updated_at = NOW()
  RETURNING * INTO v_user;

  RETURN v_user;
END;
$$;

CREATE OR REPLACE FUNCTION agenda_sobral.provision_access(
  p_auth_user_id UUID,
  p_email TEXT,
  p_role agenda_sobral.app_role,
  p_full_name TEXT DEFAULT NULL,
  p_department_external_id TEXT DEFAULT NULL,
  p_equipment_external_id TEXT DEFAULT NULL,
  p_profile_data JSONB DEFAULT '{}'::JSONB
)
RETURNS agenda_sobral.users
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, agenda_sobral
AS $$
DECLARE
  v_actor BIGINT := agenda_sobral.current_access_id();
  v_department_id UUID;
  v_equipment_id UUID;
  v_user agenda_sobral.users;
BEGIN
  IF p_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'auth_user_id obrigatorio.';
  END IF;

  IF NOT agenda_sobral.is_service_role() AND NOT agenda_sobral.is_super_admin() THEN
    RAISE EXCEPTION 'Apenas service_role ou super_admin pode provisionar acessos.';
  END IF;

  IF p_department_external_id IS NOT NULL THEN
    SELECT id INTO v_department_id
    FROM agenda_sobral.departments
    WHERE external_id = p_department_external_id
    LIMIT 1;
  END IF;

  IF p_equipment_external_id IS NOT NULL THEN
    SELECT id, department_id INTO v_equipment_id, v_department_id
    FROM agenda_sobral.equipments
    WHERE external_id = p_equipment_external_id
    LIMIT 1;
  END IF;

  IF p_role IN ('secretaria_admin', 'departamento_admin') AND v_department_id IS NULL THEN
    RAISE EXCEPTION 'Acesso de secretaria/departamento exige department_external_id.';
  END IF;

  IF p_role IN ('equipamento_admin', 'colaborador') AND v_equipment_id IS NULL THEN
    RAISE EXCEPTION 'Acesso de equipamento/colaborador exige equipment_external_id.';
  END IF;

  INSERT INTO agenda_sobral.users (
    auth_user_id, email, role, status, full_name, profile_data
  )
  VALUES (
    p_auth_user_id,
    lower(NULLIF(trim(p_email), '')),
    p_role,
    'active',
    NULLIF(trim(p_full_name), ''),
    COALESCE(p_profile_data, '{}'::JSONB)
  )
  ON CONFLICT (auth_user_id) DO UPDATE
  SET email = COALESCE(EXCLUDED.email, agenda_sobral.users.email),
      role = EXCLUDED.role,
      status = 'active',
      full_name = COALESCE(EXCLUDED.full_name, agenda_sobral.users.full_name),
      profile_data = agenda_sobral.users.profile_data || COALESCE(EXCLUDED.profile_data, '{}'::JSONB),
      updated_at = NOW()
  RETURNING * INTO v_user;

  IF p_role IN ('secretaria_admin', 'departamento_admin') THEN
    INSERT INTO agenda_sobral.department_members(user_id, department_id, role, active)
    VALUES (v_user.id, v_department_id, p_role, true)
    ON CONFLICT (user_id, department_id) DO UPDATE
    SET role = EXCLUDED.role, active = true, updated_at = NOW();
  ELSIF p_role IN ('equipamento_admin', 'colaborador') THEN
    INSERT INTO agenda_sobral.equipment_members(user_id, equipment_id, role, active)
    VALUES (v_user.id, v_equipment_id, p_role, true)
    ON CONFLICT (user_id, equipment_id) DO UPDATE
    SET role = EXCLUDED.role, active = true, updated_at = NOW();

    INSERT INTO agenda_sobral.department_members(user_id, department_id, role, active)
    VALUES (v_user.id, v_department_id, 'colaborador', true)
    ON CONFLICT (user_id, department_id) DO UPDATE
    SET active = true, updated_at = NOW();
  END IF;

  INSERT INTO agenda_sobral.audit_logs(actor_user_id, department_id, equipment_id, action, entity_table, entity_id, metadata)
  VALUES (
    v_actor,
    v_department_id,
    v_equipment_id,
    'provision_access',
    'users',
    v_user.id::TEXT,
    jsonb_build_object('role', p_role, 'email', p_email)
  );

  RETURN v_user;
END;
$$;

CREATE OR REPLACE FUNCTION agenda_sobral.book_appointment(
  p_slot_id UUID,
  p_service_id UUID,
  p_subject TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS SETOF agenda_sobral.appointments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, agenda_sobral
AS $$
DECLARE
  v_user_id BIGINT := agenda_sobral.current_access_id();
  v_role agenda_sobral.app_role := agenda_sobral.current_app_role();
  v_slot agenda_sobral.availability_slots%ROWTYPE;
  v_service agenda_sobral.services%ROWTYPE;
  v_department_id UUID;
  v_appointment_id UUID;
  v_ticket TEXT;
  v_code TEXT;
BEGIN
  IF v_user_id IS NULL OR v_role <> 'usuario' THEN
    RAISE EXCEPTION 'Apenas usuario autenticado pode criar agendamento.';
  END IF;

  SELECT * INTO v_slot
  FROM agenda_sobral.availability_slots
  WHERE id = p_slot_id
  FOR UPDATE;

  IF NOT FOUND OR v_slot.status <> 'open' OR v_slot.slot_date < CURRENT_DATE THEN
    RAISE EXCEPTION 'Horario indisponivel.';
  END IF;

  IF v_slot.booked_count >= v_slot.capacity THEN
    RAISE EXCEPTION 'Horario sem vagas restantes.';
  END IF;

  SELECT * INTO v_service
  FROM agenda_sobral.services
  WHERE id = p_service_id
    AND equipment_id = v_slot.equipment_id
    AND active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Servico invalido para o equipamento escolhido.';
  END IF;

  SELECT department_id INTO v_department_id
  FROM agenda_sobral.equipments
  WHERE id = v_slot.equipment_id
    AND active = true
    AND accepts_scheduling = true;

  IF v_department_id IS NULL THEN
    RAISE EXCEPTION 'Equipamento indisponivel para agendamento.';
  END IF;

  v_ticket := upper(left(regexp_replace(v_service.name, '[^A-Za-z0-9]+', '', 'g'), 3))
    || '-' || to_char(v_slot.slot_date, 'YYMMDD')
    || '-' || upper(substr(encode(extensions.gen_random_bytes(3), 'hex'), 1, 6));
  v_code := upper(substr(encode(extensions.gen_random_bytes(4), 'hex'), 1, 8));

  INSERT INTO agenda_sobral.appointments (
    citizen_user_id, department_id, equipment_id, service_id, slot_id,
    scheduled_date, scheduled_time, subject, notes, virtual_ticket, validation_code
  )
  VALUES (
    v_user_id, v_department_id, v_slot.equipment_id, p_service_id, p_slot_id,
    v_slot.slot_date, v_slot.starts_at, NULLIF(trim(p_subject), ''), NULLIF(trim(p_notes), ''),
    v_ticket, v_code
  )
  RETURNING id INTO v_appointment_id;

  UPDATE agenda_sobral.availability_slots
  SET booked_count = booked_count + 1,
      updated_at = NOW()
  WHERE id = p_slot_id;

  INSERT INTO agenda_sobral.appointment_history(appointment_id, status, title, detail, actor_user_id)
  VALUES (v_appointment_id, 'confirmado', 'Agendamento criado', 'Senha virtual gerada: ' || v_ticket, v_user_id);

  RETURN QUERY
  SELECT *
  FROM agenda_sobral.appointments
  WHERE id = v_appointment_id;
END;
$$;

CREATE OR REPLACE FUNCTION agenda_sobral.cancel_my_appointment(p_appointment_id UUID, p_reason TEXT DEFAULT NULL)
RETURNS agenda_sobral.appointments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, agenda_sobral
AS $$
DECLARE
  v_user_id BIGINT := agenda_sobral.current_access_id();
  v_appt agenda_sobral.appointments%ROWTYPE;
BEGIN
  SELECT * INTO v_appt
  FROM agenda_sobral.appointments
  WHERE id = p_appointment_id
  FOR UPDATE;

  IF NOT FOUND OR v_appt.citizen_user_id <> v_user_id THEN
    RAISE EXCEPTION 'Agendamento nao encontrado para este usuario.';
  END IF;

  IF v_appt.status <> 'confirmado' THEN
    RAISE EXCEPTION 'Somente agendamentos confirmados podem ser cancelados pelo usuario.';
  END IF;

  UPDATE agenda_sobral.appointments
  SET status = 'cancelado',
      cancelled_at = NOW(),
      outcome_notes = COALESCE(NULLIF(trim(p_reason), ''), outcome_notes),
      updated_at = NOW()
  WHERE id = p_appointment_id
  RETURNING * INTO v_appt;

  UPDATE agenda_sobral.availability_slots
  SET booked_count = GREATEST(booked_count - 1, 0),
      updated_at = NOW()
  WHERE id = v_appt.slot_id;

  INSERT INTO agenda_sobral.appointment_history(appointment_id, status, title, detail, actor_user_id)
  VALUES (p_appointment_id, 'cancelado', 'Agendamento cancelado pelo usuario', p_reason, v_user_id);

  RETURN v_appt;
END;
$$;

CREATE OR REPLACE FUNCTION agenda_sobral.validate_virtual_ticket(p_validation_code TEXT)
RETURNS agenda_sobral.appointments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, agenda_sobral
AS $$
DECLARE
  v_actor BIGINT := agenda_sobral.current_access_id();
  v_appt agenda_sobral.appointments%ROWTYPE;
BEGIN
  SELECT * INTO v_appt
  FROM agenda_sobral.appointments
  WHERE validation_code = upper(trim(p_validation_code))
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Senha virtual nao encontrada.';
  END IF;

  IF NOT agenda_sobral.can_access_equipment(v_appt.equipment_id) THEN
    RAISE EXCEPTION 'Sem permissao para validar senha deste equipamento.';
  END IF;

  IF v_appt.status <> 'confirmado' THEN
    RAISE EXCEPTION 'Senha virtual ja validada, cancelada ou encerrada.';
  END IF;

  UPDATE agenda_sobral.appointments
  SET status = 'validado',
      checked_in_at = NOW(),
      updated_at = NOW()
  WHERE id = v_appt.id
  RETURNING * INTO v_appt;

  INSERT INTO agenda_sobral.appointment_history(appointment_id, status, title, detail, actor_user_id)
  VALUES (v_appt.id, 'validado', 'Senha virtual validada no equipamento publico', NULL, v_actor);

  RETURN v_appt;
END;
$$;

CREATE OR REPLACE FUNCTION agenda_sobral.complete_appointment(p_appointment_id UUID, p_outcome_notes TEXT DEFAULT NULL)
RETURNS agenda_sobral.appointments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, agenda_sobral
AS $$
DECLARE
  v_actor BIGINT := agenda_sobral.current_access_id();
  v_appt agenda_sobral.appointments%ROWTYPE;
BEGIN
  SELECT * INTO v_appt
  FROM agenda_sobral.appointments
  WHERE id = p_appointment_id
  FOR UPDATE;

  IF NOT FOUND OR NOT agenda_sobral.can_access_equipment(v_appt.equipment_id) THEN
    RAISE EXCEPTION 'Sem permissao para concluir este atendimento.';
  END IF;

  IF v_appt.status NOT IN ('confirmado', 'validado', 'em_atendimento') THEN
    RAISE EXCEPTION 'Atendimento nao pode ser concluido neste status.';
  END IF;

  UPDATE agenda_sobral.appointments
  SET status = 'atendido',
      attended_at = NOW(),
      collaborator_user_id = v_actor,
      outcome_notes = NULLIF(trim(p_outcome_notes), ''),
      updated_at = NOW()
  WHERE id = p_appointment_id
  RETURNING * INTO v_appt;

  INSERT INTO agenda_sobral.appointment_history(appointment_id, status, title, detail, actor_user_id)
  VALUES (p_appointment_id, 'atendido', 'Atendimento concluido', p_outcome_notes, v_actor);

  RETURN v_appt;
END;
$$;

CREATE OR REPLACE FUNCTION agenda_sobral.mark_no_show(p_appointment_id UUID, p_reason TEXT DEFAULT NULL)
RETURNS agenda_sobral.appointments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, agenda_sobral
AS $$
DECLARE
  v_actor BIGINT := agenda_sobral.current_access_id();
  v_appt agenda_sobral.appointments%ROWTYPE;
BEGIN
  SELECT * INTO v_appt
  FROM agenda_sobral.appointments
  WHERE id = p_appointment_id
  FOR UPDATE;

  IF NOT FOUND OR NOT agenda_sobral.can_access_equipment(v_appt.equipment_id) THEN
    RAISE EXCEPTION 'Sem permissao para marcar falta neste atendimento.';
  END IF;

  IF v_appt.status NOT IN ('confirmado', 'validado') THEN
    RAISE EXCEPTION 'Somente atendimento pendente pode receber falta.';
  END IF;

  UPDATE agenda_sobral.appointments
  SET status = 'falta',
      outcome_notes = NULLIF(trim(p_reason), ''),
      updated_at = NOW()
  WHERE id = p_appointment_id
  RETURNING * INTO v_appt;

  INSERT INTO agenda_sobral.appointment_history(appointment_id, status, title, detail, actor_user_id)
  VALUES (p_appointment_id, 'falta', 'Usuario nao compareceu', p_reason, v_actor);

  RETURN v_appt;
END;
$$;

CREATE OR REPLACE FUNCTION agenda_sobral.submit_nps(p_appointment_id UUID, p_score INTEGER, p_comment TEXT DEFAULT NULL)
RETURNS agenda_sobral.nps_surveys
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, agenda_sobral
AS $$
DECLARE
  v_user_id BIGINT := agenda_sobral.current_access_id();
  v_appt agenda_sobral.appointments%ROWTYPE;
  v_nps agenda_sobral.nps_surveys%ROWTYPE;
BEGIN
  IF p_score < 0 OR p_score > 10 THEN
    RAISE EXCEPTION 'Nota NPS deve estar entre 0 e 10.';
  END IF;

  SELECT * INTO v_appt
  FROM agenda_sobral.appointments
  WHERE id = p_appointment_id;

  IF NOT FOUND OR v_appt.citizen_user_id <> v_user_id THEN
    RAISE EXCEPTION 'Atendimento nao encontrado para este usuario.';
  END IF;

  IF v_appt.status <> 'atendido' THEN
    RAISE EXCEPTION 'NPS so pode ser respondido apos atendimento concluido.';
  END IF;

  INSERT INTO agenda_sobral.nps_surveys (
    appointment_id, citizen_user_id, department_id, equipment_id, service_id,
    collaborator_user_id, score, comment
  )
  VALUES (
    v_appt.id, v_appt.citizen_user_id, v_appt.department_id, v_appt.equipment_id,
    v_appt.service_id, v_appt.collaborator_user_id, p_score, NULLIF(trim(p_comment), '')
  )
  RETURNING * INTO v_nps;

  INSERT INTO agenda_sobral.appointment_history(appointment_id, status, title, detail, actor_user_id)
  VALUES (p_appointment_id, 'atendido', 'Pesquisa NPS respondida', 'Nota: ' || p_score, v_user_id);

  RETURN v_nps;
END;
$$;

CREATE OR REPLACE FUNCTION agenda_sobral.get_management_kpis(
  p_department_external_id TEXT DEFAULT NULL,
  p_equipment_external_id TEXT DEFAULT NULL,
  p_date_from DATE DEFAULT (CURRENT_DATE - INTERVAL '30 days')::DATE,
  p_date_to DATE DEFAULT CURRENT_DATE
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, agenda_sobral
AS $$
DECLARE
  v_department_id UUID;
  v_equipment_id UUID;
  v_date_from DATE := COALESCE(p_date_from, (CURRENT_DATE - INTERVAL '30 days')::DATE);
  v_date_to DATE := COALESCE(p_date_to, CURRENT_DATE);
  v_result JSONB;
BEGIN
  IF p_department_external_id IS NOT NULL THEN
    SELECT id INTO v_department_id FROM agenda_sobral.departments WHERE external_id = p_department_external_id;
    IF v_department_id IS NULL OR NOT agenda_sobral.can_access_department(v_department_id) THEN
      RAISE EXCEPTION 'Sem permissao para relatorio deste departamento.';
    END IF;
  END IF;

  IF p_equipment_external_id IS NOT NULL THEN
    SELECT id INTO v_equipment_id FROM agenda_sobral.equipments WHERE external_id = p_equipment_external_id;
    IF v_equipment_id IS NULL OR NOT agenda_sobral.can_access_equipment(v_equipment_id) THEN
      RAISE EXCEPTION 'Sem permissao para relatorio deste equipamento.';
    END IF;
  END IF;

  IF v_department_id IS NULL AND v_equipment_id IS NULL AND NOT agenda_sobral.is_super_admin() THEN
    IF agenda_sobral.current_access_id() IS NULL THEN
      RAISE EXCEPTION 'Usuario autenticado obrigatorio.';
    END IF;
  END IF;

  WITH scoped AS (
    SELECT a.*
    FROM agenda_sobral.appointments a
    WHERE a.scheduled_date BETWEEN v_date_from AND v_date_to
      AND (v_department_id IS NULL OR a.department_id = v_department_id)
      AND (v_equipment_id IS NULL OR a.equipment_id = v_equipment_id)
      AND (agenda_sobral.is_super_admin() OR agenda_sobral.can_access_equipment(a.equipment_id))
  ),
  nps AS (
    SELECT ns.*
    FROM agenda_sobral.nps_surveys ns
    WHERE ns.created_at::DATE BETWEEN v_date_from AND v_date_to
      AND (v_department_id IS NULL OR ns.department_id = v_department_id)
      AND (v_equipment_id IS NULL OR ns.equipment_id = v_equipment_id)
      AND (agenda_sobral.is_super_admin() OR agenda_sobral.can_access_equipment(ns.equipment_id))
  )
  SELECT jsonb_build_object(
    'date_from', v_date_from,
    'date_to', v_date_to,
    'total_agendamentos', (SELECT COUNT(*) FROM scoped),
    'confirmados', (SELECT COUNT(*) FROM scoped WHERE status = 'confirmado'),
    'validados', (SELECT COUNT(*) FROM scoped WHERE status = 'validado'),
    'atendidos', (SELECT COUNT(*) FROM scoped WHERE status = 'atendido'),
    'cancelados', (SELECT COUNT(*) FROM scoped WHERE status = 'cancelado'),
    'faltas', (SELECT COUNT(*) FROM scoped WHERE status = 'falta'),
    'taxa_comparecimento', COALESCE(
      ROUND((SELECT COUNT(*)::NUMERIC FROM scoped WHERE status = 'atendido')
        / NULLIF((SELECT COUNT(*)::NUMERIC FROM scoped WHERE status IN ('atendido','falta')), 0) * 100, 2),
      0
    ),
    'nps_media', COALESCE(ROUND((SELECT AVG(score)::NUMERIC FROM nps), 2), 0),
    'nps_total', (SELECT COUNT(*) FROM nps),
    'nps_promotores', (SELECT COUNT(*) FROM nps WHERE nps_group = 'promotor'),
    'nps_neutros', (SELECT COUNT(*) FROM nps WHERE nps_group = 'neutro'),
    'nps_detratores', (SELECT COUNT(*) FROM nps WHERE nps_group = 'detrator'),
    'nps_indice', COALESCE(
      ROUND(((SELECT COUNT(*)::NUMERIC FROM nps WHERE nps_group = 'promotor')
        - (SELECT COUNT(*)::NUMERIC FROM nps WHERE nps_group = 'detrator'))
        / NULLIF((SELECT COUNT(*)::NUMERIC FROM nps), 0) * 100, 2),
      0
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION agenda_sobral.get_nps_report(
  p_department_external_id TEXT DEFAULT NULL,
  p_equipment_external_id TEXT DEFAULT NULL,
  p_date_from DATE DEFAULT (CURRENT_DATE - INTERVAL '30 days')::DATE,
  p_date_to DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  department_name TEXT,
  equipment_name TEXT,
  service_name TEXT,
  collaborator_name TEXT,
  responses BIGINT,
  avg_score NUMERIC,
  promoters BIGINT,
  neutral BIGINT,
  detractors BIGINT,
  nps_index NUMERIC
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, agenda_sobral
AS $$
DECLARE
  v_department_id UUID;
  v_equipment_id UUID;
  v_date_from DATE := COALESCE(p_date_from, (CURRENT_DATE - INTERVAL '30 days')::DATE);
  v_date_to DATE := COALESCE(p_date_to, CURRENT_DATE);
BEGIN
  IF p_department_external_id IS NOT NULL THEN
    SELECT id INTO v_department_id FROM agenda_sobral.departments WHERE external_id = p_department_external_id;
    IF v_department_id IS NULL OR NOT agenda_sobral.can_access_department(v_department_id) THEN
      RAISE EXCEPTION 'Sem permissao para relatorio deste departamento.';
    END IF;
  END IF;

  IF p_equipment_external_id IS NOT NULL THEN
    SELECT id INTO v_equipment_id FROM agenda_sobral.equipments WHERE external_id = p_equipment_external_id;
    IF v_equipment_id IS NULL OR NOT agenda_sobral.can_access_equipment(v_equipment_id) THEN
      RAISE EXCEPTION 'Sem permissao para relatorio deste equipamento.';
    END IF;
  END IF;

  RETURN QUERY
  SELECT
    d.name,
    e.name,
    s.name,
    COALESCE(u.full_name, 'Sem colaborador vinculado') AS collaborator_name,
    COUNT(ns.id) AS responses,
    ROUND(AVG(ns.score)::NUMERIC, 2) AS avg_score,
    COUNT(*) FILTER (WHERE ns.nps_group = 'promotor') AS promoters,
    COUNT(*) FILTER (WHERE ns.nps_group = 'neutro') AS neutral,
    COUNT(*) FILTER (WHERE ns.nps_group = 'detrator') AS detractors,
    ROUND((
      COUNT(*) FILTER (WHERE ns.nps_group = 'promotor')::NUMERIC
      - COUNT(*) FILTER (WHERE ns.nps_group = 'detrator')::NUMERIC
    ) / NULLIF(COUNT(*)::NUMERIC, 0) * 100, 2) AS nps_index
  FROM agenda_sobral.nps_surveys ns
  JOIN agenda_sobral.departments d ON d.id = ns.department_id
  JOIN agenda_sobral.equipments e ON e.id = ns.equipment_id
  JOIN agenda_sobral.services s ON s.id = ns.service_id
  LEFT JOIN agenda_sobral.users u ON u.id = ns.collaborator_user_id
  WHERE ns.created_at::DATE BETWEEN v_date_from AND v_date_to
    AND (v_department_id IS NULL OR ns.department_id = v_department_id)
    AND (v_equipment_id IS NULL OR ns.equipment_id = v_equipment_id)
    AND (agenda_sobral.is_super_admin() OR agenda_sobral.can_access_equipment(ns.equipment_id))
  GROUP BY d.name, e.name, s.name, u.full_name
  ORDER BY d.name, e.name, s.name, collaborator_name;
END;
$$;

ALTER TABLE agenda_sobral.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE agenda_sobral.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE agenda_sobral.equipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE agenda_sobral.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE agenda_sobral.service_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE agenda_sobral.department_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE agenda_sobral.equipment_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE agenda_sobral.equipment_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE agenda_sobral.availability_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE agenda_sobral.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE agenda_sobral.appointment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE agenda_sobral.nps_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE agenda_sobral.okr_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE agenda_sobral.audit_logs ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON ALL TABLES IN SCHEMA agenda_sobral FROM PUBLIC, anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA agenda_sobral FROM PUBLIC, anon, authenticated;
REVOKE ALL ON ALL ROUTINES IN SCHEMA agenda_sobral FROM PUBLIC, anon;

GRANT SELECT ON agenda_sobral.departments, agenda_sobral.equipments, agenda_sobral.services, agenda_sobral.service_requirements, agenda_sobral.availability_slots TO anon;

GRANT SELECT ON ALL TABLES IN SCHEMA agenda_sobral TO authenticated;
GRANT INSERT, UPDATE, DELETE ON agenda_sobral.departments, agenda_sobral.equipments, agenda_sobral.services, agenda_sobral.service_requirements, agenda_sobral.department_members, agenda_sobral.equipment_members, agenda_sobral.equipment_settings, agenda_sobral.availability_slots, agenda_sobral.okr_targets TO authenticated;
GRANT UPDATE(full_name, cpf, phone, profile_data, updated_at) ON agenda_sobral.users TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA agenda_sobral TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA agenda_sobral TO service_role;
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA agenda_sobral TO service_role;

GRANT EXECUTE ON FUNCTION agenda_sobral.current_auth_user_id() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION agenda_sobral.current_jwt_role() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION agenda_sobral.is_service_role() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION agenda_sobral.current_access_id() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION agenda_sobral.current_app_role() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION agenda_sobral.is_super_admin() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION agenda_sobral.can_access_department(UUID) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION agenda_sobral.can_access_equipment(UUID) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION agenda_sobral.register_current_user(TEXT, TEXT, TEXT, TEXT, JSONB) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION agenda_sobral.provision_access(UUID, TEXT, agenda_sobral.app_role, TEXT, TEXT, TEXT, JSONB) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION agenda_sobral.book_appointment(UUID, UUID, TEXT, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION agenda_sobral.cancel_my_appointment(UUID, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION agenda_sobral.validate_virtual_ticket(TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION agenda_sobral.complete_appointment(UUID, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION agenda_sobral.mark_no_show(UUID, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION agenda_sobral.submit_nps(UUID, INTEGER, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION agenda_sobral.get_management_kpis(TEXT, TEXT, DATE, DATE) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION agenda_sobral.get_nps_report(TEXT, TEXT, DATE, DATE) TO authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA agenda_sobral REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA agenda_sobral REVOKE ALL ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA agenda_sobral GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA agenda_sobral GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO service_role;

DROP POLICY IF EXISTS users_select_own_or_scoped ON agenda_sobral.users;
CREATE POLICY users_select_own_or_scoped ON agenda_sobral.users
FOR SELECT TO authenticated
USING (
  id = agenda_sobral.current_access_id()
  OR agenda_sobral.is_super_admin()
  OR EXISTS (
    SELECT 1
    FROM agenda_sobral.appointments a
    WHERE a.citizen_user_id = agenda_sobral.users.id
      AND agenda_sobral.can_access_equipment(a.equipment_id)
  )
);

DROP POLICY IF EXISTS users_update_own_profile ON agenda_sobral.users;
CREATE POLICY users_update_own_profile ON agenda_sobral.users
FOR UPDATE TO authenticated
USING (id = agenda_sobral.current_access_id())
WITH CHECK (id = agenda_sobral.current_access_id());

DROP POLICY IF EXISTS departments_public_select ON agenda_sobral.departments;
CREATE POLICY departments_public_select ON agenda_sobral.departments
FOR SELECT TO anon, authenticated
USING (active = true OR agenda_sobral.can_access_department(id));

DROP POLICY IF EXISTS departments_admin_write ON agenda_sobral.departments;
CREATE POLICY departments_admin_write ON agenda_sobral.departments
FOR ALL TO authenticated
USING (agenda_sobral.is_super_admin())
WITH CHECK (agenda_sobral.is_super_admin());

DROP POLICY IF EXISTS equipments_public_select ON agenda_sobral.equipments;
CREATE POLICY equipments_public_select ON agenda_sobral.equipments
FOR SELECT TO anon, authenticated
USING (active = true OR agenda_sobral.can_access_equipment(id));

DROP POLICY IF EXISTS equipments_admin_write ON agenda_sobral.equipments;
CREATE POLICY equipments_admin_write ON agenda_sobral.equipments
FOR ALL TO authenticated
USING (agenda_sobral.can_access_department(department_id))
WITH CHECK (agenda_sobral.can_access_department(department_id));

DROP POLICY IF EXISTS services_public_select ON agenda_sobral.services;
CREATE POLICY services_public_select ON agenda_sobral.services
FOR SELECT TO anon, authenticated
USING (
  active = true
  AND EXISTS (
    SELECT 1 FROM agenda_sobral.equipments e
    WHERE e.id = equipment_id AND e.active = true AND e.accepts_scheduling = true
  )
  OR agenda_sobral.can_access_equipment(equipment_id)
);

DROP POLICY IF EXISTS services_admin_write ON agenda_sobral.services;
CREATE POLICY services_admin_write ON agenda_sobral.services
FOR ALL TO authenticated
USING (agenda_sobral.can_access_equipment(equipment_id))
WITH CHECK (agenda_sobral.can_access_equipment(equipment_id));

DROP POLICY IF EXISTS requirements_public_select ON agenda_sobral.service_requirements;
CREATE POLICY requirements_public_select ON agenda_sobral.service_requirements
FOR SELECT TO anon, authenticated
USING (
  EXISTS (
    SELECT 1
    FROM agenda_sobral.services s
    WHERE s.id = service_id
      AND (s.active = true OR agenda_sobral.can_access_equipment(s.equipment_id))
  )
);

DROP POLICY IF EXISTS requirements_admin_write ON agenda_sobral.service_requirements;
CREATE POLICY requirements_admin_write ON agenda_sobral.service_requirements
FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM agenda_sobral.services s WHERE s.id = service_id AND agenda_sobral.can_access_equipment(s.equipment_id))
)
WITH CHECK (
  EXISTS (SELECT 1 FROM agenda_sobral.services s WHERE s.id = service_id AND agenda_sobral.can_access_equipment(s.equipment_id))
);

DROP POLICY IF EXISTS department_members_scoped_select ON agenda_sobral.department_members;
CREATE POLICY department_members_scoped_select ON agenda_sobral.department_members
FOR SELECT TO authenticated
USING (user_id = agenda_sobral.current_access_id() OR agenda_sobral.can_access_department(department_id));

DROP POLICY IF EXISTS department_members_super_write ON agenda_sobral.department_members;
CREATE POLICY department_members_super_write ON agenda_sobral.department_members
FOR ALL TO authenticated
USING (agenda_sobral.is_super_admin())
WITH CHECK (agenda_sobral.is_super_admin());

DROP POLICY IF EXISTS equipment_members_scoped_select ON agenda_sobral.equipment_members;
CREATE POLICY equipment_members_scoped_select ON agenda_sobral.equipment_members
FOR SELECT TO authenticated
USING (user_id = agenda_sobral.current_access_id() OR agenda_sobral.can_access_equipment(equipment_id));

DROP POLICY IF EXISTS equipment_members_admin_write ON agenda_sobral.equipment_members;
CREATE POLICY equipment_members_admin_write ON agenda_sobral.equipment_members
FOR ALL TO authenticated
USING (agenda_sobral.can_access_equipment(equipment_id))
WITH CHECK (agenda_sobral.can_access_equipment(equipment_id));

DROP POLICY IF EXISTS equipment_settings_scoped ON agenda_sobral.equipment_settings;
CREATE POLICY equipment_settings_scoped ON agenda_sobral.equipment_settings
FOR ALL TO authenticated
USING (agenda_sobral.can_access_equipment(equipment_id))
WITH CHECK (agenda_sobral.can_access_equipment(equipment_id));

DROP POLICY IF EXISTS availability_public_select ON agenda_sobral.availability_slots;
CREATE POLICY availability_public_select ON agenda_sobral.availability_slots
FOR SELECT TO anon, authenticated
USING (
  status = 'open'
  AND slot_date >= CURRENT_DATE
  AND booked_count < capacity
  OR agenda_sobral.can_access_equipment(equipment_id)
);

DROP POLICY IF EXISTS availability_admin_write ON agenda_sobral.availability_slots;
CREATE POLICY availability_admin_write ON agenda_sobral.availability_slots
FOR ALL TO authenticated
USING (agenda_sobral.can_access_equipment(equipment_id))
WITH CHECK (agenda_sobral.can_access_equipment(equipment_id));

DROP POLICY IF EXISTS appointments_select_own_or_scoped ON agenda_sobral.appointments;
CREATE POLICY appointments_select_own_or_scoped ON agenda_sobral.appointments
FOR SELECT TO authenticated
USING (
  citizen_user_id = agenda_sobral.current_access_id()
  OR agenda_sobral.can_access_equipment(equipment_id)
);

DROP POLICY IF EXISTS history_select_own_or_scoped ON agenda_sobral.appointment_history;
CREATE POLICY history_select_own_or_scoped ON agenda_sobral.appointment_history
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM agenda_sobral.appointments a
    WHERE a.id = appointment_id
      AND (a.citizen_user_id = agenda_sobral.current_access_id() OR agenda_sobral.can_access_equipment(a.equipment_id))
  )
);

DROP POLICY IF EXISTS nps_select_own_or_scoped ON agenda_sobral.nps_surveys;
CREATE POLICY nps_select_own_or_scoped ON agenda_sobral.nps_surveys
FOR SELECT TO authenticated
USING (
  citizen_user_id = agenda_sobral.current_access_id()
  OR agenda_sobral.can_access_equipment(equipment_id)
);

DROP POLICY IF EXISTS okr_targets_scoped ON agenda_sobral.okr_targets;
CREATE POLICY okr_targets_scoped ON agenda_sobral.okr_targets
FOR ALL TO authenticated
USING (
  agenda_sobral.is_super_admin()
  OR (department_id IS NOT NULL AND agenda_sobral.can_access_department(department_id))
  OR (equipment_id IS NOT NULL AND agenda_sobral.can_access_equipment(equipment_id))
)
WITH CHECK (
  agenda_sobral.is_super_admin()
  OR (department_id IS NOT NULL AND agenda_sobral.can_access_department(department_id))
  OR (equipment_id IS NOT NULL AND agenda_sobral.can_access_equipment(equipment_id))
);

DROP POLICY IF EXISTS audit_logs_admin_select ON agenda_sobral.audit_logs;
CREATE POLICY audit_logs_admin_select ON agenda_sobral.audit_logs
FOR SELECT TO authenticated
USING (
  agenda_sobral.is_super_admin()
  OR (department_id IS NOT NULL AND agenda_sobral.can_access_department(department_id))
  OR (equipment_id IS NOT NULL AND agenda_sobral.can_access_equipment(equipment_id))
);

INSERT INTO agenda_sobral.departments (external_id, slug, name, acronym, portal_url, color, description)
VALUES
  ('sms', 'sms', 'Secretaria da Saude', 'SMS', 'https://saude.sobral.ce.gov.br', '#E53E3E', 'Atendimento em saude basica, especializada e de urgencia.'),
  ('sme', 'sme', 'Secretaria da Educacao', 'SME', 'https://educacao.sobral.ce.gov.br', '#3182CE', 'Matriculas, transferencias e servicos educacionais.'),
  ('sedhas', 'sedhas', 'Secretaria dos Direitos Humanos e Assistencia Social', 'SEDHAS', 'https://sedhas.sobral.ce.gov.br', '#805AD5', 'Cadastro Unico, Bolsa Familia, assistencia social e habitacao.'),
  ('seplag', 'seplag', 'Secretaria do Planejamento e Gestao', 'SEPLAG', 'https://seplag.sobral.ce.gov.br/', '#0052A5', 'Planejamento estrategico, gestao publica e modernizacao.'),
  ('sefin', 'sefin', 'Secretaria das Financas', 'SEFIN', 'https://sefin.sobral.ce.gov.br', '#00875A', 'IPTU, ISS, taxas, certidoes e tributos municipais.'),
  ('seinfra', 'seinfra', 'Secretaria da Infraestrutura', 'SEINFRA', 'https://seinfra.sobral.ce.gov.br', '#DD6B20', 'Obras publicas, pavimentacao e infraestrutura urbana.'),
  ('seuma', 'seuma', 'Secretaria do Urbanismo, Habitacao e Meio Ambiente', 'SEUMA', 'https://seuma.sobral.ce.gov.br', '#38A169', 'Licenciamento ambiental, alvaras, habite-se e urbanismo.'),
  ('sesec', 'sesec', 'Secretaria da Seguranca Cidada', 'SESEC', 'https://sesec.sobral.ce.gov.br', '#2D3748', 'Seguranca publica, Guarda Municipal e videomonitoramento.'),
  ('setransp', 'setransp', 'Secretaria do Transporte', 'SETRANSP', 'https://setransp.sobral.ce.gov.br', '#4299E1', 'Transporte publico, mobilidade, transito e cartao estudantil.'),
  ('stde', 'stde', 'Secretaria do Trabalho e Desenvolvimento Economico', 'STDE', 'https://stde.sobral.ce.gov.br', '#D69E2E', 'Emprego, capacitacao profissional e microempreendedorismo.'),
  ('sejuc', 'sejuc', 'Secretaria da Juventude e Cultura', 'SEJUC', 'https://sejuc.sobral.ce.gov.br/', '#9F7AEA', 'Programas culturais, eventos e politicas de juventude.'),
  ('sespol', 'sespol', 'Secretaria do Esporte e Lazer', 'SEEL', 'https://sespol.sobral.ce.gov.br', '#F56565', 'Equipamentos esportivos, areninhas e programas de lazer.'),
  ('seagri', 'seagri', 'Secretaria da Agricultura', 'SEAGRI', 'https://seagri.sobral.ce.gov.br', '#48BB78', 'Apoio ao produtor rural, DAP e programas agricolas.'),
  ('pecuaria', 'pecuaria', 'Secretaria da Pecuaria', 'SEPEC', 'https://sepec.sobral.ce.gov.br/', '#975A16', 'Apoio a pecuaria, sanidade animal e vacinacao de rebanhos.'),
  ('setur', 'setur', 'Secretaria do Turismo e Eventos', 'SETUR', 'https://setur.sobral.ce.gov.br/', '#ED8936', 'Turismo, eventos culturais e promocao da cidade.'),
  ('pgm', 'pgm', 'Procuradoria Geral do Municipio', 'PGM', 'https://pgm.sobral.ce.gov.br', '#4A5568', 'Assessoria juridica, processos e pareceres legais.'),
  ('saae', 'saae', 'Servico Autonomo de Agua e Esgoto', 'SAAE', 'https://saae.sobral.ce.gov.br', '#0BC5EA', 'Ligacao de agua, esgoto, segunda via e reparos.'),
  ('amma', 'amma', 'Agencia Municipal do Meio Ambiente', 'AMMA', 'https://ama.sobral.ce.gov.br/', '#2F855A', 'Fiscalizacao ambiental, licencas e educacao ambiental.'),
  ('scsp', 'scsp', 'Secretaria da Conservacao e Servicos Publicos', 'SCSP', 'https://sesep.sobral.ce.gov.br', '#718096', 'Limpeza urbana, iluminacao publica e conservacao de vias.'),
  ('cagm', 'cagm', 'Controladoria e Auditoria Geral do Municipio', 'CAGM', 'https://cgm.sobral.ce.gov.br/', '#4A5568', 'Controle interno, auditoria e transparencia publica.'),
  ('sdd', 'sdd', 'Secretaria do Desenvolvimento Distrital', 'SDD', 'https://sedistri.sobral.ce.gov.br/', '#B7791F', 'Atendimento e desenvolvimento dos distritos de Sobral.'),
  ('segov', 'segov', 'Secretaria do Governo', 'SEGOV', 'https://segov.sobral.ce.gov.br/', '#1A365D', 'Articulacao institucional e apoio ao Gabinete do Prefeito.'),
  ('gvp', 'gvp', 'Gabinete da Vice-Prefeita', 'GVP', 'https://gabvice.sobral.ce.gov.br/', '#9B2C2C', 'Atendimento e projetos do Gabinete da Vice-Prefeita.')
ON CONFLICT (external_id) DO UPDATE
SET slug = EXCLUDED.slug,
    name = EXCLUDED.name,
    acronym = EXCLUDED.acronym,
    portal_url = EXCLUDED.portal_url,
    color = EXCLUDED.color,
    description = EXCLUDED.description,
    active = true,
    updated_at = NOW();

DO $$
BEGIN
  IF to_regclass('auth_system.app_role_matrix') IS NOT NULL THEN
    EXECUTE $sql$
      INSERT INTO auth_system.app_role_matrix(app_schema, role, is_admin)
      VALUES
        ('agenda_sobral', 'super_admin', true),
        ('agenda_sobral', 'secretaria_admin', true),
        ('agenda_sobral', 'departamento_admin', true),
        ('agenda_sobral', 'equipamento_admin', true),
        ('agenda_sobral', 'colaborador', false),
        ('agenda_sobral', 'usuario', false)
      ON CONFLICT (app_schema, role) DO UPDATE
      SET is_admin = EXCLUDED.is_admin
    $sql$;
  END IF;

  IF to_regclass('auth_system.apps') IS NOT NULL THEN
    EXECUTE $sql$
      INSERT INTO auth_system.apps (
        app_schema, display_name, local_path, github_repo, easypanel_project,
        easypanel_service, data_mode, auth_mode, readiness_status, frontend_url,
        backend_url, metadata
      )
      VALUES (
        'agenda_sobral',
        'Agenda Sobral',
        '/Users/sergioponte/AGENDA SOBRAL',
        'https://github.com/sxsevenxperts/AGENDA-SOBRAL.git',
        'xpert-backend',
        'supabase',
        'production',
        'supabase',
        'schema_rls_ready',
        NULL,
        'https://xpert-backend-supabase.qfotry.easypanel.host',
        '{"municipio":"Sobral","uf":"CE","schema":"agenda_sobral"}'::jsonb
      )
      ON CONFLICT (app_schema) DO UPDATE
      SET display_name = EXCLUDED.display_name,
          local_path = EXCLUDED.local_path,
          github_repo = EXCLUDED.github_repo,
          easypanel_project = EXCLUDED.easypanel_project,
          easypanel_service = EXCLUDED.easypanel_service,
          data_mode = EXCLUDED.data_mode,
          auth_mode = EXCLUDED.auth_mode,
          readiness_status = EXCLUDED.readiness_status,
          backend_url = EXCLUDED.backend_url,
          metadata = auth_system.apps.metadata || EXCLUDED.metadata,
          updated_at = NOW()
    $sql$;
  END IF;
END $$;

COMMIT;

NOTIFY pgrst, 'reload schema';
