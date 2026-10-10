/**
 * Shared constants and helpers for the institutional subscription plan.
 *
 * The source of truth is the backend catalog (`/suscripciones/planes`) and each
 * cooperative's subscription (`/suscripciones/mi-suscripcion`). The default
 * below is only a fallback for loading/error states and for the public landing
 * page (which has no authenticated context).
 */

export const DEFAULT_SUBSCRIPTION = {
  id: 'red-enterprise',
  name: 'Red Enterprise',
  status: 'Activa',
  description: 'Para federaciones, redes intercooperativas y grandes uniones de crédito fiduciarias',
  features: [
    { text: 'Multi-tenant federado ilimitado', icon: 'corporate_fare' },
    { text: 'Almacenamiento HSM sin límite', icon: 'database' },
    { text: 'Cluster dedicado de alta disponibilidad', icon: 'dns' },
  ],
  includes: [
    'Aislamiento de bases de datos por tenant',
    'Matriz regulatoria Maker-Checker',
    'Integración API Core interbancaria',
    'SLA garantizado 99.99% con HSM',
  ],
  pricingIncludes: [
    'Todo lo de Crecimiento Pro, más:',
    'Aislamiento de bases de datos por tenant',
    'Matriz regulatoria Maker-Checker',
    'Integración API Core interbancaria',
    'SLA garantizado 99.99% con HSM',
  ],
}

export const ESTADO_SUSCRIPCION_LABEL = {
  ACTIVA: 'Activa',
  SUSPENDIDA: 'Suspendida',
  VENCIDA: 'Vencida',
  CANCELADA: 'Cancelada',
}

export function estadoSuscripcionLabel(estado) {
  if (!estado) return 'Sin suscripción'
  return ESTADO_SUSCRIPCION_LABEL[estado] ?? estado
}

/**
 * Normalizes a backend subscription (SuscripcionOut) into the shape consumed by
 * the presentational components. Falls back to DEFAULT_SUBSCRIPTION when no
 * subscription is available.
 */
export function normalizeSuscripcion(suscripcion) {
  if (!suscripcion || !suscripcion.plan) {
    return { ...DEFAULT_SUBSCRIPTION }
  }
  const { plan } = suscripcion
  return {
    id: plan.codigo,
    name: plan.nombre,
    status: estadoSuscripcionLabel(suscripcion.estado),
    estado: suscripcion.estado,
    description: plan.descripcion,
    features: plan.features ?? [],
    includes: plan.incluye ?? [],
    moneda: plan.moneda,
    precioMensual: plan.precio_mensual,
    fechaInicio: suscripcion.fecha_inicio,
    fechaFin: suscripcion.fecha_fin,
    diasRestantes: suscripcion.dias_restantes,
  }
}
