import Modal from '../../../../components/ui/Modal'
import Button from '../../../../components/ui/Button'
import Badge from '../../../../components/ui/Badge'

function formatMoney(value, simbolo = 'Bs.') {
  const n = Number(value ?? 0)
  return `${simbolo} ${n.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const parts = String(dateStr).split('-')
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`
  }
  return dateStr
}

/**
 * ComprobanteDesembolsoModal — Comprobante oficial e imprimible de desembolso de crédito (CU-W26).
 *
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   credito: object
 * }} props
 */
export default function ComprobanteDesembolsoModal({ open, onClose, credito }) {
  if (!open || !credito) return null

  const sim = (typeof credito.moneda === 'object' ? credito.moneda?.simbolo : 'Bs.') || 'Bs.'
  const iso = (typeof credito.moneda === 'object' ? credito.moneda?.codigo_iso : 'BOB') || 'BOB'
  const numeroCredito = credito.numero_credito || `CRE-#${credito.id}`

  function handlePrint() {
    window.print()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Comprobante de Desembolso"
      subtitle={`Operación exitosa &bull; Crédito ${numeroCredito}`}
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
            <span>Imprimir Comprobante</span>
          </Button>
        </div>
      }
    >
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #comprobante-desembolso-print, #comprobante-desembolso-print * { visibility: visible !important; }
          #comprobante-desembolso-print {
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

      <div id="comprobante-desembolso-print" className="space-y-4 text-xs font-sans text-slate-800">
        {/* Cabecera Institucional */}
        <div className="border-b border-slate-200 pb-3 text-center">
          <h2 className="font-display text-sm font-bold uppercase text-slate-900">
            NexaCoop Core Banking &bull; Comprobante de Desembolso
          </h2>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Crédito {numeroCredito} &bull; Transacción #{credito.transaccion_desembolso_id || '—'}
          </p>
          <div className="mt-2 flex items-center justify-center gap-2">
            <Badge variant="teal">DESEMBOLSADO</Badge>
            <span className="font-mono text-slate-500 text-[11px]">
              Fecha: {formatDate(credito.fecha_desembolso)}
            </span>
          </div>
        </div>

        {/* Monto Principal */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-center space-y-1">
          <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider block">
            Monto Neto Entregado
          </span>
          <span className="font-display text-2xl font-extrabold text-[#064e3b] tabular-nums block">
            {formatMoney(credito.monto_aprobado, sim)}
          </span>
          <span className="font-mono text-xs text-emerald-700 block">
            {iso} &bull; Modalidad: {credito.modalidad_desembolso === 'CUENTA' ? 'Abono en Cuenta de Ahorro' : 'Efectivo por Ventanilla'}
          </span>
        </div>

        {/* Datos del Socio y Modalidad */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Datos del Titular
            </span>
            <div>
              <span className="text-[10px] text-slate-400 block">Nombre Completo:</span>
              <span className="font-bold text-slate-900 text-sm block">
                {credito.socio?.nombre_completo || '—'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Cédula de Identidad:</span>
              <span className="font-mono font-bold text-slate-800 text-xs block">
                CI: {credito.socio?.ci || '—'}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Destino de los Fondos
            </span>
            <div>
              <span className="text-[10px] text-slate-400 block">Modalidad de Desembolso:</span>
              <span className="font-bold text-slate-900 block">
                {credito.modalidad_desembolso === 'CUENTA'
                  ? `Cuenta N° ${credito.cuenta_desembolso?.numero || '—'}`
                  : 'Retiro en Efectivo por Ventanilla'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Solicitud de Origen:</span>
              <span className="font-mono text-slate-700 block">
                {credito.solicitud?.numero_solicitud || 'Solicitud aprobada'}
              </span>
            </div>
          </div>
        </div>

        {/* Condiciones Financieras */}
        <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Condiciones del Préstamo
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-400 block uppercase">Plazo</span>
              <span className="font-bold text-slate-900">{credito.plazo_meses} meses</span>
            </div>
            <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-400 block uppercase">Tasa TNA</span>
              <span className="font-bold text-emerald-800">{Number(credito.tasa_interes).toFixed(2)}%</span>
            </div>
            <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-400 block uppercase">Amortización</span>
              <span className="font-bold text-slate-900">
                {credito.tipo_amortizacion === 'ALEMAN' ? 'Alemán' : 'Francés'}
              </span>
            </div>
            <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-400 block uppercase">Total Cuotas</span>
              <span className="font-bold text-slate-900">{credito.cuotas_totales || credito.plazo_meses} cuotas</span>
            </div>
          </div>
        </div>

        {/* Firmas de Conformidad */}
        <div className="pt-10 grid grid-cols-2 gap-8 text-center text-[10px] text-slate-500 border-t border-slate-200 mt-6">
          <div>
            <div className="border-b border-slate-300 w-3/4 mx-auto mb-1.5" />
            <span className="font-semibold block text-slate-800 text-xs">
              {credito.socio?.nombre_completo || 'Socio Titular'}
            </span>
            <span>Firma de Recepción y Conformidad (CI: {credito.socio?.ci || '—'})</span>
          </div>
          <div>
            <div className="border-b border-slate-300 w-3/4 mx-auto mb-1.5" />
            <span className="font-semibold block text-slate-800 text-xs">
              {credito.usuario?.nombre || 'Oficial / Cajero Responsable'}
            </span>
            <span>Firma y Sello de Autorización de Desembolso</span>
          </div>
        </div>

        <p className="text-[10px] text-center text-slate-400 pt-2">
          Comprobante emitido por el sistema central NexaCoop &bull; Validez legal conforme a la normativa ASFI y Código de Comercio.
        </p>
      </div>
    </Modal>
  )
}
