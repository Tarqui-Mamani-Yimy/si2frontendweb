import { useState } from 'react'
import { buscarCuentas, procesarDeposito } from '../../../core/api/cajaApi'
import Button from '../../../components/ui/Button'
import AlertBanner from '../../../components/ui/AlertBanner'
import Badge from '../../../components/ui/Badge'
import Skeleton from '../../../components/ui/Skeleton'
import DeclaracionUifModal from '../../../shared/components/uif/DeclaracionUifModal'

function formatMoney(value, simbolo = 'Bs') {
  const n = Number(value ?? 0)
  return `${simbolo} ${n.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function DepositoTab({ onDepositoExitoso }) {
  const [query, setQuery] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [cuentasEncontradas, setCuentasEncontradas] = useState(null)
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState(null)

  const [monto, setMonto] = useState('')
  const [depositanteNombre, setDepositanteNombre] = useState('')
  const [depositanteCi, setDepositanteCi] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)

  // Integración Declaración Jurada UIF (CU-W14)
  const [showUifModal, setShowUifModal] = useState(false)
  const [uifData, setUifData] = useState(null)

  async function handleBuscar(e) {
    e?.preventDefault()
    if (!query.trim()) return

    setErrorMsg(null)
    setBuscando(true)
    try {
      const data = await buscarCuentas(query.trim())
      setCuentasEncontradas(data || [])
      if (data && data.length === 1) {
        setCuentaSeleccionada(data[0])
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.detail ?? 'No se pudo buscar cuentas.')
      setCuentasEncontradas([])
    } finally {
      setBuscando(false)
    }
  }

  function handleSelectCuenta(c) {
    setCuentaSeleccionada(c)
    setErrorMsg(null)
    setUifData(null)
  }

  function handleAutoFillTitular() {
    if (!cuentaSeleccionada?.titular) return
    setDepositanteNombre(cuentaSeleccionada.titular.nombre_completo || '')
    setDepositanteCi(cuentaSeleccionada.titular.ci || '')
  }

  async function ejecutarDeposito(overrideUif = null) {
    const dataUif = overrideUif || uifData
    const montoNum = parseFloat(monto)

    setSubmitting(true)
    setErrorMsg(null)
    try {
      const payload = {
        cuenta_id: cuentaSeleccionada.id,
        monto: montoNum.toFixed(2),
        depositante_nombre: depositanteNombre.trim(),
        depositante_ci: depositanteCi.trim(),
      }

      if (dataUif) {
        payload.declaracion_uif = dataUif
      }

      const recibo = await procesarDeposito(payload)

      // Limpiar formulario y emitir comprobante
      setMonto('')
      setDepositanteNombre('')
      setDepositanteCi('')
      setCuentaSeleccionada(null)
      setCuentasEncontradas(null)
      setQuery('')
      setUifData(null)

      onDepositoExitoso(recibo)
    } catch (err) {
      if (err.response?.status === 428) {
        setShowUifModal(true)
        setErrorMsg(err.response?.data?.detail ?? 'Se requiere Declaración Jurada UIF para procesar esta operación.')
      } else {
        setErrorMsg(err.response?.data?.detail ?? 'Error al procesar el depósito en ventanilla.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSubmitDeposito(e) {
    e.preventDefault()
    setErrorMsg(null)

    if (!cuentaSeleccionada) {
      setErrorMsg('Debe seleccionar una cuenta de ahorro destino.')
      return
    }

    if (cuentaSeleccionada.estado !== 'ACTIVA') {
      setErrorMsg('Solo se pueden realizar depósitos en cuentas con estado ACTIVA.')
      return
    }

    const montoNum = parseFloat(monto)
    if (isNaN(montoNum) || montoNum <= 0) {
      setErrorMsg('El monto a depositar debe ser mayor a cero.')
      return
    }

    if (!depositanteNombre.trim()) {
      setErrorMsg('Ingrese el nombre del depositante.')
      return
    }

    if (!depositanteCi.trim()) {
      setErrorMsg('Ingrese el documento o CI del depositante.')
      return
    }

    // Verificación proactiva de umbral normativo UIF (BOB >= 70,000 / USD >= 10,000)
    const codigoIso = cuentaSeleccionada.moneda?.codigo_iso || (typeof cuentaSeleccionada.moneda === 'string' ? cuentaSeleccionada.moneda : 'BOB')
    const umbralUif = codigoIso === 'USD' ? 10000 : 70000

    if (montoNum >= umbralUif && !uifData) {
      setShowUifModal(true)
      return
    }

    ejecutarDeposito()
  }

  function handleConfirmarUif(datosDeclaracion) {
    setUifData(datosDeclaracion)
    setShowUifModal(false)
    ejecutarDeposito(datosDeclaracion)
  }


  return (
    <div className="space-y-6">

      {/* ── Paso 1: Búsqueda de Cuenta / Socio ── */}
      <div className="rounded-xl bg-white border border-[#e2e8f0] p-5 shadow-card">
        <h3 className="font-display text-sm font-bold text-[#0b1c30] uppercase tracking-wider mb-1">
          1. Localizar Cuenta de Ahorro Destino
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Ingrese el número de cuenta exacto o la cédula de identidad del socio titular.
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
            className="shrink-0"
          >
            Buscar Cuenta
          </Button>
        </form>

        {/* Resultados de Búsqueda */}
        {buscando ? (
          <div className="mt-4 space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : cuentasEncontradas !== null && (
          <div className="mt-4 space-y-2">
            {cuentasEncontradas.length === 0 ? (
              <p className="p-4 text-center text-xs text-slate-500 bg-slate-50 rounded-lg border border-slate-100">
                No se encontraron cuentas de ahorro asociadas a los datos ingresados.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {cuentasEncontradas.map((c) => {
                  const isSelected = cuentaSeleccionada?.id === c.id
                  const isActiva = c.estado === 'ACTIVA'
                  return (
                    <div
                      key={c.id}
                      onClick={() => handleSelectCuenta(c)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-[#006c49] bg-emerald-50/50 shadow-xs ring-1 ring-[#006c49]'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-bold text-slate-900">{c.numero}</span>
                            <Badge variant={isActiva ? 'green' : 'red'}>{c.estado}</Badge>
                          </div>
                          <p className="text-xs font-semibold text-slate-700 mt-1">
                            {c.titular?.nombre_completo}
                          </p>
                          <p className="text-[11px] text-slate-400">CI: {c.titular?.ci}</p>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Saldo</span>
                          <span className="font-display text-sm font-bold text-slate-900 tabular-nums">
                            {formatMoney(c.saldo_disponible, c.moneda?.simbolo)}
                          </span>
                        </div>
                      </div>

                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">{c.moneda?.nombre ?? 'Bolivianos'}</span>
                        <span className={`font-semibold ${isSelected ? 'text-[#006c49]' : 'text-slate-400'}`}>
                          {isSelected ? '✓ Seleccionada' : 'Click para seleccionar'}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Paso 2: Formulario de Depósito ── */}
      {cuentaSeleccionada && (
        <div className="rounded-xl bg-white border border-[#e2e8f0] p-6 shadow-card animate-slide-up">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-5 border-b border-slate-100 gap-2">
            <div>
              <h3 className="font-display text-base font-bold text-[#0b1c30]">
                2. Detalles de la Operación en Efectivo
              </h3>
              <p className="text-xs text-slate-500">
                Depositando en cuenta <strong className="text-slate-800 font-mono">{cuentaSeleccionada.numero}</strong> — {cuentaSeleccionada.titular?.nombre_completo}
              </p>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 text-[#064e3b] text-xs font-semibold border border-emerald-200">
              <span className="material-symbols-outlined text-[16px]">account_balance_wallet</span>
              <span>Saldo actual: {formatMoney(cuentaSeleccionada.saldo_disponible, cuentaSeleccionada.moneda?.simbolo)}</span>
            </div>
          </div>

          <form onSubmit={handleSubmitDeposito} className="space-y-4" noValidate>
            {/* Monto del Depósito */}
            <div>
              <label htmlFor="montoDeposito" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Monto a Depositar ({cuentaSeleccionada.moneda?.simbolo ?? 'Bs'}) *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400 font-bold text-sm">
                  {cuentaSeleccionada.moneda?.simbolo ?? 'Bs'}
                </span>
                <input
                  id="montoDeposito"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  placeholder="0.00"
                  disabled={submitting}
                  className="w-full pl-12 pr-4 h-11 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-display text-lg font-bold placeholder:text-slate-400 focus:bg-white focus:border-[#006c49] focus:ring-2 focus:ring-[#006c49]/20 outline-none transition font-mono tabular-nums"
                />
              </div>
            </div>

            {/* Datos del Depositante */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Datos de la Persona que Entrega el Efectivo
                </span>
                <button
                  type="button"
                  onClick={handleAutoFillTitular}
                  className="text-xs text-[#006c49] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[14px]">person</span>
                  <span>Mismo titular de la cuenta</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="depositanteNombre" className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Nombre Completo del Depositante *
                  </label>
                  <input
                    id="depositanteNombre"
                    type="text"
                    required
                    value={depositanteNombre}
                    onChange={(e) => setDepositanteNombre(e.target.value)}
                    placeholder="ej. Juan Carlos Pérez"
                    disabled={submitting}
                    className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#006c49] focus:ring-2 focus:ring-[#006c49]/20 outline-none transition"
                  />
                </div>

                <div>
                  <label htmlFor="depositanteCi" className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Documento de Identidad / CI *
                  </label>
                  <input
                    id="depositanteCi"
                    type="text"
                    required
                    value={depositanteCi}
                    onChange={(e) => setDepositanteCi(e.target.value)}
                    placeholder="ej. 6789123 LP"
                    disabled={submitting}
                    className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#006c49] focus:ring-2 focus:ring-[#006c49]/20 outline-none transition"
                  />
                </div>
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <AlertBanner variant="error" onClose={() => setErrorMsg(null)}>
                {errorMsg}
              </AlertBanner>
            )}

            {/* Submit Button */}
            <div className="pt-3">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={submitting}
                disabled={submitting || !monto || parseFloat(monto) <= 0}
                className="w-full bg-[#064e3b] hover:bg-[#0c4f30] text-white"
              >
                <span className="material-symbols-outlined text-[20px]">payments</span>
                <span>Procesar Depósito en Ventanilla</span>
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* ── Modal de Declaración Jurada UIF (CU-W14) ── */}
      <DeclaracionUifModal
        open={showUifModal}
        onClose={() => setShowUifModal(false)}
        onConfirmar={handleConfirmarUif}
        socio={cuentaSeleccionada?.titular}
        monto={monto}
        monedaSimbolo={cuentaSeleccionada?.moneda?.simbolo || 'Bs.'}
        tipoOperacion="DEPOSITO_VENTANILLA"
      />
    </div>
  )
}


