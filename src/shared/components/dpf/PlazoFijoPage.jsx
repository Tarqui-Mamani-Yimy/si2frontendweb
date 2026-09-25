import { useState, useEffect, useMemo, useCallback } from 'react'
import PageHeader from '../../../components/ui/PageHeader'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import AlertBanner from '../../../components/ui/AlertBanner'
import Skeleton from '../../../components/ui/Skeleton'
import DeclaracionUifModal from '../uif/DeclaracionUifModal'
import CertificadoDpfModal from './CertificadoDpfModal'
import LiquidacionDpfModal from './LiquidacionDpfModal'
import { buscarCuentas } from '../../../core/api/cajaApi'
import {
  getTarifarioDpf,
  simularDpf,
  emitirDpf,
  listDpf,
  getDpf,
} from '../../../core/api/dpfApi'

function formatMoney(value, simbolo = 'Bs.') {
  const n = Number(value ?? 0)
  return `${simbolo} ${n.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function PlazoFijoPage() {
  const [activeTab, setActiveTab] = useState('simular') // 'simular' | 'cartera'

  // Tarifario de tasas
  const [tarifario, setTarifario] = useState([])

  // ── Pestaña Simulación y Emisión ──
  const [querySocio, setQuerySocio] = useState('')
  const [buscandoSocio, setBuscandoSocio] = useState(false)
  const [socioSeleccionado, setSocioSeleccionado] = useState(null)
  const [cuentasSocio, setCuentasSocio] = useState([])

  // Formulario DPF
  const [monedaId, setMonedaId] = useState(1) // 1: BOB, 2: USD
  const [monto, setMonto] = useState('')
  const [plazoDias, setPlazoDias] = useState(360)
  const [modalidadPago, setModalidadPago] = useState('VENCIMIENTO')
  const [origenFondos, setOrigenFondos] = useState('CUENTA') // 'CUENTA' | 'EFECTIVO'
  const [cuentaOrigenId, setCuentaOrigenId] = useState('')
  const [cuentaAbonoId, setCuentaAbonoId] = useState('')

  // Simulación
  const [simulacion, setSimulacion] = useState(null)
  const [simulando, setSimulando] = useState(false)
  const [errorSimulacion, setErrorSimulacion] = useState(null)

  // Emisión y UIF
  const [submittingEmision, setSubmittingEmision] = useState(false)
  const [errorEmision, setErrorEmision] = useState(null)
  const [showUifModal, setShowUifModal] = useState(false)
  const [uifData, setUifData] = useState(null)
  const [dpfEmitido, setDpfEmitido] = useState(null)

  // ── Pestaña Cartera de DPFs ──
  const [cartera, setCartera] = useState([])
  const [loadingCartera, setLoadingCartera] = useState(false)
  const [errorCartera, setErrorCartera] = useState(null)
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroVenceEn, setFiltroVenceEn] = useState('')
  const [filtroCi, setFiltroCi] = useState('')

  // Modales
  const [selectedDpfCertificado, setSelectedDpfCertificado] = useState(null)
  const [selectedDpfLiquidacion, setSelectedDpfLiquidacion] = useState(null)

  useEffect(() => {
    let isMounted = true
    getTarifarioDpf()
      .then((data) => {
        if (!isMounted) return
        setTarifario(data || [])
      })
      .catch(() => {})

    return () => { isMounted = false }
  }, [])

  const cargarCartera = useCallback(() => {
    setLoadingCartera(true)
    setErrorCartera(null)
    const params = {}
    if (filtroEstado) params.estado = filtroEstado
    if (filtroVenceEn) params.vence_en_dias = filtroVenceEn
    if (filtroCi.trim()) params.socio_ci = filtroCi.trim()

    listDpf(params)
      .then((data) => setCartera(data || []))
      .catch((err) => setErrorCartera(err.response?.data?.detail ?? 'Error al cargar cartera de DPFs.'))
      .finally(() => setLoadingCartera(false))
  }, [filtroEstado, filtroVenceEn, filtroCi])

  async function handleBuscarSocio(e) {
    e?.preventDefault()
    if (!querySocio.trim()) return

    setBuscandoSocio(true)
    try {
      const data = await buscarCuentas(querySocio.trim())
      if (data && data.length > 0) {
        const primerTitular = data[0].titular
        setSocioSeleccionado(primerTitular)
        setCuentasSocio(data)
        const primeraCuenta = data[0].id
        setCuentaOrigenId(primeraCuenta)
        setCuentaAbonoId(primeraCuenta)
      }
    } catch {
      setCuentasEncontradas([])
    } finally {
      setBuscandoSocio(false)
    }
  }

  // Simulación en tiempo real
  async function handleSimular() {
    const m = parseFloat(monto)
    if (isNaN(m) || m <= 0) return

    setSimulando(true)
    setErrorSimulacion(null)
    try {
      const res = await simularDpf({
        monto: m.toFixed(2),
        moneda_id: Number(monedaId),
        plazo_dias: parseInt(plazoDias, 10),
        modalidad_pago_interes: modalidadPago,
      })
      setSimulacion(res)
    } catch (err) {
      setErrorSimulacion(err.response?.data?.detail ?? 'No se pudo simular el DPF.')
      setSimulacion(null)
    } finally {
      setSimulando(false)
    }
  }

  async function ejecutarEmision(overrideUif = null) {
    const dataUif = overrideUif || uifData
    const m = parseFloat(monto)

    setSubmittingEmision(true)
    setErrorEmision(null)
    try {
      const payload = {
        socio_id: socioSeleccionado?.socio_id ?? socioSeleccionado?.id,
        monto: m.toFixed(2),
        moneda_id: Number(monedaId),
        plazo_dias: parseInt(plazoDias, 10),
        modalidad_pago_interes: modalidadPago,
        origen_fondos: origenFondos,
        cuenta_abono_id: Number(cuentaAbonoId),
      }

      if (origenFondos === 'CUENTA') {
        payload.cuenta_origen_id = Number(cuentaOrigenId)
      }

      if (dataUif) {
        payload.declaracion_uif = dataUif
      }

      const cert = await emitirDpf(payload)
      setDpfEmitido(cert)
      setMonto('')
      setSimulacion(null)
      setUifData(null)
    } catch (err) {
      if (err.response?.status === 428) {
        setShowUifModal(true)
        setErrorEmision(err.response?.data?.detail ?? 'Se requiere Declaración Jurada UIF para esta emisión.')
      } else {
        setErrorEmision(err.response?.data?.detail ?? 'Error al emitir el certificado DPF.')
      }
    } finally {
      setSubmittingEmision(false)
    }
  }

  function handleSubmitEmision(e) {
    e.preventDefault()
    setErrorEmision(null)

    if (!socioSeleccionado) {
      setErrorEmision('Debe seleccionar un socio titular.')
      return
    }

    const m = parseFloat(monto)
    if (isNaN(m) || m <= 0) {
      setErrorEmision('El monto del DPF debe ser mayor a cero.')
      return
    }

    if (!cuentaAbonoId) {
      setErrorEmision('Debe seleccionar una cuenta de abono para la liquidación del DPF.')
      return
    }

    if (origenFondos === 'CUENTA' && !cuentaOrigenId) {
      setErrorEmision('Debe seleccionar la cuenta de ahorro de débito.')
      return
    }

    // Umbrales UIF: BOB 70,000 / USD 10,000
    const umbral = Number(monedaId) === 2 ? 10000 : 70000
    if (m >= umbral && !uifData) {
      setShowUifModal(true)
      return
    }

    ejecutarEmision()
  }

  async function handleVerCertificado(dpfId) {
    try {
      const data = await getDpf(dpfId)
      setSelectedDpfCertificado(data)
    } catch (err) {
      alert(err.response?.data?.detail ?? 'Error al cargar certificado DPF.')
    }
  }

  const bandasTarifarioMoneda = useMemo(() => {
    return tarifario.filter((t) => Number(t.moneda?.id) === Number(monedaId))
  }, [tarifario, monedaId])

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Depósitos a Plazo Fijo (DPF)"
        subtitle="Simulación financiera, emisión de certificados fiduciarios y liquidación de rendimientos (CU-W17 / CU-W19)."
      />

      {/* Pestañas Principales */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('simular')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'simular'
              ? 'border-[#064e3b] text-[#064e3b]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">add_card</span>
          <span>Simular y Emitir (CU-W17)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('cartera')
            cargarCartera()
          }}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'cartera'
              ? 'border-[#064e3b] text-[#064e3b]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">folder_special</span>
          <span>Cartera de DPFs (CU-W19)</span>
        </button>
      </div>

      {/* ── Pestaña 1: Simulación y Emisión ── */}
      {activeTab === 'simular' && (
        <div className="space-y-6">

          {/* Localización del Socio */}
          <div className="rounded-xl bg-white border border-[#e2e8f0] p-5 shadow-card space-y-4">
            <h3 className="font-display text-sm font-bold text-slate-900 uppercase tracking-wider">
              1. Localizar Socio Titular
            </h3>
            <form onSubmit={handleBuscarSocio} className="flex gap-2 max-w-md">
              <input
                type="text"
                value={querySocio}
                onChange={(e) => setQuerySocio(e.target.value)}
                placeholder="CI del socio o número de cuenta..."
                className="w-full h-10 px-3 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-[#064e3b]"
              />
              <Button type="submit" variant="primary" loading={buscandoSocio} className="h-10 px-4">
                Buscar
              </Button>
            </form>

            {socioSeleccionado && (
              <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-900 block">{socioSeleccionado.nombre_completo}</span>
                  <span className="font-mono text-slate-600">CI: {socioSeleccionado.ci}</span>
                </div>
                <Badge variant="green">Socio Verificado</Badge>
              </div>
            )}
          </div>

          {/* Configuración y Simulación del DPF */}
          <form onSubmit={handleSubmitEmision} className="space-y-6">
            <div className="rounded-xl bg-white border border-[#e2e8f0] p-6 shadow-card space-y-5">
              <h3 className="font-display font-bold text-slate-900 text-sm">
                2. Parámetros del Certificado DPF
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Moneda *</label>
                  <select
                    value={monedaId}
                    onChange={(e) => setMonedaId(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value={1}>Bolivianos (BOB - Bs.)</option>
                    <option value={2}>Dólares Americanos (USD - $)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Monto de Capital *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                    placeholder="0.00"
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Plazo en Días (Min. 30) *</label>
                  <input
                    type="number"
                    min="30"
                    value={plazoDias}
                    onChange={(e) => setPlazoDias(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              {/* Bandas de Tasa Disponibles */}
              {bandasTarifarioMoneda.length > 0 && (
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider mb-1.5">
                    Tasas de Interés Vigentes ({Number(monedaId) === 2 ? 'USD' : 'BOB'}):
                  </span>
                  <div className="flex gap-2 flex-wrap">
                    {bandasTarifarioMoneda.map((b, idx) => (
                      <span key={idx} className="text-[11px] px-2 py-0.5 rounded bg-white border border-slate-200 font-mono">
                        {b.plazo_max_dias ? `${b.plazo_min_dias}–${b.plazo_max_dias}d` : `≥${b.plazo_min_dias}d`}:{' '}
                        <strong className="text-emerald-800">{Number(b.tna).toFixed(2)}%</strong>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Modalidad de Interés</label>
                  <select
                    value={modalidadPago}
                    onChange={(e) => setModalidadPago(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="VENCIMIENTO">Al Vencimiento</option>
                    <option value="MENSUAL">Mensual (cada 30 días)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Origen de Fondos *</label>
                  <select
                    value={origenFondos}
                    onChange={(e) => setOrigenFondos(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="CUENTA">Débito de Cuenta de Ahorro</option>
                    <option value="EFECTIVO">Efectivo en Ventanilla</option>
                  </select>
                </div>

                {origenFondos === 'CUENTA' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Cuenta de Origen *</label>
                    <select
                      value={cuentaOrigenId}
                      onChange={(e) => setCuentaOrigenId(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white font-mono"
                    >
                      {cuentasSocio.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.numero} ({c.moneda?.codigo_iso || 'BOB'}) - Saldo: {c.saldo_disponible}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cuenta de Abono para Liquidación de Rendimientos *
                </label>
                <select
                  value={cuentaAbonoId}
                  onChange={(e) => setCuentaAbonoId(e.target.value)}
                  className="w-full max-w-md px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white font-mono"
                >
                  {cuentasSocio.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.numero} ({c.moneda?.codigo_iso || 'BOB'}) - Titular: {socioSeleccionado?.nombre_completo}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="button" variant="secondary" size="sm" onClick={handleSimular} loading={simulando}>
                  Simular Rendimiento
                </Button>
              </div>
            </div>

            {errorSimulacion && (
              <AlertBanner variant="error" onClose={() => setErrorSimulacion(null)}>
                {errorSimulacion}
              </AlertBanner>
            )}

            {/* Resultado de Simulación */}
            {simulacion && (
              <div className="rounded-xl bg-white border border-[#e2e8f0] p-5 shadow-card space-y-4 animate-fade-in">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="font-display font-bold text-slate-900 text-sm">
                    Rendimiento Estimado ({Number(simulacion.tna).toFixed(2)}% TNA)
                  </span>
                  <Badge variant="green">
                    Vencimiento: {simulacion.fecha_vencimiento} ({simulacion.plazo_dias} días)
                  </Badge>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Interés Bruto</span>
                    <span className="font-mono font-bold text-slate-800 text-sm">
                      {formatMoney(simulacion.interes_bruto, simulacion.moneda?.simbolo)}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">RC-IVA (13%)</span>
                    <span className="font-mono text-slate-600 text-xs">
                      {simulacion.exento_rciva ? 'Exento' : `-${formatMoney(simulacion.retencion_rciva, simulacion.moneda?.simbolo)}`}
                    </span>
                  </div>
                  <div className="bg-emerald-50 p-2.5 rounded border border-emerald-200">
                    <span className="text-[10px] text-emerald-900 uppercase font-bold block">Interés Neto</span>
                    <span className="font-mono font-bold text-emerald-800 text-sm">
                      +{formatMoney(simulacion.interes_neto, simulacion.moneda?.simbolo)}
                    </span>
                  </div>
                  <div className="bg-emerald-100/70 p-2.5 rounded border border-emerald-300">
                    <span className="text-[10px] text-emerald-950 uppercase font-bold block">Total a Recibir</span>
                    <span className="font-mono font-bold text-emerald-950 text-sm">
                      {formatMoney(simulacion.total_a_recibir, simulacion.moneda?.simbolo)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {errorEmision && (
              <AlertBanner variant="error" onClose={() => setErrorEmision(null)}>
                {errorEmision}
              </AlertBanner>
            )}

            <div className="flex justify-end">
              <Button
                type="submit"
                variant="primary"
                loading={submittingEmision}
                disabled={submittingEmision || !socioSeleccionado || !monto}
                className="gap-2 px-6 h-11"
              >
                <span className="material-symbols-outlined text-[18px]">verified</span>
                <span>Emitir Certificado DPF</span>
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* ── Pestaña 2: Cartera de DPFs ── */}
      {activeTab === 'cartera' && (
        <div className="space-y-4">
          <div className="rounded-xl bg-white border border-[#e2e8f0] p-4 shadow-card flex flex-wrap items-center gap-3">
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
            >
              <option value="">Todos los Estados</option>
              <option value="VIGENTE">VIGENTE</option>
              <option value="LIQUIDADO">LIQUIDADO</option>
              <option value="CANCELADO">CANCELADO</option>
              <option value="RENOVADO">RENOVADO</option>
            </select>

            <select
              value={filtroVenceEn}
              onChange={(e) => setFiltroVenceEn(e.target.value)}
              className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
            >
              <option value="">Cualquier Vencimiento</option>
              <option value="30">Vence en 30 días o menos</option>
              <option value="7">Vence en 7 días o menos</option>
            </select>

            <input
              type="text"
              value={filtroCi}
              onChange={(e) => setFiltroCi(e.target.value)}
              placeholder="Filtrar por CI de socio..."
              className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg font-mono"
            />

            <Button variant="secondary" size="sm" onClick={cargarCartera} loading={loadingCartera}>
              Filtrar
            </Button>
          </div>

          {loadingCartera ? (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : errorCartera ? (
            <AlertBanner variant="error" onClose={() => setErrorCartera(null)}>
              {errorCartera}
            </AlertBanner>
          ) : cartera.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 bg-white rounded-xl border border-slate-200">
              No se encontraron certificados DPF con los filtros seleccionados.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {cartera.map((d) => {
                const sim = d.moneda?.simbolo || 'Bs.'
                const diasRestantes = Number(d.dias_para_vencer ?? 0)
                return (
                  <div
                    key={d.id}
                    className="p-4 rounded-xl bg-white border border-[#e2e8f0] shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 text-sm">
                          {d.numero_certificado}
                        </span>
                        <Badge variant={d.estado === 'VIGENTE' ? 'green' : d.estado === 'LIQUIDADO' ? 'blue' : 'amber'}>
                          {d.estado}
                        </Badge>
                        {d.estado === 'VIGENTE' && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            diasRestantes <= 0 ? 'bg-rose-100 text-rose-800' : diasRestantes <= 30 ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {diasRestantes <= 0 ? 'Vencido' : `Vence en ${diasRestantes}d`}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-600 mt-1">
                        Socio: <strong className="text-slate-800">{d.socio?.nombre_completo}</strong> (CI: {d.socio?.ci})
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Plazo: {d.plazo_dias} días &bull; Vencimiento: {d.fecha_vencimiento} &bull; TNA: {Number(d.tna).toFixed(2)}%
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Capital</span>
                        <span className="font-mono font-bold text-slate-900 text-sm">
                          {formatMoney(d.monto, sim)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleVerCertificado(d.id)}
                          className="text-xs"
                        >
                          Certificado
                        </Button>

                        {d.estado === 'VIGENTE' && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => setSelectedDpfLiquidacion(d)}
                            className="text-xs !bg-[#064e3b]"
                          >
                            Gestionar
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal Declaración Jurada UIF (CU-W14) */}
      <DeclaracionUifModal
        open={showUifModal}
        onClose={() => setShowUifModal(false)}
        onConfirmar={(data) => {
          setUifData(data)
          setShowUifModal(false)
          ejecutarEmision(data)
        }}
        socio={socioSeleccionado}
        monto={monto}
        monedaSimbolo={Number(monedaId) === 2 ? '$' : 'Bs.'}
        tipoOperacion="CONSTITUCION_DPF"
      />

      {/* Modal Certificado Emitido / Consultado */}
      <CertificadoDpfModal
        open={Boolean(dpfEmitido || selectedDpfCertificado)}
        onClose={() => {
          setDpfEmitido(null)
          setSelectedDpfCertificado(null)
        }}
        datos={dpfEmitido || selectedDpfCertificado}
      />

      {/* Modal Liquidación / Renovación / Cancelación (CU-W19) */}
      <LiquidacionDpfModal
        open={Boolean(selectedDpfLiquidacion)}
        onClose={() => setSelectedDpfLiquidacion(null)}
        dpf={selectedDpfLiquidacion}
        onSuccess={() => {
          setSelectedDpfLiquidacion(null)
          cargarCartera()
        }}
      />
    </div>
  )
}
