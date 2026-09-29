import { useState, useEffect } from 'react'
import Modal from '../../../../components/ui/Modal'
import Button from '../../../../components/ui/Button'
import Badge from '../../../../components/ui/Badge'
import Skeleton from '../../../../components/ui/Skeleton'
import AlertBanner from '../../../../components/ui/AlertBanner'
import { getReporteDetalle, exportReporteCsv } from '../../../../core/api/informesAsfiApi'
import { getApiErrorMessage } from '../../../../core/api/errors'
import { formatDate, triggerCsvDownload } from '../contabilidadUtils'
import { getReporteTipoLabel, getReporteEstadoBadge } from './informesAsfiUtils'

/**
 * Modal to view stored report snapshot and SHA-256 integrity details (CU-W34).
 */
export default function SnapshotDetalleModal({ open, onClose, reporteId }) {
  const [reporte, setReporte] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    if (!open || !reporteId) return
    let isMounted = true

    getReporteDetalle(reporteId)
      .then((res) => {
        if (!isMounted) return
        setReporte(res)
      })
      .catch((err) => {
        if (!isMounted) return
        setError(getApiErrorMessage(err, 'Error al recuperar el snapshot del reporte.'))
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [open, reporteId])

  async function handleDownloadCsv() {
    if (!reporteId) return
    setExporting(true)
    try {
      const response = await exportReporteCsv(reporteId)
      const defaultFilename = `snapshot-reporte-${reporteId}.csv`
      triggerCsvDownload(
        response.data,
        defaultFilename,
        response.headers?.['content-disposition'],
      )
    } catch (err) {
      setError(getApiErrorMessage(err, 'Error al descargar el archivo CSV del snapshot.'))
    } finally {
      setExporting(false)
    }
  }

  const estadoBadge = getReporteEstadoBadge(reporte?.estado)
  const esIntegro = reporte?.integridad_ok !== false

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={reporte ? `Snapshot: ${getReporteTipoLabel(reporte.tipo)}` : 'Detalle del Reporte'}
      subtitle={`Identificador de Registro: #${reporteId || '—'}`}
      footer={
        <div className="flex w-full items-center justify-between">
          <Button variant="secondary" size="sm" type="button" onClick={onClose}>
            Cerrar
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="button"
            icon="download"
            loading={exporting}
            onClick={handleDownloadCsv}
          >
            Descargar CSV
          </Button>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        {error && (
          <AlertBanner variant="error" onClose={() => setError(null)}>
            {error}
          </AlertBanner>
        )}

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
        ) : reporte ? (
          <>
            {/* Metadatos e Integridad */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Periodo / Corte</span>
                <span className="font-mono font-bold text-slate-800">{formatDate(reporte.periodo)}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Fecha Generación</span>
                <span className="font-mono text-slate-700">{formatDate(reporte.fecha_generacion)}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Estado Histórico</span>
                <Badge variant={estadoBadge.variant}>{estadoBadge.label}</Badge>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Verificación Hash</span>
                <Badge variant={esIntegro ? 'green' : 'red'}>
                  {esIntegro ? 'Íntegro (SHA-256)' : 'Alterado / Inválido'}
                </Badge>
              </div>
            </div>

            {/* Hash Criptográfico Completo */}
            {reporte.hash_contenido && (
              <div className="p-3 bg-slate-900 rounded-lg text-emerald-400 font-mono text-[11px] break-all space-y-1">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-sans">
                  Firma Criptográfica SHA-256 (Canonical Snapshot)
                </span>
                <span>{reporte.hash_contenido}</span>
              </div>
            )}

            {/* Resumen o Contenido */}
            {reporte.resumen && (
              <div className="p-3.5 bg-white rounded-lg border border-slate-200 space-y-2">
                <span className="font-bold text-slate-800 block text-xs">
                  Resumen de Indicadores Clave del Snapshot
                </span>
                <div className="grid grid-cols-2 gap-2 text-slate-600 font-mono">
                  {Object.entries(reporte.resumen).map(([k, v]) => (
                    <div key={k} className="flex justify-between border-b border-slate-100 py-0.5">
                      <span className="capitalize">{k.replace(/_/g, ' ')}:</span>
                      <span className="font-bold text-slate-900">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Vista JSON del Contenido */}
            <div className="space-y-1">
              <span className="font-bold text-slate-700 text-xs block">
                Inspección de Contenido JSON Almacenado
              </span>
              <pre className="max-h-60 overflow-y-auto bg-slate-50 border border-slate-200 rounded-lg p-3 font-mono text-[11px] text-slate-800">
                {JSON.stringify(reporte.contenido ?? reporte.resumen ?? reporte, null, 2)}
              </pre>
            </div>
          </>
        ) : (
          <p className="text-center py-6 text-slate-400">No se encontraron datos del reporte.</p>
        )}
      </div>
    </Modal>
  )
}
