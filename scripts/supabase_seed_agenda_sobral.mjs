#!/usr/bin/env node
/**
 * Seed Agenda Sobral no Supabase self-hosted.
 *
 * Uso recomendado:
 *   SUPABASE_URL=https://xpert-backend-supabase.qfotry.easypanel.host \
 *   SUPABASE_SERVICE_ROLE_KEY=... \
 *   node scripts/supabase_seed_agenda_sobral.mjs
 *
 * Se as variaveis nao existirem, o script tenta ler o arquivo local:
 * /Users/sergioponte/SUPABASE SERVIDOR EASYPANEL/.credenciais-supabase-novas.json
 *
 * Este script nao cria tabelas. Aplique antes a migration do schema.
 */

import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')
const schema = process.env.SUPABASE_SCHEMA || 'agenda_sobral'
const credentialsPath = '/Users/sergioponte/SUPABASE SERVIDOR EASYPANEL/.credenciais-supabase-novas.json'

function loadCredentials() {
  let url = process.env.SUPABASE_URL
  let serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if ((!url || !serviceRoleKey) && fs.existsSync(credentialsPath)) {
    const parsed = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'))
    url ||= parsed.DOMAIN
    serviceRoleKey ||= parsed.SERVICE_ROLE_KEY
  }

  if (!url || !serviceRoleKey) {
    throw new Error('Informe SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY para executar o seed.')
  }

  return {
    url: url.replace(/\/$/, ''),
    serviceRoleKey,
  }
}

function loadSobralData() {
  const scraped = fs.readFileSync(path.join(rootDir, 'js/scraped_data.js'), 'utf8')
  const data = fs.readFileSync(path.join(rootDir, 'js/data.js'), 'utf8')
  const context = { console }

  vm.createContext(context)
  vm.runInContext(`${scraped}\n${data}\nglobalThis.__DATA__ = SobralData;`, context)

  if (!context.__DATA__) {
    throw new Error('SobralData nao foi carregado.')
  }

  return context.__DATA__
}

function slugify(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function request(credentials, method, resource, body, query = '', prefer = '') {
  const url = `${credentials.url}/rest/v1/${resource}${query}`
  const response = await fetch(url, {
    method,
    headers: {
      apikey: credentials.serviceRoleKey,
      Authorization: `Bearer ${credentials.serviceRoleKey}`,
      'Content-Type': 'application/json',
      'Accept-Profile': schema,
      'Content-Profile': schema,
      ...(prefer ? { Prefer: prefer } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  const text = await response.text()
  let payload = null
  try {
    payload = text ? JSON.parse(text) : null
  } catch {
    payload = text
  }

  if (!response.ok) {
    const detail = typeof payload === 'string' ? payload : JSON.stringify(payload)
    throw new Error(`${method} ${resource} falhou (${response.status}): ${detail}`)
  }

  return payload
}

async function upsert(credentials, resource, rows, conflictColumn) {
  if (!rows.length) return []
  return request(
    credentials,
    'POST',
    resource,
    rows,
    `?on_conflict=${encodeURIComponent(conflictColumn)}`,
    'resolution=merge-duplicates,return=representation'
  )
}

async function fetchAll(credentials, resource, columns = '*') {
  return request(credentials, 'GET', resource, null, `?select=${encodeURIComponent(columns)}&limit=1000`)
}

async function main() {
  const credentials = loadCredentials()
  const data = loadSobralData()

  const departmentRows = (data.secretarias || []).map((department) => ({
    external_id: department.id,
    slug: slugify(department.id),
    name: department.nome,
    acronym: department.sigla || null,
    portal_url: department.portal_url || 'https://sobral.ce.gov.br/',
    color: department.cor || null,
    description: department.descricao || null,
    active: true,
    metadata: {
      icon: department.icone || null,
      source: 'sobral_data_js',
    },
  }))

  await upsert(credentials, 'departments', departmentRows, 'external_id')
  const departments = await fetchAll(credentials, 'departments', 'id,external_id')
  const departmentByExternalId = new Map(departments.map((item) => [item.external_id, item.id]))

  const equipmentRows = (data.equipamentos || [])
    .filter((equipment) => departmentByExternalId.has(equipment.secretaria_id))
    .map((equipment) => ({
      department_id: departmentByExternalId.get(equipment.secretaria_id),
      external_id: equipment.id,
      slug: slugify(equipment.id),
      name: equipment.nome,
      equipment_type: equipment.tipo || null,
      address: equipment.endereco || null,
      district: equipment.bairro || null,
      phone: equipment.telefone || null,
      opening_hours: equipment.horario || null,
      accepts_scheduling: true,
      active: true,
      metadata: {
        source: equipment.id.startsWith('srv_scraped_') ? 'scraper' : 'sobral_data_js',
        secretaria_id: equipment.secretaria_id,
      },
    }))

  await upsert(credentials, 'equipments', equipmentRows, 'external_id')
  const equipments = await fetchAll(credentials, 'equipments', 'id,external_id')
  const equipmentByExternalId = new Map(equipments.map((item) => [item.external_id, item.id]))

  const settingRows = equipmentRows
    .filter((equipment) => equipmentByExternalId.has(equipment.external_id))
    .map((equipment) => ({
      equipment_id: equipmentByExternalId.get(equipment.external_id),
      available_weekdays: [1, 2, 3, 4, 5],
      opening_time: '08:00',
      closing_time: '14:00',
      slot_interval_minutes: 30,
      default_capacity: 10,
      service_config: {},
    }))

  await upsert(credentials, 'equipment_settings', settingRows, 'equipment_id')

  const serviceRows = (data.servicos || [])
    .filter((service) => equipmentByExternalId.has(service.equipamento_id))
    .map((service) => ({
      equipment_id: equipmentByExternalId.get(service.equipamento_id),
      external_id: service.id,
      name: service.nome,
      description: service.descricao || null,
      default_duration_minutes: Number(service.duracao || 30),
      active: true,
      metadata: {
        equipamento_id: service.equipamento_id,
        source: String(service.id).startsWith('srv_scraped_') ? 'scraper' : 'sobral_data_js',
      },
    }))

  await upsert(credentials, 'services', serviceRows, 'external_id')

  console.log(JSON.stringify({
    schema,
    departments: departmentRows.length,
    equipments: equipmentRows.length,
    services: serviceRows.length,
    status: 'seed_ok',
  }, null, 2))
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
