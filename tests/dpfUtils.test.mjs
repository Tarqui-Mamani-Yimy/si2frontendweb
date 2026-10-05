import assert from 'node:assert/strict'
import test from 'node:test'

import { calculateKnownMaturityTotal, formatNullableMoney } from '../src/shared/components/dpf/dpfUtils.js'

test('formatNullableMoney marks missing values unavailable and formats present amounts', () => {
  assert.equal(formatNullableMoney(null, 'Bs.'), '—')
  assert.equal(formatNullableMoney(undefined, '$'), '—')
  assert.equal(formatNullableMoney('125.5', 'Bs.'), 'Bs. 125,50')
})

test('calculateKnownMaturityTotal is unavailable unless both financial inputs are known', () => {
  assert.equal(calculateKnownMaturityTotal('100.00', null), null)
  assert.equal(calculateKnownMaturityTotal(undefined, '10.00'), null)
  assert.equal(calculateKnownMaturityTotal('100.00', '10.00'), 110)
})
