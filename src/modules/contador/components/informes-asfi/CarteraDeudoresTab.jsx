import { useState, useEffect, useRef, useMemo } from 'react'
import { getCarteraDeudores } from '../../../../core/api/informesAsfiApi'
import { getApiErrorMessage } from '../../../../core/api/errors'
import { formatMoney, formatDate } from '../contabilidadUtils'
import { getCategoryBadgeVariant, formatTipoCreditoAsfi } from './informesAsfiUtils'
import Badge from '../../../../components/ui/Badge'
import Skeleton from '../../../../components/ui/Skeleton'
import AlertBanner from '../../../../components/ui/AlertBanner'

/**
 * Tab: Cartera por Deudores — Base Regulatoria para CIC (CU-W34).
 * Presenta el desglose individual de obligaciones fiduciarias por deudor.
 */
export default function CarteraDeudoresTab({ fechaCorte, refreshTrigger }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const requestIdRef = useRef(0)

  useEffect(() => {
    let isMounted = true
    const reqId = ++requestIdRef.current

    getCarteraDeudores({ fecha_corte: fechaCorte })
      .then((res) => {
        if (!isMounted || reqId !== requestIdRef.current) return
        setError(null)
        setData(res)
      })
      .catch((err) => {
        if (!isMounted || reqId !== requestIdRef.current) return
        setError(getApiErrorMessage(err, 'Error al cargar el reporte de cartera por deudores.'))
      })
      .finally(() => {
        if (isMounted && reqId === requestIdRef.current) {
          setLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [fechaCorte, refreshTrigger])

  const deudores = useMemo(() => {
    return Array.isArray(data?.cartera_deudores) ? data.cartera_deudores : []
  }, [data])

  const advertencias = useMemo(() => {
    return Array.isArray(data?.advertencias) ? data.advertencias : []
  }, [data])

  const etiquetaOficial = data?.etiqueta || 'Base para reporte a la CIC — formato interno; el layout oficial SCIP/CIC no está publicado en fuente verificable'

  const deudoresFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (!q) return deudores
    return deudores.filter((d) => {
      const ci = String(d.ci || '').toLowerCase()
      const nombre = String(d.nombre || '').toLowerCase()
      const num = String(d.numero_credito || '').toLowerCase()
      return ci.includes(q) || nombre.includes(q) || num.includes(q)
    })
  }, [deudores, busqueda])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    )
  }

  if (error) {
    return <AlertBanner variant="error">{error}</AlertBanner>
  }

  return (
    <div className="space-y-6">
      {/* Advertencias si existen créditos legacy sin moneda */}
      {advertencias.length > 0 && (
        <div className="space-y-3">
          {advertencias.map((adv, idx) => (
            <AlertBanner
              key={adv.codigo || idx}
              variant="warning"
              title="Advertencia de Cartera y Deudores"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-1">
                <span className="font-medium text-amber-900">{adv.mensaje}</span>
                <div className="flex items-center gap-2 shrink-0 text-xs">
                  {adv.creditos != null && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 font-semibold border border-amber-300">
                      {adv.creditos} {adv.creditos === 1 ? 'crédito afectado' : 'créditos afectados'}
                    </span>
                  )}
                  {adv.saldo != null && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-950 font-mono font-bold border border-amber-300">
                      Saldo: {formatMoney(adv.saldo, 'Bs.')}
                    </span>
                  )}
                </div>
              </div>
            </AlertBanner>
          ))}
        </div>
      )}

      {/* Disclaimer / Label Oficial de Formato Interno */}
      <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-xs text-amber-900 shadow-xs flex items-start gap-3">
        <span className="material-symbols-outlined text-[22px] text-amber-600 shrink-0 mt-0.5">info</span>
        <div>
          <span className="font-bold uppercase tracking-wider text-amber-950 text-[11px] block">
            Aviso Regulatorio de Formato Institucional
          </span>
          <p className="mt-0.5 leading-relaxed text-amber-800">
            {etiquetaOficial}
          </p>
        </div>
      </div>

      {/* Tabla de Deudores */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 border-slate-100">
          <div>
            <h3 className="font-bold text-sm text-slate-900">
              Cartera Individual por Deudores y Contratos
            </h3>
            <p className="text-xs text-slate-500">
              {deudores.length} registros de deudores y obligaciones al {fechaCorte}
            </p>
          </div>

          <div>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por CI, nombre o N° crédito..."
              className="h-8 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs text-slate-900 outline-none focus:border-[#006c49] focus:bg-white focus:ring-1 focus:ring-[#006c49]/20 w-64"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">CI</th>
                <th className="py-2.5 px-3">Deudor / Socio</th>
                <th className="py-2.5 px-3">N° Crédito</th>
                <th className="py-2.5 px-3">Tipo ASFI</th>
                <th className="py-2.5 px-3 text-center">Moneda</th>
                <th className="py-2.5 px-3 text-right">Desembolsado</th>
                <th className="py-2.5 px-3 text-right">Saldo Capital</th>
                <th className="py-2.5 px-3 text-center">F. Desembolso</th>
                <th className="py-2.5 px-3 text-center">F. Vencimiento</th>
                <th className="py-2.5 px-3 text-center">Mora (días)</th>
                <th className="py-2.5 px-3 text-center">Cat.</th>
                <th className="py-2.5 px-3 text-right">Previsión</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {deudoresFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-8 text-center text-slate-400">
                    {deudores.length === 0
                      ? 'No hay registros de deudores para la fecha de corte seleccionada.'
                      : 'Ningún deudor coincide con la búsqueda ingresada.'}
                  </td>
                </tr>
              ) : (
                deudoresFiltrados.map((d, idx) => {
                  const sim = d.moneda === 'USD' ? '$' : d.moneda === 'BOB' ? 'Bs.' : ''
                  const badgeCat = getCategoryBadgeVariant(d.categoria)

                  return (
                    <tr key={d.numero_credito || idx} className="hover:bg-slate-50/70 transition">
                      <td className="py-2.5 px-3 font-mono font-medium text-slate-700">
                        {d.ci || '—'}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900 truncate max-w-[160px]">
                        {d.nombre || '—'}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                        {d.numero_credito}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {d.tipo_credito_asfi ? formatTipoCreditoAsfi(d.tipo_credito_asfi) : 'Sin clasificar'}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-700">
                        {d.moneda || '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                        {d.monto_desembolsado != null ? formatMoney(d.monto_desembolsado, sim || 'Bs.') : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        {d.saldo != null ? formatMoney(d.saldo, sim || 'Bs.') : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-500">
                        {formatDate(d.fecha_desembolso)}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-500">
                        {formatDate(d.fecha_vencimiento_final)}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono">
                        <span className={d.dias_mora > 0 ? 'font-bold text-rose-700' : 'text-slate-600'}>
                          {d.dias_mora ?? 0}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <Badge variant={badgeCat}>
                          {d.categoria ? `Cat. ${d.categoria}` : '—'}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-[#064e3b]">
                        {d.prevision != null ? formatMoney(d.prevision, sim || 'Bs.') : '—'}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
