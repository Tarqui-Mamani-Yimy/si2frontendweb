import { useState, useEffect, useRef } from 'react'
import { getReportesHistorial, exportReporteCsv } from '../../../../core/api/informesAsfiApi'
import { getApiErrorMessage } from '../../../../core/api/errors'
import { formatDate, triggerCsvDownload } from '../contabilidadUtils'
import { getReporteTipoLabel, getReporteEstadoBadge, formatHash } from './informesAsfiUtils'
import Button from '../../../../components/ui/Button'
import Badge from '../../../../components/ui/Badge'
import Skeleton from '../../../../components/ui/Skeleton'
import AlertBanner from '../../../../components/ui/AlertBanner'
import SnapshotDetalleModal from './SnapshotDetalleModal'

/**
 * Tab: Historial de Informes Normativos Generados (CU-W34).
 * Presenta snapshots inmutables con verificación SHA-256 y descarga CSV.
 */
export default function HistorialTab({ refreshTrigger, onGenerarClick }) {
  const [reportes, setReportes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [tipoFiltro, setTipoFiltro] = useState('')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [exportingId, setExportingId] = useState(null)
  const [selectedReporteId, setSelectedReporteId] = useState(null)
  const requestIdRef = useRef(0)

  useEffect(() => {
    let isMounted = true
    const reqId = ++requestIdRef.current

    const params = {}
    if (tipoFiltro) params.tipo = tipoFiltro
    if (desde) params.desde = desde
    if (hasta) params.hasta = hasta

    getReportesHistorial(params)
      .then((res) => {
        if (!isMounted || reqId !== requestIdRef.current) return
        setError(null)
        setReportes(Array.isArray(res) ? res : [])
      })
      .catch((err) => {
        if (!isMounted || reqId !== requestIdRef.current) return
        setError(getApiErrorMessage(err, 'Error al cargar el historial de informes generados.'))
      })
      .finally(() => {
        if (isMounted && reqId === requestIdRef.current) {
          setLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [tipoFiltro, desde, hasta, refreshTrigger])

  async function handleDownloadCsv(id) {
    setExportingId(id)
    try {
      const response = await exportReporteCsv(id)
      const defaultFilename = `informe-asfi-${id}.csv`
      triggerCsvDownload(
        response.data,
        defaultFilename,
        response.headers?.['content-disposition'],
      )
    } catch (err) {
      setError(getApiErrorMessage(err, 'Error al exportar el snapshot a CSV.'))
    } finally {
      setExportingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <AlertBanner variant="error" onClose={() => setError(null)}>
          {error}
        </AlertBanner>
      )}

      {/* Filter and Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-card">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div>
            <select
              value={tipoFiltro}
              onChange={(e) => setTipoFiltro(e.target.value)}
              className="h-8 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs text-slate-800 outline-none focus:border-[#006c49]"
            >
              <option value="">Todos los Tipos</option>
              <option value="CALIFICACION_CARTERA">Calificación de Cartera</option>
              <option value="ESTADOS_FINANCIEROS">Estados Financieros</option>
              <option value="CARTERA_DEUDORES">Cartera de Deudores</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Desde:</span>
            <input
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              className="h-8 rounded-lg border border-slate-200 bg-slate-50 px-2 text-xs text-slate-800 outline-none focus:border-[#006c49]"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Hasta:</span>
            <input
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              className="h-8 rounded-lg border border-slate-200 bg-slate-50 px-2 text-xs text-slate-800 outline-none focus:border-[#006c49]"
            />
          </div>

          {(tipoFiltro || desde || hasta) && (
            <button
              type="button"
              onClick={() => {
                setTipoFiltro('')
                setDesde('')
                setHasta('')
              }}
              className="text-xs text-slate-500 hover:text-slate-800 underline ml-1"
            >
              Limpiar
            </button>
          )}
        </div>

        <div>
          <Button
            variant="primary"
            size="sm"
            icon="add_circle"
            onClick={onGenerarClick}
          >
            Generar Nuevo Informe
          </Button>
        </div>
      </div>

      {/* History Table */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-card space-y-4">
        <div className="flex items-center justify-between border-b pb-3 border-slate-100">
          <div>
            <h3 className="font-bold text-sm text-slate-900">
              Registro Histórico de Snapshots Oficiales
            </h3>
            <p className="text-xs text-slate-500">
              Historial de informes generados con integridad criptográfica verificada
            </p>
          </div>
          <Badge variant="teal">{reportes.length} Registros</Badge>
        </div>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">ID</th>
                  <th className="py-2.5 px-3">Tipo de Informe</th>
                  <th className="py-2.5 px-3">Periodo (Corte)</th>
                  <th className="py-2.5 px-3">Fecha Generación</th>
                  <th className="py-2.5 px-3 text-center">Estado</th>
                  <th className="py-2.5 px-3 text-center">Integridad SHA-256</th>
                  <th className="py-2.5 px-3">Hash Snapshot</th>
                  <th className="py-2.5 px-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {reportes.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-400">
                      No se encontraron informes generados en el historial.
                    </td>
                  </tr>
                ) : (
                  reportes.map((rep) => {
                    const estadoBadge = getReporteEstadoBadge(rep.estado)
                    const esIntegro = rep.integridad_ok !== false

                    return (
                      <tr key={rep.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-500">
                          #{rep.id}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">
                          {getReporteTipoLabel(rep.tipo)}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-800">
                          {formatDate(rep.periodo)}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">
                          {formatDate(rep.fecha_generacion)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <Badge variant={estadoBadge.variant}>{estadoBadge.label}</Badge>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <Badge variant={esIntegro ? 'green' : 'red'}>
                            {esIntegro ? 'Íntegro' : 'Hash Inválido'}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-500" title={rep.hash_contenido}>
                          {formatHash(rep.hash_contenido)}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedReporteId(rep.id)}
                              className="px-2 py-1 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium text-[11px] transition"
                            >
                              Ver Snapshot
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDownloadCsv(rep.id)}
                              disabled={exportingId === rep.id}
                              className="px-2 py-1 rounded bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-medium text-[11px] transition flex items-center gap-1 border border-emerald-200"
                            >
                              <span className="material-symbols-outlined text-[14px]">download</span>
                              <span>{exportingId === rep.id ? 'Descargando...' : 'CSV'}</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Snapshot Detail Modal */}
      {selectedReporteId && (
        <SnapshotDetalleModal
          open={Boolean(selectedReporteId)}
          onClose={() => setSelectedReporteId(null)}
          reporteId={selectedReporteId}
        />
      )}
    </div>
  )
}
