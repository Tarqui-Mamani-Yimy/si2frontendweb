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
