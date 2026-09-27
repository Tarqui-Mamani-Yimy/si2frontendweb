import { useState } from 'react'
import Modal from '../../../../components/ui/Modal'
import Button from '../../../../components/ui/Button'
import Badge from '../../../../components/ui/Badge'
import AlertBanner from '../../../../components/ui/AlertBanner'
import { FormField, Input, Textarea } from '../../../../components/ui/FormField'
import { atenderAlerta } from '../../../../core/api/creditosApi'

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
 * AtenderAlertaModal — Registro de acción de cobranza y atención de alerta (CU-W28).
 *
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   alerta: object|null,
 *   onSuccess?: (updatedAlerta: object) => void
 * }} props
 */
export default function AtenderAlertaModal({ open, onClose, alerta, onSuccess }) {
  const [tipoContacto, setTipoContacto] = useState('LLAMADA')
  const [resultadoGestion, setResultadoGestion] = useState('')
  const [fechaCompromisoPago, setFechaCompromisoPago] = useState('')
  const [saving, setSaving] = useState(false)
  const [apiError, setApiError] = useState(null)
  const [validationErrors, setValidationErrors] = useState({})

  if (!open || !alerta) return null

  const todayStr = new Date().toISOString().split('T')[0]

  function validate() {
    const errs = {}
    if (!['LLAMADA', 'VISITA', 'MENSAJE', 'OTRO'].includes(tipoContacto)) {
      errs.tipoContacto = 'Seleccione un tipo de contacto válido.'
    }
    const resTrim = resultadoGestion.trim()
    if (!resTrim) {
      errs.resultadoGestion = 'El resultado de la gestión es obligatorio.'
    } else if (resTrim.length < 10) {
      errs.resultadoGestion = 'Debe registrar al menos 10 caracteres detallando la acción.'
    }
    if (fechaCompromisoPago) {
      if (fechaCompromisoPago < todayStr) {
        errs.fechaCompromisoPago = 'La fecha de compromiso de pago debe ser hoy o una fecha futura.'
      }
    }
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setApiError(null)

    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setValidationErrors(errs)
      return
    }

    setSaving(true)
    try {
      const payload = {
        tipo_contacto: tipoContacto,
        resultado_gestion: resultadoGestion.trim(),
        fecha_compromiso_pago: fechaCompromisoPago || null,
      }
      const updated = await atenderAlerta(alerta.id, payload)
      onSuccess?.(updated)
      onClose()
    } catch (err) {
      setApiError(
        err.response?.data?.detail || 'Error al registrar la atención de la alerta.',
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
      title="Atender Alerta de Mora"
      subtitle={`Gestión de cobranza &bull; Crédito ${numeroCredito}`}
      footer={
        <div className="flex w-full items-center justify-between">
          <Button type="button" variant="secondary" size="sm" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>

          <Button
            type="submit"
            form="form-atender-alerta"
            variant="primary"
            size="sm"
            loading={saving}
            className="gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">check_circle</span>
            <span>Registrar Gestión</span>
          </Button>
        </div>
      }
    >
      <form id="form-atender-alerta" onSubmit={handleSubmit} className="space-y-4">
        {apiError && (
          <AlertBanner variant="error" dismissible onDismiss={() => setApiError(null)}>
            {apiError}
          </AlertBanner>
        )}

        {/* ── Resumen de la Alerta Activa ── */}
        <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Badge variant={getSeveridadBadgeVariant(alerta.severidad)}>
                {alerta.severidad}
              </Badge>
              <span className="font-mono text-xs font-bold text-slate-800">
                {alerta.tipo}
              </span>
            </div>
            <span className="font-mono text-[10px] text-slate-500">
              Emitida: {formatDate(alerta.fecha_creacion)}
            </span>
          </div>

          <p className="text-xs text-slate-700 font-medium">
            {alerta.mensaje}
          </p>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 text-[11px] text-slate-600">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Socio</span>
              <span className="font-bold text-slate-900">{socioNombre}</span>
              {alerta.socio?.ci && (
                <span className="text-slate-500 block text-[10px]">C.I. {alerta.socio.ci}</span>
              )}
            </div>

            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Crédito / Cuota</span>
              <span className="font-mono font-bold text-slate-900">{numeroCredito}</span>
              {alerta.cuota && (
                <span className="text-slate-500 block text-[10px]">
                  Cuota #{alerta.cuota.numero} &bull; Vto: {formatDate(alerta.cuota.fecha_vencimiento)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Formulario de Gestión de Cobranza ── */}
        <div className="space-y-3 pt-1">
          <FormField
            id="tipo_contacto"
            label="Tipo de Contacto Realizado"
            required
            error={validationErrors.tipoContacto}
          >
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'LLAMADA', label: 'Llamada', icon: 'call' },
                { id: 'VISITA', label: 'Visita', icon: 'home' },
                { id: 'MENSAJE', label: 'Mensaje', icon: 'chat' },
                { id: 'OTRO', label: 'Otro Medio', icon: 'more_horiz' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setTipoContacto(opt.id)
                    setValidationErrors((prev) => {
                      const next = { ...prev }
                      delete next.tipoContacto
                      return next
                    })
                  }}
                  className={`py-2 px-2.5 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                    tipoContacto === opt.id
                      ? 'bg-emerald-50 text-[#064e3b] border-emerald-400 ring-2 ring-emerald-500/20 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">{opt.icon}</span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </FormField>

          <FormField
            id="resultado_gestion"
            label="Resultado de la Gestión de Cobranza"
            required
            error={validationErrors.resultadoGestion}
          >
            <div className="space-y-1">
              <Textarea
                id="resultado_gestion"
                rows={3}
                value={resultadoGestion}
                onChange={(e) => {
                  setResultadoGestion(e.target.value)
                  if (validationErrors.resultadoGestion) {
                    setValidationErrors((prev) => {
                      const next = { ...prev }
                      delete next.resultadoGestion
                      return next
                    })
                  }
                }}
                placeholder="Detalle la respuesta del socio, acuerdos alcanzados o circunstancias del cobro (mínimo 10 caracteres)..."
                hasError={Boolean(validationErrors.resultadoGestion)}
              />
              <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                <span>Mínimo 10 caracteres</span>
                <span
                  className={
                    resultadoGestion.trim().length >= 10
                      ? 'text-emerald-700 font-bold'
                      : 'text-slate-400'
                  }
                >
                  {resultadoGestion.trim().length} / 10
                </span>
              </div>
            </div>
          </FormField>

          <FormField
            id="fecha_compromiso_pago"
            label="Fecha de Compromiso de Pago (Opcional)"
            error={validationErrors.fechaCompromisoPago}
          >
            <Input
              id="fecha_compromiso_pago"
              type="date"
              min={todayStr}
              value={fechaCompromisoPago}
              onChange={(e) => {
                setFechaCompromisoPago(e.target.value)
                if (validationErrors.fechaCompromisoPago) {
                  setValidationErrors((prev) => {
                    const next = { ...prev }
                    delete next.fechaCompromisoPago
                    return next
                  })
                }
              }}
              hasError={Boolean(validationErrors.fechaCompromisoPago)}
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Si el prestatario se comprometió a regularizar su cuota en una fecha específica.
            </p>
          </FormField>
        </div>
      </form>
    </Modal>
  )
}
