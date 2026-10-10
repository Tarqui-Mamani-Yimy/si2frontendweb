import { useState } from 'react'
import Modal from '../../../components/ui/Modal'
import Button from '../../../components/ui/Button'
import AlertBanner from '../../../components/ui/AlertBanner'
import { FormField, Input } from '../../../components/ui/FormField'
import CuentaContablePicker from './CuentaContablePicker'
import {
  toCents,
  fromCents,
  formatMoney,
} from './contabilidadUtils'
import { createComprobanteManual } from '../../../core/api/contabilidadApi'
import { getApiErrorMessage } from '../../../core/api/errors'

/**
 * NuevoComprobanteModal — Editor interactivo de comprobantes contables manuales con partida doble (CU-W30).
 * Suma y verifica balances estrictamente en centavos enteros para evitar imprecisiones de coma flotante.
 *
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   onSuccess: (comprobante: object) => void
 * }} props
 */
export default function NuevoComprobanteModal({ open, onClose, onSuccess }) {
  if (!open) return null

  return (
    <NuevoComprobanteForm
      onClose={onClose}
      onSuccess={onSuccess}
    />
  )
}

let lineCounter = 1

function createEmptyLine() {
  return {
    key: ++lineCounter,
    cuenta: null,
    glosa: '',
    debe: '',
    haber: '',
  }
}

