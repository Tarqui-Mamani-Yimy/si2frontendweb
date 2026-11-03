/**
 * Pure helpers for the voice-command report generator.
 */

export const FORMATOS_REPORTE = [
  { id: 'pdf', label: 'PDF', icon: 'picture_as_pdf', openType: 'application/pdf' },
  { id: 'csv', label: 'CSV', icon: 'table_view', openType: 'text/plain;charset=utf-8' },
  { id: 'html', label: 'HTML', icon: 'html', openType: 'text/html;charset=utf-8' },
]

/** Report tabs on the Reportes page that a voice result can sync with. */
const TAB_POR_TIPO = {
  'resumen-ejecutivo': 'resumen',
  cartera: 'cartera',
  mora: 'cartera',
  captaciones: 'captaciones',
  indicadores: 'indicadores',
}

/**
 * Speech recognition constructor available in this browser (Chrome/Edge expose
 * the prefixed one), or null when voice input is unsupported (e.g. Firefox).
 */
export function getSpeechRecognition(scope = globalThis) {
  return scope?.SpeechRecognition ?? scope?.webkitSpeechRecognition ?? null
}

/** Joins the transcripts of a SpeechRecognition results list. */
export function joinTranscript(results) {
  return Array.from(results ?? [], (result) => result?.[0]?.transcript ?? '')
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Spanish message for a SpeechRecognition error code. */
export function speechErrorMessage(code) {
  switch (code) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'El navegador bloqueó el micrófono. Permite el acceso al micrófono e inténtalo de nuevo.'
    case 'no-speech':
      return 'No escuché ningún comando. Pulsa «Hablar» e inténtalo de nuevo.'
    case 'audio-capture':
      return 'No se encontró un micrófono conectado.'
    case 'network':
      return 'El reconocimiento de voz necesita conexión a internet.'
    case 'aborted':
      return ''
    default:
      return 'No se pudo reconocer la voz. Inténtalo de nuevo o escribe el comando.'
  }
}

/** Filename from a Content-Disposition header, or the fallback. */
export function filenameFromDisposition(contentDisposition, fallback) {
  if (!contentDisposition) return fallback
  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)
  if (utf8Match?.[1]) return decodeURIComponent(utf8Match[1])
  const match = contentDisposition.match(/filename=["']?([^"';]+)["']?/i)
  return match?.[1]?.trim() || fallback
}

/** Page filters (tab, cutoff date, currency) implied by an interpreted command. */
export function filtrosDesdeComando(result) {
  const tab = TAB_POR_TIPO[result?.tipo]
  if (!tab) return null
  return {
    tab,
    fechaCorte: result.parametros?.fecha_corte ?? null,
    monedaId: result.parametros?.moneda_id ?? null,
  }
}

/**
 * Error message from a failed blob request: FastAPI still answers JSON
 * ({detail}) but axios hands it over as a Blob.
 */
export async function blobErrorMessage(err, fallback) {
  const data = err?.response?.data
  if (data && typeof data.text === 'function') {
    try {
      const detail = JSON.parse(await data.text())?.detail
      if (typeof detail === 'string') return detail
    } catch {
      // Not JSON: fall through to the generic message.
    }
  }
  return fallback
}
