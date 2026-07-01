# Supabase Agenda Sobral

Atualizado em: 2026-07-01

## Alvo

Usar o Supabase self-hosted do EasyPanel no projeto `xpert-backend`, mantendo o Agenda Sobral isolado no schema:

```sql
CREATE SCHEMA IF NOT EXISTS agenda_sobral;
```

## O que foi criado

- Migration Supabase em `supabase/migrations/20260701034556_agenda_sobral_schema_isolation.sql`.
- Schema `agenda_sobral` com tabelas reais de usuarios, departamentos, equipamentos, servicos, horarios, agendamentos, historico, NPS, OKRs e auditoria.
- RLS por usuario, secretaria/departamento e equipamento.
- RPCs transacionais para:
  - registrar usuario cidadao;
  - provisionar acesso institucional;
  - reservar horario sem dupla reserva;
  - cancelar atendimento;
  - validar senha virtual;
  - concluir atendimento;
  - marcar falta;
  - responder NPS;
  - gerar KPIs e relatorio NPS.
- Adapter front-end em `js/supabaseClient.js`.
- Seed script em `scripts/supabase_seed_agenda_sobral.mjs`.

## Status no servidor EasyPanel

Aplicado em 2026-07-01 no Supabase self-hosted:

- Migration `agenda_sobral` aplicada via `postgres-meta` (`/pg/query`).
- `agenda_sobral` incluído no `PGRST_DB_SCHEMAS` remoto após a criação do schema.
- Seed remoto executado:
  - 23 departamentos/secretarias;
  - 62 equipamentos;
  - 135 serviços.
- Acessos demo Supabase provisionados:
  - `demo@sobral.ce.gov.br / demo123` como `usuario`;
  - `admin@sobral.ce.gov.br / admin123` como `super_admin`;
  - `admin@sedhas.sobral.ce.gov.br / admin123` como `secretaria_admin`;
  - `admin@sefin.sobral.ce.gov.br / admin123` como `secretaria_admin`;
  - `admin@casa-cidadao.sobral.ce.gov.br / admin123` como `equipamento_admin`.
- Smoke test RLS concluído:
  - SEDHAS abriu slot;
  - usuário demo agendou;
  - SEFIN foi bloqueado ao tentar validar;
  - SEDHAS validou e concluiu atendimento;
  - usuário demo respondeu NPS;
  - relatórios/KPIs responderam via RPC.

## Isolamento de acessos

- `usuario`: pode agendar em qualquer secretaria/equipamento ativo, mas so consulta seus proprios agendamentos, historico e NPS.
- `secretaria_admin` e `departamento_admin`: acessam apenas departamentos vinculados em `department_members`.
- `equipamento_admin` e `colaborador`: acessam apenas equipamentos vinculados em `equipment_members`.
- `super_admin`: acessa toda a base do schema `agenda_sobral`.

## Passos no EasyPanel/Supabase

1. Aplicar a migration no banco.

2. Expor o schema no PostgREST do compose Supabase:

```env
PGRST_DB_SCHEMAS=public,storage,graphql_public,...,agenda_sobral
```

Importante: não inclua `agenda_sobral` no `PGRST_DB_SCHEMAS` antes de criar o schema no Postgres. Isso impede o PostgREST de montar o schema cache.

3. Redeploy do compose Supabase no EasyPanel.

Use o endpoint de deploy informado pelo painel ou o botao Deploy do EasyPanel. Nao salve o token no repositorio.

Com connection string Postgres, a migration tambem pode ser reaplicada assim:

```bash
supabase db query \
  --db-url "$SUPABASE_DB_URL" \
  --file supabase/migrations/20260701034556_agenda_sobral_schema_isolation.sql
```

Ou pelo SQL Editor/console do Supabase self-hosted, colando o conteudo da migration.

4. Popular departamentos, equipamentos e servicos a partir do scraper/local data:

```bash
SUPABASE_URL="https://xpert-backend-supabase.qfotry.easypanel.host" \
SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY" \
node scripts/supabase_seed_agenda_sobral.mjs
```

O script tambem tenta ler localmente `/Users/sergioponte/SUPABASE SERVIDOR EASYPANEL/.credenciais-supabase-novas.json` quando as variaveis nao forem informadas.

## Front-end

O app continua funcionando em modo local com `localStorage`. Para ligar o front no Supabase, carregue uma configuracao antes de `js/supabaseClient.js`, usando o modelo:

```html
<script src="js/config.local.js"></script>
```

Base do arquivo:

```js
window.AGENDA_SOBRAL_SUPABASE_URL = 'https://xpert-backend-supabase.qfotry.easypanel.host';
window.AGENDA_SOBRAL_SUPABASE_ANON_KEY = '<SUPABASE_ANON_KEY_PUBLICA>';
```

Nunca coloque `SERVICE_ROLE_KEY` no front-end.

## Proximos passos tecnicos

- Criar tela operacional para provisionar usuarios Supabase Auth e chamar `agenda_sobral.provision_access`.
- Trocar gradualmente os metodos de `Storage`, `Auth`, `Scheduling` e `Admin` para chamar `AgendaSobralSupabase`.
- Criar job de seed/atualizacao apos cada scraper.
- Aplicar migration diretamente no banco assim que houver `SUPABASE_DB_URL` ou acesso ao SQL Editor do servidor.
