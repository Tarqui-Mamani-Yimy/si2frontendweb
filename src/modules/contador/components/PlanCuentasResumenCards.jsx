import MetricCard from '../../../components/ui/MetricCard'
import Skeleton from '../../../components/ui/Skeleton'

/**
 * PlanCuentasResumenCards — Tarjetas de métricas del Plan de Cuentas (CU-W29).
 *
 * @param {{
 *   resumen: object | null,
 *   loading: boolean
 * }} props
 */
export default function PlanCuentasResumenCards({ resumen, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-5 rounded-xl bg-white border border-slate-200 shadow-card space-y-3"
          >
            <div className="flex justify-between items-center">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
            <Skeleton className="h-8 w-20" />
          </div>
        ))}
      </div>
    )
  }

  // Safe extraction supporting varied key shapes
  const total =
    resumen?.total_cuentas ??
    resumen?.total ??
    resumen?.cuentas_total ??
    (resumen?.oficiales != null && resumen?.analiticas != null
      ? Number(resumen.oficiales) + Number(resumen.analiticas)
      : null)

  const oficiales =
    resumen?.oficiales ??
    resumen?.cuentas_oficiales ??
    resumen?.total_oficiales ??
    null

  const analiticas =
    resumen?.analiticas ??
    resumen?.cuentas_analiticas ??
    resumen?.total_analiticas ??
    null

  const activas =
    resumen?.activas ??
    resumen?.cuentas_activas ??
    resumen?.total_activas ??
    null

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        label="Total Cuentas"
        value={total != null ? total.toLocaleString('es-BO') : '—'}
        icon="account_tree"
        iconBg="bg-emerald-50"
        iconColor="text-[#064e3b]"
      />

      <MetricCard
        label="Oficiales ASFI (MCEF)"
        value={oficiales != null ? oficiales.toLocaleString('es-BO') : '—'}
        icon="verified"
        iconBg="bg-teal-50"
        iconColor="text-[#0d9488]"
      />

      <MetricCard
        label="Analíticas Propias"
        value={analiticas != null ? analiticas.toLocaleString('es-BO') : '—'}
        icon="domain"
        iconBg="bg-indigo-50"
        iconColor="text-[#4338ca]"
      />

      <MetricCard
        label="Cuentas Activas"
        value={activas != null ? activas.toLocaleString('es-BO') : '—'}
        icon="check_circle"
        iconBg="bg-green-50"
        iconColor="text-[#15803d]"
      />
    </div>
  )
}
