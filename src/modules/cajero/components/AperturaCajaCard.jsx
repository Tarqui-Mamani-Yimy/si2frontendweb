import { useState, useEffect } from 'react'
import { listCajas, abrirCaja } from '../../../core/api/cajaApi'
import Button from '../../../components/ui/Button'
import AlertBanner from '../../../components/ui/AlertBanner'
import Skeleton from '../../../components/ui/Skeleton'

export default function AperturaCajaCard({ onAperturaSuccess }) {
  const [cajas, setCajas] = useState([])
  const [cajaId, setCajaId] = useState('')
  const [montoApertura, setMontoApertura] = useState('')
  const [loadingCajas, setLoadingCajas] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)

  useEffect(() => {
    let isMounted = true
    listCajas()
      .then((data) => {
        if (!isMounted) return
        setCajas(data || [])
        // Preseleccionar la primera caja disponible si existe
        const primeraDisponible = (data || []).find((c) => c.estado !== 'ABIERTA') ?? (data || [])[0]
        if (primeraDisponible) {
          setCajaId(String(primeraDisponible.id))
        }
      })
      .catch((err) => {
        if (!isMounted) return
        setErrorMsg(err.response?.data?.detail ?? 'No se pudo cargar la lista de cajas de la institución.')
      })
      .finally(() => {
        if (isMounted) setLoadingCajas(false)
      })

    return () => { isMounted = false }
  }, [])

  const cajaSeleccionada = cajas.find((c) => String(c.id) === String(cajaId))

  async function handleSubmit(event) {
    event.preventDefault()
    setErrorMsg(null)

    if (!cajaId) {
      setErrorMsg('Debe seleccionar una caja física para aperturar turno.')
      return
    }

    const montoNum = parseFloat(montoApertura)
    if (isNaN(montoNum) || montoNum <= 0) {
      setErrorMsg('El monto inicial de apertura debe ser mayor a 0.00.')
      return
    }

    const maxPermitido = cajaSeleccionada?.monto_maximo_efectivo
      ? parseFloat(cajaSeleccionada.monto_maximo_efectivo)
      : null

    if (maxPermitido !== null && montoNum > maxPermitido) {
      setErrorMsg(`El monto de apertura no puede superar el límite máximo de Bs ${maxPermitido.toLocaleString('es-BO', { minimumFractionDigits: 2 })}.`)
      return
    }

    setSubmitting(true)
    try {
      const data = await abrirCaja({
        caja_id: Number(cajaId),
        monto_apertura: montoNum.toFixed(2),
      })
      onAperturaSuccess(data)
    } catch (err) {
      setErrorMsg(err.response?.data?.detail ?? 'Error al aperturar la caja. Verifique sus permisos.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto rounded-2xl bg-white border border-[#e2e8f0] p-6 sm:p-8 shadow-card animate-slide-up">
      {/* Cabecera */}
      <div className="flex items-start gap-4 mb-6 pb-4 border-b border-slate-100">
        <div className="h-12 w-12 rounded-xl bg-emerald-50 text-[#064e3b] flex items-center justify-center shrink-0 border border-emerald-200/60">
          <span className="material-symbols-outlined text-[28px]">lock_open</span>
        </div>
        <div>
          <h2 className="font-display text-xl font-bold text-[#0b1c30] tracking-tight">
            Apertura de Turno en Ventanilla
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Asigne el monto inicial de efectivo físico para iniciar la jornada operativa de caja (CU-W10).
          </p>
        </div>
      </div>

      {loadingCajas ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {/* Selección de Caja Física */}
          <div>
            <label htmlFor="cajaSelect" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Caja Física Asignada
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                <span className="material-symbols-outlined text-[20px]">point_of_sale</span>
              </span>
              <select
                id="cajaSelect"
                value={cajaId}
                onChange={(e) => setCajaId(e.target.value)}
                disabled={submitting || cajas.length === 0}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-sm font-medium focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:bg-white outline-none transition appearance-none cursor-pointer"
              >
                {cajas.length === 0 ? (
                  <option value="">No hay cajas registradas en su cooperativa</option>
                ) : (
                  cajas.map((c) => (
                    <option key={c.id} value={c.id} disabled={c.estado === 'ABIERTA'}>
                      {c.nombre} {c.estado === 'ABIERTA' ? '(Ya ocupada por otro usuario)' : '— Disponible'}
                    </option>
                  ))
                )}
              </select>
              <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                <span className="material-symbols-outlined text-[20px]">expand_more</span>
              </span>
            </div>

            {cajaSeleccionada?.monto_maximo_efectivo && (
              <p className="mt-1.5 text-xs text-slate-500 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-emerald-700">shield</span>
                <span>
                  Límite máximo permitido en esta caja:{' '}
                  <strong className="text-slate-700 font-semibold">
                    Bs {Number(cajaSeleccionada.monto_maximo_efectivo).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                  </strong>
                </span>
              </p>
            )}
          </div>

          {/* Monto Inicial de Apertura */}
          <div>
            <label htmlFor="montoApertura" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Monto Inicial de Efectivo (Bs)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                <span className="material-symbols-outlined text-[20px]">payments</span>
              </span>
              <input
                id="montoApertura"
                type="number"
                step="0.01"
                min="0.01"
                required
                value={montoApertura}
                onChange={(e) => setMontoApertura(e.target.value)}
                placeholder="ej. 1500.00"
                disabled={submitting}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-sm placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:bg-white outline-none transition font-mono tabular-nums"
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Corresponde al arqueo físico verificado con el que comienza el turno.
            </p>
          </div>

          {/* Feedback de Error */}
          {errorMsg && (
            <AlertBanner variant="error" onClose={() => setErrorMsg(null)}>
              {errorMsg}
            </AlertBanner>
          )}

          {/* Botón CTA */}
          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={submitting}
              disabled={submitting || cajas.length === 0}
              className="w-full bg-[#064e3b] hover:bg-[#0c4f30] text-white"
            >
              <span className="material-symbols-outlined text-[20px]">verified</span>
              <span>Confirmar Apertura de Caja</span>
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
