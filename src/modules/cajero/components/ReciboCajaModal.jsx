import Modal from '../../../components/ui/Modal'
import Button from '../../../components/ui/Button'

function formatMoney(value, simbolo = 'Bs') {
  const n = Number(value ?? 0)
  return `${simbolo} ${n.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/**
 * ReciboCajaModal — comprobante transaccional imprimible en ventanilla.
 *
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   tipo: 'DEPOSITO' | 'TRANSFERENCIA' | 'APERTURA',
 *   datos: object,
 *   cooperativaNombre?: string
 * }} props
 */
export default function ReciboCajaModal({ open, onClose, tipo, datos, cooperativaNombre }) {
  if (!open || !datos) return null

  function handlePrint() {
    window.print()
  }

  const fechaFormateada = datos.fecha_hora
    ? new Date(datos.fecha_hora).toLocaleString('es-BO', { dateStyle: 'medium', timeStyle: 'medium' })
    : new Date().toLocaleString('es-BO', { dateStyle: 'medium', timeStyle: 'medium' })

  const simboloMoneda = datos.moneda?.simbolo ?? (typeof datos.moneda === 'string' ? datos.moneda : 'Bs')

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Comprobante Transaccional"
      subtitle="Operación procesada en ventanilla NexaCoop"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button variant="secondary" size="sm" onClick={onClose} type="button">
            Cerrar
          </Button>
          <Button variant="primary" size="sm" onClick={handlePrint} type="button" className="gap-1.5">
            <span className="material-symbols-outlined text-[16px]">print</span>
            <span>Imprimir Recibo</span>
          </Button>
        </div>
      }
    >
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #recibo-caja-print, #recibo-caja-print * { visibility: visible !important; }
          #recibo-caja-print {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 24px !important;
            border: 1px dashed #94a3b8 !important;
            box-shadow: none !important;
          }
        }
      `}</style>
      {/* Contenedor del Comprobante Impreso */}
      <div id="recibo-caja-print" className="p-4 sm:p-5 bg-white rounded-xl border border-slate-200 text-slate-800 text-xs sm:text-sm font-sans space-y-4">

        {/* Encabezado Fiduciario */}
        <div className="text-center pb-3 border-b border-slate-200">
          <h2 className="font-display text-base font-bold text-slate-900 uppercase tracking-tight">
            {cooperativaNombre ?? 'NexaCoop Core Banking'}
          </h2>
          <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
            Ventanilla de Caja y Servicios Fiduciarios
          </p>
          <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold uppercase tracking-wider border border-emerald-200">
            {tipo === 'DEPOSITO' && 'Comprobante de Depósito'}
            {tipo === 'TRANSFERENCIA' && 'Comprobante de Transferencia Interna'}
            {tipo === 'APERTURA' && 'Apertura de Turno de Caja'}
          </div>
        </div>

        {/* Metadatos de la Operación */}
        <div className="grid grid-cols-2 gap-2 text-xs py-1">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">N° Operación:</span>
            <span className="font-mono font-bold text-slate-900">
              #{datos.numero_operacion ?? datos.id ?? '—'}
            </span>
          </div>
          <div className="text-right">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Fecha y Hora:</span>
            <span className="font-medium text-slate-700">{fechaFormateada}</span>
          </div>
          {datos.caja_nombre && (
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Caja / Terminal:</span>
              <span className="font-semibold text-slate-800">{datos.caja_nombre}</span>
            </div>
          )}
          {datos.canal && (
            <div className="text-right">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Canal:</span>
              <span className="font-semibold text-slate-800">{datos.canal}</span>
            </div>
          )}
        </div>

        <div className="border-t border-slate-100 my-1" />

        {/* Detalles según Tipo de Operación */}
        {tipo === 'DEPOSITO' && (
          <div className="space-y-2.5">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Cuenta Destino:</span>
                <span className="font-mono font-bold text-slate-900">{datos.cuenta_numero}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Titular de la Cuenta:</span>
                <span className="font-semibold text-slate-800">{datos.titular?.nombre_completo}</span>
              </div>
            </div>

            <div className="flex justify-between items-start">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Depositante:</span>
                <span className="font-medium text-slate-700">{datos.depositante_nombre || 'Mismo titular'}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Documento / CI:</span>
                <span className="font-mono text-slate-700">{datos.depositante_ci || '—'}</span>
              </div>
            </div>

            <div className="mt-3 p-3 rounded-lg bg-emerald-50/70 border border-emerald-100 flex items-center justify-between">
              <span className="font-semibold text-emerald-900 text-xs uppercase tracking-wider">
                Monto Depositado:
              </span>
              <span className="font-display text-lg font-bold text-emerald-900 tabular-nums">
                +{formatMoney(datos.monto, simboloMoneda)}
              </span>
            </div>

            {datos.saldo_actualizado !== undefined && (
              <div className="flex justify-between items-center text-xs text-slate-500 pt-1">
                <span>Nuevo Saldo Disponible en Cuenta:</span>
                <span className="font-mono font-bold text-slate-800">
                  {formatMoney(datos.saldo_actualizado, simboloMoneda)}
                </span>
              </div>
            )}
          </div>
        )}

        {tipo === 'TRANSFERENCIA' && (
          <div className="space-y-2.5">
            {/* Origen y Destino */}
            <div className="grid grid-cols-2 gap-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200/70">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Cuenta Origen:</span>
                <span className="font-mono font-bold text-slate-900 block">{datos.origen?.numero}</span>
                <span className="text-xs text-slate-700 font-medium truncate block">{datos.origen?.titular?.nombre_completo}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Cuenta Destino:</span>
                <span className="font-mono font-bold text-slate-900 block">{datos.destino?.numero}</span>
                <span className="text-xs text-slate-700 font-medium truncate block">{datos.destino?.titular?.nombre_completo}</span>
              </div>
            </div>

            {datos.glosa && (
              <div className="text-xs text-slate-600">
                <span className="text-slate-400 text-[10px] uppercase font-semibold block">Concepto / Glosa:</span>
                <p className="italic text-slate-700">{datos.glosa}</p>
              </div>
            )}

            <div className="mt-3 p-3 rounded-lg bg-emerald-50/70 border border-emerald-100 flex items-center justify-between">
              <span className="font-semibold text-emerald-900 text-xs uppercase tracking-wider">
                Monto Transferido:
              </span>
              <span className="font-display text-lg font-bold text-emerald-900 tabular-nums">
                {formatMoney(datos.monto, simboloMoneda)}
              </span>
            </div>

            {datos.saldo_origen_actualizado !== undefined && (
              <div className="flex justify-between items-center text-xs text-slate-500 pt-1">
                <span>Saldo Restante en Origen:</span>
                <span className="font-mono font-bold text-slate-800">
                  {formatMoney(datos.saldo_origen_actualizado, simboloMoneda)}
                </span>
              </div>
            )}
          </div>
        )}

        {tipo === 'APERTURA' && (
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/70">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-xs">Caja Asignada:</span>
                <span className="font-bold text-slate-900">{datos.caja_nombre}</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-slate-500 text-xs">Estado de Sesión:</span>
                <span className="font-semibold text-emerald-700 uppercase text-xs">{datos.estado}</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-100 flex items-center justify-between">
              <span className="font-semibold text-emerald-900 text-xs uppercase tracking-wider">
                Efectivo Inicial en Bóveda:
              </span>
              <span className="font-display text-lg font-bold text-emerald-900 tabular-nums">
                {formatMoney(datos.monto_apertura, 'Bs')}
              </span>
            </div>
          </div>
        )}

        {/* Firmas y Pie de Comprobante */}
        <div className="pt-8 grid grid-cols-2 gap-8 text-center text-[10px] text-slate-500 border-t border-slate-100 mt-4">
          <div>
            <div className="border-b border-slate-300 w-3/4 mx-auto mb-1" />
            <span>Firma Operador / Cajero</span>
          </div>
          <div>
            <div className="border-b border-slate-300 w-3/4 mx-auto mb-1" />
            <span>Firma Cliente / Socio</span>
          </div>
        </div>

        <p className="text-[10px] text-center text-slate-400 pt-2">
          Conservar este comprobante como respaldo oficial. NexaCoop Core Banking v2.4.0
        </p>
      </div>
    </Modal>
  )
}
