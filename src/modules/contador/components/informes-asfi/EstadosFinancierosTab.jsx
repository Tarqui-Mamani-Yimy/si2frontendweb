import { useState, useEffect, useRef } from 'react'
import { getEstadosFinancieros } from '../../../../core/api/informesAsfiApi'
import { getApiErrorMessage } from '../../../../core/api/errors'
import { formatMoney, formatExchangeRate } from '../contabilidadUtils'
import MetricCard from '../../../../components/ui/MetricCard'
import Badge from '../../../../components/ui/Badge'
import Skeleton from '../../../../components/ui/Skeleton'
import AlertBanner from '../../../../components/ui/AlertBanner'

/**
 * Tab: Estados Financieros Regulatorios — Paquete Mensual ASFI (CU-W34).
 * Presenta Balance General y Estado de Resultados consolidado en BOB con desglose MCEF.
 */
export default function EstadosFinancierosTab({ fechaCorte, refreshTrigger }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const requestIdRef = useRef(0)

  useEffect(() => {
    let isMounted = true
    const reqId = ++requestIdRef.current

    getEstadosFinancieros({ fecha_corte: fechaCorte })
      .then((res) => {
        if (!isMounted || reqId !== requestIdRef.current) return
        setError(null)
        setData(res)
      })
      .catch((err) => {
        if (!isMounted || reqId !== requestIdRef.current) return
        setError(getApiErrorMessage(err, 'Error al generar el paquete de estados financieros mensuales.'))
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
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-80 w-full rounded-xl" />
          <Skeleton className="h-80 w-full rounded-xl" />
        </div>
      </div>
    )
  }

  if (error) {
    return <AlertBanner variant="error">{error}</AlertBanner>
  }

  const bg = data?.balance_general || {}
  const er = data?.estado_resultados || {}

  const totalActivo = bg.total_activo ?? '0.00'
  const totalPasivo = bg.total_pasivo ?? '0.00'
  const totalPatrimonio = bg.total_patrimonio ?? '0.00'
  const resultadoGestion = bg.resultado_gestion ?? er.resultado_neto_gestion ?? '0.00'
  const cuadra = bg.cuadra ?? true

  const tcObj = bg.tipo_cambio || er.tipo_cambio || data?.tipo_cambio
  const tipoCambioValor = typeof tcObj === 'object' ? tcObj?.valor : tcObj
  const criterioConversion = bg.criterio_conversion || er.criterio_conversion || data?.criterio_conversion || 'Consolidado en Bs. (USD valuado a tipo de cambio oficial)'

  // Extract Balance General sections
  const seccionesBg = bg.secciones || {}
  const parseGrupos = (obj) => {
    if (!obj || typeof obj !== 'object') return []
    return Object.entries(obj).map(([cod, item]) => ({
      codigo: cod,
      nombre: item.nombre || cod,
      monto: item.monto ?? '0.00',
      cuentas: item.cuentas || [],
    })).sort((a, b) => String(a.codigo).localeCompare(String(b.codigo)))
  }

  const gruposActivo = parseGrupos(seccionesBg.ACTIVO)
  const gruposPasivo = parseGrupos(seccionesBg.PASIVO)
  const gruposPatrimonio = parseGrupos(seccionesBg.PATRIMONIO)

  // Extract Estado de Resultados lines
  const lineasEr = Array.isArray(er.lineas) ? er.lineas : []

  return (
    <div className="space-y-6">
      {/* Header Context Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-[#064e3b]">account_balance</span>
          <div>
            <span className="font-bold text-slate-800 block text-sm">
              Paquete Mensual Regulatorio (MCEF — ASFI)
            </span>
            <span className="text-slate-500">
              {criterioConversion}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Tipo de Cambio Oficial</span>
            <span className="font-mono font-bold text-slate-800 text-sm">
              {tipoCambioValor != null ? `1 USD = ${formatExchangeRate(tipoCambioValor)} BOB` : '6.86000 BOB'}
            </span>
          </div>
          <Badge variant={cuadra ? 'green' : 'red'}>
            {cuadra ? 'Balance Cuadrado' : 'Descuadre Detectado'}
          </Badge>
        </div>
      </div>

      {/* KPI Totals */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Activo"
          value={formatMoney(totalActivo, 'Bs.')}
          icon="account_balance"
          iconBg="bg-emerald-50"
          iconColor="text-[#064e3b]"
          delta="Recursos económicos"
          deltaPos={true}
        />

        <MetricCard
          label="Total Pasivo"
          value={formatMoney(totalPasivo, 'Bs.')}
          icon="receipt_long"
          iconBg="bg-rose-50"
          iconColor="text-rose-700"
          delta="Obligaciones con terceros"
          deltaPos={false}
        />

        <MetricCard
          label="Total Patrimonio"
          value={formatMoney(totalPatrimonio, 'Bs.')}
          icon="pie_chart"
          iconBg="bg-indigo-50"
          iconColor="text-indigo-700"
          delta="Capital y reservas"
          deltaPos={true}
        />

        <MetricCard
          label="Resultado Neto de Gestión"
          value={formatMoney(resultadoGestion, 'Bs.')}
          icon="trending_up"
          iconBg="bg-teal-50"
          iconColor="text-[#006c49]"
          delta="Periodo acumulado"
          deltaPos={Number(resultadoGestion) >= 0}
        />
      </div>

      {/* Two Column Layout: Balance General & Estado de Resultados */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Balance General Box */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-card space-y-4">
          <div className="flex items-center justify-between border-b pb-3 border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Balance General Regulatorio</h3>
              <p className="text-xs text-slate-500">Estructura financiera consolidada al {fechaCorte}</p>
            </div>
            <Badge variant="teal">MCEF</Badge>
          </div>

          <div className="space-y-4 text-xs">
            {/* Activo */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between bg-slate-50 p-2 rounded font-bold text-slate-800">
                <span>100 ACTIVO</span>
                <span className="font-mono">{formatMoney(totalActivo, 'Bs.')}</span>
              </div>
              <div className="pl-3 space-y-1">
                {gruposActivo.map((g) => (
                  <div key={g.codigo} className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
                    <span className="truncate pr-2 font-medium">{g.codigo} {g.nombre}</span>
                    <span className="font-mono text-slate-900 shrink-0">{formatMoney(g.monto, 'Bs.')}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pasivo */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between bg-slate-50 p-2 rounded font-bold text-slate-800">
                <span>200 PASIVO</span>
                <span className="font-mono">{formatMoney(totalPasivo, 'Bs.')}</span>
              </div>
              <div className="pl-3 space-y-1">
                {gruposPasivo.map((g) => (
                  <div key={g.codigo} className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
                    <span className="truncate pr-2 font-medium">{g.codigo} {g.nombre}</span>
                    <span className="font-mono text-slate-900 shrink-0">{formatMoney(g.monto, 'Bs.')}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Patrimonio */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between bg-slate-50 p-2 rounded font-bold text-slate-800">
                <span>300 PATRIMONIO</span>
                <span className="font-mono">{formatMoney(totalPatrimonio, 'Bs.')}</span>
              </div>
              <div className="pl-3 space-y-1">
                {gruposPatrimonio.map((g) => (
                  <div key={g.codigo} className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
                    <span className="truncate pr-2 font-medium">{g.codigo} {g.nombre}</span>
                    <span className="font-mono text-slate-900 shrink-0">{formatMoney(g.monto, 'Bs.')}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Estado de Resultados Box */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-card space-y-4">
          <div className="flex items-center justify-between border-b pb-3 border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Estado de Resultados (Gestión)</h3>
              <p className="text-xs text-slate-500">Ingresos, gastos y resultado acumulado al {fechaCorte}</p>
            </div>
            <Badge variant="navy">MCEF</Badge>
          </div>

          <div className="space-y-3 text-xs">
            {lineasEr.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                No se registraron movimientos en el Estado de Resultados para este periodo.
              </div>
            ) : (
              lineasEr.map((linea, idx) => {
                const subtotalNombre = linea.subtotal || linea.nombre || `Subtotal ${idx + 1}`
                const subtotalMonto = linea.monto ?? '0.00'
                const componentes = Array.isArray(linea.componentes) ? linea.componentes : []

                return (
                  <div key={idx} className="space-y-1.5 border-b border-slate-100 pb-2">
                    <div className="flex items-center justify-between font-semibold text-slate-800 py-1">
                      <span>{subtotalNombre}</span>
                      <span className="font-mono font-bold">{formatMoney(subtotalMonto, 'Bs.')}</span>
                    </div>

                    {componentes.length > 0 && (
                      <div className="pl-3 space-y-1 text-slate-500">
                        {componentes.map((c) => (
                          <div key={c.codigo} className="flex justify-between py-0.5">
                            <span className="truncate pr-2">{c.codigo} {c.nombre}</span>
                            <span className="font-mono text-slate-700 shrink-0">{formatMoney(c.monto, 'Bs.')}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })
            )}

            <div className="flex items-center justify-between bg-emerald-50/80 p-3 rounded-lg font-bold text-emerald-950 mt-4 border border-emerald-200">
              <span className="text-sm">Resultado Neto del Periodo</span>
              <span className="font-mono text-base">{formatMoney(resultadoGestion, 'Bs.')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
