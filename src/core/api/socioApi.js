import { client } from './client'

export const TIPO_CREDITO_LABELS = {
  CONSUMO: 'Consumo',
  MICROCREDITO: 'Microcrédito',
  MICROCREDITO_AGROPECUARIO: 'Microcrédito agropecuario',
  VIVIENDA_HIPOTECARIA: 'Vivienda hipotecaria',
  VIVIENDA_SIN_GARANTIA: 'Vivienda sin garantía',
}

export function formatTipoCredito(tipo) {
  if (!tipo) return 'Sin clasificar'
  return TIPO_CREDITO_LABELS[tipo] || tipo
}

export function formatTipoAmortizacion(tipo) {
  if (!tipo) return 'Francés'
  const upper = String(tipo).toUpperCase()
  if (upper.includes('FRANC')) return 'Francés'
  if (upper.includes('ALEM')) return 'Alemán'
  return tipo
}

/**
 * List the socio's active and historical credits.
 * GET /api/v1/socio/creditos
 * @returns {Promise<Array<object>>}
 */
export async function getMisCreditos() {
  const { data } = await client.get('/socio/creditos')
  return data
}

/**
 * Get payment statement and amortization schedule for a credit.
 * GET /api/v1/socio/creditos/{id}/extracto?desde=&hasta=
 * @param {number} creditoId
 * @param {{ desde?: string, hasta?: string }} [params]
 * @returns {Promise<object>}
 */
export async function getExtractoCredito(creditoId, params = {}) {
  const cleanParams = {}
  if (params.desde) cleanParams.desde = params.desde
  if (params.hasta) cleanParams.hasta = params.hasta

  const { data } = await client.get(`/socio/creditos/${creditoId}/extracto`, {
    params: cleanParams,
  })
  return data
}

/**
 * Export credit payment statement as PDF or CSV.
 * GET /api/v1/socio/creditos/{id}/extracto/export?formato=pdf|csv&desde=&hasta=
 * @param {number} creditoId
 * @param {{ formato?: 'pdf' | 'csv', desde?: string, hasta?: string }} [params]
 * @returns {Promise<any>}
 */
export async function exportExtractoCredito(creditoId, params = {}) {
  const cleanParams = {
    formato: params.formato || 'pdf',
  }
  if (params.desde) cleanParams.desde = params.desde
  if (params.hasta) cleanParams.hasta = params.hasta

  const response = await client.get(
    `/socio/creditos/${creditoId}/extracto/export`,
    {
      params: cleanParams,
      responseType: 'blob',
    },
  )
  return response
}

/**
 * Get socio dashboard summary.
 * GET /api/v1/dashboard/socio
 * @returns {Promise<object>}
 */
export async function getDashboardSocio() {
  const { data } = await client.get('/dashboard/socio')
  return data
}
