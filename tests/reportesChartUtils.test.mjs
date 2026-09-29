import assert from 'node:assert/strict'
import test from 'node:test'

import {
  calculatePercentage,
  formatPercent,
  calculateBarWidth,
  computeDonutSegments,
  formatIndicatorValue,
  getMoraBadgeVariant,
  getMoraBadgeLabel,
} from '../src/modules/admin/components/reportes/reportesChartUtils.js'

test('calculatePercentage calculates accurate proportion', () => {
  assert.equal(calculatePercentage(25, 100), 25)
  assert.equal(calculatePercentage('125.50', '502.00', 1), 25)
  assert.equal(calculatePercentage(0, 100), 0)
  assert.equal(calculatePercentage(50, 0), 0)
  assert.equal(calculatePercentage(null, 100), 0)
  assert.equal(calculatePercentage(-10, 100), 0)
})

test('formatPercent formats decimal numbers and strings into percentages', () => {
  assert.equal(formatPercent(2.31), '2.31%')
  assert.equal(formatPercent('14.5'), '14.50%')
  assert.equal(formatPercent('0'), '0.00%')
  assert.equal(formatPercent(null), '—')
  assert.equal(formatPercent(undefined), '—')
  assert.equal(formatPercent(''), '—')
  assert.equal(formatPercent('invalid'), '—')
})

test('calculateBarWidth computes percentage width clamped between 0 and 100', () => {
  assert.equal(calculateBarWidth(50, 100), 50)
  assert.equal(calculateBarWidth('150.00', '300.00'), 50)
  assert.equal(calculateBarWidth(0, 100), 0)
  assert.equal(calculateBarWidth(50, 0), 0)
  assert.equal(calculateBarWidth(150, 100), 100)
  assert.equal(calculateBarWidth(-10, 100), 0)
})

test('computeDonutSegments calculates SVG stroke dash properties for slices', () => {
  const slices = [
    { label: 'Ahorro a la Vista', value: '60000.00' },
    { label: 'Plazo Fijo', value: '40000.00' },
  ]
  const result = computeDonutSegments(slices, 50)
  assert.equal(result.total, 100000)
  assert.equal(result.segments.length, 2)
  assert.equal(result.segments[0].percentage, 60)
  assert.equal(result.segments[1].percentage, 40)
  assert.equal(result.segments[0].strokeDashoffset, 0)
  assert.ok(result.segments[1].strokeDashoffset < 0)

  // Empty slices
  const emptyResult = computeDonutSegments([])
  assert.equal(emptyResult.total, 0)
  assert.equal(emptyResult.segments.length, 0)
})

test('formatIndicatorValue returns formatted string or null', () => {
  assert.equal(formatIndicatorValue(98.54), '98.54 %')
  assert.equal(formatIndicatorValue('1.85'), '1.85 %')
  assert.equal(formatIndicatorValue(null), null)
  assert.equal(formatIndicatorValue(undefined), null)
  assert.equal(formatIndicatorValue(''), null)
})

test('getMoraBadgeVariant classifies risk correctly', () => {
  assert.equal(getMoraBadgeVariant(2.5), 'green')
  assert.equal(getMoraBadgeVariant(3.0), 'green')
  assert.equal(getMoraBadgeVariant(4.5), 'amber')
  assert.equal(getMoraBadgeVariant(5.0), 'amber')
  assert.equal(getMoraBadgeVariant(7.2), 'red')
  assert.equal(getMoraBadgeVariant(null), 'slate')
  assert.equal(getMoraBadgeVariant(undefined), 'slate')
})

test('getMoraBadgeLabel never reports missing data as critical', () => {
  assert.equal(getMoraBadgeLabel(null), 'Sin datos')
  assert.equal(getMoraBadgeLabel(undefined), 'Sin datos')
  assert.equal(getMoraBadgeLabel('2.50'), 'Mora baja')
  assert.equal(getMoraBadgeLabel('4.00'), 'Mora moderada')
  assert.equal(getMoraBadgeLabel('7.10'), 'Mora crítica')
})
