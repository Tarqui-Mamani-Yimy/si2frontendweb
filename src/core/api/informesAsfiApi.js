import { client } from './client'

/**
 * ASFI Regulatory Reports API client (CU-W34).
 * Prefix: /api/v1/informes-asfi
 */

function ensureFechaCorte(params = {}) {
  if (params?.fecha_corte) return params
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return { ...params, fecha_corte: `${year}-${month}-${day}` }
}

/**
 * Get portfolio evaluation and required regulatory provisions preview (CU-W34).
 * GET /api/v1/informes-asfi/calificacion-cartera?fecha_corte=
 * @param {{ fecha_corte?: string }} [params]
 * @returns {Promise<object>}
 */
export async function getCalificacionCartera(params = {}) {
  const queryParams = ensureFechaCorte(params)
  const { data } = await client.get('/informes-asfi/calificacion-cartera', { params: queryParams })
  return data
}

/**
 * Get monthly financial statements regulatory package preview (CU-W34).
 * GET /api/v1/informes-asfi/estados-financieros?fecha_corte=
 * @param {{ fecha_corte?: string }} [params]
 * @returns {Promise<object>}
 */
export async function getEstadosFinancieros(params = {}) {
  const queryParams = ensureFechaCorte(params)
  const { data } = await client.get('/informes-asfi/estados-financieros', { params: queryParams })
  return data
}

/**
 * Get debtor portfolio report for credit bureau / CIC preview (CU-W34).
 * GET /api/v1/informes-asfi/cartera-deudores?fecha_corte=
 * @param {{ fecha_corte?: string }} [params]
 * @returns {Promise<object>}
 */
export async function getCarteraDeudores(params = {}) {
  const queryParams = ensureFechaCorte(params)
  const { data } = await client.get('/informes-asfi/cartera-deudores', { params: queryParams })
  return data
}

/**
 * Generate official immutable snapshot of a regulatory report (CU-W34).
 * POST /api/v1/informes-asfi/generar
 * @param {{
 *   tipo: 'CALIFICACION_CARTERA' | 'ESTADOS_FINANCIEROS' | 'CARTERA_DEUDORES',
 *   fecha_corte: string
 * }} payload
 * @returns {Promise<object>}
 */
export async function generarInforme(payload) {
  const body = ensureFechaCorte(payload)
  const { data } = await client.post('/informes-asfi/generar', body)
  return data
}

/**
 * Get historical record of generated regulatory reports (CU-W34).
 * GET /api/v1/informes-asfi/reportes?tipo=&desde=&hasta=
 * @param {{
 *   tipo?: string,
 *   desde?: string,
 *   hasta?: string
 * }} [params]
 * @returns {Promise<Array<object>>}
 */
export async function getReportesHistorial(params = {}) {
  const { data } = await client.get('/informes-asfi/reportes', { params })
  return data
}

/**
 * Get stored report snapshot with SHA-256 integrity verification (CU-W34).
 * GET /api/v1/informes-asfi/reportes/{id}
 * @param {number|string} id
 * @returns {Promise<object>}
 */
export async function getReporteDetalle(id) {
  const { data } = await client.get(`/informes-asfi/reportes/${id}`)
  return data
}

/**
 * Export generated report snapshot to CSV with UTF-8 BOM (CU-W34).
 * GET /api/v1/informes-asfi/reportes/{id}/export
 * @param {number|string} id
 * @returns {Promise<any>}
 */
export async function exportReporteCsv(id) {
  const response = await client.get(`/informes-asfi/reportes/${id}/export`, {
    responseType: 'blob',
  })
  return response
}

/**
 * Get regulatory catalog of ASFI reports with scope and normative sources (CU-W34).
 * GET /api/v1/informes-asfi/catalogo
 * @returns {Promise<Array<object>>}
 */
export async function getCatalogoInformes() {
  const { data } = await client.get('/informes-asfi/catalogo')
  return data
}
