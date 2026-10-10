import { client } from './client'

/**
 * Trigger a new manual backup.
 * @returns {Promise<Object>}
 */
export async function createBackup() {
  const { data } = await client.post('/backups')
  return data
}

/**
 * List backups with optional filters.
 * @param {Object} [params]
 * @param {'MANUAL' | 'AUTOMATICO'} [params.tipo]
 * @param {'EN_PROCESO' | 'COMPLETADO' | 'FALLIDO'} [params.estado]
 * @returns {Promise<Array>}
 */
export async function listBackups({ tipo, estado } = {}) {
  const params = {}
  if (tipo) params.tipo = tipo
  if (estado) params.estado = estado

  const { data } = await client.get('/backups', {
    params: Object.keys(params).length > 0 ? params : undefined,
  })
  return data
}

/**
 * Get details for a specific backup.
 * @param {number|string} id
 * @returns {Promise<Object>}
 */
export async function getBackup(id) {
  const { data } = await client.get(`/backups/${id}`)
  return data
}

/**
 * Get the temporary download link for a completed backup.
 * @param {number|string} id
 * @returns {Promise<{ url: string, expira_en: string }>}
 */
export async function getBackupDownload(id) {
  const { data } = await client.get(`/backups/${id}/descarga`)
  return data
}
