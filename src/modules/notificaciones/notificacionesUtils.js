/**
 * Pure helpers for "Gestionar notificaciones" (staff composer and socio inbox).
 */

export const NOTIFICACIONES_CHANGED_EVENT = 'notificaciones:changed'

/** Lets the inbox refresh the header bell right after marking notifications as read. */
export function emitNotificacionesChanged() {
  globalThis.dispatchEvent(new Event(NOTIFICACIONES_CHANGED_EVENT))
}

export const TIPOS_NOTIFICACION = {
  RECORDATORIO_PAGO: { label: 'Recordatorio de pago', icon: 'payments', badge: 'amber' },
  PROMOCION: { label: 'Promoción', icon: 'sell', badge: 'purple' },
  AVISO: { label: 'Aviso general', icon: 'campaign', badge: 'navy' },
}

export const DESTINOS_NOTIFICACION = {
  SOCIO: { label: 'Socios específicos', icon: 'person_search' },
  TODOS: { label: 'Todos los socios', icon: 'groups' },
  CUOTAS_POR_VENCER: { label: 'Con cuotas por vencer', icon: 'event_upcoming' },
  EN_MORA: { label: 'Con cuotas vencidas (mora)', icon: 'warning' },
}

/** Default title/message offered when the staff member picks a type. */
export const PLANTILLAS = {
  RECORDATORIO_PAGO: {
    titulo: 'Recordatorio de pago de tu cuota',
    mensaje:
      'Hola {nombre}, te recordamos que tu cuota de {monto_cuota} vence el {fecha_cuota}. ' +
      'Paga a tiempo y evita recargos por mora. — {cooperativa}',
  },
  PROMOCION: {
    titulo: '¡Nueva promoción para ti!',
    mensaje: 'Hola {nombre}, en {cooperativa} tenemos una promoción especial para ti. ',
  },
  AVISO: {
    titulo: 'Aviso importante',
    mensaje: 'Estimado(a) {nombre}: ',
  },
}

export const VARIABLES = [
  { token: '{nombre}', label: 'Nombre' },
  { token: '{nombre_completo}', label: 'Nombre completo' },
  { token: '{monto_cuota}', label: 'Monto de cuota' },
  { token: '{fecha_cuota}', label: 'Fecha de cuota' },
  { token: '{cooperativa}', label: 'Cooperativa' },
]

const EJEMPLO = {
  nombre: 'María',
  nombre_completo: 'María Rojas',
  monto_cuota: 'Bs. 450.00',
  fecha_cuota: '15/11/2026',
}

/** Message as a sample socio would read it (the backend fills real data per socio). */
export function renderPreview(mensaje, cooperativa) {
  const values = { ...EJEMPLO, cooperativa: cooperativa || 'la cooperativa' }
  return String(mensaje ?? '').replace(
    /\{(nombre|nombre_completo|monto_cuota|fecha_cuota|cooperativa)\}/g,
    (_, key) => values[key],
  )
}

/** Inserts `token` replacing the [start, end) selection; returns the new text and caret. */
export function insertToken(text, start, end, token) {
  const value = String(text ?? '')
  const from = Math.max(0, Math.min(start ?? value.length, value.length))
  const to = Math.max(from, Math.min(end ?? from, value.length))
  return { text: value.slice(0, from) + token + value.slice(to), caret: from + token.length }
}

/** Whether the message is still the untouched template of some type (safe to replace). */
export function esPlantilla(titulo, mensaje) {
  if (!titulo && !mensaje) return true
  return Object.values(PLANTILLAS).some((p) => p.titulo === titulo && p.mensaje === mensaje)
}

/** Recipients the current selection will reach. */
export function contarDestinatarios(destino, segmentos, seleccionados) {
  if (destino === 'SOCIO') return (seleccionados ?? []).filter((s) => s.tiene_cuenta).length
  return segmentos?.[destino]?.destinatarios ?? 0
}

/** Read percentage for the history table. */
export function porcentajeLeidas(leidas, total) {
  if (!total) return 0
  return Math.round((Number(leidas) / Number(total)) * 100)
}

export function nombreSocio(socio) {
  return [socio?.nombre, socio?.apellido].filter(Boolean).join(' ')
}

/** "hace 5 min", "hace 2 h", or a short date for older items. */
export function fechaRelativa(iso, now = new Date()) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const minutes = Math.floor((now.getTime() - date.getTime()) / 60000)
  if (minutes < 1) return 'ahora'
  if (minutes < 60) return `hace ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `hace ${hours} h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `hace ${days} d`
  return date.toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
