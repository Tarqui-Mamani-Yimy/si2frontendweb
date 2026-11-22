import { useCallback, useEffect, useState } from 'react'
import PageHeader from '../../../components/ui/PageHeader'
import Card from '../../../components/ui/Card'
import Badge from '../../../components/ui/Badge'
import AlertBanner from '../../../components/ui/AlertBanner'
import Skeleton from '../../../components/ui/Skeleton'
import MetricCard from '../../../components/ui/MetricCard'
import { listarReprogramaciones } from '../../../core/api/creditosApi'
import { getApiErrorMessage } from '../../../core/api/errors'

function formatDate(isoString) {
  if (!isoString) return '—'
  try {
    const d = new Date(isoString)
    if (isNaN(d.getTime())) return String(isoString)
    return d.toLocaleDateString('es-BO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return String(isoString)
  }
}

function formatMoney(amount, currency = 'Bs.') {
  const n = Number(amount ?? 0)
  return `${currency} ${n.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function getEstadoBadgeVariant(estado) {
  switch (estado) {
    case 'APROBADA':
      return 'green'
    case 'RECHAZADA':
      return 'red'
    case 'SOLICITADA':
      return 'amber'
    default:
      return 'slate'
  }
}

export default function ReprogramacionesConsultaPage() {
  const [reprogramaciones, setReprogramaciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filtroEstado, setFiltroEstado] = useState('')

  const loadData = useCallback(async (stParam = filtroEstado) => {
    setLoading(true)
    setError(null)
    try {
      const params = {}
      if (stParam) params.estado = stParam
      const data = await listarReprogramaciones(params)
      setReprogramaciones(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          'No se pudieron cargar las reprogramaciones de crédito.',
        ),
      )
    } finally {
      setLoading(false)
    }
  }, [filtroEstado])

  useEffect(() => {
    loadData(filtroEstado)
  }, [loadData, filtroEstado])

  const totalSolicitudes = reprogramaciones.length
  const solicitadasCount = reprogramaciones.filter((r) => r.estado === 'SOLICITADA').length
  const aprobadasCount = reprogramaciones.filter((r) => r.estado === 'APROBADA').length
  const rechazadasCount = reprogramaciones.filter((r) => r.estado === 'RECHAZADA').length

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <PageHeader
        title="Consulta de Reprogramaciones (ASFI)"
        subtitle="Registro histórico y solicitudes de reprogramación crediticia conforme a normativa regulatoria."
      />

      {error && (
        <AlertBanner variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </AlertBanner>
      )}

      {/* Métricas Informativas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Listado"
          value={totalSolicitudes}
          icon="summarize"
          iconBg="bg-slate-50"
          iconColor="text-slate-700"
        />
        <MetricCard
          label="Solicitudes Pendientes"
          value={solicitadasCount}
          icon="pending_actions"
          iconBg="bg-amber-50"
          iconColor="text-amber-800"
        />
        <MetricCard
          label="Aprobadas"
          value={aprobadasCount}
          icon="task_alt"
          iconBg="bg-emerald-50"
          iconColor="text-emerald-700"
        />
        <MetricCard
          label="Rechazadas"
          value={rechazadasCount}
          icon="cancel"
          iconBg="bg-rose-50"
          iconColor="text-rose-700"
        />
      </div>

      {/* Filtros */}
      <Card className="p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <label
              htmlFor="filtro-estado-reprog"
              className="text-xs font-semibold uppercase tracking-wider text-slate-600"
            >
              Filtrar por Estado:
            </label>
            <select
              id="filtro-estado-reprog"
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 bg-slate-50/60 px-3 text-xs text-slate-800 outline-none focus:border-[#006c49] focus:bg-white"
            >
              <option value="">Todos los estados</option>
              <option value="SOLICITADA">Solicitadas (Pendientes)</option>
              <option value="APROBADA">Aprobadas</option>
              <option value="RECHAZADA">Rechazadas</option>
            </select>
          </div>

          <span className="text-xs text-slate-400">
            {loading ? 'Cargando registros...' : `${reprogramaciones.length} reprogramaciones encontradas`}
          </span>
        </div>
      </Card>

      {/* Tabla de Reprogramaciones (Read-Only) */}
      <Card className="overflow-hidden border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-[#f8f9ff] text-slate-500 font-semibold uppercase text-[11px]">
                <th className="py-3 px-4">N° Crédito</th>
                <th className="py-3 px-4">Socio</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4">Nuevo Plazo</th>
                <th className="py-3 px-4 text-right">Saldo Capital</th>
                <th className="py-3 px-4 text-right">Interés Corrido</th>
                <th className="py-3 px-4 text-right">Seguro Diferido</th>
                <th className="py-3 px-4">Fechas</th>
                <th className="py-3 px-4">Motivo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="p-4">
                    <div className="space-y-2">
                      <Skeleton className="h-6 w-full" />
                      <Skeleton className="h-6 w-full" />
                      <Skeleton className="h-6 w-full" />
                    </div>
                  </td>
                </tr>
              ) : reprogramaciones.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 text-xs italic">
                    No se encontraron reprogramaciones {filtroEstado ? `en estado ${filtroEstado}` : ''}.
                  </td>
                </tr>
              ) : (
                reprogramaciones.map((r) => {
                  const creditNum = r.numero_credito || (r.credito_id ? `CRE-#${r.credito_id}` : '—')
                  const socioName =
                    r.socio ||
                    r.nombre_socio ||
                    (r.credito?.socio
                      ? `${r.credito.socio.nombre} ${r.credito.socio.apellido}`.trim()
                      : '—')

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {creditNum}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {socioName}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant={getEstadoBadgeVariant(r.estado)}>
                          {r.estado}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800 block">
                          {r.nuevo_plazo_meses ? `${r.nuevo_plazo_meses} meses` : '—'}
                        </span>
                        <span className="text-[11px] text-slate-400 block">
                          Canal: {r.canal || 'VENTANILLA'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                        {formatMoney(r.saldo_capital)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-orange-800 tabular-nums">
                        {formatMoney(r.interes_corrido)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-blue-800 tabular-nums">
                        {formatMoney(r.seguro_diferido)}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                        <div>
                          <span className="text-slate-400">Sol:</span> {formatDate(r.fecha_solicitud)}
                        </div>
                        {r.fecha_resolucion && (
                          <div>
                            <span className="text-slate-400">Res:</span> {formatDate(r.fecha_resolucion)}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs">
                        <div className="truncate" title={r.motivo}>
                          {r.motivo || '—'}
                        </div>
                        {r.motivo_rechazo && (
                          <span className="text-[11px] text-rose-600 block font-semibold">
                            Rechazo: {r.motivo_rechazo}
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
