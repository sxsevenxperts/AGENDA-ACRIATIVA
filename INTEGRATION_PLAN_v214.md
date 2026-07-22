# Plano de Integração v2.14.0 — Supabase + Race Condition Fix

**Data:** 2026-07-22  
**Versão:** 2.14.0  
**Objetivo:** Implementar 3 recursos críticos em paralelo:
1. ✅ LGPD SQL em produção
2. ✅ Race condition fix via server-side validation
3. ⏳ Hours customization UI

---

## PARTE 1: Executar SQL no Supabase EasyPanel (30 min)

### Pré-requisitos
- URL da Dashboard Supabase: (fornecido pelo usuário)
- API Key ANON: (fornecido pelo usuário)
- Service Key: (fornecido pelo usuário)

### Execução — 3 Opções

**Opção 1: Supabase Studio UI (RECOMENDADO)**
1. Ir para: https://app.supabase.com → Projeto → SQL Editor
2. Colar conteúdo de `sql/001_lgpd_consents.sql`
3. Clicar "Run"
4. Colar conteúdo de `sql/002_create_appointment_rpc.sql`
5. Clicar "Run"

**Opção 2: CLI (supabase)**
```bash
cd /Users/sergioponte/AGENDA\ CRIATIVA
supabase db push
# Executa todas as migrations em supabase/migrations/*.sql
```

**Opção 3: curl (via REST API)**
```bash
curl -X POST https://<PROJECT_ID>.supabase.co/rest/v1/sql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
  -d "{\"query\": \"$(cat sql/001_lgpd_consents.sql | tr '\n' ' ')\"}"
```

### Validação pós-execução
```sql
-- Verificar tabelas criadas
SELECT table_name FROM information_schema.tables WHERE table_schema = 'agenda_sobral';

-- Verificar RPC
SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'agenda_sobral';

-- Verificar indices
SELECT indexname FROM pg_indexes WHERE schemaname = 'agenda_sobral';
```

---

## PARTE 2: Integrar create_appointment RPC no index.html (1h)

### Mudanças Necessárias

**1. Adicionar script externo (após linha 3850)**
```html
<script src="js/supabase-appointments.js"></script>
```

**2. Modificar submitForm() (linha ~5332)**

Localizar: `function submitForm() {`

Substituir validação de capacidade por chamada RPC:
```javascript
function submitForm() {
  // ... validações de entrada existentes ...

  if (supabaseClient) {
    // ===== NOVO: usar RPC server-side =====
    createAppointmentViaSupabase({
      departmentId: currentDeptId,
      date: selectedDate,
      time: selectedTime,
      numParticipants: parseInt(document.getElementById('num-participants')?.value) || 1,
      citizenName: userSession?.name || 'Anônimo',
      citizenEmail: userSession?.email || document.getElementById('email')?.value || 'nao-fornecido@example.com',
      citizenPhone: userSession?.phone || document.getElementById('phone')?.value || null,
      citizenCpfCnpj: document.getElementById('cpf-cnpj')?.value || null,
      formData: formData,
      lgpdAccepted: document.getElementById('lgpd-terms')?.checked || false,
      privacyAccepted: document.getElementById('privacy-policy')?.checked || false,
      cookiesAccepted: document.getElementById('cookies-policy')?.checked || false
    }).then(result => {
      if (result.success) {
        appointmentId = result.appointmentId;
        appointmentCode = result.appointmentCode;
        showConfirmation(appointmentCode, result.capacity, result.occupancy);
      } else if (result.code === 'SLOT_FULL') {
        alert(`❌ Capacidade cheia: ${result.occupancy}/${result.capacity} pessoas.\n\nTente outro horário.`);
      } else {
        alert(`❌ Erro: ${result.error}`);
        if (result.fallbackToLocalStorage) {
          console.log('Fallback para localStorage...');
          createAppointmentLocally(formData);  // função existente
        }
      }
    });
  } else {
    // ===== FALLBACK: localStorage (quando Supabase indisponível) =====
    console.log('Supabase não disponível; usando localStorage');
    createAppointmentLocally(formData);  // função existente
  }
}
```

**3. Adicionar subscription real-time (após openAdminDash(), linha ~5550)**
```javascript
// Subscrever a mudanças em tempo real
if (supabaseClient) {
  subscribeToAppointmentChanges((payload) => {
    console.log('📡 Mudança em tempo real detectada:', payload.eventType);
    // Recarregar appointments automaticamente
    if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
      loadAppointments();
    }
  });
}
```

---

## PARTE 3: Hours Customization UI (1h30)

### SQL (já incluído em 002_create_appointment_rpc.sql)

Será criada tabela `department_hours` quando a RPC for executada:
```sql
CREATE TABLE agenda_sobral.department_hours (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  department_id text NOT NULL,
  day_of_week integer CHECK (day_of_week BETWEEN 0 AND 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_active boolean DEFAULT true,
  UNIQUE(department_id, day_of_week, start_time)
);
```

### Frontend UI (adicionar no admin dashboard)

