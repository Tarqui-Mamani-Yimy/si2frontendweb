import { useState, useEffect } from 'react'
import { verificarCierre, cerrarTurno } from '../../../core/api/cajaApi'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import AlertBanner from '../../../components/ui/AlertBanner'
import Skeleton from '../../../components/ui/Skeleton'
import Modal from '../../../components/ui/Modal'

function formatMoney(value, simbolo = 'Bs.') {
  const n = Number(value ?? 0)
  return `${simbolo} ${n.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/**
 * CierreTab — verificación de precondiciones, consolidación y cierre definitivo de turno (CU-W16).
 *
 * @param {{
 *   onCierreExitoso: (planilla: object) => void,
 *   onIrArqueo?: () => void
 * }} props
 */
export default function CierreTab({ onCierreExitoso, onIrArqueo }) {
  const [verificacion, setVerificacion] = useState(null)
  const [loadingVerificacion, setLoadingVerificacion] = useState(true)
  const [errorVerificacion, setErrorVerificacion] = useState(null)

  const [observacion, setObservacion] = useState('')
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errorSubmit, setErrorSubmit] = useState(null)

  useEffect(() => {
    let isMounted = true
    verificarCierre()
      .then((data) => {
        if (!isMounted) return
        setVerificacion(data)
      })
      .catch((err) => {
        if (!isMounted) return
        setErrorVerificacion(err.response?.data?.detail ?? 'Error al verificar el estado de cierre de caja.')
      })
      .finally(() => {
        if (isMounted) setLoadingVerificacion(false)
      })

    return () => { isMounted = false }
  }, [])

  function recargarVerificacion() {
    setLoadingVerificacion(true)
    setErrorVerificacion(null)
    verificarCierre()
      .then((data) => {
        setVerificacion(data)
      })
      .catch((err) => {
        setErrorVerificacion(err.response?.data?.detail ?? 'Error al verificar el estado de cierre de caja.')
      })
      .finally(() => {
        setLoadingVerificacion(false)
      })
  }

  async function handleConfirmarCierre() {
    setSubmitting(true)
    setErrorSubmit(null)
    try {
      const planilla = await cerrarTurno({
        observacion: observacion.trim() || undefined,
      })
      setShowConfirmModal(false)
      onCierreExitoso(planilla)
    } catch (err) {
      setShowConfirmModal(false)
      setErrorSubmit(err.response?.data?.detail ?? 'Error al procesar el cierre de caja.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingVerificacion) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (errorVerificacion) {
    return (
      <div className="space-y-4">
        <AlertBanner variant="error" onClose={() => setErrorVerificacion(null)}>
          {errorVerificacion}
        </AlertBanner>
        <Button variant="secondary" size="sm" onClick={recargarVerificacion}>
          Reintentar Verificación
        </Button>
      </div>
    )
  }

  const puedeCerrar = Boolean(verificacion?.puede_cerrar)
  const alertas = verificacion?.alertas || []
  const arqueo = verificacion?.arqueo

  return (
    <div className="space-y-6">

      {/* ── Encabezado de Estado de Cierre ── */}
      <div className="rounded-xl bg-white border border-[#e2e8f0] p-6 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#064e3b] text-[22px]">lock_reset</span>
              <h3 className="font-display font-bold text-slate-900 text-base">
                Verificación de Precondiciones para Cierre (CU-W16)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Para cerrar el turno formalmente, debe existir un arqueo satisfactorio y no registrarse operaciones posteriores.
            </p>
          </div>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={recargarVerificacion}
            className="gap-1.5 self-start sm:self-auto text-xs"
          >
            <span className="material-symbols-outlined text-[16px]">refresh</span>
            <span>Actualizar Estado</span>
          </Button>
        </div>

        {/* ── Bloque de Alertas si NO puede cerrar ── */}
        {!puedeCerrar && (
          <div className="rounded-xl border border-amber-300 bg-amber-50/80 p-5 space-y-3">
            <div className="flex items-center gap-2 text-amber-900 font-bold">
              <span className="material-symbols-outlined text-amber-600 text-[22px]">warning</span>
              <span>No es posible cerrar la caja en este momento</span>
            </div>
            <p className="text-xs text-amber-800">
              El sistema identificó las siguientes observaciones pendientes que impiden el cierre definitivo:
            </p>
            <ul className="list-disc list-inside space-y-1 text-xs font-semibold text-amber-950 pl-1">
              {alertas.map((alerta, idx) => (
                <li key={idx}>{alerta}</li>
              ))}
            </ul>

            {onIrArqueo && (
              <div className="pt-2">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={onIrArqueo}
                  className="gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">balance</span>
                  <span>Ir a la Pestaña de Arqueo</span>
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ── Bloque Informativo del Arqueo Respaldo ── */}
        {arqueo ? (
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
              <span className="font-bold text-slate-800">
                Arqueo de Respaldo Asociado: #{arqueo.id}
              </span>
              <span className="text-slate-500">
                Registrado el {arqueo.fecha ? new Date(arqueo.fecha).toLocaleString('es-BO') : '—'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Autorización Supervisor:</span>
                <span className="font-semibold text-slate-800">
                  {arqueo.supervisor?.nombre || (arqueo.requiere_supervisor ? 'Requerida' : 'No requerida')}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Monedas Conciliadas:</span>
                <div className="flex gap-2 flex-wrap mt-0.5">
                  {(arqueo.monedas || []).map((m, idx) => {
                    const sim = m.moneda?.simbolo || (typeof m.moneda === 'string' ? m.moneda : (m.moneda?.codigo_iso || 'Bs.'))
                    const dif = Number(m.diferencia ?? 0)
                    return (
                      <span key={idx} className="inline-flex items-center gap-1.5 text-[11px] font-mono px-2 py-0.5 rounded bg-white border border-slate-200">
                        <span>{m.moneda?.codigo_iso || 'BOB'}:</span>
                        <Badge variant={m.resultado === 'CUADRADO' ? 'green' : m.resultado === 'SOBRANTE' ? 'blue' : 'red'}>
                          {m.resultado} ({dif > 0 ? '+' : ''}{formatMoney(dif, sim)})
                        </Badge>
                      </span>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic">
            Aún no se ha registrado ningún arqueo en este turno de caja.
          </p>
        )}
      </div>

      {/* ── Formulario de Cierre (Solo si puedeCerrar es true) ── */}
      {puedeCerrar && (
        <div className="rounded-xl bg-white border border-[#e2e8f0] p-6 shadow-card space-y-5 animate-fade-in">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-emerald-800 font-bold text-sm">
            <span className="material-symbols-outlined text-emerald-700">verified</span>
            <span>Todas las condiciones para el cierre están cumplidas</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Observaciones de Cierre (Opcional)
            </label>
            <textarea
              rows={2}
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
              placeholder="Detalles finales del turno, incidencias o notas para auditoría..."
              className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-600 focus:border-rose-600"
            />
          </div>

          {errorSubmit && (
            <AlertBanner variant="error" onClose={() => setErrorSubmit(null)}>
              {errorSubmit}
            </AlertBanner>
          )}

          <div className="flex justify-end pt-2">
            <Button
              type="button"
              variant="primary"
              onClick={() => setShowConfirmModal(true)}
              className="gap-2 px-6 h-11 !bg-rose-700 hover:!bg-rose-800 text-white"
            >
              <span className="material-symbols-outlined text-[18px]">lock</span>
              <span>Proceder al Cierre Definitivo de Turno</span>
            </Button>
          </div>
        </div>
      )}

      {/* ── Modal de Confirmación de Cierre Definitivo ── */}
      <Modal
        open={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Confirmar Cierre de Turno de Caja"
        subtitle="Consolidación fiduciaria y bloqueo inmutable (CU-W16)"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setShowConfirmModal(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleConfirmarCierre}
              loading={submitting}
              disabled={submitting}
              className="!bg-rose-700 hover:!bg-rose-800"
            >
              Sí, Cerrar Caja y Traspasar Fondos
            </Button>
          </div>
        }
      >
        <div className="space-y-3 text-xs text-slate-700">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-rose-50 text-rose-900 border border-rose-200">
            <span className="material-symbols-outlined text-rose-700 text-[26px]">lock</span>
            <p>
              Esta acción <strong>finalizará el turno y cerrará la caja de inmediato</strong>.
              Todos los fondos en efectivo serán transferidos formalmente a bóveda y no se podrán
              realizar más movimientos hasta una nueva apertura.
            </p>
          </div>
          <p className="text-slate-600">
            ¿Deseas emitir la planilla oficial de cierre y asentar la operación?
          </p>
        </div>
      </Modal>

    </div>
  )
}
