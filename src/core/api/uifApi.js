import { client } from './client'

/**
 * Obtener configuración paramétrica de UIF (umbrales en BOB y USD, orígenes y destinos permitidos).
 * GET /api/v1/uif/configuracion
 * @returns {Promise<{
 *   umbral_bob: string|number,
 *   umbral_usd: string|number,
 *   origenes: Array<{codigo: string, descripcion: string}>,
 *   destinos: Array<{codigo: string, descripcion: string}>
 * }>}
 */
export async function getConfiguracionUif() {
  const { data } = await client.get('/uif/configuracion')
  return data
}

/**
 * Listar declaraciones juradas UIF para oficiales de cumplimiento y administradores.
 * GET /api/v1/uif/declaraciones?desde=&hasta=&socio_ci=
 * @param {{desde?: string, hasta?: string, socio_ci?: string}} params
 * @returns {Promise<Array<object>>}
 */
export async function listDeclaracionesUif(params = {}) {
  const { data } = await client.get('/uif/declaraciones', { params })
  return data
}

/**
 * Obtener detalle completo de una declaración jurada UIF para auditoría e impresión.
 * GET /api/v1/uif/declaraciones/{id}
 * @param {number|string} id
 * @returns {Promise<object>}
 */
export async function getDeclaracionUif(id) {
  const { data } = await client.get(`/uif/declaraciones/${id}`)
  return data
}
