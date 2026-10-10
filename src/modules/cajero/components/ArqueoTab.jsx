import { useState, useEffect, useMemo } from 'react'
import { getResumenArqueo, registrarArqueo } from '../../../core/api/cajaApi'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import AlertBanner from '../../../components/ui/AlertBanner'
import Skeleton from '../../../components/ui/Skeleton'

function formatMoney(value, simbolo = 'Bs.') {
  const n = Number(value ?? 0)
  return `${simbolo} ${n.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/**
 * ArqueoTab — conteo físico por denominaciones, conciliación en tiempo real y cierre de caja (CU-W15).
 *
 * @param {{
 *   onArqueoExitoso: (arqueoData: object) => void,
 *   onIrACierre?: () => void
 * }} props
 */
export default function ArqueoTab({ onArqueoExitoso, onIrACierre }) {
  const [resumen, setResumen] = useState(null)
  const [loadingResumen, setLoadingResumen] = useState(true)
  const [errorResumen, setErrorResumen] = useState(null)

  // Moneda activa seleccionada para desglose
  const [activeMonedaId, setActiveMonedaId] = useState(null)

  // Conteo de piezas: { [monedaId]: { [valor]: number | '' } }
  const [conteo, setConteo] = useState({})

  // Formulario y opciones
  const [observacion, setObservacion] = useState('')
  const [arqueoRealizado, setArqueoRealizado] = useState(null)

  // Bloque de supervisor
  const [supervisorCorreo, setSupervisorCorreo] = useState('')
  const [supervisorContrasena, setSupervisorContrasena] = useState('')
  const [forzarSupervisor, setForzarSupervisor] = useState(false)

  // Estado de envío
  const [submitting, setSubmitting] = useState(false)
  const [errorSubmit, setErrorSubmit] = useState(null)

  useEffect(() => {
    let isMounted = true
    getResumenArqueo()
      .then((data) => {
        if (!isMounted) return
        setResumen(data)
        if (data?.monedas?.length > 0) {
          setActiveMonedaId(data.monedas[0].moneda.id)
        }
      })
      .catch((err) => {
        if (!isMounted) return
        setErrorResumen(err.response?.data?.detail ?? 'No se pudo obtener el resumen de movimientos para el arqueo.')
      })
      .finally(() => {
        if (isMounted) setLoadingResumen(false)
      })

    return () => { isMounted = false }
  }, [])

  // Cálculos en vivo por cada moneda configurada
  const calculos = useMemo(() => {
    if (!resumen?.monedas) return {}

    const res = {}
    const umbral = Number(resumen.umbral_diferencia ?? 50.0)

    for (const m of resumen.monedas) {
      const mId = m.moneda.id
      const saldoTeorico = Number(m.saldo_teorico ?? 0)
      let totalContado = 0

      for (const d of m.denominaciones || []) {
        const cant = parseInt(conteo[mId]?.[d.valor], 10) || 0
        totalContado += Number(d.valor) * cant
      }

      totalContado = Number(totalContado.toFixed(2))
      const diferencia = Number((totalContado - saldoTeorico).toFixed(2))

      let resultado = 'CUADRADO'
      if (Math.abs(diferencia) >= 0.01) {
        resultado = diferencia > 0 ? 'SOBRANTE' : 'FALTANTE'
      }

      const significativa = Math.abs(diferencia) > umbral

      res[mId] = {
        saldoTeorico,
        totalContado,
        diferencia,
        resultado,
        significativa,
      }
    }

    return res
  }, [resumen, conteo])

  // ¿Alguna moneda supera el umbral de diferencia significativa o se recibió un 409?
  const requiereSupervisor = useMemo(() => {
    if (forzarSupervisor) return true
    return Object.values(calculos).some((c) => c.significativa)
  }, [calculos, forzarSupervisor])

  function handleCantidadChange(monedaId, valor, rawValue) {
    const clean = rawValue === '' ? '' : Math.max(0, parseInt(rawValue, 10) || 0)
    setConteo((prev) => ({
      ...prev,
      [monedaId]: {
        ...(prev[monedaId] || {}),
        [valor]: clean,
      },
    }))
  }

  function handleLimpiarConteo(monedaId) {
    setConteo((prev) => ({
      ...prev,
      [monedaId]: {},
    }))
  }

  function handleIniciarEnvio(e) {
    e?.preventDefault()
    setErrorSubmit(null)

    if (requiereSupervisor) {
      if (!supervisorCorreo.trim() || !supervisorContrasena.trim()) {
        setErrorSubmit('La diferencia detectada supera el umbral permitido. Ingrese el correo y la contraseña del supervisor para autorizar.')
        return
      }
    }

    ejecutarRegistro()
  }

  async function ejecutarRegistro() {
    setSubmitting(true)
    setErrorSubmit(null)

    try {
      const payload = {
        monedas: (resumen?.monedas || []).map((m) => ({
          moneda_id: m.moneda.id,
          detalle: (m.denominaciones || []).map((d) => ({
            denominacion: d.valor,
            cantidad: parseInt(conteo[m.moneda.id]?.[d.valor], 10) || 0,
          })),
        })),
        observacion: observacion.trim() || null,
      }

      if (supervisorCorreo.trim() && supervisorContrasena.trim()) {
        payload.supervisor = {
          correo: supervisorCorreo.trim(),
          contrasena: supervisorContrasena,
        }
      }

      const arqueoResult = await registrarArqueo(payload)
      setArqueoRealizado(arqueoResult)
      onArqueoExitoso?.(arqueoResult)
    } catch (err) {
      if (err.response?.status === 409) {
        setForzarSupervisor(true)
      }
      setErrorSubmit(err.response?.data?.detail ?? 'Error al procesar el arqueo de caja.')
    } finally {
      setSubmitting(false)
    }
  }


  if (loadingResumen) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (errorResumen) {
    return (
      <AlertBanner variant="error" onClose={() => setErrorResumen(null)}>
        {errorResumen}
      </AlertBanner>
    )
  }

  if (!resumen || !resumen.monedas?.length) {
    return (
      <AlertBanner variant="info">
        No se encontraron monedas ni movimientos registrados para esta sesión de caja.
      </AlertBanner>
    )
  }

  const activeMoneda = resumen.monedas.find((m) => m.moneda.id === activeMonedaId) || resumen.monedas[0]
  const calculoActivo = calculos[activeMoneda.moneda.id] || {
    saldoTeorico: 0,
    totalContado: 0,
    diferencia: 0,
    resultado: 'CUADRADO',
  }
  const activeSimbolo = activeMoneda.moneda?.simbolo || activeMoneda.moneda?.codigo_iso || 'Bs.'

  const billetes = (activeMoneda.denominaciones || []).filter((d) => d.tipo === 'BILLETE')
  const monedasPiezas = (activeMoneda.denominaciones || []).filter((d) => d.tipo === 'MONEDA')

  return (
    <div className="space-y-6">

      {/* ── Barra Superior Informativa y Conmutador de Monedas ── */}
      <div className="rounded-xl bg-white border border-[#e2e8f0] p-5 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#064e3b] text-[20px]">balance</span>
              <h3 className="font-display font-bold text-slate-900 text-base">
                Conciliación y Conteo Físico
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Caja: <strong className="text-slate-700">{resumen.caja_nombre}</strong> &bull; Umbral de tolerancia de diferencia:{' '}
              <strong className="text-slate-700">{formatMoney(resumen.umbral_diferencia, 'Bs.')}</strong>
            </p>
          </div>

          {/* Selector de Moneda si hay más de una */}
          {resumen.monedas.length > 1 && (
            <div className="flex items-center gap-2">
              {resumen.monedas.map((m) => {
                const isSelected = m.moneda.id === activeMoneda.moneda.id
                const calc = calculos[m.moneda.id]
                return (
                  <button
                    key={m.moneda.id}
                    type="button"
                    onClick={() => setActiveMonedaId(m.moneda.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-[#064e3b] text-white border-[#064e3b] shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>{m.moneda.nombre || m.moneda.codigo_iso}</span>
                    <span className="text-[10px] opacity-80 font-mono">({m.moneda.codigo_iso})</span>
                    {calc && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                        calc.resultado === 'CUADRADO' ? 'bg-emerald-200/40 text-emerald-100' : 'bg-rose-500 text-white'
                      }`}>
                        {calc.resultado}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Tarjetas de Indicadores en Vivo para la Moneda Activa */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
          <div className="rounded-lg bg-slate-50 p-3.5 border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
              Saldo Teórico en Sistema
            </span>
            <span className="font-display text-lg font-bold text-slate-800 tabular-nums">
              {formatMoney(calculoActivo.saldoTeorico, activeSimbolo)}
            </span>
            <div className="text-[11px] text-slate-400 mt-1">
              Apertura: {formatMoney(activeMoneda.monto_apertura, activeSimbolo)} &bull; Movimientos: {activeMoneda.cantidad_movimientos}
            </div>
          </div>

          <div className="rounded-lg bg-emerald-50/60 p-3.5 border border-emerald-200">
            <span className="text-[10px] uppercase font-bold text-emerald-900 tracking-wider block">
              Total Físico Contado
            </span>
            <span className="font-display text-lg font-bold text-emerald-900 tabular-nums">
              {formatMoney(calculoActivo.totalContado, activeSimbolo)}
            </span>
            <div className="text-[11px] text-emerald-700 mt-1">
              Suma en tiempo real de billetes y monedas
            </div>
          </div>

          <div className={`rounded-lg p-3.5 border ${
            calculoActivo.resultado === 'CUADRADO'
              ? 'bg-emerald-50 border-emerald-200'
              : calculoActivo.resultado === 'SOBRANTE'
              ? 'bg-blue-50 border-blue-200'
              : 'bg-rose-50 border-rose-200'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-600 block">
                Diferencia Fiduciaria
              </span>
              {calculoActivo.resultado === 'CUADRADO' && <Badge variant="green">CUADRADO</Badge>}
              {calculoActivo.resultado === 'SOBRANTE' && <Badge variant="blue">SOBRANTE</Badge>}
              {calculoActivo.resultado === 'FALTANTE' && <Badge variant="red">FALTANTE</Badge>}
            </div>
            <span className={`font-display text-lg font-bold tabular-nums block mt-0.5 ${
              calculoActivo.resultado === 'CUADRADO'
                ? 'text-emerald-800'
                : calculoActivo.resultado === 'SOBRANTE'
                ? 'text-blue-800'
                : 'text-rose-800'
            }`}>
              {calculoActivo.diferencia > 0 ? '+' : ''}{formatMoney(calculoActivo.diferencia, activeSimbolo)}
            </span>
            <div className="text-[11px] text-slate-500 mt-1">
              {calculoActivo.significativa ? (
                <span className="text-amber-700 font-semibold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">warning</span>
                  Supera umbral ({formatMoney(resumen.umbral_diferencia, 'Bs.')})
                </span>
              ) : (
                'Dentro del margen permitido'
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Formulario de Conteo de Denominaciones ── */}
      <form onSubmit={handleIniciarEnvio} className="space-y-6">

        {/* Sección de Conteo Físico */}
        <div className="rounded-xl bg-white border border-[#e2e8f0] p-6 shadow-card space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-display font-bold text-slate-900 text-sm">
                Plantilla de Billetes y Monedas ({activeMoneda.moneda.nombre})
              </h4>
              <p className="text-xs text-slate-500">
                Ingrese la cantidad de piezas físicas de cada corte. Los subtotales se calculan automáticamente.
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => handleLimpiarConteo(activeMoneda.moneda.id)}
              className="text-xs text-slate-600 gap-1"
            >
              <span className="material-symbols-outlined text-[15px]">restart_alt</span>
              Reiniciar Conteo
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Billetes */}
            {billetes.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                  <span className="material-symbols-outlined text-emerald-700 text-[18px]">payments</span>
                  <h5 className="font-semibold text-slate-800 text-xs uppercase tracking-wider">
                    Billetes en Circulación
                  </h5>
                </div>
                <div className="space-y-2">
                  {billetes.map((d) => {
                    const cant = conteo[activeMoneda.moneda.id]?.[d.valor] ?? ''
                    const subtotal = Number(d.valor) * (parseInt(cant, 10) || 0)
                    return (
                      <div
                        key={d.valor}
                        className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 hover:border-slate-300 transition-colors"
                      >
                        <div className="w-28 shrink-0">
                          <span className="font-mono font-bold text-slate-800 text-sm">
                            {formatMoney(d.valor, activeSimbolo)}
                          </span>
                        </div>
                        <div className="flex-1 max-w-[120px]">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            placeholder="0"
                            value={cant}
                            onChange={(e) => handleCantidadChange(activeMoneda.moneda.id, d.valor, e.target.value)}
                            className="w-full text-center font-mono py-1 px-2 text-sm bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
                          />
                        </div>
                        <div className="w-28 text-right shrink-0">
                          <span className="font-mono font-semibold text-slate-700 text-xs">
                            {formatMoney(subtotal, activeSimbolo)}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Monedas */}
            {monedasPiezas.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                  <span className="material-symbols-outlined text-amber-700 text-[18px]">monetization_on</span>
                  <h5 className="font-semibold text-slate-800 text-xs uppercase tracking-wider">
                    Monedas Fraccionarias
                  </h5>
                </div>
                <div className="space-y-2">
                  {monedasPiezas.map((d) => {
                    const cant = conteo[activeMoneda.moneda.id]?.[d.valor] ?? ''
                    const subtotal = Number(d.valor) * (parseInt(cant, 10) || 0)
                    return (
                      <div
                        key={d.valor}
                        className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 hover:border-slate-300 transition-colors"
                      >
                        <div className="w-28 shrink-0">
                          <span className="font-mono font-bold text-slate-800 text-sm">
                            {formatMoney(d.valor, activeSimbolo)}
                          </span>
                        </div>
                        <div className="flex-1 max-w-[120px]">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            placeholder="0"
                            value={cant}
                            onChange={(e) => handleCantidadChange(activeMoneda.moneda.id, d.valor, e.target.value)}
                            className="w-full text-center font-mono py-1 px-2 text-sm bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
                          />
                        </div>
                        <div className="w-28 text-right shrink-0">
                          <span className="font-mono font-semibold text-slate-700 text-xs">
                            {formatMoney(subtotal, activeSimbolo)}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Observaciones y Opción de Cierre de Caja ── */}
        <div className="rounded-xl bg-white border border-[#e2e8f0] p-6 shadow-card space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Observaciones del Arqueo (Opcional)
            </label>
            <textarea
              rows={2}
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
              placeholder="Detalles sobre billetes deteriorados, incidencias del turno o justificación de diferencias..."
              className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
            />
          </div>

        </div>

        {/* ── Bloque de Autorización de Supervisor (CU-W15) ── */}
        {requiereSupervisor && (
          <div className="rounded-xl border border-amber-300 bg-amber-50/80 p-5 shadow-sm space-y-3 animate-fade-in">
            <div className="flex items-center gap-2 text-amber-900 font-bold">
              <span className="material-symbols-outlined text-amber-600 text-[22px]">admin_panel_settings</span>
              <span>Autorización Obligatoria de Supervisor</span>
            </div>
            <p className="text-xs text-amber-800">
              Se detectó una diferencia fiduciaria que supera el umbral de tolerancia permitido (
              {formatMoney(resumen.umbral_diferencia, 'Bs.')}) o el sistema rechazó el arqueo sin autorización.
              Un supervisor o administrador de la cooperativa debe verificar y firmar digitalmente con sus credenciales.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Correo del Supervisor *
                </label>
                <input
                  type="email"
                  value={supervisorCorreo}
                  onChange={(e) => setSupervisorCorreo(e.target.value)}
                  placeholder="supervisor@cooperativa.com"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contraseña del Supervisor *
                </label>
                <input
                  type="password"
                  value={supervisorContrasena}
                  onChange={(e) => setSupervisorContrasena(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>
            </div>
          </div>
        )}

        {/* Notificación de Arqueo Exitoso con Acceso a Cierre */}
        {arqueoRealizado && (
          <div className="rounded-xl border border-emerald-300 bg-emerald-50/80 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-emerald-700 text-[24px]">task_alt</span>
              <div>
                <span className="text-xs font-bold text-emerald-900 block">
                  Arqueo físico registrado exitosamente (#{arqueoRealizado.id})
                </span>
                <span className="text-[11px] text-emerald-700">
                  El conteo quedó asentado formalmente. Podés continuar operando en ventanilla o proceder al cierre de turno.
                </span>
              </div>
            </div>
            {onIrACierre && (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={onIrACierre}
                className="gap-1.5 shrink-0"
              >
                <span>Ir a Cierre de Turno</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Button>
            )}
          </div>
        )}

        {/* Mensaje de Error si ocurre */}
        {errorSubmit && (
          <AlertBanner variant="error" onClose={() => setErrorSubmit(null)}>
            {errorSubmit}
          </AlertBanner>
        )}

        {/* ── Botones de Acción ── */}
        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="submit"
            variant="primary"
            disabled={submitting}
            className="gap-2 min-w-[200px]"
          >
            <span className="material-symbols-outlined text-[18px]">verified</span>
            <span>{submitting ? 'Procesando Arqueo...' : 'Registrar Arqueo Físico'}</span>
          </Button>
        </div>
      </form>
    </div>
  )
}
