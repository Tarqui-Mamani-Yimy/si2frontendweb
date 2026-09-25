import { client } from './client'

/**
 * Listar cajas pertenecientes a la cooperativa del usuario cajero.
 * GET /api/v1/caja/cajas
 * @returns {Promise<Array<{id: number, nombre: string, estado: string, monto_maximo_efectivo: number|string}>>}
 */
export async function listCajas() {
  const { data } = await client.get('/caja/cajas')
  return data
}

/**
 * Obtener la sesión activa de caja del usuario actual.
 * GET /api/v1/caja/sesion-actual
 * @returns {Promise<{id: number, caja_id: number, caja_nombre: string, monto_apertura: number|string, saldo_sistema: number|string, fecha_apertura: string, estado: string}|null>}
 */
export async function getSesionActual() {
  try {
    const { data } = await client.get('/caja/sesion-actual')
    return data
  } catch (error) {
    if (error.response?.status === 404) {
      return null
    }
    throw error
  }
}

/**
 * Abrir turno/sesión de caja con monto inicial en efectivo.
 * POST /api/v1/caja/aperturas
 * @param {{caja_id: number, monto_apertura: number|string}} payload
 */
export async function abrirCaja(payload) {
  const { data } = await client.post('/caja/aperturas', payload)
  return data
}

/**
 * Buscar cuentas de ahorro por número de cuenta o CI de socio.
 * GET /api/v1/caja/cuentas/buscar?q=<query>
 * @param {string} query
 */
export async function buscarCuentas(query) {
  const { data } = await client.get('/caja/cuentas/buscar', {
    params: { q: query },
  })
  return data
}

/**
 * Registrar depósito en efectivo en ventanilla.
 * POST /api/v1/caja/depositos
 * @param {{cuenta_id: number, monto: number|string, depositante_nombre: string, depositante_ci: string}} payload
 */
export async function procesarDeposito(payload) {
  const { data } = await client.post('/caja/depositos', payload)
  return data
}

/**
 * Obtener vista previa de transferencia interna entre dos cuentas.
 * GET /api/v1/caja/transferencias/preview?origen=<num>&destino=<num>
 * @param {{origen: string, destino: string}} params
 */
export async function previewTransferencia({ origen, destino }) {
  const { data } = await client.get('/caja/transferencias/preview', {
    params: { origen, destino },
  })
  return data
}

/**
 * Ejecutar transferencia interna entre cuentas en ventanilla.
 * POST /api/v1/caja/transferencias
 * @param {{cuenta_origen_id: number, cuenta_destino_id: number, monto: number|string, glosa?: string}} payload
 */
export async function procesarTransferencia(payload) {
  const { data } = await client.post('/caja/transferencias', payload)
  return data
}

/**
 * Obtener resumen de arqueo con saldos teóricos por moneda y desglose de denominaciones.
 * GET /api/v1/caja/arqueos/resumen
 * @returns {Promise<{control_caja_id: number, caja_nombre: string, fecha_apertura: string, umbral_diferencia: string|number, monedas: Array<object>}>}
 */
export async function getResumenArqueo() {
  const { data } = await client.get('/caja/arqueos/resumen')
  return data
}

/**
 * Registrar conteo físico de arqueo y conciliar con saldo teórico.
 * POST /api/v1/caja/arqueos
 * @param {{
 *   monedas: Array<{moneda_id: number, detalle: Array<{denominacion: string|number, cantidad: number}>}>,
 *   observacion?: string,
 *   cerrar_caja?: boolean,
 *   supervisor?: {correo: string, contrasena: string}
 * }} payload
 * @returns {Promise<object>} Hoja de arqueo generada
 */
export async function registrarArqueo(payload) {
  const { data } = await client.post('/caja/arqueos', payload)
  return data
}

/**
 * Obtener detalle de una hoja de arqueo por su identificador.
 * GET /api/v1/caja/arqueos/{id}
 * @param {number|string} id
 * @returns {Promise<object>}
 */
export async function getArqueo(id) {
  const { data } = await client.get(`/caja/arqueos/${id}`)
  return data
}

