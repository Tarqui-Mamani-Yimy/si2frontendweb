import { client } from './client'

/** Obtiene las estadísticas de resumen para el dashboard del admin. */
export async function fetchAdminStats() {
  const { data } = await client.get('/admin/stats')
  return data
}

/**
 * Obtiene los registros de la bitácora de auditoría.
 * @param {Object} params
 * @param {number} [params.limite=50]
 * @param {number} [params.offset=0]
 * @param {string} [params.modulo] - Filtrar por módulo
 */
export async function fetchBitacora({ limite = 50, offset = 0, modulo } = {}) {
  const params = { limite, offset }
  if (modulo) params.modulo = modulo
  const { data } = await client.get('/admin/bitacora', { params })
  return data
}

/** Obtiene los módulos disponibles en la bitácora (dinámico desde BD). */
export async function fetchModulos() {
  const { data } = await client.get('/admin/modulos')
  return data
}

/** Registra un nuevo usuario administrativo dentro de la cooperativa. */
export async function registrarUsuario(datosUsuario) {
  const { data } = await client.post('/admin/usuarios', datosUsuario)
  return data
}

export async function listUsuarios({ estado } = {}) {
  const { data } = await client.get('/admin/usuarios', { params: estado ? { estado } : undefined })
  return data
}

export async function updateUsuario(id, payload) {
  const { data } = await client.put(`/admin/usuarios/${id}`, payload)
  return data
}

export async function deactivateUsuario(id) {
  const { data } = await client.delete(`/admin/usuarios/${id}`)
  return data
}

export async function reactivateUsuario(id) {
  const { data } = await client.post(`/admin/usuarios/${id}/reactivar`)
  return data
}

export async function listRoles() {
  const { data } = await client.get('/admin/roles')
  return data
}

export async function createRole(payload) {
  const { data } = await client.post('/admin/roles', payload)
  return data
}

export async function updateRole(id, payload) {
  const { data } = await client.put(`/admin/roles/${id}`, payload)
  return data
}

export async function deleteRole(id) {
  await client.delete(`/admin/roles/${id}`)
}

export async function listPermisos() {
  const { data } = await client.get('/admin/permisos')
  return data
}

/** Registra un nuevo socio (KYC). */
export async function registrarSocio(datosSocio) {
  const { data } = await client.post('/socios/registro', datosSocio)
  return data
}

/**
 * Lista los socios registrados (SSD Flujo 2, paso 6: "actualiza lista de socios").
 * @param {Object} params
 * @param {number} [params.limite=50]
 * @param {number} [params.offset=0]
 */
export async function fetchSocios({ limite = 50, offset = 0 } = {}) {
  const params = { limite, offset }
  const { data } = await client.get('/socios/', { params })
  return data
}
