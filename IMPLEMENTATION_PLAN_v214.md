# Plano de Implementação v2.14.0 — 3 Tarefas Críticas

**Data:** 2026-07-22  
**Status:** 📋 Planejado (Aguardando Execução)  
**Prioridade:** CRÍTICA (Bloqueadores de Escalabilidade)

---

## TAREFA 1: Executar sql/001_lgpd_consents.sql no Supabase EasyPanel

### Estado Atual
- ✅ SQL existe em `/sql/001_lgpd_consents.sql`
- ✅ Schema `agenda_sobral` está configurado em `supabase/config.toml` (linha 13)
- ❌ Tabela `lgpd_consents` NÃO foi criada em produção (verificar com query)
- ❌ Função RPC `log_consent()` NÃO foi criada

### Pré-requisitos
```bash
# Verificar conectividade ao Supabase EasyPanel
SUPABASE_URL="https://xpert-backend-supabase.qfotry.easypanel.host"
SUPABASE_SERVICE_ROLE_KEY="<SERVICE_ROLE_KEY>"

# Query de teste (via Supabase API ou psql)
SELECT EXISTS(
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'agenda_sobral' AND table_name = 'lgpd_consents'
);
```

### Execução (2 métodos)

#### Método A: Via Supabase Studio (UI)
1. Acessar: `https://xpert-backend-supabase.qfotry.easypanel.host/admin/sql`
2. Colar conteúdo de `sql/001_lgpd_consents.sql`
3. Executar (Run)
4. Verificar mensagens de sucesso

#### Método B: Via SQL Client (psql, pgAdmin, etc)
```bash
psql -h xpert-backend-supabase.qfotry.easypanel.host \
     -p 5432 \
     -d postgres \
     -U postgres \
     -f sql/001_lgpd_consents.sql
```

#### Método C: Via Script Bash + curl (Automated)
```bash
#!/bin/bash
SUPABASE_URL="https://xpert-backend-supabase.qfotry.easypanel.host"
SUPABASE_KEY="$SUPABASE_SERVICE_ROLE_KEY"
SQL_FILE="sql/001_lgpd_consents.sql"

# Ler arquivo SQL
SQL_CONTENT=$(cat "$SQL_FILE")

# Executar via RPC (se houver endpoint de execução SQL)
# OU direto via pgBouncer

echo "Executando migração LGPD..."
# Implementar conforme seu setup Supabase
```

### Validação Pós-Execução
```sql
-- Verificar tabela
SELECT COUNT(*) FROM agenda_sobral.lgpd_consents;
-- Esperado: 0 (tabela vazia após criação)

-- Verificar função
SELECT COUNT(*) FROM pg_proc WHERE proname = 'log_consent';
-- Esperado: 1

-- Verificar RLS policies
SELECT COUNT(*) FROM pg_policies WHERE tablename = 'lgpd_consents';
-- Esperado: 2 (insert + select)

-- Verificar índices
SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'agenda_sobral' AND tablename = 'lgpd_consents';
-- Esperado: 2 (timestamp + citizen)
```

### Frontend Integration
Após SQL executado, ativar logging no index.html:
```javascript
// index.html — adicionar após submit do formulário
if (supportsSupabase()) {
  const consentId = await AgendaSobralSupabase.logConsent({
    lgpd_accepted: document.getElementById('dynamic-lgpd').checked,
    privacy_accepted: document.getElementById('dynamic-privacy').checked,
    cookies_accepted: true, // ou detect via banner
    user_agent: navigator.userAgent
  });
  console.log('Consentimento registrado:', consentId);
}
```

### Timeline
- **Execução:** 15 min (SQL + validação)
- **Testing:** 30 min (E2E com frontend)
- **Rollback:** 5 min (DROP TABLE)

---

## TAREFA 2: Persistir Agendamentos no Supabase (Multi-Dispositivo + Real-Time)

### Estado Atual
- ✅ Agendamentos estão em localStorage
- ✅ Supabase schema `agenda_sobral` configurado
- ✅ Realtime está habilitado em config.toml
- ❌ Tabelas de agendamentos no Supabase não existem
- ❌ Sincronização bidirecional não implementada
- ❌ Real-time listeners não implementados

### Nova Arquitetura

