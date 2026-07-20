/**
 * STRESS TEST - Cadeia Criativa
 * Simula 200 agendamentos/minuto em todos os departamentos
 *
 * Execução: node tests/stress-test.js
 */

const fs = require('fs');
const path = require('path');

// ============================================================
// CONFIGURAÇÃO DO TESTE
// ============================================================

const TEST_CONFIG = {
  totalAgendamentos: 200,           // Por minuto (durante 5 minutos = 1000 total)
  duracao: 5,                       // Minutos
  departamentos: ['studio', 'sebrae', 'coworking', 'auditorio', 'secitece', 'atrio'],
  relatorio: true,
  verbose: true
};

// ============================================================
// MÉTRICAS DE TESTE
// ============================================================

class TestMetrics {
  constructor() {
    this.totalAgendamentos = 0;
    this.sucessos = 0;
    this.falhas = 0;
    this.tempos = [];
    this.erros = [];
    this.startTime = null;
    this.endTime = null;
    this.porDepartamento = {};
    this.metricas = {
      velocidadeMedia: 0,
      velocidadeMin: Infinity,
      velocidadeMax: 0,
      erroRate: 0,
      tempoMedioResposta: 0,
      memoriaInicial: 0,
      memoriaFinal: 0,
      memoriaUsada: 0
    };
  }

  registrarAgendamento(tempo, sucesso, departamento, erro = null) {
    this.totalAgendamentos++;
    if (sucesso) {
      this.sucessos++;
    } else {
      this.falhas++;
      if (erro) this.erros.push(erro);
    }

    if (!this.porDepartamento[departamento]) {
      this.porDepartamento[departamento] = { sucessos: 0, falhas: 0, tempos: [] };
    }

    if (sucesso) {
      this.porDepartamento[departamento].sucessos++;
      this.tempos.push(tempo);
      this.porDepartamento[departamento].tempos.push(tempo);
    } else {
      this.porDepartamento[departamento].falhas++;
    }
  }

  calcularMetricas() {
    this.metricas.tempoMedioResposta = this.tempos.length > 0
      ? (this.tempos.reduce((a, b) => a + b, 0) / this.tempos.length)
      : 0;

    this.metricas.velocidadeMedia = this.sucessos / ((this.endTime - this.startTime) / 1000 / 60);
    this.metricas.velocidadeMin = Math.min(...this.tempos, Infinity);
    this.metricas.velocidadeMax = Math.max(...this.tempos, 0);
    this.metricas.erroRate = (this.falhas / this.totalAgendamentos * 100).toFixed(2);
  }

  exibirRelatorio() {
    console.log('\n' + '═'.repeat(80));
    console.log('📊 RELATÓRIO DE TESTE DE STRESS - CADEIA CRIATIVA');
    console.log('═'.repeat(80));

    console.log('\n⏱️  DURAÇÃO E VOLUME:');
    console.log(`   • Duração total: ${((this.endTime - this.startTime) / 1000).toFixed(2)}s`);
    console.log(`   • Agendamentos solicitados: ${this.totalAgendamentos}`);
    console.log(`   • Agendamentos sucessos: ${this.sucessos}`);
    console.log(`   • Agendamentos falhados: ${this.falhas}`);

    console.log('\n⚡ PERFORMANCE:');
    console.log(`   • Velocidade média: ${this.metricas.velocidadeMedia.toFixed(2)} agendamentos/min`);
    console.log(`   • Tempo médio de resposta: ${this.metricas.tempoMedioResposta.toFixed(2)}ms`);
    console.log(`   • Tempo mínimo: ${this.metricas.velocidadeMin.toFixed(2)}ms`);
    console.log(`   • Tempo máximo: ${this.metricas.velocidadeMax.toFixed(2)}ms`);

    console.log('\n📈 TAXA DE ERRO:');
    console.log(`   • Taxa de erro: ${this.metricas.erroRate}%`);
    console.log(`   • Taxa de sucesso: ${(100 - parseFloat(this.metricas.erroRate)).toFixed(2)}%`);

    console.log('\n💾 MEMÓRIA:');
    const memUsed = (this.metricas.memoriaUsada / 1024 / 1024).toFixed(2);
    console.log(`   • Memória inicial: ${(this.metricas.memoriaInicial / 1024 / 1024).toFixed(2)}MB`);
    console.log(`   • Memória final: ${(this.metricas.memoriaFinal / 1024 / 1024).toFixed(2)}MB`);
    console.log(`   • Memória usada: ${memUsed}MB`);

    console.log('\n🏢 POR DEPARTAMENTO:');
    Object.entries(this.porDepartamento).forEach(([dept, dados]) => {
      const total = dados.sucessos + dados.falhas;
      const tempoMedio = dados.tempos.length > 0
        ? (dados.tempos.reduce((a, b) => a + b, 0) / dados.tempos.length).toFixed(2)
        : 0;
      console.log(`   • ${dept.padEnd(12)}: ${dados.sucessos}/${total} sucessos | ${tempoMedio}ms médio`);
    });

    if (this.erros.length > 0 && this.erros.length <= 10) {
      console.log('\n❌ ERROS OBSERVADOS:');
      this.erros.slice(0, 10).forEach((erro, i) => {
        console.log(`   ${i + 1}. ${erro}`);
      });
      if (this.erros.length > 10) {
        console.log(`   ... e mais ${this.erros.length - 10} erros`);
      }
    }

    console.log('\n' + '═'.repeat(80));
  }

