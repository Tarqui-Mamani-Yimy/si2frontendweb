import { client } from './client'

export async function login({ correo, contrasena }) {
  const { data } = await client.post(
    '/auth/login',
    { correo: correo.trim().toLowerCase(), contrasena },
    { skipUnauthorizedHandling: true },
  )
  return data
}

export async function fetchMe() {
  const { data } = await client.get('/auth/me')
  return data
}

export async function fetchMisModulos() {
  const { data } = await client.get('/suscripciones/mis-modulos', { timeout: 5000 })
  return data
}

export async function logout() {
  const { data } = await client.post('/auth/logout', {}, { skipUnauthorizedHandling: true })
  return data
}

/**
 * Solicita un correo de recuperación de contraseña para el usuario indicado.
 * Por seguridad, el backend siempre responde con un mensaje neutro sin
 * revelar si el correo existe. La respuesta trae además `delivered`
 * (si el SMTP aceptó el envío) y — sólo en modo sin SMTP — `debug_token`
 * para poder probar el flujo end-to-end sin esperar al correo.
 */
export async function requestPasswordReset(correo) {
  const { data } = await client.post(
    '/auth/password-reset/request',
    { correo: correo.trim().toLowerCase() },
    { skipUnauthorizedHandling: true },
  )
  return data
}

/**
 * Confirma el restablecimiento de contraseña usando el token recibido por correo.
 */
export async function confirmPasswordReset({ token, nueva_contrasena }) {
  const { data } = await client.post(
    '/auth/password-reset/confirm',
    { token, nueva_contrasena },
    { skipUnauthorizedHandling: true },
  )
  return data
}
