import { useState } from 'react'
import Modal from '../../../../components/ui/Modal'
import Button from '../../../../components/ui/Button'
import Badge from '../../../../components/ui/Badge'
import AlertBanner from '../../../../components/ui/AlertBanner'
import { FormField, Textarea } from '../../../../components/ui/FormField'
import { descartarAlerta } from '../../../../core/api/creditosApi'

function getSeveridadBadgeVariant(severidad) {
  switch (severidad) {
    case 'CRITICA':
      return 'red'
    case 'ADVERTENCIA':
      return 'amber'
    case 'INFO':
      return 'indigo'
    default:
      return 'slate'
  }
}

/**
 * DescartarAlertaModal — Descarte fundamentado de una alerta de mora activa (CU-W28).
 *
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   alerta: object|null,
 *   onSuccess?: (updatedAlerta: object) => void
 * }} props
 */
export default function DescartarAlertaModal({ open, onClose, alerta, onSuccess }) {
  const [comentario, setComentario] = useState('')
  const [saving, setSaving] = useState(false)
  const [apiError, setApiError] = useState(null)
  const [validationError, setValidationError] = useState(null)

  if (!open || !alerta) return null

  async function handleSubmit(e) {
    e.preventDefault()
    setApiError(null)

    const trimmed = comentario.trim()
    if (!trimmed) {
      setValidationError('Debe registrar un motivo para descartar la alerta.')
      return
    }
    if (trimmed.length < 5) {
      setValidationError('El motivo debe tener al menos 5 caracteres.')
      return
    }

    setSaving(true)
    try {
      const updated = await descartarAlerta(alerta.id, { comentario: trimmed })
      onSuccess?.(updated)
      onClose()
    } catch (err) {
      setApiError(
        err.response?.data?.detail || 'Error al descartar la alerta de mora.',
      )
    } finally {
      setSaving(false)
    }
  }

  const socioNombre =
    alerta.socio?.nombre_completo ||
    `Socio #${alerta.socio?.id || '—'}`
  const numeroCredito = alerta.credito?.numero_credito || `CRE-#${alerta.credito?.id || '—'}`

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Descartar Alerta de Mora"
      subtitle={`Crédito ${numeroCredito} &bull; ${socioNombre}`}
      footer={
        <div className="flex w-full items-center justify-between">
          <Button type="button" variant="secondary" size="sm" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>

          <Button
            type="submit"
            form="form-descartar-alerta"
            variant="danger"
            size="sm"
            loading={saving}
            className="gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
            <span>Confirmar Descarte</span>
          </Button>
        </div>
      }
    >
      <form id="form-descartar-alerta" onSubmit={handleSubmit} className="space-y-4">
        {apiError && (
          <AlertBanner variant="error" dismissible onDismiss={() => setApiError(null)}>
            {apiError}
          </AlertBanner>
        )}

        <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1.5">
          <div className="flex items-center gap-2">
            <Badge variant={getSeveridadBadgeVariant(alerta.severidad)}>
              {alerta.severidad}
            </Badge>
            <span className="font-mono text-xs font-bold text-slate-800">
              {alerta.tipo}
            </span>
          </div>
          <p className="text-xs text-slate-700">
            {alerta.mensaje}
          </p>
        </div>

        <FormField
          id="comentario_cierre"
          label="Motivo Justificativo del Descarte"
          required
          error={validationError}
        >
          <div className="space-y-1">
            <Textarea
              id="comentario_cierre"
              rows={3}
              value={comentario}
              onChange={(e) => {
                setComentario(e.target.value)
                if (validationError) setValidationError(null)
              }}
              placeholder="Explique el motivo por el cual se desestima o no procede gestionar esta alerta (mínimo 5 caracteres)..."
              hasError={Boolean(validationError)}
            />
            <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
              <span>Mínimo 5 caracteres</span>
              <span
                className={
                  comentario.trim().length >= 5
                    ? 'text-emerald-700 font-bold'
                    : 'text-slate-400'
                }
              >
                {comentario.trim().length} / 5
              </span>
            </div>
          </div>
        </FormField>
      </form>
    </Modal>
  )
}
