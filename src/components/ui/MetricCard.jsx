/**
 * MetricCard — tarjeta de métricas financieras e indicadores clave NexaCoop Precision.
 *
 * Props:
 *   label:    string
 *   value:    string | number
 *   icon:     string (nombre Material Symbols / emoji) o node
 *   iconBg:   string  — clase Tailwind para el bg del ícono
 *   iconColor:string  — clase Tailwind para el color del ícono
 *   delta:    string  — texto de delta opcional (ej: '+12%')
 *   deltaPos: boolean — true = verde, false = rojo
 *   to:       string  — si se pasa, envuelve en Link
 */
import { Link } from 'react-router-dom'

export default function MetricCard({
  label,
  value,
  icon,
  iconBg    = 'bg-[#ecfdf5]',
  iconColor = 'text-[#064e3b]',
  delta,
  deltaPos  = true,
  to,
}) {
  const inner = (
    <div className="group relative overflow-hidden rounded-xl bg-white border border-[#e2e8f0] p-5 shadow-card transition-all duration-200 hover:shadow-card-hover hover:border-[#cbd5e1]">
      <div className="flex items-center justify-between">
        <span className="font-label-caps text-[11px] font-bold uppercase tracking-wider text-slate-500">
          {label}
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
