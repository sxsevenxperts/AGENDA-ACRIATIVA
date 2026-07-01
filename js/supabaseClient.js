/**
 * Agenda Sobral - adapter opcional para Supabase.
 *
 * O app local continua funcionando com localStorage. Quando as variaveis globais
 * abaixo forem configuradas antes deste arquivo, este adapter usa o schema
 * isolado agenda_sobral no Supabase self-hosted do EasyPanel.
 *
 * window.AGENDA_SOBRAL_SUPABASE_URL = 'https://...'
 * window.AGENDA_SOBRAL_SUPABASE_ANON_KEY = '...'
 */

const AgendaSobralSupabase = (() => {
  'use strict';

  const SCHEMA = 'agenda_sobral';
  let client = null;

  function isConfigured() {
    return Boolean(window.AGENDA_SOBRAL_SUPABASE_URL && window.AGENDA_SOBRAL_SUPABASE_ANON_KEY);
  }

  function getClient() {
    if (!isConfigured()) {
      throw new Error('Supabase nao configurado. Defina AGENDA_SOBRAL_SUPABASE_URL e AGENDA_SOBRAL_SUPABASE_ANON_KEY.');
    }

    if (!window.supabase || !window.supabase.createClient) {
      throw new Error('Biblioteca Supabase JS nao carregada.');
    }

    if (!client) {
      client = window.supabase.createClient(
        window.AGENDA_SOBRAL_SUPABASE_URL,
        window.AGENDA_SOBRAL_SUPABASE_ANON_KEY,
        {
          db: { schema: SCHEMA },
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
          }
        }
      );
    }

    return client;
  }

  function normalizeResponse(result) {
    if (result.error) {
      throw result.error;
    }
    return result.data;
  }

  async function signUpCitizen({ email, password, fullName, cpf, phone }) {
    const supabaseClient = getClient();
    const result = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          cpf,
          phone,
          app_schema: SCHEMA,
          app_role: 'usuario'
        }
      }
    });

    if (result.error) throw result.error;

    if (result.data && result.data.user) {
      await normalizeResponse(await supabaseClient.rpc('register_current_user', {
        p_full_name: fullName,
        p_cpf: cpf || null,
        p_phone: phone || null,
        p_email: email || null,
        p_profile_data: { source: 'frontend_signup' }
      }));
    }

    return result.data;
  }

  async function signIn(email, password) {
    return normalizeResponse(await getClient().auth.signInWithPassword({ email, password }));
  }

  async function signOut() {
    return normalizeResponse(await getClient().auth.signOut());
  }

  async function getSession() {
    return normalizeResponse(await getClient().auth.getSession());
  }

  async function getDepartments() {
    return normalizeResponse(await getClient()
      .from('departments')
      .select('id, external_id, slug, name, acronym, portal_url, color, description')
      .eq('active', true)
      .order('name'));
  }

  async function getEquipmentsByDepartment(departmentExternalId) {
    return normalizeResponse(await getClient()
      .from('equipments')
      .select('id, external_id, slug, name, equipment_type, address, district, phone, opening_hours, departments!inner(external_id)')
      .eq('active', true)
      .eq('accepts_scheduling', true)
      .eq('departments.external_id', departmentExternalId)
      .order('name'));
  }

  async function getServicesByEquipment(equipmentExternalId) {
    return normalizeResponse(await getClient()
      .from('services')
      .select('id, external_id, name, description, default_duration_minutes, equipments!inner(external_id)')
      .eq('active', true)
      .eq('equipments.external_id', equipmentExternalId)
      .order('name'));
  }

  async function getOpenSlots(equipmentExternalId, date) {
    let query = getClient()
      .from('availability_slots')
      .select('id, slot_date, starts_at, ends_at, capacity, booked_count, service_id, equipments!inner(external_id)')
      .eq('status', 'open')
      .eq('equipments.external_id', equipmentExternalId)
      .order('slot_date')
      .order('starts_at');

    if (date) {
      query = query.eq('slot_date', date);
    } else {
      query = query.gte('slot_date', new Date().toISOString().slice(0, 10));
    }

    return normalizeResponse(await query);
  }

  async function bookAppointment({ slotId, serviceId, subject, notes }) {
    return normalizeResponse(await getClient().rpc('book_appointment', {
      p_slot_id: slotId,
      p_service_id: serviceId,
      p_subject: subject || null,
      p_notes: notes || null
    }));
  }

  async function cancelMyAppointment(appointmentId, reason) {
    return normalizeResponse(await getClient().rpc('cancel_my_appointment', {
      p_appointment_id: appointmentId,
      p_reason: reason || null
    }));
  }

  async function getMyAppointments() {
    return normalizeResponse(await getClient()
      .from('appointments')
      .select('*, departments(name, acronym), equipments(name), services(name), nps_surveys(id, score, nps_group)')
      .order('scheduled_date', { ascending: false })
      .order('scheduled_time', { ascending: false }));
  }

  async function getScopedAppointments(filters = {}) {
    let query = getClient()
      .from('appointments')
      .select('*, users!appointments_citizen_user_id_fkey(full_name, cpf, phone), departments(name, acronym), equipments(name), services(name)')
      .order('scheduled_date', { ascending: false })
      .order('scheduled_time', { ascending: false });

    if (filters.date) query = query.eq('scheduled_date', filters.date);
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.equipmentId) query = query.eq('equipment_id', filters.equipmentId);

    return normalizeResponse(await query);
  }

  async function validateVirtualTicket(validationCode) {
    return normalizeResponse(await getClient().rpc('validate_virtual_ticket', {
      p_validation_code: validationCode
    }));
  }

  async function completeAppointment(appointmentId, outcomeNotes) {
    return normalizeResponse(await getClient().rpc('complete_appointment', {
      p_appointment_id: appointmentId,
      p_outcome_notes: outcomeNotes || null
    }));
  }

  async function markNoShow(appointmentId, reason) {
    return normalizeResponse(await getClient().rpc('mark_no_show', {
      p_appointment_id: appointmentId,
      p_reason: reason || null
    }));
  }

  async function submitNps(appointmentId, score, comment) {
    return normalizeResponse(await getClient().rpc('submit_nps', {
      p_appointment_id: appointmentId,
      p_score: score,
      p_comment: comment || null
    }));
  }

  async function getManagementKpis(filters = {}) {
    return normalizeResponse(await getClient().rpc('get_management_kpis', {
      p_department_external_id: filters.departmentExternalId || null,
      p_equipment_external_id: filters.equipmentExternalId || null,
      p_date_from: filters.dateFrom || null,
      p_date_to: filters.dateTo || null
    }));
  }

  async function getNpsReport(filters = {}) {
    return normalizeResponse(await getClient().rpc('get_nps_report', {
      p_department_external_id: filters.departmentExternalId || null,
      p_equipment_external_id: filters.equipmentExternalId || null,
      p_date_from: filters.dateFrom || null,
      p_date_to: filters.dateTo || null
    }));
  }

  async function provisionAccess(payload) {
    return normalizeResponse(await getClient().rpc('provision_access', {
      p_auth_user_id: payload.authUserId,
      p_email: payload.email,
      p_role: payload.role,
      p_full_name: payload.fullName || null,
      p_department_external_id: payload.departmentExternalId || null,
      p_equipment_external_id: payload.equipmentExternalId || null,
      p_profile_data: payload.profileData || {}
    }));
  }

  return {
    schema: SCHEMA,
    isConfigured,
    getClient,
    signUpCitizen,
    signIn,
    signOut,
    getSession,
    getDepartments,
    getEquipmentsByDepartment,
    getServicesByEquipment,
    getOpenSlots,
    bookAppointment,
    cancelMyAppointment,
    getMyAppointments,
    getScopedAppointments,
    validateVirtualTicket,
    completeAppointment,
    markNoShow,
    submitNps,
    getManagementKpis,
    getNpsReport,
    provisionAccess
  };
})();

window.AgendaSobralSupabase = AgendaSobralSupabase;
