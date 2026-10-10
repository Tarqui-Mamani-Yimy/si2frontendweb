import { useState, useEffect, useMemo, useRef } from 'react'
import Modal from '../../../../components/ui/Modal'
import Button from '../../../../components/ui/Button'
import Badge from '../../../../components/ui/Badge'
import AlertBanner from '../../../../components/ui/AlertBanner'
import { FormField, Input, Textarea } from '../../../../components/ui/FormField'
import {
  buscarSociosCredito,
  getProductosCredito,
  simularSolicitudCredito,
  crearSolicitudCredito,
  actualizarSolicitudCredito,
} from '../../../../core/api/creditosApi'

const DESTINOS = [
  { codigo: 'CAPITAL_TRABAJO', label: 'Capital de Trabajo (Mercadería, Insumos)' },
  { codigo: 'ACTIVO_FIJO', label: 'Activo Fijo (Maquinaria, Vehículo, Equipos)' },
  { codigo: 'CONSUMO', label: 'Consumo Personal o Familiar' },
  { codigo: 'VIVIENDA', label: 'Vivienda (Compra, Refacción, Construcción)' },
  { codigo: 'EDUCACION', label: 'Educación y Formación Técnica' },
  { codigo: 'SALUD', label: 'Salud y Gastos Médicos' },
  { codigo: 'REFINANCIAMIENTO', label: 'Refinanciamiento / Consolidación de Deudas' },
  { codigo: 'OTRO', label: 'Otro Destino (Especificar)' },
]

const FUENTES_INGRESO = [
  { codigo: 'DEPENDIENTE', label: 'Dependiente (Asalariado / En Planilla)' },
  { codigo: 'INDEPENDIENTE', label: 'Independiente (Negocio / Comercio Propio)' },
  { codigo: 'MIXTO', label: 'Mixto (Ingresos combinados)' },
]

const CALIFICACIONES_ASFI = [
  { codigo: 'A', label: 'Categoría A — Normal / Excelente Historial' },
  { codigo: 'B', label: 'Categoría B — Problemas Potenciales / Riesgo Bajo' },
  { codigo: 'C', label: 'Categoría C — Deficiente / Riesgo Moderado' },
  { codigo: 'D', label: 'Categoría D — Dudoso / Riesgo Apreciable' },
  { codigo: 'E', label: 'Categoría E — Pérdida / Alto Riesgo' },
  { codigo: 'F', label: 'Categoría F — Castigado / Ejecución' },
]

