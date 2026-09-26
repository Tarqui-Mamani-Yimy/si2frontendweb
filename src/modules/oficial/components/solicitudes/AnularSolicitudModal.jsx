import { useState } from 'react'
import Modal from '../../../../components/ui/Modal'
import Button from '../../../../components/ui/Button'
import AlertBanner from '../../../../components/ui/AlertBanner'
import { FormField, Textarea } from '../../../../components/ui/FormField'
import { anularSolicitudCredito } from '../../../../core/api/creditosApi'

/**
 * AnularSolicitudModal — Anulación formal de solicitud de crédito con motivo justificado (CU-W21).
 *
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   solicitud: object|null,
 *   onSuccess: () => void
 * }} props
 */
export default function AnularSolicitudModal({
  open,
  onClose,
  solicitud,
  onSuccess,
}) {
  const [motivo, setMotivo] = useState('')
  const [errorValidacion, setErrorValidacion] = useState(null)
  const [apiError, setApiError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  if (!open || !solicitud) return null

  const numero = solicitud.numero_solicitud || `SOL-#${solicitud.id}`
  const socioNombre = solicitud.socio?.nombre_completo || 'Socio'

  async function handleAnular(e) {
    e.preventDefault()
    setApiError(null)
    setErrorValidacion(null)

    const trimmed = motivo.trim()
    if (!trimmed || trimmed.length < 5) {
      setErrorValidacion('Debe ingresar un motivo justificado de al menos 5 caracteres para la anulación.')
      return
    }

    setSubmitting(true)
    try {
      await anularSolicitudCredito(solicitud.id, trimmed)
      onSuccess?.()
      onClose()
    } catch (err) {
      const detail = err.response?.data?.detail
      setApiError(detail || 'No se pudo anular la solicitud de crédito.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Anular Solicitud de Crédito"
      subtitle={`Operación formal de anulación — ${numero}`}
      footer={
        <div className="flex w-full items-center justify-between">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            size="sm"
            type="submit"
            form="anular-solicitud-form"
            loading={submitting}
          >
            Confirmar Anulación
          </Button>
        </div>
      }
    >
      <form id="anular-solicitud-form" onSubmit={handleAnular} className="space-y-4 text-xs">
        {apiError && (
          <AlertBanner variant="error" onClose={() => setApiError(null)}>
            {apiError}
          </AlertBanner>
        )}

        <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-4 space-y-1.5 text-rose-900">
          <div className="flex items-center gap-1.5 font-bold text-sm text-rose-800">
            <span className="material-symbols-outlined text-[18px]">warning</span>
            <span>Acción Irreversible</span>
          </div>
          <p className="leading-relaxed">
            Está a punto de anular la solicitud <strong>{numero}</strong> de <strong>{socioNombre}</strong>.
            Una solicitud anulada quedará archivada en la bitácora fiduciaria y no podrá ser reevaluada ni desembolsada.
          </p>
        </div>

        <FormField
          id="motivo"
          label="Motivo Justificado de Anulación *"
          required
          error={errorValidacion}
        >
          <Textarea
            id="motivo"
            value={motivo}
            onChange={(e) => {
              setMotivo(e.target.value)
              if (errorValidacion) setErrorValidacion(null)
            }}
            placeholder="Describa el motivo (ej. Desistimiento expreso del socio, duplicidad involuntaria, documentación adulterada)..."
            rows={3}
            hasError={Boolean(errorValidacion)}
          />
        </FormField>
      </form>
    </Modal>
  )
}
