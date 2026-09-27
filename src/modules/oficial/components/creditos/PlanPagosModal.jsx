import { useState, useEffect } from 'react'
import Modal from '../../../../components/ui/Modal'
import Button from '../../../../components/ui/Button'
import AlertBanner from '../../../../components/ui/AlertBanner'
import Skeleton from '../../../../components/ui/Skeleton'
import TablaAmortizacion from './TablaAmortizacion'
import { getPlanPagos } from '../../../../core/api/creditosApi'

function formatMoney(value, simbolo = 'Bs.') {
  const n = Number(value ?? 0)
  return `${simbolo} ${n.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function getTodayString() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
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
 * PlanPagosModal — Generación previa y visualización interactiva del cronograma de amortización (CU-W24).
 *
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   solicitud: object
 * }} props
 */
export default function PlanPagosModal({ open, onClose, solicitud }) {
  const [fechaDesembolso, setFechaDesembolso] = useState(getTodayString())
  const [fechaPrimerVencimiento, setFechaPrimerVencimiento] = useState(getDefaultFirstDueString())
  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!open || !solicitud?.id) return
    let isMounted = true

    async function fetchPlan() {
      setLoading(true)
      setError(null)
      try {
        const data = await getPlanPagos(solicitud.id, {
          fecha_desembolso: fechaDesembolso,
          fecha_primer_vencimiento: fechaPrimerVencimiento,
        })
        if (isMounted) setPlan(data)
      } catch (err) {
        if (isMounted) {
          setError(
            err.response?.data?.detail ||
              'Error al generar el plan de pagos / cronograma de amortización.',
          )
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchPlan()

    return () => {
      isMounted = false
    }
  }, [open, solicitud?.id, fechaDesembolso, fechaPrimerVencimiento])

  if (!open || !solicitud) return null

  const sim = (typeof solicitud.moneda === 'object' ? solicitud.moneda?.simbolo : 'Bs.') || 'Bs.'
  const numero = solicitud.numero_solicitud || `SOL-#${solicitud.id}`

  function handlePrint() {
    window.print()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Plan de Pagos — ${numero}`}
      subtitle="Simulación técnica y cronograma de amortización de cuotas (CU-W24)"
      footer={
        <div className="flex w-full items-center justify-between">
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Cerrar
          </Button>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handlePrint}
            disabled={!plan || loading}
            className="gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">print</span>
            <span>Imprimir Plan de Pagos</span>
          </Button>
        </div>
      }
    >
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #plan-pagos-print, #plan-pagos-print * { visibility: visible !important; }
          #plan-pagos-print {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 24px !important;
            box-shadow: none !important;
            background: white !important;
          }
        }
      `}</style>

      <div id="plan-pagos-print" className="space-y-4 text-xs font-sans text-slate-800">
        {/* Cabecera para Impresión */}
        <div className="border-b border-slate-200 pb-3 text-center">
          <h2 className="font-display text-sm font-bold uppercase text-slate-900">
            NexaCoop Core Banking &bull; Plan de Pagos y Amortización
          </h2>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Cronograma Institucional de Crédito &bull; {numero}
          </p>
          <div className="mt-1 flex items-center justify-center gap-3 text-slate-500 text-[11px]">
            <span>Socio: <strong className="text-slate-800">{solicitud.socio?.nombre_completo || '—'}</strong></span>
            <span>CI: <strong className="text-slate-800">{solicitud.socio?.ci || '—'}</strong></span>
          </div>
        </div>

        {error && (
          <AlertBanner variant="error" onClose={() => setError(null)}>
            {error}
          </AlertBanner>
        )}

        {/* ── Parámetros de Simulación de Fechas ── */}
        <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Fecha de Desembolso
            </label>
            <input
              type="date"
              value={fechaDesembolso}
              onChange={(e) => setFechaDesembolso(e.target.value)}
              className="w-full h-9 px-3 text-xs border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#064e3b]"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              1° Vencimiento (15–45 días)
            </label>
            <input
              type="date"
              value={fechaPrimerVencimiento}
              onChange={(e) => setFechaPrimerVencimiento(e.target.value)}
              className="w-full h-9 px-3 text-xs border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#064e3b]"
            />
          </div>

          <div>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Sistema de Amortización
            </span>
            <span className="font-bold text-slate-900 block text-xs">
              {plan?.tipo_amortizacion === 'ALEMAN'
                ? 'Alemán (Cuotas Decrecientes)'
                : 'Francés (Cuotas Constantes)'}
            </span>
          </div>

          <div>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Tasa Nominal / Plazo
            </span>
            <span className="font-bold text-slate-900 block text-xs">
              {Number(solicitud.tasa_interes).toFixed(2)}% TNA &bull; {solicitud.plazo_meses} meses
            </span>
          </div>
        </div>

        {/* ── Resumen de Totales Proyectados ── */}
        {plan && (
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Capital Total</span>
              <span className="font-display font-bold text-slate-900 text-sm tabular-nums">
                {formatMoney(plan.total_capital, sim)}
              </span>
            </div>

            <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Intereses</span>
              <span className="font-display font-bold text-emerald-800 text-sm tabular-nums">
                {formatMoney(plan.total_interes, sim)}
              </span>
            </div>

            <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Proyectado a Pagar</span>
              <span className="font-display font-bold text-[#064e3b] text-sm tabular-nums">
                {formatMoney(plan.total_pagar, sim)}
              </span>
            </div>
          </div>
        )}

        {/* ── Desglose de Cuotas ── */}
        {loading ? (
          <div className="space-y-2 p-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : (
          <TablaAmortizacion
            cuotas={plan?.cuotas || []}
            monedaSimbolo={sim}
            totalCapital={plan?.total_capital}
            totalInteres={plan?.total_interes}
            totalPagar={plan?.total_pagar}
            showEstado={false}
          />
        )}

        {/* Firmas en Reporte Imprimible */}
        <div className="pt-10 grid grid-cols-2 gap-8 text-center text-[10px] text-slate-500 border-t border-slate-200 mt-6">
          <div>
            <div className="border-b border-slate-300 w-3/4 mx-auto mb-1.5" />
            <span className="font-semibold block text-slate-800 text-xs">
              {solicitud.socio?.nombre_completo || 'Socio Solicitante'}
            </span>
            <span>Conformidad del Socio Solicitante (CI: {solicitud.socio?.ci || '—'})</span>
          </div>
          <div>
            <div className="border-b border-slate-300 w-3/4 mx-auto mb-1.5" />
            <span className="font-semibold block text-slate-800 text-xs">
              {solicitud.oficial?.nombre || 'Oficial de Crédito'}
            </span>
            <span>Oficial de Crédito / Elaborado Por</span>
          </div>
        </div>

        <p className="text-[10px] text-center text-slate-400 pt-2">
          Plan de pagos proyectado preliminar &bull; Las fechas efectivas definitivas se consolidan al momento del desembolso oficial.
        </p>
      </div>
    </Modal>
  )
}
