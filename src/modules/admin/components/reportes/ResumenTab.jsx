import { useState, useEffect, useRef } from 'react'
import { getResumenEjecutivo } from '../../../../core/api/reportesApi'
import { getApiErrorMessage } from '../../../../core/api/errors'
import { formatMoney, toCents } from '../../../contador/components/contabilidadUtils'
import {
  formatPercent,
  formatIndicatorValue,
  getMoraBadgeVariant,
} from './reportesChartUtils'
import MetricCard from '../../../../components/ui/MetricCard'
import Badge from '../../../../components/ui/Badge'
import Skeleton from '../../../../components/ui/Skeleton'
import AlertBanner from '../../../../components/ui/AlertBanner'
import DonutChart from './DonutChart'

/**
 * Tab 1: Resumen Ejecutivo de Gestión (CU-W33).
 */
export default function ResumenTab({ fechaCorte, monedaId, refreshTrigger, sim }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const requestIdRef = useRef(0)

  useEffect(() => {
    let isMounted = true
    const reqId = ++requestIdRef.current

    getResumenEjecutivo({
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
        setError(getApiErrorMessage(err, 'Error al cargar el resumen ejecutivo.'))
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
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-56 w-full rounded-xl" />
          <Skeleton className="h-56 w-full rounded-xl" />
        </div>
      </div>
    )
  }

  if (error) {
    return <AlertBanner variant="error">{error}</AlertBanner>
  }

  // Extract values supporting root properties or nested sections
  const carteraBruta = data?.cartera_bruta ?? data?.cartera?.cartera_bruta ?? data?.totales?.cartera_bruta ?? '0.00'
  const carteraEnMora = data?.cartera_en_mora ?? data?.cartera?.cartera_en_mora ?? data?.totales?.cartera_en_mora ?? '0.00'
  const indiceMora = data?.indice_mora ?? data?.cartera?.indice_mora ?? data?.totales?.indice_mora
  const creditosCount = data?.creditos ?? data?.total_creditos ?? data?.cartera?.creditos ?? data?.totales?.creditos

  const captacionesTotales = data?.captaciones ?? data?.total_captaciones ?? data?.captaciones?.totales?.total_captaciones ?? data?.totales?.captaciones ?? '0.00'
  const ahorrosSaldo = data?.total_ahorros ?? data?.ahorros ?? data?.captaciones?.totales?.total_ahorros ?? '0.00'
  const dpfSaldo = data?.total_dpf ?? data?.dpf ?? data?.captaciones?.totales?.total_dpf ?? '0.00'

  const liquidez = data?.liquidez ?? data?.indicadores?.find?.((i) => i.clave === 'LIQUIDEZ')?.valor
  const roa = data?.roa ?? data?.indicadores?.find?.((i) => i.clave === 'ROA')?.valor
  const roe = data?.roe ?? data?.indicadores?.find?.((i) => i.clave === 'ROE')?.valor
  const cobertura = data?.cobertura_previsiones ?? data?.indicadores?.find?.((i) => i.clave === 'COBERTURA_PREVISIONES')?.valor
  const advertencias = Array.isArray(data?.advertencias) ? data.advertencias : []

  const moraBadgeVariant = getMoraBadgeVariant(indiceMora)
  const carteraSana = Math.max(0, toCents(carteraBruta) - toCents(carteraEnMora))

  const donutCarteraSlices = [
    { label: 'Cartera Vigente / Al Día', value: carteraSana / 100, formattedValue: formatMoney(carteraSana / 100, sim), color: '#064e3b' },
    { label: 'Cartera en Mora', value: carteraEnMora, formattedValue: formatMoney(carteraEnMora, sim), color: '#e11d48' },
  ]

  const donutCaptacionesSlices = [
    { label: 'Cuentas de Ahorro', value: ahorrosSaldo, formattedValue: formatMoney(ahorrosSaldo, sim), color: '#0284c7' },
    { label: 'Depósitos a Plazo Fijo', value: dpfSaldo, formattedValue: formatMoney(dpfSaldo, sim), color: '#6366f1' },
  ]

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

      {/* KPI Headline Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Cartera Bruta */}
        <MetricCard
          label="Cartera Bruta"
          value={formatMoney(carteraBruta, sim)}
          icon="account_balance_wallet"
          iconBg="bg-emerald-50"
          iconColor="text-[#064e3b]"
          delta={creditosCount != null ? `${creditosCount} créditos activos` : undefined}
          deltaPos={true}
        />

        {/* Índice de Mora */}
        <div className="group relative overflow-hidden rounded-xl bg-white border border-[#e2e8f0] p-5 shadow-card transition-all duration-200 hover:shadow-card-hover hover:border-[#cbd5e1]">
          <div className="flex items-center justify-between">
            <span className="font-label-caps text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Índice de Morosidad
            </span>
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${moraBadgeVariant === 'green' ? 'bg-emerald-50 text-emerald-700' : moraBadgeVariant === 'amber' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'}`}>
              <span className="material-symbols-outlined text-[20px]">warning</span>
            </div>
          </div>

          <div className="mt-3 flex items-baseline justify-between gap-2">
            <span className="font-display text-2xl lg:text-3xl font-bold tabular-nums text-[#0b1c30]">
              {formatPercent(indiceMora)}
            </span>
            <Badge variant={moraBadgeVariant} className="text-xs py-0.5">
              {moraBadgeVariant === 'green' ? 'Mora Baja' : moraBadgeVariant === 'amber' ? 'Mora Moderada' : 'Mora Crítica'}
            </Badge>
          </div>

          <p className="mt-2.5 text-xs text-slate-500">
            En mora: <span className="font-mono font-semibold text-rose-700">{formatMoney(carteraEnMora, sim)}</span>
          </p>
        </div>

        {/* Captaciones Totales */}
        <MetricCard
          label="Captaciones del Público"
          value={formatMoney(captacionesTotales, sim)}
          icon="savings"
          iconBg="bg-sky-50"
          iconColor="text-sky-700"
          delta={toCents(ahorrosSaldo) > 0 || toCents(dpfSaldo) > 0 ? `Ahorro + DPF` : undefined}
          deltaPos={true}
        />

        {/* Liquidez Inmediata */}
        <MetricCard
          label="Ratio de Liquidez"
          value={formatIndicatorValue(liquidez, '%') ?? '—'}
          icon="water_drop"
          iconBg="bg-indigo-50"
          iconColor="text-indigo-700"
          delta={liquidez != null && Number(liquidez) >= 50 ? 'Nivel óptimo' : undefined}
          deltaPos={true}
        />
      </div>

      {/* Second Row: Rentabilidad y Cobertura */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* ROA */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-card flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              ROA (Rentabilidad Activo)
            </span>
            <span className="text-xl font-bold font-mono text-[#064e3b] mt-1 block">
              {formatIndicatorValue(roa, '%') ?? '—'}
            </span>
            <span className="text-[11px] text-slate-400">Resultado anualizado / Activo total</span>
          </div>
          <span className="material-symbols-outlined text-[32px] text-emerald-100">trending_up</span>
        </div>

        {/* ROE */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-card flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              ROE (Rentabilidad Patrimonio)
            </span>
            <span className="text-xl font-bold font-mono text-[#064e3b] mt-1 block">
              {formatIndicatorValue(roe, '%') ?? '—'}
            </span>
            <span className="text-[11px] text-slate-400">Resultado anualizado / Patrimonio</span>
          </div>
          <span className="material-symbols-outlined text-[32px] text-emerald-100">query_stats</span>
        </div>

        {/* Cobertura */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-card flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Cobertura de Previsiones
            </span>
            <span className="text-xl font-bold font-mono text-slate-900 mt-1 block">
              {formatIndicatorValue(cobertura, '%') ?? '—'}
            </span>
            <span className="text-[11px] text-slate-400">Previsión / Cartera en mora</span>
          </div>
          <span className="material-symbols-outlined text-[32px] text-slate-200">shield</span>
        </div>
      </div>

      {/* Visual Composition Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Calidad de Cartera Donut */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-card space-y-3">
          <div className="flex items-center justify-between border-b pb-3 border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Estructura y Calidad de Cartera
              </h3>
              <p className="text-xs text-slate-500">
                Proporción de colocaciones vigentes versus cartera en mora
              </p>
            </div>
            <Badge variant="teal">Créditos</Badge>
          </div>

          <DonutChart
            slices={donutCarteraSlices}
            centerLabel="Cartera"
            centerValue={formatMoney(carteraBruta, sim)}
            emptyMessage="Sin colocaciones activas"
          />
        </div>

        {/* Estructura de Captaciones Donut */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-card space-y-3">
          <div className="flex items-center justify-between border-b pb-3 border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Composición de Captaciones
              </h3>
              <p className="text-xs text-slate-500">
                Proporción entre ahorros a la vista y depósitos a plazo fijo
              </p>
            </div>
            <Badge variant="navy">Ahorros & DPF</Badge>
          </div>

          <DonutChart
            slices={donutCaptacionesSlices}
            centerLabel="Captaciones"
            centerValue={formatMoney(captacionesTotales, sim)}
            emptyMessage="Sin depósitos registrados"
          />
        </div>
      </div>
    </div>
  )
}
