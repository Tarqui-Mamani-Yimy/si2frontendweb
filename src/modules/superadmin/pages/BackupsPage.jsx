import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import * as backupsApi from '../../../core/api/backupsApi'
import AlertBanner from '../../../components/ui/AlertBanner'
import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import Card from '../../../components/ui/Card'
import Modal from '../../../components/ui/Modal'
import PageHeader from '../../../components/ui/PageHeader'
import Skeleton from '../../../components/ui/Skeleton'

/**
 * Format bytes into human-readable size (KB, MB, GB).
 * @param {number|null} bytes
 * @returns {string}
 */
function formatBytes(bytes) {
  if (bytes === null || bytes === undefined || isNaN(bytes)) return '—'
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const formatted = parseFloat((bytes / Math.pow(k, i)).toFixed(2))
  return `${formatted} ${sizes[i]}`
}

/**
 * Format date time to localized Bolivian format.
 * @param {string|null} value
 * @returns {string}
 */
function formatDateTime(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (isNaN(date.getTime())) return '—'
  return date.toLocaleString('es-BO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

/**
 * Calculate human-readable duration between start and end.
 * @param {string|null} start
 * @param {string|null} end
 * @param {string} estado
 * @returns {string}
 */
function formatDuration(start, end, estado) {
  if (!start) return '—'
  if (estado === 'EN_PROCESO' && !end) return 'En curso…'
  if (!end) return '—'

  const startTime = new Date(start).getTime()
  const endTime = new Date(end).getTime()
  if (isNaN(startTime) || isNaN(endTime) || endTime < startTime) return '—'

  const totalSeconds = Math.floor((endTime - startTime) / 1000)
  if (totalSeconds < 60) {
    return `${totalSeconds} s`
  }
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  if (minutes < 60) {
    return `${minutes}m ${seconds}s`
  }
  const hours = Math.floor(minutes / 60)
  const remMinutes = minutes % 60
  return `${hours}h ${remMinutes}m`
}

/**
 * SuperAdmin Backups management page.
 */
export default function BackupsPage() {
  const [backups, setBackups] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [errorBanner, setErrorBanner] = useState(null)
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [downloadingId, setDownloadingId] = useState(null)
  const [expandedRows, setExpandedRows] = useState(() => new Set())

  // Determine whether any backup is currently in progress
  const hasInProcess = useMemo(
    () => backups.some((b) => b.estado === 'EN_PROCESO'),
    [backups],
  )

  // Fetch backups from API
  const fetchBackups = useCallback(
    async (isSilent = false) => {
      if (!isSilent) setRefreshing(true)
      try {
        const data = await backupsApi.listBackups({
          tipo: filtroTipo || undefined,
          estado: filtroEstado || undefined,
        })
        setBackups(Array.isArray(data) ? data : [])
      } catch (err) {
        if (!isSilent) {
          setErrorBanner(
            err.response?.data?.detail ?? err.message ?? 'Error al cargar respaldos.',
          )
        }
      } finally {
        if (!isSilent) {
          setLoading(false)
          setRefreshing(false)
        }
      }
    },
    [filtroTipo, filtroEstado],
  )

  // Initial and filter change load
  useEffect(() => {
    let ignore = false

    async function load() {
      try {
        const data = await backupsApi.listBackups({
          tipo: filtroTipo || undefined,
          estado: filtroEstado || undefined,
        })
        if (!ignore) {
          setBackups(Array.isArray(data) ? data : [])
        }
      } catch (err) {
        if (!ignore) {
          setErrorBanner(
            err.response?.data?.detail ?? err.message ?? 'Error al cargar respaldos.',
          )
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      ignore = true
    }
  }, [filtroTipo, filtroEstado])

  // Auto-refresh interval every 5 seconds while a backup is in progress
  useEffect(() => {
    if (!hasInProcess) return

    const intervalId = setInterval(() => {
      fetchBackups(true)
    }, 5000)

    return () => {
      clearInterval(intervalId)
    }
  }, [hasInProcess, fetchBackups])

  // Trigger manual backup
  async function handleCreateBackup() {
    setCreating(true)
    setErrorBanner(null)
    try {
      await backupsApi.createBackup()
      setConfirmModalOpen(false)
      await fetchBackups(false)
    } catch (err) {
      setConfirmModalOpen(false)
      if (err.response?.status === 409) {
        setErrorBanner('Ya hay un respaldo en proceso.')
      } else {
        setErrorBanner(
          err.response?.data?.detail ?? err.message ?? 'Error al iniciar el respaldo.',
        )
      }
    } finally {
      setCreating(false)
    }
  }

  // Request temporary download URL and open it
  async function handleDownload(id) {
    setDownloadingId(id)
    setErrorBanner(null)
    try {
      const data = await backupsApi.getBackupDownload(id)
      if (data?.url) {
        window.open(data.url, '_blank', 'noopener,noreferrer')
      } else {
        setErrorBanner('No se recibió la URL de descarga.')
      }
    } catch (err) {
      if (err.response?.status === 409) {
        setErrorBanner('El respaldo aún no ha finalizado.')
      } else if (err.response?.status === 503) {
        setErrorBanner('El servicio de almacenamiento no está disponible.')
      } else {
        setErrorBanner(
          err.response?.data?.detail ?? err.message ?? 'Error al solicitar enlace de descarga.',
        )
      }
    } finally {
      setDownloadingId(null)
    }
  }

  // Toggle expandable error row
  function toggleRowExpansion(id) {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Copias de Seguridad"
        subtitle="Monitoreo, generación y descarga de respaldos de la plataforma"
        action={
          <Button
            variant="primary"
            size="md"
            type="button"
            disabled={hasInProcess || creating}
            onClick={() => {
              setErrorBanner(null)
              setConfirmModalOpen(true)
            }}
            title={hasInProcess ? 'Hay un respaldo en proceso actualmente' : 'Crear un nuevo respaldo'}
          >
            <span className="material-symbols-outlined text-[18px]">backup</span>
            Crear backup ahora
          </Button>
        }
      />

      {/* Informational banner when backup is in progress */}
      {hasInProcess && (
        <AlertBanner variant="info">
          Hay un respaldo en ejecución actualmente. La tabla se actualiza automáticamente cada 5 segundos.
        </AlertBanner>
      )}

      {/* Error banner */}
      {errorBanner && (
        <AlertBanner variant="error" onClose={() => setErrorBanner(null)}>
          {errorBanner}
        </AlertBanner>
      )}

      <Card>
        {/* Filter toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-4">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label htmlFor="filtro-tipo" className="sr-only">Tipo</label>
              <select
                id="filtro-tipo"
                value={filtroTipo}
                onChange={(e) => {
                  setFiltroTipo(e.target.value)
                  setLoading(true)
                }}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
              >
                <option value="">Todos los tipos</option>
                <option value="MANUAL">Manual</option>
                <option value="AUTOMATICO">Automático</option>
              </select>
            </div>

            <div>
              <label htmlFor="filtro-estado" className="sr-only">Estado</label>
              <select
                id="filtro-estado"
                value={filtroEstado}
                onChange={(e) => {
                  setFiltroEstado(e.target.value)
                  setLoading(true)
                }}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
              >
                <option value="">Todos los estados</option>
                <option value="EN_PROCESO">En proceso</option>
                <option value="COMPLETADO">Completado</option>
                <option value="FALLIDO">Fallido</option>
              </select>
            </div>

            {(filtroTipo || filtroEstado) && (
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => {
                  setFiltroTipo('')
                  setFiltroEstado('')
                  setLoading(true)
                }}
                className="text-xs text-slate-500 hover:text-slate-800"
              >
                Limpiar filtros
              </Button>
            )}
          </div>

          <Button
            variant="secondary"
            size="sm"
            type="button"
            onClick={() => fetchBackups(false)}
            disabled={refreshing}
            title="Actualizar lista"
            aria-label="Actualizar lista"
          >
            <span className={`material-symbols-outlined text-[18px] ${refreshing ? 'animate-spin' : ''}`}>
              refresh
            </span>
          </Button>
        </div>

        {/* Table content */}
        {loading ? (
          <div className="space-y-2 p-6">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-11" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#e2e8f0] bg-[#f8f9ff]">
                  <th className="px-5 py-3.5 font-table-header text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    ID
                  </th>
                  <th className="px-5 py-3.5 font-table-header text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Tipo
                  </th>
                  <th className="px-5 py-3.5 font-table-header text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Estado
                  </th>
                  <th className="px-5 py-3.5 font-table-header text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Tamaño
                  </th>
                  <th className="px-5 py-3.5 font-table-header text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Iniciado
                  </th>
                  <th className="px-5 py-3.5 font-table-header text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Finalizado
                  </th>
                  <th className="px-5 py-3.5 font-table-header text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Duración
                  </th>
                  <th className="px-5 py-3.5 font-table-header text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Usuario
                  </th>
                  <th className="px-5 py-3.5 font-table-header text-[11px] font-semibold uppercase tracking-wider text-slate-500 text-right">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0]/80">
                {backups.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-sm text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-1.5">
                        <span className="material-symbols-outlined text-[28px] text-slate-300">
                          inbox
                        </span>
                        <span>
                          {filtroTipo || filtroEstado
                            ? 'No hay respaldos que coincidan con los filtros.'
                            : 'No hay registros de copias de seguridad.'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  backups.map((backup) => {
                    const isExpanded = expandedRows.has(backup.id)
                    const isFailed = backup.estado === 'FALLIDO'
                    const isCompleted = backup.estado === 'COMPLETADO'
                    const isInProgress = backup.estado === 'EN_PROCESO'

                    return (
                      <Fragment key={backup.id}>
                        <tr className="h-[52px] transition-colors hover:bg-slate-50/80">
                          <td className="px-5 py-3 text-sm font-mono text-slate-500">
                            #{backup.id}
                          </td>
                          <td className="px-5 py-3 text-sm">
                            {backup.tipo === 'MANUAL' ? (
                              <Badge variant="purple">Manual</Badge>
                            ) : (
                              <Badge variant="slate">Automático</Badge>
                            )}
                          </td>
                          <td className="px-5 py-3 text-sm">
                            {isInProgress && (
                              <Badge variant="amber" className="animate-pulse">
                                En proceso
                              </Badge>
                            )}
                            {isCompleted && (
                              <Badge variant="green">Completado</Badge>
                            )}
                            {isFailed && (
                              <Badge
                                variant="red"
                                title={backup.error ?? 'Fallo en la ejecución del respaldo'}
                              >
                                Fallido
                              </Badge>
                            )}
                          </td>
                          <td className="px-5 py-3 text-sm text-[#0b1c30]">
                            {formatBytes(backup.tamano_bytes)}
                          </td>
                          <td className="px-5 py-3 text-sm text-slate-600 whitespace-nowrap">
                            {formatDateTime(backup.iniciado_en)}
                          </td>
                          <td className="px-5 py-3 text-sm text-slate-600 whitespace-nowrap">
                            {formatDateTime(backup.finalizado_en)}
                          </td>
                          <td className="px-5 py-3 text-sm text-slate-600">
                            {formatDuration(backup.iniciado_en, backup.finalizado_en, backup.estado)}
                          </td>
                          <td className="px-5 py-3 text-sm text-slate-700">
                            {backup.usuario_nombre || 'Sistema'}
                          </td>
                          <td className="px-5 py-3 text-sm text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                              {isCompleted && (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  type="button"
                                  loading={downloadingId === backup.id}
                                  onClick={() => handleDownload(backup.id)}
                                  title="Descargar copia de seguridad"
                                >
                                  <span className="material-symbols-outlined text-[16px]">
                                    download
                                  </span>
                                  Descargar
                                </Button>
                              )}
                              {isFailed && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  type="button"
                                  onClick={() => toggleRowExpansion(backup.id)}
                                  className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                  title={isExpanded ? 'Ocultar detalle de error' : 'Ver detalle de error'}
                                >
                                  <span className="material-symbols-outlined text-[16px]">
                                    {isExpanded ? 'expand_less' : 'expand_more'}
                                  </span>
                                  {isExpanded ? 'Ocultar error' : 'Ver error'}
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* Expandable row for error details */}
                        {isFailed && isExpanded && (
                          <tr className="bg-red-50/40 border-b border-red-100">
                            <td colSpan={9} className="px-6 py-4">
                              <div className="rounded-xl border border-red-200/80 bg-white p-4 shadow-xs space-y-2">
                                <div className="flex items-center gap-2 text-xs font-semibold text-red-800">
                                  <span className="material-symbols-outlined text-[18px] text-red-600">
                                    error
                                  </span>
                                  <span>Detalle del error (Respaldo #{backup.id})</span>
                                </div>
                                <pre className="font-mono text-xs text-red-700 bg-red-50/70 p-3 rounded-lg border border-red-100 whitespace-pre-wrap break-all max-h-48 overflow-y-auto">
                                  {backup.error || 'No se registró detalle del error.'}
                                </pre>
                                {backup.archivo && (
                                  <p className="text-xs text-slate-500">
                                    <span className="font-medium text-slate-700">Archivo:</span> {backup.archivo}
                                  </p>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Confirmation modal for manual backup */}
      <Modal
        open={confirmModalOpen}
        onClose={() => {
          if (!creating) setConfirmModalOpen(false)
        }}
        title="Crear copia de seguridad"
        subtitle="Confirmación de respaldo manual"
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              type="button"
              disabled={creating}
              onClick={() => setConfirmModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="button"
              loading={creating}
              onClick={handleCreateBackup}
            >
              Confirmar y crear
            </Button>
          </>
        }
      >
        <div className="space-y-3 py-2 text-sm text-slate-600">
          <p>
            ¿Está seguro de que desea crear un respaldo ahora?
          </p>
          <p className="text-xs text-slate-500 leading-relaxed">
            Se iniciará la generación de una copia de seguridad en segundo plano. Mientras el proceso esté en ejecución, no se podrán solicitar respaldos simultáneos.
          </p>
        </div>
      </Modal>
    </div>
  )
}
