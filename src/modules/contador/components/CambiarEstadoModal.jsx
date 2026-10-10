import { useState } from 'react'
import Modal from '../../../components/ui/Modal'
import Button from '../../../components/ui/Button'
import AlertBanner from '../../../components/ui/AlertBanner'
import { FormField, Textarea } from '../../../components/ui/FormField'
import { cambiarEstadoCuentaAnalitica } from '../../../core/api/contabilidadApi'
import { getApiErrorMessage } from '../../../core/api/errors'

/**
 * CambiarEstadoModal — Modal para activar o desactivar cuenta analítica con motivo obligatorio (CU-W29).
 *
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   account: object | null,
 *   onSuccess: (updatedAccount: object) => void
 * }} props
 */
export default function CambiarEstadoModal({
  open,
  onClose,
  account,
  onSuccess,
}) {
  if (!open || !account) return null

  return (
    <CambiarEstadoForm
      key={account.id}
      account={account}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  )
}

function CambiarEstadoForm({ account, onClose, onSuccess }) {
  const [motivo, setMotivo] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const isCurrentlyActive = account.estado === 'ACTIVA'
  const targetState = isCurrentlyActive ? 'INACTIVA' : 'ACTIVA'
  const actionLabel = isCurrentlyActive ? 'Desactivar Cuenta' : 'Activar Cuenta'

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (!motivo.trim() || motivo.trim().length < 5) {
      setError('El motivo es obligatorio y debe tener al menos 5 caracteres.')
      return
    }

    setLoading(true)
    try {
      const payload = {
        estado: targetState,
        motivo: motivo.trim(),
      }
      const data = await cambiarEstadoCuentaAnalitica(account.id, payload)
      onSuccess(data)
      onClose()
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          'Error al cambiar el estado de la cuenta analítica.',
        ),
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={`${actionLabel} Contable`}
      subtitle={`Cuenta ${account.codigo} — ${account.nombre}`}
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
          <Button
            type="submit"
            form="cambiar-estado-form"
            variant={isCurrentlyActive ? 'danger' : 'primary'}
            size="sm"
            loading={loading}
            className={!isCurrentlyActive ? '!bg-[#064e3b]' : ''}
          >
            Confirmar {isCurrentlyActive ? 'Desactivación' : 'Activación'}
          </Button>
        </div>
      }
    >
      <form id="cambiar-estado-form" onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <AlertBanner variant="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </AlertBanner>
        )}

        <div
          className={`p-3 rounded-lg border text-xs leading-relaxed ${
            isCurrentlyActive
              ? 'bg-amber-50/70 border-amber-200 text-amber-900'
              : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
          }`}
        >
          {isCurrentlyActive ? (
            <p>
              <strong>Atención:</strong> Al desactivar la cuenta no se podrán registrar nuevos asientos o comprobantes en ella. El sistema validará que su saldo contable sea exactamente cero.
            </p>
          ) : (
            <p>
              La cuenta volverá a estar disponible para imputación y registro contable en la cooperativa.
            </p>
          )}
        </div>

        <FormField
          id="motivo_cambio"
          label="Motivo del Cambio de Estado"
          required
        >
          <Textarea
            id="motivo_cambio"
            placeholder="Explique la justificación normativa, auditoría o cierre contable (mínimo 5 caracteres)..."
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            rows={3}
            required
            autoFocus
          />
        </FormField>
      </form>
    </Modal>
  )
}
