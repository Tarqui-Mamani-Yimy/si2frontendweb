import { client } from './client'

export async function enviarMensaje(mensaje, historial = []) {
  const { data } = await client.post('/chatbot/chat', { mensaje, historial })
  return data
}
