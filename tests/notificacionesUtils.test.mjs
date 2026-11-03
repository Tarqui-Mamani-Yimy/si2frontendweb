import assert from 'node:assert/strict'
import test from 'node:test'

import {
  PLANTILLAS,
  contarDestinatarios,
  esPlantilla,
  fechaRelativa,
  insertToken,
  nombreSocio,
  porcentajeLeidas,
  renderPreview,
} from '../src/modules/notificaciones/notificacionesUtils.js'

test('renderPreview fills known variables and leaves unknown braces intact', () => {
  assert.equal(
    renderPreview('Hola {nombre}, cuota {monto_cuota} al {fecha_cuota} — {cooperativa} {otro}', 'Coop SI2'),
    'Hola María, cuota Bs. 450.00 al 15/11/2026 — Coop SI2 {otro}',
  )
  assert.equal(renderPreview('{cooperativa}'), 'la cooperativa')
  assert.equal(renderPreview(undefined), '')
})

test('insertToken replaces the selection and moves the caret after the token', () => {
  assert.deepEqual(insertToken('Hola !', 5, 5, '{nombre}'), { text: 'Hola {nombre}!', caret: 13 })
  assert.deepEqual(insertToken('Hola XX', 5, 7, '{nombre}'), { text: 'Hola {nombre}', caret: 13 })
  assert.deepEqual(insertToken('Hola', undefined, undefined, '{x}'), { text: 'Hola{x}', caret: 7 })
})

test('esPlantilla only allows replacing untouched templates', () => {
  const p = PLANTILLAS.PROMOCION
  assert.equal(esPlantilla(p.titulo, p.mensaje), true)
  assert.equal(esPlantilla('', ''), true)
  assert.equal(esPlantilla(p.titulo, `${p.mensaje} 20% de descuento`), false)
})

test('contarDestinatarios uses segment counts or selected socios with accounts', () => {
  const segmentos = { TODOS: { destinatarios: 12, sin_cuenta: 3 } }
  assert.equal(contarDestinatarios('TODOS', segmentos, []), 12)
  assert.equal(contarDestinatarios('EN_MORA', segmentos, []), 0)
  assert.equal(contarDestinatarios('SOCIO', segmentos, [{ tiene_cuenta: true }, { tiene_cuenta: false }]), 1)
  assert.equal(contarDestinatarios('TODOS', null, []), 0)
})

test('porcentajeLeidas and nombreSocio handle edge cases', () => {
  assert.equal(porcentajeLeidas(1, 3), 33)
  assert.equal(porcentajeLeidas(0, 0), 0)
  assert.equal(nombreSocio({ nombre: 'Ana', apellido: 'Paz' }), 'Ana Paz')
  assert.equal(nombreSocio({ nombre: 'Ana' }), 'Ana')
})

test('fechaRelativa describes recent times', () => {
  const now = new Date('2026-11-02T12:00:00Z')
  assert.equal(fechaRelativa('2026-11-02T11:59:40Z', now), 'ahora')
  assert.equal(fechaRelativa('2026-11-02T11:45:00Z', now), 'hace 15 min')
  assert.equal(fechaRelativa('2026-11-02T09:00:00Z', now), 'hace 3 h')
  assert.equal(fechaRelativa('2026-10-31T12:00:00Z', now), 'hace 2 d')
  assert.equal(fechaRelativa('no-es-fecha', now), '')
})
