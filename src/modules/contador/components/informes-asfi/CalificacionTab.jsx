import { useState, useEffect, useRef, useMemo } from 'react'
import { getCalificacionCartera } from '../../../../core/api/informesAsfiApi'
import { getApiErrorMessage } from '../../../../core/api/errors'
import { formatMoney, toCents, fromCents } from '../contabilidadUtils'
import {
  normalizeCategoryDistribution,
  calculateTotalCarteraFromPorCategoria,
  evaluateDiferenciaMoneda,
  getCategoryBadgeVariant,
  formatTipoCreditoAsfi,
} from './informesAsfiUtils'
import MetricCard from '../../../../components/ui/MetricCard'
import Badge from '../../../../components/ui/Badge'
import Skeleton from '../../../../components/ui/Skeleton'
import AlertBanner from '../../../../components/ui/AlertBanner'
import HorizontalBarChart from '../../../admin/components/reportes/HorizontalBarChart'

/**
 * Tab: Calificación de Cartera y Previsiones ASFI (CU-W34).
 * Evalúa cartera según días de mora (RNSF Libro 3, Título II, Capítulo IV).
 */
export default function CalificacionTab({ fechaCorte, refreshTrigger }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const requestIdRef = useRef(0)

  useEffect(() => {
    let isMounted = true
    const reqId = ++requestIdRef.current

    getCalificacionCartera({ fecha_corte: fechaCorte })
      .then((res) => {
        if (!isMounted || reqId !== requestIdRef.current) return
        setError(null)
        setData(res)
      })
      .catch((err) => {
        if (!isMounted || reqId !== requestIdRef.current) return
        setError(getApiErrorMessage(err, 'Error al cargar la calificación de cartera y previsiones.'))
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

  const creditos = useMemo(() => {
    return Array.isArray(data?.creditos) ? data.creditos : []
  }, [data])

  const porCategoria = useMemo(() => {
    return Array.isArray(data?.por_categoria) ? data.por_categoria : []
  }, [data])

  const totalesCartera = useMemo(() => {
    return calculateTotalCarteraFromPorCategoria(porCategoria)
  }, [porCategoria])

  const categoryDistribution = useMemo(() => {
    return normalizeCategoryDistribution(porCategoria, totalesCartera.totalBobCents / 100)
  }, [porCategoria, totalesCartera])

  const chartItems = useMemo(() => {
    return categoryDistribution.map((cat) => ({
      label: cat.label,
      value: cat.saldo,
      formattedValue: formatMoney(cat.saldo, 'Bs.'),
      percentage: cat.percentage,
      count: cat.count,
      color: cat.color,
    }))
  }, [categoryDistribution])

  const creditosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return creditos.filter((c) => {
      const matchCat = !filtroCategoria || String(c.categoria).toUpperCase() === filtroCategoria
      if (!matchCat) return false
      if (!q) return true
      const num = String(c.numero_credito || '').toLowerCase()
      const socio = typeof c.socio === 'object'
        ? `${c.socio?.nombre || ''} ${c.socio?.ci || ''}`.toLowerCase()
        : String(c.socio || '').toLowerCase()
      const prod = String(c.producto || '').toLowerCase()
      return num.includes(q) || socio.includes(q) || prod.includes(q)
    })
  }, [creditos, busqueda, filtroCategoria])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
        <Skeleton className="h-56 w-full rounded-xl" />
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    )
  }

  if (error) {
    return <AlertBanner variant="error">{error}</AlertBanner>
  }

  // Previsiones por moneda (Objetos { BOB: "...", USD: "..." })
  const totalPrevEsp = data?.total_prevision_especifica || {}
  const totalPrevCic = data?.total_prevision_ciclica || {}
  const prevContable = data?.prevision_contable || {}
  const diferencia = data?.diferencia || {}

  const prevEspBob = totalPrevEsp.BOB ?? '0.00'
  const prevCicBob = totalPrevCic.BOB ?? '0.00'
  const reqTotalBobCents = toCents(prevEspBob) + toCents(prevCicBob)
  const reqTotalBob = fromCents(reqTotalBobCents)

  const contableBob = prevContable.BOB ?? '0.00'
  const difBobStr = diferencia.BOB ?? fromCents(reqTotalBobCents - toCents(contableBob))
  const compBob = evaluateDiferenciaMoneda(difBobStr)

  const hasUsd = totalesCartera.totalUsdCents > 0 || toCents(prevContable.USD) > 0 || toCents(totalPrevEsp.USD) > 0

  const advertencias = Array.isArray(data?.advertencias) ? data.advertencias : []
  const criterioNormativo = typeof data?.criterio === 'string'
    ? data.criterio
    : 'RNSF Libro 3° Título II Capítulo IV Sección 2 Arts. 7 y 8 y Sección 3 Arts. 1 y 8. Previsión específica y cíclica requeridas.'

  return (
    <div className="space-y-6">
      {/* Advertencias Normativas */}
      {advertencias.length > 0 && (
        <div className="space-y-3">
          {advertencias.map((adv, idx) => (
            <AlertBanner
              key={adv.codigo || idx}
              variant="warning"
              title="Advertencia de Cartera y Previsiones"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-1">
                <span className="font-medium text-amber-900">{adv.mensaje}</span>
                <div className="flex items-center gap-2 shrink-0 text-xs">
                  {adv.creditos != null && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 font-semibold border border-amber-300">
                      {adv.creditos} {adv.creditos === 1 ? 'crédito excluido' : 'créditos excluidos'}
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

      {/* Criterio Normativo Callout */}
      <div className="rounded-xl border border-sky-100 bg-sky-50/70 p-4 text-xs text-sky-900 flex items-start gap-3">
        <span className="material-symbols-outlined text-[20px] text-sky-700 shrink-0 mt-0.5">policy</span>
        <div className="space-y-1">
          <span className="font-bold uppercase tracking-wider text-sky-950 text-[11px] block">
            Criterio Normativo Aplicado (ASFI)
          </span>
          <p className="leading-relaxed text-sky-800">{criterioNormativo}</p>
        </div>
      </div>

      {/* KPI Headline Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Cartera Evaluada"
          value={formatMoney(totalesCartera.BOB, 'Bs.')}
          icon="account_balance_wallet"
          iconBg="bg-emerald-50"
          iconColor="text-[#064e3b]"
          delta={hasUsd ? `+ $ ${formatMoney(totalesCartera.USD, '')}` : `${creditos.length} operaciones`}
          deltaPos={true}
        />

        <MetricCard
          label="Previsión Específica Requerida"
          value={formatMoney(prevEspBob, 'Bs.')}
          icon="shield"
          iconBg="bg-amber-50"
          iconColor="text-amber-700"
          delta={toCents(totalPrevEsp.USD) > 0 ? `+ $ ${formatMoney(totalPrevEsp.USD, '')}` : 'Sección 3, Art. 1'}
          deltaPos={false}
        />

        <MetricCard
          label="Previsión Cíclica Requerida"
          value={formatMoney(prevCicBob, 'Bs.')}
          icon="cyclone"
          iconBg="bg-indigo-50"
          iconColor="text-indigo-700"
          delta={toCents(totalPrevCic.USD) > 0 ? `+ $ ${formatMoney(totalPrevCic.USD, '')}` : 'Categoría A (Art. 8)'}
          deltaPos={true}
        />

        <MetricCard
          label="Total Previsión Normativa"
          value={formatMoney(reqTotalBob, 'Bs.')}
          icon="verified"
          iconBg="bg-emerald-50"
          iconColor="text-emerald-700"
          delta="Específica + Cíclica"
          deltaPos={true}
        />
      </div>

      {/* Comparación Normativa: Previsión Requerida vs Registrada Contable (Cuenta 139) */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 border-slate-100">
          <div>
            <h3 className="font-bold text-sm text-slate-900">
              Comparación Regulatoria: Previsión Requerida vs Saldo Contable (Cta. 139)
            </h3>
            <p className="text-xs text-slate-500">
              Evaluación de suficiencia fiduciaria entre la previsión calculada por norma y el saldo constituido en balance.
            </p>
          </div>
          <Badge variant={compBob.badgeVariant}>{compBob.estadoLabel}</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Previsión Normativa Requerida (BOB)
            </span>
            <span className="font-display text-xl font-bold text-slate-900 block font-mono">
              {formatMoney(reqTotalBob, 'Bs.')}
            </span>
            <span className="text-[11px] text-slate-400">Total al corte {fechaCorte}</span>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Previsión Contable en Libros (BOB)
            </span>
            <span className="font-display text-xl font-bold text-[#064e3b] block font-mono">
              {formatMoney(contableBob, 'Bs.')}
            </span>
            <span className="text-[11px] text-slate-400">Saldo Cuenta 139</span>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Diferencia (Requerida − Contable)
            </span>
            <span className={`font-display text-xl font-bold block font-mono ${compBob.estado === 'DEFICIT' ? 'text-rose-700' : 'text-emerald-700'}`}>
              {formatMoney(compBob.diferencia, 'Bs.')}
            </span>
            <span className="text-[11px] text-slate-500">
              {compBob.estado === 'DEFICIT' ? 'Falta constituir en libros' : 'Suficiencia contable cubierta'}
            </span>
          </div>
        </div>

        {/* Sección USD si existe movimiento o previsión en dólares */}
        {hasUsd && (
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Previsión y Cartera en Dólares Americanos (USD):</span>
            <div className="flex items-center gap-4 font-mono font-medium">
              <span>Contable USD: {formatMoney(prevContable.USD ?? '0.00', '$')}</span>
              <span>Diferencia USD: {formatMoney(diferencia.USD ?? '0.00', '$')}</span>
            </div>
          </div>
        )}
      </div>

      {/* Distribución por Categorías A–F */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-card space-y-4">
        <div className="flex items-center justify-between border-b pb-3 border-slate-100">
          <div>
            <h3 className="font-bold text-sm text-slate-900">
              Estratificación de Cartera por Categoría de Riesgo ASFI
            </h3>
            <p className="text-xs text-slate-500">
              Distribución de volumen crediticio y operaciones clasificadas de Categoría A (Normal) a F (Castigo)
            </p>
          </div>
          <Badge variant="teal">Escala RNSF</Badge>
        </div>

        <HorizontalBarChart
          items={chartItems}
          maxValue={totalesCartera.totalBobCents / 100}
          emptyMessage="Sin colocaciones para evaluar en la fecha de corte"
        />

        {/* Resumen numérico por categoría */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-2">
          {categoryDistribution.map((cat) => (
            <div
              key={cat.categoria}
              className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 text-center space-y-1"
            >
              <div className="flex items-center justify-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                <span className="font-bold text-xs text-slate-800">Cat. {cat.categoria}</span>
              </div>
              <span className="block font-mono font-bold text-xs text-slate-900">
                {formatMoney(cat.saldo, 'Bs.')}
              </span>
              <span className="block text-[10px] text-slate-400 font-mono">
                {cat.count} op. ({cat.percentage}%)
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Tabla Detallada de Créditos Calificados */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 border-slate-100">
          <div>
            <h3 className="font-bold text-sm text-slate-900">
              Detalle Individual de Créditos y Previsiones Calculadas
            </h3>
            <p className="text-xs text-slate-500">
              Base de cálculo, mora, garantías hipotecarias aplicadas y previsión específica/cíclica
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar crédito, socio o CI..."
              className="h-8 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs text-slate-900 outline-none focus:border-[#006c49] focus:bg-white focus:ring-1 focus:ring-[#006c49]/20"
            />

            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="h-8 rounded-lg border border-slate-200 bg-slate-50 px-2 text-xs text-slate-800 outline-none focus:border-[#006c49]"
            >
              <option value="">Todas las Cat.</option>
              {['A', 'B', 'C', 'D', 'E', 'F'].map((c) => (
                <option key={c} value={c}>Cat. {c}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">N° Crédito</th>
                <th className="py-2.5 px-3">Socio / CI</th>
                <th className="py-2.5 px-3">Tipo ASFI</th>
                <th className="py-2.5 px-3 text-right">Saldo Capital</th>
                <th className="py-2.5 px-3 text-center">Días Mora</th>
                <th className="py-2.5 px-3 text-center">Categoría</th>
                <th className="py-2.5 px-3 text-right">% Prev.</th>
                <th className="py-2.5 px-3 text-right">Base Cálculo</th>
                <th className="py-2.5 px-3 text-right">Prev. Específica</th>
                <th className="py-2.5 px-3 text-right">Prev. Cíclica</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {creditosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    {creditos.length === 0
                      ? 'No hay créditos registrados para la fecha de corte seleccionada.'
                      : 'Ningún crédito coincide con los filtros aplicados.'}
                  </td>
                </tr>
              ) : (
                creditosFiltrados.map((cr, idx) => {
                  const socioNombre = typeof cr.socio === 'object' ? cr.socio?.nombre : cr.socio
                  const socioCi = typeof cr.socio === 'object' ? cr.socio?.ci : ''
                  const sim = cr.moneda === 'USD' ? '$' : cr.moneda === 'BOB' ? 'Bs.' : ''
                  const badgeCat = getCategoryBadgeVariant(cr.categoria)
                  const tieneHip = Boolean(cr.garantia_hipotecaria_aplicada)

                  return (
                    <tr key={cr.numero_credito || idx} className="hover:bg-slate-50/70 transition">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                        {cr.numero_credito}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-slate-800 block truncate max-w-[150px]">
                          {socioNombre || '—'}
                        </span>
                        {socioCi && (
                          <span className="font-mono text-[10px] text-slate-400 block">{socioCi}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="text-[11px] text-slate-700 block truncate max-w-[130px]">
                          {formatTipoCreditoAsfi(cr.tipo_credito_asfi)}
                        </span>
                        {cr.sector_productivo && (
                          <Badge variant="teal" className="text-[9px] py-0 px-1 mt-0.5">Productivo</Badge>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        {cr.saldo_capital != null ? formatMoney(cr.saldo_capital, sim || 'Bs.') : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono">
                        <span className={cr.dias_mora > 0 ? 'font-bold text-rose-700' : 'text-slate-600'}>
                          {cr.dias_mora ?? 0}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <Badge variant={badgeCat}>{cr.categoria ? `Cat. ${cr.categoria}` : '—'}</Badge>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                        {cr.porcentaje != null ? `${cr.porcentaje}%` : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        <span className="text-slate-800">
                          {cr.base_prevision != null ? formatMoney(cr.base_prevision, sim || 'Bs.') : '—'}
                        </span>
                        {tieneHip && (
                          <span className="text-[10px] text-emerald-700 block" title="Deducción 0.50×M por hipoteca en primer grado">
                            Deduc. Hip.
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        {cr.prevision_especifica != null ? formatMoney(cr.prevision_especifica, sim || 'Bs.') : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                        {cr.prevision_ciclica != null ? formatMoney(cr.prevision_ciclica, sim || 'Bs.') : '—'}
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
