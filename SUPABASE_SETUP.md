# Setup Supabase para Agenda Sobral

## Informações de Conexão

- **Servidor Easypanel:** http://164.68.116.21:3000
- **Projeto:** xpert-backend
- **API Easypanel:** 04a2a1fe3eda542864103718ae062d6b58c7e4747e5bbcd29b8556284f794fe2
- **Deploy Endpoint:** http://164.68.116.21:3000/api/compose/deploy/a0daf3a1e90fb6f2f35ec24bd080a324c2c689f304984654

## Passo 1: Executar Schema SQL

1. Acesse o painel Supabase no Easypanel:
   ```
   http://164.68.116.21:3000/projects/xpert-backend/compose/supabase/deployments
   ```

2. Abra o **SQL Editor**

3. Crie uma nova query e copie o conteúdo de `supabase-schema.sql` completo

4. Execute a query (clique em "Run" ou Ctrl+Enter)

5. Aguarde a execução - deve criar:
   - Schema `agenda_sobral`
   - 9 tabelas principais
   - Índices para performance
   - Políticas RLS
   - 8 funções RPC

## Passo 2: Configurar Variáveis de Ambiente

1. No **painel Easypanel**, vá para **Projeto → Configurações**

2. Encontre as credenciais Supabase:
   - **Supabase URL** (Project URL)
   - **Supabase Anon Key** (Chave pública/anônima)
   - **Supabase Service Role Key** (Chave de administrador - guardar com segurança)

3. Crie um arquivo `.env.local` na raiz do projeto:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima-aqui
```

4. Para o app web, configure as variáveis **globais** antes de carregar `supabaseClient.js`:

```html
<script>
  window.AGENDA_SOBRAL_SUPABASE_URL = 'https://seu-projeto.supabase.co';
  window.AGENDA_SOBRAL_SUPABASE_ANON_KEY = 'sua-chave-anonima-aqui';
</script>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.110.0/dist/umd/supabase.min.js"></script>
<script src="js/supabaseClient.js"></script>
```

## Passo 3: Usar o Cliente Supabase no App

O arquivo `js/supabaseClient.js` já possui todas as funções necessárias.

### Verificar se Supabase está configurado:

```javascript
if (AgendaSobralSupabase.isConfigured()) {
  console.log('Supabase pronto!');
  const client = AgendaSobralSupabase.getClient();
} else {
  console.log('Usando localStorage (fallback)');
}
```

### Exemplos de Uso:

#### Listar departamentos
```javascript
const departments = await AgendaSobralSupabase.getDepartments();
```

#### Listar equipamentos de um departamento
```javascript
const equipments = await AgendaSobralSupabase.getEquipmentsByDepartment('SMS');
```

#### Listar serviços de um equipamento
```javascript
const services = await AgendaSobralSupabase.getServicesByEquipment('CSF-001');
```

#### Listar slots disponíveis
```javascript
const slots = await AgendaSobralSupabase.getOpenSlots('CSF-001', '2026-07-15');
```

#### Agendar um compromisso
```javascript
const result = await AgendaSobralSupabase.bookAppointment({
  slotId: 'uuid-do-slot',
  serviceId: 'uuid-do-servico',
  subject: 'Consulta médica',
  notes: 'Sem observações'
});
console.log(result.validation_code); // "AUB-8W2"
```

#### Validar código virtual
```javascript
const validation = await AgendaSobralSupabase.validateVirtualTicket('AUB-8W2');
if (validation.success) {
  console.log(`Cidadão ${validation.citizen_name} no equipamento ${validation.equipment_name}`);
}
```

#### Enviar NPS
```javascript
await AgendaSobralSupabase.submitNps(appointmentId, 9, 'Atendimento excelente!');
```

#### Relatório de KPIs
```javascript
const kpis = await AgendaSobralSupabase.getManagementKpis({
  departmentExternalId: 'SMS',
  dateFrom: '2026-07-01',
  dateTo: '2026-07-31'
});
console.log(`Taxa de ocupação: ${kpis.occupancy_rate}%`);
```

## Passo 4: Autenticação (Supabase Auth)

O arquivo `js/supabaseClient.js` suporta autenticação via Supabase Auth:

```javascript
// Registrar cidadão
const { data, error } = await AgendaSobralSupabase.signUpCitizen({
  email: 'cidadao@example.com',
  password: 'senha-segura',
  fullName: 'João Silva',
  cpf: '123.456.789-00',
  phone: '(88) 99999-9999'
});

// Login
const session = await AgendaSobralSupabase.signIn('cidadao@example.com', 'senha');

// Logout
await AgendaSobralSupabase.signOut();

// Recuperar sessão
const currentSession = await AgendaSobralSupabase.getSession();
```

## Estrutura de Dados Principais

### Tabelas Críticas

| Tabela | Descrição |
|--------|-----------|
| `users` | Cidadãos e administradores |
| `departments` | Secretarias municipais (SMS, SME, etc.) |
| `equipments` | Unidades de atendimento (CSF, escolas) |
| `services` | Serviços oferecidos (consultas, matrículas) |
| `appointments` | Agendamentos com validação virtual |
| `availability_slots` | Slots de agendamento (30 em 30 min) |
| `nps_surveys` | Pesquisa de satisfação |
| `ouvidoria` | Manifestações anônimas |

### Campos Importantes

- **appointments.validation_code**: Código único para validação no equipamento (ex: "AUB-8W2")
- **appointments.virtual_password**: Senha de chamada (ex: "SMS-001")
- **appointments.status**: 'scheduled', 'chamado', 'attended', 'no_show', 'cancelled'

## Backup e Migrations

### Fazer backup do schema:

```bash
# Via CLI do Supabase
supabase db pull --db-url postgresql://user:pass@host/db --schema-only > backup-$(date +%Y-%m-%d).sql

# Ou exportar via painel Easypanel
```

### Aplicar mudanças futuras:

1. Edite o arquivo SQL
2. Copie para o **SQL Editor** do Supabase
3. Execute

## Troubleshooting

### "Schema agenda_sobral não existe"
- Verifique se o SQL foi executado completamente
- Procure por erros de sintaxe no console
- Tente executar `CREATE SCHEMA IF NOT EXISTS agenda_sobral;` manualmente

### "Supabase não configurado"
- Verifique se `window.AGENDA_SOBRAL_SUPABASE_URL` e `window.AGENDA_SOBRAL_SUPABASE_ANON_KEY` estão definidas
- Confirme que a biblioteca `@supabase/supabase-js` foi carregada
- Abra o console do navegador e execute: `AgendaSobralSupabase.isConfigured()`

### Erros RLS (Row Level Security)
- Verifique se o usuário está autenticado: `auth.uid()`
- Confirme que as políticas RLS foram criadas
- Use `SECURITY DEFINER` nas funções para dar permissões

### Performance lenta

- Verifique índices: `SELECT * FROM pg_indexes WHERE schemaname = 'agenda_sobral';`
- Ative compression de dados nas configurações
- Use connection pooling (Pgbouncer)

## Monitoramento

### Verificar saúde da conexão:

```javascript
(async () => {
  try {
    const client = AgendaSobralSupabase.getClient();
    const { data } = await client.from('departments').select('count').limit(1);
    console.log('✓ Supabase conectado');
  } catch (err) {
    console.error('✗ Erro de conexão:', err.message);
  }
})();
```

### Logs de queries lentas:

Acesse o painel Supabase → Database → Performance para ver queries lentas.

---

**Última atualização:** 01/07/2026

Para suporte, consulte: [Documentação Supabase](https://supabase.com/docs)
