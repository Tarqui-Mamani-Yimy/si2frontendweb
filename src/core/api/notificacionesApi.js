import { client } from './client'

/**
 * Gestionar notificaciones API client.
 * Staff (ADMINISTRADOR / CAJERO) sends; socios read their own inbox.
 */

/**
 * Recipients per audience group.
 * GET /api/v1/notificaciones/segmentos?dias=
 * @param {number} [dias=7] Window for "cuotas por vencer".
 * @returns {Promise<{ dias: number, segmentos: Record<string, { destinatarios: number, sin_cuenta: number }> }>}
 */
export async function getSegmentos(dias = 7) {
  const { data } = await client.get('/notificaciones/segmentos', { params: { dias } })
  return data
}

/**
 * Search socios of the cooperative by name, surname or C.I.
 * GET /api/v1/notificaciones/socios?q=
 * @param {string} q At least 2 characters.
 * @returns {Promise<Array<{ id: number, nombre: string, apellido: string, ci: string, tiene_cuenta: boolean }>>}
 */
export async function buscarSocios(q) {
  const { data } = await client.get('/notificaciones/socios', { params: { q } })
  return data
}

/**
 * Send a notification.
 * POST /api/v1/notificaciones
 * @param {{
 *   tipo: 'RECORDATORIO_PAGO' | 'PROMOCION' | 'AVISO',
 *   titulo: string,
 *   mensaje: string,
 *   destino: 'SOCIO' | 'TODOS' | 'CUOTAS_POR_VENCER' | 'EN_MORA',
 *   socio_ids?: number[],
 *   dias?: number,
 * }} body
 * @returns {Promise<{ id: number, total_destinatarios: number, omitidos_sin_cuenta: number }>}
 */
export async function enviarNotificacion(body) {
  const { data } = await client.post('/notificaciones', body)
  return data
}

/**
 * Notifications sent by the cooperative, newest first.
 * GET /api/v1/notificaciones
 * @returns {Promise<Array<object>>}
 */
export async function getHistorialNotificaciones(limit = 50) {
  const { data } = await client.get('/notificaciones', { params: { limit } })
  return data
}

/**
 * Current user's inbox.
 * GET /api/v1/notificaciones/mias
 * @returns {Promise<{ no_leidas: number, items: Array<{ id: number, tipo: string, titulo: string, mensaje: string, fecha: string, leida: boolean }> }>}
 */
export async function getMisNotificaciones(limit = 50) {
  const { data } = await client.get('/notificaciones/mias', { params: { limit } })
  return data
}

/**
 * Unread count for the header bell.
 * GET /api/v1/notificaciones/mias/no-leidas
 * @returns {Promise<{ no_leidas: number }>}
 */
export async function getNoLeidas() {
  const { data } = await client.get('/notificaciones/mias/no-leidas')
  return data
}

/** POST /api/v1/notificaciones/mias/{id}/leer */
export async function marcarLeida(id) {
  const { data } = await client.post(`/notificaciones/mias/${id}/leer`)
  return data
}

/** POST /api/v1/notificaciones/mias/leer-todas */
export async function marcarTodasLeidas() {
  const { data } = await client.post('/notificaciones/mias/leer-todas')
  return data
}
