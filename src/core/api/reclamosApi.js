import { client } from './client'

/**
 * Módulo de Punto de Reclamo — Ley 393 / Normativa ASFI.
 */

export const TIPOS_RECLAMO = [
  { value: 'CREDITO', label: 'Crédito y Cobranzas' },
  { value: 'AHORRO', label: 'Cuentas de Ahorro y DPF' },
  { value: 'CAJA', label: 'Operaciones de Caja / Ventanilla' },
  { value: 'COBRO_INDEBIDO', label: 'Cobro Indebido o Comisión no Pactada' },
  { value: 'ATENCION', label: 'Atención al Cliente y Trato al Socio' },
  { value: 'OTRO', label: 'Otro Reclamo o Apelación' },
]

export const ESTADOS_RECLAMO = [
  { value: 'REGISTRADO', label: 'Registrado', color: 'navy' },
  { value: 'EN_ATENCION', label: 'En Atención', color: 'amber' },
  { value: 'RESPONDIDO', label: 'Respondido', color: 'teal' },
  { value: 'CERRADO', label: 'Cerrado', color: 'green' },
  { value: 'ESCALADO_ASFI', label: 'Escalado ASFI', color: 'red' },
]

export const CANALES_RECLAMO = [
  { value: 'VENTANILLA', label: 'Ventanilla (Punto de Reclamo)' },
  { value: 'MOVIL', label: 'Banca Móvil' },
]

/**
 * Listar reclamos institucionales (Staff).
 * GET /api/v1/reclamos?estado=&vencido=
 * @param {{ estado?: string, vencido?: boolean|string }} params
 * @returns {Promise<Array<object>>}
 */
export async function listReclamos(params = {}) {
  const cleanParams = {}
  if (params.estado) cleanParams.estado = params.estado
  if (params.vencido !== undefined && params.vencido !== '') {
    cleanParams.vencido = params.vencido
  }
  const { data } = await client.get('/reclamos', { params: cleanParams })
  return data
}

/**
 * Obtener el expediente completo de un reclamo.
 * GET /api/v1/reclamos/{id}
 * @param {number|string} id
 * @returns {Promise<object>}
 */
export async function getReclamo(id) {
  const { data } = await client.get(`/reclamos/${id}`)
  return data
}

/**
 * Registrar un nuevo reclamo por canal VENTANILLA (Staff).
 * POST /api/v1/reclamos
 * @param {{
 *   socio_id: number,
 *   tipo: 'CREDITO'|'AHORRO'|'CAJA'|'COBRO_INDEBIDO'|'ATENCION'|'OTRO',
 *   descripcion: string,
 *   credito_id?: number|null
 * }} payload
 * @returns {Promise<object>}
 */
export async function crearReclamo(payload) {
  const { data } = await client.post('/reclamos', payload)
  return data
}

/**
 * Marcar reclamo en atención y asignar usuario responsable (Staff).
 * REGISTRADO → EN_ATENCION
 * POST /api/v1/reclamos/{id}/atender
 * @param {number|string} id
 * @returns {Promise<object>}
 */
export async function atenderReclamo(id) {
  const { data } = await client.post(`/reclamos/${id}/atender`)
  return data
}

/**
 * Emitir respuesta formal institucional al reclamo del socio (Staff).
 * REGISTRADO | EN_ATENCION → RESPONDIDO
 * POST /api/v1/reclamos/{id}/responder
 * @param {number|string} id
 * @param {{ respuesta: string, procedente: boolean }} payload
 * @returns {Promise<object>}
 */
export async function responderReclamo(id, payload) {
  const { data } = await client.post(`/reclamos/${id}/responder`, payload)
  return data
}

/**
 * Ampliar el plazo legal de respuesta del reclamo (Staff).
 * REGISTRADO | EN_ATENCION → nueva fecha límite y motivo
 * POST /api/v1/reclamos/{id}/ampliar
 * @param {number|string} id
 * @param {{ nueva_fecha: string, motivo: string }} payload
 * @returns {Promise<object>}
 */
export async function ampliarPlazoReclamo(id, payload) {
  const { data } = await client.post(`/reclamos/${id}/ampliar`, payload)
  return data
}
