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

/**
 * Obtener la simulación previa del plan de pagos / cronograma de amortización de una solicitud aprobada (CU-W24).
 * GET /api/v1/creditos/solicitudes/{id}/plan-pagos?fecha_desembolso=&fecha_primer_vencimiento=
 * @param {number|string} solicitudId
 * @param {{ fecha_desembolso?: string, fecha_primer_vencimiento?: string }} params
 * @returns {Promise<object>} PlanPagosOut
 */
export async function getPlanPagos(solicitudId, params = {}) {
  const { data } = await client.get(`/creditos/solicitudes/${solicitudId}/plan-pagos`, { params })
  return data
}

/**
 * Ejecutar el desembolso de un crédito aprobado en cuenta de ahorro o en ventanilla (CU-W26).
 * POST /api/v1/creditos/solicitudes/{id}/desembolso
 * @param {number|string} solicitudId
 * @param {{
 *   modalidad: 'CUENTA' | 'EFECTIVO',
 *   cuenta_ahorro_id?: number,
 *   fecha_primer_vencimiento?: string,
 *   declaracion_uif?: object
 * }} payload
 * @returns {Promise<object>} CreditoDetalleOut
 */
export async function desembolsarSolicitud(solicitudId, payload) {
  const { data } = await client.post(`/creditos/solicitudes/${solicitudId}/desembolso`, payload)
  return data
}

/**
 * Listar la cartera de créditos de la cooperativa.
 * GET /api/v1/creditos/creditos?estado=&socio_ci=
 * @param {{ estado?: string, socio_ci?: string }} params
 * @returns {Promise<Array<object>>} List[CreditoOut]
 */
export async function listarCreditos(params = {}) {
  const { data } = await client.get('/creditos/creditos', { params })
  return data
}

/**
 * Obtener el detalle completo de un crédito, incluyendo su cronograma de amortización y desembolso.
 * GET /api/v1/creditos/creditos/{id}
 * @param {number|string} id
 * @returns {Promise<object>} CreditoDetalleOut
 */
export async function getCredito(id) {
  const { data } = await client.get(`/creditos/creditos/${id}`)
  return data
}

/**
 * Obtener la liquidación de la próxima cuota a cobrar con cálculo de mora y atraso (CU-W27).
 * GET /api/v1/creditos/creditos/{id}/deuda?fecha=YYYY-MM-DD
 * @param {number|string} id
 * @param {{ fecha?: string }} params
 * @returns {Promise<object>} DeudaCuotaOut
 */
export async function getDeudaCredito(id, params = {}) {
  const { data } = await client.get(`/creditos/creditos/${id}/deuda`, { params })
  return data
}

/**
 * Registrar el cobro de la siguiente cuota exigible en efectivo o débito en cuenta (CU-W27).
 * POST /api/v1/creditos/creditos/{id}/pagos
 * @param {number|string} id
 * @param {{
 *   modalidad: 'EFECTIVO' | 'CUENTA',
 *   cuenta_ahorro_id?: number,
 *   declaracion_uif?: object
 * }} payload
 * @returns {Promise<object>} PagoOut
 */
export async function pagarCuota(id, payload) {
  const { data } = await client.post(`/creditos/creditos/${id}/pagos`, payload)
  return data
}

/**
 * Listar el historial de pagos efectuados sobre un crédito (CU-W27).
 * GET /api/v1/creditos/creditos/{id}/pagos
 * @param {number|string} id
 * @returns {Promise<Array<object>>} List[PagoOut]
 */
export async function listarPagos(id) {
  const { data } = await client.get(`/creditos/creditos/${id}/pagos`)
  return data
}

/**
 * Obtener el detalle de un pago específico para reimpresión de comprobante (CU-W27).
 * GET /api/v1/creditos/pagos/{id}
 * @param {number|string} id
 * @returns {Promise<object>} PagoOut
 */
export async function getPago(id) {
  const { data } = await client.get(`/creditos/pagos/${id}`)
  return data
}

/**
 * Ejecutar la actualización masiva de morosidad para todos los créditos vigentes de la cooperativa (CU-W27).
 * POST /api/v1/creditos/mora/actualizar
 * @returns {Promise<{ actualizados: number, en_mora: number, al_dia: number, fecha: string }>}
 */
