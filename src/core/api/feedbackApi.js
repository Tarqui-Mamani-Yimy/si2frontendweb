import { client } from './client'

/**
 * Feedback CRM API client.
 * Socios rate services; staff reviews ratings and statistics.
 */

export const SERVICIOS_FEEDBACK = [
  { id: 'CREDITO', label: 'Crédito' },
  { id: 'AHORRO', label: 'Ahorro' },
  { id: 'CAJA', label: 'Caja y Ventanilla' },
  { id: 'ATENCION', label: 'Atención al Cliente' },
  { id: 'APP_MOVIL', label: 'Banca Móvil' },
  { id: 'OTRO', label: 'Otro' },
]

/**
 * Submit feedback / rating for a service (Socio).
 * POST /api/v1/feedback
 * @param {{
 *   servicio: 'CREDITO' | 'AHORRO' | 'CAJA' | 'ATENCION' | 'APP_MOVIL' | 'OTRO',
 *   calificacion: number, // 1-5
 *   recomendaria?: number | null, // 0-10
 *   comentario?: string | null,
 *   canal?: 'WEB' | 'MOVIL'
 * }} body
 * @returns {Promise<{ id: number, servicio: string, calificacion: number, recomendaria: number | null, comentario: string | null, canal: string, fecha: string }>}
 */
export async function calificarServicio(body) {
  const { data } = await client.post('/feedback', {
    ...body,
    canal: body.canal || 'WEB',
  })
  return data
}

/**
 * List own feedback ratings (Socio).
 * GET /api/v1/feedback/mias
 * @returns {Promise<Array<{ id: number, servicio: string, calificacion: number, recomendaria: number | null, comentario: string | null, canal: string, fecha: string }>>}
 */
export async function getMisCalificaciones() {
  const { data } = await client.get('/feedback/mias')
  return data
}

/**
 * List all feedback received in cooperative (Staff).
 * GET /api/v1/feedback
 * @param {{
 *   servicio?: string,
 *   calificacion?: number,
 *   desde?: string,
 *   hasta?: string,
 *   limit?: number
 * }} [params]
 * @returns {Promise<Array<{ id: number, servicio: string, calificacion: number, recomendaria: number | null, comentario: string | null, canal: string, fecha: string, socio_id: number, socio: string }>>}
 */
export async function getFeedbackList(params = {}) {
  const cleanParams = {}
  if (params.servicio) cleanParams.servicio = params.servicio
  if (params.calificacion) cleanParams.calificacion = params.calificacion
  if (params.desde) cleanParams.desde = params.desde
  if (params.hasta) cleanParams.hasta = params.hasta
  if (params.limit) cleanParams.limit = params.limit

  const { data } = await client.get('/feedback', { params: cleanParams })
  return data
}

/**
 * Get feedback statistics and NPS (Staff).
 * GET /api/v1/feedback/estadisticas
 * @param {{
 *   servicio?: string,
 *   calificacion?: number,
 *   desde?: string,
 *   hasta?: string
 * }} [params]
 * @returns {Promise<{
 *   total: number,
 *   promedio: number | null,
 *   distribucion: { '1': number, '2': number, '3': number, '4': number, '5': number },
 *   nps: { respuestas: number, promotores: number, pasivos: number, detractores: number, score: number | null },
 *   por_servicio: Array<{ servicio: string, total: number, promedio: number | null }>,
 *   tendencia_mensual: Array<{ mes: string, total: number, promedio: number | null }>,
 *   ultimos_comentarios: Array<{ id: number, servicio: string, calificacion: number, recomendaria: number | null, comentario: string, canal: string, fecha: string, socio_id: number, socio: string }>
 * }>}
 */
export async function getFeedbackEstadisticas(params = {}) {
  const cleanParams = {}
  if (params.servicio) cleanParams.servicio = params.servicio
  if (params.calificacion) cleanParams.calificacion = params.calificacion
  if (params.desde) cleanParams.desde = params.desde
  if (params.hasta) cleanParams.hasta = params.hasta

  const { data } = await client.get('/feedback/estadisticas', { params: cleanParams })
  return data
}
