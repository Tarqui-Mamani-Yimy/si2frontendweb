import { client } from './client'

const API_PREFIX = '/api/v1'
const DEFAULT_FILENAME = 'reporte.pdf'
// El backend puede tardar en responder cuando el LLM está configurado o la
// instancia gratuita está despertando; el timeout global de 15 s es muy corto.
const REQUEST_TIMEOUT_MS = 30000

export async function enviarMensaje(mensaje, historial = []) {
  const { data } = await client.post(
    '/chatbot/chat',
    { mensaje, historial },
    { timeout: REQUEST_TIMEOUT_MS },
  )
  return data
}

export async function transcribirAudio(audio) {
  const formData = new FormData()
  formData.append('audio', audio, 'consulta')
  const { data } = await client.post('/chatbot/transcribir', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: REQUEST_TIMEOUT_MS,
  })
  return data.texto
}

function filenameDesdeDisposicion(disposition) {
  if (!disposition) return null
  const utf8 = disposition.match(/filename\*=UTF-8''([^;]+)/i)
  if (utf8?.[1]) return decodeURIComponent(utf8[1])
  const plain = disposition.match(/filename=["']?([^"';]+)["']?/i)
  return plain?.[1]?.trim() || null
}

async function detalleDeError(response) {
  const data = response?.data
  if (!data) return null
  const texto = typeof data === 'string' ? data : await data.text?.()
  if (!texto) return null
  try {
    const detalle = JSON.parse(texto)?.detail
    return typeof detalle === 'string' ? detalle : null
  } catch {
    return null
  }
}

/**
 * Descarga un reporte ofrecido por el chatbot (PDF, CSV o HTML según su URL).
 * @param {{url: string, filename?: string}} reporte
 * @returns {Promise<string>} nombre del archivo descargado
 */
export async function descargarReporte(reporte) {
  if (!reporte?.url) throw new Error('El reporte no tiene enlace de descarga')

  const url = reporte.url.startsWith(API_PREFIX) ? reporte.url.slice(API_PREFIX.length) : reporte.url

  let response
  try {
    response = await client.get(url, { responseType: 'blob', timeout: REQUEST_TIMEOUT_MS })
  } catch (error) {
    const detalle = await detalleDeError(error?.response)
    throw new Error(detalle ?? 'No se pudo generar el reporte')
  }

  const filename =
    filenameDesdeDisposicion(response.headers['content-disposition']) ??
    reporte.filename ??
    DEFAULT_FILENAME
  const blob = response.data instanceof Blob
    ? response.data
    : new Blob([response.data], { type: 'application/pdf' })
  const objectUrl = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(objectUrl)
  return filename
}
