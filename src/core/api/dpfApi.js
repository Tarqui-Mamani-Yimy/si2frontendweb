import { client } from './client'

/**
 * Obtener tarifario de tasas DPF por cooperativa, moneda y rango de plazos.
 * GET /api/v1/dpf/tarifario
 * @returns {Promise<Array<{moneda: object, plazo_min_dias: number, plazo_max_dias: number|null, tna: string|number}>>}
 */
export async function getTarifarioDpf() {
  const { data } = await client.get('/dpf/tarifario')
  return data
}

/**
 * Simular cálculo de rendimientos, retención RC-IVA y cronograma de pagos para DPF.
 * POST /api/v1/dpf/simulacion
 * @param {{
 *   monto: number|string,
 *   moneda_id: number,
 *   plazo_dias: number,
 *   modalidad_pago_interes: 'VENCIMIENTO'|'MENSUAL'
 * }} payload
 * @returns {Promise<object>}
 */
export async function simularDpf(payload) {
  const { data } = await client.post('/dpf/simulacion', payload)
  return data
}

/**
 * Emitir un nuevo certificado de Depósito a Plazo Fijo (CU-W17).
 * POST /api/v1/dpf
 * @param {{
 *   socio_id: number,
 *   monto: number|string,
 *   moneda_id: number,
 *   plazo_dias: number,
 *   modalidad_pago_interes: 'VENCIMIENTO'|'MENSUAL',
 *   origen_fondos: 'CUENTA'|'EFECTIVO',
 *   cuenta_origen_id?: number,
 *   cuenta_abono_id: number,
 *   declaracion_uif?: object
 * }} payload
 * @returns {Promise<object>} Certificado DPF emitido
 */
export async function emitirDpf(payload) {
  const { data } = await client.post('/dpf', payload)
  return data
}

/**
 * Listar certificados DPF con filtros de estado, días para vencer o CI del socio.
 * GET /api/v1/dpf?estado=&vence_en_dias=&socio_ci=
 * @param {{estado?: string, vence_en_dias?: number|string, socio_ci?: string}} params
 * @returns {Promise<Array<object>>}
 */
export async function listDpf(params = {}) {
  const { data } = await client.get('/dpf', { params })
  return data
}

/**
 * Obtener detalle completo de un DPF con su cronograma y código de verificación.
 * GET /api/v1/dpf/{id}
 * @param {number|string} id
 * @returns {Promise<object>}
 */
export async function getDpf(id) {
  const { data } = await client.get(`/dpf/${id}`)
  return data
}

/**
 * Obtener vista previa de liquidación, cancelación anticipada o renovación de DPF (CU-W19).
 * GET /api/v1/dpf/{id}/liquidacion/preview?tipo=
 * @param {number|string} id
 * @param {'LIQUIDACION'|'CANCELACION'|'RENOVACION'} tipo
 * @returns {Promise<object>}
 */
export async function previewLiquidacionDpf(id, tipo) {
  const { data } = await client.get(`/dpf/${id}/liquidacion/preview`, {
    params: { tipo },
  })
  return data
}

/**
 * Ejecutar formalmente la liquidación, cancelación o renovación de un DPF (CU-W19).
 * POST /api/v1/dpf/{id}/liquidacion
 * @param {number|string} id
 * @param {{
 *   tipo: 'LIQUIDACION'|'CANCELACION'|'RENOVACION',
 *   capitalizar?: boolean,
 *   plazo_dias?: number,
 *   modalidad_pago_interes?: 'VENCIMIENTO'|'MENSUAL'
 * }} payload
 * @returns {Promise<object>}
 */
export async function procesarLiquidacionDpf(id, payload) {
  const { data } = await client.post(`/dpf/${id}/liquidacion`, payload)
  return data
}

/**
 * Ejecutar la corrida de pago de intereses periódicos devengados de DPFs mensuales (CU-W18).
 * POST /api/v1/dpf/intereses/procesar
 * @param {{ fecha?: string }} [payload] Fecha opcional (YYYY-MM-DD <= hoy)
 * @returns {Promise<{
 *   fecha: string,
 *   dpf_procesados: number,
 *   cuotas_pagadas: number,
 *   total_neto_por_moneda: Array<{ moneda: object|string, total: number|string }>,
 *   pagos: Array<object>,
 *   omitidos: Array<{ dpf_id: number, numero_certificado: string, motivo: string }>
 * }>}
 */
export async function procesarInteresesDpf(payload = {}) {
  const { data } = await client.post('/dpf/intereses/procesar', payload)
  return data
}

/**
 * Listar el historial de pagos de intereses de DPF de la cooperativa (CU-W18).
 * GET /api/v1/dpf/intereses/pagos?desde=&hasta=
 * @param {{ desde?: string, hasta?: string }} [params]
 * @returns {Promise<Array<object>>} List[PagoInteresOut]
 */
export async function listarPagosInteres(params = {}) {
  const { data } = await client.get('/dpf/intereses/pagos', { params })
  return data
}

/**
 * Obtener el historial de pagos de intereses de un DPF específico (CU-W18).
 * GET /api/v1/dpf/{id}/intereses
 * @param {number|string} id
 * @returns {Promise<Array<object>>} List[PagoInteresOut]
 */
export async function listarInteresesDpf(id) {
  const { data } = await client.get(`/dpf/${id}/intereses`)
  return data
}

