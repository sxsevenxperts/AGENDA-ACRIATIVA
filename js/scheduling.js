/* ============================================================
   AGENDA SOBRAL — Módulo de Agendamento (Scheduling)
   Gerencia consulta de secretarias, equipamentos, serviços,
   disponibilidade de datas/horários e operações CRUD de
   agendamentos.
   ============================================================ */

/**
 * @global
 * @namespace Scheduling
 * @description Módulo responsável por toda a lógica de agendamento
 *   do sistema Agenda Sobral. Consulta dados pré-carregados
 *   (SobralData), configurações de administrador (Storage) e
 *   sessão do usuário (Auth) para orquestrar o fluxo de marcação
 *   de atendimentos.
 */
const Scheduling = (() => {
  'use strict';

  /* ==========================================================
     DIAS DA SEMANA — mapeamento numérico → nome em pt-BR
     (0 = Domingo … 6 = Sábado, conforme Date.getDay())
     ========================================================== */
  const DIAS_SEMANA = [
    'Domingo', 'Segunda-feira', 'Terça-feira',
    'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'
  ];

  /* ==========================================================
     FERIADOS — lista consolidada (inclui datas de SobralData)
     ========================================================== */

  /**
   * Verifica se uma data (string YYYY-MM-DD) é feriado.
   * @param {string} dataStr - Data no formato 'YYYY-MM-DD'.
   * @returns {boolean} true se for feriado.
   */
  function _isFeriado(dataStr) {
    const feriados = SobralData.config.feriados2025 || [];
    return feriados.includes(dataStr);
  }

  /* ==========================================================
     CONSULTAS DE SECRETARIAS
     ========================================================== */

  /**
   * Retorna todas as secretarias cadastradas.
   * @returns {Array<Object>} Lista de secretarias.
   */
  function getSecretarias() {
    return SobralData.secretarias || [];
  }

  /**
   * Retorna uma secretaria pelo seu ID.
   * @param {string} secretariaId - ID da secretaria.
   * @returns {Object|undefined} Objeto da secretaria ou undefined.
   */
  function getSecretariaById(secretariaId) {
    return (SobralData.secretarias || []).find(
      (s) => s.id === secretariaId
    );
  }

  /* ==========================================================
     CONSULTAS DE EQUIPAMENTOS
     ========================================================== */

  /**
   * Retorna os equipamentos vinculados a uma secretaria.
   * @param {string} secretariaId - ID da secretaria.
   * @returns {Array<Object>} Lista de equipamentos filtrados.
   */
  function getEquipamentosBySecretaria(secretariaId) {
    return (SobralData.equipamentos || []).filter(
      (e) => e.secretaria_id === secretariaId
    );
  }

  /**
   * Retorna um equipamento pelo seu ID.
   * @param {string} equipamentoId - ID do equipamento.
   * @returns {Object|undefined} Objeto do equipamento ou undefined.
   */
  function getEquipamentoById(equipamentoId) {
    return (SobralData.equipamentos || []).find(
      (e) => e.id === equipamentoId
    );
  }

  /* ==========================================================
     CONSULTAS DE SERVIÇOS
     ========================================================== */

  /**
   * Retorna os serviços ATIVOS de um equipamento.
   *
   * A lógica de ativação segue estas regras:
   *   1. Busca serviços em Storage.getServicos() cujo
   *      equipamento_id corresponda;
   *   2. Caso não existam serviços customizados no Storage,
   *      usa os serviços padrão de SobralData.servicos;
   *   3. Verifica a configuração do equipamento
   *      (servicos_config) para checar a flag `ativo`.
   *      Se não houver configuração, o serviço é considerado
   *      ativo por padrão.
   *
   * @param {string} equipamentoId - ID do equipamento.
   * @returns {Array<Object>} Serviços ativos.
   */
  function getServicosByEquipamento(equipamentoId) {
    /* Prioriza serviços do Storage (podem ter sido editados) */
    const todosServicos = Storage.getServicos
      ? Storage.getServicos()
      : [];

    /* Serviços do equipamento (Storage + SobralData como fallback) */
    let servicosEquipamento = todosServicos.filter(
      (s) => s.equipamento_id === equipamentoId
    );

    if (servicosEquipamento.length === 0) {
      servicosEquipamento = (SobralData.servicos || []).filter(
        (s) => s.equipamento_id === equipamentoId
      );
    }

    /* Obtém configuração do equipamento para checar flag ativo */
    const config = Storage.getEquipamentoConfig
      ? Storage.getEquipamentoConfig(equipamentoId)
      : null;

    const servicosConfig = (config && config.servicos_config) || {};

    return servicosEquipamento.filter((servico) => {
      const cfg = servicosConfig[servico.id];
      /* Se não há config, o serviço é ativo por padrão */
      if (!cfg) return true;
      return cfg.ativo !== false;
    }).map((servico) => {
      const cfg = servicosConfig[servico.id] || {};
      return Object.assign({}, servico, {
        duracao: cfg.duracao_customizada || servico.duracao || 30,
        documentos_necessarios: cfg.documentos_necessarios || [],
        orientacoes: cfg.observacoes || ''
      });
    });
  }

  /**
   * Retorna um único serviço pelo seu ID.
   * Busca primeiro no Storage e, se não encontrar, em SobralData.
   *
   * @param {string} servicoId - ID do serviço.
   * @returns {Object|undefined} Objeto do serviço ou undefined.
   */
  function getServicoById(servicoId) {
    /* Tenta no Storage primeiro */
    if (Storage.getServicos) {
      const doStorage = Storage.getServicos().find(
        (s) => s.id === servicoId
      );
      if (doStorage) return doStorage;
    }

    /* Fallback para dados estáticos */
    return (SobralData.servicos || []).find(
      (s) => s.id === servicoId
    );
  }

  /* ==========================================================
     DISPONIBILIDADE — DATAS
     ========================================================== */

  /**
   * Retorna as datas disponíveis para agendamento nos próximos
   * N dias, respeitando:
   *   a) O dia da semana estar na lista `dias_disponiveis`
   *      da configuração do equipamento;
   *   b) A data não ser feriado;
   *   c) Existirem slots abertos com vagas restantes.
   *
   * @param {string} equipamentoId - ID do equipamento.
   * @param {number} [numDias=30] - Quantidade de dias a varrer.
   * @returns {Array<{data: string, diaSemana: string, slotsDisponiveis: number}>}
   *   Lista de objetos com data formatada, dia da semana e
   *   contagem de slots disponíveis.
   */
  function getDatasDisponiveis(equipamentoId, numDias) {
    numDias = numDias || SobralData.config.diasAntecedenciaMax || 30;

    const config = Storage.getEquipamentoConfig
      ? Storage.getEquipamentoConfig(equipamentoId)
      : null;

    /* Dias da semana permitidos (padrão: Seg-Sex = [1,2,3,4,5]) */
    const diasPermitidos = (config && config.dias_disponiveis)
      ? config.dias_disponiveis
      : SobralData.config.horarioFuncionamentoPadrao.diasSemana;

    const resultado = [];
    const hoje = new Date();

    /* Começa a partir de amanhã (antecedência mínima = 1 dia) */
    const antecedenciaMin = SobralData.config.diasAntecedenciaMin || 1;

    for (let i = antecedenciaMin; i <= numDias; i++) {
      const d = new Date(hoje);
      d.setDate(hoje.getDate() + i);

      const diaSemana = d.getDay(); // 0-6
      const dataStr = _formatarDataISO(d);

      /* Condição a) dia da semana permitido */
      if (!diasPermitidos.includes(diaSemana)) continue;

      /* Condição b) não é feriado */
      if (_isFeriado(dataStr)) continue;

      /* Condição c) possui slots abertos com vagas */
      const horarios = getHorariosDisponiveis(equipamentoId, dataStr);
      const slotsComVaga = horarios.filter((h) => h.vagasRestantes > 0);

      if (slotsComVaga.length === 0) continue;

      resultado.push({
        data: dataStr,
        diaSemana: DIAS_SEMANA[diaSemana],
        slotsDisponiveis: slotsComVaga.length
      });
    }

    return resultado;
  }

  /* ==========================================================
     DISPONIBILIDADE — HORÁRIOS
     ========================================================== */

  /**
   * Retorna os horários disponíveis para um equipamento em uma
   * data específica.
   *
   * Regras:
   *   a) O administrador deve ter aberto os slots para essa data
   *      (campo slots_abertos[data] na configuração);
   *   b) Cada slot deve ter vagas restantes (bookings existentes
   *      < slots_por_horario configurado).
   *
   * @param {string} equipamentoId - ID do equipamento.
   * @param {string} data - Data no formato 'YYYY-MM-DD'.
   * @returns {Array<{hora: string, vagasRestantes: number, totalVagas: number}>}
   *   Lista de horários com vagas.
   */
  function getHorariosDisponiveis(equipamentoId, data) {
    const config = Storage.getEquipamentoConfig
      ? Storage.getEquipamentoConfig(equipamentoId)
      : null;

    /* Se não há config ou slots abertos, nada disponível */
    if (!config || !config.slots_abertos || !config.slots_abertos[data]) {
      return [];
    }

    const horariosAbertos = config.slots_abertos[data];
    const slotsPorHorario = config.slots_por_horario
      || SobralData.config.maxAgendamentosPorSlot
      || 10;

    /* Busca agendamentos existentes para o equipamento nessa data */
    const agendamentos = Storage.getAgendamentos
      ? Storage.getAgendamentos()
      : [];

    const agendamentosData = agendamentos.filter(
      (a) =>
        a.equipamento_id === equipamentoId &&
        a.data === data &&
        a.status !== 'cancelado'
    );

    const resultado = [];

    horariosAbertos.forEach((hora) => {
      const count = agendamentosData.filter((a) => a.hora === hora).length;
      const vagasRestantes = Math.max(0, slotsPorHorario - count);

      resultado.push({
        hora: hora,
        vagasRestantes: vagasRestantes,
        totalVagas: slotsPorHorario
      });
    });

    /* Ordena por horário crescente */
    resultado.sort((a, b) => a.hora.localeCompare(b.hora));

    return resultado;
  }

  /* ==========================================================
     CRIAÇÃO DE AGENDAMENTO
     ========================================================== */

  /**
   * Cria um novo agendamento.
   *
   * Fluxo:
   *   1. Obtém o usuário logado via Auth.getSession();
   *   2. Valida se o slot está disponível (vagas restantes > 0);
   *   3. Impede duplicidade — mesmo usuário, mesmo equipamento,
   *      mesma data e mesmo horário;
   *   4. Gera ID único (Utils.generateId), senha sequencial
   *      (sigla do equipamento + Storage.getSenhaSequencial);
   *   5. Salva com status 'confirmado'.
   *
   * @param {Object} dados - Dados do agendamento.
   * @param {string} dados.equipamento_id - ID do equipamento.
   * @param {string} dados.servico_id - ID do serviço.
   * @param {string} dados.data - Data ('YYYY-MM-DD').
   * @param {string} dados.hora - Horário ('HH:MM').
   * @param {string} [dados.observacoes] - Observações opcionais.
   * @returns {{success: boolean, agendamento?: Object, error?: string}}
   *   Resultado da operação.
   */
  function criarAgendamento(dados) {
    /* 1) Usuário logado */
    const session = Auth.getSession ? Auth.getSession() : null;
    if (!session) {
      return { success: false, error: 'Usuário não está autenticado.' };
    }

    const usuario = session.user || session;
    const usuarioId = usuario.id || session.userId || session.usuario_id;
    if (!usuarioId) {
      return { success: false, error: 'Sessão inválida — ID do usuário não encontrado.' };
    }

    /* Validações básicas */
    if (!dados.equipamento_id || !dados.servico_id || !dados.data || !dados.hora) {
      return { success: false, error: 'Todos os campos obrigatórios devem ser preenchidos.' };
    }

    /* 2) Verifica disponibilidade do slot */
    const horarios = getHorariosDisponiveis(dados.equipamento_id, dados.data);
    const slot = horarios.find((h) => h.hora === dados.hora);

    if (!slot) {
      return { success: false, error: 'Este horário não está aberto para agendamento.' };
    }

    if (slot.vagasRestantes <= 0) {
      return { success: false, error: 'Não há mais vagas disponíveis neste horário.' };
    }

    /* 3) Impede duplicidade (mesmo usuário, equipamento, data, hora) */
    const agendamentos = Storage.getAgendamentos
      ? Storage.getAgendamentos()
      : [];

    const duplicado = agendamentos.find(
      (a) =>
        a.usuario_id === usuarioId &&
        a.equipamento_id === dados.equipamento_id &&
        a.data === dados.data &&
        a.hora === dados.hora &&
        a.status !== 'cancelado'
    );

    if (duplicado) {
      return {
        success: false,
        error: 'Você já possui um agendamento para este equipamento, data e horário.'
      };
    }

    /* 4) Gera ID e senha */
    const id = Utils.generateId ? Utils.generateId() : _gerarIdFallback();

    /* Busca a sigla do equipamento para compor a senha */
    const equipamento = getEquipamentoById(dados.equipamento_id);
    const secretaria = equipamento
      ? getSecretariaById(equipamento.secretaria_id)
      : null;
    const sigla = secretaria ? secretaria.sigla : 'AGD';

    /* Senha sequencial por equipamento por dia */
    let senhaNumero;
    if (Storage.getSenhaSequencial) {
      senhaNumero = Storage.getSenhaSequencial(dados.equipamento_id, dados.data);
    } else {
      /* Fallback: conta agendamentos existentes */
      const countHoje = agendamentos.filter(
        (a) =>
          a.equipamento_id === dados.equipamento_id &&
          a.data === dados.data &&
          a.status !== 'cancelado'
      ).length;
      senhaNumero = countHoje + 1;
    }

    const senha = sigla + '-' + String(senhaNumero).padStart(3, '0');

    /* Código de validação virtual — chave única que o cidadão
       apresenta e o equipamento valida no balcão (modelo Vapt Vupt). */
    const codigoValidacao = _gerarCodigoValidacao();

    /* Incrementa contador de senha */
    if (Storage.incrementSenha) {
      Storage.incrementSenha(dados.equipamento_id, dados.data);
    }

    /* 5) Monta o objeto de agendamento */
    const agoraIso = new Date().toISOString();
    const agendamento = {
      id: id,
      usuario_id: usuarioId,
      usuario_nome: usuario.nome || '',
      usuario_cpf: usuario.cpf || '',
      equipamento_id: dados.equipamento_id,
      servico_id: dados.servico_id,
      data: dados.data,
      hora: dados.hora,
      senha: senha,
      codigo_validacao: codigoValidacao,
      validado: false,
      status: 'confirmado',
      observacoes: dados.observacoes || '',
      historico: [
        {
          status: 'confirmado',
          titulo: 'Agendamento criado',
          detalhe: 'Senha virtual emitida para o cidadão.',
          em: agoraIso,
          por: 'cidadao'
        }
      ],
      criado_em: agoraIso,
      atualizado_em: agoraIso
    };

    /* Salva */
    agendamentos.push(agendamento);
    if (Storage.saveAgendamentos) {
      Storage.saveAgendamentos(agendamentos);
    }

    return { success: true, agendamento: agendamento };
  }

  /* ==========================================================
     CANCELAMENTO DE AGENDAMENTO
     ========================================================== */

  /**
   * Cancela um agendamento existente, alterando seu status
   * para 'cancelado'.
   *
   * @param {string} agendamentoId - ID do agendamento.
   * @returns {{success: boolean, error?: string}}
   *   Resultado da operação.
   */
  function cancelarAgendamento(agendamentoId) {
    const agendamentos = Storage.getAgendamentos
      ? Storage.getAgendamentos()
      : [];

    const agendamento = agendamentos.find((a) => a.id === agendamentoId);

    if (!agendamento) {
      return { success: false, error: 'Agendamento não encontrado.' };
    }

    if (agendamento.status === 'cancelado') {
      return { success: false, error: 'Este agendamento já está cancelado.' };
    }

    agendamento.status = 'cancelado';
    agendamento.atualizado_em = new Date().toISOString();
    _registrarHistorico(
      agendamento,
      'cancelado',
      'Agendamento cancelado',
      'Cancelamento solicitado pelo cidadão.',
      'cidadao'
    );

    if (Storage.saveAgendamentos) {
      Storage.saveAgendamentos(agendamentos);
    }

    return { success: true };
  }

  /* ==========================================================
     CONSULTAS DE AGENDAMENTOS
     ========================================================== */

  /**
   * Retorna todos os agendamentos de um usuário, com dados
   * populados (nomes da secretaria, equipamento e serviço).
   *
   * @param {string} usuarioId - ID do usuário.
   * @returns {Array<Object>} Agendamentos enriquecidos.
   */
  function getAgendamentosUsuario(usuarioId) {
    const agendamentos = Storage.getAgendamentos
      ? Storage.getAgendamentos()
      : [];

    return agendamentos
      .filter((a) => a.usuario_id === usuarioId)
      .map((a) => _popularAgendamento(a))
      .sort((a, b) => {
        /* Ordena: mais recentes primeiro */
        const dataA = a.data + ' ' + a.hora;
        const dataB = b.data + ' ' + b.hora;
        return dataB.localeCompare(dataA);
      });
  }

  /**
   * Retorna os agendamentos de um equipamento em uma data
   * específica.
   *
   * @param {string} equipamentoId - ID do equipamento.
   * @param {string} data - Data no formato 'YYYY-MM-DD'.
   * @returns {Array<Object>} Agendamentos do equipamento na data.
   */
  function getAgendamentosEquipamento(equipamentoId, data) {
    const agendamentos = Storage.getAgendamentos
      ? Storage.getAgendamentos()
      : [];

    return agendamentos
      .filter(
        (a) =>
          a.equipamento_id === equipamentoId &&
          a.data === data
      )
      .map((a) => _popularAgendamento(a))
      .sort((a, b) => a.hora.localeCompare(b.hora));
  }

  /**
   * Retorna um único agendamento pelo ID, com todos os dados
   * relacionados (secretaria, equipamento, serviço).
   *
   * @param {string} id - ID do agendamento.
   * @returns {Object|null} Agendamento populado ou null.
   */
  function getAgendamentoById(id) {
    const agendamentos = Storage.getAgendamentos
      ? Storage.getAgendamentos()
      : [];

    const agendamento = agendamentos.find((a) => a.id === id);
    if (!agendamento) return null;

    return _popularAgendamento(agendamento);
  }

  /* ==========================================================
     PESQUISA NPS
     ========================================================== */

  /**
   * Registra a pesquisa NPS após a conclusão do atendimento.
   * @param {string} agendamentoId - ID do agendamento.
   * @param {number|string} nota - Nota de 0 a 10.
   * @param {string} comentario - Comentário opcional.
   * @returns {{success: boolean, agendamento?: Object, error?: string}}
   */
  function responderNps(agendamentoId, nota, comentario) {
    const agendamentos = Storage.getAgendamentos
      ? Storage.getAgendamentos()
      : [];
    const agendamento = agendamentos.find((a) => a.id === agendamentoId);

    if (!agendamento) {
      return { success: false, error: 'Agendamento não encontrado.' };
    }

    if (agendamento.status !== 'atendido') {
      return { success: false, error: 'A pesquisa NPS só fica disponível após o atendimento ser concluído.' };
    }

    const notaNumero = Number(nota);
    if (!Number.isInteger(notaNumero) || notaNumero < 0 || notaNumero > 10) {
      return { success: false, error: 'Selecione uma nota de 0 a 10.' };
    }

    const tipo = notaNumero >= 9 ? 'promotor' : notaNumero >= 7 ? 'neutro' : 'detrator';
    agendamento.nps = {
      nota: notaNumero,
      tipo: tipo,
      comentario: (comentario || '').trim(),
      respondido_em: new Date().toISOString()
    };
    agendamento.atualizado_em = new Date().toISOString();
    _registrarHistorico(
      agendamento,
      'nps',
      'Pesquisa NPS respondida',
      `Nota ${notaNumero}/10 (${tipo}).`,
      'cidadao'
    );

    if (Storage.saveAgendamentos) {
      Storage.saveAgendamentos(agendamentos);
    }

    return { success: true, agendamento: _popularAgendamento(agendamento) };
  }

  /* ==========================================================
     FUNÇÕES AUXILIARES (privadas)
     ========================================================== */

  /**
   * Enriquece um objeto de agendamento com dados de secretaria,
   * equipamento e serviço.
   *
   * @private
   * @param {Object} agendamento - Agendamento cru.
   * @returns {Object} Agendamento com campos adicionais populados.
   */
  function _popularAgendamento(agendamento) {
    const equipamento = getEquipamentoById(agendamento.equipamento_id);
    const servico = getServicoById(agendamento.servico_id);
    const secretaria = equipamento
      ? getSecretariaById(equipamento.secretaria_id)
      : null;

    return Object.assign({}, agendamento, {
      equipamento_nome: equipamento ? equipamento.nome : 'Equipamento não encontrado',
      equipamento_tipo: equipamento ? equipamento.tipo : '',
      equipamento_endereco: equipamento ? equipamento.endereco : '',
      servico_nome: servico ? servico.nome : 'Serviço não encontrado',
      servico_duracao: servico ? servico.duracao : 30,
      secretaria_nome: secretaria ? secretaria.nome : 'Secretaria não encontrada',
      secretaria_sigla: secretaria ? secretaria.sigla : '',
      secretaria_cor: secretaria ? secretaria.cor : '#718096',
      desfecho: _obterDesfecho(agendamento)
    });
  }

  function _obterDesfecho(agendamento) {
    const mapa = {
      confirmado: 'Aguardando atendimento',
      chamado: 'Presença validada / em atendimento',
      atendido: 'Atendimento concluído',
      cancelado: 'Cancelado',
      nao_compareceu: 'Não compareceu'
    };
    return mapa[agendamento.status] || agendamento.status || 'Sem desfecho';
  }

  function _registrarHistorico(agendamento, status, titulo, detalhe, por) {
    if (!agendamento.historico) agendamento.historico = [];
    agendamento.historico.push({
      status: status,
      titulo: titulo,
      detalhe: detalhe || '',
      em: new Date().toISOString(),
      por: por || 'sistema'
    });
  }

  /**
   * Formata um objeto Date em string 'YYYY-MM-DD'.
   *
   * @private
   * @param {Date} date - Objeto Date.
   * @returns {string} Data formatada.
   */
  function _formatarDataISO(date) {
    const ano = date.getFullYear();
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const dia = String(date.getDate()).padStart(2, '0');
    return ano + '-' + mes + '-' + dia;
  }

  /**
   * Gera um ID único simples (fallback caso Utils.generateId
   * não esteja disponível).
   *
   * @private
   * @returns {string} ID no formato 'agd-XXXXXXXXXX'.
   */
  function _gerarIdFallback() {
    return 'agd-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
  }

  /**
   * Gera um código de validação virtual de 6 caracteres (A-Z, 2-9),
   * evitando caracteres ambíguos (0/O, 1/I). É a "senha virtual"
   * apresentada pelo cidadão e validada no equipamento.
   * @private
   * @returns {string} Código no formato 'ABC-XYZ'.
   */
  function _gerarCodigoValidacao() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code.slice(0, 3) + '-' + code.slice(3);
  }

  /* ==========================================================
     VALIDAÇÃO NO EQUIPAMENTO (modelo Vapt Vupt)
     ========================================================== */

  /**
   * Localiza um agendamento pelo código de validação virtual.
   * @param {string} codigo - Código apresentado pelo cidadão.
   * @returns {Object|null} Agendamento populado ou null.
   */
  function getAgendamentoByCodigo(codigo) {
    if (!codigo) return null;
    const alvo = codigo.trim().toUpperCase().replace(/\s/g, '');
    const agendamentos = Storage.getAgendamentos ? Storage.getAgendamentos() : [];
    const ag = agendamentos.find(
      (a) => (a.codigo_validacao || '').toUpperCase() === alvo
    );
    return ag ? _popularAgendamento(ag) : null;
  }

  /**
   * Valida (faz o check-in de) um agendamento no equipamento.
   * O operador informa o código virtual do cidadão. Regras:
   *   - Código deve existir;
   *   - Deve pertencer ao equipamento informado (isolamento);
   *   - Não pode estar cancelado nem já validado.
   *
   * @param {string} codigo - Código de validação virtual.
   * @param {string} equipamentoId - Equipamento do operador logado.
   * @returns {{success: boolean, agendamento?: Object, error?: string}}
   */
  function validarCodigo(codigo, equipamentoId) {
    const agendamentos = Storage.getAgendamentos ? Storage.getAgendamentos() : [];
    const alvo = (codigo || '').trim().toUpperCase().replace(/\s/g, '');

    if (!alvo) {
      return { success: false, error: 'Informe o código de validação do cidadão.' };
    }

    const ag = agendamentos.find(
      (a) => (a.codigo_validacao || '').toUpperCase() === alvo
    );

    if (!ag) {
      return { success: false, error: 'Código não encontrado. Verifique os caracteres.' };
    }

    if (equipamentoId && ag.equipamento_id !== equipamentoId) {
      return { success: false, error: 'Este código pertence a outro equipamento público.' };
    }

    if (ag.status === 'cancelado') {
      return { success: false, error: 'Este agendamento foi cancelado pelo cidadão.' };
    }

    if (ag.validado) {
      return { success: false, error: 'Este código já foi validado anteriormente.', agendamento: _popularAgendamento(ag) };
    }

    ag.validado = true;
    ag.validado_em = new Date().toISOString();
    ag.status = 'chamado';
    ag.atualizado_em = new Date().toISOString();
    _registrarHistorico(
      ag,
      'chamado',
      'Presença validada',
      'Código virtual conferido no equipamento público.',
      'gestor'
    );

    if (Storage.saveAgendamentos) {
      Storage.saveAgendamentos(agendamentos);
    }

    return { success: true, agendamento: _popularAgendamento(ag) };
  }

  /* ==========================================================
     API PÚBLICA
     ========================================================== */
  return {
    /* Consultas de secretarias */
    getSecretarias: getSecretarias,
    getSecretariaById: getSecretariaById,

    /* Consultas de equipamentos */
    getEquipamentosBySecretaria: getEquipamentosBySecretaria,
    getEquipamentoById: getEquipamentoById,

    /* Consultas de serviços */
    getServicosByEquipamento: getServicosByEquipamento,
    getServicoById: getServicoById,

    /* Disponibilidade */
    getDatasDisponiveis: getDatasDisponiveis,
    getHorariosDisponiveis: getHorariosDisponiveis,

    /* Operações de agendamento */
    criarAgendamento: criarAgendamento,
    cancelarAgendamento: cancelarAgendamento,
    responderNps: responderNps,

    /* Validação no equipamento (Vapt Vupt) */
    getAgendamentoByCodigo: getAgendamentoByCodigo,
    validarCodigo: validarCodigo,

    /* Consultas de agendamentos */
    getAgendamentosUsuario: getAgendamentosUsuario,
    getAgendamentosEquipamento: getAgendamentosEquipamento,
    getAgendamentoById: getAgendamentoById
  };
})();
