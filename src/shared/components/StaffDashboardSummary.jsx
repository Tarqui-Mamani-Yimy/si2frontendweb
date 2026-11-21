import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import AlertBanner from '../../components/ui/AlertBanner'
import Button from '../../components/ui/Button'
import Skeleton from '../../components/ui/Skeleton'
import { getDashboardResumen } from '../../core/api/dashboardApi'
import { getApiErrorMessage } from '../../core/api/errors'

function formatMoney(amount, sim = 'Bs.') {
  const n = Number(amount ?? 0)
  return `${sim} ${n.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(isoString) {
  if (!isoString) return '—'
  try {
    const d = new Date(isoString)
    return d.toLocaleDateString('es-BO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return isoString
  }
}

const RIESGO_COLORS = {
  BAJO: { bg: 'bg-emerald-50', text: 'text-emerald-700', badge: 'green', label: 'Riesgo Bajo' },
  MEDIO: { bg: 'bg-amber-50', text: 'text-amber-700', badge: 'amber', label: 'Riesgo Medio' },
  ALTO: { bg: 'bg-rose-50', text: 'text-rose-700', badge: 'red', label: 'Riesgo Alto' },
  SIN_PREDICCION: { bg: 'bg-slate-50', text: 'text-slate-600', badge: 'slate', label: 'Sin predicción' },
}

export default function StaffDashboardSummary({ role = 'ADMINISTRADOR', subscriptionSlot = null }) {
  const [monedaId, setMonedaId] = useState(1) // 1: BOB, 2: USD
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const sim = Number(monedaId) === 2 ? '$' : 'Bs.'

  const loadData = useCallback(async (currId) => {
    setLoading(true)
    setError(null)
    try {
      const res = await getDashboardResumen(currId)
      setData(res)
    } catch (err) {
      setError(
        getApiErrorMessage(err, 'No se pudieron cargar los datos consolidados del dashboard.'),
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData(monedaId)
  }, [monedaId, loadData])

  if (loading && !data) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  const rolePrefix = role === 'ADMINISTRADOR' ? '/admin' :
    role === 'OFICIAL_CREDITO' ? '/oficial' :
    role === 'CAJERO' ? '/cajero' :
    role === 'CONTADOR' ? '/contador' : '/asesor'

  const socios = data?.socios
  const captaciones = data?.captaciones
  const cartera = data?.cartera
  const operaciones = data?.operaciones_mes
  const solicitudes = data?.solicitudes_por_estado || {}
  const riesgo = data?.riesgo_ml || {}
  const alertas = data?.alertas_activas ?? 0
  const satisfaccion = data?.satisfaccion
  const colocaciones12m = data?.colocaciones_12m || []
  const cobranza12m = data?.cobranza_12m || []
  const actividad = data?.actividad_reciente || []

  // Max for colocaciones chart
  const maxColocacion = colocaciones12m.reduce((m, item) => Math.max(m, Number(item.monto || 0)), 0) || 1
  const maxCobranza = cobranza12m.reduce((m, item) => Math.max(m, Number(item.monto || 0)), 0) || 1

  // 1. SECCIÓN: SOCIOS
  const sectionSocios = (
    <Card className="p-5 space-y-3">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#006c49]">group</span>
          <h2 className="font-bold text-sm text-[#0b1c30]">Socios de la Cooperativa</h2>
        </div>
        <Link to={`${rolePrefix}/socios`} className="text-xs text-[#006c49] font-semibold hover:underline">
          Ver socios →
        </Link>
      </div>
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="p-2.5 rounded-lg bg-slate-50">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Registrados</span>
          <span className="text-lg font-bold text-slate-800 font-mono">{socios?.total ?? 0}</span>
        </div>
        <div className="p-2.5 rounded-lg bg-emerald-50">
          <span className="text-[10px] uppercase font-bold text-emerald-600 block">Socios Activos</span>
          <span className="text-lg font-bold text-emerald-800 font-mono">{socios?.activos ?? 0}</span>
        </div>
        <div className="p-2.5 rounded-lg bg-blue-50">
          <span className="text-[10px] uppercase font-bold text-blue-600 block">Nuevos en el Mes</span>
          <span className="text-lg font-bold text-blue-800 font-mono">+{socios?.nuevos_mes ?? 0}</span>
        </div>
      </div>
    </Card>
  )

  // 2. SECCIÓN: CAPTACIONES
  const sectionCaptaciones = (
    <Card className="p-5 space-y-3">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-blue-600">savings</span>
          <h2 className="font-bold text-sm text-[#0b1c30]">Captaciones (Ahorro y DPF)</h2>
        </div>
        <span className="text-xs font-mono font-bold text-slate-700">
          Total: {formatMoney(captaciones?.total, sim)}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/60 space-y-1">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-slate-600">Cuentas de Ahorro</span>
            <Badge variant="green">{captaciones?.cuentas_activas ?? 0} activas</Badge>
          </div>
          <p className="text-base font-bold text-slate-900 font-mono">
            {formatMoney(captaciones?.saldo_ahorro, sim)}
          </p>
        </div>
        <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/60 space-y-1">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-slate-600">Plazo Fijo (DPF)</span>
            <Badge variant="teal">{captaciones?.dpf_vigentes ?? 0} vigentes</Badge>
          </div>
          <p className="text-base font-bold text-slate-900 font-mono">
            {formatMoney(captaciones?.capital_dpf, sim)}
          </p>
        </div>
      </div>
    </Card>
  )

  // 3. SECCIÓN: CARTERA
  const sectionCartera = (
    <Card className="p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#064e3b]">account_balance_wallet</span>
          <h2 className="font-bold text-sm text-[#0b1c30]">Cartera de Créditos</h2>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={Number(cartera?.indice_mora ?? 0) > 5 ? 'red' : 'green'}>
            Índice de Mora: {cartera?.indice_mora ? `${cartera.indice_mora}%` : '0.00%'}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Créditos Vigentes</span>
          <span className="text-base font-bold text-slate-900 font-mono">{cartera?.creditos_vigentes ?? 0}</span>
        </div>
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Cartera Bruta</span>
          <span className="text-base font-bold text-slate-900 font-mono">{formatMoney(cartera?.cartera_bruta, sim)}</span>
        </div>
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-100">
          <span className="text-[10px] font-bold uppercase text-rose-600 block">Cartera en Mora</span>
          <span className="text-base font-bold text-rose-700 font-mono">{formatMoney(cartera?.cartera_en_mora, sim)}</span>
        </div>
      </div>

      {/* Cartera por producto */}
      {cartera?.por_producto?.length > 0 && (
        <div className="space-y-2 pt-1 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-600 block">Distribución por Producto</span>
          <div className="space-y-1.5 text-xs">
            {cartera.por_producto.map((prod) => (
              <div key={prod.producto} className="flex items-center justify-between">
                <span className="text-slate-700 truncate">{prod.producto}</span>
                <div className="flex items-center gap-2 font-mono">
                  <span className="text-slate-400 text-[11px]">({prod.creditos})</span>
                  <span className="font-semibold text-slate-800">{formatMoney(prod.saldo, sim)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rangos de mora */}
      {cartera?.por_rango_mora?.length > 0 && (
        <div className="space-y-2 pt-1 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-600 block">Rangos de Morosidad</span>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
            {cartera.por_rango_mora.map((r) => (
              <div key={r.rango} className={`p-2 rounded-lg ${r.rango === '0' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-900'}`}>
                <span className="text-[10px] font-bold block">{r.rango === '0' ? 'Al día (0d)' : `${r.rango} días`}</span>
                <span className="font-bold font-mono text-xs">{r.creditos} créd.</span>
                <span className="text-[10px] text-slate-500 font-mono block">{formatMoney(r.saldo, sim)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  )

  // 4. SECCIÓN: OPERACIONES DEL MES
  const sectionOperaciones = (
    <Card className="p-5 space-y-3">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-purple-600">sync_alt</span>
          <h2 className="font-bold text-sm text-[#0b1c30]">Operaciones del Mes en Curso</h2>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="p-3 rounded-lg border border-slate-100 bg-slate-50 space-y-1">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-slate-700">Desembolsos del mes</span>
            <Badge variant="teal">{operaciones?.desembolsos ?? 0} créditos</Badge>
          </div>
          <p className="text-base font-bold text-slate-900 font-mono">
            {formatMoney(operaciones?.monto_desembolsado, sim)}
          </p>
        </div>
        <div className="p-3 rounded-lg border border-slate-100 bg-slate-50 space-y-1">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-slate-700">Cobranza y pagos del mes</span>
            <Badge variant="green">{operaciones?.pagos ?? 0} pagos</Badge>
          </div>
          <p className="text-base font-bold text-slate-900 font-mono">
            {formatMoney(operaciones?.monto_cobrado, sim)}
          </p>
        </div>
      </div>
    </Card>
  )

  // 5. SECCIÓN: SOLICITUDES POR ESTADO
  const sectionSolicitudes = (
    <Card className="p-5 space-y-3">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-amber-600">pending_actions</span>
          <h2 className="font-bold text-sm text-[#0b1c30]">Solicitudes de Crédito por Estado</h2>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
        {Object.entries(solicitudes).map(([estado, cant]) => (
          <div key={estado} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-[10px] font-bold uppercase text-slate-500 block truncate">{estado}</span>
            <span className="text-base font-bold text-slate-900 font-mono">{cant}</span>
          </div>
        ))}
      </div>
    </Card>
  )

  // 6. SECCIÓN: RIESGO DE MORA (ML)
  const sectionRiesgoML = (
    <Card className="p-5 space-y-3">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-indigo-600">psychology</span>
          <h2 className="font-bold text-sm text-[#0b1c30]">Predicción de Riesgo de Mora (ML)</h2>
        </div>
        <Badge variant="indigo">Motor Predictivo</Badge>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
        {['BAJO', 'MEDIO', 'ALTO', 'SIN_PREDICCION'].map((lvl) => {
          const cfg = RIESGO_COLORS[lvl]
          const count = riesgo[lvl] ?? 0
          return (
            <div key={lvl} className={`p-2.5 rounded-lg border border-slate-100 ${cfg.bg}`}>
              <span className={`text-[10px] font-bold uppercase block ${cfg.text}`}>{cfg.label}</span>
              <span className="text-base font-bold font-mono text-slate-900">{count} créditos</span>
            </div>
          )
        })}
      </div>
    </Card>
  )

  // 7. SECCIÓN: ALERTAS Y SATISFACCIÓN
  const sectionAlertasYSatisfaccion = (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Alertas */}
      <Card className="p-5 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-rose-600">notifications_active</span>
            <h2 className="font-bold text-sm text-[#0b1c30]">Alertas Activas</h2>
          </div>
          <Link to={`${rolePrefix}/alertas`} className="text-xs text-rose-600 font-semibold hover:underline">
            Gestionar alertas →
          </Link>
        </div>
        <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-100 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-rose-900 block">Alertas tempranas de mora</span>
            <span className="text-xs text-rose-600">Créditos con cuotas próximas a vencer o atrasos</span>
          </div>
          <span className="text-2xl font-bold font-mono text-rose-700">{alertas}</span>
        </div>
      </Card>

      {/* Satisfacción CRM */}
      <Card className="p-5 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-500">rate_review</span>
            <h2 className="font-bold text-sm text-[#0b1c30]">Satisfacción del Cliente (CRM)</h2>
          </div>
          <Link to={`${rolePrefix}/feedback`} className="text-xs text-[#006c49] font-semibold hover:underline">
            Ver feedback →
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2.5 rounded-lg bg-amber-50">
            <span className="text-[10px] font-bold text-amber-700 block uppercase">Promedio</span>
            <span className="text-base font-bold font-mono text-amber-800">
              {satisfaccion?.promedio ? `${satisfaccion.promedio} ⭐` : '—'}
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-50">
            <span className="text-[10px] font-bold text-emerald-700 block uppercase">NPS Score</span>
            <span className="text-base font-bold font-mono text-emerald-800">
              {satisfaccion?.nps !== null && satisfaccion?.nps !== undefined ? `${satisfaccion.nps > 0 ? '+' : ''}${satisfaccion.nps}` : '—'}
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50">
            <span className="text-[10px] font-bold text-slate-500 block uppercase">Opiniones</span>
            <span className="text-base font-bold font-mono text-slate-800">{satisfaccion?.total ?? 0}</span>
          </div>
        </div>
      </Card>
    </div>
  )

  // 8. SECCIÓN: GRÁFICOS 12 MESES (COLOCACIONES Y COBRANZA)
  const sectionGraficos12M = (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Colocaciones 12 Meses */}
      <Card className="p-5 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-700">trending_up</span>
            <h2 className="font-bold text-sm text-[#0b1c30]">Colocaciones (Últimos 12 Meses)</h2>
          </div>
        </div>
        <div className="space-y-2 text-xs">
          {colocaciones12m.map((col) => {
            const width = Math.min(100, Math.round((Number(col.monto || 0) / maxColocacion) * 100))
            return (
              <div key={col.mes} className="space-y-0.5">
                <div className="flex justify-between items-center text-[11px] font-mono">
                  <span className="font-bold text-slate-700">{col.mes}</span>
                  <span className="text-slate-800 font-semibold">{formatMoney(col.monto, sim)} ({col.creditos} créd.)</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${width}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Cobranza 12 Meses */}
      <Card className="p-5 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-700">payments</span>
            <h2 className="font-bold text-sm text-[#0b1c30]">Cobranza y Recuperación (Últimos 12 Meses)</h2>
          </div>
        </div>
        <div className="space-y-2 text-xs">
          {cobranza12m.map((cob) => {
            const width = Math.min(100, Math.round((Number(cob.monto || 0) / maxCobranza) * 100))
            return (
              <div key={cob.mes} className="space-y-0.5">
                <div className="flex justify-between items-center text-[11px] font-mono">
                  <span className="font-bold text-slate-700">{cob.mes}</span>
                  <span className="text-slate-800 font-semibold">{formatMoney(cob.monto, sim)} ({cob.pagos} pagos)</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: `${width}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )

  // 9. SECCIÓN: ACTIVIDAD RECIENTE (BITÁCORA REAL)
  const sectionActividad = (
    <Card className="p-5 space-y-3">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-slate-600">history</span>
          <h2 className="font-bold text-sm text-[#0b1c30]">Actividad Reciente del Sistema (Bitácora)</h2>
        </div>
        {role === 'ADMINISTRADOR' && (
          <Link to="/admin/bitacora" className="text-xs text-[#006c49] font-semibold hover:underline">
            Ver bitácora completa →
          </Link>
        )}
      </div>

      {actividad.length === 0 ? (
        <div className="py-6 text-center text-slate-400 text-xs italic">
          No hay actividad reciente registrada en bitácora.
        </div>
      ) : (
        <div className="divide-y divide-slate-100 text-xs">
          {actividad.map((act, idx) => (
            <div key={idx} className="py-2.5 flex items-start justify-between gap-3">
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">{act.usuario}</span>
                  <Badge variant="slate" size="sm">{act.modulo}</Badge>
                  <span className="text-[11px] font-mono text-slate-500 font-semibold">{act.accion}</span>
                </div>
                {act.descripcion && (
                  <p className="text-slate-600 text-xs truncate max-w-lg">{act.descripcion}</p>
                )}
              </div>
              <span className="text-[11px] text-slate-400 font-mono shrink-0">
                {formatDate(act.fecha)}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  )

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Barra superior con selector de moneda y refresco */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#0b1c30]">Panel de Control Gerencial</h1>
          <p className="text-xs text-slate-500">Métricas consolidadas en tiempo real de tu cooperativa.</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setMonedaId(1)}
              className={`px-3 py-1 rounded-md transition ${monedaId === 1 ? 'bg-[#006c49] text-white' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Bolivianos (BOB)
            </button>
            <button
              type="button"
              onClick={() => setMonedaId(2)}
              className={`px-3 py-1 rounded-md transition ${monedaId === 2 ? 'bg-[#006c49] text-white' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Dólares (USD)
            </button>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => loadData(monedaId)}
            className="text-xs gap-1"
          >
            <span className="material-symbols-outlined text-[16px]">refresh</span>
          </Button>
        </div>
      </div>

      {error && (
        <AlertBanner variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </AlertBanner>
      )}

      {/* Subscription Slot if provided */}
      {subscriptionSlot}

      {/* Render sections according to role priority */}
      {role === 'OFICIAL_CREDITO' ? (
        <>
          {sectionCartera}
          {sectionSolicitudes}
          {sectionRiesgoML}
          {sectionAlertasYSatisfaccion}
          {sectionOperaciones}
          {sectionSocios}
          {sectionCaptaciones}
          {sectionGraficos12M}
          {sectionActividad}
        </>
      ) : role === 'CAJERO' ? (
        <>
          {sectionOperaciones}
          {sectionCaptaciones}
          {sectionCartera}
          {sectionAlertasYSatisfaccion}
          {sectionSocios}
          {sectionSolicitudes}
          {sectionGraficos12M}
          {sectionActividad}
        </>
      ) : role === 'CONTADOR' ? (
        <>
          {sectionCartera}
          {sectionCaptaciones}
          {sectionOperaciones}
          {sectionGraficos12M}
          {sectionSocios}
          {sectionSolicitudes}
          {sectionRiesgoML}
          {sectionAlertasYSatisfaccion}
          {sectionActividad}
        </>
      ) : (
        /* ADMINISTRADOR y ASESOR_CREDITO por defecto */
        <>
          {sectionOperaciones}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {sectionSocios}
            {sectionCaptaciones}
          </div>
          {sectionCartera}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {sectionSolicitudes}
            {sectionRiesgoML}
          </div>
          {sectionAlertasYSatisfaccion}
          {sectionGraficos12M}
          {sectionActividad}
        </>
      )}
    </div>
  )
}
