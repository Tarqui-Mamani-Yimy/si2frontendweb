import { useState, useEffect, useMemo } from 'react'
import PageHeader from '../../../components/ui/PageHeader'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import AlertBanner from '../../../components/ui/AlertBanner'
import MetricCard from '../../../components/ui/MetricCard'
import Skeleton from '../../../components/ui/Skeleton'
import CreditoDetalleModal from '../components/creditos/CreditoDetalleModal'
import {
  listarCreditos,
  listarMora,
  actualizarMora,
  predecirMoraCartera,
} from '../../../core/api/creditosApi'
import { useAuthStore, selectUser } from '../../../core/store/authStore'
import { normalizeRole } from '../../../core/utils/roles'

function formatMoney(value, simbolo = 'Bs.') {
  const n = Number(value ?? 0)
  return `${simbolo} ${n.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const parts = String(dateStr).split('-')
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`
  }
  return dateStr
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

function getEstadoBadgeVariant(estado) {
  switch (estado) {
    case 'VIGENTE':
      return 'green'
    case 'CANCELADO':
      return 'teal'
    case 'EN_MORA':
      return 'red'
    case 'REFINANCIADO':
      return 'purple'
    case 'CASTIGADO':
      return 'slate'
    default:
      return 'slate'
  }
}

/**
 * CarteraPage — Módulo de gestión de Cartera de Créditos, Cobro de Cuotas y Seguimiento de Mora (CU-W24 / CU-W26 / CU-W27).
 */
