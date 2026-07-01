# Agenda Sobral - Funcionalidades Implementadas

## 🎯 Visão Geral

**Agenda Sobral** é um sistema municipal de agendamento de serviços públicos com validação virtual, totalmente alinhado com a identidade visual da Prefeitura de Sobral e modelo Vapt Vupt.

---

## 🔐 Autenticação & Acesso

### ✅ Login Bifurcado
- **Cidadão:** CPF + Senha
- **Gestor/Departamento:** Email + Senha + Seleção de secretaria

### ✅ Demo de Um Clique
- Botão "Entrar como Cidadão (Demo)" - acesso instant sem cadastro
- Botão "Entrar como Departamento (Demo)" - acesso gestor de teste
- Preenchimento automático de credenciais com um clique

### ✅ Criar Conta
- Rota: `#/criar-conta`
- Campos: Nome, CPF, Email, Senha
- Validação: Senha mínimo 8 caracteres, CPF único
- LGPD obrigatório antes de criar conta
- Links para Termos, Privacidade e LGPD

### ✅ Esqueceu a Senha
- Rota: `#/esqueceu-senha`
- Campo: CPF ou Email
- Simula envio de link de recuperação
- Redireciona para login após sucesso

### ✅ Páginas Legais
- **Termos de Uso** (`#/termos`) - Aceitar termos, uso autorizado, responsabilidades
- **Política de Privacidade** (`#/privacidade`) - Coleta, uso e proteção de dados
- **LGPD** (`#/lgpd`) - Lei Geral de Proteção de Dados, direitos do usuário, retenção

Todas as páginas legais têm:
- Navegação "Voltar"
- Links clicáveis inter-páginas
- Botão "Entendi e Aceito" / "Entendi"
- Styling premium com headings, listas e destaque

---

## 📋 Agendamento de Serviços

### ✅ Fluxo Completo
1. **Seleção de Secretaria** - Grid com 23 secretarias oficiais (SMS, SME, SEDHAS, etc.)
2. **Seleção de Equipamento** - Unidades por secretaria (CSF, escolas, centros)
3. **Seleção de Serviço** - Serviços disponíveis por equipamento
4. **Seleção de Data** - Calendário com próximos dias úteis
5. **Seleção de Horário** - Slots de 30 em 30 minutos
6. **Confirmação** - Comprovante com senha virtual e código de validação

### ✅ Comprovante Digital (Ticket)
- Modal premium com emblem colorido da secretaria
- Informações: data, horário, equipamento, serviço
- **Senha de Atendimento**: Automática (ex: "SMS-001")
- **Código de Validação Virtual**: Único, 6 caracteres (ex: "AUB-8W2")
- QR code determinístico (gerado a partir do código)
- Botão "Imprimir / Salvar PDF"
- Link "Ver meus agendamentos"

### ✅ Gerenciamento de Agendamentos
- Rota: `#/meus-agendamentos`
- Lista todos os agendamentos do cidadão
- Status: Agendado, Chamado, Atendido, Falta, Cancelado
- Botão "Ver Comprovante" para reacessar ticket
- Botão "Cancelar Agendamento" com confirmação

---

## ✅ Validação Virtual (Modelo Vapt Vupt)

### ✅ Equipamento - Tela de Validação
- Rota: `#/admin/validar` (acesso restrito ao gestor do equipamento)
- Input: Código de validação (ex: "AUB-8W2" ou "AUB-8W2")
- Automático em MAIÚSCULA, formatação com hífen
- Validações:
  - Código existe?
  - Equipamento corresponde? (cada código é válido só no seu equipamento)
  - Agendamento já foi validado?
  - Status é "agendado"?

### ✅ Resultado de Validação
- **Sucesso (Verde):**
  - ✓ Checkmark
  - Nome do cidadão
  - Data/hora do agendamento
  - Serviço solicitado
  - Senha de chamada (SMS-001)

- **Erro (Vermelho):**
  - ✗ X
  - Mensagem específica:
    - "Este código pertence a outro equipamento público"
    - "Este código já foi validado anteriormente"
    - "Código inválido ou agendamento cancelado"

### ✅ Isolamento por Equipamento
- Cada equipamento tem admin exclusivo
- Códigos são válidos apenas no seu equipamento
- Admin de SMS não vê agendamentos de SME

---

## 📢 Ouvidoria Municipal

### ✅ Acesso Anônimo
- Rota: `#/ouvidoria` (sem login necessário)
- ✅ Nenhuma identificação obrigatória
- Email OPCIONAL (para resposta confidencial)

### ✅ Formulário de Manifestação
- **Tipo:** Sugestão, Reclamação, Elogio, Outro
- **Tema:** Campo selecionável (opcional)
- **Mensagem:** Textarea 6 linhas (obrigatório)
- **Email:** Para recebimento de resposta (opcional)
- **Nome (optional):** Se quiser ser contatado
- **CPF (optional):** Rastreamento interno

