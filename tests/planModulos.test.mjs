import assert from 'node:assert/strict'
import test from 'node:test'

import {
  NOMBRES_MODULOS,
  getMensajeBloqueoModulo,
  isModuloPermitido,
} from '../src/core/utils/planModulos.js'

test('NOMBRES_MODULOS defines human-readable names for all restricted modules', () => {
  assert.equal(NOMBRES_MODULOS.informes_asfi, 'informes ASFI')
  assert.equal(NOMBRES_MODULOS.respaldos_bitacora, 'respaldos y bitácora')
  assert.equal(NOMBRES_MODULOS.recredito_ia, 'recomendación de recrédito con IA')
  assert.equal(NOMBRES_MODULOS.chatbot_ia, 'chatbot con IA y dictado por voz')
})

test('isModuloPermitido returns true when modulo is empty or null', () => {
  assert.equal(isModuloPermitido({ modulos: [] }, null), true)
  assert.equal(isModuloPermitido({ modulos: [] }, ''), true)
  assert.equal(isModuloPermitido({ modulos: [] }, undefined), true)
})

test('isModuloPermitido returns true on load failure or missing info (S7 fallback)', () => {
  assert.equal(isModuloPermitido(null, 'informes_asfi'), true)
  assert.equal(isModuloPermitido(undefined, 'informes_asfi'), true)
  assert.equal(isModuloPermitido({ fetchFailed: true, modulos: [] }, 'informes_asfi'), true)
})

test('isModuloPermitido returns true when sin_restriccion is true (S2)', () => {
  const superadminState = {
    plan: null,
    modulos: [],
    sin_restriccion: true,
  }
  assert.equal(isModuloPermitido(superadminState, 'informes_asfi'), true)
  assert.equal(isModuloPermitido(superadminState, 'recredito_ia'), true)
  assert.equal(isModuloPermitido(superadminState, 'banca_movil'), true)
})

test('isModuloPermitido checks presence in modulos list for normal plans', () => {
  const basicoState = {
    plan: { codigo: 'BASICO', nombre: 'Básico' },
    modulos: ['reportes_gerenciales'],
    sin_restriccion: false,
  }

  assert.equal(isModuloPermitido(basicoState, 'reportes_gerenciales'), true)
  assert.equal(isModuloPermitido(basicoState, 'informes_asfi'), false)
  assert.equal(isModuloPermitido(basicoState, 'respaldos_bitacora'), false)
  assert.equal(isModuloPermitido(basicoState, 'chatbot_ia'), false)
  assert.equal(isModuloPermitido(basicoState, 'notificaciones_socios'), false)
  assert.equal(isModuloPermitido(basicoState, 'recredito_ia'), false)
  assert.equal(isModuloPermitido(basicoState, 'scoring_crediticio'), false)

  const crecimientoState = {
    plan: { codigo: 'CRECIMIENTO_PRO', nombre: 'Crecimiento Pro' },
    modulos: [
      'reportes_gerenciales',
      'banca_movil',
      'scoring_crediticio',
      'informes_asfi',
      'respaldos_bitacora',
      'chatbot_ia',
      'notificaciones_socios',
    ],
    sin_restriccion: false,
  }

  assert.equal(isModuloPermitido(crecimientoState, 'informes_asfi'), true)
  assert.equal(isModuloPermitido(crecimientoState, 'respaldos_bitacora'), true)
  assert.equal(isModuloPermitido(crecimientoState, 'chatbot_ia'), true)
  assert.equal(isModuloPermitido(crecimientoState, 'recredito_ia'), false) // Solo Enterprise
})

test('getMensajeBloqueoModulo formats notice as specified in S3', () => {
  const modulosInfo = {
    plan: { codigo: 'BASICO', nombre: 'Básico' },
    modulos: [],
    sin_restriccion: false,
  }

  assert.equal(
    getMensajeBloqueoModulo(modulosInfo, 'informes_asfi'),
    'Tu plan Básico no incluye informes ASFI.',
  )
  assert.equal(
    getMensajeBloqueoModulo(modulosInfo, 'respaldos_bitacora'),
    'Tu plan Básico no incluye respaldos y bitácora.',
  )
  assert.equal(
    getMensajeBloqueoModulo(modulosInfo, 'recredito_ia'),
    'Tu plan Básico no incluye recomendación de recrédito con IA.',
  )
  assert.equal(
    getMensajeBloqueoModulo(modulosInfo, 'chatbot_ia'),
    'Tu plan Básico no incluye chatbot con IA y dictado por voz.',
  )
})

test('getMensajeBloqueoModulo accepts only modulosInfo and modulo (S3)', () => {
  assert.equal(getMensajeBloqueoModulo.length, 2)
})

test('getMensajeBloqueoModulo falls back gracefully when plan is missing', () => {
  assert.equal(
    getMensajeBloqueoModulo(null, 'informes_asfi'),
    'Tu plan actual no incluye informes ASFI.',
  )
  assert.equal(
    getMensajeBloqueoModulo({}, 'modulo_desconocido'),
    'Tu plan actual no incluye modulo_desconocido.',
  )
})
