import { useState, useEffect } from 'react'
import Modal from '../../../components/ui/Modal'
import Button from '../../../components/ui/Button'
import AlertBanner from '../../../components/ui/AlertBanner'
import Skeleton from '../../../components/ui/Skeleton'
import { previewLiquidacionDpf, procesarLiquidacionDpf } from '../../../core/api/dpfApi'

function formatMoney(value, simbolo = 'Bs.') {
  const n = typeof value === 'number' ? value : parseFloat(value ?? 0)
  const safe = isNaN(n) ? 0 : n
  return `${simbolo} ${safe.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/**
 * LiquidacionDpfModal — modal de liquidación regular, cancelación anticipada o renovación de DPF (CU-W19).
 *
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   dpf: object,
 *   onSuccess: (resultado: object) => void
 * }} props
 */
export default function LiquidacionDpfModal({ open, onClose, dpf, onSuccess }) {
  const [tipo, setTipo] = useState(() => {
    const yaVencio = Number(dpf?.dias_para_vencer ?? 0) <= 0
    return yaVencio ? 'LIQUIDACION' : 'CANCELACION'
  })
  const [preview, setPreview] = useState(null)
  const [loadingPreview, setLoadingPreview] = useState(true)
  const [errorPreview, setErrorPreview] = useState(null)

  // Opciones específicas para renovación
  const [capitalizar, setCapitalizar] = useState(false)
  const [plazoRenovacion, setPlazoRenovacion] = useState(() => dpf?.plazo_dias || 360)
  const [modalidadRenovacion, setModalidadRenovacion] = useState(() => dpf?.modalidad_pago_interes || 'VENCIMIENTO')

  const [submitting, setSubmitting] = useState(false)
  const [errorSubmit, setErrorSubmit] = useState(null)

  useEffect(() => {
    if (!open || !dpf?.id) return
    let isMounted = true

    previewLiquidacionDpf(dpf.id, tipo)
      .then((data) => {
        if (!isMounted) return
        setPreview(data)
      })
      .catch((err) => {
        if (!isMounted) return
        setErrorPreview(err.response?.data?.detail ?? 'No se pudo obtener la vista previa de liquidación.')
      })
      .finally(() => {
        if (isMounted) setLoadingPreview(false)
      })

    return () => { isMounted = false }
  }, [open, dpf?.id, tipo])

  function handleCambiarTipo(nuevoTipo) {
    if (nuevoTipo === tipo) return
    setLoadingPreview(true)
    setErrorPreview(null)
    setTipo(nuevoTipo)
  }

  if (!open || !dpf) return null

  const sim = dpf.moneda?.simbolo || (typeof dpf.moneda === 'string' ? dpf.moneda : (dpf.moneda?.codigo_iso || 'Bs.'))

  async function handleProcesar() {
    setSubmitting(true)
    setErrorSubmit(null)
    try {
      const payload = { tipo }
      if (tipo === 'RENOVACION') {
        payload.capitalizar = Boolean(capitalizar)
        payload.plazo_dias = parseInt(plazoRenovacion, 10) || dpf.plazo_dias
        payload.modalidad_pago_interes = modalidadRenovacion
      }

      const res = await procesarLiquidacionDpf(dpf.id, payload)
      onSuccess?.(res)
      onClose()
    } catch (err) {
      setErrorSubmit(err.response?.data?.detail ?? 'Error al procesar la operación sobre el DPF.')
    } finally {
      setSubmitting(false)
    }
  }

  const permitido = preview ? Boolean(preview.permitido) : true

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Liquidación / Gestión de DPF"
      subtitle={`Certificado N° ${dpf.numero_certificado ?? '—'} &bull; Titular: ${dpf.socio?.nombre_completo ?? 'Socio'}`}
      footer={
        <div className="flex items-center justify-between w-full">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleProcesar}
            loading={submitting}
            disabled={submitting || !permitido || loadingPreview}
            className={`gap-1.5 ${tipo === 'CANCELACION' ? '!bg-rose-700 hover:!bg-rose-800' : '!bg-[#064e3b]'}`}
          >
            <span className="material-symbols-outlined text-[16px]">
              {tipo === 'RENOVACION' ? 'autorenew' : tipo === 'CANCELACION' ? 'cancel' : 'check_circle'}
            </span>
            <span>
              {tipo === 'RENOVACION'
                ? 'Confirmar Renovación'
                : tipo === 'CANCELACION'
                ? 'Confirmar Cancelación Anticipada'
                : 'Confirmar Liquidación'}
            </span>
          </Button>
        </div>
      }
    >
      <div className="space-y-4 text-xs">

        {/* Selector de Tipo de Operación */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">
            Tipo de Operación a Realizar (CU-W19)
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleCambiarTipo('LIQUIDACION')}
              className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                tipo === 'LIQUIDACION'
                  ? 'border-[#064e3b] bg-emerald-50 text-[#064e3b] font-bold shadow-sm ring-1 ring-[#064e3b]'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                <span>Liquidación</span>
              </div>
              <span className="text-[10px] text-slate-500 font-normal block mt-0.5">Al vencimiento formal</span>
            </button>

            <button
              type="button"
              onClick={() => handleCambiarTipo('RENOVACION')}
              className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                tipo === 'RENOVACION'
                  ? 'border-[#064e3b] bg-emerald-50 text-[#064e3b] font-bold shadow-sm ring-1 ring-[#064e3b]'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">autorenew</span>
                <span>Renovación</span>
              </div>
              <span className="text-[10px] text-slate-500 font-normal block mt-0.5">Nuevo DPF correlativo</span>
            </button>

            <button
              type="button"
              onClick={() => handleCambiarTipo('CANCELACION')}
              className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                tipo === 'CANCELACION'
                  ? 'border-rose-600 bg-rose-50 text-rose-800 font-bold shadow-sm ring-1 ring-rose-600'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">cancel</span>
                <span>Cancelación</span>
              </div>
              <span className="text-[10px] text-slate-500 font-normal block mt-0.5">Retiro anticipado</span>
            </button>
          </div>
        </div>

        {loadingPreview ? (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : errorPreview ? (
          <AlertBanner variant="error" onClose={() => setErrorPreview(null)}>
            {errorPreview}
          </AlertBanner>
        ) : preview ? (
          <div className="space-y-3">

            {/* Alerta de bloqueo normativo si permitido es false */}
            {!preview.permitido && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 space-y-1">
                <div className="flex items-center gap-2 font-bold">
                  <span className="material-symbols-outlined text-rose-600 text-[18px]">block</span>
                  <span>Operación no permitida</span>
                </div>
                <p className="text-xs text-rose-800">{preview.motivo}</p>
              </div>
            )}

            {/* Aviso de penalización para cancelación anticipada */}
            {tipo === 'CANCELACION' && preview.anticipada && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <span className="material-symbols-outlined text-amber-600 text-[18px]">warning</span>
                  <span>Cancelación Anticipada con Penalización</span>
                </div>
                <p className="text-[11px] text-amber-800">
                  El DPF se cancela antes del plazo acordado ({preview.dias_transcurridos} días transcurridos).
                  Los intereses se recalculan a la tasa de penalización del {Number(preview.tasa_aplicada).toFixed(2)}% TNA.
                </p>
              </div>
            )}

            {/* Desglose Financiero */}
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="bg-white p-2 rounded border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Capital</span>
                <span className="font-mono font-bold text-slate-800 text-sm block">
                  {formatMoney(preview.capital, sim)}
                </span>
              </div>
              <div className="bg-white p-2 rounded border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Interés Neto</span>
                <span className="font-mono font-bold text-emerald-800 text-sm block">
                  +{formatMoney(preview.interes_neto, sim)}
                </span>
              </div>
              <div className="bg-white p-2 rounded border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">RC-IVA</span>
                <span className="font-mono text-slate-600 text-xs block">
                  -{formatMoney(preview.retencion_rciva, sim)}
                </span>
              </div>
              <div className="bg-emerald-50 p-2 rounded border border-emerald-200">
                <span className="text-[10px] uppercase font-bold text-emerald-900 block">Total a Abonar</span>
                <span className="font-mono font-bold text-emerald-950 text-sm block">
                  {formatMoney(preview.total_a_abonar, sim)}
                </span>
              </div>
            </div>

            {/* Ajuste por Intereses Periódicos Pagados (CU-W18) */}
            {(parseFloat(preview.interes_ya_pagado ?? 0) > 0 || parseFloat(preview.descuento_capital ?? 0) > 0) && (
              <div className="p-3 rounded-lg bg-indigo-50/70 border border-indigo-200 text-indigo-950 space-y-1.5 text-xs">
                <div className="flex items-center gap-1.5 font-bold">
                  <span className="material-symbols-outlined text-indigo-700 text-[16px]">account_balance</span>
                  <span>Ajuste por Intereses Periódicos Pagados (CU-W18)</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                  <div>
                    <span className="text-slate-500 block">Intereses periódicos ya abonados:</span>
                    <span className="font-mono font-bold text-slate-800">
                      {formatMoney(preview.interes_ya_pagado, sim)}
                    </span>
                  </div>
                  {parseFloat(preview.descuento_capital ?? 0) > 0 && (
                    <div>
                      <span className="text-rose-600 block font-semibold">Deducción sobre capital devuelto:</span>
                      <span className="font-mono font-bold text-rose-700">
                        -{formatMoney(preview.descuento_capital, sim)}
                      </span>
                    </div>
                  )}
                </div>
                {parseFloat(preview.descuento_capital ?? 0) > 0 && (
                  <p className="text-[10px] text-rose-800 italic pt-1 border-t border-indigo-200/50">
                    Al cancelarse anticipadamente, los intereses periódicos ya abonados superaron los intereses recalculados con penalización; la diferencia se deduce del capital devuelto conforme a normativa.
                  </p>
                )}
              </div>
            )}

            {/* Cuenta de Abono */}
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-600">Cuenta de Ahorro Destino de Fondos:</span>
              <span className="font-mono font-bold text-slate-900">
                {preview.cuenta_abono?.numero ?? 'Cuenta del socio'}
              </span>
            </div>

            {/* Opciones Adicionales si es Renovación */}
            {tipo === 'RENOVACION' && (
              <div className="p-3.5 rounded-lg border border-emerald-200 bg-emerald-50/40 space-y-3">
                <span className="font-bold text-slate-800 block text-xs uppercase tracking-wider">
                  Configuración del Nuevo DPF
                </span>

                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={capitalizar}
                    onChange={(e) => setCapitalizar(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#064e3b] focus:ring-[#064e3b]"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      Capitalizar Intereses ({formatMoney(preview.interes_neto, sim)})
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {capitalizar
                        ? `El nuevo DPF se emitirá por un capital consolidado de ${formatMoney(Number(preview.capital) + Number(preview.interes_neto), sim)}.`
                        : `Los intereses se abonarán a la cuenta y el nuevo DPF mantendrá el capital original de ${formatMoney(preview.capital, sim)}.`}
                    </span>
                  </div>
                </label>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-emerald-100">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Nuevo Plazo en Días
                    </label>
                    <input
                      type="number"
                      min="30"
                      value={plazoRenovacion}
                      onChange={(e) => setPlazoRenovacion(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Modalidad de Pago
                    </label>
                    <select
                      value={modalidadRenovacion}
                      onChange={(e) => setModalidadRenovacion(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded"
                    >
                      <option value="VENCIMIENTO">Al Vencimiento</option>
                      <option value="MENSUAL">Mensual</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : null}

        {errorSubmit && (
          <AlertBanner variant="error" onClose={() => setErrorSubmit(null)}>
            {errorSubmit}
          </AlertBanner>
        )}
      </div>
    </Modal>
  )
}
