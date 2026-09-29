import { useState, useEffect, useRef } from 'react'
import { getCarteraReport } from '../../../../core/api/reportesApi'
import { getApiErrorMessage } from '../../../../core/api/errors'
import { formatMoney, toCents } from '../../../contador/components/contabilidadUtils'
import {
  formatPercent,
  calculatePercentage,
  getMoraBadgeVariant,
  getMoraBadgeLabel,
  DEFAULT_PALETTE,
} from './reportesChartUtils'
import MetricCard from '../../../../components/ui/MetricCard'
import Badge from '../../../../components/ui/Badge'
import Skeleton from '../../../../components/ui/Skeleton'
import AlertBanner from '../../../../components/ui/AlertBanner'
import HorizontalBarChart from './HorizontalBarChart'

/**
 * Tab 2: Reporte Integral de Cartera de Créditos (CU-W33).
 */
export default function CarteraTab({ fechaCorte, monedaId, refreshTrigger, sim }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const requestIdRef = useRef(0)

  useEffect(() => {
    let isMounted = true
    const reqId = ++requestIdRef.current

    getCarteraReport({
      fecha_corte: fechaCorte,
      moneda_id: monedaId,
    })
      .then((res) => {
        if (!isMounted || reqId !== requestIdRef.current) return
        setError(null)
        setData(res)
      })
      .catch((err) => {
        if (!isMounted || reqId !== requestIdRef.current) return
        setError(getApiErrorMessage(err, 'Error al cargar el reporte de cartera.'))
      })
      .finally(() => {
        if (isMounted && reqId === requestIdRef.current) {
          setLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [fechaCorte, monedaId, refreshTrigger])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  if (error) {
    return <AlertBanner variant="error">{error}</AlertBanner>
  }

  const totales = data?.totales || {}
  const carteraBruta = totales.cartera_bruta ?? '0.00'
  const carteraEnMora = totales.cartera_en_mora ?? '0.00'
  const indiceMora = totales.indice_mora
  const creditosTotal = totales.creditos ?? 0
  const advertencias = Array.isArray(data?.advertencias) ? data.advertencias : []

  const porEstado = Array.isArray(data?.por_estado) ? data.por_estado : []
  const porProducto = Array.isArray(data?.por_producto) ? data.por_producto : []
  const porDestino = Array.isArray(data?.por_destino) ? data.por_destino : []
  const porRangoMora = Array.isArray(data?.por_rango_mora) ? data.por_rango_mora : []
  const colocacionesMes = Array.isArray(data?.colocaciones_mes) ? data.colocaciones_mes : []

  // Prepare chart items for Por Estado
  const estadoItems = porEstado.map((it, idx) => ({
    label: it.estado || 'Sin estado',
    value: it.saldo,
    formattedValue: formatMoney(it.saldo, sim),
    percentage: calculatePercentage(it.saldo, carteraBruta),
    count: it.creditos,
    color: it.estado === 'EN_MORA' ? '#e11d48' : it.estado === 'VIGENTE' ? '#064e3b' : DEFAULT_PALETTE[idx % DEFAULT_PALETTE.length],
  }))

  // Prepare chart items for Por Producto
  const productoItems = porProducto.map((it, idx) => ({
    label: it.producto || 'General',
    value: it.saldo,
    formattedValue: formatMoney(it.saldo, sim),
    percentage: calculatePercentage(it.saldo, carteraBruta),
    count: it.creditos,
    color: DEFAULT_PALETTE[idx % DEFAULT_PALETTE.length],
  }))

  // Prepare chart items for Por Destino
  const destinoItems = porDestino.map((it, idx) => ({
    label: it.destino || 'Otros',
    value: it.saldo,
    formattedValue: formatMoney(it.saldo, sim),
    percentage: calculatePercentage(it.saldo, carteraBruta),
    count: it.creditos,
    color: DEFAULT_PALETTE[(idx + 2) % DEFAULT_PALETTE.length],
  }))

  // Format mora range labels
  const formatRangoLabel = (rango) => {
    if (rango === '0') return '0 días (Al día / Vigente)'
    if (rango === '1-30') return '1 a 30 días (Mora temprana)'
    if (rango === '31-90') return '31 a 90 días (Mora media)'
    if (rango === '91-180') return '91 a 180 días (Mora severa)'
    if (rango === '>180') return 'Más de 180 días (Mora ejecutiva / castigo)'
    return `${rango} días`
  }

  const getRangoBadgeVariant = (rango) => {
    if (rango === '0') return 'green'
    if (rango === '1-30') return 'amber'
    if (rango === '31-90') return 'orange'
    return 'red'
  }

  // Monthly disbursements chart max value
  const maxColocacion = colocacionesMes.reduce((max, it) => {
    return Math.max(max, toCents(it.monto) / 100)
  }, 0)

  return (
    <div className="space-y-6">
      {/* Advertencias */}
      {advertencias.length > 0 && (
        <div className="space-y-3">
          {advertencias.map((adv, idx) => (
            <AlertBanner
              key={adv.codigo || idx}
              variant="warning"
              title="Advertencia de Cartera"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-1">
                <span className="font-medium text-amber-900">{adv.mensaje}</span>
                <div className="flex items-center gap-2 shrink-0 text-xs">
                  {adv.creditos != null && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 font-semibold border border-amber-300">
                      {adv.creditos} {adv.creditos === 1 ? 'crédito' : 'créditos'}
                    </span>
                  )}
                  {adv.saldo != null && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-950 font-mono font-bold border border-amber-300">
                      Saldo: {formatMoney(adv.saldo, sim)}
                    </span>
                  )}
                </div>
              </div>
            </AlertBanner>
          ))}
        </div>
      )}

      {/* Resumen Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Cartera Bruta Total"
          value={formatMoney(carteraBruta, sim)}
          icon="account_balance_wallet"
          iconBg="bg-emerald-50"
          iconColor="text-[#064e3b]"
          delta={`${creditosTotal} operaciones`}
          deltaPos={true}
        />

        <MetricCard
          label="Cartera en Mora"
          value={formatMoney(carteraEnMora, sim)}
          icon="error"
          iconBg="bg-rose-50"
          iconColor="text-rose-700"
          delta={toCents(carteraEnMora) === 0 ? 'Sin mora activa' : undefined}
          deltaPos={false}
        />

        <div className="group relative overflow-hidden rounded-xl bg-white border border-[#e2e8f0] p-5 shadow-card">
          <div className="flex items-center justify-between">
            <span className="font-label-caps text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Índice de Morosidad
            </span>
            <div className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0 bg-amber-50 text-amber-700">
              <span className="material-symbols-outlined text-[20px]">percent</span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="font-display text-2xl lg:text-3xl font-bold text-slate-900">
              {formatPercent(indiceMora)}
            </span>
            <Badge variant={getMoraBadgeVariant(indiceMora)}>
              {getMoraBadgeLabel(indiceMora)}
            </Badge>
          </div>
          <p className="mt-2.5 text-xs text-slate-400">Cartera mora / Cartera bruta × 100</p>
        </div>

        <MetricCard
          label="Operaciones de Crédito"
          value={creditosTotal}
          icon="folder_shared"
          iconBg="bg-sky-50"
          iconColor="text-sky-700"
          delta="Contratos vigentes"
          deltaPos={true}
        />
      </div>

      {/* Grid: Por Estado & Por Producto */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cartera por Estado */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-card space-y-4">
          <div className="border-b pb-3 border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Cartera por Estado</h3>
              <p className="text-xs text-slate-500">Distribución de saldos según estado crediticio</p>
            </div>
            <Badge variant="teal">Estados</Badge>
          </div>

          <HorizontalBarChart
            items={estadoItems}
            maxValue={toCents(carteraBruta) / 100}
            emptyMessage="No se encontraron registros de cartera por estado"
          />
        </div>

        {/* Cartera por Producto */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-card space-y-4">
          <div className="border-b pb-3 border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Cartera por Línea de Producto</h3>
              <p className="text-xs text-slate-500">Concentración por tipo de crédito ofertado</p>
            </div>
            <Badge variant="navy">Productos</Badge>
          </div>

          <HorizontalBarChart
            items={productoItems}
            maxValue={toCents(carteraBruta) / 100}
            emptyMessage="No se encontraron registros de productos crediticios"
          />
        </div>
      </div>

      {/* Cartera por Destino */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-card space-y-4">
        <div className="border-b pb-3 border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Cartera por Destino del Crédito</h3>
            <p className="text-xs text-slate-500">Destino económico de los fondos prestados</p>
          </div>
          <Badge variant="purple">Destinos</Badge>
        </div>

        <HorizontalBarChart
          items={destinoItems}
          maxValue={toCents(carteraBruta) / 100}
          emptyMessage="No se encontraron registros de destino de cartera"
        />
      </div>

      {/* Rangos de Mora Table */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-card space-y-3">
        <div className="flex items-center justify-between border-b pb-3 border-slate-100">
          <div>
            <h3 className="font-bold text-sm text-slate-900">
              Estratificación por Rangos de Mora
            </h3>
            <p className="text-xs text-slate-500">
              Antigüedad y concentración del atraso según criterios normativos
            </p>
          </div>
          <Badge variant="rose">Monitoreo de Riesgo</Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Rango de Mora</th>
                <th className="py-2.5 px-3 text-center">Nivel de Riesgo</th>
                <th className="py-2.5 px-4 text-center">N° Créditos</th>
                <th className="py-2.5 px-4 text-right">Saldo Pendiente ({sim})</th>
                <th className="py-2.5 px-4 text-right">% Cartera Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {porRangoMora.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400">
                    No existen datos registrados de mora
                  </td>
                </tr>
              ) : (
                porRangoMora.map((r, idx) => {
                  const pct = calculatePercentage(r.saldo, carteraBruta)
                  const isZero = r.rango === '0'
                  return (
                    <tr key={r.rango || idx} className="hover:bg-slate-50/70 transition">
                      <td className="py-2.5 px-4 font-semibold text-slate-800">
                        {formatRangoLabel(r.rango)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <Badge variant={getRangoBadgeVariant(r.rango)}>
                          {isZero ? 'Normal' : r.rango === '1-30' ? 'Temprano' : r.rango === '31-90' ? 'Medio' : 'Crítico'}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-4 text-center font-mono text-slate-600">
                        {r.creditos ?? 0}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                        {formatMoney(r.saldo, sim)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-slate-500">
                        {pct}%
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Colocaciones Últimos 12 Meses */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-card space-y-4">
        <div className="flex items-center justify-between border-b pb-3 border-slate-100">
          <div>
            <h3 className="font-bold text-sm text-slate-900">
              Colocaciones de los Últimos 12 Meses
            </h3>
            <p className="text-xs text-slate-500">
              Evolución mensual de desembolsos y nuevos créditos otorgados
            </p>
          </div>
          <Badge variant="teal">Histórico</Badge>
        </div>

        {colocacionesMes.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            Sin desembolsos registrados en los últimos 12 meses
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {colocacionesMes.map((c) => {
                const heightPct = maxColocacion > 0 ? (toCents(c.monto) / 100 / maxColocacion) * 100 : 0
                return (
                  <div
                    key={c.mes}
                    className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-center space-y-1"
                  >
                    <span className="text-[11px] font-mono font-bold text-slate-500 block">
                      {c.mes}
                    </span>
                    <div className="h-12 w-full flex items-end justify-center py-1">
                      <div
                        className="w-6 bg-[#064e3b] rounded-t transition-all duration-500"
                        style={{ height: `${Math.max(6, heightPct)}%` }}
                        title={`${formatMoney(c.monto, sim)} (${c.creditos} créditos)`}
                      />
                    </div>
                    <span className="font-mono font-bold text-xs text-slate-900 block truncate" title={formatMoney(c.monto, sim)}>
                      {formatMoney(c.monto, sim)}
                    </span>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      {c.creditos} op.
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
