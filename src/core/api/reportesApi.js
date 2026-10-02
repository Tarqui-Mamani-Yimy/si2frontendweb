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
