# Planner Agenda Sobral

Atualizado em: 2026-07-01 (revisão E2E + menu/gov.br/acessos)

## Objetivo do aplicativo

Criar uma plataforma municipal de agendamento onde o usuário acessa todos os departamentos, secretarias, unidades e equipamentos públicos disponíveis, escolhe serviço, unidade, data, horário e assunto, recebe senha virtual e valida sua presença no equipamento público.

O acesso Departamento/Secretaria é institucional, escolhido em caixa de seleção na tela de login, e deve visualizar apenas os dados daquele departamento e de seus equipamentos, alimentados pelos agendamentos dos usuários.

## Entregas já realizadas

- Identidade visual aplicada com logomarca da Prefeitura de Sobral e paleta institucional.
- Hero e barra de pesquisa corrigidos, responsivos e funcionais.
- Barra de busca do hero reorganizada no mobile, sem sobreposição com header ou botão de agendamento.
- Busca por serviço, secretaria, equipamento, unidade, bairro ou assunto.
- Busca com sugestão de serviços similares e opção de reportar serviço em falta à Ouvidoria.
- Histórico de buscas do cidadão em `#/historico-buscas`.
- Fluxo de usuário com agendamento em qualquer secretaria/equipamento.
- Fluxo Departamento/Secretaria com escolha em caixa de seleção no login.
- Menu contextual no botão de menu com navegação, conta, ajuda, métricas e saída conforme perfil.
- Escopo administrativo por departamento, com equipamentos separados.
- Seletor de equipamento em dashboard, agenda, serviços e fila.
- Agendamento com secretaria, equipamento, serviço, data, hora e senha virtual.
- Geração de código de validação virtual e comprovante com QR visual.
- Validação de senha virtual no equipamento público.
- Fila de atendimento com chamada, atendido e falta.
- Histórico de atendimento com linha do tempo e desfechos.
- Pesquisa NPS após atendimento concluído.
- Relatórios NPS por setor/equipamento e colaborador.
- Relatório de agendamentos por pessoa.
- KPIs operacionais e OKRs de gestão.
- Relatório por departamento com performance por equipamento e ranking de assuntos buscados.
- Acesso demo documentado em `DEMO_ACCESS.json`.
- Scraper do portal oficial de Sobral executado e base local atualizada.
- Service worker revisado com cache versionado.
- Schema Supabase `agenda_sobral` criado em migration com RLS por usuário, secretaria/departamento e equipamento.
- Adapter front-end Supabase adicionado sem quebrar o modo local com `localStorage`.
- Seed script criado para sincronizar departamentos, equipamentos e serviços do scraper/local data para o Supabase.
- Documentação operacional do Supabase/EasyPanel criada em `SUPABASE_AGENDA_SOBRAL.md`.

### Correção crítica de cache/deploy (versão presa no servidor)

Sintoma: localhost mostrava a versão nova, mas o servidor (produção) mostrava versão antiga mesmo após redeploy.

Causa raiz: o site está atrás do **Cloudflare**, que cacheava a URL `/sw.js` (sem query) por `max-age=14400` (4h). O navegador nunca recebia o service worker novo e o SW antigo (cache-first) servia `index.html`/`app.js` velhos do próprio cache. O **origin estava correto (v9)** — confirmado furando o cache com `?nocache=`.

Correção definitiva (no código): o registro do service worker agora usa **URL versionada** `sw.js?v=<SW_VERSION>`. Cada bump de versão vira uma URL nova (cache-miss no CDN), forçando a troca do SW — mesma técnica do `app.js?v=N`. Também recarrega a página uma vez quando um SW novo assume (sem loop na primeira instalação).

**Procedimento de release (SEMPRE que publicar mudança de CSS/JS):**
1. Incrementar o `?v=N` de todos os CSS/JS no `index.html`.
2. Atualizar `SW_VERSION` no script de registro do `index.html` (mesmo N).
3. Atualizar `CACHE_NAME = 'agenda-sobral-vN'` no `sw.js`.
4. Commit + push (deploy).

**Uma vez, para destravar quem já está preso na versão antiga:** no Cloudflare, *Caching → Purge Everything* (ou purgar `/sw.js`). Recomendado também criar uma *Cache Rule* que faz **Bypass cache** para `/sw.js`, `/index.html` e `/`. Sem o purge, os navegadores presos se recuperam sozinhos em ≤4h (expiração do cache do CDN).

### Entregas desta sessão (tipografia, rodapé login)

- **Tipografia premium** alinhada à identidade institucional: **Montserrat** (títulos/display) + **Inter** (texto/UI), substituindo Open Sans. Confirmado que o portal oficial `sobral.ce.gov.br` usa Open Sans; a escolha eleva o acabamento mantendo o caráter humanista/governamental. Aplicado via `--font-family` e `--font-display`.
- **Rodapé institucional nas telas de acesso** (login/cadastro/esqueceu-senha) inclusive no mobile: classe `route-auth` no `body` exibe o `#app-footer` completo (logo, Links Úteis, Contato, copyright) nessas rotas.
- Cache-busting atualizado para `?v=9` + `sw.js` v9.

