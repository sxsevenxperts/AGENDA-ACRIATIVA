/**
 * ============================================================
 * AGENDA SOBRAL - Módulo de Persistência (localStorage)
 * ============================================================
 * Camada de armazenamento que gerencia todos os dados da
 * aplicação usando localStorage do navegador.
 * 
 * REGRA DE NEGÓCIO FUNDAMENTAL:
 * Os horários disponíveis para agendamento dependem EXCLUSIVAMENTE
 * da configuração do administrador. Slots só ficam disponíveis
 * quando o admin os abre explicitamente.
 * 
 * Todas as funções ficam acessíveis via o objeto global `Storage`.
 * ============================================================
 */

const Storage = (() => {
    'use strict';

    // ── Chaves do localStorage ───────────────────────────────

    /** @enum {string} Chaves utilizadas no localStorage */
    const KEYS = {
        USERS: 'sobral_users',
        ADMINS: 'sobral_admins',
        AGENDAMENTOS: 'sobral_agendamentos',
        SERVICOS: 'sobral_servicos',
        CONFIG_EQUIPAMENTOS: 'sobral_config_equipamentos',
        SENHAS: 'sobral_senhas',
        SESSION: 'sobral_session'
    };

    // ══════════════════════════════════════════════════════════
    //  OPERAÇÕES BÁSICAS DE LEITURA E ESCRITA
    // ══════════════════════════════════════════════════════════

    /**
     * Obtém e desserializa um valor do localStorage.
     * @param {string} key - Chave do localStorage
     * @returns {*} Valor desserializado, ou null se não encontrado
     */
    function get(key) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            console.error(`[Storage] Erro ao ler chave '${key}':`, e);
            return null;
        }
    }

    /**
     * Serializa e salva um valor no localStorage.
     * @param {string} key - Chave do localStorage
     * @param {*} value - Valor a ser armazenado (será convertido para JSON)
     */
    function set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error(`[Storage] Erro ao salvar chave '${key}':`, e);
            // Tenta liberar espaço em caso de QuotaExceededError
            if (e.name === 'QuotaExceededError') {
                console.warn('[Storage] Espaço de armazenamento esgotado.');
            }
        }
    }

    // ══════════════════════════════════════════════════════════
    //  INICIALIZAÇÃO
    // ══════════════════════════════════════════════════════════

    /**
     * Inicializa o storage com dados padrão do SobralData, se vazio.
     * 
     * Ações realizadas na primeira execução:
     * 1. Copia os serviços de SobralData.servicos
     * 2. Cria um admin padrão por equipamento (email: admin@{id}.sobral.ce.gov.br)
     * 3. Inclui o super_admin de SobralData.adminPadrao
     * 4. Cria configuração base para cada equipamento
     * 5. NÃO pré-popula slots_abertos — o admin deve abrir explicitamente
     * 
     * @returns {void}
     */
    function init() {
        if (typeof SobralData === 'undefined') {
            console.error('[Storage] SobralData não encontrado. Verifique se js/data.js foi carregado.');
            return;
        }

        // ── Inicializa cidadãos ──────────────────────────────
        if (!get(KEYS.USERS)) {
            set(KEYS.USERS, []);
        }

        // ── Inicializa serviços ──────────────────────────────
        if (!get(KEYS.SERVICOS)) {
            const servicos = SobralData.servicos
                ? SobralData.servicos.map(s => ({ ...s }))
                : [];
            set(KEYS.SERVICOS, servicos);
        }

        // ── Inicializa administradores ───────────────────────
        if (!get(KEYS.ADMINS)) {
            const admins = [];

            // Cria admin padrão para cada equipamento
            if (SobralData.equipamentos) {
                SobralData.equipamentos.forEach(equip => {
                    admins.push({
                        id: `admin_${equip.id}`,
                        nome: `Administrador - ${equip.nome}`,
                        email: `admin@${equip.id}.sobral.ce.gov.br`,
                        senha: 'admin123',
                        role: 'admin',
                        equipamento_id: equip.id,
                        ativo: true,
                        criado_em: new Date().toISOString()
                    });
                });
            }

            // Adiciona super_admin(s) de SobralData.adminPadrao
            if (SobralData.adminPadrao) {
                SobralData.adminPadrao.forEach(admin => {
                    admins.push({
                        ...admin,
                        ativo: true,
                        criado_em: new Date().toISOString()
                    });
                });
            }

            set(KEYS.ADMINS, admins);
        }

        // ── Inicializa agendamentos ─────────────────────────
        if (!get(KEYS.AGENDAMENTOS)) {
            set(KEYS.AGENDAMENTOS, []);
        }

        // ── Inicializa configurações de equipamentos ────────
        if (!get(KEYS.CONFIG_EQUIPAMENTOS)) {
            const configs = {};

            if (SobralData.equipamentos) {
                SobralData.equipamentos.forEach(equip => {
                    configs[equip.id] = {
                        equipamento_id: equip.id,
                        dias_disponiveis: [1, 2, 3, 4, 5], // Seg a Sex
                        horario_inicio: '08:00',
                        horario_fim: '14:00',
                        intervalo: 30,                       // 30 minutos
                        slots_por_horario: 10,               // Máx por slot
                        slots_abertos: {},                   // {} - VAZIO! Admin deve abrir
                        servicos_config: {}                  // Configurações por serviço
                    };
                });
            }

            set(KEYS.CONFIG_EQUIPAMENTOS, configs);
        }

        // ── Inicializa senhas ───────────────────────────────
        if (!get(KEYS.SENHAS)) {
            set(KEYS.SENHAS, {});
        }

        // ── Sincroniza novos dados injetados dinamicamente ──
        if (SobralData.servicos) {
            let currentServicos = get(KEYS.SERVICOS) || [];
            let currentIds = new Set(currentServicos.map(s => s.id));
            let newServicos = SobralData.servicos.filter(s => !currentIds.has(s.id));
            if (newServicos.length > 0) {
                currentServicos.push(...newServicos);
                set(KEYS.SERVICOS, currentServicos);
            }
        }
        if (SobralData.equipamentos) {
            let currentConfigs = get(KEYS.CONFIG_EQUIPAMENTOS) || {};
            let currentAdmins = get(KEYS.ADMINS) || [];
            let adminEmails = new Set(currentAdmins.map(a => a.email));
            let addedConfig = false;
            let addedAdmin = false;
            
            SobralData.equipamentos.forEach(equip => {
                if (!currentConfigs[equip.id]) {
                    currentConfigs[equip.id] = {
                        equipamento_id: equip.id,
                        dias_disponiveis: [1, 2, 3, 4, 5],
                        horario_inicio: '08:00',
                        horario_fim: '14:00',
                        intervalo: 30,
                        slots_por_horario: 10,
                        slots_abertos: {},
                        servicos_config: {}
                    };
                    addedConfig = true;
                }
                
                let adminEmail = `admin@${equip.id}.sobral.ce.gov.br`;
                if (!adminEmails.has(adminEmail)) {
                    currentAdmins.push({
                        id: `admin_${equip.id}`,
                        nome: `Administrador - ${equip.nome.substring(0,30)}`,
                        email: adminEmail,
                        senha: 'admin123',
                        role: 'admin',
                        equipamento_id: equip.id,
                        ativo: true,
                        criado_em: new Date().toISOString()
                    });
                    adminEmails.add(adminEmail);
                    addedAdmin = true;
                }
            });
            
            if (addedConfig) set(KEYS.CONFIG_EQUIPAMENTOS, currentConfigs);
            if (addedAdmin) set(KEYS.ADMINS, currentAdmins);
        }

        // ── Semente de demonstração (apenas conta demo; horários são ativados sob demanda) ──
        seedDemoData();

        console.log('[Storage] Inicialização concluída.');
    }

    // ══════════════════════════════════════════════════════════
    //  SEMENTE DE DEMONSTRAÇÃO
    // ══════════════════════════════════════════════════════════

    /** CPF fictício válido usado na conta de demonstração. */
    const DEMO_CPF = '529.982.247-25';

    /**
     * Garante que exista uma conta de cidadão de demonstração.
     * A disponibilidade de horários demo é ativada explicitamente
     * por `seedDemoAvailability`, para preservar a regra de negócio:
     * agenda real só abre quando o departamento/equipamento abrir.
     */
    function seedDemoData() {
        // 1) Cidadão demo
        const users = getUsers();
        let demo = users.find(u => u.cpf.replace(/\D/g, '') === DEMO_CPF.replace(/\D/g, ''));
        if (!demo) {
            demo = {
                id: 'demo-cidadao',
                nome: 'Maria da Demonstração',
                cpf: DEMO_CPF,
                telefone: '(88) 99999-0000',
                email: 'demo@sobral.ce.gov.br',
                senha: 'demo',
                ativo: true,
                demo: true,
                criado_em: new Date().toISOString()
            };
            users.push(demo);
            saveUsers(users);
        }

    }

    /**
     * Abre uma grade de horários de demonstração. Esta função deve ser
     * chamada apenas pelo fluxo de demo, nunca pela inicialização padrão.
     * @param {string[]} [equipamentoIds] - Lista opcional de equipamentos.
     */
    function seedDemoAvailability(equipamentoIds) {
        if (typeof SobralData === 'undefined' || !SobralData.equipamentos) return;

        const gradePadrao = [
            '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
            '11:00', '13:30', '14:00', '14:30', '15:00', '15:30'
        ];
        const datasUteis = _proximosDiasUteis(21);
        const configs = getAllEquipamentoConfigs();
        const idsPermitidos = Array.isArray(equipamentoIds) && equipamentoIds.length
            ? new Set(equipamentoIds)
            : null;
        let alterou = false;

        SobralData.equipamentos.forEach(eq => {
            if (idsPermitidos && !idsPermitidos.has(eq.id)) return;

            let cfg = configs[eq.id];
            if (!cfg) {
                cfg = {
                    equipamento_id: eq.id,
                    dias_disponiveis: [1, 2, 3, 4, 5],
                        horario_inicio: '08:00',
                        horario_fim: '16:00',
                        intervalo: 30,
                        slots_por_horario: 5,
                        slots_abertos: {},
                        servicos_config: {},
                        demo_seeded: true
                    };
                configs[eq.id] = cfg;
                alterou = true;
            }
            if (!cfg.slots_abertos) cfg.slots_abertos = {};
            cfg.demo_seeded = true;
            datasUteis.forEach(d => {
                if (!(d in cfg.slots_abertos)) {
                    cfg.slots_abertos[d] = gradePadrao.slice();
                    alterou = true;
                }
            });
        });

        if (alterou) set(KEYS.CONFIG_EQUIPAMENTOS, configs);
    }

    /**
     * Retorna as próximas N datas úteis (seg-sex) a partir de amanhã,
     * no formato 'YYYY-MM-DD'.
     * @param {number} n - Quantidade de dias úteis desejada.
     * @returns {string[]}
     */
    function _proximosDiasUteis(n) {
        const datas = [];
        const d = new Date();
        let guarda = 0;
        while (datas.length < n && guarda < n * 3) {
            d.setDate(d.getDate() + 1);
            const dow = d.getDay();
            if (dow >= 1 && dow <= 5) {
                const iso = d.getFullYear() + '-' +
                    String(d.getMonth() + 1).padStart(2, '0') + '-' +
                    String(d.getDate()).padStart(2, '0');
                datas.push(iso);
            }
            guarda++;
        }
        return datas;
    }

    // ══════════════════════════════════════════════════════════
    //  GESTÃO DE USUÁRIOS (CIDADÃOS)
    // ══════════════════════════════════════════════════════════

    /**
     * Obtém a lista de cidadãos cadastrados.
     * @returns {Array<Object>} Lista de usuários cidadãos
     */
    function getUsers() {
        return get(KEYS.USERS) || [];
    }

    /**
     * Salva a lista de cidadãos.
     * @param {Array<Object>} users - Lista completa de usuários
     */
    function saveUsers(users) {
        set(KEYS.USERS, users);
    }

    /**
     * Cria um novo cidadão (registro de conta).
     * @param {Object} dados - { nome, cpf, email, senha }
     * @returns {Object} { success, error?, userId? }
     */
    function createCidadao(dados) {
        const { nome, cpf, email, senha } = dados;

        if (!nome || !cpf || !email || !senha) {
            return { success: false, error: 'Todos os campos são obrigatórios.' };
        }

        if (senha.length < 8) {
            return { success: false, error: 'A senha deve ter no mínimo 8 caracteres.' };
        }

        const cpfLimpo = cpf.replace(/\D/g, '');
        const users = getUsers();

        // Verifica se CPF já existe
        if (users.some(u => u.cpf === cpfLimpo)) {
            return { success: false, error: 'Este CPF já está cadastrado.' };
        }

        // Verifica se email já existe
        if (users.some(u => u.email === email)) {
            return { success: false, error: 'Este email já está cadastrado.' };
        }

        // Cria novo usuário
        const newUser = {
            id: 'user_' + Date.now(),
            nome,
            cpf: cpfLimpo,
            email,
            senha, // Em produção, criptografar!
            criadoEm: new Date().toISOString()
        };

        users.push(newUser);
        saveUsers(users);

        return { success: true, userId: newUser.id };
    }

    // ══════════════════════════════════════════════════════════
    //  GESTÃO DE ADMINISTRADORES
    // ══════════════════════════════════════════════════════════

    /**
     * Obtém a lista de administradores.
     * @returns {Array<Object>} Lista de admins
     */
    function getAdmins() {
        return get(KEYS.ADMINS) || [];
    }

    /**
     * Salva a lista de administradores.
     * @param {Array<Object>} admins - Lista completa de admins
     */
    function saveAdmins(admins) {
        set(KEYS.ADMINS, admins);
    }

    // ══════════════════════════════════════════════════════════
    //  GESTÃO DE AGENDAMENTOS
    // ══════════════════════════════════════════════════════════

    /**
     * Obtém a lista de agendamentos.
     * @returns {Array<Object>} Lista de agendamentos
     */
    function getAgendamentos() {
        return get(KEYS.AGENDAMENTOS) || [];
    }

    /**
     * Salva a lista de agendamentos.
     * @param {Array<Object>} list - Lista completa de agendamentos
     */
    function saveAgendamentos(list) {
        set(KEYS.AGENDAMENTOS, list);
    }

    // ══════════════════════════════════════════════════════════
    //  GESTÃO DE SERVIÇOS
    // ══════════════════════════════════════════════════════════

    /**
     * Obtém a lista de serviços disponíveis.
     * @returns {Array<Object>} Lista de serviços
     */
    function getServicos() {
        return get(KEYS.SERVICOS) || [];
    }

    /**
     * Salva a lista de serviços.
     * @param {Array<Object>} list - Lista completa de serviços
     */
    function saveServicos(list) {
        set(KEYS.SERVICOS, list);
    }

    // ══════════════════════════════════════════════════════════
    //  CONFIGURAÇÃO DE EQUIPAMENTOS
    // ══════════════════════════════════════════════════════════

    /**
     * Obtém a configuração de um equipamento específico.
     * 
     * A configuração contém:
     * - dias_disponiveis: [0-6] dias da semana habilitados
     * - horario_inicio / horario_fim: janela de atendimento
     * - intervalo: duração de cada slot em minutos
     * - slots_por_horario: capacidade máxima por slot
     * - slots_abertos: { 'YYYY-MM-DD': ['HH:MM', ...] } abertos pelo admin
     * - servicos_config: configurações específicas por serviço
     * 
     * @param {string} equipamentoId - ID do equipamento
     * @returns {Object|null} Configuração do equipamento, ou null se não encontrado
     */
    function getEquipamentoConfig(equipamentoId) {
        const configs = get(KEYS.CONFIG_EQUIPAMENTOS) || {};
        return configs[equipamentoId] || null;
    }

    /**
     * Salva a configuração de um equipamento.
     * @param {string} equipamentoId - ID do equipamento
     * @param {Object} config - Objeto de configuração completo
     */
    function saveEquipamentoConfig(equipamentoId, config) {
        const configs = get(KEYS.CONFIG_EQUIPAMENTOS) || {};
        configs[equipamentoId] = config;
        set(KEYS.CONFIG_EQUIPAMENTOS, configs);
    }

    /**
     * Obtém todas as configurações de equipamentos.
     * @returns {Object} Mapa de configurações indexado por equipamento_id
     */
    function getAllEquipamentoConfigs() {
        return get(KEYS.CONFIG_EQUIPAMENTOS) || {};
    }

    // ══════════════════════════════════════════════════════════
    //  GESTÃO DE SLOTS E DISPONIBILIDADE
    // ══════════════════════════════════════════════════════════

    /**
     * Conta quantos agendamentos confirmados existem para um slot específico.
     * Considera apenas agendamentos com status diferente de 'cancelado'.
     * 
     * @param {string} equipamentoId - ID do equipamento
     * @param {string} data - Data no formato 'YYYY-MM-DD'
     * @param {string} hora - Horário no formato 'HH:MM'
     * @returns {number} Quantidade de agendamentos no slot
     */
    function getSlotCount(equipamentoId, data, hora) {
        const agendamentos = getAgendamentos();
        return agendamentos.filter(ag =>
            ag.equipamento_id === equipamentoId &&
            ag.data === data &&
            ag.hora === hora &&
            ag.status !== 'cancelado'
        ).length;
    }

    /**
     * Verifica se um slot está disponível para agendamento.
     * 
     * Um slot está disponível quando AMBAS as condições são verdadeiras:
     * 1. O admin abriu o slot explicitamente (existe em slots_abertos)
     * 2. A quantidade de agendamentos é menor que slots_por_horario
     * 
     * @param {string} equipamentoId - ID do equipamento
     * @param {string} data - Data no formato 'YYYY-MM-DD'
     * @param {string} hora - Horário no formato 'HH:MM'
     * @returns {boolean} true se o slot está disponível para agendamento
     */
    function isSlotAvailable(equipamentoId, data, hora) {
        // Verifica se o slot foi aberto pelo admin
        const openSlots = getOpenSlots(equipamentoId, data);
        if (!openSlots.includes(hora)) {
            return false;
        }

        // Verifica se ainda há capacidade
        const config = getEquipamentoConfig(equipamentoId);
        if (!config) return false;

        const currentCount = getSlotCount(equipamentoId, data, hora);
        return currentCount < config.slots_por_horario;
    }

    /**
     * Obtém os slots abertos pelo admin para uma data específica.
     * 
     * REGRA DE NEGÓCIO: Somente retorna horários que o administrador
     * configurou explicitamente como disponíveis. Se nenhum slot foi
     * aberto para a data, retorna array vazio e o serviço aparece
     * como indisponível.
     * 
     * @param {string} equipamentoId - ID do equipamento
     * @param {string} data - Data no formato 'YYYY-MM-DD'
     * @returns {string[]} Array de horários abertos (ex: ['08:00', '08:30', '09:00'])
     */
    function getOpenSlots(equipamentoId, data) {
        const config = getEquipamentoConfig(equipamentoId);
        if (!config || !config.slots_abertos) {
            return [];
        }

        // Retorna os slots abertos para a data, ou vazio se nenhum
        return config.slots_abertos[data] || [];
    }

    // ══════════════════════════════════════════════════════════
    //  GESTÃO DE SENHAS DE ATENDIMENTO
    // ══════════════════════════════════════════════════════════

    /**
     * Obtém o próximo número sequencial de senha para um equipamento em uma data.
     * Chave composta: 'equipamento_id_YYYY-MM-DD'
     * 
     * @param {string} equipamentoId - ID do equipamento
     * @param {string} data - Data no formato 'YYYY-MM-DD'
     * @returns {number} Próximo número sequencial (começa em 1)
     */
    function getSenhaSequencial(equipamentoId, data) {
        const senhas = get(KEYS.SENHAS) || {};
        const chave = `${equipamentoId}_${data}`;
        return (senhas[chave] || 0) + 1;
    }

    /**
     * Incrementa e retorna o próximo número sequencial de senha.
     * Persiste o novo valor no localStorage.
     * 
     * @param {string} equipamentoId - ID do equipamento
     * @param {string} data - Data no formato 'YYYY-MM-DD'
     * @returns {number} Número sequencial atribuído
     */
    function incrementSenha(equipamentoId, data) {
        const senhas = get(KEYS.SENHAS) || {};
        const chave = `${equipamentoId}_${data}`;
        const proximo = (senhas[chave] || 0) + 1;
        senhas[chave] = proximo;
        set(KEYS.SENHAS, senhas);
        return proximo;
    }

    // ══════════════════════════════════════════════════════════
    //  GESTÃO DE SESSÃO
    // ══════════════════════════════════════════════════════════

    /**
     * Obtém a sessão atual do usuário.
     * @returns {Object|null} Objeto de sessão {type, userId, loginTime} ou null
     */
    function getSession() {
        return get(KEYS.SESSION);
    }

    /**
     * Salva uma sessão de usuário.
     * @param {Object} session - Dados da sessão {type: 'cidadao'|'admin', userId, loginTime}
     */
    function saveSession(session) {
        set(KEYS.SESSION, session);
    }

    /**
     * Encerra a sessão atual, removendo os dados do localStorage.
     */
    function clearSession() {
        localStorage.removeItem(KEYS.SESSION);
    }

    // ══════════════════════════════════════════════════════════
    //  RESET
    // ══════════════════════════════════════════════════════════

    /**
     * Remove todos os dados do localStorage e reinicializa com valores padrão.
     * ⚠️ AÇÃO DESTRUTIVA: todos os agendamentos, usuários e configurações
     * serão perdidos.
     */
    function resetStorage() {
        Object.values(KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
        init();
        console.log('[Storage] Storage resetado e reinicializado.');
    }

    // ══════════════════════════════════════════════════════════
    //  API PÚBLICA
    // ══════════════════════════════════════════════════════════

    return {
        // Inicialização
        init,

        // Operações genéricas
        get,
        set,

        // Cidadãos
        getUsers,
        saveUsers,
        createCidadao,

        // Administradores
        getAdmins,
        saveAdmins,

        // Agendamentos
        getAgendamentos,
        saveAgendamentos,

        // Serviços
        getServicos,
        saveServicos,

        // Configuração de equipamentos
        getEquipamentoConfig,
        saveEquipamentoConfig,
        getAllEquipamentoConfigs,

        // Slots e disponibilidade
        getSlotCount,
        isSlotAvailable,
        getOpenSlots,

        // Senhas
        getSenhaSequencial,
        incrementSenha,

        // Sessão
        getSession,
        saveSession,
        clearSession,

        // Reset
        resetStorage,

        // Demo
        seedDemoAvailability
    };
})();
