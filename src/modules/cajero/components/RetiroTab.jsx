import { useState } from 'react'
import { buscarCuentas, procesarRetiro } from '../../../core/api/cajaApi'
import Button from '../../../components/ui/Button'
import AlertBanner from '../../../components/ui/AlertBanner'
import Badge from '../../../components/ui/Badge'
import Skeleton from '../../../components/ui/Skeleton'

function formatMoney(value, simbolo = 'Bs.') {
  const n = Number(value ?? 0)
  return `${simbolo} ${n.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/**
 * RetiroTab — gestión de retiros en efectivo en ventanilla con validación de saldo mínimo e identidad (CU-W12).
 *
 * @param {{
 *   onRetiroExitoso: (reciboData: object) => void
 * }} props
 */
export default function RetiroTab({ onRetiroExitoso }) {
  const [query, setQuery] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [cuentasEncontradas, setCuentasEncontradas] = useState(null)
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState(null)

  // Datos del formulario de retiro
  const [monto, setMonto] = useState('')
  const [tipoRetirante, setTipoRetirante] = useState('TITULAR') // 'TITULAR' | 'APODERADO'
  const [retiranteNombre, setRetiranteNombre] = useState('')
  const [retiranteCi, setRetiranteCi] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)

  async function handleBuscar(e) {
    e?.preventDefault()
    if (!query.trim()) return

    setErrorMsg(null)
    setBuscando(true)
    try {
      const data = await buscarCuentas(query.trim())
      setCuentasEncontradas(data || [])
      if (data && data.length === 1) {
        seleccionarCuenta(data[0])
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.detail ?? 'No se pudo buscar cuentas de ahorro.')
      setCuentasEncontradas([])
    } finally {
      setBuscando(false)
    }
  }

  function seleccionarCuenta(c) {
    setCuentaSeleccionada(c)
    setErrorMsg(null)
    setTipoRetirante('TITULAR')
    if (c?.titular) {
      setRetiranteNombre(c.titular.nombre_completo || '')
      setRetiranteCi(c.titular.ci || '')
    } else {
      setRetiranteNombre('')
      setRetiranteCi('')
    }
  }

  function handleCambiarTipoRetirante(nuevoTipo) {
    setTipoRetirante(nuevoTipo)
    if (nuevoTipo === 'TITULAR' && cuentaSeleccionada?.titular) {
      setRetiranteNombre(cuentaSeleccionada.titular.nombre_completo || '')
      setRetiranteCi(cuentaSeleccionada.titular.ci || '')
    } else if (nuevoTipo === 'APODERADO') {
      setRetiranteNombre('')
      setRetiranteCi('')
    }
  }

  async function handleSubmitRetiro(e) {
    e.preventDefault()
    setErrorMsg(null)

    if (!cuentaSeleccionada) {
      setErrorMsg('Debe seleccionar una cuenta de ahorro para debitar el retiro.')
      return
    }

    if (cuentaSeleccionada.estado !== 'ACTIVA') {
      setErrorMsg('Solo se pueden realizar retiros de cuentas con estado ACTIVA.')
      return
    }

    const montoNum = parseFloat(monto)
    if (isNaN(montoNum) || montoNum <= 0) {
      setErrorMsg('El monto a retirar debe ser mayor a cero.')
      return
    }

    if (!retiranteNombre.trim()) {
      setErrorMsg('Ingrese el nombre de la persona que retira el efectivo.')
      return
    }

    if (!retiranteCi.trim()) {
      setErrorMsg('Ingrese el documento o CI de la persona que retira el efectivo.')
      return
    }

    setSubmitting(true)
    try {
      const recibo = await procesarRetiro({
        cuenta_id: cuentaSeleccionada.id,
        monto: montoNum.toFixed(2),
        retirante: {
          tipo: tipoRetirante,
          nombre: retiranteNombre.trim(),
          ci: retiranteCi.trim(),
        },
      })

      // Limpiar formulario y emitir comprobante
      setMonto('')
      setCuentaSeleccionada(null)
      setCuentasEncontradas(null)
      setQuery('')

      onRetiroExitoso(recibo)
    } catch (err) {
      setErrorMsg(err.response?.data?.detail ?? 'Error al procesar el retiro en ventanilla.')
    } finally {
      setSubmitting(false)
    }
  }

  const simboloMoneda = cuentaSeleccionada?.moneda?.simbolo || (typeof cuentaSeleccionada?.moneda === 'string' ? cuentaSeleccionada.moneda : (cuentaSeleccionada?.moneda?.codigo_iso || 'Bs.'))
  const saldoMinimoPermanencia = cuentaSeleccionada?.tipo_producto === 'PROGRAMADO' ? 50.0 : 10.0
  const saldoDisponibleNum = Number(cuentaSeleccionada?.saldo_disponible ?? 0)
  const maximoRetirable = Math.max(0, saldoDisponibleNum - saldoMinimoPermanencia)

  return (
    <div className="space-y-6">

      {/* ── Paso 1: Búsqueda de Cuenta / Socio ── */}
      <div className="rounded-xl bg-white border border-[#e2e8f0] p-5 shadow-card">
        <h3 className="font-display text-sm font-bold text-[#0b1c30] uppercase tracking-wider mb-1">
          1. Localizar Cuenta de Ahorro para Retiro
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Ingrese el número de cuenta o la cédula de identidad del socio titular.
        </p>

        <form onSubmit={handleBuscar} className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
              <span className="material-symbols-outlined text-[20px]">search</span>
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Número de cuenta o CI de socio..."
              className="w-full h-10 pl-10 pr-4 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#006c49] focus:ring-2 focus:ring-[#006c49]/20 outline-none transition"
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            loading={buscando}
            disabled={!query.trim() || buscando}
            className="h-10 px-5 gap-1.5 shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">search</span>
            <span>Buscar</span>
          </Button>
        </form>

        {buscando && (
          <div className="mt-4 space-y-2">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        )}

        {/* Resultados de búsqueda */}
        {!buscando && cuentasEncontradas && cuentasEncontradas.length > 0 && (
          <div className="mt-4 space-y-2 border-t border-slate-100 pt-3">
            <span className="text-[11px] font-semibold uppercase text-slate-400 block tracking-wider">
              Cuentas coincidentes ({cuentasEncontradas.length}):
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {cuentasEncontradas.map((c) => {
                const isSelected = cuentaSeleccionada?.id === c.id
                const sim = c.moneda?.simbolo || (typeof c.moneda === 'string' ? c.moneda : (c.moneda?.codigo_iso || 'Bs.'))
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => seleccionarCuenta(c)}
                    className={`text-left p-3 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#064e3b] bg-emerald-50/50 shadow-sm ring-1 ring-[#064e3b]'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-slate-900">{c.numero}</span>
                      <Badge variant={c.estado === 'ACTIVA' ? 'green' : 'amber'}>{c.estado}</Badge>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs text-slate-600">
                      <span>{c.titular?.nombre_completo ?? 'Sin titular'}</span>
                      <span className="font-mono font-semibold text-slate-900">
                        {formatMoney(c.saldo_disponible, sim)}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {!buscando && cuentasEncontradas && cuentasEncontradas.length === 0 && (
          <p className="mt-3 text-xs text-slate-500 italic">
            No se encontraron cuentas activas con el criterio ingresado.
          </p>
        )}
      </div>

      {/* ── Paso 2 y 3: Formulario de Retiro ── */}
      {cuentaSeleccionada && (
        <form onSubmit={handleSubmitRetiro} className="space-y-6">

          {/* Tarjeta de Cuenta Origen Seleccionada */}
          <div className="rounded-xl bg-white border border-[#e2e8f0] p-5 shadow-card">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-rose-700 text-[20px]">account_balance_wallet</span>
                <h4 className="font-display font-bold text-slate-900 text-sm">
                  Cuenta de Débito Seleccionada
                </h4>
              </div>
              <Badge variant={cuentaSeleccionada.estado === 'ACTIVA' ? 'green' : 'amber'}>
                {cuentaSeleccionada.estado}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Número de Cuenta:</span>
                <span className="font-mono font-bold text-slate-800 text-sm">{cuentaSeleccionada.numero}</span>
                <span className="text-[11px] text-slate-500 block">Tipo: {cuentaSeleccionada.tipo_producto}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Titular Registrado:</span>
                <span className="font-semibold text-slate-800 block">
                  {cuentaSeleccionada.titular?.nombre_completo}
                </span>
                <span className="font-mono text-slate-500 text-[11px] block">
                  CI: {cuentaSeleccionada.titular?.ci ?? '—'}
                </span>
              </div>
              <div className="sm:text-right">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Saldo Disponible:</span>
                <span className="font-display font-bold text-slate-900 text-base tabular-nums block">
                  {formatMoney(cuentaSeleccionada.saldo_disponible, simboloMoneda)}
                </span>
                <span className="text-[10px] text-amber-700 block mt-0.5">
                  Mínimo permanencia: {formatMoney(saldoMinimoPermanencia, simboloMoneda)}
                </span>
              </div>
            </div>

            {/* Aviso de Límite Retirable */}
            <div className="mt-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">
                Monto máximo a retirar respetando saldo mínimo:
              </span>
              <span className="font-mono font-bold text-emerald-800">
                {formatMoney(maximoRetirable, simboloMoneda)}
              </span>
            </div>
          </div>

          {/* Formulario de Retiro y Retirante */}
          <div className="rounded-xl bg-white border border-[#e2e8f0] p-6 shadow-card space-y-5">
            <h4 className="font-display font-bold text-slate-900 text-sm">
              2. Datos del Retiro en Efectivo
            </h4>

            {/* Monto */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Monto a Retirar ({simboloMoneda}) *
              </label>
              <div className="relative max-w-md">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400 font-mono font-bold text-sm">
                  {simboloMoneda}
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={maximoRetirable > 0 ? maximoRetirable : undefined}
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  placeholder="0.00"
                  required
                  className="w-full h-11 pl-12 pr-4 rounded-lg bg-slate-50 border border-slate-200 text-base font-bold font-mono text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-rose-600 focus:ring-2 focus:ring-rose-600/20 outline-none transition"
                />
              </div>

              {/* Botón rápido para retirar todo el saldo retirable */}
              {maximoRetirable > 0 && (
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setMonto(maximoRetirable.toFixed(2))}
                    className="text-[11px] font-semibold text-[#064e3b] hover:underline cursor-pointer"
                  >
                    Usar máximo retirable ({formatMoney(maximoRetirable, simboloMoneda)})
                  </button>
                </div>
              )}
            </div>

            {/* Selector de Retirante (Titular vs Apoderado) */}
            <div className="pt-3 border-t border-slate-100 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Persona que se presenta en ventanilla a retirar el efectivo *
                </label>
                <div className="grid grid-cols-2 gap-3 max-w-md">
                  <button
                    type="button"
                    onClick={() => handleCambiarTipoRetirante('TITULAR')}
                    className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                      tipoRetirante === 'TITULAR'
                        ? 'border-[#064e3b] bg-emerald-50/60 ring-1 ring-[#064e3b]'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <span className="block text-xs font-bold text-slate-900">Socio Titular</span>
                    <span className="block text-[11px] text-slate-500">Retiro directo del titular de cuenta</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCambiarTipoRetirante('APODERADO')}
                    className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                      tipoRetirante === 'APODERADO'
                        ? 'border-[#064e3b] bg-emerald-50/60 ring-1 ring-[#064e3b]'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <span className="block text-xs font-bold text-slate-900">Apoderado / Tercero</span>
                    <span className="block text-[11px] text-slate-500">Representante con poder o autorización</span>
                  </button>
                </div>
              </div>

              {/* Campos de Nombre y Cédula */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nombre Completo del Retirante *
                  </label>
                  <input
                    type="text"
                    value={retiranteNombre}
                    onChange={(e) => setRetiranteNombre(e.target.value)}
                    placeholder="Nombre y Apellidos"
                    required
                    readOnly={tipoRetirante === 'TITULAR'}
                    className={`w-full h-10 px-3 rounded-lg border text-xs text-slate-800 outline-none transition ${
                      tipoRetirante === 'TITULAR'
                        ? 'bg-slate-100 border-slate-200 cursor-not-allowed text-slate-700'
                        : 'bg-white border-slate-300 focus:border-[#006c49] focus:ring-2 focus:ring-[#006c49]/20'
                    }`}
                  />
                  {tipoRetirante === 'TITULAR' && (
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Cargado automáticamente del registro del socio.
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cédula de Identidad (CI) del Retirante *
                  </label>
                  <input
                    type="text"
                    value={retiranteCi}
                    onChange={(e) => setRetiranteCi(e.target.value)}
                    placeholder="Ej. 6543210 LP"
                    required
                    readOnly={tipoRetirante === 'TITULAR'}
                    className={`w-full h-10 px-3 rounded-lg border text-xs text-slate-800 outline-none transition font-mono ${
                      tipoRetirante === 'TITULAR'
                        ? 'bg-slate-100 border-slate-200 cursor-not-allowed text-slate-700'
                        : 'bg-white border-slate-300 focus:border-[#006c49] focus:ring-2 focus:ring-[#006c49]/20'
                    }`}
                  />
                  {tipoRetirante === 'TITULAR' && (
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Debe coincidir exactamente con el CI del socio titular.
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Error si ocurre */}
            {errorMsg && (
              <AlertBanner variant="error" onClose={() => setErrorMsg(null)}>
                {errorMsg}
              </AlertBanner>
            )}

            {/* Botón de Envío */}
            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                variant="primary"
                loading={submitting}
                disabled={submitting}
                className="gap-2 px-6 h-11 !bg-rose-700 hover:!bg-rose-800 text-white"
              >
                <span className="material-symbols-outlined text-[18px]">payments</span>
                <span>Procesar Retiro de Efectivo</span>
              </Button>
            </div>
          </div>
        </form>
      )}

    </div>
  )
}
