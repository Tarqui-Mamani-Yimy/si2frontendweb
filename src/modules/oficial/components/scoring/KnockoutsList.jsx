import Badge from '../../../../components/ui/Badge'

/**
 * KnockoutsList — Lista de reglas de exclusión crítica (knock-outs) activadas por el motor de scoring.
 *
 * @param {{ knockouts: Array<{ codigo: string, descripcion: string, efecto: string }> }} props
 */
export default function KnockoutsList({ knockouts = [] }) {
  if (!Array.isArray(knockouts) || knockouts.length === 0) {
    return null
  }

  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-4 space-y-2.5">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-[18px] text-rose-700">gpp_maybe</span>
        <h4 className="text-xs font-bold uppercase tracking-wider text-rose-800">
          Reglas de Exclusión Activadas ({knockouts.length})
        </h4>
      </div>
      <p className="text-[11px] text-rose-700">
        Las siguientes reglas de riesgo prevalecen sobre el puntaje aritmético del motor:
      </p>

      <div className="space-y-2">
        {knockouts.map((ko, idx) => (
          <div
            key={ko.codigo || idx}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg bg-white border border-rose-200/80 shadow-xs"
          >
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                {ko.codigo === 'GARANTIA_INSUFICIENTE' && (
                  <span className="material-symbols-outlined text-[15px] text-amber-700">shield_lock</span>
                )}
                <span className="font-mono text-[11px] font-bold text-rose-900">
                  {ko.codigo}
                </span>
              </div>
              <p className="text-xs text-slate-700 font-medium">{ko.descripcion}</p>
            </div>

            <div>
              <Badge variant={ko.efecto === 'RECHAZADO' ? 'red' : 'amber'}>
                {ko.efecto === 'RECHAZADO' ? 'Rechazo Directo' : 'Deriva a Revisión'}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
