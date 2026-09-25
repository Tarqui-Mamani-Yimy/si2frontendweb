import { useState, useEffect } from 'react'
import Modal from '../../../components/ui/Modal'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import AlertBanner from '../../../components/ui/AlertBanner'
import { getConfiguracionUif } from '../../../core/api/uifApi'

const ORIGENES_FALLBACK = [
  { codigo: 'AHORROS_PROPIOS', descripcion: 'Ahorros propios' },
  { codigo: 'VENTA_INMUEBLE', descripcion: 'Venta de inmueble' },
  { codigo: 'VENTA_VEHICULO', descripcion: 'Venta de vehículo' },
  { codigo: 'COBRO_SERVICIOS', descripcion: 'Cobro de servicios / Honorarios' },
  { codigo: 'ACTIVIDAD_COMERCIAL', descripcion: 'Actividad comercial o negocio' },
  { codigo: 'SUELDO', descripcion: 'Sueldo / Remuneración laboral' },
  { codigo: 'HERENCIA', descripcion: 'Herencia / Legado familiar' },
  { codigo: 'PRESTAMO', descripcion: 'Préstamo bancario o fiduciario' },
  { codigo: 'OTRO', descripcion: 'Otro origen (especificar)' },
]

const DESTINOS_FALLBACK = [
  { codigo: 'CONSTITUCION_DPF', descripcion: 'Constitución de Depósito a Plazo Fijo' },
  { codigo: 'AHORRO', descripcion: 'Ahorro / Acumulación en cuenta' },
  { codigo: 'PAGO_PROVEEDORES', descripcion: 'Pago a proveedores de mercadería' },
  { codigo: 'COMPRA_BIENES', descripcion: 'Compra de bienes muebles o inmuebles' },
  { codigo: 'INVERSION', descripcion: 'Inversión productiva o comercial' },
  { codigo: 'GASTOS_PERSONALES', descripcion: 'Gastos personales o familiares' },
  { codigo: 'PAGO_DEUDAS', descripcion: 'Amortización / Cancelación de deudas' },
  { codigo: 'OTRO', descripcion: 'Otro destino (especificar)' },
]

