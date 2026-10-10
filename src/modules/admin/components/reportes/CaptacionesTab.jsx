import { useState, useEffect, useRef } from 'react'
import { getCaptacionesReport } from '../../../../core/api/reportesApi'
import { getApiErrorMessage } from '../../../../core/api/errors'
import { formatMoney, toCents } from '../../../contador/components/contabilidadUtils'
import {
  calculatePercentage,
  DEFAULT_PALETTE,
} from './reportesChartUtils'
import MetricCard from '../../../../components/ui/MetricCard'
import Badge from '../../../../components/ui/Badge'
import Skeleton from '../../../../components/ui/Skeleton'
import AlertBanner from '../../../../components/ui/AlertBanner'
import DonutChart from './DonutChart'
import HorizontalBarChart from './HorizontalBarChart'

/**
 * Tab 3: Reporte de Captaciones — Cuentas de Ahorro y DPF (CU-W33).
 */
export default function CaptacionesTab({ fechaCorte, monedaId, refreshTrigger, sim }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const requestIdRef = useRef(0)

  useEffect(() => {
    let isMounted = true
    const reqId = ++requestIdRef.current

    getCaptacionesReport({
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
        setError(getApiErrorMessage(err, 'Error al cargar el reporte de captaciones.'))
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
  const totalCaptaciones = totales.total_captaciones ?? '0.00'
  const totalAhorros = totales.total_ahorros ?? '0.00'
  const totalDpf = totales.total_dpf ?? '0.00'

  const ahorrosPorTipo = Array.isArray(data?.ahorros_por_tipo) ? data.ahorros_por_tipo : []
  const dpfPorPlazo = Array.isArray(data?.dpf_por_plazo) ? data.dpf_por_plazo : []

  // Vencimientos próximos object or structure
  const vencimientos = data?.dpf_vencimientos_proximos
  const vencimientosCapital = vencimientos?.capital ?? vencimientos?.monto ?? '0.00'
  const vencimientosCount = vencimientos?.certificados ?? vencimientos?.count ?? 0

  const donutSlices = [
    {
      label: 'Cuentas de Ahorro',
      value: totalAhorros,
      formattedValue: formatMoney(totalAhorros, sim),
      color: '#0284c7',
    },
    {
      label: 'Depósitos a Plazo Fijo (DPF)',
      value: totalDpf,
      formattedValue: formatMoney(totalDpf, sim),
      color: '#6366f1',
    },
  ]

  const formatPlazoLabel = (rango) => {
    if (rango === '30') return 'Hasta 30 días'
    if (rango === '31-60') return '31 a 60 días'
    if (rango === '61-90') return '61 a 90 días'
    if (rango === '91-180') return '91 a 180 días (Semestral)'
    if (rango === '181-360') return '181 a 360 días (Anual)'
    if (rango === '361-720') return '361 a 720 días (2 años)'
    if (rango === '721-1080') return '721 a 1080 días (3 años)'
    if (rango === '>1080') return 'Más de 1080 días (>3 años)'
    return `${rango} días`
  }

  // Prepare DPF items for bar chart
  const dpfItems = dpfPorPlazo.map((it, idx) => ({
    label: formatPlazoLabel(it.rango),
    value: it.capital,
    formattedValue: formatMoney(it.capital, sim),
    percentage: calculatePercentage(it.capital, totalDpf),
    count: it.certificados,
    color: DEFAULT_PALETTE[idx % DEFAULT_PALETTE.length],
  }))

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Captaciones"
          value={formatMoney(totalCaptaciones, sim)}
          icon="account_balance"
          iconBg="bg-teal-50"
          iconColor="text-teal-700"
          delta="Ahorros + DPF"
          deltaPos={true}
        />

        <MetricCard
          label="Cuentas de Ahorro"
          value={formatMoney(totalAhorros, sim)}
          icon="savings"
          iconBg="bg-sky-50"
          iconColor="text-sky-700"
          delta={`${calculatePercentage(totalAhorros, totalCaptaciones)}% del fondeo`}
          deltaPos={true}
        />

        <MetricCard
          label="Depósitos a Plazo Fijo"
          value={formatMoney(totalDpf, sim)}
          icon="contract"
          iconBg="bg-indigo-50"
          iconColor="text-indigo-700"
          delta={`${calculatePercentage(totalDpf, totalCaptaciones)}% del fondeo`}
          deltaPos={true}
        />

        <div className="group relative overflow-hidden rounded-xl bg-white border border-[#e2e8f0] p-5 shadow-card">
          <div className="flex items-center justify-between">
            <span className="font-label-caps text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Vencimientos Próx. (30d)
            </span>
            <div className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0 bg-amber-50 text-amber-700">
              <span className="material-symbols-outlined text-[20px]">calendar_clock</span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="font-display text-2xl lg:text-3xl font-bold text-slate-900 font-mono">
              {formatMoney(vencimientosCapital, sim)}
            </span>
          </div>
          <p className="mt-2.5 text-xs text-amber-800 font-medium">
            {vencimientosCount} {vencimientosCount === 1 ? 'certificado vence' : 'certificados vencen'} pronto
          </p>
        </div>
      </div>

      {/* Donut & Ahorros Por Tipo */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Composición Ahorros vs DPF */}
        <div className="md:col-span-5 p-5 rounded-xl bg-white border border-slate-200 shadow-card space-y-3">
          <div className="flex items-center justify-between border-b pb-3 border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Estructura de Captaciones</h3>
              <p className="text-xs text-slate-500">Relación de liquidez inmediata vs a plazo</p>
            </div>
            <Badge variant="teal">Fondeo</Badge>
          </div>

          <DonutChart
            slices={donutSlices}
            centerLabel="Captaciones"
            centerValue={formatMoney(totalCaptaciones, sim)}
            emptyMessage="Sin captaciones registradas"
          />
        </div>

        {/* Ahorros por Tipo Table */}
        <div className="md:col-span-7 p-5 rounded-xl bg-white border border-slate-200 shadow-card space-y-3">
          <div className="flex items-center justify-between border-b pb-3 border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Cuentas de Ahorro por Tipo</h3>
              <p className="text-xs text-slate-500">Distribución de saldos de cajas de ahorro</p>
            </div>
            <Badge variant="navy">Cuentas</Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Modalidad de Ahorro</th>
                  <th className="py-2.5 px-4 text-center">N° Cuentas</th>
                  <th className="py-2.5 px-4 text-right">Saldo Total ({sim})</th>
                  <th className="py-2.5 px-4 text-right">% Ahorros</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {ahorrosPorTipo.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400">
                      No existen cuentas de ahorro registradas
                    </td>
                  </tr>
                ) : (
                  ahorrosPorTipo.map((a, idx) => {
                    const pct = calculatePercentage(a.saldo, totalAhorros)
                    return (
                      <tr key={a.tipo || idx} className="hover:bg-slate-50/70 transition">
                        <td className="py-2.5 px-4 font-semibold text-slate-800">
                          {a.tipo === 'VISTA'
                            ? 'Ahorro a la Vista'
                            : a.tipo === 'PROGRAMADO'
                              ? 'Ahorro Programado'
                              : a.tipo}
                        </td>
                        <td className="py-2.5 px-4 text-center font-mono text-slate-600">
                          {a.cuentas ?? 0}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                          {formatMoney(a.saldo, sim)}
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
      </div>

      {/* DPF por Plazo */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-card space-y-4">
        <div className="flex items-center justify-between border-b pb-3 border-slate-100">
          <div>
            <h3 className="font-bold text-sm text-slate-900">
              Estratificación de DPF por Plazo de Emisión
            </h3>
            <p className="text-xs text-slate-500">
              Clasificación según bandas de tiempo normativas MCEF (ASFI)
            </p>
          </div>
          <Badge variant="indigo">Bandas de Vencimiento</Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6">
            <HorizontalBarChart
              items={dpfItems}
              maxValue={toCents(totalDpf) / 100}
              emptyMessage="No se registraron DPFs por plazo"
            />
          </div>

          <div className="lg:col-span-6 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Banda de Plazo</th>
                  <th className="py-2.5 px-3 text-center">N° Certificados</th>
                  <th className="py-2.5 px-4 text-right">Capital ({sim})</th>
                  <th className="py-2.5 px-4 text-right">% DPF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {dpfPorPlazo.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400">
                      Sin depósitos a plazo fijo
                    </td>
                  </tr>
                ) : (
                  dpfPorPlazo.map((d, idx) => {
                    const pct = calculatePercentage(d.capital, totalDpf)
                    return (
                      <tr key={d.rango || idx} className="hover:bg-slate-50/70 transition">
                        <td className="py-2 px-4 font-semibold text-slate-800">
                          {formatPlazoLabel(d.rango)}
                        </td>
                        <td className="py-2 px-3 text-center font-mono text-slate-600">
                          {d.certificados ?? 0}
                        </td>
                        <td className="py-2 px-4 text-right font-mono font-bold text-slate-900">
                          {formatMoney(d.capital, sim)}
                        </td>
                        <td className="py-2 px-4 text-right font-mono text-slate-500">
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
      </div>
    </div>
  )
}
