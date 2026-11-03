const FORMATOS_AUDIO = ['audio/webm', 'audio/ogg', 'audio/mp4']

const ERROR_TRANSCRIPCION = 'No se pudo transcribir el audio. Inténtalo de nuevo.'

export function elegirFormatoAudio(esSoportado) {
  return FORMATOS_AUDIO.find((formato) => esSoportado(formato)) ?? ''
}

export function mensajeErrorTranscripcion(error) {
  const mensajes = {
    503: 'El dictado por voz no está configurado en este servidor.',
    413: 'La grabación es demasiado larga. Intenta con una consulta más corta.',
  }
  return mensajes[error?.response?.status] ?? ERROR_TRANSCRIPCION
}

export function mensajeErrorMicrofono(error) {
  const mensajes = {
    NotAllowedError: 'Permite el acceso al micrófono en el navegador para usar el dictado.',
    NotFoundError: 'No se encontró un micrófono disponible.',
  }
  return mensajes[error?.name] ?? 'No se pudo iniciar el micrófono. Intenta de nuevo.'
}
