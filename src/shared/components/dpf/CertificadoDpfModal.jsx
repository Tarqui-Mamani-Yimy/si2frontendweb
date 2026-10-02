import Modal from '../../../components/ui/Modal'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'

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
 * CertificadoDpfModal — certificado digital y documento oficial imprimible de DPF (CU-W17).
 *
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   datos: object,
 *   cooperativaNombre?: string
 * }} props
 */
export default function CertificadoDpfModal({ open, onClose, datos, cooperativaNombre }) {
  if (!open || !datos) return null

  function handlePrint() {
    window.print()
  }

  const sim = datos.moneda?.simbolo || (typeof datos.moneda === 'string' ? datos.moneda : (datos.moneda?.codigo_iso || 'Bs.'))
  const monedaNombre = datos.moneda?.nombre || datos.moneda?.codigo_iso || 'Bolivianos'
  const socioNombre = datos.socio?.nombre_completo || '—'
  const socioCi = datos.socio?.ci || '—'
  const emisorNombre = datos.usuario?.nombre || 'Funcionario Autorizado'

  const fechaEmisionFmt = datos.fecha_emision
    ? new Date(datos.fecha_emision).toLocaleString('es-BO', { dateStyle: 'medium', timeStyle: 'short' })
    : new Date().toLocaleString('es-BO', { dateStyle: 'medium', timeStyle: 'short' })

  const fechaInicioFmt = datos.fecha_inicio
    ? new Date(datos.fecha_inicio).toLocaleDateString('es-BO')
    : '—'

  const fechaVenceFmt = datos.fecha_vencimiento
    ? new Date(datos.fecha_vencimiento).toLocaleDateString('es-BO')
    : '—'

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Certificado de Depósito a Plazo Fijo"
      subtitle={`N° ${datos.numero_certificado ?? 'DPF-NEXA'} &bull; NexaCoop Core Banking`}
      footer={
        <div className="flex items-center justify-between w-full">
          <Button variant="secondary" size="sm" onClick={onClose} type="button">
            Cerrar
          </Button>
          <Button variant="primary" size="sm" onClick={handlePrint} type="button" className="gap-1.5">
            <span className="material-symbols-outlined text-[16px]">print</span>
            <span>Imprimir Certificado</span>
          </Button>
        </div>
      }
    >
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #certificado-dpf-print, #certificado-dpf-print * { visibility: visible !important; }
          #certificado-dpf-print {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 24px !important;
            border: 2px solid #064e3b !important;
            box-shadow: none !important;
            background: white !important;
          }
        }
      `}</style>

      {/* Contenedor del Certificado */}
      <div id="certificado-dpf-print" className="p-4 sm:p-6 bg-white rounded-xl border-2 border-emerald-900/40 text-slate-800 text-xs sm:text-sm font-sans space-y-4">

        {/* Encabezado Formal */}
        <div className="text-center pb-3 border-b-2 border-emerald-900/20">
          <h2 className="font-display text-base sm:text-lg font-bold text-slate-900 uppercase tracking-tight">
            {cooperativaNombre ?? 'NexaCoop Core Banking'}
          </h2>
          <p className="text-[11px] text-emerald-800 uppercase tracking-wider font-bold">
            Certificado Oficial de Depósito a Plazo Fijo (DPF - CU-W17)
          </p>
          <div className="mt-2 flex items-center justify-center gap-3">
            <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded-full border border-slate-300">
              Certificado N°: {datos.numero_certificado ?? '—'}
            </span>
            <Badge variant={datos.estado === 'VIGENTE' ? 'green' : datos.estado === 'LIQUIDADO' ? 'blue' : 'amber'}>
              {datos.estado}
            </Badge>
          </div>
        </div>

        {/* Datos Principales del DPF */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Titular del Depósito:</span>
            <span className="font-bold text-slate-900 block">{socioNombre}</span>
            <span className="font-mono text-slate-500 text-[11px]">CI: {socioCi}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Fecha de Emisión:</span>
            <span className="font-medium text-slate-700">{fechaEmisionFmt}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Código de Verificación SHA:</span>
            <span className="font-mono font-bold text-emerald-900 text-[11px] tracking-wider block">
              {datos.codigo_verificacion ?? '—'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Plazo en Días:</span>
            <span className="font-bold text-slate-900 text-sm">{datos.plazo_dias} días</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Fecha Inicio / Constitución:</span>
            <span className="font-medium text-slate-700">{fechaInicioFmt}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Fecha de Vencimiento:</span>
            <span className="font-bold text-rose-800 text-sm">{fechaVenceFmt}</span>
          </div>
        </div>

        {/* Tarjetas Financieras */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center">
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Capital Invertido</span>
            <span className="font-display text-base font-bold text-slate-900 tabular-nums">
              {formatMoney(datos.monto, sim)}
            </span>
            <span className="text-[10px] text-slate-400 block">{monedaNombre}</span>
          </div>

          <div className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-200">
            <span className="text-[10px] uppercase font-bold text-emerald-900 block">Tasa Anual (TNA)</span>
            <span className="font-display text-base font-bold text-emerald-900 tabular-nums">
              {Number(datos.tna).toFixed(2)}%
            </span>
            <span className="text-[10px] text-emerald-700 block">{datos.modalidad_pago_interes}</span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Interés Neto</span>
            <span className="font-display text-base font-bold text-slate-800 tabular-nums">
              +{formatMoney(datos.interes_neto, sim)}
            </span>
            <span className="text-[10px] text-slate-400 block">
              {datos.exento_rciva ? 'Exento RC-IVA' : `RC-IVA: -${formatMoney(datos.retencion_rciva, sim)}`}
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-emerald-100/70 border border-emerald-300">
            <span className="text-[10px] uppercase font-bold text-emerald-950 block">Monto al Vencimiento</span>
            <span className="font-display text-base font-bold text-emerald-950 tabular-nums">
              {formatMoney(Number(datos.monto) + Number(datos.interes_neto), sim)}
            </span>
            <span className="text-[10px] text-emerald-800 block">Capital + Interés Neto</span>
          </div>
        </div>

        {/* Modalidad de Pago y Cuentas Relacionadas */}
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Origen de Fondos:</span>
            <span className="font-semibold text-slate-800">
              {datos.origen_fondos === 'EFECTIVO' ? 'Efectivo en Ventanilla' : `Cuenta ${datos.cuenta_origen?.numero || '—'}`}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Cuenta de Abono (Liquidación):</span>
            <span className="font-mono font-bold text-slate-800">{datos.cuenta_abono?.numero ?? '—'}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Declaración Jurada UIF:</span>
            <span className="font-semibold text-slate-800">
              {datos.declaracion_uif_id ? `Registrada (#${datos.declaracion_uif_id})` : 'No requerida'}
            </span>
          </div>
        </div>

        {/* Cronograma de Cuotas (si aplica o para vencimiento) */}
        {datos.cronograma && datos.cronograma.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <span className="font-bold text-xs text-slate-800 block uppercase tracking-wider">
              Cronograma de Pago de Rendimientos
            </span>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-1 px-3">Cuota</th>
                    <th className="py-1 px-3">Fecha de Pago</th>
                    <th className="py-1 px-3 text-right">Días</th>
                    <th className="py-1 px-3 text-right">Interés Bruto</th>
                    <th className="py-1 px-3 text-right">RC-IVA</th>
                    <th className="py-1 px-3 text-right">Interés Neto</th>
                    <th className="py-1 px-3 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {datos.cronograma.map((c, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-1 px-3 font-sans font-medium">#{c.numero}</td>
                      <td className="py-1 px-3">
                        <span>{c.fecha_pago}</span>
                        {c.fecha_pago_real && (
                          <span className="block text-[9px] text-emerald-700 font-sans font-medium">
                            Abonado: {formatDate(c.fecha_pago_real)}
                          </span>
                        )}
                      </td>
                      <td className="py-1 px-3 text-right">{c.dias}</td>
                      <td className="py-1 px-3 text-right">{formatMoney(c.interes_bruto, sim)}</td>
                      <td className="py-1 px-3 text-right text-slate-400">{formatMoney(c.retencion_rciva, sim)}</td>
                      <td className="py-1 px-3 text-right font-bold text-emerald-800">{formatMoney(c.interes_neto, sim)}</td>
                      <td className="py-1 px-3 text-center font-sans">
                        <Badge
                          variant={c.estado === 'PAGADO' ? 'green' : 'slate'}
                          className="!text-[9px] !py-0 !px-1.5"
                        >
                          {c.estado ?? 'PENDIENTE'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Firmas de Emisión */}
        <div className="pt-8 grid grid-cols-2 gap-8 text-center text-[10px] text-slate-500 border-t border-slate-200 mt-4">
          <div>
            <div className="border-b border-slate-300 w-3/4 mx-auto mb-1" />
            <span className="font-semibold block text-slate-700">{socioNombre}</span>
            <span>Firma del Socio Titular</span>
          </div>
          <div>
            <div className="border-b border-slate-300 w-3/4 mx-auto mb-1" />
            <span className="font-semibold block text-slate-700">{emisorNombre}</span>
            <span>Firma Autorizada y Sello de la Cooperativa</span>
          </div>
        </div>

        <p className="text-[10px] text-center text-slate-400 pt-1">
          Certificado respaldado por el Fondo de Protección al Ahorrista conforme a la Ley N° 393. NexaCoop Core Banking.
        </p>
      </div>
    </Modal>
  )
}
