function getScoreColor(score, dictamen) {
  if (dictamen === 'APROBADO' || (!dictamen && score >= 700)) {
    return {
      text: 'text-emerald-700',
      bg: 'bg-emerald-500',
      track: 'bg-emerald-50',
      border: 'border-emerald-200',
      accent: '#059669',
    }
  }
  if (dictamen === 'REVISION_MANUAL' || (!dictamen && score >= 500)) {
    return {
      text: 'text-amber-700',
      bg: 'bg-amber-500',
      track: 'bg-amber-50',
      border: 'border-amber-200',
      accent: '#d97706',
    }
  }
  return {
    text: 'text-rose-700',
    bg: 'bg-rose-500',
    track: 'bg-rose-50',
    border: 'border-rose-200',
    accent: '#dc2626',
  }
}

/**
 * ScoreGauge — Medidor visual del puntaje de scoring crediticio (0–1000) con umbrales ASFI/NexaCoop.
 *
 * @param {{
 *   score: number,
 *   dictamen?: 'APROBADO' | 'RECHAZADO' | 'REVISION_MANUAL',
 *   className?: string
 * }} props
 */
export default function ScoreGauge({ score = 0, dictamen, className = '' }) {
  const safeScore = Math.max(0, Math.min(1000, Number(score) || 0))
  const percentage = (safeScore / 1000) * 100
  const colors = getScoreColor(safeScore, dictamen)

  return (
    <div className={`p-4 rounded-xl border ${colors.border} bg-white shadow-sm space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
            Puntaje Crediticio (Scoring)
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className={`font-display text-3xl font-extrabold tabular-nums ${colors.text}`}>
              {safeScore}
            </span>
            <span className="text-xs font-semibold text-slate-400">/ 1000 pts</span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
            Nivel de Riesgo
          </span>
          <span className={`text-xs font-bold ${colors.text}`}>
            {safeScore >= 700 ? 'Bajo (Aprobación Automática)' : safeScore >= 500 ? 'Moderado (Revisión Manual)' : 'Alto (Rechazo de Riesgo)'}
          </span>
        </div>
      </div>

      {/* Barra de progreso con marcas de umbrales */}
      <div className="space-y-1.5">
        <div className="relative h-3 w-full rounded-full bg-slate-100 overflow-hidden">
          {/* Fondo por zonas */}
          <div className="absolute inset-0 flex">
            <div className="w-[50%] bg-rose-100/60" title="Zona de Rechazo (0-499)" />
            <div className="w-[20%] bg-amber-100/60" title="Zona de Revisión (500-699)" />
            <div className="w-[30%] bg-emerald-100/60" title="Zona de Aprobación (700-1000)" />
          </div>

          {/* Relleno dinámico según score */}
          <div
            className={`h-full transition-all duration-700 ease-out rounded-full ${colors.bg}`}
            style={{ width: `${percentage}%` }}
          />

          {/* Líneas divisorias en 500 y 700 */}
          <div className="absolute top-0 bottom-0 left-[50%] w-0.5 bg-slate-400/50" />
          <div className="absolute top-0 bottom-0 left-[70%] w-0.5 bg-slate-400/50" />
        </div>

        {/* Ticks y etiquetas de umbral */}
        <div className="relative text-[10px] font-mono text-slate-400 flex justify-between px-0.5">
          <span>0</span>
          <span className="absolute left-[50%] -translate-x-1/2 text-slate-500 font-semibold">
            500 (Manual)
          </span>
          <span className="absolute left-[70%] -translate-x-1/2 text-slate-500 font-semibold">
            700 (Aprobado)
          </span>
          <span>1000</span>
        </div>
      </div>
    </div>
  )
}