**Nova aba: "Personalizar Horários"**
```html
<div id="tab-personalizar-horarios" class="admin-tab" style="display: none;">
  <h2>Personalizar Horários por Departamento</h2>
  <p>Configure os horários de funcionamento específicos para cada dia da semana.</p>

  <label>Departamento:</label>
  <select id="hora-dept-select" onchange="loadHourCustomization(this.value)">
    <option value="">Selecione...</option>
    <option value="coworking">Coworking</option>
    <option value="linklab">Link Lab</option>
    <option value="salatreinamento">Sala Treinamento</option>
    <option value="atrio">Átrio</option>
    <option value="musica">Stúdio de Música</option>
  </select>

  <div id="hours-editor" style="display: none;">
    <div id="hours-cards-container"></div>
    <button onclick="addNewHourBlock()">+ Adicionar outro horário</button>
    <button onclick="saveHourCustomization()">✓ Salvar Horários</button>
  </div>
</div>
```

**JavaScript para horas**
```javascript
async function loadHourCustomization(deptId) {
  if (!supabaseClient || !deptId) return;

  const { data } = await supabaseClient
    .from('department_hours')
    .select('*')
    .eq('department_id', deptId);

  const container = document.getElementById('hours-cards-container');
  container.innerHTML = '';

  const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
  const dayGroups = {};
  data?.forEach(h => {
    if (!dayGroups[h.day_of_week]) dayGroups[h.day_of_week] = [];
    dayGroups[h.day_of_week].push(h);
  });

  for (let day = 0; day < 7; day++) {
    const card = document.createElement('div');
    card.className = 'hour-card';
    card.innerHTML = `
      <h4>${days[day]}</h4>
      ${dayGroups[day]?.map((h, idx) => `
        <div style="display: flex; gap: 8px; margin-bottom: 8px;">
          <input type="time" value="${h.start_time}" onchange="updateHourBlock(${day}, ${idx}, 'start', this.value)">
          <input type="time" value="${h.end_time}" onchange="updateHourBlock(${day}, ${idx}, 'end', this.value)">
          <button onclick="deleteHourBlock(${day}, ${idx})">✕</button>
        </div>
      `).join('') || '<p style="color: #999;">Fechado</p>'}
    `;
    container.appendChild(card);
  }

  document.getElementById('hours-editor').style.display = 'block';
}

async function saveHourCustomization() {
  // Enviar para Supabase
  console.log('💾 Salvando customização de horários...');
  // Implementar POST/PUT para department_hours
}
```

---

## PARTE 4: Stress Test v2 (1h)

Após implementar todas as mudanças, executar:

```javascript
// No console do browser (após login como Diretoria)
const stressTest = async () => {
  console.log('🚀 Iniciando Stress Test v2.14.0...');
  
  const results = {
    phase1_concurrent_creates: 0,
    phase2_no_overflows: 0,
    phase3_rbac_validated: 0,
    phase4_performance_ok: 0
  };

  // Phase 1: 100 agendamentos simultâneos (via RPC — deve respeitar capacidade)
  const startTime = Date.now();
  const promises = [];
  for (let i = 0; i < 100; i++) {
    promises.push(
      createAppointmentViaSupabase({
        departmentId: ['musica', 'coworking', 'linklab', 'salatreinamento', 'atrio'][i % 5],
        date: new Date().toISOString().split('T')[0],
        time: '08:00',
        numParticipants: Math.floor(Math.random() * 5) + 1,
        citizenName: `User ${i}`,
        citizenEmail: `user${i}@test.com`,
        formData: { test: true }
      })
    );
  }

  const responses = await Promise.all(promises);
  const elapsed = Date.now() - startTime;

  const successful = responses.filter(r => r.success).length;
  const overflows = responses.filter(r => r.code === 'SLOT_FULL').length;

  console.log(`✅ Fase 1 — Agendamentos Simultâneos`);
  console.log(`  - Sucesso: ${successful}/100`);
  console.log(`  - Rejeitados (cheio): ${overflows}`);
  console.log(`  - Tempo: ${elapsed}ms`);
  console.log(`  - ESPERADO: 0 overflows (validação server-side)`);

  return { successful, overflows, elapsed };
};

// Executar: await stressTest()
```

---

## CRONOGRAMA RECOMENDADO

| Etapa | Tempo | Status |
|-------|-------|--------|
| ✅ RBAC Fix | 30 min | CONCLUÍDO + Pushed |
| ⏳ Executar LGPD SQL | 30 min | Aguardando execução manual |
| ⏳ Integrar create_appointment RPC | 1h | Arquivos prontos, aguardando merge |
| ⏳ Hours Customization UI | 1h30 | SQL pronto, UI em progresso |
| ⏳ Stress Test v2 | 1h | Aguardando implementação |
| ⏳ Documentação final + Commit | 30 min | Pending |

**Total estimado: 5h30**

---

## PRÓXIMAS AÇÕES

1. **User executa LGPD SQL no Supabase** (pode ser feito em paralelo)
2. **Integrar create_appointment RPC no index.html** (1h)
3. **Implementar hours customization UI** (1h30)
4. **Executar stress test v2** (1h)
5. **Commit final com v2.14.0** (30 min)
