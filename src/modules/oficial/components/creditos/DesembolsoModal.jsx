import { useState, useEffect } from 'react'
import Modal from '../../../../components/ui/Modal'
import Button from '../../../../components/ui/Button'
import AlertBanner from '../../../../components/ui/AlertBanner'
import Skeleton from '../../../../components/ui/Skeleton'
import DeclaracionUifModal from '../../../../shared/components/uif/DeclaracionUifModal'
import { desembolsarSolicitud } from '../../../../core/api/creditosApi'
import { buscarCuentas } from '../../../../core/api/cajaApi'
import { listCuentas } from '../../../../core/api/savingsApi'

function formatMoney(value, simbolo = 'Bs.') {
  const n = Number(value ?? 0)
  return `${simbolo} ${n.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function getDefaultFirstDueString() {
  const now = new Date()
  now.setMonth(now.getMonth() + 1)
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * DesembolsoModal — Formulario oficial de desembolso de crédito en cuenta o ventanilla (CU-W26).
 *
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   solicitud: object,
 *   onSuccess: (credito: object) => void
 * }} props
 */
export default function DesembolsoModal({ open, onClose, solicitud, onSuccess }) {
  const [modalidad, setModalidad] = useState('CUENTA') // 'CUENTA' | 'EFECTIVO'
  const [cuentaAhorroId, setCuentaAhorroId] = useState('')
  const [fechaPrimerVencimiento, setFechaPrimerVencimiento] = useState(getDefaultFirstDueString())

  // Cuentas del socio
  const [cuentasSocio, setCuentasSocio] = useState([])
  const [loadingCuentas, setLoadingCuentas] = useState(false)

  // Estados de envío y error
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)

  // UIF Declaración Jurada (HTTP 428)
  const [showUifModal, setShowUifModal] = useState(false)

  // Cargar cuentas del socio al abrir
  useEffect(() => {
    if (!open || !solicitud?.socio) return
    let isMounted = true

    async function loadCuentas() {
      setLoadingCuentas(true)
      try {
        let cuentas = []
        if (solicitud.socio?.ci) {
          const res = await buscarCuentas(solicitud.socio.ci)
          if (Array.isArray(res) && res.length > 0) {
            cuentas = res
          }
        }
        if (cuentas.length === 0 && solicitud.socio?.id) {
          const res2 = await listCuentas({ socio_id: solicitud.socio.id })
          if (Array.isArray(res2)) {
            cuentas = res2
          }
        }

        if (isMounted) {
          // Filtrar cuentas activas del socio
          const activas = cuentas.filter(
            (c) => c.estado === 'ACTIVA' || c.estado === 'ACTIVO',
          )
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
  }, [open, solicitud?.socio])

  if (!open || !solicitud) return null

  const sim = (typeof solicitud.moneda === 'object' ? solicitud.moneda?.simbolo : 'Bs.') || 'Bs.'
  const numero = solicitud.numero_solicitud || `SOL-#${solicitud.id}`

  async function ejecutarDesembolso(uifData = null) {
    setErrorMsg(null)

    if (modalidad === 'CUENTA' && !cuentaAhorroId) {
      setErrorMsg('Debe seleccionar una cuenta de ahorro activa del socio para abonar el crédito.')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        modalidad,
        cuenta_ahorro_id: modalidad === 'CUENTA' ? Number(cuentaAhorroId) : undefined,
        fecha_primer_vencimiento: fechaPrimerVencimiento || undefined,
        declaracion_uif: uifData || undefined,
      }

      const creditoCreado = await desembolsarSolicitud(solicitud.id, payload)
      onSuccess?.(creditoCreado)
      onClose()
    } catch (err) {
      if (err.response?.status === 428) {
        setShowUifModal(true)
        setErrorMsg(
          err.response?.data?.detail ||
            'El monto supera el umbral normativo. Se requiere Declaración Jurada UIF para procesar este desembolso.',
        )
      } else {
        setErrorMsg(
          err.response?.data?.detail ||
            'Error al procesar el desembolso del crédito.',
        )
      }
    } finally {
      setSubmitting(false)
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    ejecutarDesembolso()
  }

  function handleUifConfirmar(uifData) {
    setShowUifModal(false)
    ejecutarDesembolso(uifData)
  }

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title="Desembolso de Crédito"
        subtitle={`Entrega formal de fondos &bull; ${numero}`}
        footer={
          <div className="flex w-full items-center justify-between">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
              disabled={submitting}
            >
              Cancelar
            </Button>

            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleSubmit}
              loading={submitting}
              disabled={submitting || (modalidad === 'CUENTA' && !cuentaAhorroId)}
              className="gap-1.5 bg-[#064e3b] hover:bg-[#003527] text-white"
            >
              <span className="material-symbols-outlined text-[16px]">payments</span>
              <span>Confirmar y Desembolsar</span>
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
          {errorMsg && (
            <AlertBanner variant="error" onClose={() => setErrorMsg(null)}>
              {errorMsg}
            </AlertBanner>
          )}

          {/* ── Resumen de Condiciones del Crédito ── */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                Crédito Aprobado para Desembolso
              </span>
              <span className="font-mono text-[11px] font-bold text-emerald-900">{numero}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="p-2 bg-white rounded-lg border border-emerald-200/80">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Monto Neto</span>
                <span className="font-display font-extrabold text-[#064e3b] text-base tabular-nums">
                  {formatMoney(solicitud.monto, sim)}
                </span>
              </div>
              <div className="p-2 bg-white rounded-lg border border-emerald-200/80">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Plazo</span>
                <span className="font-bold text-slate-800 text-sm">{solicitud.plazo_meses} meses</span>
              </div>
              <div className="p-2 bg-white rounded-lg border border-emerald-200/80">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Tasa TNA</span>
                <span className="font-bold text-slate-800 text-sm">{Number(solicitud.tasa_interes).toFixed(2)}%</span>
              </div>
              <div className="p-2 bg-white rounded-lg border border-emerald-200/80">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Amortización</span>
                <span className="font-bold text-slate-800 text-sm">
                  {solicitud.producto?.tipo_amortizacion === 'ALEMAN' ? 'Alemán' : 'Francés'}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between text-[11px] text-emerald-950 pt-1 border-t border-emerald-200/60">
              <span>Titular: <strong>{solicitud.socio?.nombre_completo || '—'}</strong></span>
              <span className="font-mono">CI: <strong>{solicitud.socio?.ci || '—'}</strong></span>
            </div>
          </div>

          {/* ── Selección de Modalidad de Desembolso ── */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
              Modalidad de Desembolso *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setModalidad('CUENTA')}
                className={`p-3 rounded-xl border text-left transition flex items-center justify-between ${
                  modalidad === 'CUENTA'
                    ? 'border-[#064e3b] bg-emerald-50 text-emerald-900 ring-2 ring-[#064e3b]/20'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div>
                  <span className="font-bold block text-xs">Abono en Cuenta</span>
                  <span className="text-[10px] text-slate-500">Acreditar a cuenta de ahorro activa</span>
                </div>
                <span className={`material-symbols-outlined text-[20px] ${modalidad === 'CUENTA' ? 'text-[#064e3b]' : 'text-slate-300'}`}>
                  account_balance_wallet
                </span>
              </button>

              <button
                type="button"
                onClick={() => setModalidad('EFECTIVO')}
                className={`p-3 rounded-xl border text-left transition flex items-center justify-between ${
                  modalidad === 'EFECTIVO'
                    ? 'border-[#064e3b] bg-emerald-50 text-emerald-900 ring-2 ring-[#064e3b]/20'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div>
                  <span className="font-bold block text-xs">Efectivo por Ventanilla</span>
                  <span className="text-[10px] text-slate-500">Entrega en efectivo mediante caja</span>
                </div>
                <span className={`material-symbols-outlined text-[20px] ${modalidad === 'EFECTIVO' ? 'text-[#064e3b]' : 'text-slate-300'}`}>
                  payments
                </span>
              </button>
            </div>
          </div>

          {/* ── Si la modalidad es CUENTA: Selección de Cuenta de Ahorro ── */}
          {modalidad === 'CUENTA' && (
            <div className="space-y-2 p-3.5 rounded-xl border border-slate-200 bg-slate-50/70">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                Seleccione la Cuenta de Ahorro del Socio *
              </label>

              {loadingCuentas ? (
                <div className="space-y-1.5">
                  <Skeleton className="h-9 w-full" />
                </div>
              ) : cuentasSocio.length === 0 ? (
                <div className="p-3 rounded-lg border border-amber-200 bg-amber-50 text-amber-900 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <span className="material-symbols-outlined text-[16px]">warning</span>
                    <span>No se encontraron cuentas activas del socio</span>
                  </div>
                  <p className="text-[11px] text-amber-800">
                    El socio no posee una cuenta de ahorro activa para realizar el abono.
                    Puede seleccionar la modalidad <strong>Efectivo por Ventanilla</strong> o aperturar una cuenta previamente.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <select
                    value={cuentaAhorroId}
                    onChange={(e) => setCuentaAhorroId(e.target.value)}
                    className="w-full h-10 px-3 text-xs border border-slate-200 rounded-lg bg-white text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#064e3b]"
                  >
                    {cuentasSocio.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.numero} &bull; Saldo: {formatMoney(c.saldo_disponible ?? c.saldo, sim)} ({c.estado})
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-slate-400 block">
                    Los fondos estarán disponibles inmediatamente en la cuenta de ahorro seleccionada.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ── Si la modalidad es EFECTIVO ── */}
          {modalidad === 'EFECTIVO' && (
            <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/80 text-blue-900 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <span className="material-symbols-outlined text-[16px]">point_of_sale</span>
                <span>Entrega en Ventanilla de Caja</span>
              </div>
              <p className="text-[11px] text-blue-800">
                Esta operación registrará un egreso de efectivo en la sesión de caja del operador activo.
                Asegúrese de contar con el saldo suficiente en caja en la moneda correspondiente ({sim}).
              </p>
            </div>
          )}

          {/* ── Fecha del Primer Vencimiento ── */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
              Fecha del Primer Vencimiento de Cuota (Opcional, 15–45 días)
            </label>
            <input
              type="date"
              value={fechaPrimerVencimiento}
              onChange={(e) => setFechaPrimerVencimiento(e.target.value)}
              className="w-full h-9 px-3 text-xs border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#064e3b]"
            />
            <span className="text-[10px] text-slate-400 block">
              Por defecto se computa a un mes a partir de la fecha de desembolso (hoy).
            </span>
          </div>
        </form>
      </Modal>

      {/* Modal Declaración Jurada UIF (si aplica HTTP 428) */}
      {showUifModal && (
        <DeclaracionUifModal
          open={showUifModal}
          onClose={() => setShowUifModal(false)}
          onConfirmar={handleUifConfirmar}
          socio={solicitud.socio}
          monto={solicitud.monto}
          monedaSimbolo={sim}
          tipoOperacion="DESEMBOLSO_CREDITO"
        />
      )}
    </>
  )
}