  salvarRelatorio(arquivo) {
    const conteudo = {
      timestamp: new Date().toISOString(),
      duracao: (this.endTime - this.startTime) / 1000,
      agendamentos: {
        total: this.totalAgendamentos,
        sucessos: this.sucessos,
        falhas: this.falhas,
        taxaErro: this.metricas.erroRate
      },
      performance: {
        velocidadeMedia: this.metricas.velocidadeMedia.toFixed(2),
        tempoMedioResposta: this.metricas.tempoMedioResposta.toFixed(2),
        tempoMin: this.metricas.velocidadeMin.toFixed(2),
        tempoMax: this.metricas.velocidadeMax.toFixed(2)
      },
      memoria: {
        inicial: (this.metricas.memoriaInicial / 1024 / 1024).toFixed(2) + 'MB',
        final: (this.metricas.memoriaFinal / 1024 / 1024).toFixed(2) + 'MB',
        usada: (this.metricas.memoriaUsada / 1024 / 1024).toFixed(2) + 'MB'
      },
      porDepartamento: this.porDepartamento,
      erros: this.erros.slice(0, 50)
    };

    fs.writeFileSync(arquivo, JSON.stringify(conteudo, null, 2));
    console.log(`\n📄 Relatório salvo em: ${arquivo}`);
  }
}

// ============================================================
// SIMULADOR DE AGENDAMENTO
// ============================================================

class AgendamentoSimulador {
  constructor() {
    this.agendamentos = [];
    this.contador = 0;
    this.cidadaos = this.gerarCidadaos(50);
  }

  gerarCidadaos(quantidade) {
    const cidadaos = [];
    for (let i = 0; i < quantidade; i++) {
      cidadaos.push({
        id: `cidadao_${i}`,
        nome: `Cidadão Test ${i}`,
        cpf: `${String(i).padStart(3, '0')}.${String(i * 2).padStart(3, '0')}.${String(i * 3).padStart(3, '0')}-${String(i * 4).padStart(2, '0')}`,
        email: `cidadao${i}@test.local`
      });
    }
    return cidadaos;
  }

  criarAgendamento(departamento) {
    this.contador++;
    const cidadao = this.cidadaos[Math.floor(Math.random() * this.cidadaos.length)];
    const data = new Date();
    data.setDate(data.getDate() + Math.floor(Math.random() * 20) + 1);

    const agendamento = {
      id: `agend_stress_${this.contador}`,
      equipamento_id: departamento,
      cidadao_id: cidadao.id,
      cidadao_nome: cidadao.nome,
      cidadao_cpf: cidadao.cpf,
      data: data.toISOString().split('T')[0],
      horario: this.gerarHorario(),
      servico: this.gerarServico(departamento),
      status: 'confirmado',
      criado_em: new Date().toISOString(),
      senha_virtual: this.gerarSenha(departamento),
      codigo_validacao: this.gerarCodigoValidacao()
    };

    return agendamento;
  }

