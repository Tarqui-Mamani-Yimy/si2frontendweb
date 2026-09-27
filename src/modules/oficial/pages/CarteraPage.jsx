import { useState, useEffect, useMemo } from 'react'
import PageHeader from '../../../components/ui/PageHeader'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import AlertBanner from '../../../components/ui/AlertBanner'
import MetricCard from '../../../components/ui/MetricCard'
import Skeleton from '../../../components/ui/Skeleton'
import CreditoDetalleModal from '../components/creditos/CreditoDetalleModal'
import { listarCreditos } from '../../../core/api/creditosApi'

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
 * CarteraPage — Módulo de gestión y seguimiento de la Cartera de Créditos (CU-W24 / CU-W26).
 */
export default function CarteraPage() {
  const [creditos, setCreditos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filtros
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroCi, setFiltroCi] = useState('')

  // Modal de Detalle
  const [selectedCreditoId, setSelectedCreditoId] = useState(null)
  const [selectedCreditoInit, setSelectedCreditoInit] = useState(null)
  const [detalleModalOpen, setDetalleModalOpen] = useState(false)

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

  function handleFiltrar(e) {
    e?.preventDefault()
    reloadCreditos()
  }

  function handleLimpiar() {
    setFiltroEstado('')
    setFiltroCi('')
    reloadCreditos({ estado: '', socio_ci: '' })
  }

  function handleVerDetalle(credito) {
    setSelectedCreditoId(credito.id)
    setSelectedCreditoInit(credito)
    setDetalleModalOpen(true)
  }

  // Métricas de cartera
  const metrics = useMemo(() => {
    const total = creditos.length
    const vigentes = creditos.filter((c) => c.estado === 'VIGENTE').length
    const enMora = creditos.filter((c) => c.estado === 'EN_MORA').length
    const cancelados = creditos.filter((c) => c.estado === 'CANCELADO').length

    const saldoTotalPendiente = creditos.reduce(
      (acc, c) => acc + (c.estado === 'VIGENTE' || c.estado === 'EN_MORA' ? Number(c.saldo_pendiente || 0) : 0),
      0,
    )

    return { total, vigentes, enMora, cancelados, saldoTotalPendiente }
  }, [creditos])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cartera de Créditos"
        subtitle="Administración, seguimiento y amortización de créditos otorgados (CU-W24 / CU-W26)"
      />

      {error && (
        <AlertBanner variant="error" onClose={() => setError(null)}>
          {error}
        </AlertBanner>
      )}

      {/* ── Métricas del Módulo de Cartera ── */}
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

      {/* ── Barra de Filtros ── */}
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

      {/* ── Tabla de Cartera ── */}
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
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e2e8f0]/80">
            {loading ? (
              <tr>
                <td colSpan={9} className="p-6">
                  <div className="space-y-3">
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-full" />
                  </div>
                </td>
              </tr>
            ) : creditos.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center text-sm text-slate-400">
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

                    {/* Acciones */}
                    <td className="px-4 py-3.5 text-xs text-center">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => handleVerDetalle(c)}
                        className="gap-1 !text-xs !py-1 !px-2.5"
                        title="Ver detalle del crédito y cronograma de amortización"
                      >
                        <span className="material-symbols-outlined text-[15px]">visibility</span>
                        <span>Ver Cronograma</span>
                      </Button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Modal de Detalle y Cronograma de Amortización ── */}
      {detalleModalOpen && (
        <CreditoDetalleModal
          open={detalleModalOpen}
          creditoId={selectedCreditoId}
          creditoInit={selectedCreditoInit}
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
