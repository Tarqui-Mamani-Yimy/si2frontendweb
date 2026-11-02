/**
 * MetricCard — tarjeta de métricas financieras e indicadores clave NexaCoop Precision.
 *
 * Props:
 *   label / title: string
 *   value:         string | number
 *   subtitle:      string  — texto descriptivo secundario
 *   icon:          string (nombre Material Symbols / emoji) o node
 *   iconBg:        string  — clase Tailwind para el bg del ícono
 *   iconColor:     string  — clase Tailwind para el color del ícono
 *   delta:         string  — texto de delta opcional (ej: '+12%')
 *   deltaPos:      boolean — true = verde, false = rojo
 *   to:            string  — si se pasa, envuelve en Link
 *   compact:       boolean — formato horizontal compacto para valores clave
 */
import { Link } from 'react-router-dom'

export default function MetricCard({
  label,
  title,
  value,
  subtitle,
  icon,
  iconBg    = 'bg-[#ecfdf5]',
  iconColor = 'text-[#064e3b]',
  delta,
  deltaPos  = true,
  to,
  compact   = false,
}) {
  const displayLabel = label || title

  if (compact) {
    const compactInner = (
      <div className="group relative overflow-hidden rounded-xl bg-white border border-[#e2e8f0] p-4 shadow-card transition-all duration-200 hover:shadow-card-hover hover:border-[#cbd5e1] flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <span className="block font-label-caps text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate">
            {displayLabel}
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-display text-2xl font-bold tabular-nums text-[#0b1c30]">
              {value ?? <span className="text-slate-300 font-sans text-xl">—</span>}
            </span>
            {delta && (
              <span
                className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold ${
                  deltaPos ? 'bg-[#dcfce7] text-[#15803d]' : 'bg-[#fee2e2] text-[#b91c1c]'
                }`}
              >
                {delta}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="mt-0.5 text-xs text-slate-400 truncate">
              {subtitle}
            </p>
          )}
        </div>
        <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 transition-colors ${iconBg} ${iconColor}`}>
          {typeof icon === 'string' && icon.length > 2 ? (
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">{icon}</span>
          ) : (
            <span className="text-lg" aria-hidden="true">{icon}</span>
          )}
        </div>
      </div>
    )
    return to ? <Link to={to} className="block">{compactInner}</Link> : compactInner
  }

  const inner = (
    <div className="group relative overflow-hidden rounded-xl bg-white border border-[#e2e8f0] p-5 shadow-card transition-all duration-200 hover:shadow-card-hover hover:border-[#cbd5e1]">
      <div className="flex items-center justify-between">
        <span className="font-label-caps text-[11px] font-bold uppercase tracking-wider text-slate-500">
          {displayLabel}
        </span>
        <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 transition-colors ${iconBg} ${iconColor}`}>
          {typeof icon === 'string' && icon.length > 2 ? (
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">{icon}</span>
          ) : (
            <span className="text-lg" aria-hidden="true">{icon}</span>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-baseline gap-1">
        <span className="font-display text-2xl lg:text-3xl font-bold tabular-nums text-[#0b1c30]">
          {value ?? <span className="text-slate-300 font-sans text-xl">—</span>}
        </span>
      </div>

      {subtitle && (
        <p className="mt-1 text-xs text-slate-500 truncate">
          {subtitle}
        </p>
      )}

      {delta && (
        <div className="mt-2.5 flex items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
              deltaPos ? 'bg-[#dcfce7] text-[#15803d]' : 'bg-[#fee2e2] text-[#b91c1c]'
            }`}
          >
            <span className="material-symbols-outlined text-[13px]">
              {deltaPos ? 'trending_up' : 'trending_down'}
            </span>
            <span>{delta}</span>
          </span>
        </div>
      )}
    </div>
  )

  return to ? <Link to={to} className="block">{inner}</Link> : inner
}
