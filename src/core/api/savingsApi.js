import { client } from './client'

export async function listMonedas() {
  const { data } = await client.get('/ahorros/monedas')
  return data
}

export async function listCuentas(params = {}) {
  const { data } = await client.get('/ahorros/cuentas', { params })
  return data
}

export async function openCuenta(payload) {
  const { data } = await client.post('/ahorros/cuentas', payload)
  return data
}

export async function depositar(cuentaId, monto) {
  const { data } = await client.post(`/ahorros/cuentas/${cuentaId}/depositos`, { monto })
  return data
}

export async function retirar(cuentaId, monto) {
  const { data } = await client.post(`/ahorros/cuentas/${cuentaId}/retiros`, { monto })
  return data
}

export async function listCertificados(params = {}) {
  const { data } = await client.get('/ahorros/certificados', { params })
  return data
}

export async function issueCertificado(payload) {
  const { data } = await client.post('/ahorros/certificados', payload)
  return data
}

export async function listMisCuentas() {
  const { data } = await client.get('/ahorros/mis-cuentas')
  return data
}

export async function listMisCertificados() {
  const { data } = await client.get('/ahorros/mis-certificados')
  return data
}