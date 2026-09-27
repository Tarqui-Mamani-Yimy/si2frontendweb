import { useState } from 'react'
import Modal from '../../../components/ui/Modal'
import Button from '../../../components/ui/Button'
import AlertBanner from '../../../components/ui/AlertBanner'
import { FormField, Input } from '../../../components/ui/FormField'
import { procesarInteresesDpf } from '../../../core/api/dpfApi'

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
 * ProcesarInteresesModal — Corrida de procesamiento y abono de intereses de DPFs mensuales (CU-W18).
 * Exclusivo para Oficial de Crédito y Administrador.
 *
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   onSuccess?: (resultado: object) => void
 * }} props
 */
export default function ProcesarInteresesModal({ open, onClose, onSuccess }) {
  const todayStr = new Date().toISOString().split('T')[0]
  const [fechaCorte, setFechaCorte] = useState(todayStr)
  const [processing, setProcessing] = useState(false)
  const [apiError, setApiError] = useState(null)
  const [resultado, setResultado] = useState(null)

  if (!open) return null

  async function handleEjecutar(e) {
    e?.preventDefault()
    setApiError(null)
    setProcessing(true)

    try {
      const payload = {}
      if (fechaCorte) {
        payload.fecha = fechaCorte
      }
      const data = await procesarInteresesDpf(payload)
      setResultado(data)
      onSuccess?.(data)
    } catch (err) {
      setApiError(
        err.response?.data?.detail ??
          'Error al ejecutar la corrida de pago de intereses de DPF.',
      )
    } finally {
      setProcessing(false)
    }
  }

  function handleCerrar() {
    setResultado(null)
    setApiError(null)
    onClose()
  }

  const omitidos = Array.isArray(resultado?.omitidos) ? resultado.omitidos : []
  const pagos = Array.isArray(resultado?.pagos) ? resultado.pagos : []
  const totalesMoneda = Array.isArray(resultado?.total_neto_por_moneda)
    ? resultado.total_neto_por_moneda
    : []

  return (
    <Modal
      open={open}
      onClose={handleCerrar}
      title="Procesar Pago Periódico de Intereses DPF"
      subtitle="Abono de cuotas devengadas en cuentas de ahorro (CU-W18)"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleCerrar}
            disabled={processing}
          >
            {resultado ? 'Finalizar' : 'Cancelar'}
          </Button>

          {!resultado && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              loading={processing}
              onClick={handleEjecutar}
              className="gap-1.5 bg-[#064e3b] text-white hover:bg-[#043327]"
            >
              <span className="material-symbols-outlined text-[16px]">payments</span>
              <span>Ejecutar Corrida de Pago</span>
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        {apiError && (
          <AlertBanner variant="error" dismissible onDismiss={() => setApiError(null)}>
            {apiError}
          </AlertBanner>
        )}

        {!resultado ? (
          <div className="space-y-3">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <span className="material-symbols-outlined text-[18px] text-[#064e3b]">
                  info
                </span>
                <span>Procesamiento Automático de Cronogramas Mensuales</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Esta corrida buscará todas las cuotas de cronograma en estado <strong>PENDIENTE</strong> cuya fecha de pago sea menor o igual a la fecha de corte, de DPFs vigentes con modalidad <strong>MENSUAL</strong>. Se abonará el interés neto en la cuenta del socio y se registrará la retención RC-IVA correspondiente.
              </p>
            </div>

            <FormField
              id="fecha_corte"
              label="Fecha de Corte para el Pago"
              required
            >
              <Input
                id="fecha_corte"
                type="date"
                max={todayStr}
                value={fechaCorte}
                onChange={(e) => setFechaCorte(e.target.value)}
                className="max-w-xs font-mono"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Por defecto hoy ({formatDate(todayStr)}). Puede indicar una fecha anterior para regularización.
              </p>
            </FormField>
          </div>
        ) : (
          <div className="space-y-4">
            {/* ── Banner de Éxito / Resumen General ── */}
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/80 space-y-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-emerald-700">
                  check_circle
                </span>
                <span className="font-bold text-emerald-950 text-sm">
                  Corrida ejecutada exitosamente ({formatDate(resultado.fecha)})
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-emerald-200/60 text-xs">
                <div>
                  <span className="text-[10px] text-emerald-800 uppercase font-semibold block">
                    DPFs Evaluados
                  </span>
                  <span className="font-mono font-bold text-emerald-950 text-base">
                    {resultado.dpf_procesados ?? 0}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-emerald-800 uppercase font-semibold block">
                    Cuotas Pagadas
                  </span>
                  <span className="font-mono font-bold text-emerald-950 text-base">
                    {resultado.cuotas_pagadas ?? 0}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-emerald-800 uppercase font-semibold block">
                    DPFs Omitidos
                  </span>
                  <span className={`font-mono font-bold text-base ${omitidos.length > 0 ? 'text-amber-800' : 'text-emerald-950'}`}>
                    {omitidos.length}
                  </span>
                </div>
              </div>
            </div>

            {/* ── Totales Abonados por Moneda ── */}
            {totalesMoneda.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block">
                  Total Neto Abonado a Cuentas de Ahorro
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {totalesMoneda.map((tm, idx) => {
                    const sim =
                      typeof tm.moneda === 'object'
                        ? tm.moneda?.simbolo
                        : tm.moneda || 'Bs.'
                    const iso =
                      typeof tm.moneda === 'object'
                        ? tm.moneda?.codigo_iso
                        : tm.moneda || 'BOB'
                    return (
                      <div
                        key={idx}
                        className="p-3 rounded-lg border border-slate-200 bg-white flex items-center justify-between"
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-800">
                            {iso}
                          </span>
                          <span className="text-slate-600 font-medium">Moneda</span>
                        </div>
                        <span className="font-mono font-bold text-emerald-800 text-sm">
                          {formatMoney(tm.total, sim)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── Alertas de DPFs Omitidos ── */}
            {omitidos.length > 0 && (
              <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/70 space-y-2">
                <div className="flex items-center gap-1.5 text-amber-900 font-bold">
                  <span className="material-symbols-outlined text-[17px] text-amber-700">
                    warning
                  </span>
                  <span>DPFs Omitidos en esta corrida ({omitidos.length})</span>
                </div>
                <div className="space-y-1">
                  {omitidos.map((o, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded bg-white border border-amber-200/80 text-[11px] flex items-center justify-between gap-2"
                    >
                      <span className="font-mono font-bold text-slate-800">
                        {o.numero_certificado || `DPF #${o.dpf_id}`}
                      </span>
                      <span className="text-rose-700 italic">
                        {o.motivo || 'Cuenta de abono inactiva'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Desglose de Cuotas Pagadas ── */}
            {pagos.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block">
                  Detalle de Pagos Realizados ({pagos.length})
                </span>
                <div className="max-h-56 overflow-y-auto rounded-lg border border-slate-200 bg-white">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200 sticky top-0">
                      <tr>
                        <th className="py-2 px-3">Certificado / Socio</th>
                        <th className="py-2 px-3 text-center">Cuota</th>
                        <th className="py-2 px-3 text-right">Neto Abonado</th>
                        <th className="py-2 px-3">Cuenta Destino</th>
                        <th className="py-2 px-3 text-center">Transacción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[11px]">
                      {pagos.map((p, idx) => {
                        const sim =
                          typeof p.moneda === 'object'
                            ? p.moneda?.simbolo
                            : p.moneda || 'Bs.'
                        return (
                          <tr key={idx} className="hover:bg-slate-50/60">
                            <td className="py-2 px-3">
                              <span className="font-mono font-bold text-slate-900 block">
                                {p.dpf?.numero_certificado || `DPF #${p.dpf?.id}`}
                              </span>
                              <span className="text-slate-500 text-[10px] block">
                                {p.socio?.nombre_completo}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-center font-mono">
                              #{p.numero} ({p.dias}d)
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-emerald-800">
                              {formatMoney(p.interes_neto, sim)}
                            </td>
                            <td className="py-2 px-3 font-mono text-slate-700">
                              {p.cuenta_abono?.numero || '—'}
                            </td>
                            <td className="py-2 px-3 text-center font-mono text-[10px] text-slate-500">
                              #{p.transaccion_id}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}