### Entregas desta sessão (menu, gov.br, acessos)

- Menu contextual ☰ reescrito como painel dinâmico por perfil (Navegação, Conta, Métricas & Relatórios, Ajuda) com **Sair do acesso**; fecha ao navegar, clicar fora ou ESC. Ícones ausentes (`help`, `message`, `grid`, `users`, `file`, `star`) adicionados a `SobralData.icones`.
- **Gestão de Acessos por departamento** (`#/admin/acessos`): cada equipamento público do departamento tem login próprio, criado/ativado/desativado pelo acesso do departamento e isolado ao departamento (via `Storage.saveAdmins`).
- **Login/cadastro com gov.br**: botão oficial nas telas de login e criar conta; redireciona quando `window.GOVBR_AUTH_URL` estiver configurado; sem credencial, informa que a integração OAuth depende do credenciamento do serviço no portal gov.br.
- Rodapé com links reais: Prefeitura, Ouvidoria interna, Transparência (`transparencia.sobral.ce.gov.br`), Diário Oficial (`diario.sobral.ce.gov.br`); endereço abre no Google Maps e telefone via `tel:`.
- Padding de borda dos containers melhorado (responsivo 20/24/32px).
- Cache-busting `?v=8` em todos os CSS/JS + `sw.js` v8 (corrige navegador servindo CSS/JS antigos).

## Revisão técnica realizada

### Back-end local atual

O projeto atual é um PWA estático. A camada de back-end funcional está simulada em JavaScript usando `localStorage`, distribuída em:

- `js/storage.js`: persistência local, usuários, admins, serviços, agendas, configurações, senhas e demo.
- `js/auth.js`: autenticação de usuário e Departamento/Secretaria, sessão e escopo administrativo.
- `js/scheduling.js`: regras de agendamento, disponibilidade, cancelamento, validação e NPS.
- `js/admin.js`: gestão de agenda, serviços, fila, desfechos, estatísticas e exportação.

### Ajustes de consistência feitos nesta revisão

- A disponibilidade demo deixou de abrir agenda automaticamente na inicialização.
- Horários demo agora são ativados explicitamente apenas pelo acesso demo.
- Usuário comum só pode criar agendamentos como usuário autenticado.
- Serviço agendado agora precisa pertencer ao equipamento selecionado.
- Serviço inativo não pode ser agendado.
- Usuário só pode cancelar atendimento próprio.
- Usuário só pode responder NPS de atendimento próprio e concluído.
- NPS não pode ser respondido duas vezes.
- Departamento/Secretaria só valida senha virtual de seus equipamentos.
- Departamento/Secretaria só altera desfecho de atendimento de seus equipamentos.
- Departamento/Secretaria só abre/fecha agenda e altera serviços de seus equipamentos.
- Tela de horários deixou de abrir agenda automaticamente ao carregar.
- Abertura e fechamento de dia agora exigem ação explícita do gestor.
- Cache PWA atualizado para entregar a versão mais recente.
- Menu mobile corrigido para evitar double toggle e rotas inexistentes.
- Histórico do cidadão corrigido para usar `usuario_id`, status `confirmado` e senha correta.
- Relatório por departamento corrigido para exibir nome do equipamento, total correto e validações por `validado`.
- Histórico de buscas adicionado ao Analytics local para apoiar leitura de demanda não atendida.

### Validação final antes da sincronização

- `node --check js/*.js` executado sem erros de sintaxe.
- Smoke test mobile no Chrome local: app carregou, busca ficou clicável, modal de sugestões/serviço em falta abriu, histórico de buscas do cidadão carregou e menu gestor exibiu métricas/relatórios.
- Smoke test desktop no Chrome local: busca carregou alinhada e fluxo de agendamento redirecionou corretamente para login.
- Servidor local validado em `http://127.0.0.1:4173/`.

## Estado funcional atual

- O app funciona localmente como protótipo avançado/PWA.
- Os dados ficam no navegador do usuário por `localStorage`.
- O fluxo de UX e as regras de escopo já estão alinhados com o produto desejado.
- Para operação real multiusuário, a base Supabase já está modelada em migration. O próximo passo é manter a evolução gradual dos fluxos de tela para o adapter Supabase, preservando fallback local até a virada completa.

### Status verificado em 01/07/2026 (importante)

- **Supabase NÃO está conectado ao app em execução.** O adapter `js/supabaseClient.js` existe, mas nenhum módulo (`storage/auth/app/scheduling/admin`) o chama, e não há anon key real (`js/config.example.js` tem placeholder). Tudo roda em `localStorage`. Para ativar: anon key real + schema executado no Easypanel + carregar config no `index.html` + ligar o adapter à camada storage/auth.
- **gov.br é UI-only.** O botão existe e redireciona quando `window.GOVBR_AUTH_URL` for definido; o OAuth real exige credenciamento do serviço no portal gov.br (client_id + redirect_uri).