export async function actualizarMora() {
  const { data } = await client.post('/creditos/mora/actualizar')
  return data
}

/**
 * Listar los créditos en mora o al día para seguimiento de cartera en riesgo (CU-W27).
 * GET /api/v1/creditos/mora?estado=EN_MORA|AL_DIA
 * @param {{ estado?: 'EN_MORA' | 'AL_DIA' }} params
 * @returns {Promise<Array<object>>} List[MoraCreditoOut]
 */
export async function listarMora(params = {}) {
  const queryParams = {}
  if (params?.estado) queryParams.estado = params.estado
  const { data } = await client.get('/creditos/mora', { params: queryParams })
  return data
}

/**
 * Generar ofertas de re-crédito proactivas para socios con buen comportamiento de pago (CU-W23 p2).
 * POST /api/v1/creditos/recreditos/generar
 * @returns {Promise<{ generadas: number, omitidas: number, ofertas: Array<object> }>}
 */
export async function generarRecreditos() {
  const { data } = await client.post('/creditos/recreditos/generar')
  return data
}

/**
 * Listar ofertas de re-crédito registradas en la cooperativa (CU-W23 p2).
 * GET /api/v1/creditos/recreditos?estado=VIGENTE|ACEPTADA|DESCARTADA|EXPIRADA
 * @param {{ estado?: string }} params
 * @returns {Promise<Array<object>>} List[OfertaOut]
 */
export async function listarRecreditos(params = {}) {
  const queryParams = {}
  if (params?.estado) queryParams.estado = params.estado
  const { data } = await client.get('/creditos/recreditos', { params: queryParams })
  return data
}

/**
 * Aceptar una oferta de re-crédito preaprobada generando una solicitud de crédito en estado PENDIENTE (CU-W23 p2).
 * POST /api/v1/creditos/recreditos/{id}/aceptar
 * @param {number|string} id
 * @returns {Promise<{ oferta: object, solicitud: object }>}
 */
export async function aceptarRecredito(id) {
  const { data } = await client.post(`/creditos/recreditos/${id}/aceptar`)
  return data
}

/**
 * Descartar una oferta de re-crédito con justificación formal (CU-W23 p2).
 * POST /api/v1/creditos/recreditos/{id}/descartar
 * @param {number|string} id
 * @param {{ motivo: string }} payload
 * @returns {Promise<object>} OfertaOut
 */
export async function descartarRecredito(id, payload) {
  const { data } = await client.post(`/creditos/recreditos/${id}/descartar`, payload)
  return data
}

/**
 * Consultar la ficha técnica / model card del modelo de probabilidad de mora (CU-W23 p2).
 * GET /api/v1/creditos/modelo-mora
 * @returns {Promise<{
 *   version: string,
 *   dataset: string,
 *   descripcion_dataset: string,
 *   n_muestras: number,
 *   semilla: number,
 *   metricas: { auc: number, accuracy: number },
 *   features: Array<{ nombre: string, descripcion: string, coeficiente: number }>,
 *   umbrales: { bajo: number, medio: number },
 *   advertencia: string
 * }>}
 */
export async function getModeloMora() {
  const { data } = await client.get('/creditos/modelo-mora')
  return data
}

/**
 * Ejecutar la predicción masiva de morosidad con modelo sintético para los créditos vigentes (CU-W23 p2).
 * POST /api/v1/creditos/mora/prediccion
 * @returns {Promise<{ actualizados: number, bajo: number, medio: number, alto: number }>}
 */
export async function predecirMoraCartera() {
  const { data } = await client.post('/creditos/mora/prediccion')
  return data
}

/**
 * Obtener la explicación en lenguaje natural del dictamen crediticio (CU-W23 p2).
 * GET /api/v1/creditos/evaluaciones/{id}/explicacion
 * @param {number|string} id
 * @returns {Promise<{
 *   fuente: 'PLANTILLA' | 'LLM',
 *   texto: string,
 *   nivel_riesgo: string|null,
 *   probabilidad_mora: number|null
 * }>}
 */
export async function getExplicacionDictamen(id) {
  const { data } = await client.get(`/creditos/evaluaciones/${id}/explicacion`)
  return data
}