### ✅ Conformidade LGPD
- Checkbox obrigatório de aceite antes de enviar
- Link para política LGPD
- Transparência: "autorizo que meus dados sejam tratados conforme LGPD"

### ✅ Informações Complementares
- Status: Open, Acknowledged, Responded, Closed
- Tempo de resposta: Até 30 dias úteis
- Contato direto: (88) 3677-1100
- Email: ouvidoria@sobral.ce.gov.br

---

## 👥 Dashboard Cidadão

### ✅ Visão Rápida
- Saudação personalizada (ex: "Olá, Maria da Demonstração!")
- Cards de ação: Novo Agendamento, Meus Agendamentos, Meu Perfil
- Lista de próximos agendamentos com badges de status

### ✅ Próximos Agendamentos
- Card com data/hora, local, serviço
- Senha de chamada destacada
- Botões: Ver Comprovante, Cancelar
- Status visual (Confirmado, Chamado, Atendido, Falta, Cancelado)

### ✅ Menu de Navegação
- Mobile bottom nav com 3 abas: Início, Agendar, Consultar
- Desktop nav com links: Início, Agendar, Consultar

---

## 🎛️ Painel Administrativo

### ✅ Dashboard Gestor
- Estatísticas: Total de agendamentos, Taxa de ocupação, Clientes, Cancelamentos
- Cards de ação: Validar Senha, Gestão de Horários, Serviços, Fila
- Botões de acesso rápido

### ✅ Gestão de Horários
- Visualizar dias com slots disponíveis
- Abrir/fechar dias completos
- Configurar horários de funcionamento
- Definir capacidade por hora

### ✅ Gestão de Serviços
- Listar serviços do equipamento
- Documentos necessários por serviço
- Duração padrão do atendimento

### ✅ Fila de Atendimento (TV Display)
- Rota: `#/admin/queue-display` (abre em nova aba)
- Exibe senhas a serem chamadas em tempo real
- Próxima senha destacada
- Histórico de chamadas recentes
- Ideal para tela de TV na recepção

### ✅ Pesquisa NPS
- Gráfico de satisfação (Promotores, Neutros, Detratores)
- Média de score
- Cálculo automático do NPS
- Filtros por data e equipamento

---

## 🎨 Design & UX

### ✅ Identidade Visual Oficial
- Logo Prefeitura de Sobral (wordmark branco no header)
- Brasão nos assets
- Cores oficiais por secretaria (SMS=vermelho, SME=azul, SEDHAS=roxo, etc.)

### ✅ Emblemas Coloridos de Secretarias
- SVG gradiente com sigla (SMS, SME, SEDHAS)
- Efeito shimmer premium
- Responsivo (adapta tamanho automaticamente)
- Font-size inteligente (reduz para siglas longas)

### ✅ Barra de Busca Estilo Google
- Design pill (border-radius: 9999px)
- Ícone de lupa + input + botão "Buscar"
- Layout fluido (empilha em telas < 520px)
- Responsive com placeholder intuitivo

### ✅ Topbar Premium
- Links: Portal da Prefeitura, Ouvidoria, Transparência
- Botões: Alto Contraste, A+, A-
- Sticky no topo com shadow sutil

### ✅ Comprovante Modal
- Overlay semi-transparente
- Card branco arredondado
- Emblem badge no topo
- Header colorido (cor da secretaria)
- QR code com border-radius
- Código virtual em monospace grande (2rem, letter-spacing: 4px)
- Botões de ação: PDF, Voltar

### ✅ Telas Responsivas
- Mobile: Bottom nav, formulários stacked, toque-friendly
- Tablet: Menu horizontal, layout 2-col
- Desktop: Sidebar completo, layout 3-col

### ✅ Paleta de Cores CSS Custom
- Primary (azul oficial): #1D467A
- Success (verde): #4CAF50
- Error (vermelho): #D32F2F
- Gradientes: Hero, Emblem, Cards
- Spacing system: 4px, 8px, 12px, 16px, 20px, 24px
- Shadows: subtle, base, lg, xl

---

## 🔧 Tecnologia

### ✅ Frontend
- Vanilla JavaScript (IIFE modules: App, Auth, Storage, Scheduling, Admin)
- PWA com Service Worker (network-first cache)
- CSS3 com custom properties, grid, flexbox
- Responsive design mobile-first
- localStorage para dados (offline-first)

### ✅ Backend (Supabase/Easypanel)
- PostgreSQL schema `agenda_sobral`
- 9 tabelas: users, departments, equipments, services, appointments, slots, nps_surveys, ouvidoria, equipment_services
- Row Level Security (RLS) com 6 políticas
- 8 funções RPC: book_appointment, validate_virtual_ticket, submit_nps, get_kpis, etc.
- Índices de performance em todas as foreign keys e filtros comuns
- Geração automática de códigos: validation_code (6-char), virtual_password

### ✅ APIs
- AgendaSobralSupabase.js - Cliente JS para Supabase
- ~15 métodos: getDepartments, bookAppointment, validateVirtualTicket, getNpsReport
- Fallback gracioso para localStorage se Supabase não configurado
- CORS-safe (chave anônima pública)

