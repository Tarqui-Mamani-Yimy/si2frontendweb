import { useState, useEffect, useCallback } from 'react'
import Modal from '../../../../components/ui/Modal'
import Button from '../../../../components/ui/Button'
import Badge from '../../../../components/ui/Badge'
import Skeleton from '../../../../components/ui/Skeleton'
import AlertBanner from '../../../../components/ui/AlertBanner'
import TablaAmortizacion from './TablaAmortizacion'
import CobroCuotaPanel from './CobroCuotaPanel'
import HistorialPagosTable from './HistorialPagosTable'
import HistorialGestionesTable from './HistorialGestionesTable'
import GarantiasCreditoTab from '../garantias/GarantiasCreditoTab'
import ComprobantePagoModal from './ComprobantePagoModal'
import {
  getCredito,
  solicitarReprogramacion,
  simularReprogramacion,
  listarReprogramacionesCredito,
  aprobarReprogramacion,
  rechazarReprogramacion,
} from '../../../../core/api/creditosApi'
import { useAuthStore, selectUser } from '../../../../core/store/authStore'
import { normalizeRole } from '../../../../core/utils/roles'
import { FormField, Input, Textarea } from '../../../../components/ui/FormField'

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
 * CreditoDetalleModal — Visualización completa del crédito, estado de amortización, cobro de cuotas y pagos (CU-W24 / CU-W27).
 *
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   creditoId: number|string|null,
 *   creditoInit?: object|null,
 *   initialTab?: 'cronograma' | 'cobro' | 'pagos',
 *   onUpdated?: () => void
 * }} props
 */
