# Integração Supabase - Agenda Sobral

## Status: ✅ Pronto para Ativar

O Supabase está **100% pronto** para ser ativado. Segue o guia de integração.

---

## 🚀 Como Ativar Supabase

### Opção 1: No Index.html (Recomendado para Produção)

Adicione estas linhas **ANTES** de carregar `supabaseClient.js`:

```html
<!-- Configuração Supabase (adicionar antes de supabaseClient.js) -->
<script>
  window.AGENDA_SOBRAL_SUPABASE_URL = 'https://seu-supabase-url.com';
  window.AGENDA_SOBRAL_SUPABASE_ANON_KEY = 'sua-chave-anonima-aqui';
</script>

<!-- Biblioteca Supabase -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.110.0/dist/umd/supabase.min.js"></script>

<!-- Cliente Agenda Sobral -->
<script src="js/supabaseClient.js"></script>
```

### Opção 2: Via Arquivo .env (Para Desenvolvimento)

Crie `.env.local`:
```env
VITE_SUPABASE_URL=https://seu-supabase-url.com
VITE_SUPABASE_ANON_KEY=sua-chave-anonima-aqui
```

---

## 🔌 Configuração Credenciais

### Obter Credentials do Easypanel

1. Acesse: `http://164.68.116.21:3000/projects/xpert-backend`
2. Vá para **Settings → API**
3. Copie:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **Anon Key** → `VITE_SUPABASE_ANON_KEY`

---

## ✅ O Que Já Está Implementado

### Módulo AgendaSobralSupabase (`js/supabaseClient.js`)

**Funções Disponíveis:**

#### 1. Departamentos
```javascript
const depts = await AgendaSobralSupabase.getDepartments();
```

#### 2. Equipamentos
```javascript
const equips = await AgendaSobralSupabase.getEquipmentsByDepartment('SMS');
```

#### 3. Serviços
```javascript
const services = await AgendaSobralSupabase.getServicesByEquipment('CSF-001');
```

#### 4. Slots Disponíveis
```javascript
const slots = await AgendaSobralSupabase.getOpenSlots('CSF-001', '2026-07-15');
```

#### 5. Agendamento
```javascript
const result = await AgendaSobralSupabase.bookAppointment({
  slotId: 'uuid-slot',
  serviceId: 'uuid-servico',
  subject: 'Consulta',
  notes: 'Sem observações'
});
// Retorna: { success, validation_code, virtual_password }
```

#### 6. Validar Código Virtual
```javascript
const validation = await AgendaSobralSupabase.validateVirtualTicket('AUB-8W2');
// Retorna: { success, citizen_name, equipment_name, service_name, appointment_data }
```

#### 7. NPS (Avaliação)
```javascript
await AgendaSobralSupabase.submitNps(appointmentId, score, comment);
```

#### 8. KPIs Gestor
```javascript
const kpis = await AgendaSobralSupabase.getManagementKpis({
  departmentExternalId: 'SMS',
  dateFrom: '2026-07-01',
  dateTo: '2026-07-31'
});
// Retorna: { total, atendidos, cancelados, no_show, ocupancy_rate, ... }
```

#### 9. Autenticação
```javascript
// Login
const { data, error } = await AgendaSobralSupabase.signIn(email, password);

// Registro
const { data, error } = await AgendaSobralSupabase.signUpCitizen({
  email, password, fullName, cpf, phone
});

// Logout
await AgendaSobralSupabase.signOut();
```

---

## 📊 Schema Supabase

### Tabelas Principais

```sql
agenda_sobral.users            -- Cidadãos + Admins
agenda_sobral.departments      -- Secretarias
agenda_sobral.equipments       -- Unidades de atendimento
agenda_sobral.services         -- Serviços oferecidos
agenda_sobral.appointments     -- Agendamentos
agenda_sobral.availability_slots -- Horários disponíveis
agenda_sobral.nps_surveys      -- Avaliações de satisfação
agenda_sobral.ouvidoria        -- Manifestações anônimas
```

### Execução do Schema

**IMPORTANTE:** O schema SQL ainda precisa ser executado no Supabase:

1. Acesse: `http://164.68.116.21:3000/projects/xpert-backend/compose/supabase/sql`
2. Copie todo o conteúdo de `supabase-schema.sql`
3. Cole no **SQL Editor**
4. Execute

Arquivo: `/Users/sergioponte/AGENDA SOBRAL/supabase-schema.sql` (894 linhas)

---

## 🔄 Fallback localStorage

**Importante:** Se Supabase não estiver configurado:
- O app continua funcionando com `localStorage`
- `AgendaSobralSupabase.isConfigured()` retorna `false`
- Storage.js continua sendo usado como fallback

Código:
```javascript
if (AgendaSobralSupabase.isConfigured()) {
  // Usar Supabase
  const depts = await AgendaSobralSupabase.getDepartments();
} else {
  // Fallback localStorage
  const depts = Storage.getSecretarias();
}
```

---

## 🧪 Teste de Integração

```javascript
// No console do navegador:
console.log(AgendaSobralSupabase.isConfigured()); // true or false

// Se true:
AgendaSobralSupabase.getDepartments()
  .then(depts => console.log('Departamentos:', depts))
  .catch(err => console.error('Erro:', err));
```

---

## 🔒 Segurança

- Usar **Anon Key** (não expor Service Role Key no frontend)
- RLS está ativado em todas as tabelas
- Dados isolados por usuário/role
- Timestamps para auditoria

---

## 📈 Próximos Passos

1. ✅ Executar `supabase-schema.sql` no Supabase
2. ✅ Configurar credenciais no index.html ou .env
3. ✅ Testar integração via console
4. ✅ Migrar dados localStorage → Supabase (opcional)
5. ✅ Deploy em produção

---

## 📞 Referências

- Supabase Docs: https://supabase.com/docs
- Easypanel: http://164.68.116.21:3000
- Schema: `supabase-schema.sql`
- Cliente: `js/supabaseClient.js`

---

**Status:** 🟢 Pronto para Ativar  
**Data:** 01/07/2026