function formatMoney(value, simbolo = 'Bs.') {
  const n = Number(value ?? 0)
  return `${simbolo} ${n.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/**
 * DeclaracionUifModal — formulario y documento imprimible de Declaración Jurada UIF (CU-W14).
 *
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   onConfirmar?: (declaracionData: object) => void,
 *   socio?: {id?: number, nombre_completo?: string, ci?: string},
 *   monto?: number|string,
 *   monedaSimbolo?: string,
 *   tipoOperacion?: string,
 *   readOnly?: boolean,
 *   declaracionExistente?: object,
 *   cooperativaNombre?: string
 * }} props
 */
export default function DeclaracionUifModal({
  open,
  onClose,
  onConfirmar,
  socio,
  monto,
  monedaSimbolo = 'Bs.',
  tipoOperacion = 'VENTANILLA',
  readOnly = false,
  declaracionExistente = null,
  cooperativaNombre,
}) {
  const [origenes, setOrigenes] = useState(ORIGENES_FALLBACK)
  const [destinos, setDestinos] = useState(DESTINOS_FALLBACK)

  // Campos del formulario
  const [realizadoPor, setRealizadoPor] = useState(() => declaracionExistente?.realizado_por || 'TITULAR')
  const [terceroNombre, setTerceroNombre] = useState(() => declaracionExistente?.tercero_nombre || '')
  const [terceroCi, setTerceroCi] = useState(() => declaracionExistente?.tercero_ci || '')
  const [terceroParentesco, setTerceroParentesco] = useState(() => declaracionExistente?.tercero_parentesco || '')
  const [actividadEconomica, setActividadEconomica] = useState(() => declaracionExistente?.actividad_economica || '')
  const [origen, setOrigen] = useState(() => (typeof declaracionExistente?.origen === 'object' ? declaracionExistente.origen?.codigo : (declaracionExistente?.origen || 'AHORROS_PROPIOS')))
  const [origenDetalle, setOrigenDetalle] = useState(() => declaracionExistente?.origen_detalle || '')
  const [destino, setDestino] = useState(() => (typeof declaracionExistente?.destino === 'object' ? declaracionExistente.destino?.codigo : (declaracionExistente?.destino || 'AHORRO')))
  const [destinoDetalle, setDestinoDetalle] = useState(() => declaracionExistente?.destino_detalle || '')
  const [declaraBajoJuramento, setDeclaraBajoJuramento] = useState(() => Boolean(declaracionExistente?.declara_bajo_juramento))
  const [errorValidacion, setErrorValidacion] = useState(null)

  const curRealizadoPor = declaracionExistente?.realizado_por || realizadoPor
  const curTerceroNombre = declaracionExistente?.tercero_nombre ?? terceroNombre
  const curTerceroCi = declaracionExistente?.tercero_ci ?? terceroCi
  const curTerceroParentesco = declaracionExistente?.tercero_parentesco ?? terceroParentesco
  const curActividadEconomica = declaracionExistente?.actividad_economica ?? actividadEconomica
  const curOrigen = (typeof declaracionExistente?.origen === 'object' ? declaracionExistente.origen?.codigo : declaracionExistente?.origen) || origen
  const curOrigenDetalle = declaracionExistente?.origen_detalle ?? origenDetalle
  const curDestino = (typeof declaracionExistente?.destino === 'object' ? declaracionExistente.destino?.codigo : declaracionExistente?.destino) || destino
  const curDestinoDetalle = declaracionExistente?.destino_detalle ?? destinoDetalle
  const curDeclaraBajoJuramento = declaracionExistente ? Boolean(declaracionExistente.declara_bajo_juramento) : declaraBajoJuramento

  useEffect(() => {
    let isMounted = true
    getConfiguracionUif()
      .then((cfg) => {
        if (!isMounted || !cfg) return
        if (cfg.origenes?.length) setOrigenes(cfg.origenes)
        if (cfg.destinos?.length) setDestinos(cfg.destinos)
      })
      .catch(() => {
        // Fallback local garantizado
      })

    return () => { isMounted = false }
  }, [])

  if (!open) return null

  function handlePrint() {
    window.print()
  }

  function handleSubmit(e) {
    e?.preventDefault()
    setErrorValidacion(null)

    if (!curActividadEconomica.trim()) {
      setErrorValidacion('Debe ingresar la actividad económica u ocupación del socio.')
      return
    }

    if (curOrigen === 'OTRO' && !curOrigenDetalle.trim()) {
      setErrorValidacion('Al seleccionar "Otro origen", debe detallar la procedencia de los fondos.')
      return
    }

    if (curDestino === 'OTRO' && !curDestinoDetalle.trim()) {
      setErrorValidacion('Al seleccionar "Otro destino", debe detallar la finalidad de los fondos.')
      return
    }

    if (curRealizadoPor === 'TERCERO') {
      if (!curTerceroNombre.trim() || !curTerceroCi.trim() || !curTerceroParentesco.trim()) {
        setErrorValidacion('Debe ingresar el nombre, cédula y relación o parentesco del tercero que realiza la operación.')
        return
      }
    }

    if (!curDeclaraBajoJuramento) {
      setErrorValidacion('El declarante debe aceptar y confirmar bajo juramento la licitud y veracidad de los fondos.')
      return
    }

    const payload = {
      origen: curOrigen,
      origen_detalle: curOrigen === 'OTRO' ? curOrigenDetalle.trim() : undefined,
      destino: curDestino,
      destino_detalle: curDestino === 'OTRO' ? curDestinoDetalle.trim() : undefined,
      actividad_economica: curActividadEconomica.trim(),
      realizado_por: curRealizadoPor,
      declara_bajo_juramento: true,
    }

    if (curRealizadoPor === 'TERCERO') {
      payload.tercero_nombre = curTerceroNombre.trim()
      payload.tercero_ci = curTerceroCi.trim()
      payload.tercero_parentesco = curTerceroParentesco.trim()
    }

    onConfirmar?.(payload)
  }

  const socioNombre = declaracionExistente?.socio?.nombre_completo || socio?.nombre_completo || '—'
  const socioCi = declaracionExistente?.socio?.ci || socio?.ci || '—'
  const montoValor = declaracionExistente?.monto ?? monto
  const sim = declaracionExistente?.moneda?.simbolo || monedaSimbolo

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Declaración Jurada UIF (CU-W14)"
      subtitle="Control de Origen y Destino de Fondos — Ley N° 393 y Normativa UIF"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button variant="secondary" size="sm" onClick={onClose} type="button">
            {readOnly ? 'Cerrar' : 'Cancelar Operación'}
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={handlePrint} type="button" className="gap-1.5">
              <span className="material-symbols-outlined text-[16px]">print</span>
              <span>Imprimir Formulario</span>
            </Button>
            {!readOnly && (
              <Button variant="primary" size="sm" onClick={handleSubmit} type="button" className="gap-1.5 !bg-emerald-800 hover:!bg-emerald-900">
                <span className="material-symbols-outlined text-[16px]">how_to_reg</span>
                <span>Firmar y Continuar</span>
              </Button>
            )}
          </div>
        </div>
      }
    >
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #declaracion-uif-print, #declaracion-uif-print * { visibility: visible !important; }
          #declaracion-uif-print {
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

      {/* ── Contenedor Imprimible y de Formulario ── */}
      <div id="declaracion-uif-print" className="space-y-4 text-xs font-sans text-slate-800">

        {/* Encabezado Fiduciario / Normativo */}
        <div className="text-center pb-3 border-b border-slate-200">
          <h2 className="font-display text-sm font-bold text-slate-900 uppercase">
            {cooperativaNombre ?? 'NexaCoop Core Banking'}
          </h2>
          <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
            Unidad de Investigaciones Financieras (UIF) &bull; Formulario de Declaración Jurada
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-900 text-[11px] font-bold uppercase tracking-wider border border-amber-200">
            <span>Operación Sujeta a Registro UIF</span>
            {declaracionExistente?.fraccionada && (
              <Badge variant="red">OPERACIÓN FRACCIONADA DETECTADA</Badge>
            )}
          </div>
        </div>

        {/* Resumen de la Operación */}
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Socio Titular:</span>
            <span className="font-bold text-slate-900 block">{socioNombre}</span>
            <span className="font-mono text-slate-500 text-[11px]">CI: {socioCi}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Tipo Operación:</span>
            <span className="font-semibold text-slate-800 block">{tipoOperacion}</span>
          </div>
          <div className="sm:text-right">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Monto de la Operación:</span>
            <span className="font-display font-bold text-slate-900 text-sm tabular-nums block">
              {formatMoney(montoValor, sim)}
            </span>
          </div>
        </div>

        {errorValidacion && (
          <AlertBanner variant="error" onClose={() => setErrorValidacion(null)}>
            {errorValidacion}
          </AlertBanner>
        )}

        {/* ── Formulario de Declaración ── */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Persona que realiza la operación */}
          <div className="p-3 rounded-lg border border-slate-200 bg-white space-y-3">
            <span className="font-bold text-slate-800 block text-xs uppercase tracking-wider">
              1. Persona que se presenta en ventanilla
            </span>
            <div className="grid grid-cols-2 gap-3 max-w-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="realizadoPor"
                  value="TITULAR"
                  checked={curRealizadoPor === 'TITULAR'}
                  onChange={() => setRealizadoPor('TITULAR')}
                  disabled={readOnly}
                  className="text-[#064e3b] focus:ring-[#064e3b]"
                />
                <span className="font-medium text-slate-800">Socio Titular</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="realizadoPor"
                  value="TERCERO"
                  checked={curRealizadoPor === 'TERCERO'}
                  onChange={() => setRealizadoPor('TERCERO')}
                  disabled={readOnly}
                  className="text-[#064e3b] focus:ring-[#064e3b]"
                />
                <span className="font-medium text-slate-800">Tercero / Apoderado</span>
              </label>
            </div>

            {curRealizadoPor === 'TERCERO' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    value={curTerceroNombre}
                    onChange={(e) => setTerceroNombre(e.target.value)}
                    placeholder="Nombre del tercero"
                    disabled={readOnly}
                    required
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:ring-2 focus:ring-[#064e3b]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Cédula de Identidad *</label>
                  <input
                    type="text"
                    value={curTerceroCi}
                    onChange={(e) => setTerceroCi(e.target.value)}
                    placeholder="CI con extensión"
                    disabled={readOnly}
                    required
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:ring-2 focus:ring-[#064e3b]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Relación / Parentesco *</label>
                  <input
                    type="text"
                    value={curTerceroParentesco}
                    onChange={(e) => setTerceroParentesco(e.target.value)}
                    placeholder="Ej. Apoderado, Cónyuge"
                    disabled={readOnly}
                    required
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:ring-2 focus:ring-[#064e3b]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Actividad Económica */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              2. Actividad Económica u Ocupación Principal del Titular *
            </label>
            <input
              type="text"
              value={curActividadEconomica}
              onChange={(e) => setActividadEconomica(e.target.value)}
              placeholder="Ej. Comerciante minorista, Empleado asalariado, Profesional independiente..."
              disabled={readOnly}
              required
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#064e3b]"
            />
          </div>

          {/* Origen y Destino de Fondos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                3. Origen de los Fondos *
              </label>
              <select
                value={curOrigen}
                onChange={(e) => setOrigen(e.target.value)}
                disabled={readOnly}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-[#064e3b]"
              >
                {origenes.map((o) => (
                  <option key={o.codigo} value={o.codigo}>
                    {o.descripcion}
                  </option>
                ))}
              </select>
              {curOrigen === 'OTRO' && (
                <input
                  type="text"
                  value={curOrigenDetalle}
                  onChange={(e) => setOrigenDetalle(e.target.value)}
                  placeholder="Especifique el origen detallado..."
                  disabled={readOnly}
                  required
                  className="w-full px-3 py-1.5 text-xs border border-amber-300 bg-amber-50/50 rounded-lg"
                />
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                4. Destino de los Fondos *
              </label>
              <select
                value={curDestino}
                onChange={(e) => setDestino(e.target.value)}
                disabled={readOnly}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-[#064e3b]"
              >
                {destinos.map((d) => (
                  <option key={d.codigo} value={d.codigo}>
                    {d.descripcion}
                  </option>
                ))}
              </select>
              {curDestino === 'OTRO' && (
                <input
                  type="text"
                  value={curDestinoDetalle}
                  onChange={(e) => setDestinoDetalle(e.target.value)}
                  placeholder="Especifique el destino detallado..."
                  disabled={readOnly}
                  required
                  className="w-full px-3 py-1.5 text-xs border border-amber-300 bg-amber-50/50 rounded-lg"
                />
              )}
            </div>
          </div>

          {/* Juramento de Licitud */}
          <div className="p-3.5 rounded-lg border border-slate-300 bg-slate-50 space-y-2">
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={curDeclaraBajoJuramento}
                onChange={(e) => setDeclaraBajoJuramento(e.target.checked)}
                disabled={readOnly}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#064e3b] focus:ring-[#064e3b]"
              />
              <span className="text-[11px] text-slate-700 leading-relaxed">
                <strong>DECLARACIÓN BAJO JURAMENTO:</strong> Declaro que los datos proporcionados son veraces
                y que los fondos de esta operación provienen y serán destinados a actividades plenamente
                lícitas, autorizando su verificación conforme a la Ley N° 393 y normativa de la UIF.
              </span>
            </label>
          </div>

          {/* Firmas de Conformidad para Impresión */}
          <div className="pt-8 grid grid-cols-2 gap-8 text-center text-[10px] text-slate-500 border-t border-slate-200 mt-4">
            <div>
              <div className="border-b border-slate-300 w-3/4 mx-auto mb-1" />
              <span className="font-semibold block text-slate-700">
                {curRealizadoPor === 'TERCERO' ? curTerceroNombre : socioNombre}
              </span>
              <span>Firma del Declarante (CI: {curRealizadoPor === 'TERCERO' ? curTerceroCi : socioCi})</span>
            </div>
            <div>
              <div className="border-b border-slate-300 w-3/4 mx-auto mb-1" />
              <span className="font-semibold block text-slate-700">Operador / Funcionario</span>
              <span>Firma y Sello de Recepción</span>
            </div>
          </div>

          <p className="text-[10px] text-center text-slate-400 pt-1">
            Formulario oficial UIF - Registro de Prevención y Legitimación de Ganancias Ilícitas.
          </p>
        </form>
      </div>
    </Modal>
  )
}
