import { client } from './client'

/**
 * Management and Financial Reports API client (CU-W33).
 */

/**
 * Get executive summary of management KPIs (CU-W33).
 * GET /api/v1/reportes/resumen-ejecutivo?fecha_corte=&moneda_id=
 * @param {{
 *   fecha_corte?: string,
 *   moneda_id?: number
 * }} [params]
 * @returns {Promise<object>}
 */
export async function getResumenEjecutivo(params = {}) {
  const { data } = await client.get('/reportes/resumen-ejecutivo', { params })
  return data
}

/**
 * Get credit portfolio report (CU-W33).
 * GET /api/v1/reportes/cartera?fecha_corte=&moneda_id=
 * @param {{
 *   fecha_corte?: string,
 *   moneda_id?: number
 * }} [params]
 * @returns {Promise<object>}
 */
export async function getCarteraReport(params = {}) {
  const { data } = await client.get('/reportes/cartera', { params })
  return data
}

/**
 * Export credit portfolio report to CSV with UTF-8 BOM (CU-W33).
 * GET /api/v1/reportes/cartera/export?fecha_corte=&moneda_id=
 * @param {{
 *   fecha_corte?: string,
 *   moneda_id?: number
 * }} [params]
 * @returns {Promise<any>}
 */
export async function exportCarteraReport(params = {}) {
  const response = await client.get('/reportes/cartera/export', {
    params,
    responseType: 'blob',
  })
  return response
}

/**
 * Get savings and DPF deposits report (CU-W33).
 * GET /api/v1/reportes/captaciones?fecha_corte=&moneda_id=
 * @param {{
 *   fecha_corte?: string,
 *   moneda_id?: number
 * }} [params]
 * @returns {Promise<object>}
 */
export async function getCaptacionesReport(params = {}) {
  const { data } = await client.get('/reportes/captaciones', { params })
  return data
}

/**
 * Export deposits report to CSV with UTF-8 BOM (CU-W33).
 * GET /api/v1/reportes/captaciones/export?fecha_corte=&moneda_id=
 * @param {{
 *   fecha_corte?: string,
 *   moneda_id?: number
 * }} [params]
 * @returns {Promise<any>}
 */
export async function exportCaptacionesReport(params = {}) {
  const response = await client.get('/reportes/captaciones/export', {
    params,
    responseType: 'blob',
  })
  return response
}

/**
 * Get financial and management indicators report (CU-W33).
 * GET /api/v1/reportes/indicadores?fecha_corte=&moneda_id=
 * @param {{
 *   fecha_corte?: string,
 *   moneda_id?: number
 * }} [params]
 * @returns {Promise<object>}
 */
export async function getIndicadoresReport(params = {}) {
  const { data } = await client.get('/reportes/indicadores', { params })
  return data
}

/**
 * Export indicators report to CSV with UTF-8 BOM (CU-W33).
 * GET /api/v1/reportes/indicadores/export?fecha_corte=&moneda_id=
 * @param {{
 *   fecha_corte?: string,
 *   moneda_id?: number
 * }} [params]
 * @returns {Promise<any>}
 */
export async function exportIndicadoresReport(params = {}) {
  const response = await client.get('/reportes/indicadores/export', {
    params,
    responseType: 'blob',
  })
  return response
}

/**
 * Interpret a transcribed voice command into a report export.
 * POST /api/v1/reportes/comando-voz
 * @param {string} texto Transcribed command, e.g. "reporte de cartera en PDF".
 * @returns {Promise<{
 *   reconocido: boolean,
 *   transcripcion: string,
 *   mensaje?: string,
 *   sugerencias?: string[],
 *   tipo?: string,
 *   nombre?: string,
 *   descripcion?: string,
 *   endpoint?: string,
 *   parametros?: object,
 *   formato?: 'csv' | 'pdf' | 'html' | null,
 *   accion?: 'descargar' | 'mostrar',
 *   archivo?: string,
 *   formatos?: string[],
 * }>}
 */
export async function interpretarComandoVoz(texto) {
  const { data } = await client.post('/reportes/comando-voz', { texto })
  return data
}

/**
 * Download any report export returned by the voice command.
 * GET /api/v1{endpoint}?...parametros&formato=
 * @param {string} endpoint Export path relative to /api/v1.
 * @param {object} parametros Query parameters from the interpreted command.
 * @param {'csv' | 'pdf' | 'html'} formato
 * @returns {Promise<any>}
 */
export async function exportReporte(endpoint, parametros, formato) {
  return client.get(endpoint, {
    params: { ...parametros, formato },
    responseType: 'blob',
    timeout: 60000,
  })
}