```
┌─────────────────────────────────────────────────┐
│  Browser (index.html)                           │
│  - localStorage (cache local)                   │
│  - Formulário de agendamento                    │
│  - Real-time listeners via Supabase             │
└────────────┬────────────────────────────────────┘
             │
    ┌────────▼────────┐
    │  REST API       │
    │  (Supabase)     │
    └────────┬────────┘
             │
┌────────────▼────────────────────────────────────┐
│  Supabase (PostgreSQL)                          │
│  - appointments (agendamentos)                  │
│  - slots (horários disponíveis)                 │
│  - departments (departamentos)                  │
│  - users (usuários / cidadãos)                  │
└─────────────────────────────────────────────────┘
```

### SQL — Criar Tabelas de Agendamentos

```sql
-- sql/002_appointments_schema.sql

CREATE SCHEMA IF NOT EXISTS agenda_sobral;

-- Tabela de departamentos (reference)
CREATE TABLE IF NOT EXISTS agenda_sobral.departments (
  id              text              PRIMARY KEY,
  name            text              NOT NULL,
  capacity        integer           NOT NULL,
  color           text,
  icon            text,
  operating_hours jsonb,            -- [[08:00, 12:00], [13:00, 17:00], [18:00, 21:00]]
  buffer_minutes  integer           DEFAULT 15,
  prefix          text,             -- COW, LNK, SAL, ATR, MUS
  created_at      timestamptz       DEFAULT now()
);

-- Tabela de slots (horários disponíveis)
CREATE TABLE IF NOT EXISTS agenda_sobral.slots (
  id              uuid              DEFAULT gen_random_uuid() PRIMARY KEY,
  department_id   text              NOT NULL REFERENCES agenda_sobral.departments(id),
  slot_date       date              NOT NULL,
  start_time      time              NOT NULL,
  end_time        time              NOT NULL,
  capacity        integer           NOT NULL,
  booked_count    integer           DEFAULT 0,
  status          text              DEFAULT 'open', -- open, locked, closed
  version         integer           DEFAULT 0,  -- Para optimistic concurrency
  created_at      timestamptz       DEFAULT now(),
  UNIQUE (department_id, slot_date, start_time)
);

-- Tabela de agendamentos
CREATE TABLE IF NOT EXISTS agenda_sobral.appointments (
  id              uuid              DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_code text            NOT NULL UNIQUE, -- Ex: COW-001
  department_id   text              NOT NULL REFERENCES agenda_sobral.departments(id),
  slot_id         uuid              REFERENCES agenda_sobral.slots(id),
  appointment_date date            NOT NULL,
  appointment_time time            NOT NULL,
  num_participants integer          NOT NULL,
  
  -- Dados do cidadão
  citizen_name    text              NOT NULL,
  citizen_email   text              NOT NULL,
  citizen_phone   text,
  citizen_company text,
  
  -- Status
  status          text              NOT NULL DEFAULT 'PENDENTE',
  -- PENDENTE → VALIDADO → CONCLUÍDO / NAO_COMPARECEU
  
  -- Formulário (store as JSONB)
  form_data       jsonb             NOT NULL,
  
  -- Consentimento
  lgpd_accepted   boolean           DEFAULT false,
  privacy_accepted boolean          DEFAULT false,
  consent_id      uuid              REFERENCES agenda_sobral.lgpd_consents(id),
  
  -- Auditoria
  created_at      timestamptz       DEFAULT now(),
  created_by      uuid              REFERENCES auth.users(id),
  updated_at      timestamptz       DEFAULT now(),
  updated_by      uuid              REFERENCES auth.users(id),
  
  -- Aprovação
  approved_at     timestamptz,
  approved_by     text,
  
  -- Presence
  marked_complete_at timestamptz,
  marked_noshow_at   timestamptz
);

-- Tabela de auditoria
CREATE TABLE IF NOT EXISTS agenda_sobral.appointment_audit (
  id              uuid              DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id  uuid              NOT NULL REFERENCES agenda_sobral.appointments(id),
  action          text              NOT NULL, -- CRIOU, EDITOU, CANCELOU, VALIDOU, CONCLUIU
  operator        text              NOT NULL, -- admin role
  changed_fields  jsonb,            -- {status: [PENDENTE, VALIDADO], approved_by: [null, Joyce]}
  reason          text,
  created_at      timestamptz       DEFAULT now()
);

-- Índices
CREATE INDEX idx_appointments_dept ON agenda_sobral.appointments(department_id);
CREATE INDEX idx_appointments_date ON agenda_sobral.appointments(appointment_date);
CREATE INDEX idx_appointments_status ON agenda_sobral.appointments(status);
CREATE INDEX idx_appointments_email ON agenda_sobral.appointments(citizen_email);
CREATE INDEX idx_slots_dept_date ON agenda_sobral.slots(department_id, slot_date);
CREATE INDEX idx_audit_appt ON agenda_sobral.appointment_audit(appointment_id);

-- RLS
ALTER TABLE agenda_sobral.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE agenda_sobral.slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE agenda_sobral.appointment_audit ENABLE ROW LEVEL SECURITY;

-- Policy: Qualquer um pode criar seu próprio agendamento
CREATE POLICY "appointments_insert_own" ON agenda_sobral.appointments
  FOR INSERT
  WITH CHECK (true);

-- Policy: Ver apenas próprios agendamentos (anon) ou todos (admin)
CREATE POLICY "appointments_select" ON agenda_sobral.appointments
  FOR SELECT
  USING (
    -- Anon/user vê próprio
    citizen_email = COALESCE(current_setting('request.jwt.claims'->>'email', NULL), '')
    -- Admin vê todos
    OR current_setting('request.jwt.claims'->>'role', NULL) IN ('admin', 'super', 'musica', 'coordenadora')
  );

-- RPC: Validar e criar agendamento (com server-side capacity check)
CREATE OR REPLACE FUNCTION agenda_sobral.create_appointment(
  p_department_id text,
  p_appointment_date date,
  p_appointment_time time,
  p_num_participants integer,
  p_citizen_name text,
  p_citizen_email text,
  p_form_data jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = agenda_sobral, public
AS $$
DECLARE
  v_slot_id uuid;
  v_appointment_id uuid;
  v_capacity integer;
  v_booked integer;
  v_dept_capacity integer;
  v_appointment_code text;
  v_prefix text;
  v_counter integer;
BEGIN
  -- 1. Validar departamento e capacidade
  SELECT capacity, prefix INTO v_dept_capacity, v_prefix
  FROM agenda_sobral.departments
  WHERE id = p_department_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Departamento não encontrado');
  END IF;
  
  IF p_num_participants > v_dept_capacity THEN
    RETURN jsonb_build_object('error', 'Número de participantes excede capacidade máxima');
  END IF;
  
  -- 2. Encontrar ou criar slot
  SELECT id, capacity, booked_count INTO v_slot_id, v_capacity, v_booked
  FROM agenda_sobral.slots
  WHERE department_id = p_department_id
    AND slot_date = p_appointment_date
    AND start_time = p_appointment_time;
  
  IF NOT FOUND THEN
    -- Criar novo slot
    INSERT INTO agenda_sobral.slots (department_id, slot_date, start_time, end_time, capacity)
    VALUES (p_department_id, p_appointment_date, p_appointment_time, 
            p_appointment_time + interval '1 hour', v_dept_capacity)
    RETURNING id INTO v_slot_id;
    v_booked := 0;
  END IF;
  
  -- 3. Validar capacidade do slot (OPTIMISTIC CONCURRENCY CHECK)
  IF (v_booked + p_num_participants) > v_capacity THEN
    RETURN jsonb_build_object('error', 'Slot cheio. Tente outro horário.');
  END IF;
  
  -- 4. Gerar código de agendamento
  v_counter := (SELECT COUNT(*) FROM appointments WHERE department_id = p_department_id) + 1;
  v_appointment_code := v_prefix || '-' || LPAD(v_counter::text, 3, '0');
  
  -- 5. Inserir agendamento
  INSERT INTO agenda_sobral.appointments (
    appointment_code, department_id, slot_id, appointment_date, appointment_time,
    num_participants, citizen_name, citizen_email, form_data
  )
  VALUES (v_appointment_code, p_department_id, v_slot_id, p_appointment_date, p_appointment_time,
          p_num_participants, p_citizen_name, p_citizen_email, p_form_data)
  RETURNING id INTO v_appointment_id;
  
  -- 6. Atualizar booked_count do slot
  UPDATE agenda_sobral.slots
  SET booked_count = booked_count + p_num_participants,
      version = version + 1
  WHERE id = v_slot_id;
  
  -- 7. Log auditoria
  INSERT INTO agenda_sobral.appointment_audit (appointment_id, action, operator, reason)
  VALUES (v_appointment_id, 'CRIOU', 'CITIZEN', 'Agendamento criado via formulário');
  
  RETURN jsonb_build_object(
    'success', true,
    'appointment_id', v_appointment_id,
    'appointment_code', v_appointment_code,
    'message', 'Agendamento confirmado!'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION agenda_sobral.create_appointment TO anon, authenticated;
```

