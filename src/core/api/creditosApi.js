import { client } from './client'

/**
 * Listar productos crediticios de la cooperativa.
 * GET /api/v1/creditos/productos?estado=ACTIVO|INACTIVO
 * @param {{ estado?: 'ACTIVO' | 'INACTIVO' }} params
 * @returns {Promise<Array<object>>}
 */
export async function getProductosCredito(params = {}) {
  const { data } = await client.get('/creditos/productos', { params })
  return data
}

/**
 * Obtener detalle de un producto crediticio.
 * GET /api/v1/creditos/productos/{id}
 * @param {number|string} id
 * @returns {Promise<object>}
 */
export async function getProductoCredito(id) {
  const { data } = await client.get(`/creditos/productos/${id}`)
  return data
}

/**
 * Crear un nuevo producto crediticio (solo administradores).
 * POST /api/v1/creditos/productos
 * @param {object} payload
 * @returns {Promise<object>}
 */
export async function crearProductoCredito(payload) {
  const { data } = await client.post('/creditos/productos', payload)
  return data
}

/**
 * Actualizar campos de un producto crediticio existente (solo administradores, código inmutable).
 * PUT /api/v1/creditos/productos/{id}
 * @param {number|string} id
 * @param {object} payload
 * @returns {Promise<object>}
 */
export async function actualizarProductoCredito(id, payload) {
  const { data } = await client.put(`/creditos/productos/${id}`, payload)
  return data
}

/**
 * Cambiar el estado operativo de un producto crediticio (solo administradores).
 * PATCH /api/v1/creditos/productos/{id}/estado
 * @param {number|string} id
 * @param {'ACTIVO'|'INACTIVO'} estado
 * @returns {Promise<object>}
 */
export async function cambiarEstadoProductoCredito(id, estado) {
  const { data } = await client.patch(`/creditos/productos/${id}/estado`, { estado })
  return data
}

/**
 * Listar monedas configuradas en el sistema para asignación de productos.
 * GET /api/v1/ahorros/monedas
 * @returns {Promise<Array<{id: number, codigo_iso: string, nombre: string, simbolo: string}>>}
 */
export async function listMonedas() {
  const { data } = await client.get('/ahorros/monedas')
  return data
}

/**
 * Buscar socios activos de la cooperativa para originación de crédito.
 * GET /api/v1/creditos/socios/buscar?q=
 * @param {string} q Prefijo de CI o nombre/apellido (mín. 3 caracteres)
 * @returns {Promise<Array<{id: number, nombre_completo: string, ci: string, estado: string}>>}
 */
export async function buscarSociosCredito(q) {
  const { data } = await client.get('/creditos/socios/buscar', {
    params: { q },
  })
  return data
}

/**
 * Simular cuota, capacidad de pago y relación cuota/ingreso de una solicitud de crédito.
 * POST /api/v1/creditos/solicitudes/simulacion
 * @param {{
 *   producto_id: number,
 *   monto: number|string,
 *   plazo_meses: number,
 *   ingreso_mensual?: number|string,
 *   egreso_mensual?: number|string,
 *   cuota_deudas_mensual?: number|string
 * }} payload
 * @returns {Promise<{
 *   producto: object,
 *   moneda: object,
 *   monto: string,
 *   plazo_meses: number,
 *   tasa_interes: string,
 *   cuota_estimada: string,
 *   total_intereses_estimado: string,
 *   capacidad_pago: string|null,
 *   relacion_cuota_ingreso: string|null,
 *   relacion_maxima: string,
 *   supera_relacion_maxima: boolean|null,
 *   dentro_de_rangos: boolean,
 *   errores: Array<string>
 * }>}
 */
export async function simularSolicitudCredito(payload) {
  const { data } = await client.post('/creditos/solicitudes/simulacion', payload)
  return data
}

/**
 * Registrar una nueva solicitud de crédito (estado PENDIENTE).
 * POST /api/v1/creditos/solicitudes
 * @param {object} payload
 * @returns {Promise<object>}
 */
export async function crearSolicitudCredito(payload) {
  const { data } = await client.post('/creditos/solicitudes', payload)
  return data
}

/**
 * Listar solicitudes de crédito de la cooperativa.
 * GET /api/v1/creditos/solicitudes?estado=&socio_ci=&desde=&hasta=
 * @param {{ estado?: string, socio_ci?: string, desde?: string, hasta?: string }} params
 * @returns {Promise<Array<object>>}
 */
export async function listSolicitudesCredito(params = {}) {
  const { data } = await client.get('/creditos/solicitudes', { params })
  return data
}

/**
 * Obtener detalle de una solicitud de crédito.
 * GET /api/v1/creditos/solicitudes/{id}
 * @param {number|string} id
 * @returns {Promise<object>}
 */
export async function getSolicitudCredito(id) {
  const { data } = await client.get(`/creditos/solicitudes/${id}`)
  return data
}

/**
 * Actualizar una solicitud de crédito en estado PENDIENTE u OBSERVADA.
 * PUT /api/v1/creditos/solicitudes/{id}
 * @param {number|string} id
 * @param {object} payload
 * @returns {Promise<object>}
 */
export async function actualizarSolicitudCredito(id, payload) {
  const { data } = await client.put(`/creditos/solicitudes/${id}`, payload)
  return data
}

/**
 * Anular una solicitud de crédito en estado PENDIENTE u OBSERVADA con justificación.
 * PATCH /api/v1/creditos/solicitudes/{id}/anulacion
 * @param {number|string} id
 * @param {string} motivo Justificación de la anulación (mín. 5 caracteres)
 * @returns {Promise<object>}
 */
export async function anularSolicitudCredito(id, motivo) {
  const { data } = await client.patch(`/creditos/solicitudes/${id}/anulacion`, { motivo })
  return data
}

/**
 * Ejecutar la evaluación de scoring crediticio y dictamen automático (CU-W23).
 * POST /api/v1/creditos/solicitudes/{id}/evaluacion
 * @param {number|string} id
 * @returns {Promise<object>} EvaluacionCrediticiaOut
 */
export async function evaluarSolicitud(id) {
  const { data } = await client.post(`/creditos/solicitudes/${id}/evaluacion`)
  return data
}

/**
 * Listar el historial de evaluaciones de scoring crediticio de una solicitud (más reciente primero).
 * GET /api/v1/creditos/solicitudes/{id}/evaluaciones
 * @param {number|string} id
 * @returns {Promise<Array<object>>} List[EvaluacionCrediticiaOut]
 */
export async function listarEvaluaciones(id) {
  const { data } = await client.get(`/creditos/solicitudes/${id}/evaluaciones`)
  return data
}

/**
 * Resolver una solicitud en REVISIÓN MANUAL por parte de un Administrador (CU-W23).
 * POST /api/v1/creditos/solicitudes/{id}/resolucion
 * @param {number|string} id
 * @param {{ decision: 'APROBADO' | 'RECHAZADO', justificacion: string }} payload
 * @returns {Promise<object>} EvaluacionCrediticiaOut
 */
export async function resolverSolicitud(id, payload) {
  const { data } = await client.post(`/creditos/solicitudes/${id}/resolucion`, payload)
  return data
}

