import Modal from '../../../components/ui/Modal'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'

function formatMoney(value, simbolo = 'Bs.') {
  const n = Number(value ?? 0)
  return `${simbolo} ${n.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/**
 * HojaArqueoModal — acta oficial y comprobante imprimible de arqueo y conciliación de caja (CU-W15).
 *
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   datos: object,
 *   cooperativaNombre?: string
 * }} props
 */
export default function HojaArqueoModal({ open, onClose, datos, cooperativaNombre }) {
  if (!open || !datos) return null

  function handlePrint() {
    window.print()
  }

  const fechaFormateada = datos.fecha
    ? new Date(datos.fecha).toLocaleString('es-BO', { dateStyle: 'medium', timeStyle: 'medium' })
    : new Date().toLocaleString('es-BO', { dateStyle: 'medium', timeStyle: 'medium' })

  // Extracción segura de cajero y supervisor como objetos
  const cajeroNombre = typeof datos.cajero === 'object'
    ? (datos.cajero?.nombre || '—')
    : String(datos.cajero || '—')

  const supervisorNombre = typeof datos.supervisor === 'object'
    ? (datos.supervisor?.nombre || null)
    : (datos.supervisor || null)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Hoja de Arqueo y Conciliación"
      subtitle={datos.cierre ? 'Cierre definitivo de turno en ventanilla' : 'Arqueo de control físico en ventanilla'}
      footer={
        <div className="flex items-center justify-between w-full">
          <Button variant="secondary" size="sm" onClick={onClose} type="button">
            Cerrar
          </Button>
          <Button variant="primary" size="sm" onClick={handlePrint} type="button" className="gap-1.5">
            <span className="material-symbols-outlined text-[16px]">print</span>
            <span>Imprimir Hoja de Arqueo</span>
          </Button>
        </div>
      }
    >
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #hoja-arqueo-print, #hoja-arqueo-print * { visibility: visible !important; }
          #hoja-arqueo-print {
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
      <div id="hoja-arqueo-print" className="p-4 sm:p-5 bg-white rounded-xl border border-slate-200 text-slate-800 text-xs sm:text-sm font-sans space-y-4">

        {/* Encabezado Fiduciario */}
        <div className="text-center pb-3 border-b border-slate-200">
          <h2 className="font-display text-base font-bold text-slate-900 uppercase tracking-tight">
            {cooperativaNombre ?? 'NexaCoop Core Banking'}
          </h2>
          <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
            Acta de Arqueo Físico y Conciliación de Caja (CU-W15)
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border">
            {datos.cierre ? (
              <span className="text-rose-800 bg-rose-50 border-rose-200 px-2 py-0.5 rounded-full border">
                Arqueo de Cierre de Caja
              </span>
            ) : (
              <span className="text-emerald-800 bg-emerald-50 border-emerald-200 px-2 py-0.5 rounded-full border">
                Arqueo Preventivo / Parcial
              </span>
            )}
          </div>
        </div>

        {/* Metadatos Generales */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs py-1 bg-slate-50 p-3 rounded-lg border border-slate-200/80">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">N° Arqueo:</span>
            <span className="font-mono font-bold text-slate-900">#{datos.id ?? '—'}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Fecha y Hora:</span>
            <span className="font-medium text-slate-700">{fechaFormateada}</span>
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
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Estado de Turno:</span>
            <span className="font-bold text-slate-800">{datos.cierre ? 'CERRADA' : 'ABIERTA'}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Supervisor Autorizante:</span>
            <span className="font-semibold text-slate-800">
              {supervisorNombre || (datos.requiere_supervisor ? 'Requerido' : 'No requerido')}
            </span>
          </div>
        </div>

        {datos.observacion && (
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Observación:</span>
            <p className="italic text-slate-700">{datos.observacion}</p>
          </div>
        )}

        {/* Detalle por Moneda */}
        <div className="space-y-4 pt-1">
          {(datos.monedas || []).map((m, idx) => {
            const monedaSimbolo = m.moneda?.simbolo || (typeof m.moneda === 'string' ? m.moneda : (m.moneda?.codigo_iso || 'Bs.'))
            const monedaNombre = m.moneda?.nombre || m.moneda?.codigo_iso || 'Moneda'
            const dif = Number(m.diferencia ?? 0)

            return (
              <div key={m.moneda?.id ?? idx} className="rounded-lg border border-slate-200 overflow-hidden">
                {/* Cabecera de la Moneda */}
                <div className="bg-slate-100 px-3 py-2 flex items-center justify-between border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-xs sm:text-sm">
                      {monedaNombre} ({m.moneda?.codigo_iso || '—'})
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      Símbolo: {monedaSimbolo}
                    </span>
                  </div>
                  <div>
                    {m.resultado === 'CUADRADO' && (
                      <Badge variant="green">CUADRADO</Badge>
                    )}
                    {m.resultado === 'SOBRANTE' && (
                      <Badge variant="blue">SOBRANTE (+{formatMoney(dif, monedaSimbolo)})</Badge>
                    )}
                    {m.resultado === 'FALTANTE' && (
                      <Badge variant="red">FALTANTE ({formatMoney(dif, monedaSimbolo)})</Badge>
                    )}
                  </div>
                </div>

                {/* Tabla de Desglose de Denominaciones */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-1.5 px-3">Tipo</th>
                        <th className="py-1.5 px-3">Denominación</th>
                        <th className="py-1.5 px-3 text-right">Cantidad (Piezas)</th>
                        <th className="py-1.5 px-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {(m.detalle || []).map((d, dIdx) => (
                        <tr key={dIdx} className={d.cantidad > 0 ? 'bg-white font-medium text-slate-800' : 'text-slate-400 bg-slate-50/40'}>
                          <td className="py-1 px-3 uppercase text-[11px]">{d.tipo}</td>
                          <td className="py-1 px-3">{formatMoney(d.denominacion, monedaSimbolo)}</td>
                          <td className="py-1 px-3 text-right">{d.cantidad}</td>
                          <td className="py-1 px-3 text-right font-bold text-slate-900">
                            {formatMoney(d.subtotal, monedaSimbolo)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Resumen Fiduciario de la Moneda */}
                <div className="bg-slate-50 p-3 border-t border-slate-200 grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Saldo Teórico</span>
                    <span className="font-mono font-bold text-slate-800">
                      {formatMoney(m.saldo_teorico, monedaSimbolo)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Contado</span>
                    <span className="font-mono font-bold text-emerald-800">
                      {formatMoney(m.total_contado, monedaSimbolo)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Diferencia</span>
                    <span className={`font-mono font-bold ${dif === 0 ? 'text-emerald-700' : dif > 0 ? 'text-blue-700' : 'text-rose-700'}`}>
                      {dif > 0 ? '+' : ''}{formatMoney(dif, monedaSimbolo)}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Firmas de Conformidad */}
        <div className="pt-8 grid grid-cols-2 gap-8 text-center text-[10px] text-slate-500 border-t border-slate-100 mt-4">
          <div>
            <div className="border-b border-slate-300 w-3/4 mx-auto mb-1" />
            <span className="font-semibold block text-slate-700">{cajeroNombre}</span>
            <span>Firma Cajero / Operador</span>
          </div>
          <div>
            <div className="border-b border-slate-300 w-3/4 mx-auto mb-1" />
            <span className="font-semibold block text-slate-700">
              {supervisorNombre || 'Supervisor de Caja'}
            </span>
            <span>Firma Autorización / Control</span>
          </div>
        </div>

        <p className="text-[10px] text-center text-slate-400 pt-2">
          Documento fiduciario oficial de conciliación de caja. NexaCoop Core Banking v2.4.0
        </p>
      </div>
    </Modal>
  )
}
