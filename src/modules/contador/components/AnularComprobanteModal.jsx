import { useState } from 'react'
import Modal from '../../../components/ui/Modal'
import Button from '../../../components/ui/Button'
import AlertBanner from '../../../components/ui/AlertBanner'
import { FormField, Textarea } from '../../../components/ui/FormField'
import { anularComprobante } from '../../../core/api/contabilidadApi'
import { getApiErrorMessage } from '../../../core/api/errors'

/**
 * AnularComprobanteModal — Confirmación de anulación de comprobante manual con motivo obligatorio (CU-W30).
 *
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   comprobante: object | null,
 *   onSuccess: (result: object) => void
 * }} props
 */
export default function AnularComprobanteModal({
  open,
  onClose,
  comprobante,
  onSuccess,
}) {
  if (!open || !comprobante) return null

  return (
    <AnularComprobanteForm
      key={comprobante.id}
      comprobante={comprobante}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  )
}

function AnularComprobanteForm({ comprobante, onClose, onSuccess }) {
  const [motivo, setMotivo] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (!motivo.trim() || motivo.trim().length < 5) {
      setError('El motivo de anulación es obligatorio y debe tener al menos 5 caracteres.')
      return
    }

    setLoading(true)
    try {
      const data = await anularComprobante(comprobante.id, {
        motivo: motivo.trim(),
      })
      onSuccess(data)
      onClose()
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          'Error al anular el comprobante contable.',
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
      title="Anular Comprobante Contable"
      subtitle={`Generación de asiento de reversión para ${comprobante.numero}`}
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
            form="anular-comprobante-form"
            variant="danger"
            size="sm"
            loading={loading}
            className="!bg-red-600 hover:!bg-red-700"
          >
            Confirmar Anulación
          </Button>
        </div>
      }
    >
      <form id="anular-comprobante-form" onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <AlertBanner variant="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </AlertBanner>
        )}

        <div className="p-3.5 bg-red-50 border border-red-200 text-red-950 rounded-xl text-xs space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold text-red-700">
            <span className="material-symbols-outlined text-[17px]">warning</span>
            <span>Acción Fiduciaria Irreversible</span>
          </div>
          <p>
            Por normativa contable, los comprobantes no se eliminan. Al anular el comprobante{' '}
            <strong className="font-mono">{comprobante.numero}</strong> se generará automáticamente un <strong>comprobante de reversión</strong> con las líneas invertidas (Debe ↔ Haber) para neutralizar los saldos contables.
          </p>
        </div>

        <FormField id="motivo_anulacion" label="Motivo de Anulación" required>
          <Textarea
            id="motivo_anulacion"
            placeholder="Justificación del error de digitación, reclasificación contable o instrucción de auditoría (mínimo 5 caracteres)..."
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
