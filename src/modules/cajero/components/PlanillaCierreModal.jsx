import Modal from '../../../components/ui/Modal'
import Button from '../../../components/ui/Button'

function formatMoney(value, simbolo = 'Bs.') {
  const n = Number(value ?? 0)
  return `${simbolo} ${n.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/**
 * PlanillaCierreModal — acta oficial y planilla imprimible de cierre de turno y traspaso a bóveda (CU-W16).
 *
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   datos: object,
 *   cooperativaNombre?: string
 * }} props
 */
export default function PlanillaCierreModal({ open, onClose, datos, cooperativaNombre }) {
  if (!open || !datos) return null

  function handlePrint() {
    window.print()
  }

  const fechaAperturaFmt = datos.fecha_apertura
    ? new Date(datos.fecha_apertura).toLocaleString('es-BO', { dateStyle: 'medium', timeStyle: 'medium' })
    : '—'

  const fechaCierreFmt = (datos.fecha_cierre || datos.fecha)
    ? new Date(datos.fecha_cierre || datos.fecha).toLocaleString('es-BO', { dateStyle: 'medium', timeStyle: 'medium' })
    : new Date().toLocaleString('es-BO', { dateStyle: 'medium', timeStyle: 'medium' })

  const cajeroNombre = typeof datos.cajero === 'object'
    ? (datos.cajero?.nombre || '—')
    : String(datos.cajero || '—')

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Planilla de Cierre de Caja"
      subtitle="Acta oficial de consolidación fiduciaria y traspaso a bóveda (CU-W16)"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button variant="secondary" size="sm" onClick={onClose} type="button">
            Finalizar y Volver
          </Button>
          <Button variant="primary" size="sm" onClick={handlePrint} type="button" className="gap-1.5">
            <span className="material-symbols-outlined text-[16px]">print</span>
            <span>Imprimir Planilla</span>
          </Button>
        </div>
      }
    >
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #planilla-cierre-print, #planilla-cierre-print * { visibility: visible !important; }
          #planilla-cierre-print {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 24px !important;
            border: 1px dashed #94a3b8 !important;
            box-shadow: none !important;
            background: white !important;
          }
        }
      `}</style>

      {/* Contenedor Imprimible */}
      <div id="planilla-cierre-print" className="p-4 sm:p-5 bg-white rounded-xl border border-slate-200 text-slate-800 text-xs sm:text-sm font-sans space-y-4">

        {/* Encabezado Fiduciario */}
        <div className="text-center pb-3 border-b border-slate-200">
          <h2 className="font-display text-base font-bold text-slate-900 uppercase tracking-tight">
            {cooperativaNombre ?? 'NexaCoop Core Banking'}
          </h2>
          <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
            Planilla Oficial de Cierre Diario y Traspaso de Fondos a Bóveda
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-800 text-[11px] font-bold uppercase tracking-wider border border-rose-200">
            TURNO DE CAJA CERRADO DEFINITIVAMENTE (CU-W16)
          </div>
        </div>

        {/* Metadatos Generales */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs py-1 bg-slate-50 p-3 rounded-lg border border-slate-200/80">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">N° Cierre:</span>
            <span className="font-mono font-bold text-slate-900">#{datos.id ?? '—'}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Caja / Terminal:</span>
            <span className="font-semibold text-slate-800">{datos.caja_nombre ?? '—'}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Cajero Responsable:</span>
            <span className="font-semibold text-slate-800">{cajeroNombre}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Hora de Apertura:</span>
            <span className="font-medium text-slate-700">{fechaAperturaFmt}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Hora de Cierre:</span>
            <span className="font-medium text-slate-700">{fechaCierreFmt}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Respaldo Arqueo:</span>
            <span className="font-mono font-bold text-slate-800">#{datos.arqueo_id ?? '—'}</span>
          </div>
        </div>

        {datos.observacion && (
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Observación de Cierre:</span>
            <p className="italic text-slate-700">{datos.observacion}</p>
          </div>
        )}

        {/* Consolidación de Movimientos por Moneda */}
        <div className="space-y-4 pt-1">
          {(datos.monedas || []).map((m, idx) => {
            const sim = m.moneda?.simbolo || (typeof m.moneda === 'string' ? m.moneda : (m.moneda?.codigo_iso || 'Bs.'))
            const nombreMoneda = m.moneda?.nombre || m.moneda?.codigo_iso || 'Moneda'
            const dif = Number(m.diferencia ?? 0)

            return (
              <div key={m.moneda?.id ?? idx} className="rounded-lg border border-slate-200 overflow-hidden">
                <div className="bg-slate-100 px-3 py-2 flex items-center justify-between border-b border-slate-200">
                  <span className="font-bold text-slate-900 text-xs sm:text-sm">
                    {nombreMoneda} ({m.moneda?.codigo_iso || '—'})
                  </span>
                  <span className="text-xs font-mono font-semibold text-slate-700">
                    Símbolo: {sim}
                  </span>
                </div>

                <div className="p-3 bg-white space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="bg-slate-50 p-2.5 rounded border border-slate-100">
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Apertura</span>
                      <span className="font-mono font-bold text-slate-800">
                        {formatMoney(m.monto_apertura, sim)}
                      </span>
                    </div>
                    <div className="bg-emerald-50/50 p-2.5 rounded border border-emerald-100">
                      <span className="text-emerald-800 block text-[10px] uppercase font-semibold">
                        Depósitos ({m.cantidad_depositos})
                      </span>
                      <span className="font-mono font-bold text-emerald-800">
                        +{formatMoney(m.total_depositos, sim)}
                      </span>
                    </div>
                    <div className="bg-rose-50/50 p-2.5 rounded border border-rose-100">
                      <span className="text-rose-800 block text-[10px] uppercase font-semibold">
                        Retiros ({m.cantidad_retiros})
                      </span>
                      <span className="font-mono font-bold text-rose-800">
                        -{formatMoney(m.total_retiros, sim)}
                      </span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded border border-slate-100">
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                        Transferencias
                      </span>
                      <span className="font-mono font-bold text-slate-800">
                        {m.cantidad_transferencias} ops
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1 border-t border-slate-100">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Saldo Teórico Calculado</span>
                      <span className="font-mono font-bold text-slate-800">{formatMoney(m.saldo_teorico, sim)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Total Físico Contado</span>
                      <span className="font-mono font-bold text-slate-800">{formatMoney(m.total_contado, sim)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Diferencia Fiduciaria</span>
                      <span className={`font-mono font-bold ${dif === 0 ? 'text-emerald-700' : dif > 0 ? 'text-blue-700' : 'text-rose-700'}`}>
                        {dif > 0 ? '+' : ''}{formatMoney(dif, sim)}
                      </span>
                    </div>
                  </div>

                  {/* Traspaso Efectivo a Bóveda */}
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-emerald-900 tracking-wider block">
                        Efectivo Físico Transferido a Bóveda
                      </span>
                      <span className="text-[11px] text-emerald-700">
                        Total físico consolidado retirado de ventanilla
                      </span>
                    </div>
                    <span className="font-display text-lg font-bold text-emerald-900 tabular-nums font-mono">
                      {formatMoney(m.traspaso_boveda, sim)}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Firmas de Cierre y Custodia de Bóveda */}
        <div className="pt-8 grid grid-cols-3 gap-4 text-center text-[10px] text-slate-500 border-t border-slate-100 mt-4">
          <div>
            <div className="border-b border-slate-300 w-3/4 mx-auto mb-1" />
            <span className="font-semibold block text-slate-700">{cajeroNombre}</span>
            <span>Cajero de Ventanilla</span>
          </div>
          <div>
            <div className="border-b border-slate-300 w-3/4 mx-auto mb-1" />
            <span className="font-semibold block text-slate-700">Custodio / Bóveda</span>
            <span>Recepción Conforme</span>
          </div>
          <div>
            <div className="border-b border-slate-300 w-3/4 mx-auto mb-1" />
            <span className="font-semibold block text-slate-700">Supervisor / Admin</span>
            <span>V°B° Auditoría Interna</span>
          </div>
        </div>

        <p className="text-[10px] text-center text-slate-400 pt-2">
          Acta inmutable de cierre fiduciario de turno. NexaCoop Core Banking v2.4.0
        </p>
      </div>
    </Modal>
  )
}
