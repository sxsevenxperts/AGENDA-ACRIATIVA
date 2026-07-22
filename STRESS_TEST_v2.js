/**
 * STRESS TEST v2.14.0
 * Valida eliminação de race condition via RPC server-side
 *
 * Teste de capacidade: 100 usuarios simultâneos criando agendamentos
 * Esperado: todos bem-sucedidos, ZERO overflows
 *
 * Como usar:
 * 1. Fazer login como 'super' (Diretoria) no painel admin
 * 2. Abrir console (F12)
 * 3. Copiar/colar este arquivo ou executar: eval(fetch('stress-test-v2.js').then(r => r.text()))
 * 4. Chamar: await stressTestV2()
 */

async function stressTestV2() {
  console.clear();
  console.log('🚀 INICIANDO STRESS TEST v2.14.0 — Race Condition Elimination Validation');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const PHASE_START = Date.now();
  const DEPARTMENTS = ['musica', 'coworking', 'linklab', 'salatreinamento', 'atrio'];
  const TOTAL_USERS = 100;

  // Phase 1: Preparação
  console.log(`\n📋 FASE 1: Preparação`);
  console.log(`  • Total de usuários: ${TOTAL_USERS}`);
  console.log(`  • Distribuição: ~20 users por departamento`);
  console.log(`  • Data: ${new Date().toISOString().split('T')[0]}`);
  console.log(`  • Horário: 08:00 (pico de ocupação)`);
  console.log(`  • Capacidades: Coworking(70), Link Lab(120), Sala Treinamento(30), Átrio(150), Stúdio(10)`);

  // Phase 2: Simulação de 100 requisições simultâneas
  console.log(`\n🔄 FASE 2: Enviando ${TOTAL_USERS} agendamentos simultâneos...`);

  const promises = [];
  const userResults = [];

  const deptCapacities = {
    'musica': 10,
    'coworking': 70,
    'linklab': 120,
    'salatreinamento': 30,
    'atrio': 150
  };

  const deptDistribution = {};
  DEPARTMENTS.forEach(d => deptDistribution[d] = 0);

  const startTime = Date.now();

  for (let i = 0; i < TOTAL_USERS; i++) {
    const deptIdx = i % 5;
    const dept = DEPARTMENTS[deptIdx];
    deptDistribution[dept]++;

    const promise = (async () => {
      try {
        const result = await createAppointmentViaSupabase({
          departmentId: dept,
          date: new Date().toISOString().split('T')[0],
          time: '08:00',
          numParticipants: Math.floor(Math.random() * 3) + 1, // 1-3 pessoas
          citizenName: `StressTest User ${i}`,
          citizenEmail: `stresstest${i}@test.com`,
          citizenPhone: `85999999${String(i).padStart(3, '0')}`,
          formData: { test: true, stressTestId: i }
        });

        return {
          userId: i,
          dept,
          success: result.success,
          code: result.code,
          appointmentCode: result.appointmentCode,
          occupancy: result.occupancy,
          capacity: result.capacity,
          error: result.error,
          timestamp: Date.now()
        };
      } catch (e) {
        return {
          userId: i,
          dept,
          success: false,
          code: 'EXCEPTION',
          error: e.message,
          timestamp: Date.now()
        };
      }
    })();

    promises.push(promise);
  }

  // Aguardar todas as requisições (não Promise.race, aguarda todas)
  const responses = await Promise.all(promises);
  const elapsedTime = Date.now() - startTime;

  // Phase 3: Análise de resultados
  console.log(`\n📊 FASE 3: Análise de Resultados (${(elapsedTime / 1000).toFixed(2)}s)`);

  const stats = {
    total: TOTAL_USERS,
    successful: 0,
    failed: 0,
    slotFull: 0,
    exception: 0,
    byDept: {}
  };

  DEPARTMENTS.forEach(d => {
    stats.byDept[d] = {
      requests: deptDistribution[d],
      successful: 0,
      slotFull: 0,
      failed: 0,
      occupancy: 0,
      capacity: deptCapacities[d]
    };
  });

  let maxOccupancy = {};
  DEPARTMENTS.forEach(d => maxOccupancy[d] = 0);

  responses.forEach(r => {
    const deptStats = stats.byDept[r.dept];

    if (r.success) {
      stats.successful++;
      deptStats.successful++;
      if (r.occupancy) {
        deptStats.occupancy = Math.max(deptStats.occupancy, r.occupancy);
        maxOccupancy[r.dept] = Math.max(maxOccupancy[r.dept], r.occupancy);
      }
    } else if (r.code === 'SLOT_FULL') {
      stats.slotFull++;
      deptStats.slotFull++;
    } else {
      stats.failed++;
      deptStats.failed++;
      if (r.code === 'EXCEPTION') stats.exception++;
    }
  });

  // Print summary by department
  console.log(`\n  📍 Resultados por Departamento:`);
  DEPARTMENTS.forEach(dept => {
    const d = stats.byDept[dept];
    const percentage = ((d.successful / d.requests) * 100).toFixed(1);
    const occupancyPct = ((d.occupancy / d.capacity) * 100).toFixed(1);
    console.log(`    ${dept.toUpperCase().padEnd(16)} | Requisições: ${d.requests.toString().padStart(2)} | Sucesso: ${d.successful.toString().padStart(2)} (${percentage}%) | Cheio: ${d.slotFull.toString().padStart(2)} | Ocupação: ${d.occupancy}/${d.capacity} (${occupancyPct}%)`);
  });

  // Phase 4: Validação crítica
  console.log(`\n🔍 FASE 4: Validação Crítica`);

  let criticalFailures = [];
  DEPARTMENTS.forEach(dept => {
    const d = stats.byDept[dept];
    if (d.occupancy > d.capacity) {
      criticalFailures.push(`❌ OVERFLOW DETECTADO em ${dept}: ${d.occupancy}/${d.capacity} (EXCESSO: ${d.occupancy - d.capacity} pessoas)`);
    }
  });

  if (criticalFailures.length > 0) {
    console.log(`\n  ⚠️  FALHA CRÍTICA - Race condition NÃO foi eliminado!`);
    criticalFailures.forEach(f => console.log(`    ${f}`));
  } else {
    console.log(`  ✅ VALIDAÇÃO OK - Nenhum overflow detectado`);
    console.log(`  ✅ Race condition foi ELIMINADO com sucesso`);
    console.log(`  ✅ Capacidades foram respeitadas em TODOS os departamentos`);
  }

  // Phase 5: Estatísticas gerais
  console.log(`\n📈 FASE 5: Estatísticas Gerais`);
  console.log(`  • Total de requisições: ${stats.total}`);
  console.log(`  • Bem-sucedidas: ${stats.successful} (${((stats.successful / stats.total) * 100).toFixed(1)}%)`);
  console.log(`  • Rejeitadas (slot cheio): ${stats.slotFull}`);
  console.log(`  • Erros/Exceções: ${stats.failed}`);
  console.log(`  • Tempo total: ${(elapsedTime / 1000).toFixed(2)}s`);
  console.log(`  • Taxa: ${(TOTAL_USERS / (elapsedTime / 1000)).toFixed(1)} req/s`);

  // Phase 6: Veredicto
  console.log(`\n🎯 VEREDICTO FINAL`);
  const passRaceCondition = criticalFailures.length === 0;
  const passSuccessRate = stats.successful === stats.total;

  if (passRaceCondition && passSuccessRate) {
    console.log(`  ✅ TESTE BEM-SUCEDIDO`);
    console.log(`  ✅ v2.14.0 READY FOR PRODUCTION`);
    console.log(`  ✅ RPC create_appointment eliminó race condition`);
    console.log(`  ✅ 100% de sucesso, 0 overflows, capacidades respeitadas`);
  } else if (passRaceCondition && !passSuccessRate) {
    console.log(`  ⚠️  TESTE PARCIAL`);
    console.log(`  ✅ Race condition eliminado (0 overflows)`);
    console.log(`  ❌ ${stats.failed} requisições falharam (possivelmente Supabase indisponível)`);
  } else {
    console.log(`  ❌ TESTE FALHOU`);
    console.log(`  ❌ Race condition NÃO foi eliminado`);
    console.log(`  ❌ ${criticalFailures.length} departamento(s) com overflow`);
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📊 Relatório completo disponível em memory (variável: stressTestV2Result)`);

  // Armazenar resultado na memória para análise posterior
  window.stressTestV2Result = {
    timestamp: new Date().toISOString(),
    duration: elapsedTime,
    stats,
    criticalFailures,
    passRaceCondition,
    passSuccessRate,
    responses: responses.slice(0, 10) // Primeiras 10 respostas para debug
  };

  return window.stressTestV2Result;
}

// Export para uso em Node.js/scripts (se aplicável)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { stressTestV2 };
}
