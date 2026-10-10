import { useState, useEffect } from 'react'
import Button from '../../../../components/ui/Button'
import Badge from '../../../../components/ui/Badge'
import Skeleton from '../../../../components/ui/Skeleton'
import AlertBanner from '../../../../components/ui/AlertBanner'
import { listarPagos } from '../../../../core/api/creditosApi'

function formatMoney(value, simbolo = 'Bs.') {
  const n = Number(value ?? 0)
  return `${simbolo} ${n.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(isoStr) {
  if (!isoStr) return '—'
  const d = new Date(isoStr)
  if (isNaN(d.getTime())) return isoStr
  return d.toLocaleString('es-BO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * HistorialPagosTable — Tabla de pagos efectuados sobre el crédito con opción de reimpresión (CU-W27).
 *
 * @param {{
 *   creditoId: number|string,
 *   monedaSimbolo?: string,
 *   onVerComprobante?: (pago: object) => void
 * }} props
 */
export default function HistorialPagosTable({ creditoId, monedaSimbolo = 'Bs.', onVerComprobante }) {
  const [pagos, setPagos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!creditoId) return
    let isMounted = true

    async function fetchPagos() {
      setLoading(true)
      setError(null)
      try {
        const data = await listarPagos(creditoId)
        if (isMounted) setPagos(Array.isArray(data) ? data : [])
      } catch (err) {
        if (isMounted) {
          setError(
            err.response?.data?.detail ||
              'Error al cargar el historial de pagos del crédito.',
          )
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchPagos()

    return () => {
      isMounted = false
    }
  }, [creditoId])

  if (loading) {
    return (
      <div className="space-y-2 p-3">
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <AlertBanner variant="error" onClose={() => setError(null)}>
        {error}
      </AlertBanner>
    )
  }

  if (pagos.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400 bg-slate-50/60 rounded-xl border border-slate-200">
        <span className="material-symbols-outlined text-[32px] text-slate-300 block mb-1">
          receipt_long
        </span>
        <span className="font-semibold text-slate-600 block text-xs">
          No hay pagos registrados
        </span>
        <span className="text-[11px] text-slate-400">
          Aún no se ha procesado el cobro de ninguna cuota para este crédito.
        </span>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="border-b border-slate-200 bg-[#f8f9ff]">
            <th className="px-3.5 py-2.5 font-semibold text-slate-600 uppercase text-[10px]">
              N° Recibo
            </th>
            <th className="px-3.5 py-2.5 font-semibold text-slate-600 uppercase text-[10px]">
              Fecha y Hora
            </th>
            <th className="px-3.5 py-2.5 font-semibold text-slate-600 uppercase text-[10px] text-center">
              Cuota
            </th>
            <th className="px-3.5 py-2.5 font-semibold text-slate-600 uppercase text-[10px] text-right">
              Capital
            </th>
            <th className="px-3.5 py-2.5 font-semibold text-slate-600 uppercase text-[10px] text-right">
              Interés
            </th>
            <th className="px-3.5 py-2.5 font-semibold text-slate-600 uppercase text-[10px] text-right">
              Mora
            </th>
            <th className="px-3.5 py-2.5 font-semibold text-slate-600 uppercase text-[10px] text-right">
              Total Pagado
            </th>
            <th className="px-3.5 py-2.5 font-semibold text-slate-600 uppercase text-[10px] text-center">
              Modalidad
            </th>
            <th className="px-3.5 py-2.5 font-semibold text-slate-600 uppercase text-[10px]">
              Operador
            </th>
            <th className="px-3.5 py-2.5 font-semibold text-slate-600 uppercase text-[10px] text-center">
              Acción
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {pagos.map((p) => {
            const sim = (typeof p.moneda === 'object' ? p.moneda?.simbolo : monedaSimbolo) || monedaSimbolo
            const numRecibo = p.numero_recibo || `REC-#${p.id}`
            const nombreUsuario = (typeof p.usuario === 'object' ? p.usuario?.nombre : null) || '—'
            const numCuenta = (typeof p.cuenta === 'object' ? p.cuenta?.numero : null) || null

            return (
              <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="px-3.5 py-2.5 font-mono font-bold text-slate-900">
                  {numRecibo}
                </td>
                <td className="px-3.5 py-2.5 text-slate-600 text-[11px] whitespace-nowrap">
                  {formatDate(p.fecha)}
                </td>
                <td className="px-3.5 py-2.5 text-center font-mono font-bold text-slate-700">
                  N° {p.numero_cuota ?? '—'}
                </td>
                <td className="px-3.5 py-2.5 text-right font-mono text-slate-800">
                  {formatMoney(p.capital, sim)}
                </td>
                <td className="px-3.5 py-2.5 text-right font-mono text-slate-800">
                  {formatMoney(p.interes, sim)}
                </td>
                <td className="px-3.5 py-2.5 text-right font-mono">
                  {Number(p.mora ?? 0) > 0 ? (
                    <span className="text-rose-700 font-bold">
                      {formatMoney(p.mora, sim)}
                    </span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="px-3.5 py-2.5 text-right font-mono font-bold text-[#064e3b]">
                  {formatMoney(p.total, sim)}
                </td>
                <td className="px-3.5 py-2.5 text-center">
                  <Badge variant={p.modalidad === 'CUENTA' ? 'indigo' : 'green'} className="!text-[9px] !py-0 !px-1.5">
                    {p.modalidad === 'CUENTA'
                      ? `Cuenta ${numCuenta ? `#${numCuenta}` : ''}`
                      : 'Efectivo'}
                  </Badge>
                </td>
                <td className="px-3.5 py-2.5 text-slate-600 text-[11px] truncate max-w-[120px]" title={nombreUsuario}>
                  {nombreUsuario}
                </td>
                <td className="px-3.5 py-2.5 text-center whitespace-nowrap">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => onVerComprobante?.(p)}
                    className="gap-1 !text-[11px] !py-0.5 !px-2"
                    title="Ver e imprimir comprobante oficial"
                  >
                    <span className="material-symbols-outlined text-[13px]">print</span>
                    <span>Recibo</span>
                  </Button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
