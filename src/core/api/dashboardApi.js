import { client } from './client'

/**
 * Get cooperative summary dashboard for staff.
 * GET /api/v1/dashboard/resumen?moneda_id=
 * @param {number} [monedaId=1]
 * @returns {Promise<object>}
 */
export async function getDashboardResumen(monedaId = 1) {
  const { data } = await client.get('/dashboard/resumen', {
    params: { moneda_id: monedaId },
  })
  return data
}

/**
 * Get socio dashboard financial summary.
 * GET /api/v1/dashboard/socio
 * @returns {Promise<object>}
 */
export async function getDashboardSocio() {
  const { data } = await client.get('/dashboard/socio')
  return data
}
