-- ============================================================
-- AGENDA SOBRAL - Supabase Schema (Self-Hosted no Easypanel)
-- Schema: agenda_sobral
-- ============================================================

-- Criar schema
CREATE SCHEMA IF NOT EXISTS agenda_sobral;
SET search_path TO agenda_sobral, public;

-- ============================================================
--  EXTENSÕES
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;

-- ============================================================
--  ENUMS
-- ============================================================
CREATE TYPE appointment_status AS ENUM ('scheduled', 'chamado', 'attended', 'no_show', 'cancelled');
CREATE TYPE nps_group AS ENUM ('detrator', 'neutro', 'promotor');
CREATE TYPE user_role AS ENUM ('usuario', 'gestor', 'super_admin');

-- ============================================================
--  TABELA: users (cidadãos e admin)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT public.uuid_generate_v4(),
  auth_user_id UUID UNIQUE REFERENCES public.auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  cpf VARCHAR(14) UNIQUE,
  phone VARCHAR(20),
  role user_role DEFAULT 'usuario',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('America/Fortaleza', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('America/Fortaleza', NOW()),
  profile_data JSONB DEFAULT '{}',
  last_login_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================
--  TABELA: departments (Secretarias)
-- ============================================================
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT public.uuid_generate_v4(),
  external_id VARCHAR(50) UNIQUE NOT NULL, -- SMS, SME, SEDHAS, etc.
  slug VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  acronym VARCHAR(10) NOT NULL UNIQUE,
  description TEXT,
  portal_url VARCHAR(500),
  color VARCHAR(7) DEFAULT '#1D467A', -- cor hex
  icon_name VARCHAR(50),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('America/Fortaleza', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('America/Fortaleza', NOW())
);

-- ============================================================
--  TABELA: equipments (Unidades/Vapt Vupt)
-- ============================================================
CREATE TABLE IF NOT EXISTS equipments (
  id UUID PRIMARY KEY DEFAULT public.uuid_generate_v4(),
  external_id VARCHAR(50) UNIQUE NOT NULL, -- CSF-001, etc.
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  slug VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  equipment_type VARCHAR(50), -- CSF, escola, etc.
  address VARCHAR(500),
  district VARCHAR(100),
  phone VARCHAR(20),
  opening_hours VARCHAR(50), -- "08:00-16:00"
  capacity_per_hour INT DEFAULT 10,
  active BOOLEAN DEFAULT true,
  accepts_scheduling BOOLEAN DEFAULT true,
  admin_user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- admin exclusivo deste equipment
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('America/Fortaleza', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('America/Fortaleza', NOW())
);

-- ============================================================
--  TABELA: services (Serviços)
-- ============================================================
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT public.uuid_generate_v4(),
  external_id VARCHAR(50),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  default_duration_minutes INT DEFAULT 30,
  active BOOLEAN DEFAULT true,
  required_documents TEXT[], -- array de docs necessários
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('America/Fortaleza', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('America/Fortaleza', NOW()),
  UNIQUE(external_id, department_id)
);

-- ============================================================
--  TABELA: equipment_services (N-N entre equipments e services)
-- ============================================================
CREATE TABLE IF NOT EXISTS equipment_services (
  id UUID PRIMARY KEY DEFAULT public.uuid_generate_v4(),
  equipment_id UUID NOT NULL REFERENCES equipments(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('America/Fortaleza', NOW()),
  UNIQUE(equipment_id, service_id)
);

-- ============================================================
--  TABELA: availability_slots (Slots de agendamento)
-- ============================================================
CREATE TABLE IF NOT EXISTS availability_slots (
  id UUID PRIMARY KEY DEFAULT public.uuid_generate_v4(),
  equipment_id UUID NOT NULL REFERENCES equipments(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  slot_date DATE NOT NULL,
  starts_at TIME NOT NULL,
  ends_at TIME NOT NULL,
  capacity INT DEFAULT 1,
  booked_count INT DEFAULT 0,
  status VARCHAR(20) DEFAULT 'open', -- 'open', 'closed', 'full'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('America/Fortaleza', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('America/Fortaleza', NOW()),
  UNIQUE(equipment_id, slot_date, starts_at)
);

-- ============================================================
--  TABELA: appointments (Agendamentos)
-- ============================================================
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT public.uuid_generate_v4(),
  citizen_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  equipment_id UUID NOT NULL REFERENCES equipments(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  slot_id UUID REFERENCES availability_slots(id) ON DELETE SET NULL,

  -- Data/hora do agendamento
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,

  -- Identificação da senha virtual
  virtual_password VARCHAR(20), -- e.g., "SMS-001"
  validation_code VARCHAR(10) UNIQUE, -- e.g., "AUB-8W2"

  subject VARCHAR(255),
  notes TEXT,

  -- Status do agendamento
  status appointment_status DEFAULT 'scheduled',

  -- Rastreamento
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('America/Fortaleza', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('America/Fortaleza', NOW()),
  called_at TIMESTAMP WITH TIME ZONE,
  validated_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  no_show_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT
);

-- ============================================================
--  TABELA: nps_surveys (Pesquisa de NPS)
-- ============================================================
CREATE TABLE IF NOT EXISTS nps_surveys (
  id UUID PRIMARY KEY DEFAULT public.uuid_generate_v4(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE UNIQUE,
  score INT NOT NULL CHECK (score >= 0 AND score <= 10),
  nps_group nps_group GENERATED ALWAYS AS (
    CASE
      WHEN score >= 9 THEN 'promotor'::nps_group
      WHEN score >= 7 THEN 'neutro'::nps_group
      ELSE 'detrator'::nps_group
    END
  ) STORED,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('America/Fortaleza', NOW())
);

-- ============================================================
--  TABELA: ouvidoria (Manifestações anônimas)
-- ============================================================
CREATE TABLE IF NOT EXISTS ouvidoria (
  id UUID PRIMARY KEY DEFAULT public.uuid_generate_v4(),
  manifestation_type VARCHAR(50) NOT NULL, -- 'sugestao', 'reclamacao', 'elogio', 'outro'
  theme VARCHAR(255),
  message TEXT NOT NULL,
  email VARCHAR(255), -- opcional para anônimos
  requester_name VARCHAR(255),
  requester_cpf VARCHAR(14),
  anonymous BOOLEAN DEFAULT true,
  status VARCHAR(20) DEFAULT 'open', -- 'open', 'acknowledged', 'responded', 'closed'
  response TEXT,
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('America/Fortaleza', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('America/Fortaleza', NOW()),
  CONSTRAINT check_anonymous CHECK (
    (anonymous = true) OR (email IS NOT NULL OR requester_name IS NOT NULL)
  )
);

-- ============================================================
--  ÍNDICES
-- ============================================================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_cpf ON users(cpf);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_auth_id ON users(auth_user_id);

CREATE INDEX idx_departments_external_id ON departments(external_id);
CREATE INDEX idx_departments_active ON departments(active);

CREATE INDEX idx_equipments_external_id ON equipments(external_id);
CREATE INDEX idx_equipments_department ON equipments(department_id);
CREATE INDEX idx_equipments_admin ON equipments(admin_user_id);
CREATE INDEX idx_equipments_active ON equipments(active);

CREATE INDEX idx_services_department ON services(department_id);
CREATE INDEX idx_services_external_id ON services(external_id, department_id);
CREATE INDEX idx_services_active ON services(active);

CREATE INDEX idx_equipment_services_equipment ON equipment_services(equipment_id);
CREATE INDEX idx_equipment_services_service ON equipment_services(service_id);

CREATE INDEX idx_slots_equipment ON availability_slots(equipment_id);
CREATE INDEX idx_slots_date ON availability_slots(slot_date);
CREATE INDEX idx_slots_status ON availability_slots(status);

CREATE INDEX idx_appointments_citizen ON appointments(citizen_user_id);
CREATE INDEX idx_appointments_equipment ON appointments(equipment_id);
CREATE INDEX idx_appointments_date ON appointments(scheduled_date);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_validation_code ON appointments(validation_code);

CREATE INDEX idx_nps_appointment ON nps_surveys(appointment_id);
CREATE INDEX idx_nps_group ON nps_surveys(nps_group);

CREATE INDEX idx_ouvidoria_type ON ouvidoria(manifestation_type);
CREATE INDEX idx_ouvidoria_status ON ouvidoria(status);
CREATE INDEX idx_ouvidoria_created ON ouvidoria(created_at DESC);

-- ============================================================
--  POLÍTICAS RLS (Row Level Security)
-- ============================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE nps_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE ouvidoria ENABLE ROW LEVEL SECURITY;

-- Users: cidadão vê apenas sua conta
CREATE POLICY "Users see own profile" ON users
  FOR SELECT USING (auth.uid() = auth_user_id);

-- Admins veem usuários em seu escopo
CREATE POLICY "Admins see scoped users" ON users
  FOR SELECT USING (
    auth.uid() IN (SELECT auth_user_id FROM users WHERE role = 'super_admin') OR
    auth.uid() = auth_user_id
  );

-- Departments: público (leitura)
CREATE POLICY "Departments are public" ON departments
  FOR SELECT USING (active = true);

-- Equipments: público (leitura)
CREATE POLICY "Equipments are public" ON equipments
  FOR SELECT USING (active = true AND accepts_scheduling = true);

-- Services: público (leitura)
CREATE POLICY "Services are public" ON services
  FOR SELECT USING (active = true);

-- Slots: público (leitura)
CREATE POLICY "Slots are public" ON availability_slots
  FOR SELECT USING (status = 'open');

-- Appointments: cidadão vê seus agendamentos
CREATE POLICY "Users see own appointments" ON appointments
  FOR SELECT USING (
    citizen_user_id = auth.uid() OR
    auth.uid() IN (SELECT auth_user_id FROM users WHERE role IN ('gestor', 'super_admin'))
  );

-- NPS: apenas para agendamentos do usuário
CREATE POLICY "Users see own nps" ON nps_surveys
  FOR SELECT USING (
    appointment_id IN (
      SELECT id FROM appointments WHERE citizen_user_id = auth.uid()
    )
  );

-- Ouvidoria: qualquer pessoa pode inserir; lê apenas a sua
CREATE POLICY "Anyone can create ouvidoria" ON ouvidoria
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users see own ouvidoria" ON ouvidoria
  FOR SELECT USING (
    anonymous = false AND email = (SELECT email FROM users WHERE auth_user_id = auth.uid())
    OR
    auth.uid() IN (SELECT auth_user_id FROM users WHERE role IN ('gestor', 'super_admin'))
  );

-- ============================================================
--  FUNÇÕES RPC
-- ============================================================

-- Registrar usuário atual
CREATE OR REPLACE FUNCTION register_current_user(
  p_full_name TEXT,
  p_cpf TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_profile_data JSONB DEFAULT '{}'
) RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_email TEXT;
BEGIN
  v_user_id := auth.uid();
  v_email := (SELECT email FROM public.auth.users WHERE id = v_user_id);

  IF v_email IS NULL THEN
    RETURN json_build_object('error', 'User not authenticated');
  END IF;

  INSERT INTO agenda_sobral.users (auth_user_id, email, full_name, cpf, phone, profile_data)
  VALUES (v_user_id, v_email, p_full_name, p_cpf, p_phone, p_profile_data)
  ON CONFLICT (auth_user_id) DO UPDATE SET
    full_name = p_full_name,
    cpf = COALESCE(p_cpf, users.cpf),
    phone = COALESCE(p_phone, users.phone),
    updated_at = TIMEZONE('America/Fortaleza', NOW());

  RETURN json_build_object('success', true, 'user_id', v_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Validar ticket virtual
CREATE OR REPLACE FUNCTION validate_virtual_ticket(p_validation_code TEXT)
RETURNS JSON AS $$
DECLARE
  v_appointment_id UUID;
  v_citizen_name TEXT;
  v_equipment_name TEXT;
BEGIN
  SELECT id INTO v_appointment_id
  FROM agenda_sobral.appointments
  WHERE validation_code = p_validation_code
    AND status = 'scheduled'
  LIMIT 1;

  IF v_appointment_id IS NULL THEN
    RETURN json_build_object('error', 'Código inválido ou já utilizado');
  END IF;

  -- Atualiza status para 'chamado' e marca validação
  UPDATE agenda_sobral.appointments
  SET status = 'chamado', validated_at = TIMEZONE('America/Fortaleza', NOW())
  WHERE id = v_appointment_id;

  -- Retorna dados do cidadão e equipamento
  SELECT u.full_name, e.name
  INTO v_citizen_name, v_equipment_name
  FROM agenda_sobral.appointments a
  JOIN agenda_sobral.users u ON a.citizen_user_id = u.id
  JOIN agenda_sobral.equipments e ON a.equipment_id = e.id
  WHERE a.id = v_appointment_id;

  RETURN json_build_object(
    'success', true,
    'appointment_id', v_appointment_id,
    'citizen_name', v_citizen_name,
    'equipment_name', v_equipment_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Book appointment
CREATE OR REPLACE FUNCTION book_appointment(
  p_slot_id UUID,
  p_service_id UUID,
  p_subject TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  v_appointment_id UUID;
  v_citizen_id UUID;
  v_equipment_id UUID;
  v_scheduled_date DATE;
  v_scheduled_time TIME;
  v_virtual_pwd TEXT;
  v_validation_code TEXT;
BEGIN
  v_citizen_id := auth.uid();

  SELECT equipment_id, slot_date, starts_at
  INTO v_equipment_id, v_scheduled_date, v_scheduled_time
  FROM agenda_sobral.availability_slots WHERE id = p_slot_id;

  IF v_equipment_id IS NULL THEN
    RETURN json_build_object('error', 'Slot não encontrado');
  END IF;

  -- Gera código de validação (6 caracteres: A-Z, 2-9)
  v_validation_code := (
    SELECT substring('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 1+floor(random()*31)::int, 1) ||
           substring('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 1+floor(random()*31)::int, 1) ||
           substring('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 1+floor(random()*31)::int, 1) ||
           '-' ||
           substring('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 1+floor(random()*31)::int, 1) ||
           substring('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 1+floor(random()*31)::int, 1) ||
           substring('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 1+floor(random()*31)::int, 1)
  );

  INSERT INTO agenda_sobral.appointments (
    citizen_user_id, department_id, equipment_id, service_id, slot_id,
    scheduled_date, scheduled_time, subject, notes,
    virtual_password, validation_code
  )
  SELECT v_citizen_id, d.id, v_equipment_id, p_service_id, p_slot_id,
         v_scheduled_date, v_scheduled_time, p_subject, p_notes,
         d.acronym || '-001', v_validation_code
  FROM agenda_sobral.equipments e
  JOIN agenda_sobral.departments d ON e.department_id = d.id
  WHERE e.id = v_equipment_id
  RETURNING id INTO v_appointment_id;

  RETURN json_build_object(
    'success', true,
    'appointment_id', v_appointment_id,
    'validation_code', v_validation_code,
    'virtual_password', (SELECT virtual_password FROM agenda_sobral.appointments WHERE id = v_appointment_id)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cancel appointment
CREATE OR REPLACE FUNCTION cancel_my_appointment(
  p_appointment_id UUID,
  p_reason TEXT DEFAULT NULL
) RETURNS JSON AS $$
BEGIN
  UPDATE agenda_sobral.appointments
  SET status = 'cancelled',
      cancelled_at = TIMEZONE('America/Fortaleza', NOW()),
      cancellation_reason = p_reason
  WHERE id = p_appointment_id AND citizen_user_id = auth.uid();

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Agendamento não encontrado ou não autorizado');
  END IF;

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Complete appointment
CREATE OR REPLACE FUNCTION complete_appointment(
  p_appointment_id UUID,
  p_outcome_notes TEXT DEFAULT NULL
) RETURNS JSON AS $$
BEGIN
  UPDATE agenda_sobral.appointments
  SET status = 'attended',
      completed_at = TIMEZONE('America/Fortaleza', NOW()),
      notes = COALESCE(notes || ' | Resultado: ' || p_outcome_notes, p_outcome_notes)
  WHERE id = p_appointment_id;

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mark no show
CREATE OR REPLACE FUNCTION mark_no_show(
  p_appointment_id UUID,
  p_reason TEXT DEFAULT NULL
) RETURNS JSON AS $$
BEGIN
  UPDATE agenda_sobral.appointments
  SET status = 'no_show',
      no_show_at = TIMEZONE('America/Fortaleza', NOW()),
      notes = COALESCE(notes || ' | Falta: ' || p_reason, 'Falta: ' || p_reason)
  WHERE id = p_appointment_id;

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Submit NPS
CREATE OR REPLACE FUNCTION submit_nps(
  p_appointment_id UUID,
  p_score INT,
  p_comment TEXT DEFAULT NULL
) RETURNS JSON AS $$
BEGIN
  INSERT INTO agenda_sobral.nps_surveys (appointment_id, score, comment)
  VALUES (p_appointment_id, p_score, p_comment)
  ON CONFLICT (appointment_id) DO UPDATE SET
    score = p_score,
    comment = p_comment;

  RETURN json_build_object('success', true, 'nps_group', (SELECT nps_group FROM agenda_sobral.nps_surveys WHERE appointment_id = p_appointment_id LIMIT 1));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get NPS Report
CREATE OR REPLACE FUNCTION get_nps_report(
  p_department_external_id TEXT DEFAULT NULL,
  p_equipment_external_id TEXT DEFAULT NULL,
  p_date_from DATE DEFAULT NULL,
  p_date_to DATE DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'total', COUNT(*),
    'promoters', COUNT(*) FILTER (WHERE nps_group = 'promotor'),
    'detractors', COUNT(*) FILTER (WHERE nps_group = 'detrator'),
    'passives', COUNT(*) FILTER (WHERE nps_group = 'neutro'),
    'nps_score', ROUND(
      ((COUNT(*) FILTER (WHERE nps_group = 'promotor') - COUNT(*) FILTER (WHERE nps_group = 'detrator'))::FLOAT / NULLIF(COUNT(*), 0) * 100)::NUMERIC, 1
    )
  ) INTO v_result
  FROM agenda_sobral.nps_surveys n
  JOIN agenda_sobral.appointments a ON n.appointment_id = a.id
  LEFT JOIN agenda_sobral.departments d ON a.department_id = d.id
  LEFT JOIN agenda_sobral.equipments e ON a.equipment_id = e.id
  WHERE (p_department_external_id IS NULL OR d.external_id = p_department_external_id)
    AND (p_equipment_external_id IS NULL OR e.external_id = p_equipment_external_id)
    AND (p_date_from IS NULL OR a.scheduled_date >= p_date_from)
    AND (p_date_to IS NULL OR a.scheduled_date <= p_date_to);

  RETURN COALESCE(v_result, json_build_object('total', 0, 'nps_score', 0));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get Management KPIs
CREATE OR REPLACE FUNCTION get_management_kpis(
  p_department_external_id TEXT DEFAULT NULL,
  p_equipment_external_id TEXT DEFAULT NULL,
  p_date_from DATE DEFAULT NULL,
  p_date_to DATE DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'total_appointments', COUNT(*),
    'attended', COUNT(*) FILTER (WHERE status = 'attended'),
    'no_show', COUNT(*) FILTER (WHERE status = 'no_show'),
    'cancelled', COUNT(*) FILTER (WHERE status = 'cancelled'),
    'occupancy_rate', ROUND(
      (COUNT(*) FILTER (WHERE status = 'attended')::FLOAT / NULLIF(COUNT(*), 0) * 100)::NUMERIC, 1
    )
  ) INTO v_result
  FROM agenda_sobral.appointments a
  LEFT JOIN agenda_sobral.departments d ON a.department_id = d.id
  LEFT JOIN agenda_sobral.equipments e ON a.equipment_id = e.id
  WHERE (p_department_external_id IS NULL OR d.external_id = p_department_external_id)
    AND (p_equipment_external_id IS NULL OR e.external_id = p_equipment_external_id)
    AND (p_date_from IS NULL OR a.scheduled_date >= p_date_from)
    AND (p_date_to IS NULL OR a.scheduled_date <= p_date_to);

  RETURN COALESCE(v_result, json_build_object('total_appointments', 0, 'occupancy_rate', 0));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Provision access (para criar contas de gestor/admin)
CREATE OR REPLACE FUNCTION provision_access(
  p_auth_user_id UUID,
  p_email TEXT,
  p_role user_role,
  p_full_name TEXT DEFAULT NULL,
  p_department_external_id TEXT DEFAULT NULL,
  p_equipment_external_id TEXT DEFAULT NULL,
  p_profile_data JSONB DEFAULT '{}'
) RETURNS JSON AS $$
BEGIN
  INSERT INTO agenda_sobral.users (
    auth_user_id, email, full_name, role, profile_data
  ) VALUES (
    p_auth_user_id, p_email, COALESCE(p_full_name, 'Admin'), p_role, p_profile_data
  ) ON CONFLICT (auth_user_id) DO UPDATE SET
    role = p_role,
    updated_at = TIMEZONE('America/Fortaleza', NOW());

  RETURN json_build_object('success', true, 'user_id', p_auth_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
--  DADOS INICIAIS (OPTATIVO)
-- ============================================================

-- Inserir secretarias de Sobral
INSERT INTO departments (external_id, slug, name, acronym, description, color, active) VALUES
  ('SMS', 'secretaria-municipalidade-saude', 'Secretaria Municipal da Saúde', 'SMS', 'Saúde pública e atendimento', '#D32F2F', true),
  ('SME', 'secretaria-municipalidade-educacao', 'Secretaria Municipal da Educação', 'SME', 'Educação e escolas', '#1976D2', true),
  ('SEDHAS', 'secretaria-direitos-humanos', 'Secretaria de Direitos Humanos', 'SEDHAS', 'Assistência social e direitos', '#6A1B9A', true),
  ('SEPLAG', 'secretaria-planejamento', 'Secretaria de Planejamento', 'SEPLAG', 'Planejamento municipal', '#00897B', true)
ON CONFLICT (external_id) DO NOTHING;

-- Inserir equipamento de exemplo
INSERT INTO equipments (external_id, department_id, slug, name, equipment_type, address, phone, opening_hours, active, accepts_scheduling)
SELECT 'CSF-001', departments.id, 'csf-centro', 'CSF Centro', 'Centro', 'Rua Centro, 100', '(88) 3677-1200', '08:00-16:00', true, true
FROM departments WHERE external_id = 'SMS'
ON CONFLICT (external_id) DO NOTHING;

-- Inserir serviço de exemplo
INSERT INTO services (external_id, department_id, name, description, default_duration_minutes, active)
SELECT 'CONSULTA-001', departments.id, 'Consulta Médica', 'Atendimento médico', 30, true
FROM departments WHERE external_id = 'SMS'
ON CONFLICT (external_id, department_id) DO NOTHING;

COMMIT;
