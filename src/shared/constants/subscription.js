/**
 * Shared constants for the institutional subscription plan.
 * Currently fixed to 'Red Enterprise' across all cooperatives in the frontend.
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
