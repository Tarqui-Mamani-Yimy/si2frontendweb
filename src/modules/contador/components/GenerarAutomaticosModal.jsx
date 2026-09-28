import { useState } from 'react'
import Modal from '../../../components/ui/Modal'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import AlertBanner from '../../../components/ui/AlertBanner'
import { generarComprobantesAutomaticos } from '../../../core/api/contabilidadApi'
import { getApiErrorMessage } from '../../../core/api/errors'

/**
 * GenerarAutomaticosModal — Corrida de generación de comprobantes contables a partir de transacciones operativas (CU-W30).
 *
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   onSuccess?: (resultado: object) => void
 * }} props
 */
export default function GenerarAutomaticosModal({ open, onClose, onSuccess }) {
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [resultado, setResultado] = useState(null)

  if (!open) return null

  async function handleEjecutar(e) {
    e?.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const payload = {}
      if (desde) payload.desde = desde
      if (hasta) payload.hasta = hasta

      const data = await generarComprobantesAutomaticos(payload)
      setResultado(data)
      onSuccess?.(data)
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          'Error al ejecutar la generación de comprobantes automáticos.',
        ),
      )
    } finally {
      setLoading(false)
    }
  }

  function handleCerrar() {
    setResultado(null)
    setError(null)
    onClose()
  }

  const omitidas = Array.isArray(resultado?.omitidas) ? resultado.omitidas : []
  const porTipo = resultado?.por_tipo || {}

  return (
    <Modal
      open={open}
      onClose={handleCerrar}
      title="Generar Comprobantes Automáticos"
      subtitle="Contabilización de transacciones operativas (Caja, Ahorros, Créditos, DPF) (CU-W30)"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleCerrar}
            disabled={loading}
          >
            {resultado ? 'Finalizar' : 'Cancelar'}
          </Button>

          {!resultado && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              loading={loading}
              onClick={handleEjecutar}
              className="!bg-[#064e3b]"
            >
              Iniciar Generación
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        {error && (
          <AlertBanner variant="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </AlertBanner>
        )}

        {!resultado ? (
          <div className="space-y-3.5">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 space-y-1.5 leading-relaxed">
              <p className="font-semibold text-slate-900">
                Reglas de contabilización automática fiduciaria:
              </p>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-600">
                <li>Aperturas, depósitos y retiros de ahorro (Caja ↔ Ahorro).</li>
                <li>Transferencias internas entre socios (Traspaso entre cuentas).</li>
                <li>Desembolsos y cobro de cuotas de créditos (Capital e Intereses).</li>
                <li>Constitución, liquidación y pago de intereses de DPFs.</li>
              </ul>
              <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                El proceso es <strong>idempotente</strong>: las transacciones previamente contabilizadas no se duplicarán.
              </p>
            </div>

            {/* Rango de fechas opcional */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-white border border-slate-200 rounded-xl">
              <div>
                <label htmlFor="gen_desde" className="font-semibold text-slate-700 block mb-1">
                  Desde fecha (opcional):
                </label>
                <input
                  id="gen_desde"
                  type="date"
                  value={desde}
                  onChange={(e) => setDesde(e.target.value)}
                  className="w-full h-8 px-2.5 rounded border border-slate-300 font-mono text-xs outline-none focus:border-[#006c49]"
                />
              </div>

              <div>
                <label htmlFor="gen_hasta" className="font-semibold text-slate-700 block mb-1">
                  Hasta fecha (opcional):
                </label>
                <input
                  id="gen_hasta"
                  type="date"
                  value={hasta}
                  onChange={(e) => setHasta(e.target.value)}
                  className="w-full h-8 px-2.5 rounded border border-slate-300 font-mono text-xs outline-none focus:border-[#006c49]"
                />
              </div>
            </div>
          </div>
        ) : (
          /* Reporte de Resultados */
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 block text-[11px]">Procesadas</span>
                <span className="font-mono text-xl font-bold text-slate-800">
                  {resultado.procesadas ?? 0}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                <span className="text-emerald-700 block text-[11px] font-semibold">Generados</span>
                <span className="font-mono text-xl font-bold text-emerald-800">
                  {resultado.generados ?? 0}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                <span className="text-amber-700 block text-[11px] font-semibold">Omitidas</span>
                <span className="font-mono text-xl font-bold text-amber-800">
                  {omitidas.length}
                </span>
              </div>
            </div>

            {/* Desglose por tipo */}
            {Object.keys(porTipo).length > 0 && (
              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1.5">
                <span className="font-bold text-slate-700 block text-[11px] uppercase tracking-wider">
                  Comprobantes Generados por Tipo:
                </span>
                <div className="flex flex-wrap gap-2 pt-0.5">
                  {Object.entries(porTipo).map(([t, count]) => (
                    <span
                      key={t}
                      className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 font-mono text-xs font-semibold"
                    >
                      {t}: <strong>{count}</strong>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Lista de transacciones omitidas con motivo */}
            {omitidas.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-amber-900">
                  <span className="material-symbols-outlined text-[16px] text-amber-600">
                    info
                  </span>
                  <span>Transacciones Omitidas ({omitidas.length})</span>
                </div>

                <div className="divide-y divide-amber-100 max-h-48 overflow-y-auto rounded-lg border border-amber-200 bg-amber-50/40 text-[11px]">
                  {omitidas.map((o, idx) => (
                    <div key={idx} className="p-2 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-800">
                          Tx #{o.transaccion_id}
                        </span>
                        <Badge variant="slate" className="!text-[9px] !py-0">
                          {o.tipo}
                        </Badge>
                      </div>
                      <p className="text-slate-600 italic">
                        {o.motivo}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}
