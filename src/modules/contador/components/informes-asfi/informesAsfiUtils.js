import { toCents, fromCents } from '../contabilidadUtils.js'

/**
 * Pure utility functions and domain logic for ASFI Regulatory Reports (CU-W34).
 */

export const ASFI_TIPOS_CREDITO = [
  { value: 'MICROCREDITO', label: 'Microcrédito (Art. 8.1)', shortLabel: 'Microcrédito' },
  { value: 'MICROCREDITO_AGROPECUARIO', label: 'Microcrédito Agropecuario (Art. 8.2)', shortLabel: 'Micro Agropecuario' },
  { value: 'CONSUMO', label: 'Consumo (Art. 8)', shortLabel: 'Consumo' },
  { value: 'VIVIENDA_HIPOTECARIA', label: 'Vivienda con Garantía Hipotecaria (Art. 7)', shortLabel: 'Vivienda Hipotecaria' },
  { value: 'VIVIENDA_SIN_GARANTIA', label: 'Vivienda sin Garantía Hipotecaria (Art. 7)', shortLabel: 'Vivienda s/Garantía' },
]

export const ASFI_CATEGORIAS = ['A', 'B', 'C', 'D', 'E', 'F']

/**
 * Format ASFI credit type code into a user-friendly label.
 * @param {string|null|undefined} tipo
 * @returns {string}
 */
export function formatTipoCreditoAsfi(tipo) {
  if (!tipo) return 'Sin clasificar'
  const found = ASFI_TIPOS_CREDITO.find((t) => t.value === tipo)
  return found ? found.shortLabel : String(tipo).replace(/_/g, ' ')
}

/**
 * Get visual badge variant corresponding to an ASFI risk category.
 * @param {string|null|undefined} cat
 * @returns {string}
 */
export function getCategoryBadgeVariant(cat) {
  if (!cat) return 'slate'
  const c = String(cat).toUpperCase().trim()
  switch (c) {
    case 'A':
      return 'green'
    case 'B':
      return 'amber'
    case 'C':
      return 'orange'
    case 'D':
      return 'rose'
    case 'E':
      return 'red'
    case 'F':
      return 'slate'
    default:
      return 'slate'
  }
}

/**
 * Get distinct hexadecimal chart color for an ASFI risk category.
 * @param {string|null|undefined} cat
 * @returns {string}
 */
export function getCategoryColor(cat) {
  if (!cat) return '#64748b'
  const c = String(cat).toUpperCase().trim()
  switch (c) {
    case 'A':
      return '#059669' // Emerald-600
    case 'B':
      return '#d97706' // Amber-600
    case 'C':
      return '#ea580c' // Orange-600
    case 'D':
      return '#e11d48' // Rose-600
    case 'E':
      return '#991b1b' // Red-800
    case 'F':
      return '#334155' // Slate-700
    default:
      return '#64748b'
  }
}

/**
 * Get official human-readable label for an ASFI risk category.
 * @param {string|null|undefined} cat
 * @returns {string}
 */
export function getCategoryLabel(cat) {
  if (!cat) return 'Sin categoría'
  const c = String(cat).toUpperCase().trim()
  switch (c) {
    case 'A':
      return 'Categoría A — Riesgo Normal'
    case 'B':
      return 'Categoría B — Problemas Potenciales'
    case 'C':
      return 'Categoría C — Deficiente'
    case 'D':
      return 'Categoría D — Dudoso Recaudo'
    case 'E':
      return 'Categoría E — Pérdida'
    case 'F':
      return 'Categoría F — Castigo / Irrecuperable'
    default:
      return `Categoría ${c}`
  }
}

/**
 * Calculate total portfolio sums by currency from por_categoria list.
 * @param {Array<{ categoria: string, moneda: string, creditos: number, saldo_capital: string }>} porCategoria
 * @returns {{
 *   BOB: string,
 *   USD: string,
 *   totalBobCents: number,
 *   totalUsdCents: number
 * }}
 */
