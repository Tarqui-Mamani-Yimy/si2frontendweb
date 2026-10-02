import { useState, useEffect, useMemo } from 'react'
import PageHeader from '../../../components/ui/PageHeader'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import AlertBanner from '../../../components/ui/AlertBanner'
import MetricCard from '../../../components/ui/MetricCard'
import Skeleton from '../../../components/ui/Skeleton'
import SolicitudModal from '../components/solicitudes/SolicitudModal'
import DetalleSolicitudModal from '../components/solicitudes/DetalleSolicitudModal'
import AnularSolicitudModal from '../components/solicitudes/AnularSolicitudModal'
import ActaComiteModal from '../components/comite/ActaComiteModal'
import { listSolicitudesCredito } from '../../../core/api/creditosApi'
import { useAuthStore, selectUser } from '../../../core/store/authStore'
import { normalizeRole } from '../../../core/utils/roles'

function formatMoney(value, simbolo = 'Bs.') {
  const n = Number(value ?? 0)
  return `${simbolo} ${n.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(isoStr) {
  if (!isoStr) return '—'
  const d = new Date(isoStr)
  if (isNaN(d.getTime())) return isoStr
  return d.toLocaleDateString('es-BO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function getEstadoBadgeVariant(estado) {
  switch (estado) {
    case 'PENDIENTE':
      return 'navy'
    case 'OBSERVADA':
      return 'amber'
    case 'EN_EVALUACION':
      return 'indigo'
    case 'EN_COMITE':
      return 'purple'
    case 'APROBADO':
      return 'green'
    case 'RECHAZADO':
      return 'red'
    case 'DESEMBOLSADO':
      return 'teal'
    case 'ANULADA':
      return 'slate'
    default:
      return 'slate'
  }
}

function getDictamenBadgeVariant(dictamen) {
  switch (dictamen) {
    case 'APROBADO':
      return 'green'
    case 'REVISION_MANUAL':
      return 'amber'
    case 'RECHAZADO':
      return 'red'
    default:
      return 'slate'
  }
}

export default function OficialSolicitudesPage() {
  const user = useAuthStore(selectUser)
  const roleName = user?.rol?.nombre || ''
  const isAdmin =
    roleName === 'ADMINISTRADOR' ||
    roleName === 'SUPERADMIN' ||
    normalizeRole(roleName) === 'administrador'

  const [solicitudes, setSolicitudes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  // Filtros de búsqueda
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroCi, setFiltroCi] = useState('')
  const [filtroDesde, setFiltroDesde] = useState('')
  const [filtroHasta, setFiltroHasta] = useState('')

  // Modales
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [solicitudToEdit, setSolicitudToEdit] = useState(null)
  const [solicitudDetalle, setSolicitudDetalle] = useState(null)
  const [modalInitialTab, setModalInitialTab] = useState('expediente')
  const [solicitudToAnular, setSolicitudToAnular] = useState(null)
  const [actaModalSolicitudId, setActaModalSolicitudId] = useState(null)

  useEffect(() => {
    let isMounted = true
    listSolicitudesCredito()
      .then((data) => {
        if (!isMounted) return
        setSolicitudes(Array.isArray(data) ? data : [])
      })
      .catch((err) => {
        if (!isMounted) return
        setError(err.response?.data?.detail || 'Error al cargar las solicitudes de crédito.')
      })
      .finally(() => {
        if (!isMounted) return
        setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  async function reloadSolicitudes(filtrosActuales = {}) {
    setLoading(true)
    setError(null)
    try {
      const params = {}
      const st = filtrosActuales.estado !== undefined ? filtrosActuales.estado : filtroEstado
      const ci = filtrosActuales.socio_ci !== undefined ? filtrosActuales.socio_ci : filtroCi
      const d = filtrosActuales.desde !== undefined ? filtrosActuales.desde : filtroDesde
      const h = filtrosActuales.hasta !== undefined ? filtrosActuales.hasta : filtroHasta

      if (st) params.estado = st
      if (ci.trim()) params.socio_ci = ci.trim()
      if (d) params.desde = d
      if (h) params.hasta = h

      const data = await listSolicitudesCredito(params)
      setSolicitudes(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al filtrar solicitudes de crédito.')
    } finally {
      setLoading(false)
    }
  }

  function handleFiltrar(e) {
    e?.preventDefault()
    reloadSolicitudes()
  }

  function handleLimpiarFiltros() {
    setFiltroEstado('')
    setFiltroCi('')
    setFiltroDesde('')
    setFiltroHasta('')
    reloadSolicitudes({ estado: '', socio_ci: '', desde: '', hasta: '' })
  }

  function handleNuevaSolicitud() {
    setSolicitudToEdit(null)
    setFormModalOpen(true)
  }

  function handleEditar(s) {
    setSolicitudToEdit(s)
    setFormModalOpen(true)
  }

  function handleAnular(s) {
    setSolicitudToAnular(s)
  }

  function handleFormSuccess() {
    setSuccessMessage(
      solicitudToEdit
        ? `Solicitud ${solicitudToEdit.numero_solicitud || ''} actualizada correctamente.`
        : 'Nueva solicitud de crédito registrada exitosamente en estado PENDIENTE.',
    )
    reloadSolicitudes()
  }

  function handleAnularSuccess() {
    setSuccessMessage('Solicitud de crédito anulada correctamente.')
    reloadSolicitudes()
  }

  // Métricas de estado de solicitudes
  const metrics = useMemo(() => {
    const total = solicitudes.length
    const pendientes = solicitudes.filter((s) => s.estado === 'PENDIENTE').length
    const enRevision = solicitudes.filter((s) => s.estado === 'OBSERVADA' || s.estado === 'EN_EVALUACION').length
    const aprobadas = solicitudes.filter((s) => s.estado === 'APROBADO' || s.estado === 'DESEMBOLSADO').length

    return { total, pendientes, enRevision, aprobadas }
  }, [solicitudes])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Solicitudes de Crédito"
        subtitle="Recepción, originación y seguimiento de solicitudes de crédito de socios (CU-W21)"
        action={
          <Button variant="primary" size="md" onClick={handleNuevaSolicitud} className="gap-2">
            <span className="material-symbols-outlined text-[18px]">post_add</span>
            <span>Nueva Solicitud</span>
          </Button>
        }
      />

      {/* ── Banners informativos ── */}
      {error && (
        <AlertBanner variant="error" onClose={() => setError(null)}>
          {error}
        </AlertBanner>
      )}

      {successMessage && (
        <AlertBanner variant="success" onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </AlertBanner>
      )}

      {/* ── Métricas del Módulo ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Solicitudes"
          value={metrics.total}
          icon="folder_shared"
          iconBg="bg-blue-50"
          iconColor="text-blue-700"
        />
        <MetricCard
          label="Pendientes de Revisión"
          value={metrics.pendientes}
          icon="hourglass_top"
          iconBg="bg-amber-50"
          iconColor="text-amber-800"
        />
        <MetricCard
          label="En Evaluación / Observadas"
          value={metrics.enRevision}
          icon="rule"
          iconBg="bg-indigo-50"
          iconColor="text-indigo-700"
        />
        <MetricCard
          label="Aprobadas / Desembolsadas"
          value={metrics.aprobadas}
          icon="verified"
          iconBg="bg-emerald-50"
          iconColor="text-[#064e3b]"
        />
      </div>

      {/* ── Barra de Filtros ── */}
      <div className="p-4 rounded-xl border border-[#e2e8f0] bg-white shadow-card">
        <form onSubmit={handleFiltrar} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-end">
          <div>
            <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">
              Estado
            </label>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="w-full h-10 px-3 text-xs border border-slate-200 rounded-lg bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#064e3b]"
            >
              <option value="">Todos los estados</option>
              <option value="PENDIENTE">PENDIENTE</option>
              <option value="OBSERVADA">OBSERVADA</option>
              <option value="EN_EVALUACION">EN EVALUACIÓN</option>
              <option value="APROBADO">APROBADO</option>
              <option value="RECHAZADO">RECHAZADO</option>
              <option value="DESEMBOLSADO">DESEMBOLSADO</option>
              <option value="ANULADA">ANULADA</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">
              CI del Socio
            </label>
            <input
              type="text"
              placeholder="Ej. 4589231"
              value={filtroCi}
              onChange={(e) => setFiltroCi(e.target.value)}
              className="w-full h-10 px-3 text-xs border border-slate-200 rounded-lg bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#064e3b]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">
              Fecha Desde
            </label>
            <input
              type="date"
              value={filtroDesde}
              onChange={(e) => setFiltroDesde(e.target.value)}
              className="w-full h-10 px-3 text-xs border border-slate-200 rounded-lg bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#064e3b]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">
              Fecha Hasta
            </label>
            <input
              type="date"
              value={filtroHasta}
              onChange={(e) => setFiltroHasta(e.target.value)}
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
              onClick={handleLimpiarFiltros}
              disabled={loading}
              title="Restablecer filtros"
            >
              <span className="material-symbols-outlined text-[16px]">refresh</span>
            </Button>
          </div>
        </form>
      </div>

      {/* ── Tabla de Solicitudes ── */}
      <div className="overflow-x-auto rounded-xl border border-[#e2e8f0] bg-white shadow-card">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#e2e8f0] bg-[#f8f9ff]">
              <th className="px-4 py-3.5 font-table-header text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                N° Solicitud / Fecha
              </th>
              <th className="px-4 py-3.5 font-table-header text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Socio Titular
              </th>
              <th className="px-4 py-3.5 font-table-header text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Producto / Destino
              </th>
              <th className="px-4 py-3.5 font-table-header text-[11px] font-semibold uppercase tracking-wider text-slate-500 text-right">
                Monto
              </th>
              <th className="px-4 py-3.5 font-table-header text-[11px] font-semibold uppercase tracking-wider text-slate-500 text-center">
                Plazo / Cuota
              </th>
              <th className="px-4 py-3.5 font-table-header text-[11px] font-semibold uppercase tracking-wider text-slate-500 text-center">
                RCI Indicador
              </th>
              <th className="px-4 py-3.5 font-table-header text-[11px] font-semibold uppercase tracking-wider text-slate-500 text-center">
                Dictamen Scoring
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
            ) : solicitudes.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center text-sm text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-[36px] text-slate-300">folder_off</span>
                    <span className="font-semibold text-slate-600">No se encontraron solicitudes de crédito</span>
                    <span className="text-xs text-slate-400">
                      {filtroEstado || filtroCi || filtroDesde || filtroHasta
                        ? 'Ajuste los filtros de búsqueda para visualizar resultados.'
                        : 'Registre una nueva solicitud de crédito para iniciar la originación.'}
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              solicitudes.map((s) => {
                const sim = (typeof s.moneda === 'object' ? s.moneda?.simbolo : 'Bs.') || 'Bs.'
                const esEditable = s.estado === 'PENDIENTE' || s.estado === 'OBSERVADA'
                const numero = s.numero_solicitud || `SOL-#${s.id}`

                return (
                  <tr key={s.id} className="transition-colors hover:bg-slate-50/80">
                    {/* Número y Fecha */}
                    <td className="px-4 py-3.5 text-xs">
                      <span className="font-mono font-bold text-slate-900 block">{numero}</span>
                      <span className="text-[11px] text-slate-400 block">{formatDate(s.fecha_solicitud)}</span>
                    </td>

                    {/* Socio */}
                    <td className="px-4 py-3.5 text-xs">
                      <span className="font-bold text-slate-900 block">{s.socio?.nombre_completo || '—'}</span>
                      <span className="font-mono text-[11px] text-slate-500">CI: {s.socio?.ci || '—'}</span>
                    </td>

                    {/* Producto y Destino */}
                    <td className="px-4 py-3.5 text-xs max-w-[200px]">
                      <span className="font-semibold text-slate-800 block truncate" title={s.producto?.nombre}>
                        {s.producto ? s.producto.nombre : 'Legacy (Sin producto)'}
                      </span>
                      <span className="text-[11px] text-slate-500 block truncate" title={s.destino}>
                        {s.destino || 'Destino general'}
                      </span>
                    </td>

                    {/* Monto */}
                    <td className="px-4 py-3.5 text-xs text-right font-display font-bold text-slate-900 tabular-nums">
                      {formatMoney(s.monto, sim)}
                    </td>

                    {/* Plazo y Cuota */}
                    <td className="px-4 py-3.5 text-xs text-center font-medium text-slate-700">
                      <span className="font-bold text-slate-900 block">{s.plazo_meses} m</span>
                      <span className="text-[11px] text-slate-500 tabular-nums block font-mono">
                        {s.cuota_estimada ? formatMoney(s.cuota_estimada, sim) : '—'}
                      </span>
                    </td>

                    {/* RCI Indicador */}
                    <td className="px-4 py-3.5 text-xs text-center">
                      {s.relacion_cuota_ingreso != null ? (
                        <div className="inline-flex flex-col items-center">
                          <span className={`font-mono font-bold ${
                            s.supera_relacion_maxima ? 'text-amber-700' : 'text-slate-800'
                          }`}>
                            {Number(s.relacion_cuota_ingreso).toFixed(1)}%
                          </span>
                          {s.supera_relacion_maxima ? (
                            <Badge variant="amber">Alerta RCI</Badge>
                          ) : (
                            <Badge variant="green">Conforme</Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                    </td>

                    {/* Dictamen Scoring (F2) */}
                    <td className="px-4 py-3.5 text-xs text-center">
                      {s.ultima_evaluacion ? (
                        <div className="inline-flex flex-col items-center gap-0.5">
                          <Badge variant={getDictamenBadgeVariant(s.ultima_evaluacion.dictamen)}>
                            {s.ultima_evaluacion.dictamen}
                          </Badge>
                          <span className="font-mono text-[10px] font-bold text-slate-600">
                            {s.ultima_evaluacion.score}/1000 pts
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Sin evaluar</span>
                      )}
                    </td>

                    {/* Estado */}
                    <td className="px-4 py-3.5 text-xs text-center">
                      <div className="inline-flex flex-col items-center gap-0.5">
                        <Badge variant={getEstadoBadgeVariant(s.estado)}>
                          {s.estado}
                        </Badge>
                        {s.resultado_comite && (
                          <span
                            className="text-[10px] text-purple-700 font-semibold"
                            title={`Resultado de resolución en comité de crédito (Ronda ${s.ronda_comite || 1})`}
                          >
                            Comité: {s.resultado_comite}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Acciones */}
                    <td className="px-4 py-3.5 text-xs text-center">
                      <div className="flex items-center justify-center gap-1">
                        {/* Botón Resolver para Administrador en solicitudes EN_EVALUACION con REVISION_MANUAL */}
                        {isAdmin &&
                          s.estado === 'EN_EVALUACION' &&
                          s.ultima_evaluacion?.dictamen === 'REVISION_MANUAL' && (
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                setModalInitialTab('scoring')
                                setSolicitudDetalle(s)
                              }}
                              className="gap-1 !text-xs !py-1 !px-2 bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100"
                              title="Resolver revisión manual como Administrador"
                            >
                              <span className="material-symbols-outlined text-[15px] text-amber-700">gavel</span>
                              <span>Resolver</span>
                            </Button>
                          )}

                        {/* Botón Ver Acta de Comité */}
                        {(s.ronda_comite > 0 || s.resultado_comite || s.estado === 'EN_COMITE') && (
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => setActaModalSolicitudId(s.id)}
                            className="gap-1 !text-xs !py-1 !px-2 text-purple-800 border-purple-200 hover:bg-purple-50"
                            title="Ver Acta de Comité"
                          >
                            <span className="material-symbols-outlined text-[15px]">receipt_long</span>
                          </Button>
                        )}

                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setModalInitialTab('expediente')
                            setSolicitudDetalle(s)
                          }}
                          className="gap-1 !text-xs !py-1 !px-2"
                          title="Ver expediente e imprimir"
                        >
                          <span className="material-symbols-outlined text-[15px]">visibility</span>
                          <span>Ver</span>
                        </Button>

                        {esEditable && (
                          <>
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => handleEditar(s)}
                              className="gap-1 !text-xs !py-1 !px-2"
                              title="Editar condiciones de la solicitud"
                            >
                              <span className="material-symbols-outlined text-[15px]">edit</span>
                            </Button>

                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => handleAnular(s)}
                              className="gap-1 !text-xs !py-1 !px-2 text-rose-700 hover:bg-rose-50 hover:text-rose-900 hover:border-rose-300"
                              title="Anular solicitud con motivo justificado"
                            >
                              <span className="material-symbols-outlined text-[15px]">cancel</span>
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Modal de Creación / Edición de Solicitud (CU-W21) ── */}
      {formModalOpen && (
        <SolicitudModal
          open={formModalOpen}
          solicitud={solicitudToEdit}
          onClose={() => {
            setFormModalOpen(false)
            setSolicitudToEdit(null)
          }}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* ── Modal de Detalle, Scoring e Impresión ── */}
      {solicitudDetalle && (
        <DetalleSolicitudModal
          open={Boolean(solicitudDetalle)}
          solicitud={solicitudDetalle}
          initialTab={modalInitialTab}
          onClose={() => setSolicitudDetalle(null)}
          onEditar={(s) => {
            setSolicitudDetalle(null)
            handleEditar(s)
          }}
          onAnular={(s) => {
            setSolicitudDetalle(null)
            handleAnular(s)
          }}
          onUpdated={(updatedSol) => {
            reloadSolicitudes()
            setSolicitudDetalle(updatedSol)
          }}
        />
      )}

      {/* ── Modal de Anulación Formal ── */}
      {solicitudToAnular && (
        <AnularSolicitudModal
          open={Boolean(solicitudToAnular)}
          solicitud={solicitudToAnular}
          onClose={() => setSolicitudToAnular(null)}
          onSuccess={handleAnularSuccess}
        />
      )}

      {/* ── Modal de Acta Oficial de Comité (CU-W25) ── */}
      {actaModalSolicitudId && (
        <ActaComiteModal
          open={Boolean(actaModalSolicitudId)}
          onClose={() => setActaModalSolicitudId(null)}
          solicitudId={actaModalSolicitudId}
        />
      )}
    </div>
  )
}
