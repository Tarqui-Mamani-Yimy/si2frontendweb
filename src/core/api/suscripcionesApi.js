import { client } from './client'

export async function listPlanes() {
  const { data } = await client.get('/suscripciones/planes')
  return data
}

export async function getMiSuscripcion() {
  const { data } = await client.get('/suscripciones/mi-suscripcion')
  return data
}

export async function listSuscripciones() {
  const { data } = await client.get('/suscripciones')
  return data
}

export async function getSuscripcionCooperativa(cooperativaId) {
  const { data } = await client.get(`/suscripciones/cooperativa/${cooperativaId}`)
  return data
}

export async function crearSuscripcion(payload) {
  const { data } = await client.post('/suscripciones', payload)
  return data
}

export async function actualizarSuscripcion(id, payload) {
  const { data } = await client.put(`/suscripciones/${id}`, payload)
  return data
}

export async function renovarSuscripcion(id, meses = 12) {
  const { data } = await client.post(`/suscripciones/${id}/renovar`, { meses })
  return data
}

export async function cancelarSuscripcion(id) {
  const { data } = await client.delete(`/suscripciones/${id}`)
  return data
}