### Frontend Integration (index.html)

```javascript
// ===== SUPABASE INTEGRATION (NEW) =====

// 1. Inicializar Supabase client com real-time
const supabaseClient = supabase.createClient(
  window.SUPABASE_URL || 'https://xpert-backend-supabase.qfotry.easypanel.host',
  window.SUPABASE_ANON_KEY
);

// 2. Sync appointments do localStorage para Supabase (e vice-versa)
async function syncAppointments() {
  try {
    // Buscar agendamentos do Supabase
    const { data: remoteAppts } = await supabaseClient
      .from('appointments')
      .select('*')
      .order('created_at', { ascending: false });
    
    // Merge com localStorage (remoto ganha em conflito)
    const local = JSON.parse(localStorage.getItem('cadeia_appointments') || '[]');
    const merged = mergeAppointments(local, remoteAppts || []);
    
    localStorage.setItem('cadeia_appointments', JSON.stringify(merged));
    
    return merged;
  } catch (err) {
    console.error('Erro ao sincronizar agendamentos:', err);
    return JSON.parse(localStorage.getItem('cadeia_appointments') || '[]');
  }
}

// 3. Real-time listener para novas confirmações
supabaseClient
  .channel('appointments')
  .on('postgres_changes', { event: 'INSERT', schema: 'agenda_sobral', table: 'appointments' },
    payload => {
      console.log('Novo agendamento confirmado:', payload.new);
      updateDashboardStats(); // Atualizar dashboard em tempo real
    }
  )
  .subscribe();

// 4. Override submitForm() para persistir no Supabase
const originalSubmitForm = window.submitForm;
window.submitForm = async function() {
  const result = await originalSubmitForm.call(this);
  
  // Se sucesso, enviar para Supabase
  if (result && result.appointment_code) {
    const { error } = await supabaseClient.rpc('create_appointment', {
      p_department_id: currentDeptId,
      p_appointment_date: formData.date,
      p_appointment_time: formData.time,
      p_num_participants: parseInt(formData['Quantas pessoas participarão desta sessão?']),
      p_citizen_name: formData['Nome Completo'],
      p_citizen_email: formData['E-mail Pessoal'],
      p_form_data: formData
    });
    
    if (error) {
      console.error('Erro ao salvar no Supabase:', error);
      alert('⚠️ Agendamento criado localmente, mas não sincronizado. Tente recarregar.');
    } else {
      console.log('✅ Agendamento sincronizado com Supabase');
    }
  }
  
  return result;
};
```

