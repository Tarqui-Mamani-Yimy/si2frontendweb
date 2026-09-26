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

function getEstadoBadgeVariant(estado) {
  switch (estado) {
    case 'PENDIENTE':
      return 'navy'
    case 'OBSERVADA':
      return 'amber'
    case 'EN_EVALUACION':
      return 'indigo'
    case 'APROBADO':
      return 'green'
    case 'RECHAZADO':
      return 'red'
    case 'DESEMBOLSADO':
      return 'teal'
    case 'ANULADA':
      return 'slate'
    default:
      return 'slate'
  }
}

/**
 * DetalleSolicitudModal — Vista de detalle y formato imprimible oficial de solicitud de crédito (CU-W21).
 *
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   solicitud: object|null,
 *   onEditar?: (solicitud: object) => void,
 *   onAnular?: (solicitud: object) => void,
 * }} props
 */
export default function DetalleSolicitudModal({
  open,
  onClose,
  solicitud,
  onEditar,
  onAnular,
}) {
  if (!open || !solicitud) return null

  const sim = (typeof solicitud.moneda === 'object' ? solicitud.moneda?.simbolo : 'Bs.') || 'Bs.'
  const iso = (typeof solicitud.moneda === 'object' ? solicitud.moneda?.codigo_iso : 'BOB') || 'BOB'
  const esEditable = solicitud.estado === 'PENDIENTE' || solicitud.estado === 'OBSERVADA'
  const numero = solicitud.numero_solicitud || `SOL-#${solicitud.id}`

  function handlePrint() {
    window.print()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Solicitud ${numero}`}
      subtitle={`Expediente crediticio registrado el ${formatDate(solicitud.fecha_solicitud)}`}
      footer={
        <div className="flex w-full items-center justify-between">
          <Button variant="secondary" size="sm" onClick={onClose} type="button">
            Cerrar
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handlePrint}
              type="button"
              className="gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">print</span>
              <span>Imprimir Formulario</span>
            </Button>

            {esEditable && onAnular && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  onClose()
                  onAnular(solicitud)
                }}
                type="button"
                className="gap-1 text-rose-700 hover:text-rose-900 hover:bg-rose-50 hover:border-rose-300"
              >
                <span className="material-symbols-outlined text-[16px]">cancel</span>
                <span>Anular</span>
              </Button>
            )}

            {esEditable && onEditar && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  onClose()
                  onEditar(solicitud)
                }}
                type="button"
                className="gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">edit</span>
                <span>Editar Solicitud</span>
              </Button>
            )}
          </div>
        </div>
      }
    >
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #solicitud-credito-print, #solicitud-credito-print * { visibility: visible !important; }
          #solicitud-credito-print {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 24px !important;
            border: 1px dashed #cbd5e1 !important;
            box-shadow: none !important;
            background: white !important;
          }
        }
      `}</style>

      <div id="solicitud-credito-print" className="space-y-4 text-xs font-sans text-slate-800">
        {/* Encabezado Fiduciario para Impresión */}
        <div className="border-b border-slate-200 pb-3 text-center">
          <h2 className="font-display text-sm font-bold uppercase text-slate-900">
            NexaCoop Core Banking &bull; Solicitud de Crédito
          </h2>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Recepción y Formulario Socioeconómico &bull; {numero}
          </p>
          <div className="mt-2 flex items-center justify-center gap-2">
            <Badge variant={getEstadoBadgeVariant(solicitud.estado)}>
              {solicitud.estado}
            </Badge>
            <span className="font-mono text-slate-500 text-[11px]">
              Fecha: {formatDate(solicitud.fecha_solicitud)}
            </span>
          </div>
        </div>

        {/* Motivo de anulación si aplica */}
        {solicitud.estado === 'ANULADA' && solicitud.motivo_anulacion && (
          <div className="rounded-lg border border-rose-300 bg-rose-50 p-3 text-rose-900 space-y-1">
            <span className="font-bold block uppercase text-[10px] tracking-wider text-rose-700">
              Solicitud Anulada
            </span>
            <p className="text-xs">{solicitud.motivo_anulacion}</p>
          </div>
        )}

        {/* ── Datos del Socio ── */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
            Datos del Socio Solicitante
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Nombre Completo:</span>
              <span className="font-bold text-slate-900 block text-sm">
                {solicitud.socio?.nombre_completo || '—'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Cédula de Identidad:</span>
              <span className="font-mono font-bold text-slate-800 block text-xs">
                CI: {solicitud.socio?.ci || '—'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Oficial Receptor:</span>
              <span className="font-medium text-slate-700 block">
                {solicitud.oficial?.nombre || 'Oficial de crédito'}
              </span>
            </div>
          </div>
        </div>

        {/* ── Condiciones del Crédito Solicitado ── */}
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
            Condiciones del Préstamo Solicitado
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="rounded-lg bg-slate-50 p-2 border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Monto Solicitado</span>
              <span className="font-display font-bold text-slate-900 text-sm tabular-nums">
                {formatMoney(solicitud.monto, sim)}
              </span>
              <span className="text-[10px] text-slate-400 font-mono block">{iso}</span>
            </div>

            <div className="rounded-lg bg-slate-50 p-2 border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Plazo de Pago</span>
              <span className="font-display font-bold text-slate-900 text-sm tabular-nums">
                {solicitud.plazo_meses} meses
              </span>
              <span className="text-[10px] text-slate-400 block">Frecuencia mensual</span>
            </div>

            <div className="rounded-lg bg-slate-50 p-2 border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Tasa Nominal (TNA)</span>
              <span className="font-display font-bold text-[#064e3b] text-sm tabular-nums">
                {Number(solicitud.tasa_interes).toFixed(2)}%
              </span>
              <span className="text-[10px] text-emerald-800 font-semibold block">
                {solicitud.producto?.tipo_amortizacion === 'ALEMAN' ? 'Alemán (Capital)' : 'Francés (Cuota)'}
              </span>
            </div>

            <div className="rounded-lg bg-slate-50 p-2 border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Cuota Estimada</span>
              <span className="font-display font-bold text-slate-900 text-sm tabular-nums">
                {solicitud.cuota_estimada ? formatMoney(solicitud.cuota_estimada, sim) : '—'}
              </span>
              <span className="text-[10px] text-slate-400 block">Mensual</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-100">
            <div>
              <span className="text-[10px] uppercase text-slate-400 block font-semibold">Producto Crediticio:</span>
              <span className="font-bold text-slate-800">
                {solicitud.producto ? `${solicitud.producto.codigo} — ${solicitud.producto.nombre}` : 'Sin producto formal asignado (Legacy)'}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-slate-400 block font-semibold">Destino Declarado:</span>
              <span className="font-semibold text-slate-800">
                {solicitud.destino || 'No especificado'}
                {solicitud.destino_detalle && ` (${solicitud.destino_detalle})`}
              </span>
            </div>
          </div>

          {solicitud.observaciones && (
            <div className="pt-1">
              <span className="text-[10px] uppercase text-slate-400 block font-semibold">Observaciones:</span>
              <p className="text-slate-600 mt-0.5">{solicitud.observaciones}</p>
            </div>
          )}
        </div>

        {/* ── Evaluación Socioeconómica y Capacidad de Pago ── */}
        {solicitud.evaluacion && (
          <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              Evaluación Socioeconómica y Capacidad de Pago
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
              <div className="rounded-lg bg-slate-50 p-2 border border-slate-200">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Ingreso Mensual</span>
                <span className="font-bold text-slate-900 text-sm tabular-nums">
                  {formatMoney(solicitud.evaluacion.ingreso_mensual, sim)}
                </span>
              </div>
              <div className="rounded-lg bg-slate-50 p-2 border border-slate-200">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Egreso Mensual</span>
                <span className="font-bold text-slate-700 text-sm tabular-nums">
                  {formatMoney(solicitud.evaluacion.egreso_mensual, sim)}
                </span>
              </div>
              <div className="rounded-lg bg-slate-50 p-2 border border-slate-200">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Otras Deudas</span>
                <span className="font-bold text-slate-700 text-sm tabular-nums">
                  {formatMoney(solicitud.evaluacion.cuota_deudas_mensual, sim)}
                </span>
              </div>
              <div className="rounded-lg bg-slate-50 p-2 border border-slate-200">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Capacidad Neta</span>
                <span className={`font-display font-bold text-sm tabular-nums ${
                  parseFloat(solicitud.evaluacion.capacidad_pago) < 0 ? 'text-rose-600' : 'text-emerald-700'
                }`}>
                  {formatMoney(solicitud.evaluacion.capacidad_pago, sim)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
              <div>
                <span className="text-[10px] uppercase text-slate-400 block font-semibold">Actividad Económica:</span>
                <span className="font-medium text-slate-800">{solicitud.evaluacion.actividad_economica || '—'}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-slate-400 block font-semibold">Fuente de Ingreso:</span>
                <span className="font-medium text-slate-800">{solicitud.evaluacion.fuente_ingresos || '—'}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-slate-400 block font-semibold">Antigüedad Laboral:</span>
                <span className="font-medium text-slate-800">{solicitud.evaluacion.antiguedad_laboral_meses} meses</span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-slate-400 block font-semibold">Calificación ASFI:</span>
                <span className="font-bold text-slate-900">Categoría {solicitud.evaluacion.calificacion_asfi || 'A'}</span>
              </div>
            </div>

            {/* Relación Cuota/Ingreso */}
            {solicitud.relacion_cuota_ingreso != null && (
              <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-slate-700">Relación Cuota / Ingreso Neto (RCI):</span>
                  <span className="font-bold text-slate-900 ml-1">
                    {Number(solicitud.relacion_cuota_ingreso).toFixed(1)}%
                  </span>
                </div>
                {solicitud.supera_relacion_maxima ? (
                  <Badge variant="amber">Supera Límite Recomendado</Badge>
                ) : (
                  <Badge variant="green">RCI Conforme</Badge>
                )}
              </div>
            )}

            {solicitud.evaluacion.observaciones && (
              <div className="pt-1">
                <span className="text-[10px] uppercase text-slate-400 block font-semibold">Observaciones del Oficial:</span>
                <p className="text-slate-600 mt-0.5">{solicitud.evaluacion.observaciones}</p>
              </div>
            )}
          </div>
        )}

        {/* Firmas de Conformidad para Impresión */}
        <div className="pt-10 grid grid-cols-2 gap-8 text-center text-[10px] text-slate-500 border-t border-slate-200 mt-6">
          <div>
            <div className="border-b border-slate-300 w-3/4 mx-auto mb-1.5" />
            <span className="font-semibold block text-slate-800 text-xs">
              {solicitud.socio?.nombre_completo || 'Socio Solicitante'}
            </span>
            <span>Firma del Socio Solicitante (CI: {solicitud.socio?.ci || '—'})</span>
          </div>
          <div>
            <div className="border-b border-slate-300 w-3/4 mx-auto mb-1.5" />
            <span className="font-semibold block text-slate-800 text-xs">
              {solicitud.oficial?.nombre || 'Oficial de Crédito'}
            </span>
            <span>Firma y Sello del Oficial de Crédito / Recepción</span>
          </div>
        </div>

        <p className="text-[10px] text-center text-slate-400 pt-2">
          Expediente crediticio institucional &bull; Válido para evaluación fiduciaria conforme a la normativa ASFI y Ley N° 393.
        </p>
      </div>
    </Modal>
  )
}
