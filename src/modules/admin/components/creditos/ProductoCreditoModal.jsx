import { useState } from 'react'
import Modal from '../../../../components/ui/Modal'
import Button from '../../../../components/ui/Button'
import AlertBanner from '../../../../components/ui/AlertBanner'
import { FormField, Input, Textarea } from '../../../../components/ui/FormField'
import { crearProductoCredito, actualizarProductoCredito } from '../../../../core/api/creditosApi'

/**
 * ProductoCreditoModal — Creación y edición institucional de productos crediticios (CU-W20).
 *
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   producto: object|null,
 *   monedas: Array<{id: number, codigo_iso: string, nombre: string, simbolo: string}>,
 *   onSuccess: () => void
 * }} props
 */
export default function ProductoCreditoModal({
  open,
  onClose,
  producto,
  monedas = [],
  onSuccess,
}) {
  const isEdit = Boolean(producto)

  const [form, setForm] = useState(() => ({
    codigo: producto?.codigo ?? '',
    nombre: producto?.nombre ?? '',
    descripcion: producto?.descripcion ?? '',
    moneda_id: producto?.moneda?.id ?? (monedas[0]?.id ?? 1),
    monto_min: producto?.monto_min != null ? String(producto.monto_min) : '',
    monto_max: producto?.monto_max != null ? String(producto.monto_max) : '',
    plazo_min_meses: producto?.plazo_min_meses != null ? String(producto.plazo_min_meses) : '',
    plazo_max_meses: producto?.plazo_max_meses != null ? String(producto.plazo_max_meses) : '',
    tasa_interes_anual: producto?.tasa_interes_anual != null ? String(producto.tasa_interes_anual) : '',
    tipo_amortizacion: producto?.tipo_amortizacion ?? 'FRANCES',
    dias_gracia_mora: producto?.dias_gracia_mora != null ? String(producto.dias_gracia_mora) : '0',
    tasa_mora_anual: producto?.tasa_mora_anual != null ? String(producto.tasa_mora_anual) : '0.00',
    relacion_cuota_ingreso_max: producto?.relacion_cuota_ingreso_max != null ? String(producto.relacion_cuota_ingreso_max) : '40.00',
    requiere_garantia: Boolean(producto?.requiere_garantia ?? false),
  }))

  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState(null)
  const [saving, setSaving] = useState(false)

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  function validate() {
    const errs = {}

    if (!isEdit) {
      const trimmedCodigo = form.codigo.trim().toUpperCase()
      if (!trimmedCodigo) {
        errs.codigo = 'El código del producto es obligatorio.'
      } else if (!/^[A-Z0-9-]{2,20}$/.test(trimmedCodigo)) {
        errs.codigo = 'Debe tener entre 2 y 20 caracteres (solo letras mayúsculas, números y guiones).'
      }
    }

    if (!form.nombre.trim()) {
      errs.nombre = 'El nombre del producto es obligatorio.'
    } else if (form.nombre.trim().length > 100) {
      errs.nombre = 'El nombre no puede exceder los 100 caracteres.'
    }

    if (!form.moneda_id) {
      errs.moneda_id = 'Debe seleccionar una moneda.'
    }

    const minMonto = parseFloat(form.monto_min)
    const maxMonto = parseFloat(form.monto_max)
    if (isNaN(minMonto) || minMonto <= 0) {
      errs.monto_min = 'Debe ser mayor a cero.'
    }
    if (isNaN(maxMonto) || maxMonto <= 0) {
      errs.monto_max = 'Debe ser mayor a cero.'
    } else if (!isNaN(minMonto) && maxMonto < minMonto) {
      errs.monto_max = 'No puede ser menor al monto mínimo.'
    }

    const minPlazo = parseInt(form.plazo_min_meses, 10)
    const maxPlazo = parseInt(form.plazo_max_meses, 10)
    if (isNaN(minPlazo) || minPlazo <= 0) {
      errs.plazo_min_meses = 'Debe ser al menos 1 mes.'
    }
    if (isNaN(maxPlazo) || maxPlazo <= 0) {
      errs.plazo_max_meses = 'Debe ser al menos 1 mes.'
    } else if (!isNaN(minPlazo) && maxPlazo < minPlazo) {
      errs.plazo_max_meses = 'No puede ser menor al plazo mínimo.'
    }

    const tasa = parseFloat(form.tasa_interes_anual)
    if (isNaN(tasa) || tasa < 0 || tasa > 100) {
      errs.tasa_interes_anual = 'Debe estar entre 0.00% y 100.00%.'
    }

    if (!['FRANCES', 'ALEMAN'].includes(form.tipo_amortizacion)) {
      errs.tipo_amortizacion = 'Seleccione un sistema de amortización válido.'
    }

    const diasGracia = parseInt(form.dias_gracia_mora, 10)
    if (isNaN(diasGracia) || diasGracia < 0) {
      errs.dias_gracia_mora = 'Debe ser 0 o un valor positivo.'
    }

    const tasaMora = parseFloat(form.tasa_mora_anual)
    if (isNaN(tasaMora) || tasaMora < 0 || tasaMora > 100) {
      errs.tasa_mora_anual = 'Debe estar entre 0.00% y 100.00%.'
    }

    const rci = parseFloat(form.relacion_cuota_ingreso_max)
    if (isNaN(rci) || rci <= 0 || rci > 100) {
      errs.relacion_cuota_ingreso_max = 'Debe ser mayor a 0% y menor o igual a 100%.'
    }

    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setApiError(null)

    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setSaving(true)

    try {
      const payloadBase = {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || null,
        moneda_id: Number(form.moneda_id),
        monto_min: parseFloat(form.monto_min).toFixed(2),
        monto_max: parseFloat(form.monto_max).toFixed(2),
        plazo_min_meses: parseInt(form.plazo_min_meses, 10),
        plazo_max_meses: parseInt(form.plazo_max_meses, 10),
        tasa_interes_anual: parseFloat(form.tasa_interes_anual).toFixed(2),
        tipo_amortizacion: form.tipo_amortizacion,
        dias_gracia_mora: parseInt(form.dias_gracia_mora, 10),
        tasa_mora_anual: parseFloat(form.tasa_mora_anual).toFixed(2),
        relacion_cuota_ingreso_max: parseFloat(form.relacion_cuota_ingreso_max).toFixed(2),
        requiere_garantia: Boolean(form.requiere_garantia),
      }

      if (isEdit) {
        // En PUT, el código es inmutable por contrato
        await actualizarProductoCredito(producto.id, payloadBase)
      } else {
        await crearProductoCredito({
          ...payloadBase,
          codigo: form.codigo.trim().toUpperCase(),
        })
      }

      onSuccess?.()
      onClose()
    } catch (err) {
      const detail = err.response?.data?.detail
      setApiError(detail || (isEdit ? 'Error al actualizar el producto.' : 'Error al registrar el producto.'))
    } finally {
      setSaving(false)
    }
  }

  const selectedMoneda = monedas.find((m) => Number(m.id) === Number(form.moneda_id))
  const monedaSimbolo = selectedMoneda?.simbolo || 'Bs.'

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? `Editar Producto: ${producto?.codigo}` : 'Nuevo Producto Crediticio'}
      subtitle="Definición de tasas, montos, plazos y condiciones operativas (CU-W20)"
      footer={
        <div className="flex w-full items-center justify-between">
          <Button variant="secondary" size="sm" type="button" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="primary" size="sm" type="submit" form="producto-credito-form" loading={saving}>
            {isEdit ? 'Guardar Cambios' : 'Crear Producto'}
          </Button>
        </div>
      }
    >
      <form id="producto-credito-form" onSubmit={handleSubmit} className="space-y-5">
        {apiError && (
          <AlertBanner variant="error" onClose={() => setApiError(null)}>
            {apiError}
          </AlertBanner>
        )}

        {/* ── Sección 1: Identificación y Moneda ── */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-1.5">
            <span className="material-symbols-outlined text-[18px] text-[#064e3b]">badge</span>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Identificación del Producto
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <FormField id="codigo" label="Código Único" required={!isEdit} error={errors.codigo}>
                <Input
                  id="codigo"
                  value={form.codigo}
                  onChange={(e) => handleChange('codigo', e.target.value.toUpperCase())}
                  placeholder="Ej. CONS-BOB"
                  disabled={isEdit}
                  hasError={Boolean(errors.codigo)}
                  className="font-mono uppercase font-bold"
                />
              </FormField>
              {isEdit && (
                <p className="mt-1 text-[10px] text-slate-400">El código es inmutable tras su creación.</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <FormField id="nombre" label="Nombre Comercial" required error={errors.nombre}>
                <Input
                  id="nombre"
                  value={form.nombre}
                  onChange={(e) => handleChange('nombre', e.target.value)}
                  placeholder="Ej. Crédito de Consumo Personal"
                  hasError={Boolean(errors.nombre)}
                />
              </FormField>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <FormField id="moneda_id" label="Moneda" required error={errors.moneda_id}>
                <select
                  id="moneda_id"
                  value={form.moneda_id}
                  onChange={(e) => handleChange('moneda_id', e.target.value)}
                  className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50/60 px-3 text-sm text-[#0b1c30] outline-none transition focus:border-[#006c49] focus:bg-white focus:ring-2 focus:ring-[#006c49]/20"
                >
                  {monedas.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.codigo_iso} ({m.simbolo}) — {m.nombre}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            <div className="sm:col-span-2">
              <FormField id="descripcion" label="Descripción (Opcional)">
                <Textarea
                  id="descripcion"
                  value={form.descripcion}
                  onChange={(e) => handleChange('descripcion', e.target.value)}
                  placeholder="Detalle el público objetivo, destino permitido o características generales..."
                  rows={2}
                  className="min-h-[70px]"
                />
              </FormField>
            </div>
          </div>
        </div>

        {/* ── Sección 2: Montos y Plazos ── */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-1.5">
            <span className="material-symbols-outlined text-[18px] text-[#064e3b]">payments</span>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Montos y Plazos de Amortización
            </h4>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField
              id="monto_min"
              label={`Monto Mínimo (${monedaSimbolo})`}
              required
              error={errors.monto_min}
            >
              <Input
                id="monto_min"
                type="number"
                step="0.01"
                min="0.01"
                value={form.monto_min}
                onChange={(e) => handleChange('monto_min', e.target.value)}
                placeholder="1000.00"
                hasError={Boolean(errors.monto_min)}
                className="tabular-nums"
              />
            </FormField>

            <FormField
              id="monto_max"
              label={`Monto Máximo (${monedaSimbolo})`}
              required
              error={errors.monto_max}
            >
              <Input
                id="monto_max"
                type="number"
                step="0.01"
                min="0.01"
                value={form.monto_max}
                onChange={(e) => handleChange('monto_max', e.target.value)}
                placeholder="50000.00"
                hasError={Boolean(errors.monto_max)}
                className="tabular-nums"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField
              id="plazo_min_meses"
              label="Plazo Mínimo (Meses)"
              required
              error={errors.plazo_min_meses}
            >
              <Input
                id="plazo_min_meses"
                type="number"
                step="1"
                min="1"
                value={form.plazo_min_meses}
                onChange={(e) => handleChange('plazo_min_meses', e.target.value)}
                placeholder="6"
                hasError={Boolean(errors.plazo_min_meses)}
                className="tabular-nums"
              />
            </FormField>

            <FormField
              id="plazo_max_meses"
              label="Plazo Máximo (Meses)"
              required
              error={errors.plazo_max_meses}
            >
              <Input
                id="plazo_max_meses"
                type="number"
                step="1"
                min="1"
                value={form.plazo_max_meses}
                onChange={(e) => handleChange('plazo_max_meses', e.target.value)}
                placeholder="48"
                hasError={Boolean(errors.plazo_max_meses)}
                className="tabular-nums"
              />
            </FormField>
          </div>
        </div>

        {/* ── Sección 3: Tasas y Sistema de Amortización ── */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-1.5">
            <span className="material-symbols-outlined text-[18px] text-[#064e3b]">percent</span>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Tasas y Reglas Financieras
            </h4>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField
              id="tasa_interes_anual"
              label="Tasa Interés Nominal (TNA %)"
              required
              error={errors.tasa_interes_anual}
            >
              <Input
                id="tasa_interes_anual"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={form.tasa_interes_anual}
                onChange={(e) => handleChange('tasa_interes_anual', e.target.value)}
                placeholder="18.00"
                hasError={Boolean(errors.tasa_interes_anual)}
                className="tabular-nums font-bold"
              />
            </FormField>

            <FormField
              id="tipo_amortizacion"
              label="Sistema de Amortización"
              required
              error={errors.tipo_amortizacion}
            >
              <select
                id="tipo_amortizacion"
                value={form.tipo_amortizacion}
                onChange={(e) => handleChange('tipo_amortizacion', e.target.value)}
                className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50/60 px-3 text-sm text-[#0b1c30] outline-none transition focus:border-[#006c49] focus:bg-white focus:ring-2 focus:ring-[#006c49]/20"
              >
                <option value="FRANCES">Francés (Cuota fija periódica)</option>
                <option value="ALEMAN">Alemán (Capital fijo decreciente)</option>
              </select>
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FormField
              id="dias_gracia_mora"
              label="Días Gracia Mora"
              error={errors.dias_gracia_mora}
            >
              <Input
                id="dias_gracia_mora"
                type="number"
                step="1"
                min="0"
                value={form.dias_gracia_mora}
                onChange={(e) => handleChange('dias_gracia_mora', e.target.value)}
                placeholder="0"
                hasError={Boolean(errors.dias_gracia_mora)}
                className="tabular-nums"
              />
            </FormField>

            <FormField
              id="tasa_mora_anual"
              label="Tasa Mora Penal (TNA %)"
              error={errors.tasa_mora_anual}
            >
              <Input
                id="tasa_mora_anual"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={form.tasa_mora_anual}
                onChange={(e) => handleChange('tasa_mora_anual', e.target.value)}
                placeholder="3.00"
                hasError={Boolean(errors.tasa_mora_anual)}
                className="tabular-nums"
              />
            </FormField>

            <FormField
              id="relacion_cuota_ingreso_max"
              label="RCI Máx. (%)"
              error={errors.relacion_cuota_ingreso_max}
            >
              <Input
                id="relacion_cuota_ingreso_max"
                type="number"
                step="0.01"
                min="0.01"
                max="100"
                value={form.relacion_cuota_ingreso_max}
                onChange={(e) => handleChange('relacion_cuota_ingreso_max', e.target.value)}
                placeholder="40.00"
                hasError={Boolean(errors.relacion_cuota_ingreso_max)}
                className="tabular-nums"
              />
            </FormField>
          </div>
        </div>

        {/* ── Sección 4: Requisitos Adicionales ── */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              id="requiere_garantia"
              checked={form.requiere_garantia}
              onChange={(e) => handleChange('requiere_garantia', e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#064e3b] focus:ring-[#064e3b]"
            />
            <div className="text-xs">
              <span className="font-semibold text-slate-800 block">
                Requiere Garantía Obligatoria
              </span>
              <span className="text-slate-500 text-[11px] leading-relaxed">
                Si está marcado, las solicitudes de crédito asociadas a este producto exigirán registrar al menos una garantía o respaldo fiduciario.
              </span>
            </div>
          </label>
        </div>
      </form>
    </Modal>
  )
}
