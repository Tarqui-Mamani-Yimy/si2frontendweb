import { useState, useEffect, useRef } from 'react'
import { getIndicadoresReport } from '../../../../core/api/reportesApi'
import { getApiErrorMessage } from '../../../../core/api/errors'
import { formatDate, formatExchangeRate } from '../../../contador/components/contabilidadUtils'
import { formatIndicatorValue } from './reportesChartUtils'
import Badge from '../../../../components/ui/Badge'
import Skeleton from '../../../../components/ui/Skeleton'
import AlertBanner from '../../../../components/ui/AlertBanner'

/**
 * Tab 4: Indicadores Financieros y Gerenciales (CU-W33).
 */
export default function IndicadoresTab({ fechaCorte, refreshTrigger }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const requestIdRef = useRef(0)

  useEffect(() => {
    let isMounted = true
    const reqId = ++requestIdRef.current

    getIndicadoresReport({
      fecha_corte: fechaCorte,
    })
      .then((res) => {
        if (!isMounted || reqId !== requestIdRef.current) return
        setError(null)
        setData(res)
      })
      .catch((err) => {
        if (!isMounted || reqId !== requestIdRef.current) return
        setError(getApiErrorMessage(err, 'Error al cargar los indicadores de gestión.'))
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

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  if (error) {
    return <AlertBanner variant="error">{error}</AlertBanner>
  }

  const indicadores = Array.isArray(data?.indicadores) ? data.indicadores : []
  const tipoCambio = data?.tipo_cambio

  return (
    <div className="space-y-6">
      {/* Nota metodológica */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="material-symbols-outlined text-[20px] text-[#064e3b]">
            info
          </span>
          <div>
            <h4 className="font-bold text-slate-900">
              Indicadores de Gestión Gerencial Interna
            </h4>
            <p className="text-slate-500 text-[11px] mt-0.5">
              Ratios calculados a partir de saldos contables consolidados en moneda nacional (BOB).
              Corresponden a indicadores de gestión directiva (no reportes regulatorios externos ASFI).
            </p>
          </div>
        </div>

        {tipoCambio && (
          <Badge variant="navy" className="text-xs py-1 px-2.5 font-mono">
            TC Oficial: 1 USD = {formatExchangeRate(tipoCambio.valor)} Bs. ({formatDate(tipoCambio.fecha)})
          </Badge>
        )}
      </div>

      {/* Tabla Principal de Indicadores */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-card space-y-4">
        <div className="border-b pb-3 border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900">
              Ratios Financieros y Operativos Clave
            </h3>
            <p className="text-xs text-slate-500">
              Resumen de solvencia, liquidez, rentabilidad y cobertura a la fecha de corte
            </p>
          </div>
          <Badge variant="teal">Gestión</Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4 w-52">Indicador / Ratio</th>
                <th className="py-2.5 px-4 text-center w-36">Valor</th>
                <th className="py-2.5 px-4 min-w-[280px]">Definición y Metodología de Cálculo</th>
                <th className="py-2.5 px-4 min-w-[220px]">Observación / Causa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {indicadores.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400">
                    No existen indicadores calculados para esta fecha
                  </td>
                </tr>
              ) : (
                indicadores.map((ind, idx) => {
                  const hasValue = ind.valor !== null && ind.valor !== undefined
                  const formatted = formatIndicatorValue(ind.valor, ind.unidad || '%')

                  return (
                    <tr key={ind.clave || idx} className="hover:bg-slate-50/70 transition">
                      {/* Indicador */}
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">
                          {ind.nombre || ind.clave}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400 font-semibold">
                          {ind.clave}
                        </span>
                      </td>

                      {/* Valor */}
                      <td className="py-3 px-4 text-center">
                        {hasValue ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-emerald-50 text-[#064e3b] font-mono font-bold text-sm border border-emerald-200">
                            {formatted}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-slate-400 bg-slate-100 font-mono text-xs">
                            <span className="material-symbols-outlined text-[14px]">remove</span>
                            <span>No disponible</span>
                          </span>
                        )}
                      </td>

                      {/* Definición */}
                      <td className="py-3 px-4 text-slate-700">
                        <p className="leading-relaxed">
                          {ind.definicion || 'Sin definición especificada'}
                        </p>
                      </td>

                      {/* Observación / Motivo */}
                      <td className="py-3 px-4">
                        {ind.motivo ? (
                          <div className="flex items-start gap-1.5 p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] leading-tight">
                            <span className="material-symbols-outlined text-amber-600 text-[16px] shrink-0 mt-0.5">
                              info
                            </span>
                            <span>{ind.motivo}</span>
                          </div>
                        ) : hasValue ? (
                          <span className="text-emerald-700 text-[11px] flex items-center gap-1 font-medium">
                            <span className="material-symbols-outlined text-[15px]">check_circle</span>
                            <span>Cálculo vigente</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
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