export default function CarteraPage() {
  const user = useAuthStore(selectUser)
  const roleName = user?.rol?.nombre || ''
  const roleNorm = normalizeRole(roleName)
  const canRefreshMora =
    roleNorm === 'oficial_credito' ||
    roleNorm === 'oficial' ||
    roleNorm === 'administrador' ||
    roleNorm === 'admin' ||
    roleNorm === 'superadmin'

  // Pestaña principal de la página: 'general' | 'mora'
  const [vistaActiva, setVistaActiva] = useState('general')

  // ── Estado de Cartera General ──
  const [creditos, setCreditos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filtros de Cartera General
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroCi, setFiltroCi] = useState('')

  // ── Estado de Cartera en Mora (Riesgo) ──
  const [moraItems, setMoraItems] = useState([])
  const [loadingMora, setLoadingMora] = useState(false)
  const [errorMora, setErrorMora] = useState(null)
  const [filtroEstadoMora, setFiltroEstadoMora] = useState('EN_MORA')
  const [actualizandoMora, setActualizandoMora] = useState(false)
  const [prediciendoMora, setPrediciendoMora] = useState(false)
  const [bannerMora, setBannerMora] = useState(null)

  // ── Modal de Detalle / Cobro / Cronograma ──
  const [selectedCreditoId, setSelectedCreditoId] = useState(null)
  const [selectedCreditoInit, setSelectedCreditoInit] = useState(null)
  const [modalInitialTab, setModalInitialTab] = useState('cronograma')
  const [detalleModalOpen, setDetalleModalOpen] = useState(false)

  // Cargar cartera general al montar
  useEffect(() => {
    let isMounted = true

    async function loadData() {
      setLoading(true)
      setError(null)
      try {
        const data = await listarCreditos()
        if (isMounted) setCreditos(Array.isArray(data) ? data : [])
      } catch (err) {
        if (isMounted) {
          setError(
            err.response?.data?.detail ||
              'Error al cargar la cartera de créditos.',
          )
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadData()

    return () => {
      isMounted = false
    }
  }, [])

  // Cargar cartera en mora cuando se activa esa pestaña o cambia su filtro
  useEffect(() => {
    if (vistaActiva !== 'mora') return
    let isMounted = true

    async function loadMora() {
      setLoadingMora(true)
      setErrorMora(null)
      try {
        const params = {}
        if (filtroEstadoMora) params.estado = filtroEstadoMora
        const data = await listarMora(params)
        if (isMounted) setMoraItems(Array.isArray(data) ? data : [])
      } catch (err) {
        if (isMounted) {
          setErrorMora(
            err.response?.data?.detail ||
              'Error al consultar el seguimiento de morosidad.',
          )
        }
      } finally {
        if (isMounted) setLoadingMora(false)
      }
    }

    loadMora()

    return () => {
      isMounted = false
    }
  }, [vistaActiva, filtroEstadoMora])

  async function reloadCreditos(filtrosActuales = {}) {
    setLoading(true)
    setError(null)
    try {
      const params = {}
      const st = filtrosActuales.estado !== undefined ? filtrosActuales.estado : filtroEstado
      const ci = filtrosActuales.socio_ci !== undefined ? filtrosActuales.socio_ci : filtroCi

      if (st) params.estado = st
      if (ci.trim()) params.socio_ci = ci.trim()

      const data = await listarCreditos(params)
      setCreditos(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al filtrar la cartera de créditos.')
    } finally {
      setLoading(false)
    }
  }

  async function reloadMora() {
    setLoadingMora(true)
    setErrorMora(null)
    try {
      const params = {}
      if (filtroEstadoMora) params.estado = filtroEstadoMora
      const data = await listarMora(params)
      setMoraItems(Array.isArray(data) ? data : [])
    } catch (err) {
      setErrorMora(err.response?.data?.detail || 'Error al actualizar la lista de mora.')
    } finally {
      setLoadingMora(false)
    }
  }

  function handleFiltrar(e) {
    e?.preventDefault()
    reloadCreditos()
  }

  function handleLimpiar() {
    setFiltroEstado('')
    setFiltroCi('')
    reloadCreditos({ estado: '', socio_ci: '' })
  }

  function handleVerDetalle(credito, tab = 'cronograma') {
    const cid = credito.credito_id || credito.id
    setSelectedCreditoId(cid)
    setSelectedCreditoInit(credito)
    setModalInitialTab(tab)
    setDetalleModalOpen(true)
  }

  async function handleEjecutarActualizarMora() {
    setActualizandoMora(true)
    setBannerMora(null)
    try {
      const res = await actualizarMora()
      setBannerMora({
        tipo: 'success',
        mensaje: `Morosidad actualizada exitosamente: ${res.actualizados ?? 0} créditos analizados (${res.en_mora ?? 0} en mora, ${res.al_dia ?? 0} al día).`,
      })
      reloadMora()
      reloadCreditos()
    } catch (err) {
      setBannerMora({
        tipo: 'error',
        mensaje: err.response?.data?.detail || 'Error al actualizar el estado de morosidad.',
      })
    } finally {
      setActualizandoMora(false)
    }
  }

  async function handleEjecutarPredecirMora() {
    setPrediciendoMora(true)
    setBannerMora(null)
    try {
      const res = await predecirMoraCartera()
      setBannerMora({
        tipo: 'success',
        mensaje: `Predicción de mora ejecutada con éxito: ${res.actualizados ?? 0} créditos vigentes procesados (${res.bajo ?? 0} riesgo bajo, ${res.medio ?? 0} medio, ${res.alto ?? 0} alto).`,
      })
      reloadMora()
    } catch (err) {
      setBannerMora({
        tipo: 'error',
        mensaje: err.response?.data?.detail || 'Error al ejecutar la predicción de morosidad.',
      })
    } finally {
      setPrediciendoMora(false)
    }
  }

  // Métricas de cartera general
  const metrics = useMemo(() => {
    const total = creditos.length
    const vigentes = creditos.filter((c) => c.estado === 'VIGENTE').length
    const enMora = creditos.filter((c) => c.estado === 'EN_MORA' || c.estado_mora === 'EN_MORA').length
    const cancelados = creditos.filter((c) => c.estado === 'CANCELADO').length

    const saldoTotalPendiente = creditos.reduce(
      (acc, c) => acc + (c.estado === 'VIGENTE' || c.estado === 'EN_MORA' ? Number(c.saldo_pendiente || 0) : 0),
      0,
    )

    return { total, vigentes, enMora, cancelados, saldoTotalPendiente }
  }, [creditos])

  // Métricas del panel de Mora
  const metricsMora = useMemo(() => {
    const totalEnMora = moraItems.filter((m) => m.estado_mora === 'EN_MORA').length
    const maxAtraso = moraItems.reduce((max, m) => Math.max(max, Number(m.dias_de_retaso || 0)), 0)
    const totalVencido = moraItems.reduce((acc, m) => acc + Number(m.monto_vencido || 0), 0)
    const totalPenalizado = moraItems.reduce((acc, m) => acc + Number(m.monto_penalizado || 0), 0)

    return { totalEnMora, maxAtraso, totalVencido, totalPenalizado }
  }, [moraItems])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cartera y Cobros de Crédito"
        subtitle="Administración, cronogramas de pago, liquidación de mora y cobro de cuotas (CU-W24 / CU-W26 / CU-W27)"
      />

      {/* ── Selector de Vista: Cartera General vs Cartera en Mora ── */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setVistaActiva('general')}
          className={`px-5 py-3 text-xs font-bold transition-colors border-b-2 flex items-center gap-2 ${
            vistaActiva === 'general'
              ? 'border-[#064e3b] text-[#064e3b]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
          <span>Cartera General</span>
        </button>

        <button
          type="button"
          onClick={() => setVistaActiva('mora')}
          className={`px-5 py-3 text-xs font-bold transition-colors border-b-2 flex items-center gap-2 ${
            vistaActiva === 'mora'
              ? 'border-[#064e3b] text-[#064e3b]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">warning</span>
          <span>Cartera en Mora / Riesgo (CU-W27)</span>
          {metrics.enMora > 0 && (
            <Badge variant="red" className="!text-[10px] !py-0 !px-1.5 font-bold">
              {metrics.enMora}
            </Badge>
          )}
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          VISTA 1: CARTERA GENERAL
         ══════════════════════════════════════════════════════════════ */}
      {vistaActiva === 'general' && (
        <div className="space-y-6">
          {error && (
            <AlertBanner variant="error" onClose={() => setError(null)}>
              {error}
            </AlertBanner>
          )}

          {/* Métricas de Cartera */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              label="Total Créditos"
              value={metrics.total}
              icon="credit_score"
              iconBg="bg-blue-50"
              iconColor="text-blue-700"
            />
            <MetricCard
              label="Créditos Vigentes"
              value={metrics.vigentes}
              icon="account_balance"
              iconBg="bg-emerald-50"
              iconColor="text-[#064e3b]"
            />
            <MetricCard
              label="Créditos en Mora"
              value={metrics.enMora}
              icon="warning"
              iconBg="bg-rose-50"
              iconColor="text-rose-700"
            />
            <MetricCard
              label="Saldo Vigente Total"
              value={`Bs. ${metrics.saldoTotalPendiente.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              icon="payments"
              iconBg="bg-amber-50"
              iconColor="text-amber-800"
            />
          </div>

          {/* Barra de Filtros */}
          <div className="p-4 rounded-xl border border-[#e2e8f0] bg-white shadow-card">
            <form onSubmit={handleFiltrar} className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-3 items-end">
              <div>
                <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">
                  Estado del Crédito
                </label>
                <select
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value)}
                  className="w-full h-10 px-3 text-xs border border-slate-200 rounded-lg bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#064e3b]"
                >
                  <option value="">Todos los estados</option>
                  <option value="VIGENTE">VIGENTE</option>
                  <option value="EN_MORA">EN MORA</option>
                  <option value="CANCELADO">CANCELADO</option>
                  <option value="REFINANCIADO">REFINANCIADO</option>
                  <option value="CASTIGADO">CASTIGADO</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">
                  CI del Socio Titular
                </label>
                <input
                  type="text"
                  placeholder="Ej. 4589231"
                  value={filtroCi}
                  onChange={(e) => setFiltroCi(e.target.value)}
                  className="w-full h-10 px-3 text-xs border border-slate-200 rounded-lg bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#064e3b]"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  loading={loading}
                  className="flex-1 gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">filter_list</span>
                  <span>Filtrar</span>
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={handleLimpiar}
                  disabled={loading}
                  title="Restablecer filtros"
                >
                  <span className="material-symbols-outlined text-[16px]">refresh</span>
                </Button>
              </div>
            </form>
          </div>

          {/* Tabla de Cartera General */}
          <div className="overflow-x-auto rounded-xl border border-[#e2e8f0] bg-white shadow-card">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#e2e8f0] bg-[#f8f9ff]">
                  <th className="px-4 py-3.5 font-table-header text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    N° Crédito / Desembolso
                  </th>
                  <th className="px-4 py-3.5 font-table-header text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Socio Titular
                  </th>
                  <th className="px-4 py-3.5 font-table-header text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Producto / Amortización
                  </th>
                  <th className="px-4 py-3.5 font-table-header text-[11px] font-semibold uppercase tracking-wider text-slate-500 text-right">
                    Monto Aprobado
                  </th>
                  <th className="px-4 py-3.5 font-table-header text-[11px] font-semibold uppercase tracking-wider text-slate-500 text-right">
                    Saldo Pendiente
                  </th>
                  <th className="px-4 py-3.5 font-table-header text-[11px] font-semibold uppercase tracking-wider text-slate-500 text-center">
                    Cuotas
                  </th>
                  <th className="px-4 py-3.5 font-table-header text-[11px] font-semibold uppercase tracking-wider text-slate-500 text-center">
                    Próxima Cuota
                  </th>
                  <th className="px-4 py-3.5 font-table-header text-[11px] font-semibold uppercase tracking-wider text-slate-500 text-center">
                    Estado
                  </th>
                  <th className="px-4 py-3.5 font-table-header text-[11px] font-semibold uppercase tracking-wider text-slate-500 text-center">
                    Morosidad
                  </th>
                  <th className="px-4 py-3.5 font-table-header text-[11px] font-semibold uppercase tracking-wider text-slate-500 text-center">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0]/80">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="p-6">
                      <div className="space-y-3">
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-6 w-full" />
                      </div>
                    </td>
                  </tr>
                ) : creditos.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-12 text-center text-sm text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-[36px] text-slate-300">credit_card_off</span>
                        <span className="font-semibold text-slate-600">No se encontraron créditos en cartera</span>
                        <span className="text-xs text-slate-400">
                          {filtroEstado || filtroCi
                            ? 'Ajuste los criterios de búsqueda para visualizar resultados.'
                            : 'No hay operaciones crediticias desembolsadas en este momento.'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  creditos.map((c) => {
                    const sim = (typeof c.moneda === 'object' ? c.moneda?.simbolo : 'Bs.') || 'Bs.'
                    const numeroCredito = c.numero_credito || `CRE-#${c.id}`
                    const sePuedeCobrar = c.estado === 'VIGENTE' || c.estado === 'EN_MORA'

                    return (
                      <tr key={c.id} className="transition-colors hover:bg-slate-50/80">
                        {/* Número y Fecha */}
                        <td className="px-4 py-3.5 text-xs">
                          <span className="font-mono font-bold text-slate-900 block">{numeroCredito}</span>
                          <span className="text-[11px] text-slate-400 block">{formatDate(c.fecha_desembolso)}</span>
                        </td>

                        {/* Socio */}
                        <td className="px-4 py-3.5 text-xs">
                          <span className="font-bold text-slate-900 block">{c.socio?.nombre_completo || '—'}</span>
                          <span className="font-mono text-[11px] text-slate-500">CI: {c.socio?.ci || '—'}</span>
                        </td>

                        {/* Producto y Amortización */}
                        <td className="px-4 py-3.5 text-xs max-w-[180px]">
                          <span className="font-semibold text-slate-800 block truncate" title={c.producto?.nombre}>
                            {c.producto ? c.producto.nombre : 'Crédito General (Seed)'}
                          </span>
                          <span className="text-[11px] text-slate-500 block">
                            {c.tipo_amortizacion === 'ALEMAN' ? 'Alemán' : 'Francés'} &bull; {Number(c.tasa_interes ?? 0).toFixed(2)}% TNA
                          </span>
                        </td>

                        {/* Monto Aprobado */}
                        <td className="px-4 py-3.5 text-xs text-right font-display font-bold text-slate-900 tabular-nums">
                          {formatMoney(c.monto_aprobado, sim)}
                        </td>

                        {/* Saldo Pendiente */}
                        <td className="px-4 py-3.5 text-xs text-right font-display font-bold text-emerald-800 tabular-nums">
                          {formatMoney(c.saldo_pendiente, sim)}
                        </td>

                        {/* Cuotas */}
                        <td className="px-4 py-3.5 text-xs text-center font-mono font-bold text-slate-700">
                          <span>{c.cuotas_pagadas ?? 0}</span> / <span>{c.cuotas_totales ?? c.plazo_meses ?? '—'}</span>
                        </td>

                        {/* Próxima Cuota */}
                        <td className="px-4 py-3.5 text-xs text-center">
                          {c.proxima_cuota ? (
                            <div className="inline-flex flex-col items-center">
                              <span className="font-mono text-slate-800 text-[11px] font-semibold">
                                {formatDate(c.proxima_cuota.fecha_vencimiento)}
                              </span>
                              <span className="font-mono font-bold text-[#064e3b] text-xs">
                                {formatMoney(c.proxima_cuota.cuota, sim)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px]">—</span>
                          )}
                        </td>

                        {/* Estado */}
                        <td className="px-4 py-3.5 text-xs text-center">
                          <Badge variant={getEstadoBadgeVariant(c.estado)}>
                            {c.estado}
                          </Badge>
                        </td>

                        {/* Estado de Morosidad */}
                        <td className="px-4 py-3.5 text-xs text-center">
                          {c.estado_mora === 'EN_MORA' || c.estado === 'EN_MORA' ? (
                            <Badge variant="red" className="!text-[10px] !py-0.5 !px-2 font-bold whitespace-nowrap">
                              EN MORA ({c.dias_de_retaso ?? 0}d)
                            </Badge>
                          ) : c.estado_mora === 'AL_DIA' || c.estado === 'VIGENTE' ? (
                            <Badge variant="green" className="!text-[10px] !py-0.5 !px-2">
                              AL DÍA
                            </Badge>
                          ) : (
                            <span className="text-slate-400 text-[11px]">—</span>
                          )}
                        </td>

                        {/* Acciones */}
                        <td className="px-4 py-3.5 text-xs text-center whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            {sePuedeCobrar && (
                              <Button
                                type="button"
                                variant="primary"
                                size="sm"
                                onClick={() => handleVerDetalle(c, 'cobro')}
                                className="gap-1 !text-xs !py-1 !px-2.5 bg-[#064e3b] hover:bg-[#043327] text-white"
                                title="Cobrar la siguiente cuota exigible"
                              >
                                <span className="material-symbols-outlined text-[15px]">payments</span>
                                <span>Cobrar</span>
                              </Button>
                            )}

                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => handleVerDetalle(c, 'cronograma')}
                              className="gap-1 !text-xs !py-1 !px-2.5"
                              title="Ver detalle del crédito y cronograma de amortización"
                            >
                              <span className="material-symbols-outlined text-[15px]">visibility</span>
                              <span>Detalle</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          VISTA 2: SEGUIMIENTO DE CARTERA EN MORA / RIESGO (CU-W27 F4)
         ══════════════════════════════════════════════════════════════ */}
      {vistaActiva === 'mora' && (
        <div className="space-y-6">
          {bannerMora && (
            <AlertBanner
              variant={bannerMora.tipo === 'success' ? 'success' : 'error'}
              onClose={() => setBannerMora(null)}
            >
              {bannerMora.mensaje}
            </AlertBanner>
          )}

          {errorMora && (
            <AlertBanner variant="error" onClose={() => setErrorMora(null)}>
              {errorMora}
            </AlertBanner>
          )}

          {/* Métricas de Mora */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              label="Operaciones en Mora"
              value={metricsMora.totalEnMora}
              icon="report_problem"
              iconBg="bg-rose-50"
              iconColor="text-rose-700"
            />
            <MetricCard
              label="Máximo Retraso"
              value={`${metricsMora.maxAtraso} días`}
              icon="schedule"
              iconBg="bg-amber-50"
              iconColor="text-amber-800"
            />
            <MetricCard
              label="Monto Capital Vencido"
              value={`Bs. ${metricsMora.totalVencido.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              icon="money_off"
              iconBg="bg-red-50"
              iconColor="text-red-700"
            />
            <MetricCard
              label="Penalidades Acumuladas"
              value={`Bs. ${metricsMora.totalPenalizado.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              icon="gavel"
              iconBg="bg-purple-50"
              iconColor="text-purple-700"
            />
          </div>

          {/* Barra de Acciones y Filtros de Morosidad */}
          <div className="p-4 rounded-xl border border-[#e2e8f0] bg-white shadow-card flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                Filtrar por Estado:
              </label>
              <select
                value={filtroEstadoMora}
                onChange={(e) => setFiltroEstadoMora(e.target.value)}
                className="h-10 px-3 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#064e3b]"
              >
                <option value="EN_MORA">Solo Créditos EN MORA</option>
                <option value="AL_DIA">Créditos AL DÍA</option>
                <option value="">Todos los Registros</option>
              </select>
            </div>

            {canRefreshMora && (
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  loading={prediciendoMora}
                  onClick={handleEjecutarPredecirMora}
                  className="gap-2 text-indigo-900 border-indigo-200 hover:bg-indigo-50 w-full sm:w-auto"
                  title="Calcular probabilidad predictiva de mora con modelo sintético (CU-W23 p2)"
                >
                  <span className="material-symbols-outlined text-[18px]">psychology</span>
                  <span>Predecir Mora (IA)</span>
                </Button>

                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  loading={actualizandoMora}
                  onClick={handleEjecutarActualizarMora}
                  className="gap-2 bg-amber-700 hover:bg-amber-800 text-white w-full sm:w-auto"
                  title="Recalcular morosidad, días de retraso e interés penal de todos los créditos vigentes"
                >
                  <span className="material-symbols-outlined text-[18px]">update</span>
                  <span>Actualizar Morosidad</span>
                </Button>
              </div>
            )}
          </div>

          {/* Tabla de Morosidad */}
          <div className="overflow-x-auto rounded-xl border border-[#e2e8f0] bg-white shadow-card">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#e2e8f0] bg-[#f8f9ff]">
                  <th className="px-4 py-3.5 font-table-header text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    N° Crédito
                  </th>
                  <th className="px-4 py-3.5 font-table-header text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Socio Titular
                  </th>
                  <th className="px-4 py-3.5 font-table-header text-[11px] font-semibold uppercase tracking-wider text-slate-500 text-center">
                    Cuotas Vencidas
                  </th>
                  <th className="px-4 py-3.5 font-table-header text-[11px] font-semibold uppercase tracking-wider text-slate-500 text-center">
                    Días Retraso
                  </th>
                  <th className="px-4 py-3.5 font-table-header text-[11px] font-semibold uppercase tracking-wider text-slate-500 text-right">
                    Monto Vencido
                  </th>
                  <th className="px-4 py-3.5 font-table-header text-[11px] font-semibold uppercase tracking-wider text-slate-500 text-right">
                    Penalización Mora
                  </th>
                  <th className="px-4 py-3.5 font-table-header text-[11px] font-semibold uppercase tracking-wider text-slate-500 text-right">
                    Saldo Total Pendiente
                  </th>
                  <th className="px-4 py-3.5 font-table-header text-[11px] font-semibold uppercase tracking-wider text-slate-500 text-center">
                    Estado Mora
                  </th>
                  <th className="px-4 py-3.5 font-table-header text-[11px] font-semibold uppercase tracking-wider text-slate-500 text-center">
                    Mora Sintética *
                  </th>
                  <th className="px-4 py-3.5 font-table-header text-[11px] font-semibold uppercase tracking-wider text-slate-500 text-center">
                    Nivel Riesgo *
                  </th>
                  <th className="px-4 py-3.5 font-table-header text-[11px] font-semibold uppercase tracking-wider text-slate-500 text-center">
                    Última Actualización
                  </th>
                  <th className="px-4 py-3.5 font-table-header text-[11px] font-semibold uppercase tracking-wider text-slate-500 text-center">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0]/80">
                {loadingMora ? (
                  <tr>
                    <td colSpan={12} className="p-6">
                      <div className="space-y-3">
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-6 w-full" />
                      </div>
                    </td>
                  </tr>
                ) : moraItems.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="px-6 py-12 text-center text-sm text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-[36px] text-slate-300">verified</span>
                        <span className="font-semibold text-slate-600">No se registran créditos bajo este criterio</span>
                        <span className="text-xs text-slate-400">
                          {filtroEstadoMora === 'EN_MORA'
                            ? 'Excelente: No existen operaciones en situación de mora actualmente.'
                            : 'No se encontraron registros de morosidad para el filtro seleccionado.'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  moraItems.map((m) => {
                    const sim = (typeof m.moneda === 'object' ? m.moneda?.simbolo : 'Bs.') || 'Bs.'
                    const numeroCredito = m.numero_credito || `CRE-#${m.credito_id}`

                    return (
                      <tr key={m.credito_id} className="transition-colors hover:bg-slate-50/80">
                        {/* Crédito */}
                        <td className="px-4 py-3.5 font-mono font-bold text-slate-900">
                          {numeroCredito}
                        </td>

                        {/* Socio */}
                        <td className="px-4 py-3.5">
                          <span className="font-bold text-slate-900 block">
                            {m.socio?.nombre_completo || '—'}
                          </span>
                          <span className="font-mono text-[11px] text-slate-500">
                            CI: {m.socio?.ci || '—'}
                          </span>
                        </td>

                        {/* Cuotas Vencidas */}
                        <td className="px-4 py-3.5 text-center font-mono font-bold text-rose-700">
                          {m.cuotas_vencidas ?? 0}
                        </td>

                        {/* Días de Retraso */}
                        <td className="px-4 py-3.5 text-center font-mono font-bold text-slate-800">
                          {m.dias_de_retaso ?? 0} d
                        </td>

                        {/* Monto Vencido */}
                        <td className="px-4 py-3.5 text-right font-mono font-bold text-rose-800 tabular-nums">
                          {formatMoney(m.monto_vencido, sim)}
                        </td>

                        {/* Penalización Mora */}
                        <td className="px-4 py-3.5 text-right font-mono font-bold text-amber-900 tabular-nums">
                          {formatMoney(m.monto_penalizado, sim)}
                        </td>

                        {/* Saldo Pendiente */}
                        <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-900 tabular-nums">
                          {formatMoney(m.saldo_pendiente, sim)}
                        </td>

                        {/* Estado Mora */}
                        <td className="px-4 py-3.5 text-center">
                          <Badge variant={m.estado_mora === 'EN_MORA' ? 'red' : 'green'} className="font-bold">
                            {m.estado_mora === 'EN_MORA' ? 'EN MORA' : 'AL DÍA'}
                          </Badge>
                        </td>

                        {/* Mora Sintética */}
                        <td className="px-4 py-3.5 text-center font-mono font-bold text-slate-800 text-[11px]">
                          {m.probabilidad_mora != null
                            ? `${(Number(m.probabilidad_mora) * 100).toFixed(1)}%`
                            : '—'}
                        </td>

                        {/* Nivel Riesgo */}
                        <td className="px-4 py-3.5 text-center">
                          {m.nivel_riesgo ? (
                            <Badge
                              variant={
                                m.nivel_riesgo === 'ALTO'
                                  ? 'red'
                                  : m.nivel_riesgo === 'MEDIO'
                                  ? 'amber'
                                  : 'green'
                              }
                              className="!text-[9px] !py-0 !px-1.5 font-bold"
                            >
                              {m.nivel_riesgo}
                            </Badge>
                          ) : (
                            <span className="text-slate-400 text-[11px]">—</span>
                          )}
                        </td>

                        {/* Fecha Actualización */}
                        <td className="px-4 py-3.5 text-center text-slate-500 font-mono text-[11px] whitespace-nowrap">
                          {formatDateTime(m.fecha_actualizacion)}
                        </td>

                        {/* Acciones */}
                        <td className="px-4 py-3.5 text-center whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <Button
                              type="button"
                              variant="primary"
                              size="sm"
                              onClick={() => handleVerDetalle(m, 'cobro')}
                              className="gap-1 !text-xs !py-1 !px-2.5 bg-[#064e3b] hover:bg-[#043327] text-white"
                              title="Liquidar y cobrar cuota pendiente"
                            >
                              <span className="material-symbols-outlined text-[15px]">payments</span>
                              <span>Cobrar</span>
                            </Button>

                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => handleVerDetalle(m, 'cronograma')}
                              className="gap-1 !text-xs !py-1 !px-2.5"
                              title="Ver expediente del crédito"
                            >
                              <span className="material-symbols-outlined text-[15px]">visibility</span>
                              <span>Ver</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
            <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-400">
              * Estimación predictiva de mora y nivel de riesgo calculados con modelo sintético (informativo). No altera el estado fiduciario oficial ni las regulaciones ASFI.
            </div>
          </div>
        </div>
      )}

      {/* ── Modal de Detalle, Cronograma, Cobro e Historial ── */}
      {detalleModalOpen && (
        <CreditoDetalleModal
          open={detalleModalOpen}
          creditoId={selectedCreditoId}
          creditoInit={selectedCreditoInit}
          initialTab={modalInitialTab}
          onUpdated={() => {
            reloadCreditos()
            if (vistaActiva === 'mora') reloadMora()
          }}
          onClose={() => {
            setDetalleModalOpen(false)
            setSelectedCreditoId(null)
            setSelectedCreditoInit(null)
          }}
        />
      )}
    </div>
  )
}
