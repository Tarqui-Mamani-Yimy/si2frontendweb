import { toCents } from '../../../contador/components/contabilidadUtils.js'

/**
 * Pure helper functions for calculations, percentages, and SVG chart geometry in reports (CU-W33).
 */

export const DEFAULT_PALETTE = [
  '#064e3b', // Primary emerald
  '#0d9488', // Teal
  '#0284c7', // Sky blue
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#d97706', // Amber
  '#e11d48', // Rose
  '#475569', // Slate
]

/**
 * Calculate numeric percentage of part relative to total.
 * @param {string|number|null|undefined} part
 * @param {string|number|null|undefined} total
 * @param {number} [decimals=1]
 * @returns {number}
 */
export function calculatePercentage(part, total, decimals = 1) {
  const centsPart = toCents(part)
  const centsTotal = toCents(total)
  if (centsTotal <= 0 || centsPart <= 0) return 0
  const factor = Math.pow(10, decimals)
  return Math.round((centsPart / centsTotal) * 100 * factor) / factor
}

/**
 * Format a number or numeric string as a percentage string (e.g. "12.50%").
 * @param {string|number|null|undefined} val
 * @param {number} [decimals=2]
 * @returns {string}
 */
export function formatPercent(val, decimals = 2) {
  if (val === null || val === undefined || val === '') return '—'
  const num = typeof val === 'number' ? val : parseFloat(String(val).replace(',', '.'))
  if (isNaN(num)) return '—'
  return `${num.toFixed(decimals)}%`
}

/**
 * Calculate bar width percentage (0 to 100) relative to max value.
 * @param {string|number|null|undefined} value
 * @param {string|number|null|undefined} maxValue
 * @returns {number} Width percentage between 0 and 100
 */
export function calculateBarWidth(value, maxValue) {
  const valCents = Math.max(0, toCents(value))
  const maxCents = toCents(maxValue)
  if (maxCents <= 0 || valCents <= 0) return 0
  const pct = (valCents / maxCents) * 100
  return Math.min(100, Math.round(pct * 10) / 10)
}

/**
 * Compute SVG circle stroke-dasharray and stroke-dashoffset for a donut chart.
 * @param {Array<{label: string, value: string|number, color?: string}>} slices
 * @param {number} [radius=50]
 * @returns {{
 *   total: number,
 *   circumference: number,
 *   segments: Array<{
 *     label: string,
 *     value: string|number,
 *     color: string,
 *     percentage: number,
 *     strokeDasharray: string,
 *     strokeDashoffset: number
 *   }>
 * }}
 */
export function computeDonutSegments(slices = [], radius = 50) {
  const circumference = 2 * Math.PI * radius
  const totalCents = slices.reduce((acc, s) => acc + Math.max(0, toCents(s.value)), 0)

  if (totalCents <= 0) {
    return {
      total: 0,
      circumference,
      segments: [],
    }
  }

  let accumulatedOffset = 0
  const segments = slices.map((s, idx) => {
    const valCents = Math.max(0, toCents(s.value))
    const fraction = valCents / totalCents
    const percentage = Math.round(fraction * 1000) / 10
    const dashLength = fraction * circumference
    const color = s.color || DEFAULT_PALETTE[idx % DEFAULT_PALETTE.length]

    const strokeDasharray = `${dashLength.toFixed(2)} ${(circumference - dashLength).toFixed(2)}`
    const strokeDashoffset = accumulatedOffset === 0 ? 0 : -accumulatedOffset

    accumulatedOffset += dashLength

    return {
      ...s,
      color,
      percentage,
      strokeDasharray,
      strokeDashoffset,
    }
  })

  return {
    total: totalCents / 100,
    circumference,
    segments,
  }
}

/**
 * Format indicator value or return fallback with reason.
 * @param {number|string|null|undefined} valor
 * @param {string} [unidad='%']
 * @returns {string|null}
 */
export function formatIndicatorValue(valor, unidad = '%') {
  if (valor === null || valor === undefined || valor === '') return null
  const num = typeof valor === 'number' ? valor : parseFloat(String(valor).replace(',', '.'))
  if (isNaN(num)) return null
  return `${num.toFixed(2)} ${unidad}`.trim()
}

/**
 * Determine risk level badge variant for mora index.
 * @param {number|string|null|undefined} indice
 * @returns {'green'|'amber'|'red'|'slate'}
 */
export function getMoraBadgeVariant(indice) {
  if (indice === null || indice === undefined || indice === '') return 'slate'
  const num = typeof indice === 'number' ? indice : parseFloat(String(indice).replace(',', '.'))
  if (isNaN(num)) return 'slate'
  if (num <= 3) return 'green'
  if (num <= 5) return 'amber'
  return 'red'
}