### ✅ Funcionalidades Avançadas
- Geração de senhas virtuais automáticas (SMS-001, SMS-002, etc.)
- Códigos de validação únicos por agendamento
- Cálculo automático de NPS (score → promotor/neutro/detrator)
- KPIs em tempo real (ocupação, no-show, etc.)
- Tratamento de concorrência (update slots atomicamente)
- Auditoria (timestamps: created_at, updated_at, validated_at, etc.)

---

## 📊 Dados Iniciais

### ✅ 23 Secretarias Oficiais
SMS, SME, SEDHAS, SEPLAG, SEFIN, SEINFRA, SEUMA, SESEC, SETRANSP, STDE, SEJUC, SESPOL, SEAGRI, PECUARIA, SETUR, PGM, SAAE, AMMA, SCSP, CAGM, SDD, SEGOV, GVP

### ✅ 62 Equipamentos Públicos
CSF, escolas municipais, centros de atendimento, Vapt Vupt, etc.

### ✅ 135+ Serviços
Consultas, matrículas, certidões, alvarás, vacinações, etc.

### ✅ Dados Demo
- Cidadão: Maria da Demonstração (CPF: 529.982.247-25, senha: demo)
- Gestor: admin@sobral.ce.gov.br (senha: admin123)
- Super Admin: super_admin@sobral.ce.gov.br
- Slots: 21 dias úteis pré-abertos (08:00-16:00, 30 min)

---

## ✨ Funcionalidades Premium

### ✅ Comprovante com QR Code
- Código determinístico gerado a partir do validation_code
- Scannable em equipamentos públicos
- Fallback: cidadão digita código manualmente no painel TV

### ✅ Validação no Equipamento
- Admin do equipamento vê painél TV (#/admin/queue-display)
- Cidadão valida código no painel de entrada (#/admin/validar)
- Sistema move agendamento de "scheduled" → "chamado"
- Registra timestamp de validação (validated_at)

### ✅ Pesquisa de Satisfação (NPS)
- Após atendimento, cidadão pode avaliar 0-10
- Automático categoriza: 9-10=promotor, 7-8=neutro, 0-6=detrator
- Dashboard gestor vê NPS por equipamento, departamento, período
- Comentários opcionais

### ✅ Modo Vapt Vupt
- Cada equipamento tem admin exclusivo (isolamento RLS)
- Senha de chamada: SMS-001, SMS-002, SMS-003, ...
- Código virtual: AUB-8W2 (único por agendamento)
- Validação acontece na entrada: cidadão mostra QR ou digita código
- TV exibe fila: "PRÓXIMO: SMS-001"

---

## 🚀 Deployment

### ✅ Ambientes Suportados
- **Local:** localhost:4173 (Python server, service worker habilitado)
- **Staging:** agendadobral.sevenxperts.solutions (via CI/CD)
- **Produção:** TBD (Vercel, Netlify, ou próprio hosting)

### ✅ Service Worker
- Cache v5 (network-first)
- Garante sempre versão mais recente
- Funciona offline com dados em localStorage
- Sincronização automática quando retorna online

### ✅ PWA Capabilities
- Installable em mobile/desktop
- Funciona sem conexão (fallback localStorage)
- Notificações em tempo real (TBD)
- Sincronização background (TBD)

---

## 📈 Próximas Melhorias (Roadmap)

- [ ] Autenticação via Supabase Auth (não apenas localStorage)
- [ ] SMS/Email de confirmação de agendamento
- [ ] Reschedule automático (reagendar se cidadão não validou)
- [ ] Integração com Google Calendar / Outlook
- [ ] Chatbot de suporte (FAQ)
- [ ] Dashboard de analytics em tempo real
- [ ] Notificações push (PWA)
- [ ] Integração com WhatsApp (notificações)
- [ ] Acessibilidade AA (WCAG 2.1)
- [ ] Testes E2E (Cypress/Playwright)

---

## 🔒 Segurança

✅ LGPD-compliant:
- Política de privacidade clara
- Consentimento explícito antes de usar
- Opção de ser anônimo (ouvidoria)
- Dados isolados por usuário (RLS)
- Retenção de dados documentada

✅ Proteção contra:
- XSS: Sanitização de HTML (Utils.sanitizeHTML)
- CSRF: Tokens de sessão
- SQL Injection: Prepared statements (Supabase)
- Brute Force: Rate limiting (TBD no backend)

---

## 📞 Suporte

**Repositório:** https://github.com/sxsevenxperts/AGENDA-SOBRAL

**Documentação:**
- `SUPABASE_SETUP.md` - Setup Supabase no Easypanel
- `supabase-schema.sql` - Schema PostgreSQL completo
- `.env.example` - Variáveis de ambiente

**Contato:**
- Email: ouvidoria@sobral.ce.gov.br
- Telefone: (88) 3677-1100

---

**Versão:** 1.0.0  
**Data:** 01/07/2026  
**Mantido por:** SETE XPERTS
