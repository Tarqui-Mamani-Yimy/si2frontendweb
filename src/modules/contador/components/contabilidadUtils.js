/**
 * Financial and accounting utilities for CU-W30 (Comprobantes y Asientos Contables).
 */

/**
 * Convert string or numeric amount to integer cents to guarantee exact arithmetic.
 * e.g. "125.50" -> 12550, 45.1 -> 4510
 * @param {string|number|null|undefined} val
 * @returns {number} Integer cents
 */
export function toCents(val) {
  if (val == null || val === '') return 0
  const str = String(val).trim().replace(',', '.')
  const num = parseFloat(str)
  if (isNaN(num)) return 0
  return Math.round(num * 100)
}

/**
 * Format integer cents back to standard decimal string with 2 decimals.
 * e.g. 12550 -> "125.50"
 * @param {number} cents
 * @returns {string}
 */
export function fromCents(cents) {
  const safe = typeof cents === 'number' ? cents : 0
  return (safe / 100).toFixed(2)
}

/**
 * Format money string or number for UI display.
 * @param {string|number} val
 * @param {string} [simbolo='Bs.']
 * @returns {string}
 */
export function formatMoney(val, simbolo = 'Bs.') {
  const cents = toCents(val)
  const formatted = (cents / 100).toLocaleString('es-BO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return `${simbolo} ${formatted}`
}

/**
 * Format ISO date string to DD/MM/YYYY.
 * @param {string} isoStr
 * @returns {string}
 */
export function formatDate(isoStr) {
  if (!isoStr) return '—'
  const parts = String(isoStr).split('T')[0].split('-')
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`
  }
  return isoStr
}

export const TIPO_COMPROBANTE_CONFIG = {
  INGRESO: {
    label: 'Ingreso',
    badgeVariant: 'green',
    icon: 'arrow_downward',
    color: 'text-emerald-700',
  },
  EGRESO: {
    label: 'Egreso',
    badgeVariant: 'rose',
    icon: 'arrow_upward',
    color: 'text-rose-700',
  },
  TRASPASO: {
    label: 'Traspaso',
    badgeVariant: 'navy',
    icon: 'sync_alt',
    color: 'text-indigo-700',
  },
}

export const ESTADO_COMPROBANTE_CONFIG = {
  REGISTRADO: {
    label: 'Registrado',
    badgeVariant: 'teal',
  },
  ANULADO: {
    label: 'Anulado',
    badgeVariant: 'red',
  },
}

export const ORIGEN_COMPROBANTE_CONFIG = {
  MANUAL: {
    label: 'Manual',
    badgeVariant: 'slate',
  },
  AUTOMATICO: {
    label: 'Automático',
    badgeVariant: 'purple',
  },
}

export const MONEDAS_DISPONIBLES = [
  { id: 1, codigo: 'BOB', nombre: 'Bolivianos (BOB)', simbolo: 'Bs.' },
  { id: 2, codigo: 'USD', nombre: 'Dólares Americanos (USD)', simbolo: '$' },
]

export function getMonedaSimbolo(monedaId) {
  return Number(monedaId) === 2 ? '$' : 'Bs.'
}

export function getTodayIso() {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function getFirstDayOfMonthIso() {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}-01`
}

/**
 * Trigger file download from blob or response data with optional filename extraction.
 * @param {Blob|any} data
 * @param {string} defaultFilename
 * @param {string} [contentDisposition]
 */
export function triggerCsvDownload(data, defaultFilename, contentDisposition) {
  let filename = defaultFilename
  if (contentDisposition) {
    const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)
    if (utf8Match && utf8Match[1]) {
      filename = decodeURIComponent(utf8Match[1])
    } else {
      const match = contentDisposition.match(/filename=["']?([^"';]+)["']?/i)
      if (match && match[1]) {
        filename = match[1].trim()
      }
    }
  }

  const blob = data instanceof Blob ? data : new Blob([data], { type: 'text/csv;charset=utf-8;' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}
