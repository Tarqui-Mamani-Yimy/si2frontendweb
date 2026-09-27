import { useState, useMemo } from 'react'
import Modal from '../../../../components/ui/Modal'
import Button from '../../../../components/ui/Button'
import AlertBanner from '../../../../components/ui/AlertBanner'
import { FormField, Input, Textarea } from '../../../../components/ui/FormField'
import { crearGarantia, actualizarGarantia } from '../../../../core/api/creditosApi'

function formatMoney(value, simbolo = 'Bs.') {
  const n = typeof value === 'number' ? value : parseFloat(value ?? 0)
  const safe = isNaN(n) ? 0 : n
  return `${simbolo} ${safe.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/**
 * GarantiaFormModal — Registro y edición de garantías (Hipotecaria, Prendaria o Aval Personal) (CU-W22).
 *
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   solicitud: object,
 *   garantia?: object|null,
 *   onSuccess?: (garantia: object) => void
 * }} props
 */
export default function GarantiaFormModal({
  open,
  onClose,
  solicitud,
  garantia = null,
  onSuccess,
}) {
  const isEdit = Boolean(garantia)
  const montoSolicitado = parseFloat(solicitud?.monto_solicitado ?? 0)
  const monedaSolicitud = solicitud?.moneda || { id: 1, codigo_iso: 'BOB', simbolo: 'Bs.' }
  const sim = (typeof monedaSolicitud === 'object' ? monedaSolicitud?.simbolo : 'Bs.') || 'Bs.'
  const iso = (typeof monedaSolicitud === 'object' ? monedaSolicitud?.codigo_iso : 'BOB') || 'BOB'

  // Estados del formulario
  const [tipo, setTipo] = useState(garantia?.tipo || 'HIPOTECARIA')
  const [descripcion, setDescripcion] = useState(garantia?.descripcion || '')
  const [documentoReferencia, setDocumentoReferencia] = useState(garantia?.documento_referencia || '')
  const [valorComercial, setValorComercial] = useState(
    garantia?.valor_comercial != null ? String(garantia.valor_comercial) : '',
  )

  // Datos de avalista (PERSONAL)
  const [avalistaNombre, setAvalistaNombre] = useState(garantia?.avalista?.nombre || '')
  const [avalistaCi, setAvalistaCi] = useState(garantia?.avalista?.ci || '')
  const [avalistaIngreso, setAvalistaIngreso] = useState(
    garantia?.avalista?.ingreso_mensual != null ? String(garantia.avalista.ingreso_mensual) : '',
  )
  const [avalistaRelacion, setAvalistaRelacion] = useState(garantia?.avalista?.relacion || '')
  const [avalistaTelefono, setAvalistaTelefono] = useState(garantia?.avalista?.telefono || '')
  const [avalistaSocioId, setAvalistaSocioId] = useState(
    garantia?.avalista?.socio_id != null ? String(garantia.avalista.socio_id) : '',
  )

  const [saving, setSaving] = useState(false)
  const [apiError, setApiError] = useState(null)
  const [validationErrors, setValidationErrors] = useState({})

  // Cálculo en vivo del valor realizable estimado
  const valorRealizableEstimado = useMemo(() => {
    if (tipo === 'HIPOTECARIA') {
      const vc = parseFloat(valorComercial)
      return !isNaN(vc) && vc > 0 ? vc * 0.70 : 0
    }
    if (tipo === 'PRENDARIA') {
      const vc = parseFloat(valorComercial)
      return !isNaN(vc) && vc > 0 ? vc * 0.50 : 0
    }
    if (tipo === 'PERSONAL') {
      const ing = parseFloat(avalistaIngreso)
      if (isNaN(ing) || ing <= 0) return 0
      const capacidad = ing * 12 * 0.30
      return Math.min(capacidad, montoSolicitado)
    }
    return 0
  }, [tipo, valorComercial, avalistaIngreso, montoSolicitado])

  if (!open) return null

  function validate() {
    const errs = {}
    if (!descripcion.trim()) {
      errs.descripcion = 'La descripción de la garantía es obligatoria.'
    }

    if (tipo === 'HIPOTECARIA' || tipo === 'PRENDARIA') {
      const vc = parseFloat(valorComercial)
      if (isNaN(vc) || vc <= 0) {
        errs.valorComercial = 'Debe ingresar un valor comercial mayor a 0.'
      }
    }

    if (tipo === 'PERSONAL') {
      if (!avalistaNombre.trim()) {
        errs.avalistaNombre = 'El nombre completo del avalista es obligatorio.'
      }
      const ciTrim = avalistaCi.trim()
      if (!ciTrim) {
        errs.avalistaCi = 'La cédula de identidad del avalista es obligatoria.'
      } else {
        // Verificar que no sea el mismo socio solicitante
        const socioCi = solicitud?.socio?.ci?.trim()
        if (socioCi && ciTrim.toLowerCase() === socioCi.toLowerCase()) {
          errs.avalistaCi = 'El avalista no puede ser el mismo socio solicitante del crédito.'
        }
      }

      const ing = parseFloat(avalistaIngreso)
      if (isNaN(ing) || ing <= 0) {
        errs.avalistaIngreso = 'Debe registrar un ingreso mensual demostrable mayor a 0.'
      }

      if (!avalistaRelacion.trim()) {
        errs.avalistaRelacion = 'Especifique la relación o parentesco con el solicitante.'
      }

      if (avalistaSocioId.trim()) {
        const sid = parseInt(avalistaSocioId, 10)
        if (isNaN(sid) || sid <= 0) {
          errs.avalistaSocioId = 'El ID de socio debe ser un entero positivo.'
        } else if (solicitud?.socio?.id && sid === solicitud.socio.id) {
          errs.avalistaSocioId = 'El avalista no puede ser el mismo socio solicitante.'
        }
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
      let payload
      if (tipo === 'PERSONAL') {
        payload = {
          descripcion: descripcion.trim(),
          avalista: {
            nombre: avalistaNombre.trim(),
            ci: avalistaCi.trim(),
            ingreso_mensual: parseFloat(avalistaIngreso).toFixed(2),
            relacion: avalistaRelacion.trim(),
            telefono: avalistaTelefono.trim() || null,
            socio_id: avalistaSocioId.trim() ? parseInt(avalistaSocioId, 10) : null,
          },
        }
        if (!isEdit) {
          payload.tipo = 'PERSONAL'
        }
      } else {
        payload = {
          descripcion: descripcion.trim(),
          moneda_id: monedaSolicitud.id || 1,
          valor_comercial: parseFloat(valorComercial).toFixed(2),
          documento_referencia: documentoReferencia.trim() || null,
        }
        if (!isEdit) {
          payload.tipo = tipo
        }
      }

      let res
      if (isEdit) {
        res = await actualizarGarantia(garantia.id, payload)
      } else {
        res = await crearGarantia(solicitud.id, payload)
      }

      onSuccess?.(res)
      onClose()
    } catch (err) {
      setApiError(err.response?.data?.detail || 'Error al guardar la garantía.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Editar Garantía / Aval' : 'Registrar Nueva Garantía o Aval'}
      subtitle={`Solicitud ${solicitud?.numero || `#${solicitud?.id}`} &bull; Moneda: ${iso} (${sim})`}
      footer={
        <div className="flex w-full items-center justify-between">
          <Button type="button" variant="secondary" size="sm" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>

          <Button
            type="submit"
            form="form-garantia"
            variant="primary"
            size="sm"
            loading={saving}
            className="gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">save</span>
            <span>{isEdit ? 'Actualizar Garantía' : 'Registrar Garantía'}</span>
          </Button>
        </div>
      }
    >
      <form id="form-garantia" onSubmit={handleSubmit} className="space-y-4">
        {apiError && (
          <AlertBanner variant="error" dismissible onDismiss={() => setApiError(null)}>
            {apiError}
          </AlertBanner>
        )}

        {/* ── Selector de Tipo de Garantía (Inmutable en edición) ── */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-800">
            Tipo de Garantía {!isEdit && <span className="text-rose-500">*</span>}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              {
                id: 'HIPOTECARIA',
                label: 'Hipotecaria',
                icon: 'home',
                desc: 'Inmueble / Terreno (70%)',
              },
              {
                id: 'PRENDARIA',
                label: 'Prendaria',
                icon: 'directions_car',
                desc: 'Vehículo / Mueble (50%)',
              },
              {
                id: 'PERSONAL',
                label: 'Personal (Aval)',
                icon: 'person',
                desc: 'Garante fiduciario',
              },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                disabled={isEdit}
                onClick={() => {
                  setTipo(t.id)
                  setValidationErrors({})
                }}
                className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  tipo === t.id
                    ? 'border-[#064e3b] bg-emerald-50/70 text-[#064e3b] ring-2 ring-emerald-500/20'
                    : isEdit
                    ? 'opacity-40 border-slate-200 bg-slate-50 cursor-not-allowed text-slate-400'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <span className="material-symbols-outlined text-[17px]">{t.icon}</span>
                  <span>{t.label}</span>
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  {t.desc}
                </span>
              </button>
            ))}
          </div>
          {isEdit && (
            <p className="text-[10px] text-slate-400 italic">
              El tipo de garantía no se puede modificar una vez registrada.
            </p>
          )}
        </div>

        {/* ── Descripción General de la Garantía ── */}
        <FormField
          id="descripcion"
          label="Descripción Detallada del Respaldo"
          required
          error={validationErrors.descripcion}
        >
          <Textarea
            id="descripcion"
            rows={2}
            value={descripcion}
            onChange={(e) => {
              setDescripcion(e.target.value)
              if (validationErrors.descripcion) {
                setValidationErrors((prev) => {
                  const next = { ...prev }
                  delete next.descripcion
                  return next
                })
              }
            }}
            placeholder={
              tipo === 'HIPOTECARIA'
                ? 'Ej. Casa de 2 plantas ubicada en Zona Sur, con superficie de 250 m2...'
                : tipo === 'PRENDARIA'
                ? 'Ej. Vagoneta Toyota Rav4 año 2021, placa 4567XYZ, en perfecto estado...'
                : 'Ej. Aval personal con ingresos salariales respaldados por boleta de pago...'
            }
            hasError={Boolean(validationErrors.descripcion)}
          />
        </FormField>

        {/* ── Campos para HIPOTECARIA y PRENDARIA ── */}
        {(tipo === 'HIPOTECARIA' || tipo === 'PRENDARIA') && (
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800 border-b border-slate-200/60 pb-1.5">
              <span>Valuación y Documentación del Bien</span>
              <span className="font-mono text-[11px] text-slate-500">Moneda: {iso} ({sim})</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField
                id="valor_comercial"
                label={`Valor Comercial (${sim})`}
                required
                error={validationErrors.valorComercial}
              >
                <Input
                  id="valor_comercial"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={valorComercial}
                  onChange={(e) => {
                    setValorComercial(e.target.value)
                    if (validationErrors.valorComercial) {
                      setValidationErrors((prev) => {
                        const next = { ...prev }
                        delete next.valorComercial
                        return next
                      })
                    }
                  }}
                  placeholder="0.00"
                  hasError={Boolean(validationErrors.valorComercial)}
                  className="tabular-nums font-mono"
                />
              </FormField>

              <FormField
                id="documento_referencia"
                label="Doc. Referencia / Folio / Padrón"
                error={validationErrors.documentoReferencia}
              >
                <Input
                  id="documento_referencia"
                  type="text"
                  value={documentoReferencia}
                  onChange={(e) => setDocumentoReferencia(e.target.value)}
                  placeholder={tipo === 'HIPOTECARIA' ? 'Folio Real 2.01.0.99.12345' : 'RUA / Placa 4567-XYZ'}
                />
              </FormField>
            </div>
          </div>
        )}

        {/* ── Campos para PERSONAL (Aval / Garante) ── */}
        {tipo === 'PERSONAL' && (
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800 border-b border-slate-200/60 pb-1.5">
              <span>Datos del Garante / Avalista</span>
              <span className="text-[10px] text-slate-500">Moneda crédito: {iso}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField
                id="avalista_nombre"
                label="Nombre Completo del Avalista"
                required
                error={validationErrors.avalistaNombre}
              >
                <Input
                  id="avalista_nombre"
                  type="text"
                  value={avalistaNombre}
                  onChange={(e) => {
                    setAvalistaNombre(e.target.value)
                    if (validationErrors.avalistaNombre) {
                      setValidationErrors((prev) => {
                        const next = { ...prev }
                        delete next.avalistaNombre
                        return next
                      })
                    }
                  }}
                  placeholder="Nombre y Apellidos"
                  hasError={Boolean(validationErrors.avalistaNombre)}
                />
              </FormField>

              <FormField
                id="avalista_ci"
                label="Cédula de Identidad (C.I.)"
                required
                error={validationErrors.avalistaCi}
              >
                <Input
                  id="avalista_ci"
                  type="text"
                  value={avalistaCi}
                  onChange={(e) => {
                    setAvalistaCi(e.target.value)
                    if (validationErrors.avalistaCi) {
                      setValidationErrors((prev) => {
                        const next = { ...prev }
                        delete next.avalistaCi
                        return next
                      })
                    }
                  }}
                  placeholder="Ej. 6543210 LP"
                  hasError={Boolean(validationErrors.avalistaCi)}
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField
                id="avalista_ingreso"
                label={`Ingreso Mensual Demostrable (${sim})`}
                required
                error={validationErrors.avalistaIngreso}
              >
                <Input
                  id="avalista_ingreso"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={avalistaIngreso}
                  onChange={(e) => {
                    setAvalistaIngreso(e.target.value)
                    if (validationErrors.avalistaIngreso) {
                      setValidationErrors((prev) => {
                        const next = { ...prev }
                        delete next.avalistaIngreso
                        return next
                      })
                    }
                  }}
                  placeholder="0.00"
                  hasError={Boolean(validationErrors.avalistaIngreso)}
                  className="tabular-nums font-mono"
                />
              </FormField>

              <FormField
                id="avalista_relacion"
                label="Relación / Parentesco"
                required
                error={validationErrors.avalistaRelacion}
              >
                <Input
                  id="avalista_relacion"
                  type="text"
                  value={avalistaRelacion}
                  onChange={(e) => {
                    setAvalistaRelacion(e.target.value)
                    if (validationErrors.avalistaRelacion) {
                      setValidationErrors((prev) => {
                        const next = { ...prev }
                        delete next.avalistaRelacion
                        return next
                      })
                    }
                  }}
                  placeholder="Hermano, Cónyuge, Amigo, etc."
                  hasError={Boolean(validationErrors.avalistaRelacion)}
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField
                id="avalista_telefono"
                label="Teléfono / Celular (Opcional)"
                error={validationErrors.avalistaTelefono}
              >
                <Input
                  id="avalista_telefono"
                  type="text"
                  value={avalistaTelefono}
                  onChange={(e) => setAvalistaTelefono(e.target.value)}
                  placeholder="Ej. 70012345"
                />
              </FormField>

              <FormField
                id="avalista_socio_id"
                label="Nº Socio en Cooperativa (Opcional)"
                error={validationErrors.avalistaSocioId}
              >
                <Input
                  id="avalista_socio_id"
                  type="number"
                  value={avalistaSocioId}
                  onChange={(e) => {
                    setAvalistaSocioId(e.target.value)
                    if (validationErrors.avalistaSocioId) {
                      setValidationErrors((prev) => {
                        const next = { ...prev }
                        delete next.avalistaSocioId
                        return next
                      })
                    }
                  }}
                  placeholder="Si el garante es socio de la cooperativa"
                  hasError={Boolean(validationErrors.avalistaSocioId)}
                />
              </FormField>
            </div>
          </div>
        )}

        {/* ── Tarjeta de Cálculo de Valor Realizable (Estimado) ── */}
        <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/60 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-emerald-800 block">
              Valor Realizable Estimado para Cobertura
            </span>
            <span className="text-[11px] text-emerald-900">
              {tipo === 'HIPOTECARIA'
                ? 'Factor 70% del valor comercial (haircut normativo 30%)'
                : tipo === 'PRENDARIA'
                ? 'Factor 50% del valor comercial (haircut normativo 50%)'
                : 'Capacidad anualizada: min(Ingreso × 12 × 30%, Monto Solicitado)'}
            </span>
          </div>

          <div className="text-right">
            <span className="font-mono font-bold text-emerald-950 text-base block">
              {formatMoney(valorRealizableEstimado, sim)}
            </span>
            <span className="text-[10px] text-emerald-700 font-semibold font-mono">
              {montoSolicitado > 0
                ? `${((valorRealizableEstimado / montoSolicitado) * 100).toFixed(1)}% cobertura`
                : '—'}
            </span>
          </div>
        </div>
      </form>
    </Modal>
  )
}