function formatMoney(value, simbolo = 'Bs.') {
  const n = Number(value ?? 0)
  return `${simbolo} ${n.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/**
 * SolicitudModal — Formulario de registro y edición de solicitud de crédito con evaluación y simulación en vivo (CU-W21).
 *
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   solicitud: object|null,
 *   onSuccess: () => void
 * }} props
 */
export default function SolicitudModal({
  open,
  onClose,
  solicitud,
  onSuccess,
}) {
  const isEdit = Boolean(solicitud)

  // Productos activos disponibles
  const [productosActivos, setProductosActivos] = useState([])
  const [loadingProductos, setLoadingProductos] = useState(true)

  // Búsqueda de socios (solo en creación)
  const [busquedaSocio, setBusquedaSocio] = useState('')
  const [sociosEncontrados, setSociosEncontrados] = useState([])
  const [buscandoSocio, setBuscandoSocio] = useState(false)
  const [socioSeleccionado, setSocioSeleccionado] = useState(() => solicitud?.socio || null)

  // Estado del formulario
  const [productoId, setProductoId] = useState(() => solicitud?.producto?.id ? String(solicitud.producto.id) : '')
  const [monto, setMonto] = useState(() => solicitud?.monto != null ? String(solicitud.monto) : '')
  const [plazoMeses, setPlazoMeses] = useState(() => solicitud?.plazo_meses != null ? String(solicitud.plazo_meses) : '')
  const [destino, setDestino] = useState(() => solicitud?.destino || 'CAPITAL_TRABAJO')
  const [destinoDetalle, setDestinoDetalle] = useState(() => solicitud?.destino_detalle || '')
  const [observaciones, setObservaciones] = useState(() => solicitud?.observaciones || '')

  // Evaluación socioeconómica
  const [ingresoMensual, setIngresoMensual] = useState(() => solicitud?.evaluacion?.ingreso_mensual != null ? String(solicitud.evaluacion.ingreso_mensual) : '')
  const [egresoMensual, setEgresoMensual] = useState(() => solicitud?.evaluacion?.egreso_mensual != null ? String(solicitud.evaluacion.egreso_mensual) : '')
  const [cuotaDeudasMensual, setCuotaDeudasMensual] = useState(() => solicitud?.evaluacion?.cuota_deudas_mensual != null ? String(solicitud.evaluacion.cuota_deudas_mensual) : '0')
  const [actividadEconomica, setActividadEconomica] = useState(() => solicitud?.evaluacion?.actividad_economica || '')
  const [fuenteIngresos, setFuenteIngresos] = useState(() => solicitud?.evaluacion?.fuente_ingresos || 'INDEPENDIENTE')
  const [antiguedadLaboralMeses, setAntiguedadLaboralMeses] = useState(() => solicitud?.evaluacion?.antiguedad_laboral_meses != null ? String(solicitud.evaluacion.antiguedad_laboral_meses) : '12')
  const [calificacionAsfi, setCalificacionAsfi] = useState(() => solicitud?.evaluacion?.calificacion_asfi || 'A')
  const [coordenadas, setCoordenadas] = useState(() => solicitud?.evaluacion?.coordenadas || '')
  const [evalObservaciones, setEvalObservaciones] = useState(() => solicitud?.evaluacion?.observaciones || '')

  // Simulación en vivo
  const [simulacion, setSimulacion] = useState(null)
  const [simulando, setSimulando] = useState(false)

  // Errores y estado de envío
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Cargar productos activos al montar
  useEffect(() => {
    let isMounted = true
    getProductosCredito({ estado: 'ACTIVO' })
      .then((data) => {
        if (!isMounted) return
        const prods = Array.isArray(data) ? data : []
        setProductosActivos(prods)
        // Si no hay producto seleccionado y hay disponibles, seleccionar el primero si es creación
        if (!isEdit && prods.length > 0) {
          setProductoId((prev) => prev || String(prods[0].id))
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setLoadingProductos(false)
      })

    return () => {
      isMounted = false
    }
  }, [isEdit])

  // Producto seleccionado actualmente
  const productoSeleccionado = useMemo(() => {
    if (!productoId) return null
    return productosActivos.find((p) => String(p.id) === String(productoId)) || null
  }, [productosActivos, productoId])

  const monedaSimbolo = productoSeleccionado?.moneda?.simbolo || solicitud?.moneda?.simbolo || 'Bs.'

  // Búsqueda de socios con debounce
  const debounceSocioRef = useRef(null)
  function handleBuscarSocioChange(text) {
    setBusquedaSocio(text)
    if (debounceSocioRef.current) clearTimeout(debounceSocioRef.current)

    const trimmed = text.trim()
    if (trimmed.length < 3) {
      setSociosEncontrados([])
      return
    }

    debounceSocioRef.current = setTimeout(async () => {
      setBuscandoSocio(true)
      try {
        const data = await buscarSociosCredito(trimmed)
        setSociosEncontrados(Array.isArray(data) ? data : [])
      } catch {
        setSociosEncontrados([])
      } finally {
        setBuscandoSocio(false)
      }
    }, 350)
  }

  // Simulación en vivo debounced cuando cambian producto/monto/plazo/ingresos
  useEffect(() => {
    const timer = setTimeout(async () => {
      const numMonto = parseFloat(monto)
      const numPlazo = parseInt(plazoMeses, 10)
      const numProductoId = Number(productoId)

      if (!numProductoId || isNaN(numMonto) || numMonto <= 0 || isNaN(numPlazo) || numPlazo <= 0) {
        setSimulacion(null)
        return
      }

      setSimulando(true)
      try {
        const sim = await simularSolicitudCredito({
          producto_id: numProductoId,
          monto: numMonto.toFixed(2),
          plazo_meses: numPlazo,
          ingreso_mensual: ingresoMensual ? parseFloat(ingresoMensual).toFixed(2) : undefined,
          egreso_mensual: egresoMensual ? parseFloat(egresoMensual).toFixed(2) : undefined,
          cuota_deudas_mensual: cuotaDeudasMensual ? parseFloat(cuotaDeudasMensual).toFixed(2) : undefined,
        })
        setSimulacion(sim)
      } catch {
        // En caso de fallo de red
      } finally {
        setSimulando(false)
      }
    }, 400)

    return () => clearTimeout(timer)
  }, [productoId, monto, plazoMeses, ingresoMensual, egresoMensual, cuotaDeudasMensual])

  // Cálculo en cliente de capacidad de pago preliminar
  const capacidadPagoEstimada = useMemo(() => {
    const ing = parseFloat(ingresoMensual) || 0
    const egr = parseFloat(egresoMensual) || 0
    const deu = parseFloat(cuotaDeudasMensual) || 0
    return ing - egr - deu
  }, [ingresoMensual, egresoMensual, cuotaDeudasMensual])

  function validate() {
    const errs = {}

    if (!isEdit && !socioSeleccionado) {
      errs.socio = 'Debe buscar y seleccionar al socio titular solicitante.'
    }

    if (!productoId) {
      errs.producto_id = 'Debe seleccionar un producto crediticio.'
    }

    const m = parseFloat(monto)
    if (isNaN(m) || m <= 0) {
      errs.monto = 'El monto debe ser un valor mayor a cero.'
    } else if (productoSeleccionado) {
      const min = parseFloat(productoSeleccionado.monto_min)
      const max = parseFloat(productoSeleccionado.monto_max)
      if (m < min || m > max) {
        errs.monto = `El monto debe situarse entre ${formatMoney(min, monedaSimbolo)} y ${formatMoney(max, monedaSimbolo)}.`
      }
    }

    const p = parseInt(plazoMeses, 10)
    if (isNaN(p) || p <= 0) {
      errs.plazo_meses = 'El plazo debe ser de al menos 1 mes.'
    } else if (productoSeleccionado) {
      const pMin = productoSeleccionado.plazo_min_meses
      const pMax = productoSeleccionado.plazo_max_meses
      if (p < pMin || p > pMax) {
        errs.plazo_meses = `El plazo debe situarse entre ${pMin} y ${pMax} meses.`
      }
    }

    if (destino === 'OTRO' && !destinoDetalle.trim()) {
      errs.destino_detalle = 'Debe especificar el detalle cuando el destino es "Otro".'
    }

    const ing = parseFloat(ingresoMensual)
    if (isNaN(ing) || ing <= 0) {
      errs.ingreso_mensual = 'Debe ingresar el ingreso mensual comprobable (mayor a 0).'
    }

    const egr = parseFloat(egresoMensual)
    if (isNaN(egr) || egr < 0) {
      errs.egreso_mensual = 'El egreso mensual debe ser 0 o un valor positivo.'
    }

    const deu = parseFloat(cuotaDeudasMensual)
    if (isNaN(deu) || deu < 0) {
      errs.cuota_deudas_mensual = 'La cuota de otras deudas debe ser 0 o un valor positivo.'
    }

    if (!actividadEconomica.trim()) {
      errs.actividad_economica = 'Debe indicar la actividad económica del socio.'
    }

    const ant = parseInt(antiguedadLaboralMeses, 10)
    if (isNaN(ant) || ant < 0) {
      errs.antiguedad_laboral_meses = 'La antigüedad laboral debe ser 0 o mayor.'
    }

    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setApiError(null)

    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setSubmitting(true)

    try {
      const payloadEvaluacion = {
        ingreso_mensual: parseFloat(ingresoMensual).toFixed(2),
        egreso_mensual: parseFloat(egresoMensual).toFixed(2),
        cuota_deudas_mensual: parseFloat(cuotaDeudasMensual).toFixed(2),
        actividad_economica: actividadEconomica.trim(),
        fuente_ingresos: fuenteIngresos,
        antiguedad_laboral_meses: parseInt(antiguedadLaboralMeses, 10),
        calificacion_asfi: calificacionAsfi,
        coordenadas: coordenadas.trim() || undefined,
        observaciones: evalObservaciones.trim() || undefined,
      }

      if (isEdit) {
        // En PUT no se envía socio_id
        const payloadEdit = {
          producto_id: Number(productoId),
          monto: parseFloat(monto).toFixed(2),
          plazo_meses: parseInt(plazoMeses, 10),
          destino,
          destino_detalle: destino === 'OTRO' ? destinoDetalle.trim() : undefined,
          observaciones: observaciones.trim() || undefined,
          evaluacion: payloadEvaluacion,
        }
        await actualizarSolicitudCredito(solicitud.id, payloadEdit)
      } else {
        const payloadCreate = {
          socio_id: socioSeleccionado.id,
          producto_id: Number(productoId),
          monto: parseFloat(monto).toFixed(2),
          plazo_meses: parseInt(plazoMeses, 10),
          destino,
          destino_detalle: destino === 'OTRO' ? destinoDetalle.trim() : undefined,
          observaciones: observaciones.trim() || undefined,
          evaluacion: payloadEvaluacion,
        }
        await crearSolicitudCredito(payloadCreate)
      }

      onSuccess?.()
      onClose()
    } catch (err) {
      const detail = err.response?.data?.detail
      setApiError(detail || (isEdit ? 'Error al actualizar la solicitud.' : 'Error al registrar la solicitud.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? `Editar Solicitud ${solicitud?.numero_solicitud || ''}` : 'Nueva Solicitud de Crédito'}
      subtitle="Recepción, originación y evaluación socioeconómica del socio (CU-W21)"
      footer={
        <div className="flex w-full items-center justify-between">
          <Button variant="secondary" size="sm" type="button" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button variant="primary" size="sm" type="submit" form="solicitud-form" loading={submitting}>
            {isEdit ? 'Guardar Cambios' : 'Registrar Solicitud'}
          </Button>
        </div>
      }
    >
      <form id="solicitud-form" onSubmit={handleSubmit} className="space-y-5 text-xs">
        {apiError && (
          <AlertBanner variant="error" onClose={() => setApiError(null)}>
            {apiError}
          </AlertBanner>
        )}

        {/* ── 1. Socio Titular ── */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-1.5">
            <span className="material-symbols-outlined text-[18px] text-[#064e3b]">person</span>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              1. Socio Solicitante
            </h4>
          </div>

          {socioSeleccionado ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 block text-sm">
                  {socioSeleccionado.nombre_completo}
                </span>
                <span className="font-mono text-slate-600 text-xs">
                  CI: {socioSeleccionado.ci} &bull; Estado: {socioSeleccionado.estado}
                </span>
              </div>
              {!isEdit && (
                <button
                  type="button"
                  onClick={() => setSocioSeleccionado(null)}
                  className="text-xs text-emerald-800 hover:text-emerald-950 font-semibold underline cursor-pointer"
                >
                  Cambiar socio
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <FormField id="busqueda_socio" label="Buscar Socio por Cédula o Nombre *" error={errors.socio}>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-[18px]">
                    search
                  </span>
                  <input
                    id="busqueda_socio"
                    type="text"
                    placeholder="Escriba al menos 3 caracteres (CI o apellido)..."
                    value={busquedaSocio}
                    onChange={(e) => handleBuscarSocioChange(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#064e3b]"
                  />
                  {buscandoSocio && (
                    <span className="absolute right-3 top-2.5 text-[11px] text-slate-400">
                      Buscando...
                    </span>
                  )}
                </div>
              </FormField>

              {sociosEncontrados.length > 0 && (
                <div className="max-h-36 overflow-y-auto rounded-lg border border-slate-200 bg-white divide-y divide-slate-100 shadow-sm">
                  {sociosEncontrados.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setSocioSeleccionado(s)
                        setSociosEncontrados([])
                        setBusquedaSocio('')
                        if (errors.socio) {
                          setErrors((prev) => {
                            const next = { ...prev }
                            delete next.socio
                            return next
                          })
                        }
                      }}
                      className="w-full text-left p-2.5 hover:bg-emerald-50/60 transition flex items-center justify-between"
                    >
                      <div>
                        <span className="font-semibold text-slate-800 block">{s.nombre_completo}</span>
                        <span className="font-mono text-slate-500 text-[11px]">CI: {s.ci}</span>
                      </div>
                      <Badge variant="green">Activo</Badge>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── 2. Parámetros del Crédito y Producto ── */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-1.5">
            <span className="material-symbols-outlined text-[18px] text-[#064e3b]">credit_card</span>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              2. Parámetros del Crédito
            </h4>
          </div>

          <div>
            <FormField id="producto_id" label="Producto Crediticio Activo *" error={errors.producto_id}>
              {loadingProductos ? (
                <div className="h-10 rounded-lg bg-slate-100 animate-pulse" />
              ) : (
                <select
                  id="producto_id"
                  value={productoId}
                  onChange={(e) => setProductoId(e.target.value)}
                  className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50/60 px-3 text-xs text-[#0b1c30] outline-none transition focus:border-[#006c49] focus:bg-white focus:ring-2 focus:ring-[#006c49]/20"
                >
                  <option value="">Seleccione un producto...</option>
                  {productosActivos.map((p) => {
                    const sim = p.moneda?.simbolo || 'Bs.'
                    const iso = p.moneda?.codigo_iso || 'BOB'
                    return (
                      <option key={p.id} value={p.id}>
                        {p.codigo} — {p.nombre} ({iso} {sim}) | {Number(p.tasa_interes_anual).toFixed(2)}% TNA
                      </option>
                    )
                  })}
                </select>
              )}
            </FormField>
          </div>

          {productoSeleccionado && (
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              <div>
                <span className="text-slate-400 block font-semibold uppercase text-[10px]">TNA Nominal:</span>
                <span className="font-bold text-[#064e3b] text-sm tabular-nums">
                  {Number(productoSeleccionado.tasa_interes_anual).toFixed(2)}%
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold uppercase text-[10px]">Amortización:</span>
                <span className="font-bold text-slate-800">
                  {productoSeleccionado.tipo_amortizacion === 'FRANCES' ? 'Francés (Fija)' : 'Alemán (Capital)'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold uppercase text-[10px]">Rango Monto:</span>
                <span className="font-mono text-slate-800 tabular-nums">
                  {formatMoney(productoSeleccionado.monto_min, monedaSimbolo)} – {formatMoney(productoSeleccionado.monto_max, monedaSimbolo)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold uppercase text-[10px]">Rango Plazo:</span>
                <span className="font-mono text-slate-800 tabular-nums">
                  {productoSeleccionado.plazo_min_meses} a {productoSeleccionado.plazo_max_meses} meses
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <FormField id="monto" label={`Monto Solicitado (${monedaSimbolo}) *`} error={errors.monto}>
              <Input
                id="monto"
                type="number"
                step="0.01"
                min="1"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                placeholder="Ej. 15000.00"
                hasError={Boolean(errors.monto)}
                className="tabular-nums font-bold"
              />
            </FormField>

            <FormField id="plazo_meses" label="Plazo Solicitado (Meses) *" error={errors.plazo_meses}>
              <Input
                id="plazo_meses"
                type="number"
                step="1"
                min="1"
                value={plazoMeses}
                onChange={(e) => setPlazoMeses(e.target.value)}
                placeholder="Ej. 24"
                hasError={Boolean(errors.plazo_meses)}
                className="tabular-nums font-bold"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField id="destino" label="Destino del Crédito *">
              <select
                id="destino"
                value={destino}
                onChange={(e) => setDestino(e.target.value)}
                className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50/60 px-3 text-xs text-[#0b1c30] outline-none transition focus:border-[#006c49] focus:bg-white focus:ring-2 focus:ring-[#006c49]/20"
              >
                {DESTINOS.map((d) => (
                  <option key={d.codigo} value={d.codigo}>
                    {d.label}
                  </option>
                ))}
              </select>
            </FormField>

            {destino === 'OTRO' ? (
              <FormField id="destino_detalle" label="Especifique Destino *" error={errors.destino_detalle}>
                <Input
                  id="destino_detalle"
                  value={destinoDetalle}
                  onChange={(e) => setDestinoDetalle(e.target.value)}
                  placeholder="Detalle específico del destino..."
                  hasError={Boolean(errors.destino_detalle)}
                />
              </FormField>
            ) : (
              <FormField id="observaciones" label="Observaciones / Justificación">
                <Input
                  id="observaciones"
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Notas adicionales sobre la solicitud..."
                />
              </FormField>
            )}
          </div>
        </div>

        {/* ── 3. Evaluación Socioeconómica y Capacidad de Pago ── */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-1.5">
            <span className="material-symbols-outlined text-[18px] text-[#064e3b]">analytics</span>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              3. Evaluación Socioeconómica
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FormField id="ingreso_mensual" label={`Ingreso Mensual (${monedaSimbolo}) *`} error={errors.ingreso_mensual}>
              <Input
                id="ingreso_mensual"
                type="number"
                step="0.01"
                min="0.01"
                value={ingresoMensual}
                onChange={(e) => setIngresoMensual(e.target.value)}
                placeholder="Ej. 6500.00"
                hasError={Boolean(errors.ingreso_mensual)}
                className="tabular-nums"
              />
            </FormField>

            <FormField id="egreso_mensual" label={`Egreso Familiar (${monedaSimbolo}) *`} error={errors.egreso_mensual}>
              <Input
                id="egreso_mensual"
                type="number"
                step="0.01"
                min="0"
                value={egresoMensual}
                onChange={(e) => setEgresoMensual(e.target.value)}
                placeholder="Ej. 3000.00"
                hasError={Boolean(errors.egreso_mensual)}
                className="tabular-nums"
              />
            </FormField>

            <FormField id="cuota_deudas_mensual" label={`Otras Cuotas Deuda (${monedaSimbolo}) *`} error={errors.cuota_deudas_mensual}>
              <Input
                id="cuota_deudas_mensual"
                type="number"
                step="0.01"
                min="0"
                value={cuotaDeudasMensual}
                onChange={(e) => setCuotaDeudasMensual(e.target.value)}
                placeholder="0.00"
                hasError={Boolean(errors.cuota_deudas_mensual)}
                className="tabular-nums"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FormField id="actividad_economica" label="Actividad Económica *" error={errors.actividad_economica}>
              <Input
                id="actividad_economica"
                value={actividadEconomica}
                onChange={(e) => setActividadEconomica(e.target.value)}
                placeholder="Ej. Venta de repuestos automotrices"
                hasError={Boolean(errors.actividad_economica)}
              />
            </FormField>

            <FormField id="fuente_ingresos" label="Fuente de Ingresos *">
              <select
                id="fuente_ingresos"
                value={fuenteIngresos}
                onChange={(e) => setFuenteIngresos(e.target.value)}
                className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50/60 px-3 text-xs text-[#0b1c30] outline-none transition focus:border-[#006c49] focus:bg-white focus:ring-2 focus:ring-[#006c49]/20"
              >
                {FUENTES_INGRESO.map((f) => (
                  <option key={f.codigo} value={f.codigo}>
                    {f.label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField id="antiguedad_laboral_meses" label="Antigüedad Laboral (Meses) *" error={errors.antiguedad_laboral_meses}>
              <Input
                id="antiguedad_laboral_meses"
                type="number"
                step="1"
                min="0"
                value={antiguedadLaboralMeses}
                onChange={(e) => setAntiguedadLaboralMeses(e.target.value)}
                placeholder="12"
                hasError={Boolean(errors.antiguedad_laboral_meses)}
                className="tabular-nums"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField id="calificacion_asfi" label="Calificación ASFI Histórica *">
              <select
                id="calificacion_asfi"
                value={calificacionAsfi}
                onChange={(e) => setCalificacionAsfi(e.target.value)}
                className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50/60 px-3 text-xs text-[#0b1c30] outline-none transition focus:border-[#006c49] focus:bg-white focus:ring-2 focus:ring-[#006c49]/20 font-bold"
              >
                {CALIFICACIONES_ASFI.map((c) => (
                  <option key={c.codigo} value={c.codigo}>
                    {c.label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField id="coordenadas" label="Coordenadas / Georreferencia (Opcional)">
              <Input
                id="coordenadas"
                value={coordenadas}
                onChange={(e) => setCoordenadas(e.target.value)}
                placeholder="Ej. -16.5000, -68.1500"
                className="font-mono text-xs"
              />
            </FormField>
          </div>

          <FormField id="eval_observaciones" label="Observaciones de Evaluación Socioeconómica (Opcional)">
            <Textarea
              id="eval_observaciones"
              rows={2}
              value={evalObservaciones}
              onChange={(e) => setEvalObservaciones(e.target.value)}
              placeholder="Detalles sobre el negocio, fuentes de verificación, garantías preliminares..."
            />
          </FormField>
        </div>

        {/* ── 4. Panel de Simulación en Vivo y Relación Cuota/Ingreso ── */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-slate-200/70">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
              <span className="material-symbols-outlined text-[16px] text-[#064e3b]">calculate</span>
              <span>Simulación Financiera en Vivo</span>
            </div>
            {simulando && (
              <span className="text-[10px] text-slate-500 animate-pulse font-medium">
                Recalculando...
              </span>
            )}
          </div>

          {/* Errores de rango devueltos por el endpoint de simulación */}
          {simulacion?.errores?.length > 0 && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-2.5 space-y-1">
              {simulacion.errores.map((err, i) => (
                <div key={i} className="flex items-center gap-1.5 text-rose-700 text-[11px] font-medium">
                  <span className="material-symbols-outlined text-[14px]">error</span>
                  <span>{err}</span>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-2.5 rounded-lg bg-white border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Cuota Estimada</span>
              <span className="font-display font-bold text-slate-900 text-base tabular-nums">
                {simulacion?.cuota_estimada ? formatMoney(simulacion.cuota_estimada, monedaSimbolo) : '—'}
              </span>
              <span className="text-[10px] text-slate-400 block">
                {productoSeleccionado?.tipo_amortizacion === 'ALEMAN' ? '1ra cuota máx.' : 'Mensual fija'}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-white border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Intereses</span>
              <span className="font-display font-semibold text-slate-800 text-sm tabular-nums">
                {simulacion?.total_intereses_estimado ? formatMoney(simulacion.total_intereses_estimado, monedaSimbolo) : '—'}
              </span>
              <span className="text-[10px] text-slate-400 block">Base {productoSeleccionado?.tasa_interes_anual ?? '0'}% TNA</span>
            </div>

            <div className="p-2.5 rounded-lg bg-white border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Capacidad Pago Neta</span>
              <span className={`font-display font-bold text-sm tabular-nums ${
                (simulacion?.capacidad_pago != null ? parseFloat(simulacion.capacidad_pago) : capacidadPagoEstimada) < 0
                  ? 'text-rose-600'
                  : 'text-emerald-700'
              }`}>
                {formatMoney(simulacion?.capacidad_pago != null ? simulacion.capacidad_pago : capacidadPagoEstimada, monedaSimbolo)}
              </span>
              <span className="text-[10px] text-slate-400 block">Ingreso - Egresos</span>
            </div>

            <div className="p-2.5 rounded-lg bg-white border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Relación Cuota/Ingreso</span>
              <div className="flex items-center justify-center gap-1">
                <span className={`font-display font-bold text-sm tabular-nums ${
                  simulacion?.supera_relacion_maxima ? 'text-amber-700' : 'text-slate-900'
                }`}>
                  {simulacion?.relacion_cuota_ingreso != null ? `${Number(simulacion.relacion_cuota_ingreso).toFixed(1)}%` : '—'}
                </span>
                <span className="text-[10px] text-slate-400">
                  (máx {simulacion?.relacion_maxima ? `${Number(simulacion.relacion_maxima).toFixed(0)}%` : '40%'})
                </span>
              </div>
              <div className="mt-0.5">
                {simulacion?.supera_relacion_maxima ? (
                  <Badge variant="amber">Supera límite</Badge>
                ) : (
                  <Badge variant="green">Dentro de regla</Badge>
                )}
              </div>
            </div>
          </div>

          {/* Advertencia informativa si supera RCI máximo */}
          {simulacion?.supera_relacion_maxima && (
            <div className="p-2.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-900 text-[11px] flex items-start gap-2">
              <span className="material-symbols-outlined text-[16px] text-amber-700 shrink-0">info</span>
              <p>
                <strong>Nota fiduciaria:</strong> La cuota mensual estimada representa más del {Number(simulacion.relacion_maxima).toFixed(0)}% de los ingresos netos del socio. La solicitud puede registrarse normalmente para elevarse al Comité de Crédito (CU-W23).
              </p>
            </div>
          )}
        </div>
      </form>
    </Modal>
  )
}
