import assert from 'node:assert/strict'
import test from 'node:test'

import {
  formatTipoCreditoAsfi,
  getCategoryBadgeVariant,
  getCategoryColor,
  getCategoryLabel,
  calculateTotalCarteraFromPorCategoria,
  normalizeCategoryDistribution,
  comparePrevisiones,
  evaluateDiferenciaMoneda,
  getReporteEstadoBadge,
  getReporteTipoLabel,
  formatHash,
} from '../src/modules/contador/components/informes-asfi/informesAsfiUtils.js'

test('formatTipoCreditoAsfi maps ASFI credit codes to readable labels and tolerates null', () => {
  assert.equal(formatTipoCreditoAsfi('MICROCREDITO'), 'Microcrédito')
  assert.equal(formatTipoCreditoAsfi('MICROCREDITO_AGROPECUARIO'), 'Micro Agropecuario')
  assert.equal(formatTipoCreditoAsfi('CONSUMO'), 'Consumo')
  assert.equal(formatTipoCreditoAsfi('VIVIENDA_HIPOTECARIA'), 'Vivienda Hipotecaria')
  assert.equal(formatTipoCreditoAsfi('VIVIENDA_SIN_GARANTIA'), 'Vivienda s/Garantía')
  assert.equal(formatTipoCreditoAsfi(null), 'Sin clasificar')
  assert.equal(formatTipoCreditoAsfi(undefined), 'Sin clasificar')
  assert.equal(formatTipoCreditoAsfi(''), 'Sin clasificar')
  assert.equal(formatTipoCreditoAsfi('OTRO_TIPO'), 'OTRO TIPO')
})

test('getCategoryBadgeVariant and getCategoryColor assign distinct visual styles and tolerate null', () => {
  assert.equal(getCategoryBadgeVariant('A'), 'green')
  assert.equal(getCategoryBadgeVariant('b'), 'amber')
  assert.equal(getCategoryBadgeVariant('C'), 'orange')
  assert.equal(getCategoryBadgeVariant('D'), 'rose')
  assert.equal(getCategoryBadgeVariant('E'), 'red')
  assert.equal(getCategoryBadgeVariant('F'), 'slate')
  assert.equal(getCategoryBadgeVariant(null), 'slate')
  assert.equal(getCategoryBadgeVariant(undefined), 'slate')

  assert.equal(getCategoryColor('A'), '#059669')
  assert.equal(getCategoryColor('B'), '#d97706')
  assert.equal(getCategoryColor('C'), '#ea580c')
  assert.equal(getCategoryColor('D'), '#e11d48')
  assert.equal(getCategoryColor('E'), '#991b1b')
  assert.equal(getCategoryColor('F'), '#334155')
  assert.equal(getCategoryColor(null), '#64748b')
})

test('getCategoryLabel returns regulatory names for all categories and tolerates null', () => {
  assert.ok(getCategoryLabel('A').includes('Normal'))
  assert.ok(getCategoryLabel('B').includes('Problemas Potenciales'))
  assert.ok(getCategoryLabel('C').includes('Deficiente'))
  assert.ok(getCategoryLabel('D').includes('Dudoso'))
  assert.ok(getCategoryLabel('E').includes('Pérdida'))
  assert.ok(getCategoryLabel('F').includes('Castigo'))
  assert.equal(getCategoryLabel(null), 'Sin categoría')
})

test('calculateTotalCarteraFromPorCategoria calculates currency sums correctly', () => {
  const porCat = [
    { categoria: 'A', moneda: 'BOB', creditos: 1, saldo_capital: '1007.37' },
    { categoria: 'B', moneda: 'USD', creditos: 2, saldo_capital: '500.50' },
    { categoria: 'B', moneda: 'BOB', creditos: 1, saldo_capital: '2000.00' },
  ]
  const totals = calculateTotalCarteraFromPorCategoria(porCat)
  assert.equal(totals.BOB, '3007.37')
  assert.equal(totals.USD, '500.50')
  assert.equal(totals.totalBobCents, 300737)
  assert.equal(totals.totalUsdCents, 50050)

  // Empty or invalid
  assert.deepEqual(calculateTotalCarteraFromPorCategoria([]), {
    BOB: '0.00',
    USD: '0.00',
    totalBobCents: 0,
    totalUsdCents: 0,
  })
})