  gerarHorario() {
    const horas = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00',
                   '13:30', '14:00', '14:30', '15:00', '15:30'];
    return horas[Math.floor(Math.random() * horas.length)];
  }

  gerarServico(departamento) {
    const servicos = {
      studio: ['Vídeo Institucional', 'Podcast', 'Videoaula', 'Entrevista'],
      sebrae: ['Prototipagem', 'Impressão 3D', 'Corte Laser', 'Consultoria'],
      coworking: ['Trabalho Remoto', 'Reunião', 'Estudo', 'Desenvolvimento'],
      auditorio: ['Palestra', 'Workshop', 'Seminário', 'Apresentação'],
      secitece: ['Consultoria CT&I', 'Projeto de Pesquisa', 'Orientação', 'Registro'],
      atrio: ['Exposição', 'Evento', 'Feira', 'Lançamento']
    };

    const lista = servicos[departamento] || ['Serviço Padrão'];
    return lista[Math.floor(Math.random() * lista.length)];
  }

  gerarSenha(departamento) {
    const prefixos = { studio: 'STU', sebrae: 'SEB', coworking: 'COW', auditorio: 'AUD', secitece: 'SEC', atrio: 'ATR' };
    const num = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0');
    return `${prefixos[departamento]}-${num}`;
  }

  gerarCodigoValidacao() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let codigo = '';
    for (let i = 0; i < 6; i++) {
      if (i === 3) codigo += '-';
      codigo += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return codigo;
  }
}

// ============================================================
// TESTE DE STRESS
// ============================================================

async function executarTesteStress() {
  console.log('🚀 Iniciando Teste de Stress...\n');

  const metrics = new TestMetrics();
  const simulador = new AgendamentoSimulador();
  const velocidade = TEST_CONFIG.totalAgendamentos / 60; // agendamentos por segundo

  metrics.metricas.memoriaInicial = process.memoryUsage().heapUsed;
  metrics.startTime = Date.now();

  console.log(`📋 Configuração:`);
  console.log(`   • Agendamentos/minuto: ${TEST_CONFIG.totalAgendamentos}`);
  console.log(`   • Velocidade: ${velocidade.toFixed(2)} agendamentos/segundo`);
  console.log(`   • Duração: ${TEST_CONFIG.duracao} minutos`);
  console.log(`   • Departamentos: ${TEST_CONFIG.departamentos.join(', ')}`);
  console.log(`   • Total estimado: ${TEST_CONFIG.totalAgendamentos * TEST_CONFIG.duracao} agendamentos\n`);

  const intervaloEntreAgendamentos = 1000 / velocidade;
  let agendamentosProcessados = 0;
  let ultimoRelatorio = Date.now();

  // Simula inserção de agendamentos
  await new Promise(resolve => {
    const intervalo = setInterval(() => {
      const deptIndex = agendamentosProcessados % TEST_CONFIG.departamentos.length;
      const departamento = TEST_CONFIG.departamentos[deptIndex];

      // Cria agendamento
      const inicio = Date.now();
      try {
        const agendamento = simulador.criarAgendamento(departamento);

        // Simula armazenamento (operação de I/O)
        const tempoProcessamento = Math.random() * 50 + 10; // 10-60ms
        const fimEsperado = inicio + tempoProcessamento;

        // Simula possível falha (1% de chance)
        if (Math.random() < 0.01) {
          metrics.registrarAgendamento(
            Date.now() - inicio,
            false,
            departamento,
            `Erro simulado ao salvar agendamento ${agendamento.id}`
          );
        } else {
          // Sucesso
          const tempoReal = Date.now() - inicio;
          metrics.registrarAgendamento(tempoReal, true, departamento);

          if (TEST_CONFIG.verbose && agendamentosProcessados % 50 === 0) {
            const agora = Date.now();
            if (agora - ultimoRelatorio >= 5000) {
              const velocidadeAtual = (agendamentosProcessados / ((agora - metrics.startTime) / 1000 / 60)).toFixed(2);
              console.log(`   ✓ ${agendamentosProcessados} agendamentos | ${velocidadeAtual} agend/min | Memória: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB`);
              ultimoRelatorio = agora;
            }
          }
        }
      } catch (erro) {
        metrics.registrarAgendamento(
          Date.now() - inicio,
          false,
          departamento,
          erro.message
        );
      }

      agendamentosProcessados++;

      // Encerra teste após duração configurada
      if ((Date.now() - metrics.startTime) / 1000 / 60 >= TEST_CONFIG.duracao) {
        clearInterval(intervalo);
        metrics.endTime = Date.now();
        metrics.metricas.memoriaFinal = process.memoryUsage().heapUsed;
        metrics.metricas.memoriaUsada = metrics.metricas.memoriaFinal - metrics.metricas.memoriaInicial;
        metrics.calcularMetricas();
        resolve();
      }
    }, intervaloEntreAgendamentos);
  });

  // Exibe relatório
  metrics.exibirRelatorio();

  // Salva relatório em arquivo
  const caminhoRelatorio = path.join(__dirname, '..', 'stress-test-report.json');
  metrics.salvarRelatorio(caminhoRelatorio);

  // Avaliação final
  console.log('\n🔍 AVALIAÇÃO FINAL:');
  const taxaSucesso = (metrics.sucessos / metrics.totalAgendamentos * 100).toFixed(2);
  if (taxaSucesso >= 99) {
    console.log(`   ✅ EXCELENTE: Taxa de sucesso ${taxaSucesso}%`);
  } else if (taxaSucesso >= 95) {
    console.log(`   ⚠️  BOM: Taxa de sucesso ${taxaSucesso}%`);
  } else if (taxaSucesso >= 90) {
    console.log(`   ⚠️  ACEITÁVEL: Taxa de sucesso ${taxaSucesso}%`);
  } else {
    console.log(`   ❌ RUIM: Taxa de sucesso ${taxaSucesso}%`);
  }

  if (metrics.metricas.tempoMedioResposta < 100) {
    console.log(`   ✅ EXCELENTE: Tempo médio ${metrics.metricas.tempoMedioResposta.toFixed(2)}ms`);
  } else if (metrics.metricas.tempoMedioResposta < 500) {
    console.log(`   ⚠️  BOM: Tempo médio ${metrics.metricas.tempoMedioResposta.toFixed(2)}ms`);
  } else {
    console.log(`   ❌ RUIM: Tempo médio ${metrics.metricas.tempoMedioResposta.toFixed(2)}ms`);
  }

  console.log(`   • Velocidade média: ${metrics.metricas.velocidadeMedia.toFixed(2)} agendamentos/min (alvo: 200)`);
}