function NuevoComprobanteForm({ onClose, onSuccess }) {
  const todayStr = new Date().toISOString().split('T')[0]

  const [tipo, setTipo] = useState('TRASPASO') // 'INGRESO' | 'EGRESO' | 'TRASPASO'
  const [fechaContable, setFechaContable] = useState(todayStr)
  const [monedaId, setMonedaId] = useState(1) // 1: BOB, 2: USD
  const [glosa, setGlosa] = useState('')
  const [lineas, setLineas] = useState([createEmptyLine(), createEmptyLine()])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Calculations strictly in integer cents
  const totalDebeCents = lineas.reduce((acc, l) => acc + toCents(l.debe), 0)
  const totalHaberCents = lineas.reduce((acc, l) => acc + toCents(l.haber), 0)
  const diffCents = Math.abs(totalDebeCents - totalHaberCents)

  const isBalanced = totalDebeCents > 0 && totalDebeCents === totalHaberCents
  const hasMinLines = lineas.length >= 2
  const allAccountsSelected = lineas.every((l) => l.cuenta && l.cuenta.id)
  const allLinesHaveOneSide = lineas.every((l) => {
    const d = toCents(l.debe)
    const h = toCents(l.haber)
    return (d > 0 && h === 0) || (h > 0 && d === 0)
  })
  const isGlosaValid = glosa.trim().length >= 5

  const canSave =
    isBalanced &&
    hasMinLines &&
    allAccountsSelected &&
    allLinesHaveOneSide &&
    isGlosaValid &&
    !loading

  // Handlers for lines
  function handleAddLine() {
    setLineas((prev) => [...prev, createEmptyLine()])
  }

  function handleRemoveLine(index) {
    if (lineas.length <= 2) return
    setLineas((prev) => prev.filter((_, i) => i !== index))
  }

  function handleUpdateLine(index, patch) {
    setLineas((prev) => {
      const copy = [...prev]
      copy[index] = { ...copy[index], ...patch }
      return copy
    })
  }

  function handleDebeChange(index, value) {
    // If setting debe, clear haber
    handleUpdateLine(index, {
      debe: value,
      haber: value ? '' : lineas[index].haber,
    })
  }

  function handleHaberChange(index, value) {
    // If setting haber, clear debe
    handleUpdateLine(index, {
      haber: value,
      debe: value ? '' : lineas[index].debe,
    })
  }

  async function handleSubmit(e) {
    e?.preventDefault()
    setError(null)

    if (!canSave) {
      if (!isGlosaValid) {
        setError('La glosa general debe tener al menos 5 caracteres.')
        return
      }
      if (!allAccountsSelected) {
        setError('Todas las líneas deben tener una cuenta contable seleccionada.')
        return
      }
      if (!allLinesHaveOneSide) {
        setError('Cada línea debe registrar monto en Debe o en Haber, nunca en ambos.')
        return
      }
      if (!isBalanced) {
        setError('El comprobante está descuadrado. La suma del Debe debe ser igual a la del Haber.')
        return
      }
      return
    }

    setLoading(true)
    try {
      const payload = {
        tipo,
        fecha_contable: fechaContable,
        glosa: glosa.trim(),
        moneda_id: Number(monedaId),
        lineas: lineas.map((l) => ({
          plan_cuenta_id: l.cuenta.id,
          debe: fromCents(toCents(l.debe)),
          haber: fromCents(toCents(l.haber)),
          glosa: l.glosa?.trim() || undefined,
        })),
      }

      const data = await createComprobanteManual(payload)
      onSuccess(data)
      onClose()
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          'Error al registrar el comprobante contable manual.',
        ),
      )
    } finally {
      setLoading(false)
    }
  }

  const currencySymbol = Number(monedaId) === 2 ? '$' : 'Bs.'

  return (
    <Modal
      open={true}
      onClose={onClose}
      title="Nuevo Comprobante Contable Manual"
      subtitle="Registro fiduciario con validación de partida doble en tiempo real (CU-W30)"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            {isBalanced ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <span className="material-symbols-outlined text-[15px]">check_circle</span>
                <span>Partida Doble Cuadrada ({formatMoney(fromCents(totalDebeCents), currencySymbol)})</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                <span className="material-symbols-outlined text-[15px]">warning</span>
                <span>Descuadre: {formatMoney(fromCents(diffCents), currencySymbol)}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
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
              type="button"
              variant="primary"
              size="sm"
              loading={loading}
              disabled={!canSave}
              onClick={handleSubmit}
              className="!bg-[#064e3b]"
            >
              Guardar Comprobante
            </Button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <AlertBanner variant="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </AlertBanner>
        )}

        {/* Encabezado del comprobante */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
          {/* Tipo de Comprobante */}
          <div>
            <label htmlFor="comp_tipo" className="font-semibold text-slate-700 block mb-1">
              Tipo de Comprobante:
            </label>
            <select
              id="comp_tipo"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="w-full h-9 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-semibold text-[#0b1c30] outline-none focus:border-[#006c49]"
            >
              <option value="INGRESO">Ingreso (Entrada de Fondos)</option>
              <option value="EGRESO">Egreso (Salida de Fondos)</option>
              <option value="TRASPASO">Traspaso (Movimiento sin Caja)</option>
            </select>
          </div>

          {/* Fecha Contable */}
          <div>
            <label htmlFor="comp_fecha" className="font-semibold text-slate-700 block mb-1">
              Fecha Contable:
            </label>
            <input
              id="comp_fecha"
              type="date"
              max={todayStr}
              value={fechaContable}
              onChange={(e) => setFechaContable(e.target.value)}
              className="w-full h-9 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-mono text-[#0b1c30] outline-none focus:border-[#006c49]"
              required
            />
          </div>

          {/* Moneda */}
          <div>
            <label htmlFor="comp_moneda" className="font-semibold text-slate-700 block mb-1">
              Moneda:
            </label>
            <select
              id="comp_moneda"
              value={monedaId}
              onChange={(e) => setMonedaId(Number(e.target.value))}
              className="w-full h-9 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-semibold text-[#0b1c30] outline-none focus:border-[#006c49]"
            >
              <option value={1}>Bolivianos (BOB - Bs.)</option>
              <option value={2}>Dólares (USD - $)</option>
            </select>
          </div>
        </div>

        {/* Glosa General */}
        <FormField id="comp_glosa" label="Glosa General" required>
          <Input
            id="comp_glosa"
            type="text"
            placeholder="Descripción clara de la operación económica o transacción contable (mínimo 5 caracteres)..."
            value={glosa}
            onChange={(e) => setGlosa(e.target.value)}
            required
          />
        </FormField>

        {/* Editor de Líneas Contables */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Asiento Contable (Líneas de Detalle)
            </span>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleAddLine}
              className="gap-1 text-xs"
            >
              <span className="material-symbols-outlined text-[15px]">add</span>
              <span>Agregar Línea</span>
            </Button>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="py-2 px-3 w-10 text-center">#</th>
                    <th className="py-2 px-3 min-w-[220px]">Cuenta Contable (Imputable)</th>
                    <th className="py-2 px-3 min-w-[160px]">Glosa Específica</th>
                    <th className="py-2 px-3 w-28 text-right">Debe ({currencySymbol})</th>
                    <th className="py-2 px-3 w-28 text-right">Haber ({currencySymbol})</th>
                    <th className="py-2 px-2 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {lineas.map((line, idx) => (
                    <tr key={line.key} className="hover:bg-slate-50/60 transition">
                      <td className="py-2 px-3 text-center text-slate-400 font-mono">
                        {idx + 1}
                      </td>

                      {/* Selector de Cuenta */}
                      <td className="py-2 px-2">
                        <CuentaContablePicker
                          value={line.cuenta}
                          onChange={(acc) => handleUpdateLine(idx, { cuenta: acc })}
                          hasError={!line.cuenta}
                          placeholder="Buscar cuenta imputable..."
                        />
                      </td>

                      {/* Glosa de Línea */}
                      <td className="py-2 px-2">
                        <input
                          type="text"
                          placeholder="Glosa de línea (opcional)..."
                          value={line.glosa}
                          onChange={(e) =>
                            handleUpdateLine(idx, { glosa: e.target.value })
                          }
                          className="w-full h-8 px-2.5 rounded border border-slate-200 text-xs text-slate-800 outline-none focus:border-[#006c49]"
                        />
                      </td>

                      {/* Debe */}
                      <td className="py-2 px-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={line.debe}
                          onChange={(e) => handleDebeChange(idx, e.target.value)}
                          className="w-full h-8 px-2 text-right font-mono text-xs rounded border border-slate-200 text-slate-900 outline-none focus:border-[#006c49]"
                        />
                      </td>

                      {/* Haber */}
                      <td className="py-2 px-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={line.haber}
                          onChange={(e) => handleHaberChange(idx, e.target.value)}
                          className="w-full h-8 px-2 text-right font-mono text-xs rounded border border-slate-200 text-slate-900 outline-none focus:border-[#006c49]"
                        />
                      </td>

                      {/* Eliminar línea */}
                      <td className="py-2 px-2 text-center">
                        <button
                          type="button"
                          disabled={lineas.length <= 2}
                          onClick={() => handleRemoveLine(idx)}
                          className="p-1 text-slate-400 hover:text-red-600 disabled:opacity-30 disabled:hover:text-slate-400 transition"
                          title={
                            lineas.length <= 2
                              ? 'Mínimo 2 líneas requeridas'
                              : 'Eliminar línea'
                          }
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            delete
                          </span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>

                {/* Fila de Totales en Pie */}
                <tfoot className="bg-slate-50/90 border-t-2 border-slate-300 font-semibold text-xs">
                  <tr>
                    <td colSpan={3} className="py-2.5 px-3 text-right text-slate-700 font-bold uppercase tracking-wider">
                      Totales del Comprobante:
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                      {formatMoney(fromCents(totalDebeCents), currencySymbol)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                      {formatMoney(fromCents(totalHaberCents), currencySymbol)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  )
}