export function calculateTotalCarteraFromPorCategoria(porCategoria = []) {
  if (!Array.isArray(porCategoria)) {
    return { BOB: '0.00', USD: '0.00', totalBobCents: 0, totalUsdCents: 0 }
  }
  let bobCents = 0
  let usdCents = 0
  for (const item of porCategoria) {
    const cents = toCents(item.saldo_capital)
    const moneda = String(item.moneda || '').toUpperCase()
    if (moneda === 'USD') {
      usdCents += cents
    } else {
      bobCents += cents
    }
  }
  return {
    BOB: fromCents(bobCents),
    USD: fromCents(usdCents),
    totalBobCents: bobCents,
    totalUsdCents: usdCents,
  }
}

/**
 * Normalize and prepare complete A-F category distribution for charts and tables from por_categoria.
 * por_categoria is a list by category and currency: [{ categoria, moneda, creditos, saldo_capital, prevision_especifica, prevision_ciclica }]
 * @param {Array<{
 *   categoria: string,
 *   moneda: string,
 *   creditos: number,
 *   saldo_capital: string,
 *   prevision_especifica: string,
 *   prevision_ciclica: string
 * }>} [porCategoria=[]]
 * @param {string|number} [totalPortfolio=0]
 * @returns {Array<{
 *   categoria: string,
 *   label: string,
 *   count: number,
 *   saldo: string,
 *   saldoCents: number,
 *   previsionEspecifica: string,
 *   previsionCiclica: string,
 *   percentage: number,
 *   color: string,
 *   badgeVariant: string
 * }>}
 */
export function normalizeCategoryDistribution(porCategoria = [], totalPortfolio = 0) {
  const map = {}
  for (const cat of ASFI_CATEGORIAS) {
    map[cat] = {
      categoria: cat,
      count: 0,
      saldoCents: 0,
      previsionEspecificaCents: 0,
      previsionCiclicaCents: 0,
    }
  }

  if (Array.isArray(porCategoria)) {
    for (const item of porCategoria) {
      const cat = String(item.categoria || '').toUpperCase().trim()
      if (map[cat]) {
        map[cat].count += Number(item.creditos ?? 0)
        map[cat].saldoCents += toCents(item.saldo_capital)
        map[cat].previsionEspecificaCents += toCents(item.prevision_especifica)
        map[cat].previsionCiclicaCents += toCents(item.prevision_ciclica)
      }
    }
  }

  // Determine total portfolio cents for percentage calculation
  let totalCents = toCents(totalPortfolio)
  if (totalCents <= 0) {
    totalCents = Object.values(map).reduce((sum, it) => sum + it.saldoCents, 0)
  }

  return ASFI_CATEGORIAS.map((cat) => {
    const it = map[cat]
    const pct = totalCents > 0 ? Math.round((it.saldoCents / totalCents) * 1000) / 10 : 0
    return {
      categoria: cat,
      label: getCategoryLabel(cat),
      count: it.count,
      saldo: fromCents(it.saldoCents),
      saldoCents: it.saldoCents,
      previsionEspecifica: fromCents(it.previsionEspecificaCents),
      previsionCiclica: fromCents(it.previsionCiclicaCents),
      percentage: pct,
      color: getCategoryColor(cat),
      badgeVariant: getCategoryBadgeVariant(cat),
    }
  })
}

/**
 * Compare required regulatory provision against accounting balance (Account 139).
 * @param {string|number} requerida
 * @param {string|number} contable
 * @returns {{
 *   diferenciaCents: number,
 *   diferencia: string,
 *   estado: 'DEFICIT' | 'SUPERAVIT' | 'EQUILIBRADO',
 *   badgeVariant: string,
 *   estadoLabel: string
 * }}
 */
