import { useState, useEffect } from 'react'
import Modal from '../../../../components/ui/Modal'
import Button from '../../../../components/ui/Button'
import Badge from '../../../../components/ui/Badge'
import Skeleton from '../../../../components/ui/Skeleton'
import AlertBanner from '../../../../components/ui/AlertBanner'
import TablaAmortizacion from './TablaAmortizacion'
import { getCredito } from '../../../../core/api/creditosApi'

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

function getEstadoCreditoBadge(estado) {
  switch (estado) {
    case 'VIGENTE':
      return 'green'
    case 'CANCELADO':
      return 'teal'
    case 'EN_MORA':
      return 'red'
    case 'REFINANCIADO':
      return 'purple'
    case 'CASTIGADO':
      return 'slate'
    default:
      return 'slate'
  }
}

/**
 * CreditoDetalleModal — Visualización completa del crédito, estado de amortización y pagos (CU-W24 / Cartera).
 *
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   creditoId: number|string|null,
 *   creditoInit?: object|null
 * }} props
 */
export default function CreditoDetalleModal({ open, onClose, creditoId, creditoInit }) {
  const [credito, setCredito] = useState(creditoInit)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!open || !creditoId) return
    let isMounted = true

    async function loadCredito() {
      setLoading(true)
      setError(null)
      try {
        const data = await getCredito(creditoId)
        if (isMounted) setCredito(data)
      } catch (err) {
        if (isMounted) {
          setError(
            err.response?.data?.detail ||
              'Error al cargar el detalle del crédito y su cronograma.',
          )
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadCredito()

    return () => {
      isMounted = false
    }
  }, [open, creditoId])

  if (!open || (!credito && !loading)) return null

  const sim = (typeof credito?.moneda === 'object' ? credito?.moneda?.simbolo : 'Bs.') || 'Bs.'
  const numeroCredito = credito?.numero_credito || `CRE-#${credito?.id || creditoId}`

  function handlePrint() {
    window.print()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Crédito ${numeroCredito}`}
      subtitle={`Expediente de Cartera &bull; Desembolsado el ${formatDate(credito?.fecha_desembolso)}`}
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
            disabled={!credito || loading}
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
          #credito-detalle-print, #credito-detalle-print * { visibility: visible !important; }
          #credito-detalle-print {
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

      <div id="credito-detalle-print" className="space-y-4 text-xs font-sans text-slate-800">
        {/* Cabecera para Impresión */}
        <div className="border-b border-slate-200 pb-3 text-center">
          <h2 className="font-display text-sm font-bold uppercase text-slate-900">
            NexaCoop Core Banking &bull; Estado de Cartera de Crédito
          </h2>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Crédito {numeroCredito} &bull; Cronograma Oficial de Amortización
          </p>
          <div className="mt-1 flex items-center justify-center gap-3">
            <Badge variant={getEstadoCreditoBadge(credito?.estado || 'VIGENTE')}>
              {credito?.estado || 'VIGENTE'}
            </Badge>
            <span className="font-mono text-slate-500 text-[11px]">
              Desembolso: {formatDate(credito?.fecha_desembolso)}
            </span>
          </div>
        </div>

        {error && (
          <AlertBanner variant="error" onClose={() => setError(null)}>
            {error}
          </AlertBanner>
        )}

        {loading ? (
          <div className="space-y-3 p-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : (
          credito && (
            <>
              {/* ── Datos Generales del Titular y Modalidad ── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Socio Titular
                  </span>
                  <div>
                    <span className="font-bold text-slate-900 text-sm block">
                      {credito.socio?.nombre_completo || '—'}
                    </span>
                    <span className="font-mono text-xs text-slate-600">
                      CI: {credito.socio?.ci || '—'}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Detalle del Desembolso
                  </span>
                  <div>
                    <span className="font-bold text-slate-900 block">
                      {credito.modalidad_desembolso === 'CUENTA'
                        ? `Abono en Cuenta N° ${credito.cuenta_desembolso?.numero || '—'}`
                        : 'Efectivo por Ventanilla de Caja'}
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      Solicitud: {credito.solicitud?.numero_solicitud || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* ── Métricas y Saldos del Crédito ── */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Monto Aprobado</span>
                  <span className="font-display font-bold text-slate-900 text-base tabular-nums">
                    {formatMoney(credito.monto_aprobado, sim)}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Saldo Pendiente</span>
                  <span className="font-display font-bold text-emerald-800 text-base tabular-nums">
                    {formatMoney(credito.saldo_pendiente, sim)}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Tasa / Sistema</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {Number(credito.tasa_interes).toFixed(2)}% TNA
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    {credito.tipo_amortizacion === 'ALEMAN' ? 'Alemán' : 'Francés'}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Progreso Cuotas</span>
                  <span className="font-display font-bold text-[#064e3b] text-base tabular-nums">
                    {credito.cuotas_pagadas ?? 0} / {credito.cuotas_totales ?? credito.plazo_meses}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    {Math.round(((credito.cuotas_pagadas ?? 0) / (credito.cuotas_totales || credito.plazo_meses || 1)) * 100)}% amortizado
                  </span>
                </div>
              </div>

              {/* ── Cronograma de Pagos / Amortización ── */}
              <div className="space-y-2">
                <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                    Cronograma de Amortización Definitivo
                  </h4>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Total: {credito.cronograma?.length || 0} cuotas
                  </span>
                </div>

                <TablaAmortizacion
                  cuotas={credito.cronograma || []}
                  monedaSimbolo={sim}
                  showEstado={true}
                />
              </div>

              {/* Firmas para Impresión */}
              <div className="pt-10 grid grid-cols-2 gap-8 text-center text-[10px] text-slate-500 border-t border-slate-200 mt-6">
                <div>
                  <div className="border-b border-slate-300 w-3/4 mx-auto mb-1.5" />
                  <span className="font-semibold block text-slate-800 text-xs">
                    {credito.socio?.nombre_completo || 'Socio Titular'}
                  </span>
                  <span>Firma del Socio Titular (CI: {credito.socio?.ci || '—'})</span>
                </div>
                <div>
                  <div className="border-b border-slate-300 w-3/4 mx-auto mb-1.5" />
                  <span className="font-semibold block text-slate-800 text-xs">
                    {credito.usuario?.nombre || 'Oficial de Cartera'}
                  </span>
                  <span>Oficial / Administrador Responsable</span>
                </div>
              </div>

              <p className="text-[10px] text-center text-slate-400 pt-2">
                Documento oficial emitido por el sistema central NexaCoop. Registro de pagos y estados sujeto a validación de auditoría ASFI.
              </p>
            </>
          )
        )}
      </div>
    </Modal>
  )
}
