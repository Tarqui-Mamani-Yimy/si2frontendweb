import assert from 'node:assert/strict'
import test from 'node:test'

import { descargasDeReporte } from '../src/components/ui/chatReporteUtils.js'

test('descargasDeReporte keeps the backend order (requested format first)', () => {
  const reporte = {
    formato: 'csv',
    url: '/api/v1/x?formato=csv',
    descargas: [
      { formato: 'csv', url: '/api/v1/x?formato=csv', filename: 'x.csv' },
      { formato: 'pdf', url: '/api/v1/x?formato=pdf', filename: 'x.pdf' },
      { formato: 'html', url: '/api/v1/x?formato=html', filename: 'x.html' },
    ],
  }
  assert.deepEqual(descargasDeReporte(reporte).map((d) => d.formato), ['csv', 'pdf', 'html'])
})

test('descargasDeReporte supports the previous PDF-only response', () => {
  assert.deepEqual(descargasDeReporte({ url: '/api/v1/x?formato=pdf', filename: 'x.pdf' }), [
    { formato: 'pdf', url: '/api/v1/x?formato=pdf', filename: 'x.pdf' },
  ])
})

test('descargasDeReporte drops unknown formats and empty reports', () => {
  const reporte = { descargas: [{ formato: 'xlsx', url: '/x' }, { formato: 'html', url: '/y' }] }
  assert.deepEqual(descargasDeReporte(reporte).map((d) => d.formato), ['html'])
  assert.deepEqual(descargasDeReporte(null), [])
  assert.deepEqual(descargasDeReporte({}), [])
})