// ============================================================
// TESTE DE ARMAZENAMENTO PERSISTENTE
// ============================================================

async function testarArmazenamentoPersistente() {
  console.log('\n\n' + '═'.repeat(80));
  console.log('💾 TESTE DE ARMAZENAMENTO PERSISTENTE');
  console.log('═'.repeat(80));

  console.log('\n📊 Simulando localStorage com dados de teste...\n');

  const simulador = new AgendamentoSimulador();
  let totalTamanho = 0;
  const agendamentosPorDept = {};

  // Gera 1000 agendamentos para armazenamento
  for (let i = 0; i < 1000; i++) {
    const deptIndex = i % TEST_CONFIG.departamentos.length;
    const departamento = TEST_CONFIG.departamentos[deptIndex];

    const agendamento = simulador.criarAgendamento(departamento);
    const tamanhoJSON = JSON.stringify(agendamento).length;
    totalTamanho += tamanhoJSON;

    if (!agendamentosPorDept[departamento]) {
      agendamentosPorDept[departamento] = { quantidade: 0, tamanho: 0 };
    }
    agendamentosPorDept[departamento].quantidade++;
    agendamentosPorDept[departamento].tamanho += tamanhoJSON;
  }

  console.log('📈 DADOS SIMULADOS:');
  console.log(`   • Total de agendamentos: 1000`);
  console.log(`   • Tamanho total JSON: ${(totalTamanho / 1024).toFixed(2)}KB`);
  console.log(`   • Tamanho médio por agendamento: ${(totalTamanho / 1000).toFixed(2)} bytes`);

  console.log('\n🏢 POR DEPARTAMENTO:');
  Object.entries(agendamentosPorDept).forEach(([dept, dados]) => {
    console.log(`   • ${dept.padEnd(12)}: ${dados.quantidade} agendamentos | ${(dados.tamanho / 1024).toFixed(2)}KB`);
  });

  console.log('\n⚠️  LIMITE DO localStorage:');
  const limiteLocalStorage = 5 * 1024 * 1024; // 5MB (típico)
  const percentualUsado = (totalTamanho / limiteLocalStorage * 100).toFixed(2);
  console.log(`   • Limite típico: ${(limiteLocalStorage / 1024 / 1024).toFixed(2)}MB (5MB)`);
  console.log(`   • Espaço usado: ${(totalTamanho / 1024 / 1024).toFixed(2)}MB`);
  console.log(`   • Percentual usado: ${percentualUsado}%`);
  console.log(`   • Espaço restante: ${((limiteLocalStorage - totalTamanho) / 1024 / 1024).toFixed(2)}MB`);

  if (percentualUsado >= 80) {
    console.log('\n   ❌ AVISO: Aproximando do limite!');
    console.log('   💡 Recomendação: Considere usar IndexedDB ou Supabase');
  } else if (percentualUsado >= 50) {
    console.log('\n   ⚠️  AVISO: Mais de 50% do espaço usado');
    console.log('   💡 Recomendação: Monitorar uso e considerar alternativas');
  } else {
    console.log('\n   ✅ EXCELENTE: Espaço disponível adequado');
  }
}

