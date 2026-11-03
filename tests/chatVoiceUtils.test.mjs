import assert from 'node:assert/strict'
import test from 'node:test'

import {
  elegirFormatoAudio,
  mensajeErrorMicrofono,
  mensajeErrorTranscripcion,
} from '../src/components/ui/chatVoiceUtils.js'

test('elegirFormatoAudio picks the first format the browser can record', () => {
  assert.equal(elegirFormatoAudio(() => true), 'audio/webm')
  assert.equal(elegirFormatoAudio((tipo) => tipo === 'audio/ogg'), 'audio/ogg')
  assert.equal(elegirFormatoAudio((tipo) => tipo === 'audio/mp4'), 'audio/mp4')
})

test('elegirFormatoAudio returns an empty type when none is supported', () => {
  assert.equal(elegirFormatoAudio(() => false), '')
})

test('mensajeErrorTranscripcion explains each server failure', () => {
  assert.equal(
    mensajeErrorTranscripcion({ response: { status: 503 } }),
    'El dictado por voz no está configurado en este servidor.',
  )
  assert.equal(
    mensajeErrorTranscripcion({ response: { status: 413 } }),
    'La grabación es demasiado larga. Intenta con una consulta más corta.',
  )
  assert.equal(
    mensajeErrorTranscripcion({ response: { status: 502 } }),
    'No se pudo transcribir el audio. Inténtalo de nuevo.',
  )
  assert.equal(mensajeErrorTranscripcion(new Error('red')), 'No se pudo transcribir el audio. Inténtalo de nuevo.')
})

test('mensajeErrorMicrofono explains denied and missing microphones', () => {
  assert.equal(
    mensajeErrorMicrofono({ name: 'NotAllowedError' }),
    'Permite el acceso al micrófono en el navegador para usar el dictado.',
  )
  assert.equal(mensajeErrorMicrofono({ name: 'NotFoundError' }), 'No se encontró un micrófono disponible.')
  assert.equal(mensajeErrorMicrofono({ name: 'Otro' }), 'No se pudo iniciar el micrófono. Intenta de nuevo.')
})