## Plano para ficar 100% funcional em produção

### Fase 1 - Back-end real

- [x] Criar schema Supabase isolado para Agenda Sobral.
- [x] Modelar tabelas:
  - `profiles`
  - `departments`
  - `equipments`
  - `services`
  - `equipment_service_configs`
  - `availability_slots`
  - `appointments`
  - `appointment_history`
  - `virtual_tickets`
  - `nps_surveys`
  - `collaborators`
  - `audit_logs`
- [x] Criar RLS por perfil:
  - usuário vê e altera apenas seus agendamentos;
  - departamento vê apenas seus equipamentos;
  - colaborador vê apenas equipamentos vinculados;
  - super admin vê tudo.
- [x] Criar RPCs/transações para impedir dupla reserva de mesmo slot.
- [x] Criar seed script para migrar dados públicos de secretarias/equipamentos/serviços.
- [x] Aplicar migration no banco remoto do EasyPanel.
- [x] Rodar seed no Supabase remoto.
- [x] Provisionar acessos demo Supabase por usuário, secretaria/departamento e equipamento.
- [x] Validar smoke test RLS remoto com agendamento, validação isolada, desfecho, NPS e KPI.

### Fase 2 - API e autenticação

- Substituir autenticação local por Supabase Auth.
- Criar login por CPF/e-mail/telefone para usuário.
- Criar login institucional por departamento, colaborador e equipamento.
- Criar convites e permissões por equipamento.
- Implementar recuperação de senha.
- Implementar trilha de auditoria para alterações de agenda, serviço e desfecho.
- [parcial] Cadastro/ativação de acessos de equipamento pelo departamento (feito em `localStorage` via `#/admin/acessos`; migrar para Supabase).
- [pendente] **Integração gov.br OAuth**: credenciar o serviço no portal gov.br e configurar `window.GOVBR_AUTH_URL` + callback.

### Fase 3 - Integração front/back

- Trocar `localStorage` por cliente Supabase.
- Manter `Storage` como adapter temporário para evitar refatoração brusca.
- Criar serviços de dados:
  - `AppointmentService`
  - `EquipmentService`
  - `DepartmentService`
  - `ReportService`
  - `NpsService`
- Adicionar estados de loading, erro e offline.
- Tratar conflitos de horário em tempo real.

### Fase 4 - Gestão operacional

- Cadastro completo de secretarias, departamentos, equipamentos e unidades.
- Cadastro de serviços por equipamento.
- Configuração de documentos necessários por serviço.
- Configuração de horários por equipamento e serviço em blocos de 30 minutos.
- Controle de capacidade por horário.
- Painel TV de chamada por equipamento.
- Exportação CSV/PDF de relatórios.

### Fase 5 - Dados, KPIs e OKRs

- Dashboard executivo por secretaria.
- Dashboard por equipamento.
- Ranking de serviços mais demandados.
- Tempo médio entre agendamento e atendimento.
- Taxa de comparecimento.
- Taxa de cancelamento.
- NPS geral, por setor, por equipamento, por colaborador e por serviço.
- Relatório por pessoa com reincidência, faltas, cancelamentos e satisfação.
- Metas OKR configuráveis por secretaria.

### Fase 6 - Produção e infraestrutura

- Empacotar front-end para hospedagem.
- Configurar EasyPanel com domínio definitivo.
- Configurar variáveis de ambiente.
- Ativar HTTPS.
- Criar rotina de backup do Supabase.
- Configurar monitoramento de erros e logs.
- Criar ambiente staging e produção.

### Fase 7 - Segurança e conformidade

- Revisar LGPD para dados pessoais.
- Minimizar exposição de CPF nos relatórios.
- Criar política de retenção de dados.
- Proteger endpoints de validação de senha virtual.
- Criar rate limit em login e validação.
- Validar permissões de todas as rotas administrativas.

## Critérios de aceite para produção

- Usuário agenda em qualquer equipamento ativo.
- Departamento acessa apenas seus equipamentos.
- Equipamento acessa apenas sua própria fila e agenda.
- Um horário não pode receber reservas acima da capacidade.
- Senha virtual só pode ser validada uma vez.
- Atendimento gera histórico e desfecho.
- NPS só aparece após atendimento concluído.
- Relatórios exibem dados por pessoa, setor, equipamento e colaborador.
- KPIs e OKRs são calculados a partir de dados reais.
- Todas as operações sensíveis ficam auditadas.
- Deploy em EasyPanel funciona com HTTPS e banco remoto.

## Próxima execução recomendada

Iniciar a troca gradual do front para `AgendaSobralSupabase`, mantendo fallback local até todos os fluxos estarem conectados ao Supabase remoto.
