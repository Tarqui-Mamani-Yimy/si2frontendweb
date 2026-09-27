import { useState, useEffect } from 'react'
import Button from '../../../../components/ui/Button'
import Badge from '../../../../components/ui/Badge'
import Skeleton from '../../../../components/ui/Skeleton'
import AlertBanner from '../../../../components/ui/AlertBanner'
import DeclaracionUifModal from '../../../../shared/components/uif/DeclaracionUifModal'
import { getDeudaCredito, pagarCuota } from '../../../../core/api/creditosApi'
import { buscarCuentas } from '../../../../core/api/cajaApi'
import { listCuentas } from '../../../../core/api/savingsApi'
import { useAuthStore, selectUser } from '../../../../core/store/authStore'
import { normalizeRole } from '../../../../core/utils/roles'

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
 * CobroCuotaPanel — Panel fiduciario para liquidación y cobro de cuotas en mora o al día (CU-W27).
 *
 * @param {{
 *   credito: object,
 *   onPagoExitoso?: (pago: object) => void
 * }} props
 */
export default function CobroCuotaPanel({ credito, onPagoExitoso }) {
  const user = useAuthStore(selectUser)
  const roleName = user?.rol?.nombre || ''
  const roleNorm = normalizeRole(roleName)
  const isCajero = roleNorm === 'cajero'
  const canDebitAccount = !isCajero // Solo Oficial y Admin pueden debitar de cuenta de ahorro

  const [deuda, setDeuda] = useState(null)
  const [loadingDeuda, setLoadingDeuda] = useState(true)
  const [errorDeuda, setErrorDeuda] = useState(null)

  // Modalidad de cobro
  const [modalidad, setModalidad] = useState('EFECTIVO') // 'EFECTIVO' | 'CUENTA'
  const [cuentaAhorroId, setCuentaAhorroId] = useState('')
  const [cuentasSocio, setCuentasSocio] = useState([])
  const [loadingCuentas, setLoadingCuentas] = useState(false)

  // Ejecución del pago
  const [submitting, setSubmitting] = useState(false)
  const [errorCobro, setErrorCobro] = useState(null)

  // UIF Declaración Jurada (HTTP 428)
  const [showUifModal, setShowUifModal] = useState(false)

  // 1. Cargar la liquidación de la próxima cuota
  async function fetchDeuda() {
    if (!credito?.id) return
    setLoadingDeuda(true)
    setErrorDeuda(null)
    try {
      const data = await getDeudaCredito(credito.id)
      setDeuda(data)
    } catch (err) {
      setErrorDeuda(
        err.response?.data?.detail ||
          'No hay cuotas pendientes de pago o el crédito no se encuentra vigente.',
      )
      setDeuda(null)
    } finally {
      setLoadingDeuda(false)
    }
  }

  useEffect(() => {
    fetchDeuda()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [credito?.id])

  // 2. Cargar cuentas de ahorro del socio si puede debitar de cuenta
  useEffect(() => {
    if (!credito?.socio || isCajero) return
    let isMounted = true

    async function loadCuentas() {
      setLoadingCuentas(true)
      try {
        let cuentas = []
        if (credito.socio?.ci) {
          const res = await buscarCuentas(credito.socio.ci)
          cuentas = Array.isArray(res) ? res : res.cuentas || []
        }
        if (!cuentas || cuentas.length === 0) {
          const resList = await listCuentas({ socio_id: credito.socio?.id })
          cuentas = Array.isArray(resList) ? resList : resList.items || []
        }

        if (isMounted) {
          const monedaCreditoIso =
            (typeof credito.moneda === 'object' ? credito.moneda?.codigo_iso : null) || 'BOB'

          // Filtrar cuentas activas en la misma moneda
          const activas = cuentas.filter((c) => {
            const cMoneda = (typeof c.moneda === 'object' ? c.moneda?.codigo_iso : c.moneda) || 'BOB'
            return c.estado === 'ACTIVO' && cMoneda === monedaCreditoIso
          })

          setCuentasSocio(activas)
          if (activas.length > 0) {
            setCuentaAhorroId(String(activas[0].id))
          } else {
            setCuentaAhorroId('')
          }
        }
      } catch {
        if (isMounted) setCuentasSocio([])
      } finally {
        if (isMounted) setLoadingCuentas(false)
      }
    }

    loadCuentas()

    return () => {
      isMounted = false
    }
  }, [credito?.socio, credito?.moneda, isCajero])

  const sim =
    (typeof deuda?.moneda === 'object'
      ? deuda.moneda?.simbolo
      : typeof credito?.moneda === 'object'
        ? credito.moneda?.simbolo
        : 'Bs.') || 'Bs.'

  async function ejecutarCobro(uifData = null) {
    setErrorCobro(null)

    if (modalidad === 'CUENTA' && !cuentaAhorroId) {
      setErrorCobro('Debe seleccionar una cuenta de ahorro activa del socio para debitar la cuota.')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        modalidad,
        cuenta_ahorro_id: modalidad === 'CUENTA' ? Number(cuentaAhorroId) : undefined,
        declaracion_uif: uifData || undefined,
      }

      const pagoRealizado = await pagarCuota(credito.id, payload)
      onPagoExitoso?.(pagoRealizado)
      // Refrescar deuda posterior
      fetchDeuda()
    } catch (err) {
      if (err.response?.status === 428) {
        setShowUifModal(true)
        setErrorCobro(
          err.response?.data?.detail ||
            'El monto supera el umbral regulatorio UIF. Se requiere completar la Declaración Jurada para procesar el cobro.',
        )
      } else {
        setErrorCobro(
          err.response?.data?.detail ||
            'Error al procesar el cobro de la cuota.',
        )
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingDeuda) {
    return (
      <div className="space-y-3 p-4">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    )
  }

  if (errorDeuda || !deuda) {
    return (
      <div className="p-6 text-center bg-slate-50 border border-slate-200 rounded-xl space-y-2">
        <span className="material-symbols-outlined text-[32px] text-slate-300">
          check_circle
        </span>
        <h4 className="font-bold text-slate-700 text-sm">
          No hay cuotas exigibles pendientes
        </h4>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          {errorDeuda || 'El crédito se encuentra al día o ya ha sido cancelado en su totalidad.'}
        </p>
      </div>
    )
  }

  const { cuota, dias_atraso, dias_gracia, en_mora, mora, total_a_pagar } = deuda

  return (
    <div className="space-y-4">
      {errorCobro && (
        <AlertBanner variant="error" onClose={() => setErrorCobro(null)}>
          {errorCobro}
        </AlertBanner>
      )}

      {/* ── Tarjeta de Liquidación de la Cuota Exigible ── */}
      <div className="rounded-xl border border-slate-200 overflow-hidden shadow-card">
        <div className="bg-[#f8f9ff] px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-slate-600 text-lg">receipt_long</span>
            <span className="font-bold text-xs uppercase tracking-wider text-slate-800">
              Liquidación de Cuota N° {cuota?.numero_cuota ?? '—'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {en_mora ? (
              <Badge variant="red" className="font-bold">
                EN MORA ({dias_atraso} días)
              </Badge>
            ) : dias_atraso > 0 ? (
              <Badge variant="amber">
                En gracia ({dias_atraso}/{dias_gracia || 0} días)
              </Badge>
            ) : (
              <Badge variant="green">
                Al día
              </Badge>
            )}
          </div>
        </div>

        <div className="p-4 bg-white space-y-3">
          {/* Fila de Vencimiento y Gracia */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs pb-3 border-b border-slate-100">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Vencimiento</span>
              <span className="font-mono font-bold text-slate-800">
                {formatDate(cuota?.fecha_vencimiento)}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Días de Atraso</span>
              <span className={`font-mono font-bold ${dias_atraso > 0 ? 'text-rose-700' : 'text-slate-800'}`}>
                {dias_atraso ?? 0} días
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Período de Gracia</span>
              <span className="font-mono text-slate-600">
                {dias_gracia ?? 0} días
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Estado de Mora</span>
              <span className={`font-bold ${en_mora ? 'text-rose-600' : 'text-emerald-700'}`}>
                {en_mora ? 'Sujeto a penalidad' : 'Sin penalidad'}
              </span>
            </div>
          </div>

          {/* Desglose de Importes */}
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600">Amortización a Capital:</span>
              <span className="font-mono font-bold text-slate-900">
                {formatMoney(cuota?.capital, sim)}
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600">Interés Ordinario:</span>
              <span className="font-mono font-bold text-slate-900">
                {formatMoney(cuota?.interes, sim)}
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-600">Penalidad por Mora:</span>
                {en_mora && (
                  <span className="text-[10px] text-rose-600 font-mono">
                    (tasa penal aplicada por {dias_atraso} días)
                  </span>
                )}
              </div>
              <span className={`font-mono font-bold ${Number(mora) > 0 ? 'text-rose-700' : 'text-slate-900'}`}>
                {formatMoney(mora, sim)}
              </span>
            </div>

            <div className="flex justify-between pt-2.5 text-sm font-bold border-t-2 border-slate-200">
              <span className="text-slate-900 uppercase">Total a Cobrar:</span>
              <span className="font-display text-lg text-[#064e3b]">
                {formatMoney(total_a_pagar, sim)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Selección de Modalidad de Pago ── */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
          Modalidad de Cobro
        </label>

        {isCajero ? (
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-lg text-emerald-700">payments</span>
            <span>
              <strong>Cobro en Ventanilla:</strong> El pago se registrará en efectivo en la sesión de caja activa del cajero.
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label
              className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-colors ${
                modalidad === 'EFECTIVO'
                  ? 'border-[#064e3b] bg-emerald-50/50'
                  : 'border-slate-200 bg-slate-50 hover:bg-slate-100/70'
              }`}
            >
              <input
                type="radio"
                name="modalidadCobro"
                value="EFECTIVO"
                checked={modalidad === 'EFECTIVO'}
                onChange={() => setModalidad('EFECTIVO')}
                className="text-[#064e3b] focus:ring-[#064e3b]"
              />
              <div>
                <span className="font-bold text-xs text-slate-900 block">Efectivo en Caja</span>
                <span className="text-[11px] text-slate-500 block">Cobro por ventanilla con caja abierta</span>
              </div>
            </label>

            <label
              className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-colors ${
                modalidad === 'CUENTA'
                  ? 'border-[#064e3b] bg-emerald-50/50'
                  : 'border-slate-200 bg-slate-50 hover:bg-slate-100/70'
              }`}
            >
              <input
                type="radio"
                name="modalidadCobro"
                value="CUENTA"
                checked={modalidad === 'CUENTA'}
                onChange={() => setModalidad('CUENTA')}
                className="text-[#064e3b] focus:ring-[#064e3b]"
              />
              <div>
                <span className="font-bold text-xs text-slate-900 block">Débito en Cuenta</span>
                <span className="text-[11px] text-slate-500 block">Deducción de cuenta de ahorro del socio</span>
              </div>
            </label>
          </div>
        )}

        {/* Selector de cuenta si la modalidad es CUENTA */}
        {modalidad === 'CUENTA' && canDebitAccount && (
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="text-[11px] font-semibold text-slate-700 block">
              Seleccionar Cuenta de Ahorro del Socio Titular ({sim}):
            </label>

            {loadingCuentas ? (
              <Skeleton className="h-10 w-full" />
            ) : cuentasSocio.length === 0 ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
                El socio no cuenta con cajas de ahorro activas en moneda {sim}. Deberá procesarse en efectivo por ventanilla.
              </div>
            ) : (
              <div>
                <select
                  value={cuentaAhorroId}
                  onChange={(e) => setCuentaAhorroId(e.target.value)}
                  className="w-full h-10 px-3 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#064e3b]"
                >
                  {cuentasSocio.map((c) => (
                    <option key={c.id} value={c.id}>
                      Cuenta N° {c.numero} — Saldo Disponible: {formatMoney(c.saldo_disponible ?? c.saldo ?? 0, sim)}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-500 block mt-1">
                  Se debitarán {formatMoney(total_a_pagar, sim)}. La cuenta debe conservar el saldo mínimo normativo.
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Botón de Acción Principal ── */}
      <div className="pt-2 flex justify-end">
        <Button
          type="button"
          variant="primary"
          size="md"
          loading={submitting}
          onClick={() => ejecutarCobro()}
          disabled={modalidad === 'CUENTA' && !cuentaAhorroId}
          className="gap-2 bg-[#064e3b] hover:bg-[#043327] text-white shadow-sm"
        >
          <span className="material-symbols-outlined text-[18px]">payments</span>
          <span>Cobrar Cuota N° {cuota?.numero_cuota ?? ''} ({formatMoney(total_a_pagar, sim)})</span>
        </Button>
      </div>

      {/* ── Modal de Declaración Jurada UIF (HTTP 428) ── */}
      {showUifModal && (
        <DeclaracionUifModal
          open={showUifModal}
          onClose={() => setShowUifModal(false)}
          onConfirmar={(uifData) => {
            setShowUifModal(false)
            ejecutarCobro(uifData)
          }}
          socio={credito.socio}
          monto={total_a_pagar}
          monedaSimbolo={sim}
          tipoOperacion="COBRO_CUOTA"
        />
      )}
    </div>
  )
}
