function formatMoney(value, simbolo = 'Bs.') {
  const n = Number(value ?? 0)
  return `${simbolo} ${n.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const parts = String(dateStr).split('-')
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`
  }
  return dateStr
}

function getEstadoCuotaBadge(estado) {
  switch (estado) {
    case 'PAGADO':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    case 'PENDIENTE':
      return 'bg-amber-100 text-amber-800 border-amber-200'
    case 'VENCIDO':
    case 'EN_MORA':
      return 'bg-rose-100 text-rose-800 border-rose-200'
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200'
  }
}

/**
 * TablaAmortizacion — Desglose tabular de cuotas de amortización (Francés / Alemán) para CU-W24 y cartera.
 *
 * @param {{
 *   cuotas: Array<object>,
 *   monedaSimbolo?: string,
 *   totalCapital?: number|string,
 *   totalInteres?: number|string,
 *   totalPagar?: number|string,
 *   showEstado?: boolean
 * }} props
 */
export default function TablaAmortizacion({
  cuotas = [],
  monedaSimbolo = 'Bs.',
  totalCapital,
  totalInteres,
  totalPagar,
  showEstado = true,
}) {
  if (!Array.isArray(cuotas) || cuotas.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400 text-xs rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
        No hay cuotas generadas para mostrar.
      </div>
    )
  }

  // Si no se pasaron totales calculados, calcularlos de la lista
  const sumCapital = totalCapital ?? cuotas.reduce((acc, c) => acc + Number(c.capital || 0), 0)
  const sumInteres = totalInteres ?? cuotas.reduce((acc, c) => acc + Number(c.interes || 0), 0)
  const sumPagar = totalPagar ?? cuotas.reduce((acc, c) => acc + Number(c.cuota || 0), 0)

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/80 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            <th className="px-3.5 py-2.5 text-center">N°</th>
            <th className="px-3.5 py-2.5">Vencimiento</th>
            <th className="px-3.5 py-2.5 text-right">Saldo Inicial</th>
            <th className="px-3.5 py-2.5 text-right">Capital</th>
            <th className="px-3.5 py-2.5 text-right">Interés</th>
            <th className="px-3.5 py-2.5 text-right">Cuota Total</th>
            <th className="px-3.5 py-2.5 text-right">Saldo Final</th>
            {showEstado && <th className="px-3.5 py-2.5 text-center">Estado</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 font-mono">
          {cuotas.map((c, i) => (
            <tr key={c.numero ?? i} className="hover:bg-slate-50/70 transition-colors">
              <td className="px-3.5 py-2 text-center font-bold text-slate-700">
                {c.numero}
              </td>
              <td className="px-3.5 py-2 text-slate-800">
                {formatDate(c.fecha_vencimiento)}
              </td>
              <td className="px-3.5 py-2 text-right text-slate-600 tabular-nums">
                {formatMoney(c.saldo_inicial, monedaSimbolo)}
              </td>
              <td className="px-3.5 py-2 text-right font-semibold text-slate-900 tabular-nums">
                {formatMoney(c.capital, monedaSimbolo)}
              </td>
              <td className="px-3.5 py-2 text-right text-emerald-800 tabular-nums">
                {formatMoney(c.interes, monedaSimbolo)}
              </td>
              <td className="px-3.5 py-2 text-right font-bold text-[#064e3b] tabular-nums">
                {formatMoney(c.cuota, monedaSimbolo)}
              </td>
              <td className="px-3.5 py-2 text-right text-slate-600 tabular-nums">
                {formatMoney(c.saldo_final, monedaSimbolo)}
              </td>
              {showEstado && (
                <td className="px-3.5 py-2 text-center">
                  <span
                    className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-full border ${getEstadoCuotaBadge(
                      c.estado_pago || 'PENDIENTE',
                    )}`}
                  >
                    {c.estado_pago || 'PENDIENTE'}
                  </span>
                </td>
              )}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-slate-300 bg-slate-100/90 font-mono text-xs font-bold text-slate-900">
            <td colSpan={2} className="px-3.5 py-2.5 uppercase font-sans text-[11px] text-slate-700">
              Totales ({cuotas.length} cuotas)
            </td>
            <td className="px-3.5 py-2.5 text-right text-slate-400">—</td>
            <td className="px-3.5 py-2.5 text-right tabular-nums text-slate-900">
              {formatMoney(sumCapital, monedaSimbolo)}
            </td>
            <td className="px-3.5 py-2.5 text-right tabular-nums text-emerald-900">
              {formatMoney(sumInteres, monedaSimbolo)}
            </td>
            <td className="px-3.5 py-2.5 text-right tabular-nums text-[#064e3b]">
              {formatMoney(sumPagar, monedaSimbolo)}
            </td>
            <td className="px-3.5 py-2.5 text-right text-slate-400">0.00</td>
            {showEstado && <td className="px-3.5 py-2.5" />}
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
