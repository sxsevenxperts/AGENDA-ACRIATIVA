/* ============================================================
   AGENDA SOBRAL — Módulo de Administração (Admin)
   Gerencia configurações de equipamentos, abertura/fechamento
   de slots, fila de senhas, gestão de serviços, dashboard
   de estatísticas e exportação de dados.
   ============================================================ */

/**
 * @global
 * @namespace Admin
 * @description Módulo administrativo do sistema Agenda Sobral.
 *   Permite que operadores e administradores configurem
 *   equipamentos, abram/fechem horários, gerenciem a fila de
 *   atendimento e acompanhem estatísticas em tempo real.
 */
const Admin = (() => {
  'use strict';

  /* ==========================================================
     CONFIGURAÇÃO DE EQUIPAMENTO
     ========================================================== */

  /**
   * Retorna a configuração completa de um equipamento.
   * Se não houver configuração salva, retorna um objeto com
   * valores padrão baseados em SobralData.config.
   *
   * @param {string} equipamentoId - ID do equipamento.
   * @returns {Object} Configuração do equipamento contendo:
   *   - dias_disponiveis {number[]} Dias da semana (0-6)
   *   - horario_inicio {string} Horário de início ('HH:MM')
   *   - horario_fim {string} Horário de fim ('HH:MM')
   *   - intervalo {number} Intervalo entre slots em minutos
   *   - slots_por_horario {number} Vagas por slot
   *   - slots_abertos {Object} Mapa data → horários abertos
   *   - servicos_config {Object} Configurações por serviço
   */
  function getEquipamentoConfig(equipamentoId) {
    const config = Storage.getEquipamentoConfig
      ? Storage.getEquipamentoConfig(equipamentoId)
      : null;

    if (config) return config;

    /* Retorna configuração padrão */
    return {
      equipamento_id: equipamentoId,
      dias_disponiveis: SobralData.config.horarioFuncionamentoPadrao.diasSemana || [1, 2, 3, 4, 5],
      horario_inicio: SobralData.config.horarioFuncionamentoPadrao.inicio || '08:00',
      horario_fim: SobralData.config.horarioFuncionamentoPadrao.fim || '14:00',
      intervalo: 30,
      slots_por_horario: SobralData.config.maxAgendamentosPorSlot || 10,
      slots_abertos: {},
      servicos_config: {},
      senha_atual: {},
      fila: {}
    };
  }

  /**
   * Salva a configuração de um equipamento.
   *
   * @param {string} equipamentoId - ID do equipamento.
   * @param {Object} config - Objeto de configuração.
   * @param {number[]} config.dias_disponiveis - Dias da semana permitidos.
   * @param {string} config.horario_inicio - Horário de início.
   * @param {string} config.horario_fim - Horário de fim.
   * @param {number} config.intervalo - Intervalo em minutos.
   * @param {number} config.slots_por_horario - Vagas por horário.
   * @returns {{success: boolean, error?: string}}
   */
  function salvarConfigEquipamento(equipamentoId, config) {
    try {
      /* Preserva dados existentes que não foram passados */
      const atual = getEquipamentoConfig(equipamentoId);
      const novaConfig = Object.assign({}, atual, config, {
        equipamento_id: equipamentoId,
        atualizado_em: new Date().toISOString()
      });

      if (Storage.saveEquipamentoConfig) {
        Storage.saveEquipamentoConfig(equipamentoId, novaConfig);
      }

      return { success: true };
    } catch (erro) {
      return { success: false, error: 'Erro ao salvar configuração: ' + erro.message };
    }
  }

  /* ==========================================================
     GERENCIAMENTO DE SLOTS
     ========================================================== */

  /**
   * Abre horários específicos para agendamento em uma data.
   *
   * @param {string} equipamentoId - ID do equipamento.
   * @param {string} data - Data no formato 'YYYY-MM-DD'.
   * @param {string[]} horarios - Lista de horários ('HH:MM').
   * @returns {{success: boolean, slotsAbertos: number, error?: string}}
   */
  function abrirSlots(equipamentoId, data, horarios) {
    if (!data || !horarios || horarios.length === 0) {
      return { success: false, error: 'Data e horários são obrigatórios.' };
    }

    const config = getEquipamentoConfig(equipamentoId);

    /* Inicializa o mapa de slots abertos */
    if (!config.slots_abertos) {
      config.slots_abertos = {};
    }

    /* Mescla com horários já abertos (sem duplicar) */
    const existentes = config.slots_abertos[data] || [];
    const novosSet = new Set(existentes);
    horarios.forEach((h) => novosSet.add(h));

    config.slots_abertos[data] = Array.from(novosSet).sort();

    if (Storage.saveEquipamentoConfig) {
      Storage.saveEquipamentoConfig(equipamentoId, config);
    }

    return {
      success: true,
      slotsAbertos: config.slots_abertos[data].length
    };
  }

  /**
   * Fecha um slot específico. Só permite fechar se não houver
   * agendamentos confirmados para aquele horário.
   *
   * @param {string} equipamentoId - ID do equipamento.
   * @param {string} data - Data ('YYYY-MM-DD').
   * @param {string} hora - Horário ('HH:MM').
   * @returns {{success: boolean, error?: string}}
   */
  function fecharSlot(equipamentoId, data, hora) {
    /* Verifica se há agendamentos confirmados nesse slot */
    const agendamentos = Storage.getAgendamentos
      ? Storage.getAgendamentos()
      : [];

    const temAgendamento = agendamentos.some(
      (a) =>
        a.equipamento_id === equipamentoId &&
        a.data === data &&
        a.hora === hora &&
        a.status !== 'cancelado'
    );

    if (temAgendamento) {
      return {
        success: false,
        error: 'Não é possível fechar este horário: há agendamentos confirmados.'
      };
    }

    const config = getEquipamentoConfig(equipamentoId);

    if (!config.slots_abertos || !config.slots_abertos[data]) {
      return { success: false, error: 'Nenhum slot aberto nesta data.' };
    }

    config.slots_abertos[data] = config.slots_abertos[data].filter(
      (h) => h !== hora
    );

    /* Remove a entrada da data se ficou vazia */
    if (config.slots_abertos[data].length === 0) {
      delete config.slots_abertos[data];
    }

    if (Storage.saveEquipamentoConfig) {
      Storage.saveEquipamentoConfig(equipamentoId, config);
    }

    return { success: true };
  }

  /**
   * Abre todos os slots configurados para um dia inteiro,
   * gerando horários a partir do intervalo configurado entre
   * horario_inicio e horario_fim.
   *
   * @param {string} equipamentoId - ID do equipamento.
   * @param {string} data - Data ('YYYY-MM-DD').
   * @returns {{success: boolean, slotsAbertos: number, horarios: string[], error?: string}}
   */
  function abrirDiaCompleto(equipamentoId, data) {
    if (!data) {
      return { success: false, error: 'Data é obrigatória.' };
    }

    const config = getEquipamentoConfig(equipamentoId);

    const inicio = config.horario_inicio || '08:00';
    const fim = config.horario_fim || '14:00';
    const intervalo = config.intervalo || 30;

    /* Gera todos os horários do período */
    const horarios = _gerarHorarios(inicio, fim, intervalo);

    if (horarios.length === 0) {
      return { success: false, error: 'Não foi possível gerar horários com a configuração atual.' };
    }

    return abrirSlots(equipamentoId, data, horarios);
  }

  /**
   * Fecha todos os slots de um dia que NÃO possuem agendamentos
   * confirmados.
   *
   * @param {string} equipamentoId - ID do equipamento.
   * @param {string} data - Data ('YYYY-MM-DD').
   * @returns {{success: boolean, slotsFechados: number, slotsPreservados: number}}
   */
  function fecharDia(equipamentoId, data) {
    const config = getEquipamentoConfig(equipamentoId);

    if (!config.slots_abertos || !config.slots_abertos[data]) {
      return { success: true, slotsFechados: 0, slotsPreservados: 0 };
    }

    const agendamentos = Storage.getAgendamentos
      ? Storage.getAgendamentos()
      : [];

    /* Identifica quais horários têm agendamentos */
    const horariosComAgendamento = new Set();
    agendamentos.forEach((a) => {
      if (
        a.equipamento_id === equipamentoId &&
        a.data === data &&
        a.status !== 'cancelado'
      ) {
        horariosComAgendamento.add(a.hora);
      }
    });

    const slotsOriginais = config.slots_abertos[data].length;

    /* Preserva apenas os que têm agendamento */
    config.slots_abertos[data] = config.slots_abertos[data].filter(
      (h) => horariosComAgendamento.has(h)
    );

    const slotsPreservados = config.slots_abertos[data].length;
    const slotsFechados = slotsOriginais - slotsPreservados;

    if (config.slots_abertos[data].length === 0) {
      delete config.slots_abertos[data];
    }

    if (Storage.saveEquipamentoConfig) {
      Storage.saveEquipamentoConfig(equipamentoId, config);
    }

    return {
      success: true,
      slotsFechados: slotsFechados,
      slotsPreservados: slotsPreservados
    };
  }

  /* ==========================================================
     CONFIGURAÇÃO DE SERVIÇOS
     ========================================================== */

  /**
   * Retorna a configuração específica de um serviço dentro de
   * um equipamento.
   *
   * @param {string} equipamentoId - ID do equipamento.
   * @param {string} servicoId - ID do serviço.
   * @returns {Object} Configuração do serviço contendo:
   *   - ativo {boolean} Se o serviço está ativo
   *   - documentos_necessarios {string[]} Documentos exigidos
   *   - observacoes {string} Instruções adicionais
   *   - duracao_customizada {number|null} Duração personalizada em minutos
   */
  function getServicoConfig(equipamentoId, servicoId) {
    const config = getEquipamentoConfig(equipamentoId);
    const servicosConfig = config.servicos_config || {};

    return servicosConfig[servicoId] || {
      ativo: true,
      documentos_necessarios: [],
      observacoes: '',
      duracao_customizada: null
    };
  }

  /**
   * Salva a configuração de um serviço para um equipamento
   * específico.
   *
   * @param {string} equipamentoId - ID do equipamento.
   * @param {string} servicoId - ID do serviço.
   * @param {Object} configServico - Configuração do serviço.
   * @param {boolean} [configServico.ativo] - Se o serviço está ativo.
   * @param {string[]} [configServico.documentos_necessarios] - Documentos.
   * @param {string} [configServico.observacoes] - Observações/instruções.
   * @param {number|null} [configServico.duracao_customizada] - Duração customizada.
   * @returns {{success: boolean, error?: string}}
   */
  function salvarServicoConfig(equipamentoId, servicoId, configServico) {
    try {
      const config = getEquipamentoConfig(equipamentoId);

      if (!config.servicos_config) {
        config.servicos_config = {};
      }

      config.servicos_config[servicoId] = Object.assign(
        {},
        config.servicos_config[servicoId] || {},
        configServico,
        { atualizado_em: new Date().toISOString() }
      );

      if (Storage.saveEquipamentoConfig) {
        Storage.saveEquipamentoConfig(equipamentoId, config);
      }

      return { success: true };
    } catch (erro) {
      return { success: false, error: 'Erro ao salvar configuração do serviço: ' + erro.message };
    }
  }

  /* ==========================================================
     SISTEMA DE SENHAS / FILA DE ATENDIMENTO
     ========================================================== */

  /**
   * Chama a próxima senha na fila de atendimento de hoje.
   *
   * Lógica:
   *   1. Obtém agendamentos de hoje para o equipamento;
   *   2. Filtra apenas os com status 'confirmado' (aguardando);
   *   3. Ordena por horário;
   *   4. Marca o primeiro como 'chamado';
   *   5. Registra a senha atual na config do equipamento.
   *
   * @param {string} equipamentoId - ID do equipamento.
   * @returns {{senha: string, agendamento: Object, usuario: Object}|null}
   *   Dados da próxima senha chamada ou null se não houver.
   */
  function chamarProximaSenha(equipamentoId) {
    const hoje = _dataHoje();
    const agendamentos = Storage.getAgendamentos
      ? Storage.getAgendamentos()
      : [];

    /* Agendamentos de hoje, ordenados por horário */
    const filaHoje = agendamentos
      .filter(
        (a) =>
          a.equipamento_id === equipamentoId &&
          a.data === hoje &&
          a.status === 'confirmado'
      )
      .sort((a, b) => a.hora.localeCompare(b.hora));

    if (filaHoje.length === 0) return null;

    /* Pega o primeiro da fila */
    const proximo = filaHoje[0];
    proximo.status = 'chamado';
    proximo.chamado_em = new Date().toISOString();
    proximo.atualizado_em = new Date().toISOString();

    if (Storage.saveAgendamentos) {
      Storage.saveAgendamentos(agendamentos);
    }

    /* Atualiza a senha atual na configuração */
    const config = getEquipamentoConfig(equipamentoId);
    if (!config.senha_atual) config.senha_atual = {};
    config.senha_atual[hoje] = {
      senha: proximo.senha,
      agendamento_id: proximo.id,
      chamado_em: proximo.chamado_em
    };

    if (Storage.saveEquipamentoConfig) {
      Storage.saveEquipamentoConfig(equipamentoId, config);
    }

    return {
      senha: proximo.senha,
      agendamento: proximo,
      usuario: { id: proximo.usuario_id }
    };
  }

  /**
   * Retorna a senha atualmente chamada para um equipamento.
   *
   * @param {string} equipamentoId - ID do equipamento.
   * @returns {{senha: string, agendamento_id: string, chamado_em: string}|null}
   */
  function getSenhaAtual(equipamentoId) {
    const hoje = _dataHoje();
    const config = getEquipamentoConfig(equipamentoId);

    if (config.senha_atual && config.senha_atual[hoje]) {
      return config.senha_atual[hoje];
    }

    return null;
  }

  /**
   * Retorna a fila de atendimento de hoje para um equipamento,
   * ordenada por horário.
   *
   * @param {string} equipamentoId - ID do equipamento.
   * @returns {Array<{agendamento: Object, hora: string, senha: string,
   *   nomeUsuario: string, servico: string, status: string}>}
   *   Itens da fila com status:
   *   - 'aguardando' (confirmado)
   *   - 'chamado'
   *   - 'atendido'
   *   - 'nao_compareceu'
   */
  function getFilaHoje(equipamentoId) {
    const hoje = _dataHoje();
    const agendamentos = Storage.getAgendamentos
      ? Storage.getAgendamentos()
      : [];

    return agendamentos
      .filter(
        (a) =>
          a.equipamento_id === equipamentoId &&
          a.data === hoje &&
          a.status !== 'cancelado'
      )
      .sort((a, b) => a.hora.localeCompare(b.hora))
      .map((a) => {
        const servico = Scheduling.getServicoById
          ? Scheduling.getServicoById(a.servico_id)
          : null;

        /* Mapeia status interno para label da fila */
        let statusFila;
        switch (a.status) {
          case 'confirmado':
            statusFila = 'aguardando';
            break;
          case 'chamado':
            statusFila = 'chamado';
            break;
          case 'atendido':
            statusFila = 'atendido';
            break;
          case 'nao_compareceu':
            statusFila = 'nao_compareceu';
            break;
          default:
            statusFila = a.status;
        }

        return {
          agendamento: a,
          hora: a.hora,
          senha: a.senha || '---',
          nomeUsuario: a.usuario_nome || a.usuario_id || 'Não identificado',
          servico: servico ? servico.nome : 'Serviço não encontrado',
          status: statusFila
        };
      });
  }

  /* ==========================================================
     MARCAÇÃO DE ATENDIMENTO
     ========================================================== */

  /**
   * Marca um agendamento como atendido.
   *
   * @param {string} agendamentoId - ID do agendamento.
   * @returns {{success: boolean, error?: string}}
   */
  function marcarAtendido(agendamentoId) {
    return _alterarStatusAgendamento(agendamentoId, 'atendido');
  }

  /**
   * Marca um agendamento como não compareceu.
   *
   * @param {string} agendamentoId - ID do agendamento.
   * @returns {{success: boolean, error?: string}}
   */
  function marcarNaoCompareceu(agendamentoId) {
    return _alterarStatusAgendamento(agendamentoId, 'nao_compareceu');
  }

  /* ==========================================================
     DASHBOARD / ESTATÍSTICAS
     ========================================================== */

  /**
   * Retorna estatísticas do painel administrativo para um
   * equipamento.
   *
   * @param {string} equipamentoId - ID do equipamento.
   * @returns {Object} Estatísticas contendo:
   *   - agendamentosHoje {number} Total de agendamentos hoje
   *   - atendidosHoje {number} Marcados como atendidos
   *   - canceladosHoje {number} Cancelados
   *   - naoCompareceuHoje {number} Não compareceram
   *   - taxaOcupacao {number} Percentual de ocupação (0-100)
   *   - proximosAgendamentos {Array} Próximos 5 agendamentos
   *   - servicosMaisProcurados {Array} Top 5 serviços
   */
  function getDashboardStats(equipamentoId) {
    const hoje = _dataHoje();
    const agendamentos = Storage.getAgendamentos
      ? Storage.getAgendamentos()
      : [];

    /* Filtra agendamentos de hoje */
    const agHoje = agendamentos.filter(
      (a) => a.equipamento_id === equipamentoId && a.data === hoje
    );

    const atendidos = agHoje.filter((a) => a.status === 'atendido').length;
    const cancelados = agHoje.filter((a) => a.status === 'cancelado').length;
    const naoCompareceu = agHoje.filter((a) => a.status === 'nao_compareceu').length;
    const totalHoje = agHoje.length;

    /* Taxa de ocupação: agendamentos não-cancelados / vagas totais */
    const config = getEquipamentoConfig(equipamentoId);
    const slotsAbertosHoje = (config.slots_abertos && config.slots_abertos[hoje])
      ? config.slots_abertos[hoje].length
      : 0;
    const slotsPorHorario = config.slots_por_horario
      || SobralData.config.maxAgendamentosPorSlot
      || 10;
    const totalVagas = slotsAbertosHoje * slotsPorHorario;

    const agendamentosAtivos = agHoje.filter((a) => a.status !== 'cancelado').length;
    const taxaOcupacao = totalVagas > 0
      ? Math.round((agendamentosAtivos / totalVagas) * 100)
      : 0;

    /* Próximos agendamentos (futuros, ordenados por data/hora) */
    const agora = new Date();
    const proximosAgendamentos = agendamentos
      .filter(
        (a) =>
          a.equipamento_id === equipamentoId &&
          a.status === 'confirmado' &&
          new Date(a.data + 'T' + a.hora) >= agora
      )
      .sort((a, b) => {
        const dA = a.data + ' ' + a.hora;
        const dB = b.data + ' ' + b.hora;
        return dA.localeCompare(dB);
      })
      .slice(0, 5)
      .map((a) => {
        const servico = Scheduling.getServicoById
          ? Scheduling.getServicoById(a.servico_id)
          : null;
        return Object.assign({}, a, {
          servico_nome: servico ? servico.nome : 'N/A'
        });
      });

    /* Serviços mais procurados (últimos 30 dias) */
    const trintaDiasAtras = new Date();
    trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);
    const dataLimite = _formatarDataISO(trintaDiasAtras);

    const contadorServicos = {};
    agendamentos
      .filter(
        (a) =>
          a.equipamento_id === equipamentoId &&
          a.data >= dataLimite &&
          a.status !== 'cancelado'
      )
      .forEach((a) => {
        contadorServicos[a.servico_id] = (contadorServicos[a.servico_id] || 0) + 1;
      });

    const servicosMaisProcurados = Object.keys(contadorServicos)
      .map((servicoId) => {
        const servico = Scheduling.getServicoById
          ? Scheduling.getServicoById(servicoId)
          : null;
        return {
          servico_id: servicoId,
          nome: servico ? servico.nome : 'Serviço desconhecido',
          quantidade: contadorServicos[servicoId]
        };
      })
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 5);

    return {
      agendamentosHoje: totalHoje,
      atendidosHoje: atendidos,
      canceladosHoje: cancelados,
      naoCompareceuHoje: naoCompareceu,
      taxaOcupacao: taxaOcupacao,
      proximosAgendamentos: proximosAgendamentos,
      servicosMaisProcurados: servicosMaisProcurados
    };
  }

  /* ==========================================================
     EXPORTAÇÃO CSV
     ========================================================== */

  /**
   * Gera uma string CSV dos agendamentos de um equipamento
   * em um período.
   *
   * @param {string} equipamentoId - ID do equipamento.
   * @param {string} dataInicio - Data inicial ('YYYY-MM-DD').
   * @param {string} dataFim - Data final ('YYYY-MM-DD').
   * @returns {string} Conteúdo CSV pronto para download.
   */
  function exportarCSV(equipamentoId, dataInicio, dataFim) {
    const agendamentos = Storage.getAgendamentos
      ? Storage.getAgendamentos()
      : [];

    /* Filtra pelo período e equipamento */
    const filtrados = agendamentos
      .filter(
        (a) =>
          a.equipamento_id === equipamentoId &&
          a.data >= dataInicio &&
          a.data <= dataFim
      )
      .sort((a, b) => {
        const dA = a.data + ' ' + a.hora;
        const dB = b.data + ' ' + b.hora;
        return dA.localeCompare(dB);
      });

    /* Cabeçalho */
    const colunas = [
      'ID',
      'Data',
      'Horário',
      'Senha',
      'Serviço',
      'Usuário',
      'Status',
      'Observações',
      'Criado em'
    ];

    const linhas = [colunas.join(';')];

    filtrados.forEach((a) => {
      const servico = Scheduling.getServicoById
        ? Scheduling.getServicoById(a.servico_id)
        : null;

      const linha = [
        a.id,
        a.data,
        a.hora,
        a.senha || '',
        servico ? servico.nome : a.servico_id,
        a.usuario_nome || a.usuario_id || '',
        _traduzirStatus(a.status),
        _escaparCSV(a.observacoes || ''),
        a.criado_em || ''
      ];

      linhas.push(linha.join(';'));
    });

    return linhas.join('\n');
  }

  /* ==========================================================
     GESTÃO DE SERVIÇOS (CRUD)
     ========================================================== */

  /**
   * Adiciona um novo serviço vinculado a um equipamento.
   *
   * @param {string} equipamentoId - ID do equipamento.
   * @param {Object} servico - Dados do serviço.
   * @param {string} servico.nome - Nome do serviço.
   * @param {number} servico.duracao - Duração em minutos.
   * @param {string} [servico.descricao] - Descrição do serviço.
   * @returns {{success: boolean, servico?: Object, error?: string}}
   */
  function adicionarServico(equipamentoId, servico) {
    if (!servico.nome) {
      return { success: false, error: 'O nome do serviço é obrigatório.' };
    }

    const novoServico = {
      id: Utils.generateId ? Utils.generateId() : _gerarIdFallback(),
      equipamento_id: equipamentoId,
      nome: servico.nome,
      duracao: servico.duracao || 30,
      descricao: servico.descricao || '',
      criado_em: new Date().toISOString()
    };

    /* Salva na lista de serviços */
    const servicos = Storage.getServicos ? Storage.getServicos() : [];
    servicos.push(novoServico);

    if (Storage.saveServicos) {
      Storage.saveServicos(servicos);
    }

    return { success: true, servico: novoServico };
  }

  /**
   * Edita um serviço existente.
   *
   * @param {string} servicoId - ID do serviço.
   * @param {Object} dados - Campos a atualizar.
   * @param {string} [dados.nome] - Novo nome.
   * @param {number} [dados.duracao] - Nova duração.
   * @param {string} [dados.descricao] - Nova descrição.
   * @returns {{success: boolean, servico?: Object, error?: string}}
   */
  function editarServico(servicoId, dados) {
    const servicos = Storage.getServicos ? Storage.getServicos() : [];
    const servico = servicos.find((s) => s.id === servicoId);

    if (!servico) {
      return { success: false, error: 'Serviço não encontrado.' };
    }

    /* Atualiza apenas os campos fornecidos */
    if (dados.nome !== undefined) servico.nome = dados.nome;
    if (dados.duracao !== undefined) servico.duracao = dados.duracao;
    if (dados.descricao !== undefined) servico.descricao = dados.descricao;
    servico.atualizado_em = new Date().toISOString();

    if (Storage.saveServicos) {
      Storage.saveServicos(servicos);
    }

    return { success: true, servico: servico };
  }

  /**
   * Desativa um serviço (remoção lógica). O serviço permanece
   * no banco de dados mas é marcado como inativo na configuração
   * do equipamento correspondente.
   *
   * @param {string} servicoId - ID do serviço.
   * @returns {{success: boolean, error?: string}}
   */
  function removerServico(servicoId) {
    /* Localiza o serviço para descobrir o equipamento */
    const servicos = Storage.getServicos ? Storage.getServicos() : [];
    let servico = servicos.find((s) => s.id === servicoId);

    /* Fallback para SobralData */
    if (!servico) {
      servico = (SobralData.servicos || []).find((s) => s.id === servicoId);
    }

    if (!servico) {
      return { success: false, error: 'Serviço não encontrado.' };
    }

    /* Marca como inativo na config do equipamento */
    const resultado = salvarServicoConfig(
      servico.equipamento_id,
      servicoId,
      { ativo: false }
    );

    return resultado;
  }

  /* ==========================================================
     FUNÇÕES AUXILIARES (privadas)
     ========================================================== */

  /**
   * Altera o status de um agendamento.
   *
   * @private
   * @param {string} agendamentoId - ID do agendamento.
   * @param {string} novoStatus - Novo status.
   * @returns {{success: boolean, error?: string}}
   */
  function _alterarStatusAgendamento(agendamentoId, novoStatus) {
    const agendamentos = Storage.getAgendamentos
      ? Storage.getAgendamentos()
      : [];

    const agendamento = agendamentos.find((a) => a.id === agendamentoId);

    if (!agendamento) {
      return { success: false, error: 'Agendamento não encontrado.' };
    }

    agendamento.status = novoStatus;
    agendamento.atualizado_em = new Date().toISOString();

    if (novoStatus === 'atendido') {
      agendamento.atendido_em = new Date().toISOString();
    }

    if (Storage.saveAgendamentos) {
      Storage.saveAgendamentos(agendamentos);
    }

    return { success: true };
  }

  /**
   * Gera uma lista de horários entre início e fim com o
   * intervalo especificado.
   *
   * @private
   * @param {string} inicio - Horário de início ('HH:MM').
   * @param {string} fim - Horário de fim ('HH:MM').
   * @param {number} intervalo - Intervalo em minutos.
   * @returns {string[]} Lista de horários formatados.
   */
  function _gerarHorarios(inicio, fim, intervalo) {
    /* Usa Utils.generateTimeSlots se disponível */
    if (Utils.generateTimeSlots) {
      return Utils.generateTimeSlots(inicio, fim, intervalo);
    }

    /* Implementação própria como fallback */
    const horarios = [];
    const [hI, mI] = inicio.split(':').map(Number);
    const [hF, mF] = fim.split(':').map(Number);

    let minutos = hI * 60 + mI;
    const fimMinutos = hF * 60 + mF;

    while (minutos < fimMinutos) {
      const h = Math.floor(minutos / 60);
      const m = minutos % 60;
      horarios.push(
        String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0')
      );
      minutos += intervalo;
    }

    return horarios;
  }

  /**
   * Retorna a data de hoje no formato 'YYYY-MM-DD'.
   *
   * @private
   * @returns {string}
   */
  function _dataHoje() {
    return _formatarDataISO(new Date());
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
   * Traduz o status interno para um rótulo legível em
   * português.
   *
   * @private
   * @param {string} status - Status interno.
   * @returns {string} Rótulo traduzido.
   */
  function _traduzirStatus(status) {
    const mapa = {
      confirmado: 'Confirmado',
      chamado: 'Chamado',
      atendido: 'Atendido',
      cancelado: 'Cancelado',
      nao_compareceu: 'Não compareceu'
    };
    return mapa[status] || status;
  }

  /**
   * Escapa um valor para uso seguro em CSV (trata ponto-e-vírgula,
   * aspas e quebras de linha).
   *
   * @private
   * @param {string} valor - Valor a escapar.
   * @returns {string} Valor seguro para CSV.
   */
  function _escaparCSV(valor) {
    if (!valor) return '';
    if (valor.includes(';') || valor.includes('"') || valor.includes('\n')) {
      return '"' + valor.replace(/"/g, '""') + '"';
    }
    return valor;
  }

  /**
   * Gera um ID único simples (fallback caso Utils.generateId
   * não esteja disponível).
   *
   * @private
   * @returns {string} ID no formato 'svc-XXXXXXXXXX'.
   */
  function _gerarIdFallback() {
    return 'svc-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
  }

  /* ==========================================================
     API PÚBLICA
     ========================================================== */
  return {
    /* Configuração de equipamento */
    getEquipamentoConfig: getEquipamentoConfig,
    salvarConfigEquipamento: salvarConfigEquipamento,

    /* Gerenciamento de slots */
    abrirSlots: abrirSlots,
    fecharSlot: fecharSlot,
    abrirDiaCompleto: abrirDiaCompleto,
    fecharDia: fecharDia,

    /* Configuração de serviços */
    getServicoConfig: getServicoConfig,
    salvarServicoConfig: salvarServicoConfig,

    /* Sistema de senhas */
    chamarProximaSenha: chamarProximaSenha,
    getSenhaAtual: getSenhaAtual,
    getFilaHoje: getFilaHoje,

    /* Marcação de atendimento */
    marcarAtendido: marcarAtendido,
    marcarNaoCompareceu: marcarNaoCompareceu,

    /* Dashboard */
    getDashboardStats: getDashboardStats,

    /* Exportação */
    exportarCSV: exportarCSV,

    /* CRUD de serviços */
    adicionarServico: adicionarServico,
    editarServico: editarServico,
    removerServico: removerServico
  };
})();
