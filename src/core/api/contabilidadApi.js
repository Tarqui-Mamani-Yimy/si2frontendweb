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