test('normalizeCategoryDistribution aggregates por_categoria array with saldo_capital and currency breakdown', () => {
  const porCat = [
    {
      categoria: 'A',
      moneda: 'BOB',
      creditos: 1,
      saldo_capital: '1007.37',
      prevision_especifica: '30.22',
      prevision_ciclica: '14.61',
    },
    {
      categoria: 'B',
      moneda: 'USD',
      creditos: 2,
      saldo_capital: '500.00',
      prevision_especifica: '25.00',
      prevision_ciclica: '0.00',
    },
  ]
  const dist = normalizeCategoryDistribution(porCat)
  assert.equal(dist.length, 6)

  const catA = dist.find((d) => d.categoria === 'A')
  assert.equal(catA.count, 1)
  assert.equal(catA.saldo, '1007.37')
  assert.equal(catA.previsionEspecifica, '30.22')
  assert.equal(catA.previsionCiclica, '14.61')

  const catB = dist.find((d) => d.categoria === 'B')
  assert.equal(catB.count, 2)
  assert.equal(catB.saldo, '500.00')
  assert.equal(catB.previsionEspecifica, '25.00')

  const catC = dist.find((d) => d.categoria === 'C')
  assert.equal(catC.count, 0)
  assert.equal(catC.saldo, '0.00')
})

test('comparePrevisiones computes deficit, surplus and balanced cases correctly', () => {
  const def = comparePrevisiones('15000.00', '10000.00')
  assert.equal(def.estado, 'DEFICIT')
  assert.equal(def.diferencia, '5000.00')
  assert.equal(def.badgeVariant, 'rose')

  const sur = comparePrevisiones('8000.00', '10000.00')
  assert.equal(sur.estado, 'SUPERAVIT')
  assert.equal(sur.diferencia, '2000.00')
  assert.equal(sur.badgeVariant, 'green')

  const eq = comparePrevisiones('12000.50', '12000.50')
  assert.equal(eq.estado, 'EQUILIBRADO')
  assert.equal(eq.diferencia, '0.00')
  assert.equal(eq.badgeVariant, 'teal')
})

test('evaluateDiferenciaMoneda evaluates pre-computed difference objects per currency', () => {
  const bobDiff = evaluateDiferenciaMoneda('44.83')
  assert.equal(bobDiff.estado, 'DEFICIT')
  assert.equal(bobDiff.diferencia, '44.83')
  assert.equal(bobDiff.badgeVariant, 'rose')

  const usdDiff = evaluateDiferenciaMoneda('0.00')
  assert.equal(usdDiff.estado, 'EQUILIBRADO')
  assert.equal(usdDiff.diferencia, '0.00')
  assert.equal(usdDiff.badgeVariant, 'teal')

  const surDiff = evaluateDiferenciaMoneda('-150.00')
  assert.equal(surDiff.estado, 'SUPERAVIT')
  assert.equal(surDiff.diferencia, '150.00')
  assert.equal(surDiff.badgeVariant, 'green')
})

test('getReporteEstadoBadge and getReporteTipoLabel format lifecycle values', () => {
  assert.deepEqual(getReporteEstadoBadge('GENERADO'), { variant: 'green', label: 'Generado' })
  assert.deepEqual(getReporteEstadoBadge('REEMPLAZADO'), { variant: 'slate', label: 'Reemplazado' })

  assert.equal(getReporteTipoLabel('CALIFICACION_CARTERA'), 'Calificación de Cartera y Previsiones')
  assert.equal(getReporteTipoLabel('ESTADOS_FINANCIEROS'), 'Estados Financieros (Paquete Mensual)')
  assert.equal(getReporteTipoLabel('CARTERA_DEUDORES'), 'Cartera por Deudores (Formato CIC)')
  assert.equal(getReporteTipoLabel('CARTERA_DEUDORES_INTERNA'), 'Cartera por Deudores (Formato CIC)')
})

test('formatHash truncates long SHA-256 hashes cleanly', () => {
  const hash = '3d41fb7fbf86d88965179156114b8b571b9c7865a89c2ec575f2a2afb17e4a8c'
  const truncated = formatHash(hash)
  assert.equal(truncated, '3d41fb7f...7e4a8c')
  assert.equal(formatHash(null), '—')
  assert.equal(formatHash('short-hash'), 'short-hash')
})
