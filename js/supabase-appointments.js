/**
 * Integração Supabase — Agendamentos com Validação Server-Side
 * Versão: 2.14.0
 * Objetivo: Chamar RPC create_appointment() com validação de capacidade atômica
 */

// =====================================================================
// SUPABASE CLIENT INIT (já existe em index.html, referenciado aqui)
// =====================================================================

/**
 * Cria um novo agendamento via Supabase RPC
 * @param {Object} appointmentData - { departmentId, date, time, numParticipants, citizenName, citizenEmail, citizenPhone, citizenCpfCnpj, formData, lgpdAccepted, privacyAccepted, cookiesAccepted, consentId }
 * @returns {Promise<{success: boolean, appointmentId?: string, appointmentCode?: string, error?: string}>}
 */
async function createAppointmentViaSupabase(appointmentData) {
  if (!supabaseClient) {
    console.warn('Supabase não inicializado; fallback para localStorage');
    return { success: false, error: 'Supabase não disponível', fallbackToLocalStorage: true };
  }

  try {
    const result = await supabaseClient.rpc('create_appointment', {
      p_department_id: appointmentData.departmentId,
      p_appointment_date: appointmentData.date,
      p_appointment_time: appointmentData.time,
      p_num_participants: appointmentData.numParticipants,
      p_citizen_name: appointmentData.citizenName,
      p_citizen_email: appointmentData.citizenEmail,
      p_citizen_phone: appointmentData.citizenPhone || null,
      p_citizen_cpf_cnpj: appointmentData.citizenCpfCnpj || null,
      p_form_data: appointmentData.formData || {},
      p_lgpd_accepted: appointmentData.lgpdAccepted || false,
      p_privacy_accepted: appointmentData.privacyAccepted || false,
      p_cookies_accepted: appointmentData.cookiesAccepted || false,
      p_consent_id: appointmentData.consentId || null
    });

    if (result.error) {
      console.error('Erro RPC create_appointment:', result.error);
      return {
        success: false,
        error: result.error.message || 'Erro ao criar agendamento',
        code: result.error.code
      };
    }

    // RPC retorna jsonb com {success, appointment_id, appointment_code, occupancy, capacity, error}
    const rpcResponse = result.data;

    if (rpcResponse.success) {
      console.log('✅ Agendamento criado via Supabase:', rpcResponse.appointment_code);
      return {
        success: true,
        appointmentId: rpcResponse.appointment_id,
        appointmentCode: rpcResponse.appointment_code,
        occupancy: rpcResponse.occupancy,
        capacity: rpcResponse.capacity
      };
    } else {
      console.warn('❌ RPC retornou erro:', rpcResponse.error);
      return {
        success: false,
        error: rpcResponse.error,
        code: rpcResponse.code,
        occupancy: rpcResponse.occupancy,
        capacity: rpcResponse.capacity
      };
    }
  } catch (err) {
    console.error('Exceção ao chamar create_appointment RPC:', err);
    return {
      success: false,
      error: err.message || 'Erro de conexão',
      fallbackToLocalStorage: true
    };
  }
}

/**
 * Sincroniza agendamentos entre localStorage e Supabase
 * Estratégia: localStorage é cache local, Supabase é source-of-truth
 */
async function syncAppointmentsWithSupabase() {
  if (!supabaseClient) {
    console.log('Supabase não disponível; usando localStorage apenas');
    return;
  }

  try {
    // Buscar agendamentos recentes do Supabase
    const { data, error } = await supabaseClient
      .from('appointments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Erro ao sincronizar com Supabase:', error);
      return;
    }

    // Mesclar com localStorage (Supabase tem prioridade)
    let localAppointments = JSON.parse(localStorage.getItem('cadeia_appointments') || '[]');
    const remoteIds = new Set(data.map(a => a.id));

    // Remover appointments locais que foram deletados remotamente
    localAppointments = localAppointments.filter(a => !remoteIds.has(a.id));

    // Adicionar/atualizar remotes
    const mergedAppointments = [...localAppointments];
    data.forEach(remote => {
      const localIdx = mergedAppointments.findIndex(a => a.id === remote.id);
      if (localIdx >= 0) {
        mergedAppointments[localIdx] = { ...remote, synced: true };
      } else {
        mergedAppointments.push({ ...remote, synced: true });
      }
    });

    localStorage.setItem('cadeia_appointments', JSON.stringify(mergedAppointments));
    console.log(`✅ Sincronizados ${data.length} agendamentos com Supabase`);
  } catch (err) {
    console.error('Exceção na sincronização:', err);
  }
}

/**
 * Real-time listener para agendamentos (WebSocket via Supabase)
 * Atualiza a UI quando há mudanças em qualquer departamento
 */
function subscribeToAppointmentChanges(callback) {
  if (!supabaseClient) return;

  const channel = supabaseClient
    .channel('appointments_changes')
    .on('postgres_changes', { event: '*', schema: 'agenda_sobral', table: 'appointments' }, (payload) => {
      console.log('🔔 Mudança em tempo real:', payload);
      if (callback) callback(payload);
      // Atualizar localStorage
      syncAppointmentsWithSupabase();
    })
    .subscribe();

  return channel;
}

/**
 * Modificação de submitForm() original para usar create_appointment() RPC
 * Integrar no submitForm() existente (em index.html):
 *
 * if (supabaseClient) {
 *   const result = await createAppointmentViaSupabase({
 *     departmentId: currentDeptId,
 *     date: selectedDate,
 *     time: selectedTime,
 *     numParticipants: parseInt(formData['Quantas pessoas participarão desta sessão?']) || 1,
 *     citizenName: userSession?.name || 'Anônimo',
 *     citizenEmail: userSession?.email || formData['E-mail Pessoal'],
 *     citizenPhone: userSession?.phone || formData['Telefone/WhatsApp'],
 *     citizenCpfCnpj: formData['CPF/CNPJ'] || null,
 *     formData: formData,
 *     lgpdAccepted: document.getElementById('lgpd-terms').checked,
 *     privacyAccepted: document.getElementById('privacy-policy').checked,
 *     cookiesAccepted: document.getElementById('cookies-policy').checked
 *   });
 *
 *   if (result.success) {
 *     // Agendamento criado com sucesso
 *     appointmentId = result.appointmentId;
 *     appointmentCode = result.appointmentCode;
 *     showConfirmationModal(appointmentCode);
 *   } else if (result.code === 'SLOT_FULL') {
 *     alert(`Capacidade cheia: ${result.occupancy}/${result.capacity} pessoas`);
 *   } else {
 *     alert('Erro: ' + result.error);
 *     if (result.fallbackToLocalStorage) {
 *       // Fallback para localStorage (quando Supabase indisponível)
 *       createAppointmentLocally(formData);
 *     }
 *   }
 * } else {
 *   // Supabase não disponível, usar localStorage
 *   createAppointmentLocally(formData);
 * }
 */
