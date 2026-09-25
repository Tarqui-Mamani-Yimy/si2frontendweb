import Modal from '../../../components/ui/Modal'
import Button from '../../../components/ui/Button'

function formatMoney(value, simbolo = 'Bs.') {
  const n = Number(value ?? 0)
  return `${simbolo} ${n.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/**
 * ComprobanteRetiroModal — comprobante impreso de retiro en efectivo con firma del socio (CU-W12).
 *
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   datos: object,
 *   cooperativaNombre?: string
 * }} props
 */
export default function ComprobanteRetiroModal({ open, onClose, datos, cooperativaNombre }) {
  if (!open || !datos) return null

  function handlePrint() {
    window.print()
  }

  const fechaFormateada = datos.fecha_hora
    ? new Date(datos.fecha_hora).toLocaleString('es-BO', { dateStyle: 'medium', timeStyle: 'medium' })
    : new Date().toLocaleString('es-BO', { dateStyle: 'medium', timeStyle: 'medium' })

  const simboloMoneda = datos.moneda?.simbolo || (typeof datos.moneda === 'string' ? datos.moneda : (datos.moneda?.codigo_iso || 'Bs.'))

  // Extracción segura de objetos
  const titularNombre = datos.titular?.nombre_completo || '—'
  const titularCi = datos.titular?.ci || '—'
  const retiranteTipo = datos.retirante?.tipo || 'TITULAR'
  const retiranteNombre = datos.retirante?.nombre || titularNombre
  const retiranteCi = datos.retirante?.ci || titularCi

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Comprobante de Retiro en Ventanilla"
      subtitle="Operación fiduciaria procesada en ventanilla NexaCoop"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button variant="secondary" size="sm" onClick={onClose} type="button">
            Cerrar
          </Button>
          <Button variant="primary" size="sm" onClick={handlePrint} type="button" className="gap-1.5">
            <span className="material-symbols-outlined text-[16px]">print</span>
            <span>Imprimir Comprobante</span>
          </Button>
        </div>
      }
    >
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #comprobante-retiro-print, #comprobante-retiro-print * { visibility: visible !important; }
          #comprobante-retiro-print {
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

      {/* Contenedor del Comprobante Impreso */}
      <div id="comprobante-retiro-print" className="p-4 sm:p-5 bg-white rounded-xl border border-slate-200 text-slate-800 text-xs sm:text-sm font-sans space-y-4">

        {/* Encabezado Fiduciario */}
        <div className="text-center pb-3 border-b border-slate-200">
          <h2 className="font-display text-base font-bold text-slate-900 uppercase tracking-tight">
            {cooperativaNombre ?? 'NexaCoop Core Banking'}
          </h2>
          <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
            Ventanilla de Caja y Servicios Fiduciarios
          </p>
          <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-800 text-[11px] font-bold uppercase tracking-wider border border-rose-200">
            Comprobante Oficial de Retiro de Efectivo (CU-W12)
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
          <div className="text-right">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Canal:</span>
            <span className="font-semibold text-slate-800">VENTANILLA</span>
          </div>
        </div>

        <div className="border-t border-slate-100 my-1" />

        {/* Detalles de la Cuenta y Titular */}
        <div className="space-y-2.5">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Cuenta de Ahorro:</span>
              <span className="font-mono font-bold text-slate-900">{datos.cuenta_numero}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Titular de la Cuenta:</span>
              <span className="font-semibold text-slate-800">{titularNombre}</span>
              <span className="block text-[11px] font-mono text-slate-500">CI: {titularCi}</span>
            </div>
          </div>

          {/* Información del Retirante */}
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Retirante:</span>
              <span className="font-medium text-slate-800">{retiranteNombre}</span>
              <span className="block text-[11px] font-mono text-slate-500">CI: {retiranteCi}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Condición:</span>
              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-200 text-slate-800">
                {retiranteTipo === 'TITULAR' ? 'Titular de la cuenta' : 'Apoderado / Representante'}
              </span>
            </div>
          </div>

          {/* Monto Retirado */}
          <div className="mt-3 p-3 rounded-lg bg-rose-50/70 border border-rose-200 flex items-center justify-between">
            <span className="font-semibold text-rose-900 text-xs uppercase tracking-wider">
              Monto Entregado en Efectivo:
            </span>
            <span className="font-display text-lg font-bold text-rose-900 tabular-nums">
              -{formatMoney(datos.monto, simboloMoneda)}
            </span>
          </div>

          {/* Saldos Resultantes */}
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-1">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Saldo Disponible Restante:</span>
              <span className="font-mono font-bold text-slate-800">
                {formatMoney(datos.saldo_actualizado, simboloMoneda)}
              </span>
            </div>
            {datos.saldo_minimo !== undefined && (
              <div className="text-right">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Saldo Mínimo de Permanencia:</span>
                <span className="font-mono font-semibold text-slate-600">
                  {formatMoney(datos.saldo_minimo, simboloMoneda)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Declaración de Conformidad */}
        <p className="text-[11px] text-slate-500 italic pt-2">
          Conste por el presente comprobante la recepción conforme del dinero en efectivo solicitado,
          debitado de la cuenta de ahorro indicada.
        </p>

        {/* Firmas de Conformidad (Línea de firma del socio obligatoria) */}
        <div className="pt-8 grid grid-cols-2 gap-8 text-center text-[10px] text-slate-500 border-t border-slate-100 mt-4">
          <div>
            <div className="border-b border-slate-300 w-3/4 mx-auto mb-1" />
            <span className="font-semibold block text-slate-700">{retiranteNombre}</span>
            <span>Firma {retiranteTipo === 'TITULAR' ? 'Socio Titular' : 'Apoderado Autorizado'}</span>
          </div>
          <div>
            <div className="border-b border-slate-300 w-3/4 mx-auto mb-1" />
            <span>Firma Operador / Cajero</span>
          </div>
        </div>

        <p className="text-[10px] text-center text-slate-400 pt-2">
          Documento fiduciario oficial de retiro en ventanilla. NexaCoop Core Banking v2.4.0
        </p>
      </div>
    </Modal>
  )
}
