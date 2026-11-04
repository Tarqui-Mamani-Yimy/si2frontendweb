/**
 * Mapeo de identificadores de módulo según la especificación S2 a sus nombres legibles (S3).
 */
export const NOMBRES_MODULOS = {
  banca_movil: 'banca móvil y comprobantes digitales',
  scoring_crediticio: 'scoring crediticio',
  informes_asfi: 'informes ASFI',
  respaldos_bitacora: 'respaldos y bitácora',
  chatbot_ia: 'chatbot con IA y dictado por voz',
  notificaciones_socios: 'notificaciones a socios',
  recredito_ia: 'recomendación de recrédito con IA',
  reportes_gerenciales: 'reportes gerenciales',
}

/**
 * Decide si un módulo está permitido según el estado de la suscripción (S2, S7).
 *
 * @param {{
 *   plan?: { codigo: string, nombre: string } | null,
 *   modulos?: string[],
 *   sin_restriccion?: boolean,
 *   fetchFailed?: boolean
 * } | null | undefined} modulosInfo
 * @param {string} modulo
 * @returns {boolean}
 */
export function isModuloPermitido(modulosInfo, modulo) {
  if (!modulo) return true

  // S7: Si mis-modulos falla o aún no se ha cargado, no se oculta nada (fallback permisivo)
  if (!modulosInfo || modulosInfo.fetchFailed === true) {
    return true
  }

  // S2: SUPERADMIN, usuario sin cooperativa o cooperativa sin suscripción
  if (modulosInfo.sin_restriccion === true) {
    return true
  }

  if (Array.isArray(modulosInfo.modulos)) {
    return modulosInfo.modulos.includes(modulo)
  }

  return true
}

/**
 * Genera el mensaje de bloqueo cuando una ruta o recurso no está disponible en el plan (S3).
 * "Tu plan {nombre} no incluye {módulo}."
 *
 * @param {{
 *   plan?: { codigo: string, nombre: string } | null,
 *   modulos?: string[],
 *   sin_restriccion?: boolean
 * } | null | undefined} modulosInfo
 * @param {string} modulo
 * @returns {string}
 */
export function getMensajeBloqueoModulo(modulosInfo, modulo) {
  const planNombre = modulosInfo?.plan?.nombre || 'actual'
  const moduloNombre = NOMBRES_MODULOS[modulo] || modulo
  return `Tu plan ${planNombre} no incluye ${moduloNombre}.`
}
