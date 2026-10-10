/**
 * FactoresTable — Desglose transparente y auditable de los factores del modelo de scoring (CU-W23).
 *
 * @param {{ factores: Array<{ codigo: string, descripcion: string, puntos: number, maximo: number, valor: string, motivo: string }> }} props
 */
export default function FactoresTable({ factores = [] }) {
  if (!Array.isArray(factores) || factores.length === 0) {
    return (
      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-center text-xs text-slate-500">
        No se registran factores ponderados para esta evaluación.
      </div>
    )
  }

  const totalPuntos = factores.reduce((acc, f) => acc + (Number(f.puntos) || 0), 0)
  const totalMaximo = factores.reduce((acc, f) => acc + (Number(f.maximo) || 0), 0)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between pb-1 border-b border-slate-100">
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[18px] text-[#064e3b]">checklist</span>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Desglose de Factores Ponderados ({factores.length})
          </h4>
        </div>
        <span className="font-mono text-xs font-bold text-slate-700">
          Suma: <span className="text-[#064e3b]">{totalPuntos}</span> / {totalMaximo} pts
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/70 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <th className="px-3.5 py-2.5">Factor</th>
              <th className="px-3.5 py-2.5">Valor Observado</th>
              <th className="px-3.5 py-2.5 text-center">Puntos / Máx</th>
              <th className="px-3.5 py-2.5">Motivo / Criterio</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {factores.map((f, i) => {
              const pts = Number(f.puntos) || 0
              const max = Number(f.maximo) || 0
              const ratio = max > 0 ? pts / max : 0

              let scoreColor = 'text-emerald-700 bg-emerald-50'
              if (ratio < 0.4) {
                scoreColor = 'text-rose-700 bg-rose-50'
              } else if (ratio < 0.75) {
                scoreColor = 'text-amber-700 bg-amber-50'
              }

              return (
                <tr key={f.codigo || i} className="hover:bg-slate-50/60 transition-colors">
                  {/* Factor */}
                  <td className="px-3.5 py-2.5 align-top">
                    <span className="font-bold text-slate-800 block text-xs">
                      {f.descripcion || f.codigo}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400 block">
                      {f.codigo}
                    </span>
                  </td>

                  {/* Valor Observado */}
                  <td className="px-3.5 py-2.5 align-top">
                    <span className="font-medium text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-[11px] font-mono inline-block">
                      {f.valor || '—'}
                    </span>
                  </td>

                  {/* Puntos / Max */}
                  <td className="px-3.5 py-2.5 align-top text-center whitespace-nowrap">
                    <span className={`inline-block px-2 py-0.5 rounded font-mono font-bold text-xs ${scoreColor}`}>
                      {pts} / {max}
                    </span>
                  </td>

                  {/* Motivo */}
                  <td className="px-3.5 py-2.5 align-top text-slate-600 text-[11px]">
                    {f.motivo || '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
