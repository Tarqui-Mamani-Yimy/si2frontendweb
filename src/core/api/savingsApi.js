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

export async function updateCuentaEstado(cuentaId, estado) {
  const { data } = await client.patch(`/ahorros/cuentas/${cuentaId}/estado`, { estado })
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

export async function downloadCertificadoPdf(certificadoId) {
  const response = await client.get(`/ahorros/certificados/${certificadoId}/pdf`, { responseType: 'blob' })
  const disposition = response.headers['content-disposition'] ?? ''
  const match = disposition.match(/filename="?([^"]+)"?/)
  const filename = match ? match[1] : `certificado_${certificadoId}.pdf`
  const url = window.URL.createObjectURL(response.data)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

export async function listMisCuentas() {
  const { data } = await client.get('/ahorros/mis-cuentas')
  return data
}

export async function listMisCertificados() {
  const { data } = await client.get('/ahorros/mis-certificados')
  return data
}