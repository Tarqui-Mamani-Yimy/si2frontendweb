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