### Timeline
- **SQL Migration:** 30 min
- **Frontend Integration:** 2 horas
- **Testing (cross-device):** 1 hora
- **Rollback:** 15 min (DELETE tables + revert frontend)

---

## TAREFA 3: Personalização de Horários por Departamento

### Estado Atual
- ✅ Cada departamento tem `operatingHours` hardcoded (8-12, 13-17, 18-21)
- ❌ Sem UI para admin customizar
- ❌ Sem persistência de horários customizados

### Nova Funcionalidade

#### Tabela SQL (adicionar a 002_appointments_schema.sql)
```sql
CREATE TABLE IF NOT EXISTS agenda_sobral.department_hours (
  id              uuid              DEFAULT gen_random_uuid() PRIMARY KEY,
  department_id   text              NOT NULL REFERENCES agenda_sobral.departments(id),
  day_of_week     integer           NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  -- 0=Sunday, 1=Monday, ..., 6=Saturday
  start_time      time              NOT NULL,
  end_time        time              NOT NULL,
  is_active       boolean           DEFAULT true,
  created_at      timestamptz       DEFAULT now(),
  UNIQUE (department_id, day_of_week, start_time)
);

CREATE INDEX idx_dept_hours ON agenda_sobral.department_hours(department_id, day_of_week);
```

#### Admin UI (novo tab em form-admin-dash)
```html
<div id="dash-view-horarios-customizacao" style="display: none;">
  <h3>Personalizar Horários — Departamento</h3>
  <p class="subtitle">Configure horários disponíveis para cada dia da semana.</p>
  
  <div id="hours-config-container" style="display: grid; gap: 20px; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));">
    <!-- Template renderizado por JS para cada dia da semana -->
  </div>
</div>
```

