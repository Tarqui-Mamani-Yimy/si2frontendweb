import Modal from '../../../../components/ui/Modal'
import Button from '../../../../components/ui/Button'
import Badge from '../../../../components/ui/Badge'

function formatMoney(value, simbolo = 'Bs.') {
  const n = Number(value ?? 0)
  return `${simbolo} ${n.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(isoStr) {
  if (!isoStr) return '—'
  const d = new Date(isoStr)
  if (isNaN(d.getTime())) return isoStr
  return d.toLocaleString('es-BO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * ComprobantePagoModal — Comprobante fiduciario oficial e imprimible de cobro de cuota (CU-W27).
 *
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   pago: object|null
 * }} props
 */
export default function ComprobantePagoModal({ open, onClose, pago }) {
  if (!open || !pago) return null

  const sim = (typeof pago.moneda === 'object' ? pago.moneda?.simbolo : 'Bs.') || 'Bs.'
  const numeroRecibo = pago.numero_recibo || `REC-#${pago.id}`
  const numeroCredito =
    (typeof pago.credito === 'object' ? pago.credito?.numero_credito : null) ||
    `CRE-#${pago.credito?.id || pago.credito_id || '—'}`

  const nombreSocio =
    (typeof pago.socio === 'object' ? pago.socio?.nombre_completo : null) || '—'
  const ciSocio =
    (typeof pago.socio === 'object' ? pago.socio?.ci : null) || '—'

  const nombreCajero =
    (typeof pago.usuario === 'object' ? pago.usuario?.nombre : null) || 'Operador Central'

  const numeroCuenta =
    (typeof pago.cuenta === 'object' ? pago.cuenta?.numero : null) || null

  const esCancelado = pago.credito_estado === 'CANCELADO'

  function handlePrint() {
    window.print()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Comprobante de Pago de Cuota"
      subtitle={`Operación exitosa &bull; ${numeroRecibo}`}
      footer={
        <div className="flex w-full items-center justify-between">
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Cerrar
          </Button>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handlePrint}
            className="gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">print</span>
            <span>Imprimir Recibo</span>
          </Button>
        </div>
      }
    >
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #recibo-pago-cuota-print, #recibo-pago-cuota-print * { visibility: visible !important; }
          #recibo-pago-cuota-print {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 24px !important;
            box-shadow: none !important;
            background: white !important;
          }
        }
      `}</style>

      <div id="recibo-pago-cuota-print" className="space-y-4 text-xs font-sans text-slate-800">
        {/* Encabezado Institucional */}
        <div className="border-b border-slate-200 pb-3 text-center">
          <h2 className="font-display text-sm font-bold uppercase text-slate-900">
            NexaCoop Core Banking &bull; Comprobante de Cobro de Cuota
          </h2>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Recibo Oficial de Caja &bull; {numeroRecibo}
          </p>
          <div className="mt-1 flex items-center justify-center gap-2">
            <span className="font-mono text-slate-500 text-[11px]">
              Fecha: {formatDate(pago.fecha)}
            </span>
            <span className="text-slate-300">&bull;</span>
            <Badge variant={pago.modalidad === 'CUENTA' ? 'indigo' : 'green'}>
              {pago.modalidad === 'CUENTA' ? 'Débito en Cuenta' : 'Efectivo en Ventanilla'}
            </Badge>
          </div>
        </div>

        {/* Banner si el crédito quedó totalmente CANCELADO */}
        {esCancelado && (
          <div className="rounded-xl border border-teal-300 bg-teal-50/90 p-3 text-center text-teal-900 shadow-sm">
            <div className="flex items-center justify-center gap-1.5 text-teal-800 font-bold text-xs uppercase tracking-wide">
              <span className="material-symbols-outlined text-base">verified</span>
              <span>¡Crédito Liquidado y Cancelado en su Totalidad!</span>
            </div>
            <p className="text-[11px] text-teal-700 mt-0.5">
              Se ha amortizado el 100% del capital e intereses del préstamo. La obligación crediticia queda extinguida.
            </p>
          </div>
        )}

        {/* Datos del Socio y del Crédito */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Socio Titular
            </span>
            <span className="font-bold text-slate-900 text-sm block">
              {nombreSocio}
            </span>
            <span className="font-mono text-xs text-slate-600 block">
              Documento CI: {ciSocio}
            </span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Operación Crediticia
            </span>
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-sm">
                {numeroCredito}
              </span>
              <Badge variant="blue">
                Cuota N° {pago.numero_cuota}
              </Badge>
            </div>
            <span className="text-[11px] text-slate-500 block">
              {pago.modalidad === 'CUENTA'
                ? `Débito de cuenta N° ${numeroCuenta || '—'}`
                : `Ventanilla: ${pago.caja_nombre || 'Caja Central'}`}
            </span>
          </div>
        </div>

        {/* Desglose de la Liquidación */}
        <div className="rounded-xl border border-slate-200 overflow-hidden shadow-card">
          <div className="bg-[#f8f9ff] px-4 py-2.5 border-b border-slate-200 flex justify-between items-center">
            <span className="font-bold text-xs uppercase tracking-wider text-slate-700">
              Desglose de Liquidación de Cuota N° {pago.numero_cuota}
            </span>
            {pago.dias_atraso > 0 ? (
              <Badge variant="red">
                {pago.dias_atraso} días de atraso
              </Badge>
            ) : (
              <Badge variant="green">Al día</Badge>
            )}
          </div>

          <div className="p-4 space-y-2.5 bg-white text-xs">
            <div className="flex justify-between items-center py-1 border-b border-slate-100">
              <span className="text-slate-600">Amortización a Capital:</span>
              <span className="font-mono font-bold text-slate-900">
                {formatMoney(pago.capital, sim)}
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-100">
              <span className="text-slate-600">Interés Ordinario del Período:</span>
              <span className="font-mono font-bold text-slate-900">
                {formatMoney(pago.interes, sim)}
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-600">Interés Penal / Mora:</span>
                {pago.dias_atraso > 0 && (
                  <span className="text-[10px] text-rose-600 font-mono">
                    ({pago.dias_atraso} días atraso)
                  </span>
                )}
              </div>
              <span className={`font-mono font-bold ${Number(pago.mora) > 0 ? 'text-rose-700' : 'text-slate-900'}`}>
                {formatMoney(pago.mora, sim)}
              </span>
            </div>

            <div className="flex justify-between items-center pt-2 text-sm font-bold border-t-2 border-slate-200">
              <span className="text-slate-900 uppercase">Total Pagado:</span>
              <span className="font-display text-base text-[#064e3b]">
                {formatMoney(pago.total, sim)}
              </span>
            </div>
          </div>
        </div>

        {/* Saldos Residuales y Auditoría */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-center text-xs">
          <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Saldo Residual Capital</span>
            <span className="font-display font-bold text-slate-900 text-sm">
              {formatMoney(pago.saldo_pendiente_credito, sim)}
            </span>
          </div>

          <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Estado del Crédito</span>
            <span className="font-bold text-slate-800 text-xs">
              {pago.credito_estado || 'VIGENTE'}
            </span>
          </div>

          <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 col-span-2 sm:col-span-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Operador / Usuario</span>
            <span className="font-semibold text-slate-700 text-xs block truncate" title={nombreCajero}>
              {nombreCajero}
            </span>
          </div>
        </div>

        {/* Declaración UIF si corresponde */}
        {pago.declaracion_uif_id && (
          <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-2.5 text-center text-amber-900">
            <span className="font-bold text-[11px] block">
              Operación amparada bajo Declaración Jurada UIF N° {pago.declaracion_uif_id}
            </span>
          </div>
        )}

        {/* Firmas de Conformidad */}
        <div className="pt-10 grid grid-cols-2 gap-8 text-center text-[10px] text-slate-500 border-t border-slate-200 mt-6">
          <div>
            <div className="border-b border-slate-300 w-3/4 mx-auto mb-1.5" />
            <span className="font-semibold block text-slate-800 text-xs">
              {nombreCajero}
            </span>
            <span>Cajero / Operador Responsable</span>
          </div>
          <div>
            <div className="border-b border-slate-300 w-3/4 mx-auto mb-1.5" />
            <span className="font-semibold block text-slate-800 text-xs">
              {nombreSocio}
            </span>
            <span>Firma del Socio Titular (CI: {ciSocio})</span>
          </div>
        </div>

        <p className="text-[10px] text-center text-slate-400 pt-2">
          Comprobante oficial válido de amortización de deuda fiduciaria. Conservar para trámites de solvencia y finiquito crediticio.
        </p>
      </div>
    </Modal>
  )
}
