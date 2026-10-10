import { DEFAULT_SUBSCRIPTION, estadoSuscripcionLabel, normalizeSuscripcion } from '../constants/subscription'

const ESTADO_STYLES = {
  ACTIVA: 'bg-emerald-50 dark:bg-emerald-950/60 text-[#006c49] dark:text-[#4edea3] border-emerald-200/80 dark:border-emerald-800/60',
  SUSPENDIDA: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/60',
  VENCIDA: 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200/80 dark:border-red-800/60',
  CANCELADA: 'bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700',
}

/**
 * SubscriptionBadge — Compact badge for tables and detail views.
 * Displays the institutional subscription plan (and its status).
 */
export default function SubscriptionBadge({
  suscripcion = null,
  plan = DEFAULT_SUBSCRIPTION.name,
  estado,
  className = '',
  showIcon = true,
}) {
  const normalized = suscripcion ? normalizeSuscripcion(suscripcion) : null
  const label = normalized?.name ?? plan
  const estadoFinal = normalized?.estado ?? estado ?? 'ACTIVA'
  const style = ESTADO_STYLES[estadoFinal] ?? ESTADO_STYLES.ACTIVA

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide border shadow-xs whitespace-nowrap ${style} ${className}`}
      title={estadoFinal !== 'ACTIVA' ? estadoSuscripcionLabel(estadoFinal) : undefined}
    >
      {showIcon && (
        <span
          className="material-symbols-outlined text-[14px]"
          aria-hidden="true"
        >
          corporate_fare
        </span>
      )}
      <span>{label}</span>
      {estadoFinal !== 'ACTIVA' && (
        <span className="text-[10px] font-bold uppercase opacity-80">
          · {estadoSuscripcionLabel(estadoFinal)}
        </span>
      )}
    </span>
  )
}