export function comparePrevisiones(requerida, contable) {
  const reqCents = toCents(requerida)
  const contCents = toCents(contable)
  const diffCents = reqCents - contCents // > 0 means required is greater than recorded -> deficit

  if (diffCents > 0) {
    return {
      diferenciaCents: diffCents,
      diferencia: fromCents(diffCents),
      estado: 'DEFICIT',
      badgeVariant: 'rose',
      estadoLabel: 'Déficit de Provisión (Falta Constituir)',
    }
  } else if (diffCents < 0) {
    const absDiff = Math.abs(diffCents)
    return {
      diferenciaCents: diffCents,
      diferencia: fromCents(absDiff),
      estado: 'SUPERAVIT',
      badgeVariant: 'green',
      estadoLabel: 'Superávit de Provisión (Exceso Contable)',
    }
  } else {
    return {
      diferenciaCents: 0,
      diferencia: '0.00',
      estado: 'EQUILIBRADO',
      badgeVariant: 'teal',
      estadoLabel: 'Equilibrado (100% Cobertura)',
    }
  }
}

/**
 * Evaluate pre-calculated difference per currency (e.g. from data.diferencia.BOB).
 * Positive -> Deficit; Negative -> Surplus; Zero -> Balanced.
 * @param {string|number} diferenciaStr
 * @returns {{
 *   diferencia: string,
 *   estado: 'DEFICIT' | 'SUPERAVIT' | 'EQUILIBRADO',
 *   badgeVariant: string,
 *   estadoLabel: string
 * }}
 */
export function evaluateDiferenciaMoneda(diferenciaStr) {
  const diffCents = toCents(diferenciaStr)
  if (diffCents > 0) {
    return {
      diferencia: fromCents(diffCents),
      estado: 'DEFICIT',
      badgeVariant: 'rose',
      estadoLabel: 'Déficit (Falta Constituir)',
    }
  } else if (diffCents < 0) {
    return {
      diferencia: fromCents(Math.abs(diffCents)),
      estado: 'SUPERAVIT',
      badgeVariant: 'green',
      estadoLabel: 'Superávit (Exceso Contable)',
    }
  } else {
    return {
      diferencia: '0.00',
      estado: 'EQUILIBRADO',
      badgeVariant: 'teal',
      estadoLabel: 'Equilibrado (100%)',
    }
  }
}

/**
 * Get badge variant and text for report lifecycle state.
 * @param {string} estado
 * @returns {{ variant: string, label: string }}
 */
export function getReporteEstadoBadge(estado) {
  const e = String(estado || '').toUpperCase().trim()
  if (e === 'GENERADO') {
    return { variant: 'green', label: 'Generado' }
  }
  if (e === 'REEMPLAZADO') {
    return { variant: 'slate', label: 'Reemplazado' }
  }
  return { variant: 'purple', label: estado || 'Desconocido' }
}

/**
 * Get human-readable description for generated report type.
 * @param {string} tipo
 * @returns {string}
 */
export function getReporteTipoLabel(tipo) {
  const t = String(tipo || '').toUpperCase().trim()
  switch (t) {
    case 'CALIFICACION_CARTERA':
      return 'Calificación de Cartera y Previsiones'
    case 'ESTADOS_FINANCIEROS':
      return 'Estados Financieros (Paquete Mensual)'
    case 'CARTERA_DEUDORES':
    case 'CARTERA_DEUDORES_INTERNA':
      return 'Cartera por Deudores (Formato CIC)'
    default:
      return tipo || 'Informe Regulatorio'
  }
}

/**
 * Format SHA-256 hash for compact presentation with tooltip.
 * @param {string} hash
 * @returns {string}
 */
export function formatHash(hash) {
  if (!hash || typeof hash !== 'string') return '—'
  const trimmed = hash.trim()
  if (trimmed.length <= 16) return trimmed
  return `${trimmed.slice(0, 8)}...${trimmed.slice(-6)}`
}
