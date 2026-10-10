import { useState } from 'react'
import { previewTransferencia, procesarTransferencia } from '../../../core/api/cajaApi'
import Button from '../../../components/ui/Button'
import AlertBanner from '../../../components/ui/AlertBanner'
import Skeleton from '../../../components/ui/Skeleton'

function formatMoney(value, simbolo = 'Bs') {
  const n = Number(value ?? 0)
  return `${simbolo} ${n.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function TransferenciaTab({ onTransferenciaExitosa }) {
  const [numOrigen, setNumOrigen] = useState('')
  const [numDestino, setNumDestino] = useState('')
  const [consultando, setConsultando] = useState(false)
  const [preview, setPreview] = useState(null)

  const [monto, setMonto] = useState('')
  const [glosa, setGlosa] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)

  async function handleConsultarPreview(e) {
    e?.preventDefault()
    setErrorMsg(null)

    if (!numOrigen.trim() || !numDestino.trim()) {
      setErrorMsg('Debe ingresar tanto la cuenta de origen como la cuenta de destino.')
      return
    }

    if (numOrigen.trim() === numDestino.trim()) {
      setErrorMsg('La cuenta de origen y destino no pueden ser iguales.')
      return
    }

    setConsultando(true)
    try {
      const data = await previewTransferencia({
        origen: numOrigen.trim(),
        destino: numDestino.trim(),
      })
      setPreview(data)
    } catch (err) {
      setErrorMsg(err.response?.data?.detail ?? 'No se pudo validar las cuentas para la transferencia.')
      setPreview(null)
    } finally {
      setConsultando(false)
    }
  }

  function handleReset() {
    setPreview(null)
    setMonto('')
    setGlosa('')
    setErrorMsg(null)
  }

  async function handleSubmitTransferencia(e) {
    e.preventDefault()
    setErrorMsg(null)

    if (!preview) {
      setErrorMsg('Primero debe validar las cuentas.')
      return
    }

    const montoNum = parseFloat(monto)
    if (isNaN(montoNum) || montoNum <= 0) {
      setErrorMsg('El monto a transferir debe ser mayor a cero.')
      return
    }

    const saldoDisponible = parseFloat(preview.origen?.saldo_disponible ?? 0)
    if (montoNum > saldoDisponible) {
      setErrorMsg(`Fondos insuficientes. El saldo disponible en la cuenta origen es ${formatMoney(saldoDisponible, preview.origen?.moneda?.simbolo)}.`)
      return
    }

    setSubmitting(true)
    try {
      const recibo = await procesarTransferencia({
        cuenta_origen_id: preview.origen.cuenta_id,
        cuenta_destino_id: preview.destino.cuenta_id,
        monto: montoNum.toFixed(2),
        glosa: glosa.trim() || undefined,
      })

      handleReset()
      setNumOrigen('')
      setNumDestino('')
      onTransferenciaExitosa(recibo)
    } catch (err) {
      setErrorMsg(err.response?.data?.detail ?? 'Error al procesar la transferencia en ventanilla.')
    } finally {
      setSubmitting(false)
    }
  }

  const simbolo = preview?.origen?.moneda?.simbolo ?? 'Bs'

  return (
    <div className="space-y-6">

      {/* ── Paso 1: Ingreso de Cuentas para Preview ── */}
      <div className="rounded-xl bg-white border border-[#e2e8f0] p-5 shadow-card">
        <h3 className="font-display text-sm font-bold text-[#0b1c30] uppercase tracking-wider mb-1">
          1. Cuentas Participantes en la Transferencia Interna
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Ingrese las cuentas de la misma cooperativa para debitar y acreditar fondos de forma inmediata (CU-W13).
        </p>

        <form onSubmit={handleConsultarPreview} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Cuenta Origen */}
            <div>
              <label htmlFor="numOrigen" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Número de Cuenta Origen (Débito) *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                  <span className="material-symbols-outlined text-[20px]">account_balance</span>
                </span>
                <input
                  id="numOrigen"
                  type="text"
                  required
                  value={numOrigen}
                  onChange={(e) => {
                    setNumOrigen(e.target.value)
                    if (preview) setPreview(null)
                  }}
                  placeholder="ej. CTA-100234"
                  disabled={consultando || submitting}
                  className="w-full pl-10 pr-4 h-10 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#006c49] focus:ring-2 focus:ring-[#006c49]/20 outline-none transition font-mono"
                />
              </div>
            </div>

            {/* Cuenta Destino */}
            <div>
              <label htmlFor="numDestino" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Número de Cuenta Destino (Abono) *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                  <span className="material-symbols-outlined text-[20px]">send</span>
                </span>
                <input
                  id="numDestino"
                  type="text"
                  required
                  value={numDestino}
                  onChange={(e) => {
                    setNumDestino(e.target.value)
                    if (preview) setPreview(null)
                  }}
                  placeholder="ej. CTA-200567"
                  disabled={consultando || submitting}
                  className="w-full pl-10 pr-4 h-10 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#006c49] focus:ring-2 focus:ring-[#006c49]/20 outline-none transition font-mono"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            {preview && (
              <Button type="button" variant="secondary" onClick={handleReset}>
                Modificar Cuentas
              </Button>
            )}
            <Button
              type="submit"
              variant="primary"
              loading={consultando}
              disabled={consultando || submitting || !numOrigen.trim() || !numDestino.trim()}
            >
              <span className="material-symbols-outlined text-[18px]">verified_user</span>
              <span>Validar Cuentas y Titulares</span>
            </Button>
          </div>
        </form>
      </div>

      {consultando && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      )}

      {/* ── Paso 2: Confirmación con Titulares y Monto ── */}
      {preview && (
        <div className="rounded-xl bg-white border border-[#e2e8f0] p-6 shadow-card animate-slide-up space-y-5">
          <div>
            <h3 className="font-display text-base font-bold text-[#0b1c30]">
              2. Verificación de Titularidad y Monto del Traspaso
            </h3>
            <p className="text-xs text-slate-500">
              Verifique cuidadosamente los nombres de los titulares antes de confirmar la transacción.
            </p>
          </div>

          {/* Comparativa de Cuentas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Tarjeta Origen */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Cuenta de Débito (Origen)
              </span>
              <p className="font-mono font-bold text-sm text-slate-900">{preview.origen?.numero}</p>
              <p className="text-sm font-semibold text-slate-800 mt-1">{preview.origen?.titular?.nombre_completo}</p>
              <div className="mt-3 pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs">
                <span className="text-slate-500">Saldo disponible:</span>
                <span className="font-display font-bold text-emerald-800 tabular-nums">
                  {formatMoney(preview.origen?.saldo_disponible, preview.origen?.moneda?.simbolo)}
                </span>
              </div>
            </div>

            {/* Tarjeta Destino */}
            <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#006c49] block mb-1">
                Cuenta de Abono (Destino)
              </span>
              <p className="font-mono font-bold text-sm text-slate-900">{preview.destino?.numero}</p>
              <p className="text-sm font-semibold text-slate-800 mt-1">{preview.destino?.titular?.nombre_completo}</p>
              <div className="mt-3 pt-2 border-t border-emerald-200/80 flex items-center justify-between text-xs">
                <span className="text-slate-500">Moneda:</span>
                <span className="font-semibold text-slate-700">
                  {preview.destino?.moneda?.nombre ?? 'Misma moneda'}
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmitTransferencia} className="space-y-4 pt-2">
            {/* Monto a Transferir */}
            <div>
              <label htmlFor="montoTransferencia" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Monto a Transferir ({simbolo}) *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400 font-bold text-sm">
                  {simbolo}
                </span>
                <input
                  id="montoTransferencia"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={preview.origen?.saldo_disponible}
                  required
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  placeholder="0.00"
                  disabled={submitting}
                  className="w-full pl-12 pr-4 h-11 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-display text-lg font-bold placeholder:text-slate-400 focus:bg-white focus:border-[#006c49] focus:ring-2 focus:ring-[#006c49]/20 outline-none transition font-mono tabular-nums"
                />
              </div>
            </div>

            {/* Glosa / Concepto Opcional */}
            <div>
              <label htmlFor="glosa" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Concepto / Glosa (Opcional)
              </label>
              <input
                id="glosa"
                type="text"
                value={glosa}
                onChange={(e) => setGlosa(e.target.value)}
                placeholder="ej. Traspaso por compra de mercadería / Préstamo personal"
                disabled={submitting}
                className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#006c49] focus:ring-2 focus:ring-[#006c49]/20 outline-none transition"
              />
            </div>

            {/* Error Message */}
            {errorMsg && (
              <AlertBanner variant="error" onClose={() => setErrorMsg(null)}>
                {errorMsg}
              </AlertBanner>
            )}

            {/* Botón Submit */}
            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={submitting}
                disabled={submitting || !monto || parseFloat(monto) <= 0}
                className="w-full bg-[#064e3b] hover:bg-[#0c4f30] text-white"
              >
                <span className="material-symbols-outlined text-[20px]">swap_horiz</span>
                <span>Confirmar y Ejecutar Transferencia</span>
              </Button>
            </div>
          </form>
        </div>
      )}

      {errorMsg && !preview && (
        <AlertBanner variant="error" onClose={() => setErrorMsg(null)}>
          {errorMsg}
        </AlertBanner>
      )}
    </div>
  )
}
