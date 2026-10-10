import { useState } from 'react'
import Modal from '../../../../components/ui/Modal'
import Button from '../../../../components/ui/Button'
import AlertBanner from '../../../../components/ui/AlertBanner'
import { descartarRecredito } from '../../../../core/api/creditosApi'

/**
 * DescartarOfertaModal — Modal para justificar y descartar una oferta de re-crédito (CU-W23 p2).
 *
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   oferta: object|null,
 *   onDescartada?: (ofertaActualizada: object) => void
 * }} props
 */
export default function DescartarOfertaModal({ open, onClose, oferta, onDescartada }) {
  const [motivo, setMotivo] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  if (!open || !oferta) return null

  const socioNombre = (typeof oferta.socio === 'object' ? oferta.socio?.nombre_completo : null) || '—'
  const sim = (typeof oferta.moneda === 'object' ? oferta.moneda?.simbolo : 'Bs.') || 'Bs.'
  const n = Number(oferta.monto_sugerido ?? 0)
  const montoSugeridoFmt = `${sim} ${n.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  async function handleSubmit(e) {
    e?.preventDefault()
    if (!motivo.trim() || motivo.trim().length < 5) {
      setError('El motivo del descarte debe tener al menos 5 caracteres justificativos.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const updated = await descartarRecredito(oferta.id, { motivo: motivo.trim() })
      onDescartada?.(updated)
      onClose()
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          'Error al registrar el descarte de la oferta de re-crédito.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Descartar Oferta de Re-crédito"
      subtitle={`Oferta #${oferta.id} &bull; Socio: ${socioNombre}`}
      footer={
        <div className="flex w-full items-center justify-between">
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Cancelar
          </Button>

          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={handleSubmit}
            loading={loading}
            disabled={motivo.trim().length < 5}
            className="gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">do_not_disturb_on</span>
            <span>Confirmar Descarte</span>
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans text-slate-800">
        {error && (
          <AlertBanner variant="error" onClose={() => setError(null)}>
            {error}
          </AlertBanner>
        )}

        <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Detalle de la Oferta a Descartar
          </span>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-600">Monto preaprobado:</span>
            <span className="font-bold text-slate-900">{montoSugeridoFmt}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-600">Producto:</span>
            <span className="font-semibold text-slate-800">{oferta.producto?.nombre || '—'}</span>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700">
            Motivo o Razón del Descarte <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={3}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ej. El socio manifestó que no requiere financiamiento en este momento por liquidez suficiente..."
            className="w-full p-2.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
          <span className="text-[10px] text-slate-400 block">
            Mínimo 5 caracteres. Este motivo quedará registrado en la bitácora de auditoría.
          </span>
        </div>
      </form>
    </Modal>
  )
}
