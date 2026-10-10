import { DEFAULT_SUBSCRIPTION, normalizeSuscripcion } from '../constants/subscription'

/**
 * SubscriptionCard — Dashboard card displaying the cooperative's active subscription plan.
 * Highlights the plan name, active status, description, and included capabilities without displaying pricing.
 * Data comes from the backend (`/suscripciones/mi-suscripcion`); DEFAULT_SUBSCRIPTION is only a fallback.
 */
export default function SubscriptionCard({
  suscripcion = null,
  loading = false,
  error = null,
  title = 'Tu suscripción',
  className = '',
}) {
  const plan = suscripcion ? normalizeSuscripcion(suscripcion) : { ...DEFAULT_SUBSCRIPTION }

  if (loading) {
    return (
      <div
        className={`relative overflow-hidden rounded-xl bg-white dark:bg-[#0b1f19] p-6 border border-[#e2e8f0] dark:border-emerald-900/40 shadow-card ${className}`}
      >
        <div className="animate-pulse space-y-4">
          <div className="h-5 w-40 rounded-full bg-slate-200 dark:bg-emerald-900/40" />
          <div className="h-8 w-64 rounded-lg bg-slate-200 dark:bg-emerald-900/40" />
          <div className="h-4 w-full max-w-2xl rounded bg-slate-100 dark:bg-emerald-900/30" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
            <div className="h-12 rounded-lg bg-slate-100 dark:bg-emerald-900/30" />
            <div className="h-12 rounded-lg bg-slate-100 dark:bg-emerald-900/30" />
            <div className="h-12 rounded-lg bg-slate-100 dark:bg-emerald-900/30" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-white dark:bg-[#0b1f19] p-6 border border-[#e2e8f0] dark:border-emerald-900/40 shadow-card transition-all ${className}`}
    >
      {/* Ambient background glow */}
      <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#6cf8bb]/10 blur-3xl pointer-events-none" />

      <div className="relative">
        {/* Header Badges */}
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#eff4ff] dark:bg-emerald-950/60 text-[#006c49] dark:text-[#6cf8bb] text-[11px] font-bold uppercase tracking-wide border border-emerald-200/60 dark:border-emerald-900/40">
            <span className="material-symbols-outlined text-[14px]">corporate_fare</span>
            <span>{title}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#dcfce7] dark:bg-emerald-950/80 text-[#15803d] dark:text-[#4edea3] text-[11px] font-bold uppercase tracking-wide border border-emerald-200 dark:border-emerald-800/60">
            <span className="h-1.5 w-1.5 rounded-full bg-[#10b981] animate-pulse" />
            <span>{plan.status || 'Activa'}</span>
          </span>
          <span className="text-slate-300 dark:text-emerald-900">•</span>
          <span className="text-slate-500 dark:text-slate-400 text-[11px] font-semibold tracking-wider uppercase">
            Plan Institucional
          </span>
        </div>

        {error && (
          <p className="mt-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
            {error}
          </p>
        )}

        {/* Plan Title & Description */}
        <div className="mt-2">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#0b1c30] dark:text-white tracking-tight">
            {plan.name}
          </h2>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-300 leading-relaxed max-w-2xl">
            {plan.description}
          </p>
        </div>

        {/* Features & What's Included */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-emerald-900/30 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Capacidades y servicios incluidos
            </h3>
            <span className="text-[11px] font-semibold text-[#006c49] dark:text-[#4edea3]">
              SLA Garantizado 99.99%
            </span>
          </div>

          {/* Core Feature Highlights */}
          {plan.features && plan.features.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {plan.features.map((feat) => (
                <div
                  key={feat.text}
                  className="flex items-center gap-2.5 rounded-lg bg-[#eff4ff]/60 dark:bg-emerald-950/30 border border-[#dce9ff] dark:border-emerald-900/40 p-3 text-xs font-medium text-[#0b1c30] dark:text-white"
                >
                  <span className="material-symbols-outlined text-[18px] text-[#006c49] dark:text-[#6cf8bb] shrink-0">
                    {feat.icon || 'check_circle'}
                  </span>
                  <span className="leading-tight">{feat.text}</span>
                </div>
              ))}
            </div>
          )}

          {/* Included Features List */}
          {plan.includes && plan.includes.length > 0 && (
            <div className="rounded-lg bg-slate-50/70 dark:bg-emerald-950/20 border border-slate-100 dark:border-emerald-900/20 p-4">
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                {plan.includes.map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-[#006c49] dark:text-[#4edea3] shrink-0">
                      done
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div className="mt-5 pt-3 border-t border-slate-100 dark:border-emerald-900/30 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 dark:text-slate-500">
          <span>
            {plan.fechaFin
              ? `Vigente hasta ${new Date(plan.fechaFin).toLocaleDateString('es-BO', { year: 'numeric', month: 'long', day: '2-digit' })}`
              : 'Entorno federado de alta disponibilidad para entidades financieras'}
          </span>
          <span className="font-semibold text-[#006c49] dark:text-[#4edea3]">
            Soporte Fiduciario Continuo
          </span>
        </div>
      </div>
    </div>
  )
}
