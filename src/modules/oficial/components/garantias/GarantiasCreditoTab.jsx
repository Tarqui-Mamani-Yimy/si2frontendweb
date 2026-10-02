import { useState, useEffect } from 'react'
import Badge from '../../../../components/ui/Badge'
import Skeleton from '../../../../components/ui/Skeleton'
import AlertBanner from '../../../../components/ui/AlertBanner'
import { listarGarantiasCredito } from '../../../../core/api/creditosApi'

function formatMoney(value, simbolo = 'Bs.') {
  const n = typeof value === 'number' ? value : parseFloat(value ?? 0)
  const safe = isNaN(n) ? 0 : n
  return `${simbolo} ${safe.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(isoStr) {
  if (!isoStr) return '—'
  const d = new Date(isoStr)
  if (isNaN(d.getTime())) return isoStr
  return d.toLocaleDateString('es-BO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function getEstadoBadgeVariant(estado) {
  switch (estado) {
    case 'LIBERADA':
      return 'teal'
    case 'VERIFICADA':
      return 'green'
    case 'REGISTRADA':
      return 'amber'
    case 'RECHAZADA':
      return 'red'
    default:
      return 'slate'
  }
}

function getTipoBadgeVariant(tipo) {
  switch (tipo) {
    case 'HIPOTECARIA':
      return 'navy'
    case 'PRENDARIA':
      return 'indigo'
    case 'PERSONAL':
      return 'green'
    default:
      return 'slate'
  }
}

/**
 * GarantiasCreditoTab — Visualización de garantías asociadas a un crédito en cartera (CU-W22).
 * Muestra el estado de gravamen y liberación automática al cancelar el crédito (CU-W27).
 *
 * @param {{
 *   creditoId: number|string,
 *   credito?: object|null
 * }} props
 */
export default function GarantiasCreditoTab({ creditoId, credito }) {
  const [garantias, setGarantias] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const sim = (typeof credito?.moneda === 'object' ? credito?.moneda?.simbolo : 'Bs.') || 'Bs.'
  const esCancelado = credito?.estado === 'CANCELADO'

  useEffect(() => {
    if (!creditoId) return
    let isMounted = true

    listarGarantiasCredito(creditoId)
      .then((data) => {
        if (!isMounted) return
        setGarantias(Array.isArray(data) ? data : [])
      })
      .catch((err) => {
        if (!isMounted) return
        setError(
          err.response?.data?.detail || 'Error al cargar las garantías del crédito.',
        )
      })
      .finally(() => {
        if (!isMounted) return
        setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [creditoId])

  if (loading) {
    return (
      <div className="space-y-3 p-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <AlertBanner variant="error" dismissible onDismiss={() => setError(null)}>
        {error}
      </AlertBanner>
    )
  }

  const totalRealizable = garantias.reduce(
    (acc, g) => acc + parseFloat(g.valor_realizable ?? 0),
    0,
  )

  return (
    <div className="space-y-4">
      {/* ── Banner si el crédito fue Cancelado y las garantías fueron Liberadas ── */}
      {esCancelado && (
        <div className="p-3.5 rounded-xl border border-teal-200 bg-teal-50/80 text-teal-950 flex items-start gap-3">
          <span className="material-symbols-outlined text-[22px] text-teal-700 shrink-0 mt-0.5">
            lock_open
          </span>
          <div className="text-xs space-y-0.5">
            <span className="font-bold block">
              Garantías Liberadas por Cancelación Total
            </span>
            <p className="text-teal-900 text-[11px]">
              Al haberse cancelado íntegramente el crédito y sus obligaciones, las garantías hipotecarias, prendarias y avales han pasado a estado <strong>LIBERADA</strong> automáticamente.
            </p>
          </div>
        </div>
      )}

      {/* ── Resumen de Garantías en Cartera ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50/70">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-[#064e3b]">
            shield
          </span>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Garantías y Avales en Custodia ({garantias.length})
            </h4>
            <span className="text-[10px] text-slate-500 font-mono">
              Crédito: {credito?.numero_credito || `#${creditoId}`}
            </span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            Valor Realizable Total
          </span>
          <span className="font-mono font-bold text-slate-900 text-sm">
            {formatMoney(totalRealizable, sim)}
          </span>
        </div>
      </div>

      {/* ── Listado ── */}
      {garantias.length === 0 ? (
        <div className="p-8 text-center text-slate-400 bg-slate-50/50 rounded-xl border border-slate-200 space-y-1">
          <span className="material-symbols-outlined text-[32px] text-slate-300 block mb-1">
            shield_off
          </span>
          <span className="font-semibold text-slate-600 block text-xs">
            Sin garantías registradas
          </span>
          <span className="text-[11px] text-slate-400 block">
            Este crédito no cuenta con bienes o avales registrados en su expediente original.
          </span>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase font-bold text-slate-500">
                <th className="py-2.5 px-3">Tipo</th>
                <th className="py-2.5 px-3">Estado</th>
                <th className="py-2.5 px-3">Descripción y Respaldo</th>
                <th className="py-2.5 px-3 text-right">Val. Comercial</th>
                <th className="py-2.5 px-3 text-right">Val. Realizable</th>
                <th className="py-2.5 px-3">Verificación / Liberación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[11px]">
              {garantias.map((g) => {
                const gSim =
                  (typeof g.moneda === 'object' ? g.moneda?.simbolo : sim) || sim
                return (
                  <tr key={g.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <Badge variant={getTipoBadgeVariant(g.tipo)}>
                        {g.tipo}
                      </Badge>
                    </td>

                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <Badge variant={getEstadoBadgeVariant(g.estado)}>
                        {g.estado}
                      </Badge>
                    </td>

                    <td className="py-2.5 px-3 max-w-xs">
                      <p className="font-semibold text-slate-900">{g.descripcion}</p>

                      {g.tipo === 'PERSONAL' && g.avalista && (
                        <div className="mt-1 text-[10px] text-slate-600">
                          Garante: <strong>{g.avalista.nombre}</strong> (CI: {g.avalista.ci})
                          {g.avalista.telefono && ` • Tel: ${g.avalista.telefono}`}
                        </div>
                      )}

                      {g.documento_referencia && (
                        <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                          Doc: {g.documento_referencia}
                        </span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 text-right font-mono text-slate-700 whitespace-nowrap">
                      {g.valor_comercial != null ? (
                        formatMoney(g.valor_comercial, gSim)
                      ) : (
                        <span className="text-slate-400 italic text-[10px]">—</span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                      {formatMoney(g.valor_realizable, gSim)}
                    </td>

                    <td className="py-2.5 px-3 text-[10px] text-slate-500 whitespace-nowrap">
                      {g.usuario_verificacion && (
                        <div>
                          Verif: <strong>{g.usuario_verificacion.nombre}</strong> ({formatDate(g.fecha_verificacion)})
                        </div>
                      )}
                      {g.fecha_liberacion ? (
                        <div className="text-teal-800 font-bold mt-0.5">
                          Liberada el: {formatDate(g.fecha_liberacion)}
                        </div>
                      ) : (
                        <div className="text-slate-400">Gravamen activo</div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
