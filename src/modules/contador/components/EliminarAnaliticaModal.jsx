import { useState } from 'react'
import Modal from '../../../components/ui/Modal'
import Button from '../../../components/ui/Button'
import AlertBanner from '../../../components/ui/AlertBanner'
import { deleteCuentaAnalitica } from '../../../core/api/contabilidadApi'
import { getApiErrorMessage } from '../../../core/api/errors'

/**
 * EliminarAnaliticaModal — Modal de confirmación para eliminar cuenta analítica sin movimientos (CU-W29).
 *
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   account: object | null,
 *   onSuccess: (deletedId: number|string) => void
 * }} props
 */
export default function EliminarAnaliticaModal({
  open,
  onClose,
  account,
  onSuccess,
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  if (!open || !account) return null

  const movimientosCount = Number(account.movimientos ?? 0)
  const hasMovements = movimientosCount > 0

  async function handleConfirmDelete() {
    setError(null)
    setLoading(true)
    try {
      await deleteCuentaAnalitica(account.id)
      onSuccess(account.id)
      onClose()
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          'Error al eliminar la cuenta analítica. Verifique que no contenga movimientos.',
        ),
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Eliminar Cuenta Analítica"
      subtitle={`Confirmación de baja definitiva para ${account.codigo}`}
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          {!hasMovements && (
            <Button
              type="button"
              variant="danger"
              size="sm"
              loading={loading}
              onClick={handleConfirmDelete}
              className="!bg-red-600 hover:!bg-red-700"
            >
              Sí, Eliminar Cuenta
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        {error && (
          <AlertBanner variant="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </AlertBanner>
        )}

        {hasMovements ? (
          <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-950 text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-red-700">
              <span className="material-symbols-outlined text-[18px]">block</span>
              <span>Operación no permitida</span>
            </div>
            <p>
              Esta cuenta analítica registra <strong>{movimientosCount}</strong> movimientos contables en los libros de la cooperativa. Por integridad fiduciaria y normativa ASFI, no puede eliminarse del sistema.
            </p>
            <p className="text-[11px] text-red-800">
              Sugerencia: Si ya no se utilizará, utilice la opción de <strong>Desactivar</strong>.
            </p>
          </div>
        ) : (
          <div className="space-y-3 text-xs text-slate-700">
            <p>
              ¿Está seguro de que desea eliminar la cuenta analítica{' '}
              <strong className="font-mono text-slate-900">{account.codigo}</strong> (
              <strong>{account.nombre}</strong>)?
            </p>
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-2">
              <span className="material-symbols-outlined text-amber-700 text-[18px] shrink-0 mt-0.5">
                warning
              </span>
              <span>
                Esta acción es irreversible y eliminará el registro del plan de cuentas de la cooperativa.
              </span>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
