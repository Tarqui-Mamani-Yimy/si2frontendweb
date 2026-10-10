import { useState } from 'react'
import Modal from '../../../../components/ui/Modal'
import Button from '../../../../components/ui/Button'
import AlertBanner from '../../../../components/ui/AlertBanner'
import Badge from '../../../../components/ui/Badge'
import { cambiarEstadoProductoCredito } from '../../../../core/api/creditosApi'

/**
 * ConfirmarEstadoModal — Confirmación de activación o desactivación de producto crediticio (CU-W20).
 *
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   producto: object|null,
 *   onSuccess: () => void
 * }} props
 */
export default function ConfirmarEstadoModal({
  open,
  onClose,
  producto,
  onSuccess,
}) {
  const [submitting, setSubmitting] = useState(false)
  const [apiError, setApiError] = useState(null)

  if (!open || !producto) return null

  const esActivo = producto.estado === 'ACTIVO'
  const nuevoEstado = esActivo ? 'INACTIVO' : 'ACTIVO'

  async function handleConfirm() {
    setSubmitting(true)
    setApiError(null)

    try {
      await cambiarEstadoProductoCredito(producto.id, nuevoEstado)
      onSuccess?.()
      onClose()
    } catch (err) {
      const detail = err.response?.data?.detail
      setApiError(detail || `Error al ${esActivo ? 'desactivar' : 'activar'} el producto.`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={esActivo ? 'Desactivar Producto Crediticio' : 'Activar Producto Crediticio'}
      subtitle={`Operación sobre catálogo de créditos (${producto.codigo})`}
      footer={
        <div className="flex w-full items-center justify-between">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button
            variant={esActivo ? 'danger' : 'primary'}
            size="sm"
            onClick={handleConfirm}
            loading={submitting}
          >
            {esActivo ? 'Sí, Desactivar Producto' : 'Sí, Activar Producto'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        {apiError && (
          <AlertBanner variant="error" onClose={() => setApiError(null)}>
            {apiError}
          </AlertBanner>
        )}

        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-mono font-bold text-sm text-slate-900">{producto.codigo}</span>
            <Badge variant={esActivo ? 'green' : 'slate'}>{producto.estado}</Badge>
          </div>
          <p className="font-semibold text-slate-800 text-sm">{producto.nombre}</p>
          {producto.descripcion && (
            <p className="text-slate-500 text-xs">{producto.descripcion}</p>
          )}
        </div>

        <div className={`p-3.5 rounded-lg border text-xs leading-relaxed ${
          esActivo
            ? 'bg-amber-50/60 border-amber-200 text-amber-900'
            : 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
        }`}>
          {esActivo ? (
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined text-[18px] text-amber-700 shrink-0">warning</span>
              <p>
                Al <strong>desactivar</strong> este producto, no estará disponible para nuevas solicitudes de crédito ni para simulación en ventanilla o campo. Los préstamos y solicitudes ya existentes <strong>mantendrán sus condiciones vigentes sin alteración</strong>.
              </p>
            </div>
          ) : (
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined text-[18px] text-emerald-700 shrink-0">check_circle</span>
              <p>
                Al <strong>activar</strong> este producto, los oficiales de crédito y asesores podrán seleccionarlo inmediatamente en el catálogo oficial para registrar nuevas solicitudes y evaluaciones crediticias.
              </p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
