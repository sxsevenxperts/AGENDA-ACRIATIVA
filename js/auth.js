/**
 * ============================================================
 * AGENDA SOBRAL - Módulo de Autenticação
 * ============================================================
 * Gerencia autenticação e sessão para cidadãos e administradores.
 * 
 * REGRAS:
 * - Cada equipamento possui seu próprio login administrativo
 * - Super admin (role: 'super_admin') gerencia todos os equipamentos
 * - Cidadãos se autenticam via CPF e senha
 * - Admins se autenticam via e-mail e senha
 * - Sessão é persistida no localStorage e restaurada ao carregar o app
 * 
 * Todas as funções ficam acessíveis via o objeto global `Auth`.
 * ============================================================
 */

const Auth = (() => {
    'use strict';

    /**
     * Sessão ativa em memória (cache do que está no Storage).
     * @type {Object|null}
     * @property {string} type - 'cidadao' ou 'admin'
     * @property {Object} user - Dados completos do usuário logado
     */
    let currentSession = null;

    // ══════════════════════════════════════════════════════════
    //  INICIALIZAÇÃO
    // ══════════════════════════════════════════════════════════

    /**
     * Inicializa o módulo de autenticação.
     * Verifica se existe uma sessão salva e restaura os dados do usuário.
     * Deve ser chamado no carregamento da aplicação.
     * 
     * @returns {Object|null} Sessão restaurada ou null se não houver sessão ativa
     */
    function init() {
        const savedSession = Storage.getSession();

        if (!savedSession || !savedSession.type || !savedSession.userId) {
            currentSession = null;
            return null;
        }

        // Busca o usuário correspondente nos dados persistidos
        const user = _findUserById(savedSession.type, savedSession.userId);

        if (!user) {
            // Sessão inválida — usuário não encontrado (pode ter sido removido)
            Storage.clearSession();
            currentSession = null;
            console.warn('[Auth] Sessão restaurada apontava para usuário inexistente. Sessão removida.');
            return null;
        }

        currentSession = {
            type: savedSession.type,
            user: user
        };

        console.log(`[Auth] Sessão restaurada: ${savedSession.type} — ${user.nome}`);
        return currentSession;
    }

    // ══════════════════════════════════════════════════════════
    //  LOGIN DE CIDADÃO
    // ══════════════════════════════════════════════════════════

    /**
     * Realiza o login de um cidadão usando CPF e senha.
     * 
     * Validações:
     * - CPF e senha são obrigatórios
     * - CPF deve existir no cadastro
     * - Senha deve corresponder
     * 
     * @param {string} cpf - CPF do cidadão (com ou sem formatação)
     * @param {string} senha - Senha do cidadão
     * @returns {Object} Resultado do login
     * @returns {boolean} .success - Se o login foi bem-sucedido
     * @returns {Object} [.user] - Dados do usuário logado (sem senha)
     * @returns {string} [.error] - Mensagem de erro em caso de falha
     */
    function loginCidadao(cpf, senha) {
        // Validação de campos obrigatórios
        if (!cpf || !senha) {
            return { success: false, error: 'CPF e senha são obrigatórios.' };
        }

        const cpfLimpo = cpf.replace(/\D/g, '');
        const users = Storage.getUsers();

        // Busca o usuário pelo CPF (comparação sem formatação)
        const user = users.find(u => u.cpf.replace(/\D/g, '') === cpfLimpo);

        if (!user) {
            return { success: false, error: 'CPF não encontrado. Verifique os dados ou realize o cadastro.' };
        }

        // Verifica a senha
        if (user.senha !== senha) {
            return { success: false, error: 'Senha incorreta. Tente novamente.' };
        }

        // Cria a sessão
        const session = {
            type: 'cidadao',
            userId: user.id,
            loginTime: new Date().toISOString()
        };

        Storage.saveSession(session);

        // Prepara dados do usuário sem expor a senha
        const userSafe = _sanitizeUser(user);

        currentSession = {
            type: 'cidadao',
            user: userSafe
        };

        console.log(`[Auth] Login cidadão: ${user.nome}`);
        return { success: true, user: userSafe };
    }

    // ══════════════════════════════════════════════════════════
    //  LOGIN DE ADMINISTRADOR
    // ══════════════════════════════════════════════════════════

    /**
     * Realiza o login de um administrador usando e-mail e senha.
     * 
     * Cada equipamento possui seu próprio admin. O super_admin tem
     * acesso a todos os equipamentos.
     * 
     * @param {string} email - E-mail do administrador
     * @param {string} senha - Senha do administrador
     * @returns {Object} Resultado do login
     * @returns {boolean} .success - Se o login foi bem-sucedido
     * @returns {Object} [.admin] - Dados do admin logado (sem senha)
     * @returns {string} [.error] - Mensagem de erro em caso de falha
     */
    function loginAdmin(email, senha) {
        // Validação de campos obrigatórios
        if (!email || !senha) {
            return { success: false, error: 'E-mail e senha são obrigatórios.' };
        }

        const emailLower = email.trim().toLowerCase();
        const admins = Storage.getAdmins();

        // Busca o admin pelo e-mail (case-insensitive)
        const admin = admins.find(a =>
            a.email.toLowerCase() === emailLower && a.ativo !== false
        );

        if (!admin) {
            return { success: false, error: 'E-mail não encontrado ou conta inativa.' };
        }

        // Verifica a senha
        if (admin.senha !== senha) {
            return { success: false, error: 'Senha incorreta. Tente novamente.' };
        }

        // Cria a sessão
        const session = {
            type: 'admin',
            userId: admin.id,
            loginTime: new Date().toISOString()
        };

        Storage.saveSession(session);

        // Prepara dados do admin sem expor a senha
        const adminSafe = _sanitizeUser(admin);

        currentSession = {
            type: 'admin',
            user: adminSafe
        };

        console.log(`[Auth] Login admin: ${admin.nome} (${admin.role})`);
        return { success: true, admin: adminSafe };
    }

    // ══════════════════════════════════════════════════════════
    //  REGISTRO DE CIDADÃO
    // ══════════════════════════════════════════════════════════

    /**
     * Registra um novo cidadão no sistema.
     * 
     * Validações realizadas:
     * - Todos os campos obrigatórios preenchidos
     * - Formato de CPF válido (algoritmo completo)
     * - CPF não duplicado no cadastro
     * - Formato de e-mail válido (se informado)
     * - Formato de telefone válido
     * 
     * @param {Object} dados - Dados do cidadão
     * @param {string} dados.nome - Nome completo
     * @param {string} dados.cpf - CPF (com ou sem formatação)
     * @param {string} dados.telefone - Telefone de contato
     * @param {string} [dados.email] - E-mail (opcional)
     * @param {string} dados.senha - Senha de acesso
     * @returns {Object} Resultado do registro
     * @returns {boolean} .success - Se o registro foi bem-sucedido
     * @returns {Object} [.user] - Dados do usuário criado (sem senha)
     * @returns {string} [.error] - Mensagem de erro em caso de falha
     */
    function registrarCidadao(dados) {
        const { nome, cpf, telefone, email, senha } = dados;

        // ── Validação de campos obrigatórios ─────────────────
        if (!nome || !nome.trim()) {
            return { success: false, error: 'Nome é obrigatório.' };
        }

        if (!cpf) {
            return { success: false, error: 'CPF é obrigatório.' };
        }

        if (!senha || senha.length < 4) {
            return { success: false, error: 'Senha deve ter no mínimo 4 caracteres.' };
        }

        if (!telefone) {
            return { success: false, error: 'Telefone é obrigatório.' };
        }

        // ── Validação de formato ─────────────────────────────
        const cpfLimpo = cpf.replace(/\D/g, '');

        if (!Utils.validateCPF(cpfLimpo)) {
            return { success: false, error: 'CPF inválido. Verifique os dígitos informados.' };
        }

        if (!Utils.validatePhone(telefone)) {
            return { success: false, error: 'Telefone inválido. Use o formato (88) 99999-9999.' };
        }

        if (email && !Utils.validateEmail(email)) {
            return { success: false, error: 'Formato de e-mail inválido.' };
        }

        // ── Verifica duplicidade de CPF ──────────────────────
        const users = Storage.getUsers();
        const cpfExistente = users.find(u => u.cpf.replace(/\D/g, '') === cpfLimpo);

        if (cpfExistente) {
            return { success: false, error: 'Este CPF já está cadastrado no sistema.' };
        }

        // ── Cria o novo usuário ──────────────────────────────
        const novoUser = {
            id: Utils.generateId(),
            nome: nome.trim(),
            cpf: Utils.formatCPF(cpfLimpo),
            telefone: Utils.formatPhone(telefone),
            email: email ? email.trim().toLowerCase() : '',
            senha: senha,
            ativo: true,
            criado_em: new Date().toISOString()
        };

        users.push(novoUser);
        Storage.saveUsers(users);

        // Faz login automático após registro
        const session = {
            type: 'cidadao',
            userId: novoUser.id,
            loginTime: new Date().toISOString()
        };
        Storage.saveSession(session);

        const userSafe = _sanitizeUser(novoUser);
        currentSession = {
            type: 'cidadao',
            user: userSafe
        };

        console.log(`[Auth] Novo cidadão registrado: ${novoUser.nome}`);
        return { success: true, user: userSafe };
    }

    // ══════════════════════════════════════════════════════════
    //  LOGOUT
    // ══════════════════════════════════════════════════════════

    /**
     * Encerra a sessão do usuário atual.
     * Remove dados da sessão do localStorage e da memória.
     */
    function logout() {
        const nome = currentSession?.user?.nome || 'desconhecido';
        Storage.clearSession();
        currentSession = null;
        console.log(`[Auth] Logout: ${nome}`);
    }

    // ══════════════════════════════════════════════════════════
    //  CONSULTA DE SESSÃO
    // ══════════════════════════════════════════════════════════

    /**
     * Obtém a sessão atual do usuário.
     * @returns {Object|null} Sessão {type: 'cidadao'|'admin', user: {...}} ou null
     */
    function getSession() {
        return currentSession;
    }

    /**
     * Verifica se há um usuário logado.
     * @returns {boolean} true se há sessão ativa
     */
    function isLoggedIn() {
        return currentSession !== null;
    }

    /**
     * Verifica se o usuário logado é um cidadão.
     * @returns {boolean} true se o usuário é cidadão
     */
    function isCidadao() {
        return currentSession?.type === 'cidadao';
    }

    /**
     * Verifica se o usuário logado é um administrador.
     * @returns {boolean} true se o usuário é admin
     */
    function isAdmin() {
        return currentSession?.type === 'admin';
    }

    // ══════════════════════════════════════════════════════════
    //  PERMISSÕES DE ADMIN
    // ══════════════════════════════════════════════════════════

    /**
     * Retorna os IDs dos equipamentos que o admin logado gerencia.
     * 
     * - Admin regular: retorna apenas o equipamento associado
     * - Super admin (role: 'super_admin'): retorna TODOS os equipamentos
     * - Se não for admin: retorna array vazio
     * 
     * @returns {string[]} Array de IDs de equipamentos gerenciados
     */
    function getAdminEquipamentos() {
        if (!isAdmin() || !currentSession.user) {
            return [];
        }

        const admin = currentSession.user;

        // Super admin gerencia todos os equipamentos
        if (admin.role === 'super_admin') {
            if (typeof SobralData !== 'undefined' && SobralData.equipamentos) {
                return SobralData.equipamentos.map(e => e.id);
            }
            // Fallback: pega dos configs
            const configs = Storage.getAllEquipamentoConfigs();
            return Object.keys(configs);
        }

        // Admin regular gerencia apenas seu equipamento
        if (admin.equipamento_id) {
            return [admin.equipamento_id];
        }

        return [];
    }

    // ══════════════════════════════════════════════════════════
    //  ATUALIZAÇÃO DE PERFIL
    // ══════════════════════════════════════════════════════════

    /**
     * Atualiza os dados de perfil do usuário logado.
     * 
     * Campos atualizáveis:
     * - Cidadão: nome, telefone, email
     * - Admin: nome, telefone, email
     * 
     * O CPF e o role não podem ser alterados.
     * 
     * @param {Object} dados - Dados a atualizar
     * @param {string} [dados.nome] - Novo nome
     * @param {string} [dados.telefone] - Novo telefone
     * @param {string} [dados.email] - Novo e-mail
     * @returns {Object} Resultado da operação
     * @returns {boolean} .success - Se a atualização foi bem-sucedida
     * @returns {Object} [.user] - Dados atualizados do usuário (sem senha)
     * @returns {string} [.error] - Mensagem de erro em caso de falha
     */
    function updateProfile(dados) {
        if (!isLoggedIn()) {
            return { success: false, error: 'Nenhum usuário logado.' };
        }

        const { nome, telefone, email } = dados;

        // Validações
        if (telefone && !Utils.validatePhone(telefone)) {
            return { success: false, error: 'Telefone inválido.' };
        }

        if (email && !Utils.validateEmail(email)) {
            return { success: false, error: 'Formato de e-mail inválido.' };
        }

        // Busca o usuário na lista correta
        const isCid = isCidadao();
        const list = isCid ? Storage.getUsers() : Storage.getAdmins();
        const index = list.findIndex(u => u.id === currentSession.user.id);

        if (index === -1) {
            return { success: false, error: 'Usuário não encontrado no armazenamento.' };
        }

        // Aplica as alterações
        if (nome && nome.trim()) list[index].nome = nome.trim();
        if (telefone) list[index].telefone = Utils.formatPhone(telefone);
        if (email !== undefined) list[index].email = email ? email.trim().toLowerCase() : '';

        // Persiste
        if (isCid) {
            Storage.saveUsers(list);
        } else {
            Storage.saveAdmins(list);
        }

        // Atualiza a sessão em memória
        currentSession.user = _sanitizeUser(list[index]);

        console.log(`[Auth] Perfil atualizado: ${list[index].nome}`);
        return { success: true, user: currentSession.user };
    }

    // ══════════════════════════════════════════════════════════
    //  ALTERAÇÃO DE SENHA
    // ══════════════════════════════════════════════════════════

    /**
     * Altera a senha do usuário logado.
     * Requer a senha atual para confirmação de identidade.
     * 
     * @param {string} oldPass - Senha atual
     * @param {string} newPass - Nova senha (mínimo 4 caracteres)
     * @returns {Object} Resultado da operação
     * @returns {boolean} .success - Se a alteração foi bem-sucedida
     * @returns {string} [.error] - Mensagem de erro em caso de falha
     */
    function changePassword(oldPass, newPass) {
        if (!isLoggedIn()) {
            return { success: false, error: 'Nenhum usuário logado.' };
        }

        if (!oldPass || !newPass) {
            return { success: false, error: 'Senha atual e nova senha são obrigatórias.' };
        }

        if (newPass.length < 4) {
            return { success: false, error: 'A nova senha deve ter no mínimo 4 caracteres.' };
        }

        if (oldPass === newPass) {
            return { success: false, error: 'A nova senha deve ser diferente da atual.' };
        }

        // Busca o usuário com senha para validação
        const isCid = isCidadao();
        const list = isCid ? Storage.getUsers() : Storage.getAdmins();
        const index = list.findIndex(u => u.id === currentSession.user.id);

        if (index === -1) {
            return { success: false, error: 'Usuário não encontrado no armazenamento.' };
        }

        // Verifica senha atual
        if (list[index].senha !== oldPass) {
            return { success: false, error: 'Senha atual incorreta.' };
        }

        // Atualiza a senha
        list[index].senha = newPass;

        if (isCid) {
            Storage.saveUsers(list);
        } else {
            Storage.saveAdmins(list);
        }

        console.log(`[Auth] Senha alterada: ${list[index].nome}`);
        return { success: true };
    }

    // ══════════════════════════════════════════════════════════
    //  FUNÇÕES AUXILIARES PRIVADAS
    // ══════════════════════════════════════════════════════════

    /**
     * Busca um usuário pelo ID na lista de cidadãos ou admins.
     * @private
     * @param {string} type - Tipo do usuário ('cidadao' ou 'admin')
     * @param {string} userId - ID do usuário
     * @returns {Object|null} Usuário encontrado ou null
     */
    function _findUserById(type, userId) {
        if (type === 'cidadao') {
            const users = Storage.getUsers();
            return users.find(u => u.id === userId) || null;
        }

        if (type === 'admin') {
            const admins = Storage.getAdmins();
            return admins.find(a => a.id === userId) || null;
        }

        return null;
    }

    /**
     * Remove a senha e dados sensíveis de um objeto de usuário.
     * @private
     * @param {Object} user - Objeto do usuário com todos os campos
     * @returns {Object} Cópia do usuário sem a senha
     */
    function _sanitizeUser(user) {
        const { senha, ...safeData } = user;
        return { ...safeData };
    }

    // ══════════════════════════════════════════════════════════
    //  API PÚBLICA
    // ══════════════════════════════════════════════════════════

    return {
        // Inicialização
        init,

        // Login
        loginCidadao,
        loginAdmin,

        // Registro
        registrarCidadao,

        // Sessão
        logout,
        getSession,
        isLoggedIn,
        isCidadao,
        isAdmin,

        // Permissões
        getAdminEquipamentos,

        // Perfil
        updateProfile,
        changePassword
    };
})();