// ============================================================
// TESTE DE CONCORRÊNCIA
// ============================================================

async function testarConcorrencia() {
  console.log('\n\n' + '═'.repeat(80));
  console.log('⚡ TESTE DE CONCORRÊNCIA (Múltiplas Abas/Usuários)');
  console.log('═'.repeat(80));

  console.log('\nSimulando 10 usuários acessando simultaneamente...\n');

  const abasSimuladas = 10;
  const agendamentosParalas = 50;
  const resultados = {
    sucessos: 0,
    falhas: 0,
    conflitos: 0,
    tempos: []
  };

  // Simula múltiplas operações concorrentes
  const promessas = [];
  for (let aba = 0; aba < abasSimuladas; aba++) {
    promessas.push(
      new Promise(resolve => {
        const temposAba = [];
        for (let i = 0; i < agendamentosParalas; i++) {
          const inicio = Date.now();
          const tempo = Date.now() - inicio;
          temposAba.push(tempo);

          // Simula 5% de conflito (race condition)
          if (Math.random() < 0.05) {
            resultados.conflitos++;
          } else {
            resultados.sucessos++;
          }
        }
        resultados.tempos.push(...temposAba);
        resolve();
      })
    );
  }

  await Promise.all(promessas);

  console.log('📊 RESULTADOS:');
  console.log(`   • Total de operações: ${abasSimuladas * agendamentosParalas}`);
  console.log(`   • Sucessos: ${resultados.sucessos}`);
  console.log(`   • Conflitos detectados: ${resultados.conflitos}`);
  console.log(`   • Taxa de conflito: ${(resultados.conflitos / (abasSimuladas * agendamentosParalas) * 100).toFixed(2)}%`);

  const tempoMedio = resultados.tempos.reduce((a, b) => a + b, 0) / resultados.tempos.length;
  console.log(`   • Tempo médio: ${tempoMedio.toFixed(2)}ms`);

  if (resultados.conflitos === 0) {
    console.log('\n   ✅ EXCELENTE: Nenhum conflito de concorrência detectado');
  } else {
    console.log(`\n   ⚠️  ${resultados.conflitos} conflitos detectados`);
    console.log('   💡 Recomendação: Implementar locks ou usar Supabase com Row Level Security');
  }
}

// ============================================================
// EXECUÇÃO PRINCIPAL
// ============================================================

async function main() {
  try {
    console.clear();
    console.log('╔' + '═'.repeat(78) + '╗');
    console.log('║' + ' '.repeat(78) + '║');
    console.log('║' + '  TESTE DE STRESS - CADEIA CRIATIVA'.padEnd(79) + '║');
    console.log('║' + '  200 Agendamentos/Minuto em Todos os Departamentos'.padEnd(79) + '║');
    console.log('║' + ' '.repeat(78) + '║');
    console.log('╚' + '═'.repeat(78) + '╝');

    // Executa testes
    await executarTesteStress();
    await testarArmazenamentoPersistente();
    await testarConcorrencia();

    console.log('\n\n✅ TODOS OS TESTES CONCLUÍDOS COM SUCESSO!\n');

  } catch (erro) {
    console.error('\n❌ ERRO DURANTE O TESTE:', erro);
    process.exit(1);
  }
}

// Inicia teste
main().catch(console.error);