export default function CreditoDetalleModal({
  open,
  onClose,
  creditoId,
  creditoInit,
  initialTab = 'cronograma',
  onUpdated,
}) {
  const [credito, setCredito] = useState(creditoInit)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [tabOverride, setTabOverride] = useState(null)
  const [prevInitialTab, setPrevInitialTab] = useState(initialTab)

  if (prevInitialTab !== initialTab) {
    setPrevInitialTab(initialTab)
    setTabOverride(null)
  }

  const activeTab = tabOverride ?? initialTab
  const setActiveTab = setTabOverride

  // Comprobante de pago para reimpresión / post-cobro
  const [pagoParaComprobante, setPagoParaComprobante] = useState(null)
  const [comprobanteModalOpen, setComprobanteModalOpen] = useState(false)

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

  const user = useAuthStore(selectUser)
  const roleName = user?.rol?.nombre || ''
  const roleNorm = normalizeRole(roleName)
  const canManageReprog =
    roleNorm === 'administrador' ||
    roleNorm === 'admin' ||
    roleNorm === 'superadmin' ||
    roleNorm === 'oficial_credito' ||
    roleNorm === 'oficial'

  // ── Estado de Reprogramaciones ──
  const [reprogramaciones, setReprogramaciones] = useState([])
  const [loadingReprog, setLoadingReprog] = useState(false)
  const [reprogError, setReprogError] = useState(null)
  const [reprogSuccess, setReprogSuccess] = useState(null)

  // Formulario de reprogramación
  const [nuevoPlazoMeses, setNuevoPlazoMeses] = useState('')
  const [motivoReprog, setMotivoReprog] = useState('')
  const [simulacionReprog, setSimulacionReprog] = useState(null)
  const [simulandoReprog, setSimulandoReprog] = useState(false)
  const [solicitandoReprog, setSolicitandoReprog] = useState(false)
  const [aprobandoId, setAprobandoId] = useState(null)

  // Rechazo modal
  const [modalRechazoOpen, setModalRechazoOpen] = useState(false)
  const [rechazarTargetId, setRechazarTargetId] = useState(null)
  const [motivoRechazo, setMotivoRechazo] = useState('')
  const [rechazando, setRechazando] = useState(false)

  const loadReprogramaciones = useCallback(async () => {
    if (!creditoId) return
    setLoadingReprog(true)
    setReprogError(null)
    try {
      const data = await listarReprogramacionesCredito(creditoId)
      setReprogramaciones(Array.isArray(data) ? data : [])
    } catch (err) {
      setReprogError(err.response?.data?.detail || 'Error al cargar reprogramaciones.')
    } finally {
      setLoadingReprog(false)
    }
  }, [creditoId])

  useEffect(() => {
    if (open && creditoId && activeTab === 'reprogramacion') {
      loadReprogramaciones()
    }
  }, [open, creditoId, activeTab, loadReprogramaciones])

  async function handleSimularReprogramacion() {
    const p = parseInt(nuevoPlazoMeses, 10)
    if (isNaN(p) || p <= 0) {
      setReprogError('Ingrese un nuevo plazo válido en meses.')
      return
    }
    setSimulandoReprog(true)
    setReprogError(null)
    try {
      const simData = await simularReprogramacion(creditoId, { nuevo_plazo_meses: p })
      setSimulacionReprog(simData)
    } catch (err) {
      setReprogError(err.response?.data?.detail || 'Error al simular la reprogramación.')
    } finally {
      setSimulandoReprog(false)
    }
  }

  async function handleSolicitarReprogramacion(e) {
    e.preventDefault()
    const p = parseInt(nuevoPlazoMeses, 10)
    if (isNaN(p) || p <= 0) {
      setReprogError('Ingrese un plazo válido en meses.')
      return
    }
    if (!motivoReprog.trim()) {
      setReprogError('Debe ingresar el motivo o justificación técnica de la reprogramación.')
      return
    }
    setSolicitandoReprog(true)
    setReprogError(null)
    setReprogSuccess(null)
    try {
      await solicitarReprogramacion(creditoId, {
        motivo: motivoReprog.trim(),
        nuevo_plazo_meses: p,
      })
      setReprogSuccess('Solicitud de reprogramación registrada con éxito.')
      setNuevoPlazoMeses('')
      setMotivoReprog('')
      setSimulacionReprog(null)
      loadReprogramaciones()
      getCredito(creditoId).then((data) => setCredito(data)).catch(() => {})
      onUpdated?.()
    } catch (err) {
      setReprogError(err.response?.data?.detail || 'Error al registrar la solicitud de reprogramación.')
    } finally {
      setSolicitandoReprog(false)
    }
  }

  async function handleAprobarReprogramacion(id) {
    setAprobandoId(id)
    setReprogError(null)
    setReprogSuccess(null)
    try {
      await aprobarReprogramacion(id)
      setReprogSuccess('Reprogramación aprobada exitosamente. Se ha generado el nuevo cronograma oficial.')
      loadReprogramaciones()
      const updatedCredito = await getCredito(creditoId)
      setCredito(updatedCredito)
      onUpdated?.()
    } catch (err) {
      setReprogError(err.response?.data?.detail || 'Error al aprobar la reprogramación.')
    } finally {
      setAprobandoId(null)
    }
  }

  function handleAbrirRechazo(id) {
    setRechazarTargetId(id)
    setMotivoRechazo('')
    setModalRechazoOpen(true)
  }

  async function handleConfirmarRechazo(e) {
    e.preventDefault()
    if (!motivoRechazo.trim()) {
      setReprogError('Debe especificar el motivo del rechazo.')
      return
    }
    setRechazando(true)
    try {
      await rechazarReprogramacion(rechazarTargetId, { motivo: motivoRechazo.trim() })
      setReprogSuccess('Solicitud de reprogramación rechazada.')
      setModalRechazoOpen(false)
      loadReprogramaciones()
      onUpdated?.()
    } catch (err) {
      setReprogError(err.response?.data?.detail || 'Error al rechazar la reprogramación.')
    } finally {
      setRechazando(false)
    }
  }

  if (!open || (!credito && !loading)) return null

  const sim = (typeof credito?.moneda === 'object' ? credito?.moneda?.simbolo : 'Bs.') || 'Bs.'
  const numeroCredito = credito?.numero_credito || `CRE-#${credito?.id || creditoId}`

  function handlePrint() {
    window.print()
  }

  function handlePagoExitoso(pagoRealizado) {
    setPagoParaComprobante(pagoRealizado)
    setComprobanteModalOpen(true)
    // Refrescar crédito para actualizar saldo_pendiente, cuotas_pagadas, estado
    if (creditoId) {
      getCredito(creditoId)
        .then((data) => setCredito(data))
        .catch(() => {})
    }
    onUpdated?.()
  }

  return (
    <>
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

            {activeTab === 'cronograma' && (
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
            )}
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

        <div className="space-y-4 text-xs font-sans text-slate-800">
          {/* ── Navegación de Pestañas del Crédito ── */}
          <div className="flex border-b border-slate-200 print:hidden">
            <button
              type="button"
              onClick={() => setActiveTab('cronograma')}
              className={`px-4 py-2.5 text-xs font-bold transition-colors border-b-2 flex items-center gap-1.5 ${
                activeTab === 'cronograma'
                  ? 'border-[#064e3b] text-[#064e3b]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">calendar_month</span>
              <span>Cronograma Oficial</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('cobro')}
              className={`px-4 py-2.5 text-xs font-bold transition-colors border-b-2 flex items-center gap-1.5 ${
                activeTab === 'cobro'
                  ? 'border-[#064e3b] text-[#064e3b]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">payments</span>
              <span>Cobrar Cuota (CU-W27)</span>
              {credito?.estado_mora === 'EN_MORA' && (
                <Badge variant="red" className="!text-[9px] !py-0 !px-1.5">
                  Mora
                </Badge>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('pagos')}
              className={`px-4 py-2.5 text-xs font-bold transition-colors border-b-2 flex items-center gap-1.5 ${
                activeTab === 'pagos'
                  ? 'border-[#064e3b] text-[#064e3b]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">history</span>
              <span>Historial de Pagos</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('gestiones')}
              className={`px-4 py-2.5 text-xs font-bold transition-colors border-b-2 flex items-center gap-1.5 ${
                activeTab === 'gestiones'
                  ? 'border-[#064e3b] text-[#064e3b]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">support_agent</span>
              <span>Gestiones de Cobranza (CU-W28)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('garantias')}
              className={`px-4 py-2.5 text-xs font-bold transition-colors border-b-2 flex items-center gap-1.5 ${
                activeTab === 'garantias'
                  ? 'border-[#064e3b] text-[#064e3b]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">shield</span>
              <span>Garantías y Custodia (CU-W22)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('reprogramacion')}
              className={`px-4 py-2.5 text-xs font-bold transition-colors border-b-2 flex items-center gap-1.5 ${
                activeTab === 'reprogramacion'
                  ? 'border-[#064e3b] text-[#064e3b]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">published_with_changes</span>
              <span>Reprogramación ASFI</span>
              {(credito?.numero_reprogramaciones > 0 || credito?.reprogramado) && (
                <Badge variant="purple" className="!text-[9px] !py-0 !px-1.5">
                  {credito.numero_reprogramaciones || 1}
                </Badge>
              )}
            </button>
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
                {/* ══════════════════════════════════════════════════════════════
                    PESTAÑA 1: CRONOGRAMA OFICIAL (IMPRIMIBLE)
                   ══════════════════════════════════════════════════════════════ */}
                <div id="credito-detalle-print" className={activeTab === 'cronograma' ? 'block space-y-4' : 'hidden'}>
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
                      {credito?.estado_mora === 'EN_MORA' ? (
                        <Badge variant="red">
                          EN MORA ({credito.dias_de_retaso ?? 0} días)
                        </Badge>
                      ) : credito?.estado_mora === 'AL_DIA' ? (
                        <Badge variant="green">AL DÍA</Badge>
                      ) : null}
                      {(credito?.numero_reprogramaciones > 0 || credito?.reprogramado) && (
                        <Badge variant="purple">
                          REPROGRAMADO ({credito.numero_reprogramaciones || 1})
                        </Badge>
                      )}
                      <span className="font-mono text-slate-500 text-[11px]">
                        Desembolso: {formatDate(credito?.fecha_desembolso)}
                      </span>
                    </div>
                  </div>

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
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-center">
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
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Seguro</span>
                      <span className="font-display font-bold text-teal-800 text-base tabular-nums">
                        {formatMoney(credito.total_seguro, sim)}
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
                      totalSeguro={credito.total_seguro}
                      showEstado={true}
                      tea={credito.tea}
                      teac={credito.teac}
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
                </div>

                {/* ══════════════════════════════════════════════════════════════
                    PESTAÑA 2: COBRAR CUOTA (CU-W27)
                   ══════════════════════════════════════════════════════════════ */}
                <div className={activeTab === 'cobro' ? 'block' : 'hidden'}>
                  <CobroCuotaPanel
                    credito={credito}
                    onPagoExitoso={handlePagoExitoso}
                  />
                </div>

                {/* ══════════════════════════════════════════════════════════════
                    PESTAÑA 3: HISTORIAL DE PAGOS
                   ══════════════════════════════════════════════════════════════ */}
                <div className={activeTab === 'pagos' ? 'block' : 'hidden'}>
                  <HistorialPagosTable
                    creditoId={credito.id}
                    monedaSimbolo={sim}
                    onVerComprobante={(pago) => {
                      setPagoParaComprobante(pago)
                      setComprobanteModalOpen(true)
                    }}
                  />
                </div>

                {/* ══════════════════════════════════════════════════════════════
                    PESTAÑA 4: HISTORIAL DE GESTIONES DE COBRANZA (CU-W28)
                   ══════════════════════════════════════════════════════════════ */}
                <div className={activeTab === 'gestiones' ? 'block' : 'hidden'}>
                  <HistorialGestionesTable creditoId={credito.id} />
                </div>

                {/* ══════════════════════════════════════════════════════════════
                    PESTAÑA 5: GARANTÍAS Y AVALES EN CUSTODIA (CU-W22)
                   ══════════════════════════════════════════════════════════════ */}
                <div className={activeTab === 'garantias' ? 'block' : 'hidden'}>
                  <GarantiasCreditoTab creditoId={credito.id} credito={credito} />
                </div>

                {/* ══════════════════════════════════════════════════════════════
                    PESTAÑA 6: REPROGRAMACIÓN DE CRÉDITO (ASFI — LEY 393)
                   ══════════════════════════════════════════════════════════════ */}
                <div className={activeTab === 'reprogramacion' ? 'block space-y-5' : 'hidden'}>
                  {reprogError && (
                    <AlertBanner variant="error" onClose={() => setReprogError(null)}>
                      {reprogError}
                    </AlertBanner>
                  )}
                  {reprogSuccess && (
                    <AlertBanner variant="success" onClose={() => setReprogSuccess(null)}>
                      {reprogSuccess}
                    </AlertBanner>
                  )}

                  {/* Resumen de Reprogramación */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                        Saldo Pendiente Capital
                      </span>
                      <span className="font-display font-bold text-slate-900 text-sm tabular-nums">
                        {formatMoney(credito.saldo_pendiente, sim)}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                        Plazo Vigente
                      </span>
                      <span className="font-display font-bold text-slate-900 text-sm tabular-nums">
                        {credito.cuotas_totales || credito.plazo_meses} meses
                      </span>
                    </div>

                    <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                        Tasa de Interés
                      </span>
                      <span className="font-display font-bold text-emerald-800 text-sm tabular-nums">
                        {Number(credito.tasa_interes).toFixed(2)}% TNA
                      </span>
                    </div>

                    <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                        N° Reprogramaciones
                      </span>
                      <span className="font-display font-bold text-purple-900 text-sm tabular-nums">
                        {credito.numero_reprogramaciones ?? 0}
                      </span>
                    </div>
                  </div>

                  {/* Formulario de Solicitud de Reprogramación */}
                  {canManageReprog && credito.estado === 'VIGENTE' && Number(credito.saldo_pendiente) > 0 && (
                    <div className="rounded-xl border border-purple-200 bg-purple-50/40 p-4 space-y-4">
                      <div className="flex items-center justify-between border-b border-purple-200/60 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[18px] text-purple-800">
                            published_with_changes
                          </span>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-purple-900">
                            Nueva Solicitud de Reprogramación
                          </h4>
                        </div>
                        <Badge variant="purple">Normativa ASFI</Badge>
                      </div>

                      <form onSubmit={handleSolicitarReprogramacion} className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <FormField id="nuevo_plazo_meses" label="Nuevo Plazo Total (Meses) *">
                            <Input
                              id="nuevo_plazo_meses"
                              type="number"
                              min="1"
                              placeholder="Ej. 36"
                              value={nuevoPlazoMeses}
                              onChange={(e) => setNuevoPlazoMeses(e.target.value)}
                              className="tabular-nums font-semibold"
                            />
                          </FormField>

                          <div className="flex items-end pb-0.5">
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={handleSimularReprogramacion}
                              loading={simulandoReprog}
                              className="gap-1 text-purple-900 border-purple-300 hover:bg-purple-100"
                            >
                              <span className="material-symbols-outlined text-[16px]">calculate</span>
                              <span>Simular / Previsualizar Cronograma</span>
                            </Button>
                          </div>
                        </div>

                        <FormField id="motivo_reprog" label="Motivo y Justificación Técnica de la Reprogramación *">
                          <Textarea
                            id="motivo_reprog"
                            rows={2}
                            placeholder="Detalle la situación socioeconómica sobrevenida, afectación de ingresos o reestructuración pactada..."
                            value={motivoReprog}
                            onChange={(e) => setMotivoReprog(e.target.value)}
                          />
                        </FormField>

                        {/* Previsualización de la Simulación si fue ejecutada */}
                        {simulacionReprog && (
                          <div className="rounded-lg border border-purple-300 bg-white p-3.5 space-y-3 shadow-xs">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                              <span className="font-bold text-xs text-purple-950">
                                Previsualización de la Nueva Estructura Financiera
                              </span>
                              <div className="flex items-center gap-2 text-xs font-mono font-bold">
                                {simulacionReprog.tea != null && (
                                  <span className="text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                    TEA: {Number(simulacionReprog.tea).toFixed(2)}%
                                  </span>
                                )}
                                {simulacionReprog.teac != null && (
                                  <span className="text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                                    TEAC: {Number(simulacionReprog.teac).toFixed(2)}%
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
                              <div className="p-2 bg-slate-50 rounded border border-slate-200">
                                <span className="text-[10px] uppercase font-bold text-slate-400 block">Saldo Capital</span>
                                <span className="font-mono font-bold text-slate-900 text-xs">
                                  {formatMoney(simulacionReprog.saldo_capital, sim)}
                                </span>
                              </div>
                              <div className="p-2 bg-slate-50 rounded border border-slate-200">
                                <span className="text-[10px] uppercase font-bold text-slate-400 block">Interés Diferido (1ra Cuota)</span>
                                <span className="font-mono font-bold text-amber-800 text-xs">
                                  {formatMoney(simulacionReprog.interes_diferido, sim)}
                                </span>
                                <span className="text-[9px] text-slate-400 block">No capitalizable</span>
                              </div>
                              <div className="p-2 bg-slate-50 rounded border border-slate-200">
                                <span className="text-[10px] uppercase font-bold text-slate-400 block">Mora Condonada</span>
                                <span className="font-mono font-bold text-emerald-800 text-xs">
                                  {formatMoney(simulacionReprog.mora_condonada, sim)}
                                </span>
                              </div>
                            </div>

                            {simulacionReprog.cuotas?.length > 0 && (
                              <TablaAmortizacion
                                cuotas={simulacionReprog.cuotas}
                                monedaSimbolo={sim}
                                totalCapital={simulacionReprog.total_capital}
                                totalInteres={simulacionReprog.total_interes}
                                totalSeguro={simulacionReprog.total_seguro}
                                totalPagar={simulacionReprog.total_pagar}
                                showEstado={false}
                                tea={simulacionReprog.tea}
                                teac={simulacionReprog.teac}
                              />
                            )}
                          </div>
                        )}

                        <div className="flex justify-end pt-1">
                          <Button
                            type="submit"
                            variant="primary"
                            size="sm"
                            loading={solicitandoReprog}
                            className="bg-purple-800 hover:bg-purple-900 text-white gap-1.5"
                          >
                            <span className="material-symbols-outlined text-[16px]">send</span>
                            <span>Registrar Solicitud de Reprogramación</span>
                          </Button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Historial de Reprogramaciones */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        Historial de Reprogramaciones del Crédito
                      </h4>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={loadReprogramaciones}
                        disabled={loadingReprog}
                        className="!py-0.5 !px-2 !text-[11px] gap-1"
                      >
                        <span className="material-symbols-outlined text-[14px]">refresh</span>
                        <span>Actualizar</span>
                      </Button>
                    </div>

                    {loadingReprog ? (
                      <div className="space-y-2 p-3">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    ) : reprogramaciones.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 text-xs rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
                        Este crédito no registra solicitudes ni procesos de reprogramación.
                      </div>
                    ) : (
                      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-slate-200 bg-slate-50/80 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                              <th className="px-3 py-2.5">ID / Fecha</th>
                              <th className="px-3 py-2.5">Canal</th>
                              <th className="px-3 py-2.5">Nuevo Plazo</th>
                              <th className="px-3 py-2.5 text-right">Saldo Capital</th>
                              <th className="px-3 py-2.5 text-right">Int. Diferido</th>
                              <th className="px-3 py-2.5 text-right">Mora Condonada</th>
                              <th className="px-3 py-2.5 text-center">Estado</th>
                              <th className="px-3 py-2.5">Motivo / Resolución</th>
                              {canManageReprog && <th className="px-3 py-2.5 text-center">Acciones</th>}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                            {reprogramaciones.map((r) => {
                              const isSolicitada = r.estado === 'SOLICITADA'
                              const isAprobada = r.estado === 'APROBADA'
                              const isRechazada = r.estado === 'RECHAZADA'
                              return (
                                <tr key={r.id} className="hover:bg-slate-50/70">
                                  <td className="px-3 py-2 font-bold text-slate-800">
                                    #{r.id}
                                    <span className="block text-[10px] text-slate-400 font-normal">
                                      {formatDate(r.fecha_solicitud)}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2 text-slate-700 font-sans">
                                    {r.canal || 'VENTANILLA'}
                                  </td>
                                  <td className="px-3 py-2 text-slate-800">
                                    {r.nuevo_plazo_meses} meses
                                  </td>
                                  <td className="px-3 py-2 text-right text-slate-900 tabular-nums">
                                    {formatMoney(r.saldo_capital, sim)}
                                  </td>
                                  <td className="px-3 py-2 text-right text-amber-800 tabular-nums">
                                    {formatMoney(r.interes_diferido, sim)}
                                  </td>
                                  <td className="px-3 py-2 text-right text-emerald-800 tabular-nums">
                                    {formatMoney(r.mora_condonada, sim)}
                                  </td>
                                  <td className="px-3 py-2 text-center font-sans">
                                    <Badge
                                      variant={isAprobada ? 'green' : isRechazada ? 'red' : 'amber'}
                                      className="!text-[10px] !py-0 !px-1.5"
                                    >
                                      {r.estado}
                                    </Badge>
                                  </td>
                                  <td className="px-3 py-2 font-sans text-slate-600 max-w-xs truncate" title={r.motivo}>
                                    <div>{r.motivo}</div>
                                    {r.motivo_rechazo && (
                                      <div className="text-rose-600 text-[10px] font-semibold">
                                        Rechazo: {r.motivo_rechazo}
                                      </div>
                                    )}
                                  </td>
                                  {canManageReprog && (
                                    <td className="px-3 py-2 text-center font-sans">
                                      {isSolicitada ? (
                                        <div className="flex items-center justify-center gap-1.5">
                                          <Button
                                            type="button"
                                            variant="primary"
                                            size="sm"
                                            onClick={() => handleAprobarReprogramacion(r.id)}
                                            loading={aprobandoId === r.id}
                                            className="!py-0.5 !px-2 !text-[10px] bg-emerald-700 hover:bg-emerald-800"
                                          >
                                            Aprobar
                                          </Button>
                                          <Button
                                            type="button"
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => handleAbrirRechazo(r.id)}
                                            className="!py-0.5 !px-2 !text-[10px] text-rose-700 border-rose-300 hover:bg-rose-50"
                                          >
                                            Rechazar
                                          </Button>
                                        </div>
                                      ) : (
                                        <span className="text-[10px] text-slate-400">Resuelta</span>
                                      )}
                                    </td>
                                  )}
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )
          )}
        </div>
      </Modal>

      {/* ── Modal de Rechazo de Reprogramación ── */}
      {modalRechazoOpen && (
        <Modal
          open={modalRechazoOpen}
          onClose={() => setModalRechazoOpen(false)}
          title="Rechazar Reprogramación de Crédito"
          subtitle="Fundamentación del dictamen de rechazo según políticas ASFI"
          footer={
            <div className="flex w-full items-center justify-between">
              <Button
                variant="secondary"
                size="sm"
                type="button"
                onClick={() => setModalRechazoOpen(false)}
                disabled={rechazando}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                form="rechazo-reprog-form"
                loading={rechazando}
                className="bg-rose-700 hover:bg-rose-800 text-white"
              >
                Confirmar Rechazo
              </Button>
            </div>
          }
        >
          <form id="rechazo-reprog-form" onSubmit={handleConfirmarRechazo} className="space-y-3 text-xs">
            <FormField id="motivo_rechazo_input" label="Motivo del Rechazo *" required>
              <Textarea
                id="motivo_rechazo_input"
                rows={3}
                placeholder="Indique las causales técnicas o fiduciarias del rechazo..."
                value={motivoRechazo}
                onChange={(e) => setMotivoRechazo(e.target.value)}
                required
              />
            </FormField>
          </form>
        </Modal>
      )}

      {/* ── Modal de Comprobante Oficial Imprimible ── */}
      {comprobanteModalOpen && pagoParaComprobante && (
        <ComprobantePagoModal
          open={comprobanteModalOpen}
          onClose={() => setComprobanteModalOpen(false)}
          pago={pagoParaComprobante}
        />
      )}
    </>
  )
}
