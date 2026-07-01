/**
 * AGENDA SOBRAL - Main Application Router & Controller
 */

const App = (function() {
  // DOM Elements
  const appElement = document.getElementById('app');
  const headerUser = document.querySelector('.header-user');
  const userInfo = document.querySelector('.user-info');
  const appSidebar = document.getElementById('app-sidebar');
  const mobileNav = document.getElementById('mobile-nav');

  // Routes configuration
  const routes = {
    '/': renderLanding,
    '/login': renderLogin,
    '/dashboard': renderCidadaoDashboard,
    '/agendar': renderSchedulingWizard,
    '/meus-agendamentos': renderMeusAgendamentos,
    '/admin': renderAdminDashboard,
    '/admin/validar': renderAdminValidar,
    '/admin/servicos': renderAdminServicos,
    '/admin/horarios': renderAdminHorarios,
    '/admin/fila': renderAdminFila,
    '/admin/relatorios': renderAdminRelatorios,
    '/admin/queue-display': renderQueueDisplay,
    '/ouvidoria': renderOuvidoria
  };

  /**
   * Initialize Application
   */
  async function init() {
    // 1. Init Storage and Auth
    Storage.init();
    Auth.init();

    // 2. Setup global event listeners
    setupGlobalListeners();

    // 3. Handle initial route
    handleRoute();

    // 4. Update UI based on auth state
    updateAuthUI();
  }

  function setupGlobalListeners() {
    // Listen for hash changes for routing
    window.addEventListener('hashchange', handleRoute);

    // Sidebar toggle
    const menuBtn = document.querySelector('.header-menu-btn');
    if (menuBtn && appSidebar) {
      menuBtn.addEventListener('click', () => {
        appSidebar.classList.toggle('open');
      });
    }
  }

  /**
   * Router
   */
  function handleRoute() {
    const hash = window.location.hash || '#/';
    // Get route without query params
    const path = hash.replace('#', '').split('?')[0] || '/';
    
    // Close sidebar on navigation (mobile)
    if (appSidebar) appSidebar.classList.remove('open');

    // Close any open modal (comprovante/ticket) on navigation
    document.querySelectorAll('.modal-overlay').forEach(m => m.remove());

    // Authentication guards
    const session = Auth.getSession();
    
    if (path.startsWith('/admin') && (!session || session.type !== 'admin')) {
      window.location.hash = '#/login';
      return;
    }
    
    if (['/dashboard', '/agendar', '/meus-agendamentos'].includes(path) && (!session || session.type !== 'cidadao')) {
      window.location.hash = '#/login';
      return;
    }

    // Execute route handler
    const handler = routes[path];
    if (handler) {
      // Clear main content
      appElement.innerHTML = '';
      
      // Execute handler
      handler();
      
      // Update active nav links
      updateActiveNavLinks(path);
      
      // Scroll to top
      window.scrollTo(0, 0);
    } else {
      // 404 - fallback to home
      window.location.hash = '#/';
    }
  }

  function updateActiveNavLinks(path) {
    document.querySelectorAll('.nav-item, .header-nav a, .mobile-nav-item').forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === '#' + path) {
        link.classList.add('active');
      }
    });
  }

  function updateAuthUI() {
    const session = Auth.getSession();
    
    if (session) {
      const isCidadao = session.type === 'cidadao';
      const nome = (session.user && session.user.nome) || (isCidadao ? 'Usuário' : 'Gestor');
      const primeiroNome = nome.split(' ').slice(0, 2).join(' ');
      const iniciais = nome.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase();

      if (headerUser) {
        headerUser.style.display = 'flex';
        headerUser.innerHTML = `
          <div class="user-info">
            <span class="user-name">${Utils.sanitizeHTML(primeiroNome)}</span>
            <span class="user-role">${isCidadao ? 'Usuário' : (session.user.escopo_secretaria_nome || 'Departamento/Secretaria')}</span>
          </div>
          <div class="avatar">${iniciais || Utils.getIcon('user')}</div>
        `;
        
        // Add logout listener
        headerUser.onclick = () => {
          if (confirm('Deseja sair do sistema?')) {
            Auth.logout();
            window.location.hash = '#/';
            location.reload();
          }
        };
      }

      // Toggle layout elements based on role
      document.body.classList.remove('public-layout', 'admin-layout');
      document.body.classList.add(isCidadao ? 'public-layout' : 'admin-layout');
      
      if (appSidebar) {
        appSidebar.style.display = isCidadao ? 'none' : 'flex';
      }
      
      if (mobileNav) {
        mobileNav.style.display = isCidadao ? 'flex' : 'none';
      }

    } else {
      // Not logged in
      if (headerUser) headerUser.style.display = 'none';
      if (appSidebar) appSidebar.style.display = 'none';
      if (mobileNav) mobileNav.style.display = 'none';
      
      document.body.classList.add('public-layout');
      document.body.classList.remove('admin-layout');
    }
  }

  /* ========================================================================
     PAGE RENDERING FUNCTIONS
     ======================================================================== */

  function renderLanding() {
    const totalSecretarias = Scheduling.getSecretarias().length;
    const totalEquipamentos = SobralData.equipamentos.length;
    const totalServicos = SobralData.servicos.length;

    appElement.innerHTML = `
      <div class="page-landing">
        <section class="hero-section">
          <div class="container hero-shell">
            <div class="hero-content">
              <img class="hero-logo" src="assets/logo-sobral-light.png" alt="Prefeitura de Sobral" onerror="this.onerror=null; this.src='assets/logo.png'">
              <div class="hero-kicker">Agendamento municipal com senha virtual</div>
              <h1 class="hero-title">Agenda Sobral</h1>
              <p class="hero-subtitle">Encontre o serviço, escolha secretaria, unidade, dia e horário disponível, e apresente sua senha virtual no equipamento público.</p>

              <form class="hero-search" role="search" onsubmit="App.handleHeroSearch(event)">
                <span class="hero-search-icon" aria-hidden="true">${Utils.getIcon('search')}</span>
                <input type="search" placeholder="Buscar serviço, unidade ou secretaria" id="hero-search-input" autocomplete="off">
                <button class="btn btn-primary hero-search-button" type="submit">Buscar</button>
              </form>

              <div class="hero-actions">
                <button class="btn btn-accent btn-lg" onclick="App.goToAgendamento()">
                  Fazer Agendamento Agora
                </button>
                <button class="btn btn-hero-secondary btn-lg" onclick="window.location.hash='#/login'">
                  Acessar Demo
                </button>
              </div>

              <div class="hero-metrics" aria-label="Resumo do catálogo">
                <div><strong>${totalSecretarias}</strong><span>secretarias</span></div>
                <div><strong>${totalEquipamentos}</strong><span>unidades</span></div>
                <div><strong>${totalServicos}</strong><span>serviços</span></div>
              </div>
            </div>
          </div>
          <div class="hero-wave">
            <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
                <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" class="shape-fill"></path>
            </svg>
          </div>
        </section>

        <section class="section container">
          <div class="section-title">
            <h2>Secretarias Municipais</h2>
            <p>Selecione a secretaria desejada para visualizar os equipamentos e serviços disponíveis para agendamento.</p>
          </div>
          
          <div class="grid-4" id="secretarias-grid">
            <!-- Populated via JS -->
          </div>
        </section>
      </div>
    `;

    // Populate Secretarias
    const secretariasGrid = document.getElementById('secretarias-grid');
    const secretarias = Scheduling.getSecretarias();
    
    secretariasGrid.innerHTML = secretarias.map(sec => `
      <div class="card secretaria-card" style="border-top: 4px solid ${sec.cor}" onclick="window.location.hash='#/login'">
        <div class="card-body text-center">
          ${App.secretariaEmblem(sec, 60)}
          <h3 class="text-md mb-1 mt-3">${sec.sigla}</h3>
          <p class="text-sm text-secondary">${sec.nome}</p>
          <div class="secretaria-card-meta">
            <span>${Scheduling.getEquipamentosBySecretaria(sec.id).length} unidades</span>
            <span>${countServicosBySecretaria(sec.id)} serviços</span>
          </div>
        </div>
      </div>
    `).join('');
  }

  function renderLogin() {
    // Check if already logged in
    const session = Auth.getSession();
    if (session) {
      window.location.hash = session.type === 'admin' ? '#/admin' : '#/dashboard';
      return;
    }

    appElement.innerHTML = `
      <div class="page-login">
        <div class="login-split">
          <div class="login-cover">
            <img src="assets/logo-sobral-light.png" alt="Prefeitura de Sobral" onerror="this.onerror=null; this.src='assets/logo.png'">
            <h2>Agenda Sobral</h2>
            <p>Sistema oficial de agendamento de serviços públicos municipais.</p>
          </div>
          
          <div class="login-form-container">
            <div class="login-card">
              <div class="login-header">
                <img src="assets/logo.png" alt="Prefeitura de Sobral" onerror="this.style.display='none'" style="object-fit: contain;">
                <h3>Escolha seu tipo de acesso</h3>
              </div>

              <div class="auth-tabs">
                <div class="auth-tab active" data-tab="cidadao">Usuário</div>
                <div class="auth-tab" data-tab="servidor">Departamento/Secretaria</div>
              </div>

              <!-- Usuário Form -->
              <form id="form-cidadao" class="auth-form">
                <p class="login-mode-copy">Use este acesso para agendar em qualquer secretaria, departamento ou equipamento público disponível.</p>
                <div class="input-group">
                  <label class="input-label">CPF</label>
                  <input type="text" class="input-field" id="cpf" placeholder="000.000.000-00" required>
                </div>
                
                <div class="input-group">
                  <label class="input-label">Senha</label>
                  <input type="password" class="input-field" id="senha" placeholder="Sua senha" required>
                </div>
                
                <div class="lgpd-consent mt-4" style="display: flex; align-items: flex-start; gap: 8px;">
                  <input type="checkbox" id="termos-cidadao" required style="margin-top: 4px;">
                  <label for="termos-cidadao" class="text-sm text-secondary" style="line-height: 1.4;">
                    Li e concordo com os <a href="#" class="text-primary font-bold">Termos de Uso</a>, <a href="#" class="text-primary font-bold">Políticas de Privacidade</a> e autorizo o tratamento dos meus dados conforme a <strong>LGPD</strong>.
                  </label>
                </div>

                <div class="mt-3 text-center">
                  <button type="button" class="btn btn-sm btn-outline" style="border-radius: 9999px; font-size: 0.8rem; padding: 4px 12px; margin: 0 auto; display: inline-block;" onclick="document.getElementById('cpf').value='529.982.247-25'; document.getElementById('senha').value='demo'; document.getElementById('termos-cidadao').checked=true;">
                    Preencher Acesso Demo (Cidadão)
                  </button>
                </div>

                <button type="submit" class="btn btn-primary w-full mt-4">Entrar</button>
                
                <div class="text-center mt-4">
                  <p class="text-sm">Não tem conta? <a href="#" onclick="alert('Funcionalidade de cadastro em desenvolvimento'); return false;" class="text-primary font-bold">Cadastre-se</a></p>
                </div>
              </form>
              
              <!-- Departamento / Secretaria Form -->
              <form id="form-servidor" class="auth-form" style="display: none;">
                <p class="login-mode-copy">Use este acesso para visualizar e administrar os dados recebidos dos usuários dentro do departamento escolhido, separados por equipamento público.</p>
                <div class="input-group">
                  <label class="input-label">Departamento / Secretaria</label>
                  <select class="select-field" id="admin-secretaria" required>
                    <option value="">Selecione o departamento</option>
                    ${Scheduling.getSecretarias().map(sec => `<option value="${sec.id}">${Utils.sanitizeHTML(sec.sigla)} — ${Utils.sanitizeHTML(sec.nome)}</option>`).join('')}
                  </select>
                </div>

                <div class="input-group">
                  <label class="input-label">Email Institucional</label>
                  <input type="email" class="input-field" id="email" placeholder="nome@sobral.ce.gov.br" required>
                </div>
                
                <div class="input-group">
                  <label class="input-label">Senha</label>
                  <input type="password" class="input-field" id="senha-admin" placeholder="Sua senha" required>
                </div>
                
                <div class="lgpd-consent mt-4" style="display: flex; align-items: flex-start; gap: 8px;">
                  <input type="checkbox" id="termos-admin" required style="margin-top: 4px;">
                  <label for="termos-admin" class="text-sm text-secondary" style="line-height: 1.4;">
                    Li e concordo com os <a href="#" class="text-primary font-bold">Termos de Uso Institucionais</a> e comprometo-me a seguir as diretrizes da <strong>LGPD</strong>.
                  </label>
                </div>

                <div class="mt-3 text-center">
                  <button type="button" class="btn btn-sm btn-outline" style="border-radius: 9999px; font-size: 0.8rem; padding: 4px 12px; margin: 0 auto; display: inline-block;" onclick="document.getElementById('email').value='admin@sobral.ce.gov.br'; document.getElementById('senha-admin').value='admin123'; document.getElementById('admin-secretaria').selectedIndex=1; document.getElementById('termos-admin').checked=true;">
                    Preencher Acesso Demo (Gestor)
                  </button>
                </div>

                <button type="submit" class="btn btn-secondary w-full mt-4">Entrar no Departamento</button>
              </form>

              <div class="demo-divider"><span>ou experimente a demonstração</span></div>
              <div class="demo-actions">
                <button type="button" class="btn btn-demo" onclick="App.loginDemo('cidadao')">
                  ${Utils.getIcon('user')} Entrar como Usuário (Demo)
                </button>
                <button type="button" class="btn btn-demo btn-demo-alt" onclick="App.loginDemo('gestor')">
                  ${Utils.getIcon('settings')} Entrar como Departamento (Demo)
                </button>
              </div>
              <p class="demo-hint">Contas de teste — nenhum dado real é utilizado.</p>
            </div>
          </div>
        </div>
      </div>
    `;

    // Tab switching
    const tabs = document.querySelectorAll('.auth-tab');
    const formCidadao = document.getElementById('form-cidadao');
    const formServidor = document.getElementById('form-servidor');
    
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        if (tab.dataset.tab === 'cidadao') {
          formCidadao.style.display = 'block';
          formServidor.style.display = 'none';
        } else {
          formCidadao.style.display = 'none';
          formServidor.style.display = 'block';
        }
      });
    });

    // Cidadão Login Submit
    formCidadao.addEventListener('submit', (e) => {
      e.preventDefault();
      const cpf = document.getElementById('cpf').value;
      const senha = document.getElementById('senha').value;
      
      const res = Auth.loginCidadao(cpf, senha);
      if (res.success) {
        Utils.showToast('Login realizado com sucesso', 'success');
        updateAuthUI();
        window.location.hash = sessionStorage.getItem('sobral_hero_search') ? '#/agendar' : '#/dashboard';
      } else {
        Utils.showToast(res.error, 'error');
      }
    });

    // Admin Login Submit
    formServidor.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const senha = document.getElementById('senha-admin').value;
      const secretariaId = document.getElementById('admin-secretaria').value;
      
      const res = Auth.loginAdmin(email, senha, secretariaId);
      if (res.success) {
        Utils.showToast(`Acesso liberado para ${res.admin.escopo_secretaria_nome}`, 'success');
        updateAuthUI();
        window.location.hash = '#/admin';
      } else {
        Utils.showToast(res.error, 'error');
      }
    });
    
    // Auto-fill CPF formatting
    const cpfInput = document.getElementById('cpf');
    if (cpfInput) {
      cpfInput.addEventListener('input', (e) => {
        let val = e.target.value.replace(/\D/g, '');
        if (val.length > 11) val = val.slice(0, 11);
        e.target.value = val;
      });
    }
  }

  function renderCidadaoDashboard() {
    appElement.innerHTML = `
      <div class="page-header container mt-6">
        <h1 class="page-title">Olá, Usuário!</h1>
        <p class="page-subtitle">O que você deseja fazer hoje?</p>
      </div>
      
      <div class="container mb-8">
        <div class="quick-actions-grid">
          <a href="#/agendar" class="action-card">
            <div class="action-icon">
              ${Utils.getIcon('calendar')}
            </div>
            <h3>Novo Agendamento</h3>
            <p class="text-sm text-secondary">Agendar um serviço</p>
          </a>
          
          <a href="#/meus-agendamentos" class="action-card">
            <div class="action-icon">
              ${Utils.getIcon('list')}
            </div>
            <h3>Meus Agendamentos</h3>
            <p class="text-sm text-secondary">Ver histórico e comprovantes</p>
          </a>
          
          <a href="#" onclick="alert('Em desenvolvimento'); return false;" class="action-card">
            <div class="action-icon">
              ${Utils.getIcon('user')}
            </div>
            <h3>Meu Perfil</h3>
            <p class="text-sm text-secondary">Atualizar dados cadastrais</p>
          </a>
        </div>
        
        <h2 class="text-xl font-bold mb-4">Próximos Agendamentos</h2>
        <div id="upcoming-appointments">
          <div class="card p-8 text-center text-secondary">
            Carregando agendamentos...
          </div>
        </div>
      </div>
    `;
    
    // Load upcoming appointments
    setTimeout(() => {
      const session = Auth.getSession();
      const agendamentos = Scheduling.getAgendamentosUsuario(session.user.id);
      const upcoming = agendamentos.filter(a => a.status === 'confirmado').slice(0, 3);
      
      const container = document.getElementById('upcoming-appointments');
      
      if (upcoming.length === 0) {
        container.innerHTML = `
          <div class="card p-8 text-center">
            <div class="mb-4 text-neutral-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin: 0 auto"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
            </div>
            <h3 class="mb-2">Nenhum agendamento futuro</h3>
            <p class="text-secondary mb-4">Você não possui agendamentos confirmados para os próximos dias.</p>
            <a href="#/agendar" class="btn btn-primary">Fazer um Agendamento</a>
          </div>
        `;
      } else {
        container.innerHTML = upcoming.map(a => `
          <div class="card appointment-card status-confirmado mb-4">
            <div class="appointment-date">
              <span class="day">${a.data.split('-')[2]}</span>
              <span class="month">${Utils.getMonthName(parseInt(a.data.split('-')[1])-1).substring(0,3)}</span>
              <span class="time">${Utils.getIcon('clock')} ${a.hora}</span>
            </div>
            <div class="appointment-details">
              <div class="appointment-header">
                <div>
                  <h3 class="font-bold text-lg">${a.servico_nome}</h3>
                  <p class="text-sm text-secondary">${a.equipamento_nome}</p>
                </div>
                <div class="badge badge-success">Confirmado</div>
              </div>
              <p class="text-sm mt-2"><strong>Senha:</strong> <span class="font-mono text-lg">${a.senha}</span>
                &nbsp;·&nbsp; <strong>Código:</strong> <span class="font-mono">${a.codigo_validacao || '—'}</span></p>
              <div class="mt-4 flex gap-2">
                <button class="btn btn-sm btn-secondary" onclick="App.showComprovante('${a.id}')">Ver Comprovante</button>
                <button class="btn btn-sm btn-danger btn-ghost" onclick="App.cancelAppointment('${a.id}')">Cancelar</button>
              </div>
            </div>
          </div>
        `).join('');
      }
    }, 100);
  }

  function renderSchedulingWizard() {
    appElement.innerHTML = `
      <div class="page-header container mt-6">
        <h1 class="page-title">Novo Agendamento</h1>
        <div class="breadcrumb">
          <a href="#/dashboard">Dashboard</a>
          <span class="breadcrumb-separator">/</span>
          <span>Agendar Serviço</span>
        </div>
      </div>
      
      <div class="container mb-8">
        <div class="card wizard-container">
          <div class="card-header bg-neutral-50 border-b">
            <div class="stepper">
              <div class="step step-active" id="step-nav-1">
                <div class="step-number">1</div>
                <div class="step-label">Secretaria</div>
              </div>
              <div class="step" id="step-nav-2">
                <div class="step-number">2</div>
                <div class="step-label">Equipamento</div>
              </div>
              <div class="step" id="step-nav-3">
                <div class="step-number">3</div>
                <div class="step-label">Serviço</div>
              </div>
              <div class="step" id="step-nav-4">
                <div class="step-number">4</div>
                <div class="step-label">Data e Hora</div>
              </div>
            </div>
          </div>
          
          <div class="card-body">
            <!-- Step 1: Secretarias -->
            <div id="step-1" class="wizard-step-content active">
              <div class="wizard-heading">
                <div>
                  <h2 class="text-xl font-bold">Selecione a Secretaria</h2>
                  <p class="text-sm text-secondary">Filtre por secretaria, unidade, bairro, equipamento ou assunto.</p>
                </div>
              </div>
              <div class="wizard-filter">
                <span aria-hidden="true">${Utils.getIcon('search')}</span>
                <input id="wizard-search-input" class="input-field" type="search" placeholder="Ex.: IPTU, vacinação, CRAS, escola, alvará" oninput="App.renderWizardSecretarias(this.value)">
              </div>
              <div class="secretaria-list" id="wizard-secretarias">
                Carregando...
              </div>
            </div>
            
            <!-- Step 2: Equipamentos -->
            <div id="step-2" class="wizard-step-content">
              <div class="flex justify-between items-center mb-4">
                <h2 class="text-xl font-bold">Selecione o Local de Atendimento</h2>
                <button class="btn btn-ghost btn-sm" onclick="App.wizardGoTo(1)">Voltar</button>
              </div>
              <div class="grid-2" id="wizard-equipamentos"></div>
            </div>
            
            <!-- Step 3: Serviços -->
            <div id="step-3" class="wizard-step-content">
              <div class="flex justify-between items-center mb-4">
                <h2 class="text-xl font-bold">Selecione o Serviço</h2>
                <button class="btn btn-ghost btn-sm" onclick="App.wizardGoTo(2)">Voltar</button>
              </div>
              <div id="wizard-servicos"></div>
            </div>
            
            <!-- Step 4: Data e Hora -->
            <div id="step-4" class="wizard-step-content">
              <div class="flex justify-between items-center mb-4">
                <h2 class="text-xl font-bold">Escolha Data e Horário</h2>
                <button class="btn btn-ghost btn-sm" onclick="App.wizardGoTo(3)">Voltar</button>
              </div>
              
              <div class="alert alert-info mb-6 p-4 bg-info-50 text-info-700 rounded-md border border-info-200">
                ${Utils.getIcon('info')}
                <strong>Atenção:</strong> Os horários disponíveis dependem exclusivamente da agenda aberta pela administração do equipamento.
              </div>
              
              <div class="datetime-container">
                <div class="calendar-section">
                  <h3 class="font-bold mb-4 border-b pb-2">Datas Disponíveis</h3>
                  <div id="wizard-dates" class="flex flex-col gap-2 max-h-64 overflow-y-auto pr-2">
                    <!-- Dates populated here -->
                  </div>
                </div>
                
                <div class="timeslot-section">
                  <h3 class="font-bold mb-4 border-b pb-2">Horários (Selecione uma data)</h3>
                  <div id="wizard-times" class="timeslot-grid">
                    <div class="text-center text-secondary col-span-3 py-4">
                      Selecione uma data ao lado para ver os horários
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="mt-8 flex justify-end">
                <button class="btn btn-primary btn-lg" id="btn-confirm-agendamento" disabled>Confirmar Agendamento</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Initialize State
    App.wizardState = {
      secretariaId: null,
      equipamentoId: null,
      servicoId: null,
      data: null,
      hora: null
    };
    
    // Load Step 1
    const pendingSearch = sessionStorage.getItem('sobral_hero_search') || '';
    const searchInput = document.getElementById('wizard-search-input');
    if (searchInput) searchInput.value = pendingSearch;
    renderWizardSecretarias(pendingSearch);
  }

  function renderMeusAgendamentos() {
    // Basic placeholder implementation
    appElement.innerHTML = `
      <div class="page-header container mt-6">
        <h1 class="page-title">Meus Agendamentos</h1>
      </div>
      <div class="container mb-8">
        <div class="card p-6">
           <div id="agendamentos-list">Carregando...</div>
        </div>
      </div>
    `;
    
    setTimeout(() => {
      const session = Auth.getSession();
      const agendamentos = Scheduling.getAgendamentosUsuario(session.user.id);
      const list = document.getElementById('agendamentos-list');
      
      if(agendamentos.length === 0) {
        list.innerHTML = '<p class="text-center text-secondary py-8">Nenhum agendamento encontrado.</p>';
      } else {
        const statusLabel = { confirmado: 'Confirmado', chamado: 'Validado', atendido: 'Atendido', cancelado: 'Cancelado', nao_compareceu: 'Não compareceu' };
        list.innerHTML = agendamentos.map(a => `
          <div class="p-4 border-b last:border-0 flex justify-between items-center gap-4 flex-wrap">
            <div>
              <div class="font-bold">${a.servico_nome}</div>
              <div class="text-sm text-secondary">${Utils.formatDate(a.data)} às ${a.hora} · ${a.equipamento_nome}</div>
              <div class="text-sm mt-1">Senha: <span class="font-mono font-bold">${a.senha}</span>
                &nbsp;·&nbsp; Código: <span class="font-mono font-bold">${a.codigo_validacao || '—'}</span></div>
              <div class="desfecho-line">Desfecho: <strong>${Utils.sanitizeHTML(a.desfecho || 'Aguardando')}</strong></div>
              ${a.nps ? `<div class="nps-inline">NPS registrado: <strong>${a.nps.nota}/10</strong></div>` : ''}
              ${renderHistoricoAtendimento(a)}
            </div>
            <div class="flex items-center gap-2">
              <div class="badge badge-${a.status === 'confirmado' ? 'success' : a.status === 'cancelado' ? 'danger' : 'info'}">${statusLabel[a.status] || a.status}</div>
              ${a.status !== 'cancelado' ? `<button class="btn btn-sm btn-ghost" onclick="App.showComprovante('${a.id}')">Comprovante</button>` : ''}
              ${a.status === 'atendido' && !a.nps ? `<button class="btn btn-sm btn-primary" onclick="App.showNpsModal('${a.id}')">Responder NPS</button>` : ''}
            </div>
          </div>
        `).join('');
      }
    }, 100);
  }

  // Admin Views (Simplified placeholders for structure)
  function renderAdminDashboard() {
    const secretaria = Auth.getAdminSecretaria ? Auth.getAdminSecretaria() : null;
    appElement.innerHTML = `
      <div class="page-header mb-6">
        <h1 class="page-title">Dashboard Administrativo</h1>
        <p class="page-subtitle">${secretaria ? Utils.sanitizeHTML(secretaria.nome) : 'Visão geral dos atendimentos'}</p>
      </div>
      ${renderEquipamentoSelect('admin-dashboard-equip', 'App.adminAtualizarDashboardStats()')}
      <div class="grid-4 mb-6">
        <div class="card p-4 border-l-4 border-primary-500">
          <div class="text-sm text-secondary uppercase font-bold">Agendados Hoje</div>
          <div class="text-3xl font-extrabold mt-2" id="stat-agendados">-</div>
        </div>
        <div class="card p-4 border-l-4 border-success-500">
          <div class="text-sm text-secondary uppercase font-bold">Atendidos</div>
          <div class="text-3xl font-extrabold mt-2" id="stat-atendidos">-</div>
        </div>
        <div class="card p-4 border-l-4 border-warning-500">
          <div class="text-sm text-secondary uppercase font-bold">Ocupação</div>
          <div class="text-3xl font-extrabold mt-2" id="stat-ocupacao">-</div>
        </div>
        <div class="card p-4 border-l-4 border-danger-500">
          <div class="text-sm text-secondary uppercase font-bold">Cancelados/Faltas</div>
          <div class="text-3xl font-extrabold mt-2" id="stat-faltas">-</div>
        </div>
      </div>

      <div class="admin-cta-grid">
        <a href="#/admin/validar" class="admin-cta admin-cta-primary">
          <div class="admin-cta-icon">${Utils.getIcon('ticket') || Utils.getIcon('check')}</div>
          <div>
            <h3>Validar Senha Virtual</h3>
            <p>Faça o check-in do cidadão pelo código apresentado no balcão.</p>
          </div>
          ${Utils.getIcon('chevronRight')}
        </a>
        <a href="#/admin/horarios" class="admin-cta">
          <div class="admin-cta-icon">${Utils.getIcon('calendar')}</div>
          <div>
            <h3>Abrir Horários</h3>
            <p>Defina os horários disponíveis para os cidadãos agendarem.</p>
          </div>
          ${Utils.getIcon('chevronRight')}
        </a>
        <a href="#/admin/relatorios" class="admin-cta">
          <div class="admin-cta-icon">${Utils.getIcon('analytics')}</div>
          <div>
            <h3>Relatórios NPS</h3>
            <p>Acompanhe satisfação por setor e por colaborador.</p>
          </div>
          ${Utils.getIcon('chevronRight')}
        </a>
      </div>
    `;
    
    // Load stats
    setTimeout(() => {
       adminAtualizarDashboardStats();
    }, 100);
  }

  function renderAdminHorarios() {
    appElement.innerHTML = `
      <div class="page-header mb-6">
        <h1 class="page-title">Gestão de Horários</h1>
        <p class="page-subtitle">Abra vagas na agenda para permitir agendamentos pelos cidadãos</p>
      </div>
      <div class="card p-6">
        <div class="alert alert-warning mb-6">
          ${Utils.getIcon('info')}
          O cidadão SÓ PODE agendar nos horários que você abrir explicitamente nesta tela.
        </div>
        
        ${renderEquipamentoSelect('admin-horarios-equip', 'App.adminCarregarHorarios()')}
        <div class="flex gap-4 mb-6 mt-4">
          <input type="date" id="admin-date-picker" class="input-field" value="${Utils.formatDateISO(new Date())}">
          <button class="btn btn-primary" onclick="App.adminCarregarHorarios()">Carregar Agenda</button>
        </div>
        
        <div id="admin-horarios-container" class="mt-6 border-t pt-6">
          <p class="text-secondary text-center">Selecione uma data e clique em Carregar.</p>
        </div>
      </div>
    `;
  }
  
  function renderAdminServicos() {
    const secretaria = Auth.getAdminSecretaria ? Auth.getAdminSecretaria() : null;

    appElement.innerHTML = `
      <div class="page-header mb-6">
        <h1 class="page-title">Serviços Ofertados</h1>
        <p class="page-subtitle">${secretaria ? Utils.sanitizeHTML(secretaria.nome) : 'Selecione um equipamento administrativo'}</p>
      </div>
      ${renderEquipamentoSelect('admin-servicos-equip', 'App.renderAdminServicosEquipamento()')}
      <div class="admin-service-list mt-4" id="admin-servicos-list"></div>
    `;
    setTimeout(renderAdminServicosEquipamento, 50);
  }

  function renderAdminServicosEquipamento() {
    const equipId = getSelectedEquipamentoId('admin-servicos-equip');
    const container = document.getElementById('admin-servicos-list');
    if (!container) return;
    const servicos = getAllServicosEquipamento(equipId);
    if (!servicos.length) {
      container.innerHTML = '<div class="empty-state">Nenhum serviço cadastrado para este equipamento.</div>';
      return;
    }

    container.innerHTML = servicos.map(servico => {
          const cfg = Admin.getServicoConfig(equipId, servico.id);
          const docs = (cfg.documentos_necessarios || []).join('\n');
          return `
            <div class="card p-5 admin-service-card">
              <div class="admin-service-head">
                <div>
                  <h3>${Utils.sanitizeHTML(servico.nome)}</h3>
                  <p>${Utils.sanitizeHTML(servico.descricao || 'Atendimento presencial')}</p>
                </div>
                <label class="service-toggle">
                  <input type="checkbox" id="ativo-${servico.id}" ${cfg.ativo !== false ? 'checked' : ''}>
                  <span>Ativo</span>
                </label>
              </div>
              <div class="grid-2 mt-4">
                <div class="input-group">
                  <label class="input-label">Documentos necessários</label>
                  <textarea class="textarea-field" id="docs-${servico.id}" placeholder="Um documento por linha">${Utils.sanitizeHTML(docs)}</textarea>
                </div>
                <div class="input-group">
                  <label class="input-label">Orientações ao cidadão</label>
                  <textarea class="textarea-field" id="obs-${servico.id}" placeholder="Ex.: trazer originais, chegar 10 min antes">${Utils.sanitizeHTML(cfg.observacoes || '')}</textarea>
                </div>
              </div>
              <div class="flex justify-end mt-4">
                <button class="btn btn-primary btn-sm" onclick="App.adminSalvarServicoConfig('${servico.id}')">Salvar serviço</button>
              </div>
            </div>
          `;
        }).join('');
  }
  
  function renderAdminFila() {
    appElement.innerHTML = `
      <div class="page-header mb-6">
        <h1 class="page-title">Fila de Atendimento</h1>
        <p class="page-subtitle">Chamada de senhas, baixa de atendimento e marcação de faltas.</p>
      </div>
      <div class="card p-6">
        <div class="fila-toolbar">
          ${renderEquipamentoSelect('admin-fila-equip', 'App.adminCarregarFila()', true)}
          <input type="date" id="admin-fila-date" class="input-field" value="${Utils.formatDateISO(new Date())}">
          <button class="btn btn-secondary" onclick="App.adminCarregarFila()">Carregar fila</button>
          <button class="btn btn-primary" onclick="App.adminChamarProxima()">Chamar próxima senha</button>
        </div>
        <div id="admin-fila-container" class="mt-6"></div>
      </div>
    `;
    setTimeout(adminCarregarFila, 50);
  }

  function renderAdminRelatorios() {
    const equipIds = Auth.getAdminEquipamentos();
    const relatorio = buildNpsReport(equipIds);

    appElement.innerHTML = `
      <div class="page-header mb-6">
        <h1 class="page-title">Relatórios NPS</h1>
        <p class="page-subtitle">Satisfação por setor de atendimento e por colaborador.</p>
      </div>

      <div class="grid-4 mb-6">
        <div class="card p-4 border-l-4 border-primary-500">
          <div class="text-sm text-secondary uppercase font-bold">NPS Geral</div>
          <div class="text-3xl font-extrabold mt-2">${relatorio.geral.nps}</div>
        </div>
        <div class="card p-4 border-l-4 border-success-500">
          <div class="text-sm text-secondary uppercase font-bold">Promotores</div>
          <div class="text-3xl font-extrabold mt-2">${relatorio.geral.promotores}</div>
        </div>
        <div class="card p-4 border-l-4 border-warning-500">
          <div class="text-sm text-secondary uppercase font-bold">Neutros</div>
          <div class="text-3xl font-extrabold mt-2">${relatorio.geral.neutros}</div>
        </div>
        <div class="card p-4 border-l-4 border-danger-500">
          <div class="text-sm text-secondary uppercase font-bold">Detratores</div>
          <div class="text-3xl font-extrabold mt-2">${relatorio.geral.detratores}</div>
        </div>
      </div>

      <div class="reports-grid reports-grid-wide mb-6">
        <div class="card p-6">
          <h2 class="text-xl font-bold mb-4">KPIs Operacionais</h2>
          <div class="kpi-grid">
            ${renderKpiCard('Agendamentos', relatorio.kpis.totalAgendamentos)}
            ${renderKpiCard('Atendidos', relatorio.kpis.atendidos)}
            ${renderKpiCard('Comparecimento', relatorio.kpis.taxaComparecimento + '%')}
            ${renderKpiCard('Cancelamentos', relatorio.kpis.cancelamentos)}
            ${renderKpiCard('Faltas', relatorio.kpis.faltas)}
            ${renderKpiCard('Respostas NPS', relatorio.kpis.taxaRespostaNps + '%')}
          </div>
        </div>
        <div class="card p-6">
          <h2 class="text-xl font-bold mb-4">OKRs de Gestão</h2>
          <div class="okr-list">
            ${relatorio.okrs.map(renderOkrCard).join('')}
          </div>
        </div>
      </div>

      <div class="reports-grid">
        <div class="card p-6">
          <h2 class="text-xl font-bold mb-4">Setores / Equipamentos</h2>
          ${renderNpsTable(relatorio.porSetor, 'Nenhum NPS por setor ainda.')}
        </div>
        <div class="card p-6">
          <h2 class="text-xl font-bold mb-4">Colaboradores</h2>
          ${renderNpsTable(relatorio.porColaborador, 'Nenhum NPS por colaborador ainda.')}
        </div>
      </div>

      <div class="card p-6 mt-6">
        <h2 class="text-xl font-bold mb-4">Agendamentos por Pessoa</h2>
        ${renderPessoaTable(relatorio.porPessoa)}
      </div>
    `;
  }
  
  function renderQueueDisplay() {
    document.body.innerHTML = `
      <div class="page-admin-queue">
        <div class="queue-header">
           <h2>Painel de Chamada</h2>
        </div>
        <div class="queue-content flex items-center justify-center h-full">
           <div class="text-center">
              <div class="queue-label">Senha Atual</div>
              <div class="queue-ticket">---</div>
           </div>
        </div>
      </div>
    `;
  }

  function renderOuvidoria() {
    appElement.innerHTML = `
      <div class="page-header container mt-6">
        <h1 class="page-title">Ouvidoria</h1>
        <p class="page-subtitle">Envie sugestões, reclamações ou elogios.</p>
      </div>
      <div class="container mb-8">
        <div class="card p-6">
          <form onsubmit="App.submitOuvidoria(event)">
            <div class="input-group">
              <label class="input-label">Assunto</label>
              <select class="select-field" id="ouvidoria-tipo" required>
                <option value="sugestao">Sugestão</option>
                <option value="reclamacao">Reclamação</option>
                <option value="elogio">Elogio</option>
              </select>
            </div>
            <div class="input-group">
              <label class="input-label">Mensagem</label>
              <textarea class="textarea-field" id="ouvidoria-msg" required rows="5"></textarea>
            </div>
            <button type="submit" class="btn btn-primary mt-4">Enviar Manifestação</button>
          </form>
        </div>
      </div>
    `;
  }

  function submitOuvidoria(e) {
    e.preventDefault();
    const msg = document.getElementById('ouvidoria-msg').value;
    Utils.showToast('Ouvidoria enviada com sucesso!', 'success');
    window.location.hash = '#/dashboard';
  }

  App.submitOuvidoria = submitOuvidoria;

  /* ========================================================================
     ROUTER & INITIALIZATIONS EXPOSED GLOBALLY
     ======================================================================== */
  
  function wizardGoTo(stepIndex) {
    // Update visual stepper
    document.querySelectorAll('.step').forEach((el, idx) => {
      el.classList.remove('step-active');
      if (idx < stepIndex) el.classList.add('step-completed');
      else el.classList.remove('step-completed');
      
      if (idx === stepIndex - 1) el.classList.add('step-active');
    });
    
    // Update content
    document.querySelectorAll('.wizard-step-content').forEach((el, idx) => {
      if (idx === stepIndex - 1) el.classList.add('active');
      else el.classList.remove('active');
    });
  }

  function selectSecretaria(id) {
    App.wizardState.secretariaId = id;
    const termo = sessionStorage.getItem('sobral_hero_search') || '';
    let equipamentos = Scheduling.getEquipamentosBySecretaria(id);
    if (termo) {
      const filtrados = equipamentos.filter(eq => equipamentoMatchesSearch(eq, termo));
      if (filtrados.length > 0) equipamentos = filtrados;
    }
    
    const container = document.getElementById('wizard-equipamentos');
    if(equipamentos.length === 0) {
      container.innerHTML = '<div class="col-span-2 text-center py-4">Nenhum equipamento cadastrado.</div>';
    } else {
      container.innerHTML = equipamentos.map(eq => `
        <div class="card equipamento-card p-4" onclick="App.selectEquipamento('${eq.id}')">
          <div class="equipamento-card-top">
            <h3 class="font-bold mb-1">${Utils.sanitizeHTML(eq.nome)}</h3>
            <span>${Scheduling.getServicosByEquipamento(eq.id).length} serviços</span>
          </div>
          <p class="text-sm text-secondary mb-2">${Utils.sanitizeHTML(eq.endereco)}</p>
          <div class="text-xs bg-neutral-100 p-1 rounded inline-block">${Utils.sanitizeHTML(eq.tipo)}</div>
        </div>
      `).join('');
    }
    wizardGoTo(2);
  }

  function selectEquipamento(id) {
    App.wizardState.equipamentoId = id;
    const termo = sessionStorage.getItem('sobral_hero_search') || '';
    let servicos = Scheduling.getServicosByEquipamento(id);
    if (termo) {
      const filtrados = servicos.filter(s => normalizeText(`${s.nome} ${s.descricao || ''}`).includes(normalizeText(termo)));
      if (filtrados.length > 0) servicos = filtrados;
    }
    
    const container = document.getElementById('wizard-servicos');
    if(servicos.length === 0) {
      container.innerHTML = '<div class="text-center py-4 border rounded">Nenhum serviço disponível.</div>';
    } else {
      container.innerHTML = servicos.map(s => `
        <div class="servico-item" onclick="App.selectServico('${s.id}')">
          <div class="servico-info">
            <h4>${Utils.sanitizeHTML(s.nome)}</h4>
            <p class="text-sm text-secondary">${Utils.sanitizeHTML(s.descricao || 'Atendimento presencial')}</p>
            ${s.documentos_necessarios && s.documentos_necessarios.length ? `<div class="servico-docs">${Utils.getIcon('info')} ${s.documentos_necessarios.length} documento(s) exigido(s)</div>` : ''}
            ${s.orientacoes ? `<div class="servico-docs">${Utils.sanitizeHTML(s.orientacoes)}</div>` : ''}
          </div>
          <div class="servico-meta">
            <span>${Utils.getIcon('clock')} ${s.duracao} min</span>
          </div>
        </div>
      `).join('');
    }
    wizardGoTo(3);
  }
  
  function selectServico(id) {
    App.wizardState.servicoId = id;
    App.wizardState.data = null;
    App.wizardState.hora = null;
    document.getElementById('btn-confirm-agendamento').disabled = true;
    
    // Load available dates
    const datas = Scheduling.getDatasDisponiveis(App.wizardState.equipamentoId, 14); // Next 14 days
    const container = document.getElementById('wizard-dates');
    const timesContainer = document.getElementById('wizard-times');
    
    timesContainer.innerHTML = '<div class="text-center text-secondary col-span-3 py-4">Selecione uma data ao lado para ver os horários</div>';
    
    if(datas.length === 0) {
      container.innerHTML = '<div class="p-3 bg-warning-50 text-warning-700 rounded border border-warning-200">Não há datas com vagas abertas no momento.</div>';
    } else {
      container.innerHTML = datas.map(d => {
        const parts = d.data.split('-');
        const formatted = `${parts[2]}/${parts[1]}`;
        return `
        <div class="p-3 border rounded cursor-pointer hover:border-primary-500 hover:bg-primary-50 flex justify-between items-center date-item" data-date="${d.data}" onclick="App.selectDate('${d.data}', this)">
          <div>
            <div class="font-bold">${formatted}</div>
            <div class="text-xs text-secondary">${d.diaSemana}</div>
          </div>
          <div class="badge badge-${d.slotsDisponiveis > 0 ? 'success' : 'neutral'} text-xs">
            ${d.slotsDisponiveis} horários
          </div>
        </div>
      `}).join('');
    }
    
    wizardGoTo(4);
  }

  function selectDate(dateStr, el) {
    App.wizardState.data = dateStr;
    App.wizardState.hora = null;
    document.getElementById('btn-confirm-agendamento').disabled = true;
    
    // Update UI selection
    document.querySelectorAll('.date-item').forEach(i => {
      i.classList.remove('border-primary-500', 'bg-primary-50');
      i.classList.add('border');
    });
    el.classList.remove('border');
    el.classList.add('border-primary-500', 'bg-primary-50');
    
    // Load timeslots
    const horarios = Scheduling.getHorariosDisponiveis(App.wizardState.equipamentoId, dateStr);
    const container = document.getElementById('wizard-times');
    
    if(horarios.length === 0) {
      container.innerHTML = '<div class="col-span-3 text-center py-4 text-warning-600">Sem horários para esta data.</div>';
    } else {
      container.innerHTML = horarios.map(h => {
        const full = h.vagasRestantes === 0;
        return `
        <button class="btn btn-sm ${full ? 'btn-neutral' : 'btn-ghost border'} time-item" 
                ${full ? 'disabled' : ''} 
                onclick="App.selectTime('${h.hora}', this)">
          ${h.hora}
        </button>
      `}).join('');
    }
  }

  function selectTime(timeStr, el) {
    App.wizardState.hora = timeStr;
    
    document.querySelectorAll('.time-item').forEach(i => {
      i.classList.remove('btn-primary');
      if(!i.disabled) i.classList.add('btn-ghost');
    });
    el.classList.remove('btn-ghost');
    el.classList.add('btn-primary');
    
    const btnConfirm = document.getElementById('btn-confirm-agendamento');
    btnConfirm.disabled = false;
    btnConfirm.onclick = confirmAgendamento;
  }
  
  function confirmAgendamento() {
    const session = Auth.getSession();
    if(!session) return;
    
    const res = Scheduling.criarAgendamento({
      usuario_id: session.userId,
      equipamento_id: App.wizardState.equipamentoId,
      servico_id: App.wizardState.servicoId,
      data: App.wizardState.data,
      hora: App.wizardState.hora
    });
    
    if(res.success) {
      Utils.showToast('Agendamento confirmado!', 'success');
      showComprovante(res.agendamento.id);
    } else {
      Utils.showToast(res.error, 'error');
    }
  }
  
  function cancelAppointment(id) {
    if(confirm('Tem certeza que deseja cancelar este agendamento?')) {
      const res = Scheduling.cancelarAgendamento(id);
      if(res) {
        Utils.showToast('Agendamento cancelado', 'info');
        renderCidadaoDashboard(); // refresh
      }
    }
  }

  /* ========================================================================
     ADMIN ACTIONS EXPOSED GLOBALLY
     ======================================================================== */
     
  function adminCarregarHorarios() {
    const data = document.getElementById('admin-date-picker').value;
    const session = Auth.getSession();
    if(!session || session.type !== 'admin') return;
    
    const equipId = getSelectedEquipamentoId('admin-horarios-equip');
    if(!equipId) return;
    
    const config = Admin.getEquipamentoConfig(equipId);
    const openSlots = Storage.getOpenSlots(equipId, data);
    const container = document.getElementById('admin-horarios-container');

    if (!openSlots.length) {
      container.innerHTML = `
        <div class="empty-state">
          Nenhum horário aberto para ${Utils.formatDate(data)} neste equipamento.
          <div class="mt-4">
            <button class="btn btn-primary" onclick="App.adminAbrirDiaCompleto()">Abrir dia com grade de 30 minutos</button>
          </div>
        </div>
      `;
      return;
    }
    
    container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-bold">Horários Abertos (${Utils.formatDate(data)})</h3>
        <button class="btn btn-danger btn-sm" onclick="App.adminFecharDia()">Fechar Dia Todo</button>
      </div>
      <div class="grid grid-cols-4 sm:grid-cols-6 gap-2">
        ${openSlots.map(hora => `
          <div class="p-2 border rounded bg-success-50 border-success-200 text-center flex flex-col">
            <span class="font-bold">${hora}</span>
            <span class="text-xs text-secondary">${Storage.getSlotCount(equipId, data, hora)}/${config.slots_por_horario} res.</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  function adminAbrirDiaCompleto() {
    const data = document.getElementById('admin-date-picker')?.value;
    const equipId = getSelectedEquipamentoId('admin-horarios-equip');
    const res = Admin.abrirDiaCompleto(equipId, data);
    if (res.success) {
      Utils.showToast(`${res.slotsAbertos} horários abertos para o dia.`, 'success');
      adminCarregarHorarios();
    } else {
      Utils.showToast(res.error || 'Não foi possível abrir a agenda.', 'error');
    }
  }

  function adminFecharDia() {
    const data = document.getElementById('admin-date-picker')?.value;
    const equipId = getSelectedEquipamentoId('admin-horarios-equip');
    if (!confirm('Fechar todos os horários sem agendamento confirmado neste dia?')) return;
    const res = Admin.fecharDia(equipId, data);
    if (res.success) {
      Utils.showToast(`${res.slotsFechados} horários fechados. ${res.slotsPreservados} preservados com agendamento.`, 'info');
      adminCarregarHorarios();
    } else {
      Utils.showToast(res.error || 'Não foi possível fechar o dia.', 'error');
    }
  }

  function adminCarregarFila() {
    const dataInput = document.getElementById('admin-fila-date');
    const container = document.getElementById('admin-fila-container');
    if (!dataInput || !container) return;

    const equipId = getSelectedEquipamentoId('admin-fila-equip');
    const data = dataInput.value;
    const fila = Scheduling.getAgendamentosEquipamento(equipId, data);

    if (!fila.length) {
      container.innerHTML = '<div class="empty-state">Nenhum agendamento para a data selecionada.</div>';
      return;
    }

    container.innerHTML = fila.map(a => `
      <div class="fila-item status-${a.status}">
        <div class="fila-senha">
          <strong>${a.senha}</strong>
          <span>${a.hora}</span>
        </div>
        <div class="fila-info">
          <h3>${Utils.sanitizeHTML(a.usuario_nome || 'Cidadão')}</h3>
          <p>${Utils.sanitizeHTML(a.servico_nome)} · ${Utils.sanitizeHTML(a.equipamento_nome)}</p>
          <span class="badge badge-${a.status === 'confirmado' ? 'success' : a.status === 'cancelado' ? 'danger' : 'info'}">${a.status}</span>
          <div class="desfecho-line">Desfecho: <strong>${Utils.sanitizeHTML(a.desfecho || 'Aguardando')}</strong></div>
          ${renderHistoricoAtendimento(a)}
        </div>
        <div class="fila-actions">
          <button class="btn btn-sm btn-secondary" onclick="App.showComprovante('${a.id}')">Comprovante</button>
          ${a.status !== 'atendido' && a.status !== 'cancelado' ? `<button class="btn btn-sm btn-primary" onclick="App.adminMarcarAtendido('${a.id}')">Atendido</button>` : ''}
          ${a.status !== 'nao_compareceu' && a.status !== 'cancelado' ? `<button class="btn btn-sm btn-ghost" onclick="App.adminMarcarFalta('${a.id}')">Falta</button>` : ''}
        </div>
      </div>
    `).join('');
  }

  function adminChamarProxima() {
    const equipId = getSelectedEquipamentoId('admin-fila-equip');
    const res = Admin.chamarProximaSenha(equipId);
    if (!res) {
      Utils.showToast('Não há senha aguardando chamada hoje.', 'info');
      return;
    }
    Utils.showToast(`Senha ${res.senha} chamada`, 'success');
    adminCarregarFila();
  }

  function adminMarcarAtendido(id) {
    const res = Admin.marcarAtendido(id);
    if (res.success) {
      Utils.showToast('Atendimento concluído. NPS liberado para o cidadão.', 'success');
      adminCarregarFila();
    } else {
      Utils.showToast(res.error || 'Não foi possível concluir.', 'error');
    }
  }

  function adminMarcarFalta(id) {
    const res = Admin.marcarNaoCompareceu(id);
    if (res.success) {
      Utils.showToast('Falta registrada.', 'info');
      adminCarregarFila();
    } else {
      Utils.showToast(res.error || 'Não foi possível registrar a falta.', 'error');
    }
  }

  function adminSalvarServicoConfig(servicoId) {
    const equipId = getSelectedEquipamentoId('admin-servicos-equip');
    const ativo = document.getElementById(`ativo-${servicoId}`)?.checked !== false;
    const docsRaw = document.getElementById(`docs-${servicoId}`)?.value || '';
    const observacoes = document.getElementById(`obs-${servicoId}`)?.value || '';
    const documentos = docsRaw.split('\n').map(d => d.trim()).filter(Boolean);

    const res = Admin.salvarServicoConfig(equipId, servicoId, {
      ativo,
      documentos_necessarios: documentos,
      observacoes
    });

    if (res.success) Utils.showToast('Serviço atualizado.', 'success');
    else Utils.showToast(res.error || 'Erro ao salvar serviço.', 'error');
  }

  /* ========================================================================
     EMBLEMAS DE SECRETARIA (identidade visual premium)
     ======================================================================== */

  /**
   * Gera o emblema branded de uma secretaria: monograma com a sigla
   * sobre um disco com gradiente na cor institucional da pasta.
   * @param {Object} sec - Secretaria.
   * @param {number} [size=56] - Diâmetro em pixels.
   * @returns {string} HTML do emblema.
   */
  function secretariaEmblem(sec, size = 56) {
    const cor = sec.cor || '#1D467A';
    const n = (sec.sigla || '').length || 3;
    const fs = Math.max(10, Math.round(Math.min(size / 2.5, (size * 1.55) / n)));
    return `
      <div class="sec-emblem" style="width:${size}px;height:${size}px;
        background:linear-gradient(145deg, ${cor}, ${_shade(cor, -28)});
        font-size:${fs}px;" title="${Utils.sanitizeHTML(sec.nome)}">
        <span>${sec.sigla}</span>
      </div>`;
  }

  /** Escurece/clareia uma cor hex por um delta (-255..255). @private */
  function _shade(hex, delta) {
    const h = hex.replace('#', '');
    const num = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
    let r = (num >> 16) + delta, g = ((num >> 8) & 0xff) + delta, b = (num & 0xff) + delta;
    r = Math.max(0, Math.min(255, r)); g = Math.max(0, Math.min(255, g)); b = Math.max(0, Math.min(255, b));
    return '#' + (0x1000000 + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  /* ========================================================================
     DEMONSTRAÇÃO — LOGIN COM UM CLIQUE
     ======================================================================== */

  function loginDemo(tipo) {
    let res;
    if (tipo === 'gestor') {
      const secretariaId = document.getElementById('admin-secretaria')?.value || 'sedhas';
      const equipamentosDemo = (SobralData.equipamentos || [])
        .filter(eq => eq.secretaria_id === secretariaId)
        .map(eq => eq.id);
      if (Storage.seedDemoAvailability) Storage.seedDemoAvailability(equipamentosDemo);
      res = Auth.loginAdmin('admin@sobral.ce.gov.br', 'admin123', secretariaId);
      if (res.success) {
        Utils.showToast(`Bem-vindo(a) ao painel ${res.admin.escopo_secretaria_nome} (demo)`, 'success');
        updateAuthUI();
        window.location.hash = '#/admin';
      }
    } else {
      if (Storage.seedDemoAvailability) Storage.seedDemoAvailability();
      res = Auth.loginCidadao('529.982.247-25', 'demo');
      if (res.success) {
        Utils.showToast('Bem-vindo(a), Maria! (demo)', 'success');
        updateAuthUI();
        window.location.hash = sessionStorage.getItem('sobral_hero_search') ? '#/agendar' : '#/dashboard';
      }
    }
    if (res && !res.success) Utils.showToast(res.error, 'error');
  }

  function goToAgendamento() {
    const session = Auth.getSession();
    if (session && session.type === 'cidadao') {
      window.location.hash = '#/agendar';
      return;
    }
    window.location.hash = '#/login';
  }

  function handleHeroSearch(event) {
    if (event) event.preventDefault();
    const input = document.getElementById('hero-search-input');
    const termo = input ? input.value.trim() : '';
    if (termo) sessionStorage.setItem('sobral_hero_search', termo);
    else sessionStorage.removeItem('sobral_hero_search');
    goToAgendamento();
  }

  /* ========================================================================
     COMPROVANTE / SENHA VIRTUAL (modal premium com QR + código)
     ======================================================================== */

  function showComprovante(agendamentoId) {
    const a = Scheduling.getAgendamentoById(agendamentoId);
    if (!a) { Utils.showToast('Agendamento não encontrado.', 'error'); return; }

    const cor = a.secretaria_cor || '#1D467A';
    const qrPayload = `AGENDASOBRAL|${a.codigo_validacao}|${a.equipamento_id}|${a.data}|${a.hora}`;
    const qr = Utils.generateQRCodeSVG(qrPayload, 172);

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="ticket" role="dialog" aria-modal="true">
        <div class="ticket-top" style="background:linear-gradient(135deg, ${cor}, ${_shade(cor, -40)})">
          <div class="ticket-badge">${a.secretaria_sigla || 'PMS'}</div>
          <div class="ticket-top-info">
            <div class="ticket-eyebrow">Comprovante de Agendamento</div>
            <h3>${Utils.sanitizeHTML(a.servico_nome)}</h3>
            <p>${Utils.sanitizeHTML(a.equipamento_nome)}</p>
          </div>
          <button class="ticket-close" aria-label="Fechar" onclick="this.closest('.modal-overlay').remove()">✕</button>
        </div>

        <div class="ticket-body">
          <div class="ticket-cols">
            <div class="ticket-datetime">
              <div class="ticket-field">
                <span class="ticket-label">Data</span>
                <span class="ticket-value">${Utils.formatDate(a.data)}</span>
              </div>
              <div class="ticket-field">
                <span class="ticket-label">Horário</span>
                <span class="ticket-value">${a.hora}</span>
              </div>
              <div class="ticket-field">
                <span class="ticket-label">Senha de atendimento</span>
                <span class="ticket-value ticket-senha">${a.senha}</span>
              </div>
            </div>
            <div class="ticket-qr">
              ${qr}
              <span class="ticket-qr-hint">Apresente no equipamento</span>
            </div>
          </div>

          <div class="ticket-code">
            <span class="ticket-label">Código de validação virtual</span>
            <div class="ticket-code-value">${a.codigo_validacao}</div>
            <p class="ticket-code-hint">
              ${Utils.getIcon('shield') || ''}
              Informe este código (ou o QR) no balcão do equipamento para validar sua presença.
              Ele é exclusivo e pessoal.
            </p>
          </div>

          <div class="ticket-actions">
            <button class="btn btn-primary w-full" onclick="window.print()">
              ${Utils.getIcon('printer')} Imprimir / Salvar PDF
            </button>
            <button class="btn btn-ghost w-full" onclick="this.closest('.modal-overlay').remove(); window.location.hash='#/meus-agendamentos'">
              Ver meus agendamentos
            </button>
          </div>
        </div>
      </div>
    `;
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
  }

  /* ========================================================================
     VALIDAÇÃO NO EQUIPAMENTO (painel do gestor)
     ======================================================================== */

  function renderAdminValidar() {
    appElement.innerHTML = `
      <div class="page-header mb-6">
        <h1 class="page-title">Validação de Senha Virtual</h1>
        <p class="page-subtitle">Confira o código apresentado pelo cidadão e registre a presença (check-in).</p>
      </div>

      <div class="validar-grid">
        <div class="card p-6 validar-panel">
          <div class="validar-icon">${Utils.getIcon('ticket') || Utils.getIcon('check')}</div>
          <label class="input-label">Código de validação do cidadão</label>
          <input type="text" id="validar-input" class="input-field validar-input"
                 placeholder="Ex.: ABC-XYZ" maxlength="7" autocomplete="off"
                 oninput="this.value=this.value.toUpperCase()">
          <button class="btn btn-primary btn-lg w-full mt-4" onclick="App.validarCodigoAdmin()">
            ${Utils.getIcon('check')} Validar Presença
          </button>
          <div id="validar-resultado" class="validar-resultado"></div>
        </div>

        <div class="card p-6">
          <h3 class="font-bold mb-3">Como funciona</h3>
          <ol class="validar-steps">
            <li><span>1</span> O cidadão agenda pelo app e recebe um <strong>código virtual</strong> exclusivo + QR.</li>
            <li><span>2</span> No dia, ele apresenta o código no balcão do equipamento.</li>
            <li><span>3</span> O operador digita o código aqui e <strong>valida a presença</strong>.</li>
            <li><span>4</span> O atendimento entra automaticamente na fila de chamada.</li>
          </ol>
          <div class="alert alert-info mt-4">
            ${Utils.getIcon('info')} Cada código só pode ser validado uma vez e apenas no equipamento correto.
          </div>
        </div>
      </div>
    `;
    setTimeout(() => {
      const input = document.getElementById('validar-input');
      if (input) {
        input.focus();
        input.addEventListener('keydown', (e) => { if (e.key === 'Enter') validarCodigoAdmin(); });
      }
    }, 60);
  }

  function validarCodigoAdmin() {
    const input = document.getElementById('validar-input');
    const box = document.getElementById('validar-resultado');
    if (!input || !box) return;

    const equipIds = Auth.getAdminEquipamentos();
    const agendamento = Scheduling.getAgendamentoByCodigo(input.value);
    if (agendamento && !equipIds.includes(agendamento.equipamento_id)) {
      const res = { success: false, error: 'Este código pertence a outro departamento ou equipamento público.' };
      box.className = 'validar-resultado erro';
      box.innerHTML = `
        <div class="validar-x">${Utils.getIcon('x')}</div>
        <h3>Não validado</h3>
        <p>${Utils.sanitizeHTML(res.error)}</p>`;
      Utils.showToast(res.error, 'error');
      return;
    }
    const equipId = agendamento ? agendamento.equipamento_id : (equipIds[0] || null);

    const res = Scheduling.validarCodigo(input.value, equipId);

    if (res.success) {
      const a = res.agendamento;
      box.className = 'validar-resultado ok';
      box.innerHTML = `
        <div class="validar-check">${Utils.getIcon('check')}</div>
        <h3>Presença validada!</h3>
        <div class="validar-info">
          <p><strong>${Utils.sanitizeHTML(a.usuario_nome || 'Cidadão')}</strong></p>
          <p>${Utils.sanitizeHTML(a.servico_nome)} — <strong>${a.hora}</strong></p>
          <p>${Utils.sanitizeHTML(a.equipamento_nome)}</p>
          <p class="validar-senha-tag">Senha ${a.senha}</p>
        </div>`;
      Utils.showToast('Presença validada com sucesso', 'success');
      input.value = '';
    } else {
      box.className = 'validar-resultado erro';
      box.innerHTML = `
        <div class="validar-x">${Utils.getIcon('x')}</div>
        <h3>Não validado</h3>
        <p>${Utils.sanitizeHTML(res.error)}</p>
        ${res.agendamento ? `<p class="text-sm text-secondary mt-2">Cidadão: ${Utils.sanitizeHTML(res.agendamento.usuario_nome || '—')}</p>` : ''}`;
      Utils.showToast(res.error, 'error');
    }
  }

  function showNpsModal(agendamentoId) {
    const a = Scheduling.getAgendamentoById(agendamentoId);
    if (!a) {
      Utils.showToast('Agendamento não encontrado.', 'error');
      return;
    }

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="nps-modal" role="dialog" aria-modal="true">
        <button class="ticket-close" aria-label="Fechar" onclick="this.closest('.modal-overlay').remove()">✕</button>
        <div class="nps-header">
          <span>${Utils.getIcon('check')}</span>
          <div>
            <div class="ticket-eyebrow">Pesquisa NPS</div>
            <h3>${Utils.sanitizeHTML(a.servico_nome)}</h3>
            <p>${Utils.sanitizeHTML(a.equipamento_nome)}</p>
          </div>
        </div>
        <div class="nps-body">
          <label class="input-label">De 0 a 10, quanto você recomendaria este atendimento?</label>
          <div class="nps-scale">
            ${Array.from({ length: 11 }, (_, n) => `<button type="button" data-nps="${n}" onclick="App.selectNpsScore(this)">${n}</button>`).join('')}
          </div>
          <div class="input-group mt-4">
            <label class="input-label">Comentário opcional</label>
            <textarea id="nps-comentario" class="textarea-field" placeholder="Conte rapidamente o que pode melhorar"></textarea>
          </div>
          <button class="btn btn-primary w-full mt-4" onclick="App.submitNps('${agendamentoId}')">Enviar avaliação</button>
        </div>
      </div>
    `;
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
  }

  function selectNpsScore(button) {
    document.querySelectorAll('.nps-scale button').forEach(btn => btn.classList.remove('selected'));
    button.classList.add('selected');
    button.closest('.nps-modal').dataset.score = button.dataset.nps;
  }

  function submitNps(agendamentoId) {
    const modal = document.querySelector('.nps-modal');
    const nota = modal ? modal.dataset.score : null;
    const comentario = document.getElementById('nps-comentario')?.value || '';
    const res = Scheduling.responderNps(agendamentoId, nota, comentario);

    if (res.success) {
      Utils.showToast('Obrigado pela avaliação.', 'success');
      document.querySelector('.modal-overlay')?.remove();
      renderMeusAgendamentos();
    } else {
      Utils.showToast(res.error, 'error');
    }
  }

  function renderWizardSecretarias(termo) {
    const container = document.getElementById('wizard-secretarias');
    if (!container) return;

    const query = (termo || '').trim();
    if (query) sessionStorage.setItem('sobral_hero_search', query);
    else sessionStorage.removeItem('sobral_hero_search');

    const secretarias = Scheduling.getSecretarias().filter(sec => secretariaMatchesSearch(sec, query));

    if (!secretarias.length) {
      container.innerHTML = '<div class="empty-state">Nenhuma secretaria encontrada para essa busca.</div>';
      return;
    }

    container.innerHTML = secretarias.map(sec => `
      <div class="card secretaria-card secretaria-row" style="border-left: 3px solid ${sec.cor}" onclick="App.selectSecretaria('${sec.id}')">
        <div class="card-body flex items-center gap-4">
          ${App.secretariaEmblem(sec, 48)}
          <div class="secretaria-row-copy">
            <h3 class="font-bold">${sec.sigla}</h3>
            <p class="text-xs text-secondary line-clamp-2">${Utils.sanitizeHTML(sec.nome)}</p>
            <div class="secretaria-card-meta">
              <span>${Scheduling.getEquipamentosBySecretaria(sec.id).length} unidades</span>
              <span>${countServicosBySecretaria(sec.id)} serviços</span>
            </div>
          </div>
        </div>
      </div>
    `).join('');
  }

  function secretariaMatchesSearch(sec, termo) {
    if (!termo) return true;
    const query = normalizeText(termo);
    const secText = normalizeText(`${sec.nome} ${sec.sigla} ${sec.descricao || ''}`);
    if (secText.includes(query)) return true;
    return Scheduling.getEquipamentosBySecretaria(sec.id).some(eq => equipamentoMatchesSearch(eq, termo));
  }

  function equipamentoMatchesSearch(eq, termo) {
    const query = normalizeText(termo);
    const eqText = normalizeText(`${eq.nome} ${eq.tipo} ${eq.endereco} ${eq.bairro || ''}`);
    if (eqText.includes(query)) return true;
    return Scheduling.getServicosByEquipamento(eq.id).some(s =>
      normalizeText(`${s.nome} ${s.descricao || ''} ${s.orientacoes || ''}`).includes(query)
    );
  }

  function countServicosBySecretaria(secretariaId) {
    return Scheduling.getEquipamentosBySecretaria(secretariaId)
      .reduce((total, eq) => total + Scheduling.getServicosByEquipamento(eq.id).length, 0);
  }

  function getAllServicosEquipamento(equipId) {
    if (!equipId) return [];
    const storageServicos = Storage.getServicos ? Storage.getServicos() : [];
    let servicos = storageServicos.filter(s => s.equipamento_id === equipId);
    if (!servicos.length) {
      servicos = (SobralData.servicos || []).filter(s => s.equipamento_id === equipId);
    }
    return servicos;
  }

  function normalizeText(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  function adminAtualizarDashboardStats() {
    const equipId = getSelectedEquipamentoId('admin-dashboard-equip');
    if (!equipId) return;
    const stats = Admin.getDashboardStats(equipId);
    if (!stats) return;
    document.getElementById('stat-agendados').textContent = stats.agendamentosHoje;
    document.getElementById('stat-atendidos').textContent = stats.atendidosHoje;
    const ocup = document.getElementById('stat-ocupacao');
    if (ocup) ocup.textContent = stats.taxaOcupacao + '%';
    document.getElementById('stat-faltas').textContent = stats.canceladosHoje + stats.naoCompareceuHoje;
  }

  function getScopedEquipamentos() {
    const ids = new Set(Auth.getAdminEquipamentos());
    return (SobralData.equipamentos || []).filter(eq => ids.has(eq.id));
  }

  function getSelectedEquipamentoId(selectId) {
    const select = document.getElementById(selectId);
    if (select && select.value) return select.value;
    const equipamentos = getScopedEquipamentos();
    return equipamentos[0] ? equipamentos[0].id : null;
  }

  function renderEquipamentoSelect(selectId, onChange, compact) {
    const equipamentos = getScopedEquipamentos();
    if (!equipamentos.length) {
      return '<div class="empty-state">Nenhum equipamento vinculado ao departamento selecionado.</div>';
    }
    const select = `
      <label class="equipment-scope ${compact ? 'equipment-scope-compact' : ''}">
        <span>Equipamento</span>
        <select class="select-field" id="${selectId}" onchange="${onChange}">
          ${equipamentos.map(eq => `<option value="${eq.id}">${Utils.sanitizeHTML(eq.nome)}</option>`).join('')}
        </select>
      </label>
    `;
    return compact ? select : `<div class="equipment-scope-wrap mb-4">${select}</div>`;
  }

  function buildNpsReport(equipIds) {
    const ids = new Set(equipIds || []);
    const all = Storage.getAgendamentos ? Storage.getAgendamentos() : [];
    const scoped = all.filter(a => !ids.size || ids.has(a.equipamento_id));
    const avaliados = scoped.filter(a => a.nps && typeof a.nps.nota === 'number');
    const kpis = buildKpis(scoped, avaliados);

    return {
      geral: summarizeNps(avaliados, 'Geral'),
      porSetor: groupNps(avaliados, (a) => a.equipamento_id, (a) => {
        const eq = Scheduling.getEquipamentoById(a.equipamento_id);
        return eq ? eq.nome : a.equipamento_id;
      }),
      porColaborador: groupNps(avaliados, (a) => a.colaborador_id || 'sem-colaborador', (a) => a.colaborador_nome || 'Colaborador não informado'),
      porPessoa: groupPessoa(scoped),
      kpis,
      okrs: buildOkrs(kpis)
    };
  }

  function groupNps(items, keyFn, labelFn) {
    const groups = {};
    items.forEach(item => {
      const key = keyFn(item);
      if (!groups[key]) groups[key] = { label: labelFn(item), items: [] };
      groups[key].items.push(item);
    });
    return Object.values(groups)
      .map(group => summarizeNps(group.items, group.label))
      .sort((a, b) => b.total - a.total || b.nps - a.nps);
  }

  function summarizeNps(items, label) {
    const total = items.length;
    const promotores = items.filter(a => a.nps.nota >= 9).length;
    const neutros = items.filter(a => a.nps.nota >= 7 && a.nps.nota <= 8).length;
    const detratores = items.filter(a => a.nps.nota <= 6).length;
    const media = total ? (items.reduce((sum, a) => sum + a.nps.nota, 0) / total).toFixed(1) : '0.0';
    const nps = total ? Math.round(((promotores / total) - (detratores / total)) * 100) : 0;
    return { label, total, promotores, neutros, detratores, media, nps };
  }

  function renderNpsTable(rows, emptyText) {
    if (!rows.length) return `<div class="empty-state">${emptyText}</div>`;
    return `
      <div class="nps-report-table">
        <div class="nps-report-row nps-report-head">
          <span>Nome</span><span>NPS</span><span>Média</span><span>Resp.</span><span>Prom.</span><span>Detr.</span>
        </div>
        ${rows.map(row => `
          <div class="nps-report-row">
            <span>${Utils.sanitizeHTML(row.label)}</span>
            <strong class="${row.nps >= 50 ? 'good' : row.nps >= 0 ? 'warn' : 'bad'}">${row.nps}</strong>
            <span>${row.media}</span>
            <span>${row.total}</span>
            <span>${row.promotores}</span>
            <span>${row.detratores}</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  function buildKpis(agendamentos, avaliados) {
    const totalAgendamentos = agendamentos.length;
    const atendidos = agendamentos.filter(a => a.status === 'atendido').length;
    const faltas = agendamentos.filter(a => a.status === 'nao_compareceu').length;
    const cancelamentos = agendamentos.filter(a => a.status === 'cancelado').length;
    const ativos = totalAgendamentos - cancelamentos;
    const taxaComparecimento = ativos ? Math.round((atendidos / ativos) * 100) : 0;
    const taxaRespostaNps = atendidos ? Math.round((avaliados.length / atendidos) * 100) : 0;
    const nps = summarizeNps(avaliados, 'Geral').nps;

    return {
      totalAgendamentos,
      atendidos,
      faltas,
      cancelamentos,
      taxaComparecimento,
      taxaRespostaNps,
      nps
    };
  }

  function buildOkrs(kpis) {
    return [
      {
        objetivo: 'Elevar satisfação do cidadão',
        indicador: 'NPS geral',
        atual: kpis.nps,
        meta: 70,
        sufixo: '',
        progresso: clampPercent(Math.round((Math.max(kpis.nps, 0) / 70) * 100))
      },
      {
        objetivo: 'Reduzir ausência nos atendimentos',
        indicador: 'Comparecimento',
        atual: kpis.taxaComparecimento,
        meta: 90,
        sufixo: '%',
        progresso: clampPercent(Math.round((kpis.taxaComparecimento / 90) * 100))
      },
      {
        objetivo: 'Aumentar inteligência de gestão',
        indicador: 'Respostas NPS',
        atual: kpis.taxaRespostaNps,
        meta: 60,
        sufixo: '%',
        progresso: clampPercent(Math.round((kpis.taxaRespostaNps / 60) * 100))
      }
    ];
  }

  function groupPessoa(agendamentos) {
    const groups = {};
    agendamentos.forEach(a => {
      const key = a.usuario_id || a.usuario_cpf || 'sem-identificacao';
      if (!groups[key]) {
        groups[key] = {
          nome: a.usuario_nome || 'Cidadão não identificado',
          cpf: a.usuario_cpf || '',
          items: []
        };
      }
      groups[key].items.push(a);
    });

    return Object.values(groups).map(group => {
      const items = group.items;
      const npsItems = items.filter(a => a.nps && typeof a.nps.nota === 'number');
      return {
        nome: group.nome,
        cpf: group.cpf,
        total: items.length,
        atendidos: items.filter(a => a.status === 'atendido').length,
        faltas: items.filter(a => a.status === 'nao_compareceu').length,
        cancelados: items.filter(a => a.status === 'cancelado').length,
        npsMedio: npsItems.length ? (npsItems.reduce((sum, a) => sum + a.nps.nota, 0) / npsItems.length).toFixed(1) : '—',
        ultimo: items.map(a => a.data).sort().pop() || '—'
      };
    }).sort((a, b) => b.total - a.total || a.nome.localeCompare(b.nome));
  }

  function renderKpiCard(label, value) {
    return `
      <div class="kpi-card">
        <span>${label}</span>
        <strong>${value}</strong>
      </div>
    `;
  }

  function renderOkrCard(okr) {
    return `
      <div class="okr-card">
        <div class="okr-top">
          <strong>${okr.objetivo}</strong>
          <span>${okr.progresso}%</span>
        </div>
        <p>${okr.indicador}: ${okr.atual}${okr.sufixo} / meta ${okr.meta}${okr.sufixo}</p>
        <div class="okr-progress"><span style="width:${okr.progresso}%"></span></div>
      </div>
    `;
  }

  function renderPessoaTable(rows) {
    if (!rows.length) return '<div class="empty-state">Nenhum agendamento encontrado para gerar relatório por pessoa.</div>';
    return `
      <div class="person-report-table">
        <div class="person-report-row person-report-head">
          <span>Cidadão</span><span>Total</span><span>Atendidos</span><span>Faltas</span><span>Cancel.</span><span>NPS</span><span>Último</span>
        </div>
        ${rows.map(row => `
          <div class="person-report-row">
            <span><strong>${Utils.sanitizeHTML(row.nome)}</strong>${row.cpf ? `<small>${Utils.sanitizeHTML(row.cpf)}</small>` : ''}</span>
            <span>${row.total}</span>
            <span>${row.atendidos}</span>
            <span>${row.faltas}</span>
            <span>${row.cancelados}</span>
            <span>${row.npsMedio}</span>
            <span>${row.ultimo !== '—' ? Utils.formatDate(row.ultimo) : '—'}</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  function clampPercent(value) {
    return Math.max(0, Math.min(100, value || 0));
  }

  function renderHistoricoAtendimento(agendamento) {
    const historico = agendamento.historico || [];
    if (!historico.length) return '';
    return `
      <details class="historico-atendimento">
        <summary>Histórico do atendimento</summary>
        <ol>
          ${historico.map(item => `
            <li>
              <strong>${Utils.sanitizeHTML(item.titulo || item.status)}</strong>
              <span>${item.em ? Utils.formatDate(item.em.slice(0, 10)) + ' ' + item.em.slice(11, 16) : ''}</span>
              ${item.detalhe ? `<p>${Utils.sanitizeHTML(item.detalhe)}</p>` : ''}
            </li>
          `).join('')}
        </ol>
      </details>
    `;
  }

  // Public API
  return {
    init,
    secretariaEmblem,
    loginDemo,
    goToAgendamento,
    handleHeroSearch,
    showComprovante,
    showNpsModal,
    selectNpsScore,
    submitNps,
    validarCodigoAdmin,
    renderWizardSecretarias,
    wizardGoTo,
    selectSecretaria,
    selectEquipamento,
    selectServico,
    selectDate,
    selectTime,
    cancelAppointment,
    adminCarregarHorarios,
    adminAbrirDiaCompleto,
    adminFecharDia,
    adminAtualizarDashboardStats,
    renderAdminServicosEquipamento,
    adminCarregarFila,
    adminChamarProxima,
    adminMarcarAtendido,
    adminMarcarFalta,
    adminSalvarServicoConfig
  };
})();

// Start application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
