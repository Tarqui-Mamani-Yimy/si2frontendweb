import { useState } from 'react'
import Modal from '../../../../components/ui/Modal'
import Button from '../../../../components/ui/Button'
import AlertBanner from '../../../../components/ui/AlertBanner'
import Badge from '../../../../components/ui/Badge'
import { FormField, Textarea } from '../../../../components/ui/FormField'
import { resolverSolicitud } from '../../../../core/api/creditosApi'

/**
 * ResolverDictamenModal — Modal para la resolución humana de dictámenes en REVISIÓN MANUAL por parte de un Administrador (CU-W23).
 *
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   solicitud: object,
 *   evaluacion?: object,
 *   onSuccess: (evaluacionActualizada: object) => void
 * }} props
 */
export default function ResolverDictamenModal({
  open,
  onClose,
  solicitud,
  evaluacion,
  onSuccess,
}) {
  const [decision, setDecision] = useState('APROBADO')
  const [justificacion, setJustificacion] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  if (!open || !solicitud) return null

  const numero = solicitud.numero_solicitud || `SOL-#${solicitud.id}`
  const score = evaluacion?.score ?? solicitud.ultima_evaluacion?.score ?? '—'
  const isJustificacionValid = justificacion.trim().length >= 10

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (!isJustificacionValid) {
      setError('La justificación técnica de la resolución debe contener al menos 10 caracteres.')
      return
    }

    setSubmitting(true)
    try {
      const res = await resolverSolicitud(solicitud.id, {
        decision,
        justificacion: justificacion.trim(),
      })
      onSuccess?.(res)
      onClose()
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          'Error al registrar la resolución administrativa de la solicitud.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Resolución de Revisión Manual"
      subtitle={`Decisión administrativa vinculante para la solicitud ${numero}`}
      footer={
        <div className="flex w-full items-center justify-between">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={submitting}
          >
            Cancelar
          </Button>

          <Button
            type="button"
            variant={decision === 'APROBADO' ? 'primary' : 'danger'}
            size="sm"
            onClick={handleSubmit}
            loading={submitting}
            disabled={!isJustificacionValid || submitting}
            className="gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">
              {decision === 'APROBADO' ? 'check_circle' : 'gavel'}
            </span>
            <span>Confirmar Dictamen: {decision}</span>
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
        {error && (
          <AlertBanner variant="error" onClose={() => setError(null)}>
            {error}
          </AlertBanner>
        )}

        {/* Resumen del caso a resolver */}
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-amber-900 text-xs">
              Caso derivado a revisión manual
            </span>
            <Badge variant="amber">REVISIÓN MANUAL</Badge>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-slate-700">
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">Socio:</span>
              <span className="font-bold text-slate-900">{solicitud.socio?.nombre_completo || '—'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">Puntaje Motor:</span>
              <span className="font-mono font-bold text-amber-900">{score} / 1000 pts</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">Monto:</span>
              <span className="font-bold text-slate-900">
                {solicitud.moneda?.simbolo || 'Bs.'} {Number(solicitud.monto || 0).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
          <p className="text-[11px] text-amber-800 pt-1 border-t border-amber-200/60">
            El motor de scoring derivó este expediente a la zona gris (score entre 500 y 699, o knock-out de revisión).
            Como Administrador, ingrese su dictamen final debidamente fundamentado para auditoría interna y ASFI.
          </p>
        </div>

        {/* Selección de Decisión */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
            Decisión Resolutiva *
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setDecision('APROBADO')}
              className={`p-3 rounded-xl border text-left transition flex items-center justify-between ${
                decision === 'APROBADO'
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div>
                <span className="font-bold block text-xs">APROBADO</span>
                <span className="text-[10px] text-slate-500">Autorizar el otorgamiento del crédito</span>
              </div>
              <span className={`material-symbols-outlined text-[20px] ${decision === 'APROBADO' ? 'text-emerald-700' : 'text-slate-300'}`}>
                check_circle
              </span>
            </button>

            <button
              type="button"
              onClick={() => setDecision('RECHAZADO')}
              className={`p-3 rounded-xl border text-left transition flex items-center justify-between ${
                decision === 'RECHAZADO'
                  ? 'border-rose-600 bg-rose-50 text-rose-900 ring-2 ring-rose-500/20'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div>
                <span className="font-bold block text-xs">RECHAZADO</span>
                <span className="text-[10px] text-slate-500">Denegar la solicitud de crédito</span>
              </div>
              <span className={`material-symbols-outlined text-[20px] ${decision === 'RECHAZADO' ? 'text-rose-700' : 'text-slate-300'}`}>
                cancel
              </span>
            </button>
          </div>
        </div>

        {/* Justificación obligatoria */}
        <FormField
          id="justificacion"
          label="Justificación Técnica y Legal (Mínimo 10 caracteres) *"
          error={!isJustificacionValid && justificacion.length > 0 ? 'Mínimo 10 caracteres requeridos' : undefined}
        >
          <Textarea
            id="justificacion"
            rows={4}
            value={justificacion}
            onChange={(e) => setJustificacion(e.target.value)}
            placeholder="Fundamente el criterio de aprobación o rechazo (análisis de mitigantes, garantías colaterales, avales, excepciones de política)..."
            hasError={!isJustificacionValid && justificacion.length > 0}
          />
          <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1">
            <span>Esta resolución quedará registrada permanentemente en la bitácora institucional.</span>
            <span className={`font-mono ${justificacion.trim().length < 10 ? 'text-amber-600 font-bold' : 'text-emerald-700'}`}>
              {justificacion.trim().length} / mín. 10
            </span>
          </div>
        </FormField>
      </form>
    </Modal>
  )
}
