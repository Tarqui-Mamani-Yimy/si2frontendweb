import assert from 'node:assert/strict'
import test from 'node:test'

import {
  formatExchangeRate,
  fromCents,
  getFirstDayOfYearIso,
  toCents,
} from '../src/modules/contador/components/contabilidadUtils.js'

test('toCents converts decimal strings and numbers to integer cents', () => {
  assert.equal(toCents('125.50'), 12550)
  assert.equal(toCents('-992.63'), -99263)
  assert.equal(toCents('0,10'), 10)
  assert.equal(toCents(45.1), 4510)
  assert.equal(toCents(null), 0)
  assert.equal(toCents('abc'), 0)
})

test('fromCents formats cents with two decimals', () => {
  assert.equal(fromCents(12550), '125.50')
  assert.equal(fromCents(undefined), '0.00')
})

test('formatExchangeRate shows five decimals and tolerates bad input', () => {
  assert.equal(formatExchangeRate('6.86'), '6.86000')
  assert.equal(formatExchangeRate('6,86'), '6.86000')
  assert.equal(formatExchangeRate(null), '—')
  assert.equal(formatExchangeRate(''), '—')
  assert.equal(formatExchangeRate('abc'), 'abc')
})

test('getFirstDayOfYearIso returns January 1st of the current year', () => {
  assert.equal(getFirstDayOfYearIso(), `${new Date().getFullYear()}-01-01`)
})
