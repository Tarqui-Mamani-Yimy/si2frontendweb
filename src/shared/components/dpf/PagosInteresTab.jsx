import { useState, useEffect } from 'react'
import Button from '../../../components/ui/Button'
import Skeleton from '../../../components/ui/Skeleton'
import AlertBanner from '../../../components/ui/AlertBanner'
import { listarPagosInteres } from '../../../core/api/dpfApi'

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

function formatDateTime(isoStr) {
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
 * PagosInteresTab — Pestaña de historial consolidado de pagos periódicos de interés de DPFs (CU-W18).
 *
 * @param {{
 *   onVerCertificado?: (dpfId: number|string) => void
 * }} props
 */
export default function PagosInteresTab({ onVerCertificado }) {
  const [pagos, setPagos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filtros de fecha
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')

  useEffect(() => {
    let isMounted = true

    listarPagosInteres()
      .then((data) => {
        if (!isMounted) return
        setPagos(Array.isArray(data) ? data : [])
      })
      .catch((err) => {
        if (!isMounted) return
        setError(
          err.response?.data?.detail ??
            'Error al cargar el historial de pagos de intereses.',
        )
      })
      .finally(() => {
        if (!isMounted) return
        setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  async function handleFiltrar(e) {
    e?.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const params = {}
      if (desde) params.desde = desde
      if (hasta) params.hasta = hasta
      const data = await listarPagosInteres(params)
      setPagos(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(
        err.response?.data?.detail ??
          'Error al filtrar el historial de pagos de intereses.',
      )
    } finally {
      setLoading(false)
    }
  }

  function handleLimpiarFiltros() {
    setDesde('')
    setHasta('')
    setLoading(true)
    setError(null)
    listarPagosInteres()
      .then((data) => setPagos(Array.isArray(data) ? data : []))
      .catch((err) =>
        setError(
          err.response?.data?.detail ?? 'Error al actualizar historial.',
        ),
      )
      .finally(() => setLoading(false))
  }

  return (
    <div className="space-y-4">
      {/* ── Filtros por Rango de Fecha ── */}
      <form
        onSubmit={handleFiltrar}
        className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs"
      >
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <label htmlFor="fecha_desde" className="font-semibold text-slate-700">
              Desde:
            </label>
            <input
              id="fecha_desde"
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono bg-white"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <label htmlFor="fecha_hasta" className="font-semibold text-slate-700">
              Hasta:
            </label>
            <input
              id="fecha_hasta"
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono bg-white"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              type="submit"
              variant="secondary"
              size="sm"
              loading={loading}
              className="gap-1"
            >
              <span className="material-symbols-outlined text-[15px]">filter_list</span>
              <span>Filtrar</span>
            </Button>

            {(desde || hasta) && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleLimpiarFiltros}
                disabled={loading}
              >
                Limpiar
              </Button>
            )}
          </div>
        </div>

        <div className="text-[11px] text-slate-500 font-mono">
          Total pagos registrados: <strong>{pagos.length}</strong>
        </div>
      </form>

      {error && (
        <AlertBanner variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </AlertBanner>
      )}

      {/* ── Listado / Tabla ── */}
      {loading ? (
        <div className="space-y-2 p-4 bg-white rounded-xl border border-slate-200">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : pagos.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500 space-y-1">
          <span className="material-symbols-outlined text-[32px] text-slate-300 block mb-1">
            payments
          </span>
          <span className="font-semibold text-slate-700 block text-xs">
            No se registran pagos de intereses
          </span>
          <span className="text-[11px] text-slate-400 block">
            {desde || hasta
              ? 'No hay cuotas abonadas en el rango de fechas seleccionado.'
              : 'Aún no se han ejecutado corridas periódicas de pago de intereses de DPF.'}
          </span>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase font-bold text-slate-500">
                <th className="py-2.5 px-3">Fecha y Hora</th>
                <th className="py-2.5 px-3">Certificado DPF</th>
                <th className="py-2.5 px-3">Socio Titular</th>
                <th className="py-2.5 px-3 text-center">Cuota</th>
                <th className="py-2.5 px-3 text-right">Interés Bruto</th>
                <th className="py-2.5 px-3 text-right">RC-IVA</th>
                <th className="py-2.5 px-3 text-right">Neto Abonado</th>
                <th className="py-2.5 px-3">Cuenta Destino</th>
                <th className="py-2.5 px-3 text-center">Transacción</th>
                {onVerCertificado && (
                  <th className="py-2.5 px-3 text-center">Acción</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[11px]">
              {pagos.map((p) => {
                const sim =
                  typeof p.moneda === 'object'
                    ? p.moneda?.simbolo
                    : p.moneda || 'Bs.'
                const fechaFmt = p.fecha_pago_real
                  ? formatDateTime(p.fecha_pago_real)
                  : formatDate(p.fecha_pago)
                const numCert = p.dpf?.numero_certificado || `DPF #${p.dpf?.id}`

                return (
                  <tr key={p.cronograma_id || p.transaccion_id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-slate-700 whitespace-nowrap">
                      {fechaFmt}
                    </td>

                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {numCert}
                    </td>

                    <td className="py-2.5 px-3 text-slate-800">
                      <span className="font-semibold block">{p.socio?.nombre_completo || '—'}</span>
                      {p.socio?.ci && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          CI: {p.socio.ci}
                        </span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 text-center font-mono whitespace-nowrap">
                      #{p.numero} ({p.dias}d)
                    </td>

                    <td className="py-2.5 px-3 text-right font-mono text-slate-600 whitespace-nowrap">
                      {formatMoney(p.interes_bruto, sim)}
                    </td>

                    <td className="py-2.5 px-3 text-right font-mono text-slate-400 whitespace-nowrap">
                      {formatMoney(p.retencion_rciva, sim)}
                    </td>

                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-800 whitespace-nowrap">
                      {formatMoney(p.interes_neto, sim)}
                    </td>

                    <td className="py-2.5 px-3 font-mono text-slate-700 whitespace-nowrap">
                      {p.cuenta_abono?.numero || '—'}
                    </td>

                    <td className="py-2.5 px-3 text-center font-mono text-[10px] text-slate-500 whitespace-nowrap">
                      #{p.transaccion_id}
                    </td>

                    {onVerCertificado && (
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => onVerCertificado(p.dpf?.id)}
                          className="!py-0.5 !px-2 !text-[11px]"
                          title="Ver certificado y cronograma del DPF"
                        >
                          Ver
                        </Button>
                      </td>
                    )}
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
