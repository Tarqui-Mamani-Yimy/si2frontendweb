import { useState, useEffect, useMemo } from 'react'
import PageHeader from '../../../components/ui/PageHeader'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import AlertBanner from '../../../components/ui/AlertBanner'
import Skeleton from '../../../components/ui/Skeleton'
import DeclaracionUifModal from '../../../shared/components/uif/DeclaracionUifModal'
import { listDeclaracionesUif, getDeclaracionUif } from '../../../core/api/uifApi'

function formatMoney(value, simbolo = 'Bs.') {
  const n = Number(value ?? 0)
  return `${simbolo} ${n.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleString('es-BO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function CumplimientoPage() {
  const [declaraciones, setDeclaraciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filtros de búsqueda
  const [filtros, setFiltros] = useState({
    desde: '',
    hasta: '',
    socio_ci: '',
  })

  // Detalle para modal de auditoría e impresión
  const [selectedDecl, setSelectedDecl] = useState(null)
  const [loadingDetailId, setLoadingDetailId] = useState(null)
  const [detailError, setDetailError] = useState(null)

  useEffect(() => {
    let isMounted = true
    listDeclaracionesUif({})
      .then((data) => {
        if (isMounted) {
          setDeclaraciones(Array.isArray(data) ? data : [])
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.response?.data?.detail || 'Error al cargar las declaraciones juradas de UIF.')
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  async function handleBuscar(e) {
    e?.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const cleanParams = {}
      if (filtros.desde) cleanParams.desde = filtros.desde
      if (filtros.hasta) cleanParams.hasta = filtros.hasta
      if (filtros.socio_ci?.trim()) cleanParams.socio_ci = filtros.socio_ci.trim()

      const data = await listDeclaracionesUif(cleanParams)
      setDeclaraciones(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al filtrar declaraciones UIF.')
    } finally {
      setLoading(false)
    }
  }

  async function handleLimpiar() {
    setFiltros({ desde: '', hasta: '', socio_ci: '' })
    setLoading(true)
    setError(null)
    try {
      const data = await listDeclaracionesUif({})
      setDeclaraciones(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al restablecer listado de declaraciones.')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerDetalle(item) {
    setLoadingDetailId(item.id)
    setDetailError(null)
    try {
      const full = await getDeclaracionUif(item.id)
      setSelectedDecl(full)
    } catch (err) {
      setDetailError(err.response?.data?.detail || `No se pudo obtener el detalle de la declaración #${item.id}`)
    } finally {
      setLoadingDetailId(null)
    }
  }

  // Métricas agregadas
  const metrics = useMemo(() => {
    let totalBob = 0
    let totalUsd = 0
    let fraccionadas = 0

    declaraciones.forEach((d) => {
      const monto = Number(d.monto || 0)
      const iso = (typeof d.moneda === 'object' ? d.moneda?.codigo_iso : '')?.toUpperCase()
      if (iso === 'USD') {
        totalUsd += monto
      } else {
        totalBob += monto
      }
      if (d.fraccionada) {
        fraccionadas += 1
      }
    })

    return {
      totalCount: declaraciones.length,
      fraccionadas,
      totalBob,
      totalUsd,
    }
  }, [declaraciones])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Control de Cumplimiento Normativo (UIF)"
        subtitle="Registro y auditoría de declaraciones juradas de origen y destino de fondos — Ley N° 393"
      />

      {/* ── Banner informativo o de error ── */}
      {error && (
        <AlertBanner variant="error" onClose={() => setError(null)}>
          {error}
        </AlertBanner>
      )}

      {detailError && (
        <AlertBanner variant="error" onClose={() => setDetailError(null)}>
          {detailError}
        </AlertBanner>
      )}

      {/* ── Métricas de Cumplimiento ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-[#e2e8f0] bg-white shadow-card">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Declaraciones</span>
            <span className="material-symbols-outlined text-[20px] text-[#064e3b]">gavel</span>
          </div>
          <div className="font-display text-2xl font-bold text-slate-900">
            {metrics.totalCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Registros en el periodo</p>
        </div>

        <div className="p-4 rounded-xl border border-[#e2e8f0] bg-white shadow-card">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Op. Fraccionadas</span>
            <span className="material-symbols-outlined text-[20px] text-amber-600">warning</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-display text-2xl font-bold text-amber-700">
              {metrics.fraccionadas}
            </span>
            {metrics.fraccionadas > 0 && (
              <Badge variant="amber">Alerta</Badge>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Sospecha de estructuración</p>
        </div>

        <div className="p-4 rounded-xl border border-[#e2e8f0] bg-white shadow-card">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Volumen Acumulado BOB</span>
            <span className="material-symbols-outlined text-[20px] text-emerald-600">payments</span>
          </div>
          <div className="font-display text-xl font-bold text-slate-900 tabular-nums">
            {formatMoney(metrics.totalBob, 'Bs.')}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Umbral regulatorio ≥ Bs. 70.000</p>
        </div>

        <div className="p-4 rounded-xl border border-[#e2e8f0] bg-white shadow-card">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Volumen Acumulado USD</span>
            <span className="material-symbols-outlined text-[20px] text-emerald-600">attach_money</span>
          </div>
          <div className="font-display text-xl font-bold text-slate-900 tabular-nums">
            {formatMoney(metrics.totalUsd, '$us')}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Umbral regulatorio ≥ $us 10.000</p>
        </div>
      </div>

      {/* ── Barra de Filtros ── */}
      <div className="p-4 rounded-xl border border-[#e2e8f0] bg-white shadow-card">
        <form onSubmit={handleBuscar} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">
              Fecha Desde
            </label>
            <input
              type="date"
              value={filtros.desde}
              onChange={(e) => setFiltros((prev) => ({ ...prev, desde: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#064e3b]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">
              Fecha Hasta
            </label>
            <input
              type="date"
              value={filtros.hasta}
              onChange={(e) => setFiltros((prev) => ({ ...prev, hasta: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#064e3b]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">
              CI del Socio
            </label>
            <input
              type="text"
              placeholder="Ej. 1234567"
              value={filtros.socio_ci}
              onChange={(e) => setFiltros((prev) => ({ ...prev, socio_ci: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#064e3b]"
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
              <span className="material-symbols-outlined text-[16px]">search</span>
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

      {/* ── Tabla de Declaraciones Juradas ── */}
      <div className="overflow-x-auto rounded-xl border border-[#e2e8f0] bg-white shadow-card">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#e2e8f0] bg-[#f8f9ff]">
              <th className="px-4 py-3.5 font-table-header text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                ID / Fecha
              </th>
              <th className="px-4 py-3.5 font-table-header text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Operación
              </th>
              <th className="px-4 py-3.5 font-table-header text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Socio Titular
              </th>
              <th className="px-4 py-3.5 font-table-header text-[11px] font-semibold uppercase tracking-wider text-slate-500 text-right">
                Monto
              </th>
              <th className="px-4 py-3.5 font-table-header text-[11px] font-semibold uppercase tracking-wider text-slate-500 text-center">
                Declarante
              </th>
              <th className="px-4 py-3.5 font-table-header text-[11px] font-semibold uppercase tracking-wider text-slate-500 text-center">
                Estructuración
              </th>
              <th className="px-4 py-3.5 font-table-header text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Operador
              </th>
              <th className="px-4 py-3.5 font-table-header text-[11px] font-semibold uppercase tracking-wider text-slate-500 text-center">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e2e8f0]/80">
            {loading ? (
              <tr>
                <td colSpan={8} className="p-6">
                  <div className="space-y-3">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-full" />
                  </div>
                </td>
              </tr>
            ) : declaraciones.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-sm text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <span className="material-symbols-outlined text-[32px] text-slate-300">verified_user</span>
                    <span className="font-medium text-slate-500">No se encontraron declaraciones juradas UIF</span>
                    <span className="text-xs text-slate-400">Ajuste los filtros o registre operaciones en ventanilla / DPF.</span>
                  </div>
                </td>
              </tr>
            ) : (
              declaraciones.map((d) => {
                const sim = (typeof d.moneda === 'object' ? d.moneda?.simbolo : 'Bs.') || 'Bs.'
                const socioNom = d.socio?.nombre_completo || '—'
                const socioCi = d.socio?.ci || '—'
                const usuarioNom = d.usuario?.nombre || '—'
                const isDetailLoading = loadingDetailId === d.id

                return (
                  <tr key={d.id} className="h-[52px] transition-colors hover:bg-slate-50/80">
                    <td className="px-4 py-3 text-xs">
                      <span className="font-mono font-bold text-slate-900 block">#{d.id}</span>
                      <span className="text-[11px] text-slate-400 block">{formatDate(d.fecha)}</span>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 uppercase">
                        {d.tipo_operacion || 'OPERACIÓN'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span className="font-semibold text-slate-900 block">{socioNom}</span>
                      <span className="font-mono text-[11px] text-slate-500">CI: {socioCi}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-right font-display font-bold text-slate-900 tabular-nums">
                      {formatMoney(d.monto, sim)}
                    </td>
                    <td className="px-4 py-3 text-xs text-center">
                      {d.realizado_por === 'TERCERO' ? (
                        <Badge variant="blue">Tercero</Badge>
                      ) : (
                        <Badge variant="slate">Titular</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-center">
                      {d.fraccionada ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                          <span className="material-symbols-outlined text-[14px]">warning</span>
                          <span>Fraccionada</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">Ordinaria</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      <span className="block truncate max-w-[140px]" title={usuarioNom}>
                        {usuarioNom}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-center">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        loading={isDetailLoading}
                        onClick={() => handleVerDetalle(d)}
                        className="gap-1 !text-xs !py-1 !px-2.5"
                      >
                        <span className="material-symbols-outlined text-[15px]">description</span>
                        <span>Ver</span>
                      </Button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Modal de Detalle e Impresión de Declaración Jurada (readOnly) ── */}
      {selectedDecl && (
        <DeclaracionUifModal
          open={Boolean(selectedDecl)}
          onClose={() => setSelectedDecl(null)}
          readOnly={true}
          declaracionExistente={selectedDecl}
          tipoOperacion={selectedDecl.tipo_operacion}
          socio={selectedDecl.socio}
          monto={selectedDecl.monto}
          monedaSimbolo={typeof selectedDecl.moneda === 'object' ? selectedDecl.moneda?.simbolo : 'Bs.'}
        />
      )}
    </div>
  )
}
