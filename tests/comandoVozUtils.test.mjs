import assert from 'node:assert/strict'
import test from 'node:test'

import {
  blobErrorMessage,
  filenameFromDisposition,
  filtrosDesdeComando,
  getSpeechRecognition,
  joinTranscript,
  speechErrorMessage,
} from '../src/modules/admin/components/reportes/comandoVozUtils.js'

test('getSpeechRecognition prefers the standard constructor and falls back to webkit', () => {
  function Standard() {}
  function Webkit() {}
  assert.equal(getSpeechRecognition({ SpeechRecognition: Standard, webkitSpeechRecognition: Webkit }), Standard)
  assert.equal(getSpeechRecognition({ webkitSpeechRecognition: Webkit }), Webkit)
  assert.equal(getSpeechRecognition({}), null)
})

test('joinTranscript joins interim and final results', () => {
  const results = [[{ transcript: 'reporte de cartera ' }], [{ transcript: ' en  PDF' }]]
  assert.equal(joinTranscript(results), 'reporte de cartera en PDF')
  assert.equal(joinTranscript(undefined), '')
})

test('speechErrorMessage explains microphone errors and stays silent on abort', () => {
  assert.match(speechErrorMessage('not-allowed'), /micrófono/)
  assert.match(speechErrorMessage('no-speech'), /No escuché/)
  assert.equal(speechErrorMessage('aborted'), '')
  assert.ok(speechErrorMessage('whatever'))
})

test('filenameFromDisposition reads plain and UTF-8 filenames', () => {
  assert.equal(filenameFromDisposition('attachment; filename="cartera-2026-11-02.pdf"', 'x.pdf'),
    'cartera-2026-11-02.pdf')
  assert.equal(filenameFromDisposition("attachment; filename*=UTF-8''balance%20general.html", 'x'),
    'balance general.html')
  assert.equal(filenameFromDisposition(undefined, 'fallback.csv'), 'fallback.csv')
})

test('filtrosDesdeComando maps page reports to tabs and ignores accounting ones', () => {
  assert.deepEqual(
    filtrosDesdeComando({ tipo: 'mora', parametros: { fecha_corte: '2026-10-31', moneda_id: 2 } }),
    { tab: 'cartera', fechaCorte: '2026-10-31', monedaId: 2 },
  )
  assert.equal(filtrosDesdeComando({ tipo: 'libro-diario', parametros: {} }), null)
  assert.equal(filtrosDesdeComando(null), null)
})

test('blobErrorMessage extracts FastAPI detail from a Blob error body', async () => {
  const err = { response: { data: new Blob([JSON.stringify({ detail: 'Fecha futura' })]) } }
  assert.equal(await blobErrorMessage(err, 'fallback'), 'Fecha futura')
  const notJson = { response: { data: new Blob(['<html>']) } }
  assert.equal(await blobErrorMessage(notJson, 'fallback'), 'fallback')
  assert.equal(await blobErrorMessage(new Error('x'), 'fallback'), 'fallback')
})
