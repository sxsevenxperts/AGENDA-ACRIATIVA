/**
 * ============================================================
 * AGENDA SOBRAL - Módulo de Analytics & Feedback
 * ============================================================
 * Gerencia coleta de dados: FAQs, avaliações, rastreamento
 * de atendimento e geração de relatórios estratégicos.
 *
 * Armazena em localStorage com fallback para Supabase.
 * ============================================================
 */

const Analytics = (() => {
  'use strict';

  const KEYS = {
    FAQS: 'sobral_faqs',
    DUVIDAS: 'sobral_duvidas',
    AVALIACOES: 'sobral_avaliacoes_servico',
    RASTREAMENTO: 'sobral_rastreamento_atendimento',
    MOTIVOS_CANCELAMENTO: 'sobral_motivos_cancelamento',
    BUSCAS: 'sobral_historico_buscas'
  };

  /* ══════════════════════════════════════════════════════════
     HISTÓRICO DE BUSCAS (assuntos pesquisados)
     ══════════════════════════════════════════════════════════ */

  function getBuscas() {
    return localStorage.getItem(KEYS.BUSCAS) ? JSON.parse(localStorage.getItem(KEYS.BUSCAS)) : [];
  }

  /**
   * Registra um termo buscado pelo cidadão (ou anônimo).
   * @param {Object} dados - { termo, usuario_id?, encontrou?, resultados? }
   */
  function registrarBusca(dados) {
    const termo = (dados && dados.termo ? String(dados.termo).trim() : '');
    if (!termo) return { success: false, error: 'Termo vazio.' };

    const buscas = getBuscas();
    buscas.push({
      id: 'busca_' + Date.now(),
      termo,
      termo_norm: termo.toLowerCase(),
      usuario_id: (dados && dados.usuario_id) || null,
      encontrou: (dados && typeof dados.encontrou === 'boolean') ? dados.encontrou : null,
      resultados: (dados && typeof dados.resultados === 'number') ? dados.resultados : null,
      buscado_em: new Date().toISOString()
    });
    // Mantém no máximo 500 registros globais para não crescer indefinidamente.
    const trimmed = buscas.slice(-500);
    localStorage.setItem(KEYS.BUSCAS, JSON.stringify(trimmed));
    return { success: true };
  }

  function getBuscasUsuario(usuario_id, limit = 50) {
    return getBuscas()
      .filter(b => b.usuario_id === usuario_id)
      .sort((a, b) => new Date(b.buscado_em) - new Date(a.buscado_em))
      .slice(0, limit);
  }

  /**
   * Ranking de assuntos mais buscados (para análise do departamento).
   * Opcionalmente filtra por termos que NÃO encontraram resultado.
   */
  function getRankingBuscas(limit = 20, apenasSemResultado = false) {
    const buscas = getBuscas().filter(b => !apenasSemResultado || b.encontrou === false);
    const contagem = {};
    buscas.forEach(b => {
      const key = b.termo_norm;
      if (!contagem[key]) contagem[key] = { termo: b.termo, total: 0, semResultado: 0 };
      contagem[key].total += 1;
      if (b.encontrou === false) contagem[key].semResultado += 1;
    });
    return Object.values(contagem)
      .sort((a, b) => b.total - a.total)
      .slice(0, limit)
      .map((c, idx) => ({ rank: idx + 1, ...c }));
  }

  /* ══════════════════════════════════════════════════════════
     FAQ (Dúvidas Comuns)
     ══════════════════════════════════════════════════════════ */

  function getFAQs() {
    return localStorage.getItem(KEYS.FAQS) ? JSON.parse(localStorage.getItem(KEYS.FAQS)) : [];
  }

  function getDuvidas() {
    return localStorage.getItem(KEYS.DUVIDAS) ? JSON.parse(localStorage.getItem(KEYS.DUVIDAS)) : [];
  }

  function criarDuvida(dados) {
    const { servico_id, titulo, descricao, email } = dados;

    if (!titulo || !descricao) {
      return { success: false, error: 'Título e descrição são obrigatórios.' };
    }

    const duvidas = getDuvidas();
    const novaDuvida = {
      id: 'duvida_' + Date.now(),
      servico_id,
      titulo,
      descricao,
      email,
      status: 'aberta',
      respostas: [],
      hits: 0,
      criada_em: new Date().toISOString()
    };

    duvidas.push(novaDuvida);
    localStorage.setItem(KEYS.DUVIDAS, JSON.stringify(duvidas));

    return { success: true, duvida_id: novaDuvida.id };
  }

  function registrarVisualizacaoDuvida(duvida_id) {
    const duvidas = getDuvidas();
    const duvida = duvidas.find(d => d.id === duvida_id);
    if (duvida) {
      duvida.hits += 1;
      duvida.ultima_visualizacao = new Date().toISOString();
      localStorage.setItem(KEYS.DUVIDAS, JSON.stringify(duvidas));
    }
  }

  function getRankingDuvidas(limit = 20) {
    return getDuvidas()
      .sort((a, b) => b.hits - a.hits)
      .slice(0, limit)
      .map((d, idx) => ({
        rank: idx + 1,
        titulo: d.titulo,
        hits: d.hits,
        status: d.status,
        duvida_id: d.id,
        servico_id: d.servico_id
      }));
  }

  function responderDuvida(duvida_id, resposta_texto) {
    const duvidas = getDuvidas();
    const duvida = duvidas.find(d => d.id === duvida_id);

    if (!duvida) return { success: false, error: 'Dúvida não encontrada.' };

    duvida.respostas.push({
      id: 'resp_' + Date.now(),
      texto: resposta_texto,
      respondida_em: new Date().toISOString(),
      respondida_por: 'admin' // TODO: pegar usuário logado
    });

    duvida.status = 'respondida';
    localStorage.setItem(KEYS.DUVIDAS, JSON.stringify(duvidas));

    return { success: true };
  }

  /* ══════════════════════════════════════════════════════════
     AVALIAÇÃO DE SERVIÇO (além de NPS)
     ══════════════════════════════════════════════════════════ */

  function avaliarServico(agendamento_id, dados) {
    const { score, atendimento_qualidade, tempo_espera, clareza_info, recomendaria, comentario } = dados;

    const avaliacoes = localStorage.getItem(KEYS.AVALIACOES)
      ? JSON.parse(localStorage.getItem(KEYS.AVALIACOES))
      : [];

    const novaAvaliacao = {
      id: 'aval_' + Date.now(),
      agendamento_id,
      score: Math.min(10, Math.max(0, parseInt(score) || 0)),
      atendimento_qualidade: parseInt(atendimento_qualidade) || 0, // 1-5
      tempo_espera: parseInt(tempo_espera) || 0, // 1-5
      clareza_info: parseInt(clareza_info) || 0, // 1-5
      recomendaria: recomendaria === true || recomendaria === 'true',
      comentario,
      criada_em: new Date().toISOString()
    };

    avaliacoes.push(novaAvaliacao);
    localStorage.setItem(KEYS.AVALIACOES, JSON.stringify(avaliacoes));

    return { success: true, avaliacao_id: novaAvaliacao.id };
  }

  function getAvaliacoesPorServico(servico_id) {
    const avaliacoes = localStorage.getItem(KEYS.AVALIACOES)
      ? JSON.parse(localStorage.getItem(KEYS.AVALIACOES))
      : [];

    const filtradas = avaliacoes.filter(a => {
      const agendamento = Storage.getAgendamentos ?
        Storage.getAgendamentos().find(ag => ag.id === a.agendamento_id) : null;
      return agendamento && agendamento.servico_id === servico_id;
    });

    if (!filtradas.length) return null;

    const media = (arr) => arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1) : 0;

    return {
      servico_id,
      total: filtradas.length,
      score_medio: media(filtradas.map(a => a.score)),
      atendimento_medio: media(filtradas.map(a => a.atendimento_qualidade)),
      tempo_espera_medio: media(filtradas.map(a => a.tempo_espera)),
      clareza_info_media: media(filtradas.map(a => a.clareza_info)),
      taxa_recomendacao: ((filtradas.filter(a => a.recomendaria).length / filtradas.length) * 100).toFixed(1) + '%',
      comentarios: filtradas.filter(a => a.comentario).map(a => a.comentario)
    };
  }

  /* ══════════════════════════════════════════════════════════
     RASTREAMENTO DE ATENDIMENTO (Timeline)
     ══════════════════════════════════════════════════════════ */

  function iniciarRastreamento(agendamento_id) {
    const rastreamento = localStorage.getItem(KEYS.RASTREAMENTO)
      ? JSON.parse(localStorage.getItem(KEYS.RASTREAMENTO))
      : [];

    const novo = {
      id: 'rastr_' + Date.now(),
      agendamento_id,
      entrada: new Date().toISOString(),
      chamada: null,
      conclusao: null,
      tempo_fila_minutos: null,
      tempo_atendimento_minutos: null,
      tempo_total_minutos: null
    };

    rastreamento.push(novo);
    localStorage.setItem(KEYS.RASTREAMENTO, JSON.stringify(rastreamento));

    return novo.id;
  }

  function registrarChamada(agendamento_id) {
    const rastreamento = localStorage.getItem(KEYS.RASTREAMENTO)
      ? JSON.parse(localStorage.getItem(KEYS.RASTREAMENTO))
      : [];

    const rastro = rastreamento.find(r => r.agendamento_id === agendamento_id && !r.conclusao);
    if (!rastro) return { success: false, error: 'Rastreamento não encontrado.' };

    rastro.chamada = new Date().toISOString();
    if (rastro.entrada) {
      const diff = new Date(rastro.chamada) - new Date(rastro.entrada);
      rastro.tempo_fila_minutos = Math.round(diff / 60000);
    }

    localStorage.setItem(KEYS.RASTREAMENTO, JSON.stringify(rastreamento));
    return { success: true };
  }

  function registrarConclusao(agendamento_id) {
    const rastreamento = localStorage.getItem(KEYS.RASTREAMENTO)
      ? JSON.parse(localStorage.getItem(KEYS.RASTREAMENTO))
      : [];

    const rastro = rastreamento.find(r => r.agendamento_id === agendamento_id);
    if (!rastro) return { success: false, error: 'Rastreamento não encontrado.' };

    rastro.conclusao = new Date().toISOString();

    if (rastro.chamada) {
      const diff = new Date(rastro.conclusao) - new Date(rastro.chamada);
      rastro.tempo_atendimento_minutos = Math.round(diff / 60000);
    }

    if (rastro.entrada) {
      const diff = new Date(rastro.conclusao) - new Date(rastro.entrada);
      rastro.tempo_total_minutos = Math.round(diff / 60000);
    }

    localStorage.setItem(KEYS.RASTREAMENTO, JSON.stringify(rastreamento));
    return { success: true };
  }

  function getRastreamento(agendamento_id) {
    const rastreamento = localStorage.getItem(KEYS.RASTREAMENTO)
      ? JSON.parse(localStorage.getItem(KEYS.RASTREAMENTO))
      : [];

    return rastreamento.find(r => r.agendamento_id === agendamento_id) || null;
  }

  /* ══════════════════════════════════════════════════════════
     MOTIVOS DE CANCELAMENTO
     ══════════════════════════════════════════════════════════ */

  function registrarCancelamento(agendamento_id, motivo) {
    const motivos = localStorage.getItem(KEYS.MOTIVOS_CANCELAMENTO)
      ? JSON.parse(localStorage.getItem(KEYS.MOTIVOS_CANCELAMENTO))
      : [];

    motivos.push({
      id: 'mot_' + Date.now(),
      agendamento_id,
      motivo,
      cancelado_em: new Date().toISOString()
    });

    localStorage.setItem(KEYS.MOTIVOS_CANCELAMENTO, JSON.stringify(motivos));
    return { success: true };
  }

  function getMotivosCancelamentoPorPeriodo(dataInicio, dataFim) {
    const motivos = localStorage.getItem(KEYS.MOTIVOS_CANCELAMENTO)
      ? JSON.parse(localStorage.getItem(KEYS.MOTIVOS_CANCELAMENTO))
      : [];

    const filtrados = motivos.filter(m => {
      const data = new Date(m.cancelado_em);
      return data >= new Date(dataInicio) && data <= new Date(dataFim);
    });

    const ranking = {};
    filtrados.forEach(m => {
      ranking[m.motivo] = (ranking[m.motivo] || 0) + 1;
    });

    return Object.entries(ranking)
      .map(([motivo, count]) => ({ motivo, count, percentual: ((count / filtrados.length) * 100).toFixed(1) }))
      .sort((a, b) => b.count - a.count);
  }

  /* ══════════════════════════════════════════════════════════
     RELATÓRIOS CONSOLIDADOS
     ══════════════════════════════════════════════════════════ */

  function getRelatorioAtendimento(equipamento_id, dataInicio, dataFim) {
    const agendamentos = Storage.getAgendamentos ? Storage.getAgendamentos() : [];
    const rastreamento = localStorage.getItem(KEYS.RASTREAMENTO)
      ? JSON.parse(localStorage.getItem(KEYS.RASTREAMENTO))
      : [];

    const filtrados = agendamentos.filter(a => {
      if (a.equipamento_id !== equipamento_id) return false;
      const data = new Date(a.data);
      return data >= new Date(dataInicio) && data <= new Date(dataFim);
    });

    const agendados = filtrados.filter(a => ['confirmado', 'agendado', 'chamado'].includes(a.status)).length;
    const atendidos = filtrados.filter(a => a.status === 'atendido').length;
    const cancelados = filtrados.filter(a => a.status === 'cancelado').length;
    const naoCompareceu = filtrados.filter(a => a.status === 'nao_compareceu').length;
    const validados = filtrados.filter(a => a.validado === true).length;

    const temposRastreamento = rastreamento
      .filter(r => filtrados.some(a => a.id === r.agendamento_id))
      .filter(r => r.tempo_fila_minutos && r.tempo_atendimento_minutos);

    const tempoMedioFila = temposRastreamento.length
      ? (temposRastreamento.reduce((sum, r) => sum + r.tempo_fila_minutos, 0) / temposRastreamento.length).toFixed(0)
      : 0;

    const tempoMedioAtendimento = temposRastreamento.length
      ? (temposRastreamento.reduce((sum, r) => sum + r.tempo_atendimento_minutos, 0) / temposRastreamento.length).toFixed(0)
      : 0;

    return {
      equipamento_id,
      periodo: { inicio: dataInicio, fim: dataFim },
      agendados,
      senhas_emitidas: filtrados.filter(a => a.status !== 'cancelado').length,
      validacoes: validados,
      atendimentos_concluidos: atendidos,
      taxa_comparecimento: filtrados.length ? ((atendidos / filtrados.length) * 100).toFixed(1) : 0,
      taxa_cancelamento: filtrados.length ? (((cancelados + naoCompareceu) / filtrados.length) * 100).toFixed(1) : 0,
      tempo_medio_fila_minutos: tempoMedioFila,
      tempo_medio_atendimento_minutos: tempoMedioAtendimento,
      total_atendimentos: filtrados.length
    };
  }

  function getRelatorioDepartamento(secretaria_id, dataInicio, dataFim) {
    const equipamentos = SobralData.equipamentos.filter(e => e.secretaria_id === secretaria_id);
    const equipIds = new Set(equipamentos.map(e => e.id));

    const agendamentos = Storage.getAgendamentos ? Storage.getAgendamentos() : [];
    const filtrados = agendamentos.filter(a => {
      if (!equipIds.has(a.equipamento_id)) return false;
      const data = new Date(a.data);
      return data >= new Date(dataInicio) && data <= new Date(dataFim);
    });

    const agendados = filtrados.filter(a => ['confirmado', 'agendado', 'chamado'].includes(a.status)).length;
    const atendidos = filtrados.filter(a => a.status === 'atendido').length;
    const cancelados = filtrados.filter(a => a.status === 'cancelado').length;
    const naoCompareceu = filtrados.filter(a => a.status === 'nao_compareceu').length;
    const validados = filtrados.filter(a => a.validado === true).length;

    const porEquipamento = equipamentos.map(eq => getRelatorioAtendimento(eq.id, dataInicio, dataFim));

    // Assuntos buscados no período (demanda) — as buscas são citywide (não por equipamento)
    const buscasPeriodo = getBuscas().filter(b => {
      const data = new Date(b.buscado_em);
      return data >= new Date(dataInicio) && data <= new Date(dataFim);
    });
    const buscasSemResultado = buscasPeriodo.filter(b => b.encontrou === false).length;

    return {
      secretaria_id,
      periodo: { inicio: dataInicio, fim: dataFim },
      total_agendamentos: filtrados.length,
      agendados,
      senhas_emitidas: filtrados.filter(a => a.status !== 'cancelado').length,
      validacoes: validados,
      atendimentos_concluidos: atendidos,
      resolvidos: atendidos,
      taxa_comparecimento: filtrados.length ? ((atendidos / filtrados.length) * 100).toFixed(1) : 0,
      taxa_cancelamento: filtrados.length ? (((cancelados + naoCompareceu) / filtrados.length) * 100).toFixed(1) : 0,
      assuntos_buscados: buscasPeriodo.length,
      buscas_sem_resultado: buscasSemResultado,
      top_buscas: getRankingBuscas(10),
      equipamentos: porEquipamento
    };
  }

  // Public API
  return {
    // FAQs
    getFAQs,
    getDuvidas,
    criarDuvida,
    registrarVisualizacaoDuvida,
    getRankingDuvidas,
    responderDuvida,

    // Avaliações
    avaliarServico,
    getAvaliacoesPorServico,

    // Rastreamento
    iniciarRastreamento,
    registrarChamada,
    registrarConclusao,
    getRastreamento,

    // Cancelamentos
    registrarCancelamento,
    getMotivosCancelamentoPorPeriodo,

    // Buscas
    registrarBusca,
    getBuscas,
    getBuscasUsuario,
    getRankingBuscas,

    // Relatórios
    getRelatorioAtendimento,
    getRelatorioDepartamento
  };
})();
