import { client } from './client'

/**
 * API client for Contabilidad & Plan de Cuentas (CU-W29).
 * Base prefix: /contabilidad
 */

/**
 * Get summary counts for the chart of accounts (header metrics).
 * GET /api/v1/contabilidad/plan-cuentas/resumen
 * @returns {Promise<object>}
 */
export async function getPlanCuentasResumen() {
  const { data } = await client.get('/contabilidad/plan-cuentas/resumen')
  return data
}

/**
 * Get the hierarchical tree of accounts for a specific accounting class (1..9).
 * GET /api/v1/contabilidad/plan-cuentas/arbol?clase={clase}
 * @param {number|string} clase
 * @returns {Promise<object|Array<object>>}
 */
export async function getPlanCuentasArbol(clase) {
  const { data } = await client.get('/contabilidad/plan-cuentas/arbol', {
    params: { clase },
  })
  return data
}

/**
 * List accounts in flat format with optional query, filters by class, level, state, etc.
 * GET /api/v1/contabilidad/plan-cuentas?q=&clase=&nivel=&estado=&solo_movimiento=
 * @param {{
 *   q?: string,
 *   clase?: number|string,
 *   nivel?: number|string,
 *   estado?: 'ACTIVA'|'INACTIVA',
 *   solo_movimiento?: boolean
 * }} [params]
 * @returns {Promise<Array<object>>}
 */
export async function listPlanCuentas(params = {}) {
  const { data } = await client.get('/contabilidad/plan-cuentas', { params })
  return data
}

/**
 * Get detailed information for an account including ancestors path and movement count.
 * GET /api/v1/contabilidad/plan-cuentas/{id}
 * @param {number|string} id
 * @returns {Promise<object>}
 */
export async function getPlanCuenta(id) {
  const { data } = await client.get(`/contabilidad/plan-cuentas/${id}`)
  return data
}

/**
 * Create a new cooperative analytic account under an official level-4 subaccount.
 * POST /api/v1/contabilidad/plan-cuentas
 * @param {{
 *   padre_id: number|string,
 *   nombre: string,
 *   descripcion?: string
 * }} payload
 * @returns {Promise<object>}
 */
export async function createCuentaAnalitica(payload) {
  const { data } = await client.post('/contabilidad/plan-cuentas', payload)
  return data
}

/**
 * Update the name or description of an analytic account.
 * PATCH /api/v1/contabilidad/plan-cuentas/{id}
 * @param {number|string} id
 * @param {{
 *   nombre?: string,
 *   descripcion?: string
 * }} payload
 * @returns {Promise<object>}
 */
export async function updateCuentaAnalitica(id, payload) {
  const { data } = await client.patch(`/contabilidad/plan-cuentas/${id}`, payload)
  return data
}

/**
 * Change the active/inactive status of an analytic account with a mandatory reason.
 * POST /api/v1/contabilidad/plan-cuentas/{id}/estado
 * @param {number|string} id
 * @param {{
 *   estado: 'ACTIVA'|'INACTIVA',
 *   motivo: string
 * }} payload
 * @returns {Promise<object>}
 */
export async function cambiarEstadoCuentaAnalitica(id, payload) {
  const { data } = await client.post(`/contabilidad/plan-cuentas/${id}/estado`, payload)
  return data
}

/**
 * Delete an analytic account (allowed only if it has 0 accounting movements).
 * DELETE /api/v1/contabilidad/plan-cuentas/{id}
 * @param {number|string} id
 * @returns {Promise<object>}
 */
export async function deleteCuentaAnalitica(id) {
  const { data } = await client.delete(`/contabilidad/plan-cuentas/${id}`)
  return data
}

/**
 * List accounting vouchers with pagination and filters (CU-W30).
 * GET /api/v1/contabilidad/comprobantes?desde=&hasta=&tipo=&origen=&estado=&q=&limit=&offset=
 * @param {{
 *   desde?: string,
 *   hasta?: string,
 *   tipo?: 'INGRESO'|'EGRESO'|'TRASPASO',
 *   origen?: 'MANUAL'|'AUTOMATICO',
 *   estado?: 'REGISTRADO'|'ANULADO',
 *   q?: string,
 *   limit?: number,
 *   offset?: number
 * }} [params]
 * @returns {Promise<{ total: number, items: Array<object> } | Array<object>>}
 */
export async function listComprobantes(params = {}) {
  const { data } = await client.get('/contabilidad/comprobantes', { params })
  return data
}

/**
 * Get detailed voucher information including lines, totals, and reversal links (CU-W30).
 * GET /api/v1/contabilidad/comprobantes/{id}
 * @param {number|string} id
 * @returns {Promise<object>}
 */
export async function getComprobante(id) {
  const { data } = await client.get(`/contabilidad/comprobantes/${id}`)
  return data
}

/**
 * Create a new manual double-entry voucher (CU-W30).
 * POST /api/v1/contabilidad/comprobantes
 * @param {{
 *   tipo: 'INGRESO'|'EGRESO'|'TRASPASO',
 *   fecha_contable: string,
 *   glosa: string,
 *   moneda_id: number,
 *   lineas: Array<{
 *     plan_cuenta_id: number,
 *     debe: string|number,
 *     haber: string|number,
 *     glosa?: string
 *   }>
 * }} payload
 * @returns {Promise<object>}
 */
export async function createComprobanteManual(payload) {
  const { data } = await client.post('/contabilidad/comprobantes', payload)
  return data
}

/**
 * Void a registered manual voucher with mandatory reason (CU-W30).
 * POST /api/v1/contabilidad/comprobantes/{id}/anular
 * @param {number|string} id
 * @param {{ motivo: string }} payload
 * @returns {Promise<object>}
 */
export async function anularComprobante(id, payload) {
  const { data } = await client.post(`/contabilidad/comprobantes/${id}/anular`, payload)
  return data
}

/**
 * Trigger automatic voucher generation from unmapped operational transactions (CU-W30).
 * POST /api/v1/contabilidad/comprobantes/generar-automaticos
 * @param {{ desde?: string, hasta?: string }} [payload]
 * @returns {Promise<{
 *   procesadas: number,
 *   generados: number,
 *   omitidas: Array<{ transaccion_id: number, tipo: string, motivo: string }>,
 *   por_tipo: object
 * }>}
 */
export async function generarComprobantesAutomaticos(payload = {}) {
  const { data } = await client.post('/contabilidad/comprobantes/generar-automaticos', payload)
  return data
}

/**
 * List accounting parameter mappings for the cooperative (CU-W30).
 * GET /api/v1/contabilidad/parametros-contables
 * @returns {Promise<Array<object>>}
 */
export async function getParametrosContables() {
  const { data } = await client.get('/contabilidad/parametros-contables')
  return data
}

/**
 * Update the account mapping for a specific accounting parameter key (CU-W30).
 * PUT /api/v1/contabilidad/parametros-contables/{clave}
 * @param {string} clave
 * @param {{ plan_cuenta_id: number }} payload
 * @returns {Promise<object>}
 */
export async function updateParametroContable(clave, payload) {
  const { data } = await client.put(`/contabilidad/parametros-contables/${clave}`, payload)
  return data
}