#### JavaScript (admin.js)
```javascript
function loadHoursCustomization() {
  const dept = DEPARTMENTS[currentAdminDept];
  const container = document.getElementById('hours-config-container');
  container.innerHTML = '';
  
  const daysOfWeek = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  
  daysOfWeek.forEach((day, dow) => {
    const card = document.createElement('div');
    card.style.cssText = 'border: 1px solid var(--gray-200); padding: 20px; border-radius: 8px;';
    
    card.innerHTML = `
      <h4>${day}</h4>
      <div style="display: flex; gap: 10px; flex-direction: column;">
        <div>
          <label>Início:</label>
          <input type="time" class="start-${dow}" value="08:00">
        </div>
        <div>
          <label>Fim:</label>
          <input type="time" class="end-${dow}" value="12:00">
        </div>
        <label>
          <input type="checkbox" class="active-${dow}" checked>
          Ativo
        </label>
        <button onclick="addTimeBlock(${dow})">+ Adicionar outro horário</button>
      </div>
    `;
    
    container.appendChild(card);
  });
  
  // Botão Salvar
  const saveBtn = document.createElement('button');
  saveBtn.innerText = 'Salvar Horários';
  saveBtn.onclick = saveHoursCustomization;
  container.appendChild(saveBtn);
}

async function saveHoursCustomization() {
  const hours = {};
  
  // Coletar dados dos inputs
  document.querySelectorAll('input[type="time"]').forEach(input => {
    const dow = input.className.split('-')[1];
    const type = input.className.split('-')[0];
    if (!hours[dow]) hours[dow] = {};
    hours[dow][type] = input.value;
  });
  
  // Salvar no Supabase
  const { error } = await supabaseClient
    .from('department_hours')
    .delete()
    .eq('department_id', currentAdminDept);
  
  if (!error) {
    const records = [];
    Object.entries(hours).forEach(([dow, times]) => {
      records.push({
        department_id: currentAdminDept,
        day_of_week: parseInt(dow),
        start_time: times.start,
        end_time: times.end,
        is_active: true
      });
    });
    
    await supabaseClient.from('department_hours').insert(records);
    alert('✅ Horários salvos com sucesso!');
    location.reload(); // Recarregar para aplicar mudanças
  }
}
```

### Timeline
- **SQL:** 15 min
- **Admin UI:** 1 hora
- **Testing:** 30 min
- **Rollback:** 5 min

---

## IMPLEMENTAÇÃO SEQUENCIAL RECOMENDADA

### Semana 1
1. **Dia 1 (30 min):** Executar sql/001_lgpd_consents.sql no EasyPanel
   - Validar com queries
   - Testar RPC via Supabase Studio
   
2. **Dias 2-3 (3 horas):** Persistência de agendamentos (sql/002 + frontend)
   - Criar tabelas
   - Integrar create_appointment RPC
   - Testar end-to-end com 2 browsers
   
3. **Dia 4-5 (2 horas):** Personalização de horários
   - Criar admin UI
   - Testar salvamento

### Validação Final (Dia 5-6)
- [ ] Teste stress: 50 usuários simultâneos com novo Supabase
- [ ] Cross-device: agendamento em mobile, aparece em desktop em <1s
- [ ] Admin: customizar horários de um dept, testar em outro usuário
- [ ] LGPD: registrar consentimento para todos os agendamentos novos

---

## Risk Mitigation

| Risco | Probabilidade | Impacto | Mitigation |
|-------|---|---|---|
| EasyPanel fora do ar | LOW | CRITICAL | Ter credenciais backup, verificar uptime antes |
| Conflito schema agenda_sobral | MEDIUM | HIGH | Backup DB antes, reverter se needed |
| Real-time latency | MEDIUM | MEDIUM | Test com 100 clientes simultâneos antes de launch |
| LGPD tracking falha silenciosamente | LOW | CRITICAL | Logging e alertas, verificar BD após cada agendamento |

---

## Success Criteria

- ✅ LGPD: 100% de agendamentos têm consent_id registrado
- ✅ Supabase: 0 conflitos de capacidade (race condition resolvida)
- ✅ Real-time: latência <1s entre clientes
- ✅ Horários customizados: aparecem em <5s após salvar
- ✅ Stress test: 100 usuários simultâneos, 0 overflow

---

## Rollback Plan (se necessário)

```bash
# Reverter LGPD
DROP TABLE agenda_sobral.lgpd_consents;
DROP FUNCTION agenda_sobral.log_consent;

# Reverter agendamentos
DROP TABLE agenda_sobral.appointment_audit;
DROP TABLE agenda_sobral.appointments;
DROP TABLE agenda_sobral.slots;
DROP TABLE agenda_sobral.departments;
DROP FUNCTION agenda_sobral.create_appointment;

# Frontend: remover Supabase integration
git revert <commit> -n

# Restaurar localStorage
localStorage.clear(); // Reset
```

---

**Próxima Ação:** Aguardar aprovação + acesso ao Supabase EasyPanel para iniciar Tarefa 1.
