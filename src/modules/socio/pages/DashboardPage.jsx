import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import AlertBanner from '../../../components/ui/AlertBanner'
import Skeleton from '../../../components/ui/Skeleton'
import { getDashboardSocio, formatTipoCredito } from '../../../core/api/socioApi'
import { getApiErrorMessage } from '../../../core/api/errors'

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
    })
  } catch {
    return isoString
  }
}

export default function SocioDashboardPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getDashboardSocio()
      setData(res)
    } catch (err) {
      setError(
        getApiErrorMessage(err, 'No se pudo cargar el resumen de tu cuenta de socio.'),
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  if (loading && !data) {
    return (
      <div className="mx-auto max-w-5xl space-y-6 animate-fade-in pb-12">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  const socio = data?.socio
  const ahorros = data?.ahorros
  const creditos = data?.creditos || []
  const pagado = data?.pagado
  const dpf = data?.dpf
  const unreadNotif = data?.notificaciones_sin_leer ?? 0

  return (
    <div className="mx-auto max-w-5xl space-y-6 animate-fade-in pb-12">
      {/* Encabezado y Avisos */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0b1c30]">
            ¡Bienvenido, {socio?.nombre || 'Socio'}!
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Resumen consolidado de tus finanzas, préstamos y movimientos en la cooperativa.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadNotif > 0 && (
            <Link
              to="/socio/notificaciones"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100 transition"
            >
              <span className="material-symbols-outlined text-[17px]">notifications</span>
              <span>{unreadNotif} {unreadNotif === 1 ? 'notificación' : 'notificaciones'}</span>
            </Link>
          )}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={loadData}
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

      {/* Banner / Shortcut a Calificar Servicio */}
      <Card className="p-4 sm:p-5 bg-gradient-to-r from-emerald-50 via-teal-50 to-white border-emerald-200/80 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[#006c49] text-white flex items-center justify-center shrink-0 shadow-sm">
            <span className="material-symbols-outlined text-[22px]">rate_review</span>
          </div>
          <div>
            <h3 className="font-bold text-sm text-[#064e3b]">
              ¿Qué tal fue tu experiencia con nuestros servicios?
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Califica la atención recibida en crédito, caja o ventanilla y ayúdanos a mejorar.
            </p>
          </div>
        </div>
        <Link to="/socio/calificar">
          <Button type="button" variant="primary" size="sm" className="!bg-[#006c49] text-xs gap-1.5">
            <span className="material-symbols-outlined text-[16px]">star</span>
            <span>Calificar servicio</span>
          </Button>
        </Link>
      </Card>

      {/* Métricas Principales: Ahorro y DPF */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 space-y-2 border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Cuentas de Ahorro
            </span>
            <span className="material-symbols-outlined text-emerald-700">savings</span>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {formatMoney(ahorros?.saldo_total, 'Bs.')}
          </div>
          <div className="flex items-center justify-between pt-1 text-xs">
            <span className="text-slate-500">
              {ahorros?.cuentas ?? 0} {ahorros?.cuentas === 1 ? 'cuenta activa' : 'cuentas activas'}
            </span>
            <Link to="/socio/mi-cuenta" className="font-semibold text-[#006c49] hover:underline">
              Ver detalle →
            </Link>
          </div>
        </Card>

        <Card className="p-5 space-y-2 border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Depósitos a Plazo Fijo (DPF)
            </span>
            <span className="material-symbols-outlined text-blue-700">lock_clock</span>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {formatMoney(dpf?.capital, 'Bs.')}
          </div>
          <div className="flex items-center justify-between pt-1 text-xs">
            <span className="text-slate-500">
              {dpf?.certificados ?? 0} {dpf?.certificados === 1 ? 'certificado vigente' : 'certificados vigentes'}
            </span>
          </div>
        </Card>

        <Card className="p-5 space-y-2 border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Histórico Pagado
            </span>
            <span className="material-symbols-outlined text-purple-700">payments</span>
          </div>
          <div className="text-2xl font-bold font-mono text-[#006c49]">
            {formatMoney(pagado?.total, 'Bs.')}
          </div>
          <div className="text-[11px] text-slate-500 font-mono truncate">
            Cap: {formatMoney(pagado?.capital, 'Bs.')} | Int: {formatMoney(pagado?.interes, 'Bs.')}
          </div>
        </Card>
      </div>

      {/* Desglose de Total Pagado */}
      <Card className="p-5 space-y-3 border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-purple-600">pie_chart</span>
            <h2 className="font-bold text-sm text-[#0b1c30]">
              Desglose de Amortizaciones y Pagos Realizados
            </h2>
          </div>
          <span className="text-xs font-mono font-bold text-slate-700">
            Total amortizado: {formatMoney(pagado?.total, 'Bs.')}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
          <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100">
            <span className="text-[10px] uppercase font-bold text-emerald-800 block">Capital Amortizado</span>
            <span className="text-base font-bold font-mono text-emerald-900">{formatMoney(pagado?.capital, 'Bs.')}</span>
          </div>
          <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100">
            <span className="text-[10px] uppercase font-bold text-blue-800 block">Interés Corriente</span>
            <span className="text-base font-bold font-mono text-blue-900">{formatMoney(pagado?.interes, 'Bs.')}</span>
          </div>
          <div className="p-3 rounded-xl bg-teal-50/70 border border-teal-100">
            <span className="text-[10px] uppercase font-bold text-teal-800 block">Seguro Desgravamen</span>
            <span className="text-base font-bold font-mono text-teal-900">{formatMoney(pagado?.seguro, 'Bs.')}</span>
          </div>
          <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-100">
            <span className="text-[10px] uppercase font-bold text-rose-800 block">Interés Penal / Mora</span>
            <span className="text-base font-bold font-mono text-rose-900">{formatMoney(pagado?.mora, 'Bs.')}</span>
          </div>
        </div>
      </Card>

      {/* Créditos del Socio */}
      <Card className="p-5 space-y-4 border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#064e3b]">credit_card</span>
            <h2 className="font-bold text-sm text-[#0b1c30]">
              Mis Créditos y Préstamos
            </h2>
          </div>
          <Link to="/socio/mis-creditos" className="text-xs text-[#006c49] font-semibold hover:underline">
            Ver todos los créditos →
          </Link>
        </div>

        {creditos.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs italic">
            No tienes créditos activos registrados actualmente.
          </div>
        ) : (
          <div className="space-y-3">
            {creditos.map((c) => {
              const curSim = c.moneda === 'USD' ? '$' : 'Bs.'
              return (
                <div
                  key={c.id}
                  className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition flex flex-wrap items-center justify-between gap-4 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{c.producto || 'Crédito'}</span>
                      <span className="font-mono text-[11px] text-slate-400">({c.numero_credito})</span>
                      <Badge variant="navy">{formatTipoCredito(c.tipo_credito)}</Badge>
                    </div>
                    <div className="text-slate-600">
                      Saldo pendiente:{' '}
                      <span className="font-bold font-mono text-slate-900">
                        {formatMoney(c.saldo_pendiente, curSim)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1 text-right">
                    {c.proxima_cuota ? (
                      <div>
                        <span className="text-[11px] text-slate-500 block">
                          Próxima cuota #{c.proxima_cuota.numero} ({formatDate(c.proxima_cuota.fecha_vencimiento)})
                        </span>
                        <span className="font-bold font-mono text-sm text-[#006c49]">
                          {formatMoney(c.proxima_cuota.monto_total, curSim)}
                        </span>
                      </div>
                    ) : (
                      <Badge variant="green">Al día</Badge>
                    )}
                  </div>

                  <div>
                    <Link to={`/socio/mis-creditos/${c.id}`}>
                      <Button type="button" variant="secondary" size="sm" className="text-xs gap-1">
                        <span className="material-symbols-outlined text-[15px]">receipt_long</span>
                        <span>Extracto</span>
                      </Button>
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
