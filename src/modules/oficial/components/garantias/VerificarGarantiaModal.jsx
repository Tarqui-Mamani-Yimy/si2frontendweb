import { useState } from 'react'
import Modal from '../../../../components/ui/Modal'
import Button from '../../../../components/ui/Button'
import Badge from '../../../../components/ui/Badge'
import AlertBanner from '../../../../components/ui/AlertBanner'
import { FormField, Textarea } from '../../../../components/ui/FormField'
import { verificarGarantia } from '../../../../core/api/creditosApi'
import { useAuthStore, selectUser } from '../../../../core/store/authStore'

function formatMoney(value, simbolo = 'Bs.') {
  const n = typeof value === 'number' ? value : parseFloat(value ?? 0)
  const safe = isNaN(n) ? 0 : n
  return `${simbolo} ${safe.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(isoStr) {
  if (!isoStr) return '—'
  const d = new Date(isoStr)
  if (isNaN(d.getTime())) return isoStr
  return d.toLocaleDateString('es-BO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/**
 * VerificarGarantiaModal — Verificación o rechazo de garantías bajo principio Maker-Checker (CU-W22).
 * Exclusivo para usuarios con rol de Administrador.
 *
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   garantia: object|null,
 *   onSuccess?: (updatedGarantia: object) => void
 * }} props
 */
export default function VerificarGarantiaModal({
  open,
  onClose,
  garantia,
  onSuccess,
}) {
  const user = useAuthStore(selectUser)
  const [decision, setDecision] = useState('VERIFICADA')
  const [observacion, setObservacion] = useState('')
  const [saving, setSaving] = useState(false)
  const [apiError, setApiError] = useState(null)
  const [validationError, setValidationError] = useState(null)

  if (!open || !garantia) return null

  const sim = (typeof garantia.moneda === 'object' ? garantia.moneda?.simbolo : 'Bs.') || 'Bs.'
  const iso = (typeof garantia.moneda === 'object' ? garantia.moneda?.codigo_iso : 'BOB') || 'BOB'

  // Regla Maker-Checker: un usuario no puede verificar lo que él mismo registró
  const esElMismoRegistrador =
    user?.id != null &&
    garantia.usuario_registro?.id != null &&
    Number(user.id) === Number(garantia.usuario_registro.id)

  async function handleSubmit(e) {
    e.preventDefault()
    setApiError(null)

    if (esElMismoRegistrador) {
      setApiError(
        'Principio Maker-Checker: No puede verificar ni rechazar una garantía registrada por usted mismo. Otro administrador debe completar esta acción.',
      )
      return
    }

    const obsTrim = observacion.trim()
    if (!obsTrim) {
      setValidationError('Debe ingresar una observación justificativa de la verificación.')
      return
    }
    if (obsTrim.length < 5) {
      setValidationError('La observación debe contener al menos 5 caracteres.')
      return
    }

    setSaving(true)
    try {
      const updated = await verificarGarantia(garantia.id, {
        decision,
        observacion: obsTrim,
      })
      onSuccess?.(updated)
      onClose()
    } catch (err) {
      setApiError(err.response?.data?.detail || 'Error al procesar la verificación de la garantía.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Verificación de Garantía / Aval"
      subtitle={`Garantía #${garantia.id} &bull; Tipo: ${garantia.tipo}`}
      footer={
        <div className="flex w-full items-center justify-between">
          <Button type="button" variant="secondary" size="sm" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>

          <Button
            type="submit"
            form="form-verificar-garantia"
            variant={decision === 'VERIFICADA' ? 'primary' : 'danger'}
            size="sm"
            loading={saving}
            disabled={esElMismoRegistrador}
            className="gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">
              {decision === 'VERIFICADA' ? 'verified' : 'cancel'}
            </span>
            <span>
              {decision === 'VERIFICADA' ? 'Confirmar Verificación' : 'Confirmar Rechazo'}
            </span>
          </Button>
        </div>
      }
    >
      <form id="form-verificar-garantia" onSubmit={handleSubmit} className="space-y-4">
        {esElMismoRegistrador && (
          <AlertBanner variant="error">
            <strong>Restricción Maker-Checker:</strong> Usted figura como el usuario que registró esta garantía ({garantia.usuario_registro?.nombre}). Por normativa de control interno, la verificación debe ser realizada por otro Administrador.
          </AlertBanner>
        )}

        {apiError && (
          <AlertBanner variant="error" dismissible onDismiss={() => setApiError(null)}>
            {apiError}
          </AlertBanner>
        )}

        {/* ── Resumen de la Garantía a Verificar ── */}
        <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="navy">{garantia.tipo}</Badge>
              <Badge variant="amber">{garantia.estado}</Badge>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">
              Registrada: {formatDate(garantia.fecha_registro)}
            </span>
          </div>

          <p className="text-slate-800 font-medium">
            {garantia.descripcion}
          </p>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 text-[11px]">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                {garantia.tipo === 'PERSONAL' ? 'Ingreso Avalista' : 'Valor Comercial'}
              </span>
              <span className="font-mono font-bold text-slate-900">
                {garantia.tipo === 'PERSONAL'
                  ? formatMoney(garantia.avalista?.ingreso_mensual, sim)
                  : formatMoney(garantia.valor_comercial, sim)}
              </span>
              <span className="text-slate-500 block text-[10px]">
                {garantia.tipo === 'PERSONAL'
                  ? `Garante: ${garantia.avalista?.nombre || '—'} (CI ${garantia.avalista?.ci || '—'})`
                  : garantia.documento_referencia || 'Sin doc. referencia'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                Valor Realizable Computable
              </span>
              <span className="font-mono font-bold text-emerald-800 text-sm">
                {formatMoney(garantia.valor_realizable, sim)}
              </span>
              <span className="text-slate-500 block text-[10px]">
                Moneda: {iso}
              </span>
            </div>
          </div>

          <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-200/40">
            Registrado por: <strong>{garantia.usuario_registro?.nombre || 'Personal'}</strong>
          </div>
        </div>

        {/* ── Selección de Decisión Maker-Checker ── */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-800">
            Decisión de Control <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setDecision('VERIFICADA')
                if (validationError) setValidationError(null)
              }}
              className={`p-3 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                decision === 'VERIFICADA'
                  ? 'border-emerald-500 bg-emerald-50/80 text-emerald-900 ring-2 ring-emerald-500/20'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
              }`}
            >
              <span className="material-symbols-outlined text-[20px] text-emerald-600">
                verified
              </span>
              <div>
                <span className="font-bold text-xs block">Verificar y Computar</span>
                <span className="text-[10px] text-slate-500 block">
                  Suma al valor realizable verificado
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setDecision('RECHAZADA')
                if (validationError) setValidationError(null)
              }}
              className={`p-3 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                decision === 'RECHAZADA'
                  ? 'border-rose-500 bg-rose-50/80 text-rose-900 ring-2 ring-rose-500/20'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
              }`}
            >
              <span className="material-symbols-outlined text-[20px] text-rose-600">
                cancel
              </span>
              <div>
                <span className="font-bold text-xs block">Rechazar Garantía</span>
                <span className="text-[10px] text-slate-500 block">
                  Excluida del cálculo de cobertura
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* ── Observación Justificativa ── */}
        <FormField
          id="observacion_verificacion"
          label="Observación / Fundamentación del Dictamen"
          required
          error={validationError}
        >
          <div className="space-y-1">
            <Textarea
              id="observacion_verificacion"
              rows={3}
              value={observacion}
              onChange={(e) => {
                setObservacion(e.target.value)
                if (validationError) setValidationError(null)
              }}
              placeholder={
                decision === 'VERIFICADA'
                  ? 'Detalle la revisión documental, gravámenes, certificado catastral o respaldo fiduciario verificado (mínimo 5 caracteres)...'
                  : 'Indique las razones del rechazo (ej. gravamen previo sin cancelar, documentación apócrifa o insuficiente solvencia)...'
              }
              hasError={Boolean(validationError)}
            />
            <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
              <span>Mínimo 5 caracteres</span>
              <span
                className={
                  observacion.trim().length >= 5
                    ? 'text-emerald-700 font-bold'
                    : 'text-slate-400'
                }
              >
                {observacion.trim().length} / 5
              </span>
            </div>
          </div>
        </FormField>
      </form>
    </Modal>
  )
}
