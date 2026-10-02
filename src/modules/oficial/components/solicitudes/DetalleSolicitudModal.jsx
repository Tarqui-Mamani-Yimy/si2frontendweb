import { useState, useEffect, useMemo } from 'react'
import Modal from '../../../../components/ui/Modal'
import Button from '../../../../components/ui/Button'
import Badge from '../../../../components/ui/Badge'
import EvaluacionCrediticiaView from '../scoring/EvaluacionCrediticiaView'
import ResolverDictamenModal from '../scoring/ResolverDictamenModal'
import PlanPagosModal from '../creditos/PlanPagosModal'
import DesembolsoModal from '../creditos/DesembolsoModal'
import ComprobanteDesembolsoModal from '../creditos/ComprobanteDesembolsoModal'
import ActaComiteModal from '../comite/ActaComiteModal'
import GarantiasSection from '../garantias/GarantiasSection'
import {
  evaluarSolicitud,
  listarEvaluaciones,
  getSolicitudCredito,
} from '../../../../core/api/creditosApi'
import { useAuthStore, selectUser } from '../../../../core/store/authStore'
import { normalizeRole } from '../../../../core/utils/roles'

function formatMoney(value, simbolo = 'Bs.') {
  const n = Number(value ?? 0)
  return `${simbolo} ${n.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(isoStr) {
  if (!isoStr) return '—'
  const d = new Date(isoStr)
  if (isNaN(d.getTime())) return isoStr
  return d.toLocaleString('es-BO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getEstadoBadgeVariant(estado) {
  switch (estado) {
    case 'PENDIENTE':
      return 'navy'
    case 'OBSERVADA':
      return 'amber'
    case 'EN_EVALUACION':
      return 'indigo'
    case 'EN_COMITE':
      return 'purple'
    case 'APROBADO':
      return 'green'
    case 'RECHAZADO':
      return 'red'
    case 'DESEMBOLSADO':
      return 'teal'
    case 'ANULADA':
      return 'slate'
    default:
      return 'slate'
  }
}

function getResultadoBadgeVariant(resultado) {
  switch (resultado) {
    case 'APROBADO':
      return 'green'
    case 'RECHAZADO':
      return 'red'
    case 'OBSERVADA':
      return 'amber'
    case 'EN_COMITE':
      return 'purple'
    default:
      return 'slate'
  }
}

function getDictamenBadgeVariant(dictamen) {
  switch (dictamen) {
    case 'APROBADO':
      return 'green'
    case 'REVISION_MANUAL':
      return 'amber'
    case 'RECHAZADO':
      return 'red'
    default:
      return 'slate'
  }
}

/**
 * DetalleSolicitudModal — Vista de detalle de expediente, scoring algorítmico y formato imprimible (CU-W21 + CU-W23).
 *
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   solicitud: object|null,
 *   onEditar?: (solicitud: object) => void,
 *   onAnular?: (solicitud: object) => void,
 *   onUpdated?: (solicitud: object) => void,
 *   initialTab?: 'expediente' | 'scoring'
 * }} props
 */
export default function DetalleSolicitudModal({
  open,
  onClose,
  solicitud,
  onEditar,
  onAnular,
  onUpdated,
  initialTab = 'expediente',
}) {
  const user = useAuthStore(selectUser)
  const [solicitudOverride, setSolicitudOverride] = useState(null)
  const currentSolicitud =
    solicitudOverride && solicitudOverride.id === solicitud?.id
      ? solicitudOverride
      : solicitud

  const [activeTab, setActiveTab] = useState(initialTab)

  // Estado de Scoring / Evaluaciones
  const [evaluaciones, setEvaluaciones] = useState([])
  const [selectedEvalId, setSelectedEvalId] = useState(null)
  const [evaluando, setEvaluando] = useState(false)
  const [errorEval, setErrorEval] = useState(null)

  // Modal de resolución administrativa (para Administrador)
  const [resolverModalOpen, setResolverModalOpen] = useState(false)

  // Modales de Plan de Pagos, Desembolso y Comprobante (CU-W24 / CU-W26)
  const [planPagosModalOpen, setPlanPagosModalOpen] = useState(false)
  const [desembolsoModalOpen, setDesembolsoModalOpen] = useState(false)
  const [comprobanteModalOpen, setComprobanteModalOpen] = useState(false)
  const [actaModalOpen, setActaModalOpen] = useState(false)
  const [creditoDesembolsado, setCreditoDesembolsado] = useState(null)

  // Cargar historial de evaluaciones al abrir o cambiar de solicitud
  useEffect(() => {
    if (!open || !solicitud?.id) return
    let isMounted = true

    async function fetchEvaluaciones() {
      try {
        const data = await listarEvaluaciones(solicitud.id)
        if (!isMounted) return
        const evals = Array.isArray(data) ? data : []
        setEvaluaciones(evals)
        if (evals.length > 0) {
          setSelectedEvalId(evals[0].id)
        } else {
          setSelectedEvalId(null)
        }
      } catch {
        if (isMounted) setEvaluaciones([])
      }
    }

    fetchEvaluaciones()

    return () => {
      isMounted = false
    }
  }, [open, solicitud?.id])

  // Evaluación actualmente seleccionada
  const evaluacionActiva = useMemo(() => {
    if (!evaluaciones || evaluaciones.length === 0) return null
    if (selectedEvalId) {
      const found = evaluaciones.find((e) => String(e.id) === String(selectedEvalId))
      if (found) return found
    }
    return evaluaciones[0]
  }, [evaluaciones, selectedEvalId])

  if (!open || !currentSolicitud) return null

  // Permisos de rol
  const roleName = user?.rol?.nombre || ''
  const isAdmin =
    roleName === 'ADMINISTRADOR' ||
    roleName === 'SUPERADMIN' ||
    normalizeRole(roleName) === 'administrador'

  const canEval =
    isAdmin ||
    roleName === 'OFICIAL_CREDITO' ||
    normalizeRole(roleName) === 'oficial_credito'

  const sim = (typeof currentSolicitud.moneda === 'object' ? currentSolicitud.moneda?.simbolo : 'Bs.') || 'Bs.'
  const iso = (typeof currentSolicitud.moneda === 'object' ? currentSolicitud.moneda?.codigo_iso : 'BOB') || 'BOB'
  const esEditable = currentSolicitud.estado === 'PENDIENTE' || currentSolicitud.estado === 'OBSERVADA'
  const esEvaluable =
    currentSolicitud.estado === 'PENDIENTE' ||
    currentSolicitud.estado === 'OBSERVADA' ||
    currentSolicitud.estado === 'EN_EVALUACION'

  const canResolve =
    isAdmin &&
    currentSolicitud.estado === 'EN_EVALUACION' &&
    evaluacionActiva?.dictamen === 'REVISION_MANUAL' &&
    !evaluacionActiva?.resolucion

  const numero = currentSolicitud.numero_solicitud || `SOL-#${currentSolicitud.id}`

  function handlePrint() {
    window.print()
  }

  async function handleEvaluar() {
    setEvaluando(true)
    setErrorEval(null)
    try {
      const nuevaEval = await evaluarSolicitud(currentSolicitud.id)
      setEvaluaciones((prev) => [nuevaEval, ...prev.filter((e) => e.id !== nuevaEval.id)])
      setSelectedEvalId(nuevaEval.id)

      let updatedSol
      try {
        updatedSol = await getSolicitudCredito(currentSolicitud.id)
      } catch {
        const nuevoEstado = nuevaEval.dictamen === 'RECHAZADO' ? 'RECHAZADO' : 'EN_COMITE'
        updatedSol = {
          ...currentSolicitud,
          estado: nuevoEstado,
          ultima_evaluacion: {
            id: nuevaEval.id,
            score: nuevaEval.score,
            dictamen: nuevaEval.dictamen,
            fecha: nuevaEval.fecha,
          },
        }
      }

      setSolicitudOverride(updatedSol)
      onUpdated?.(updatedSol)
      setActiveTab('scoring')
    } catch (err) {
      setErrorEval(
        err.response?.data?.detail ||
          'Error al ejecutar la evaluación de scoring crediticio.',
      )
    } finally {
      setEvaluando(false)
    }
  }

  function handleResolverSuccess(evalResuelta) {
    setEvaluaciones((prev) =>
      prev.map((e) => (e.id === evalResuelta.id ? evalResuelta : e)),
    )
    setSelectedEvalId(evalResuelta.id)

    const nuevoEstado = evalResuelta.resolucion?.decision || evalResuelta.dictamen
    const updatedSol = {
      ...currentSolicitud,
      estado: nuevoEstado,
      ultima_evaluacion: {
        id: evalResuelta.id,
        score: evalResuelta.score,
        dictamen: evalResuelta.dictamen,
        fecha: evalResuelta.fecha,
      },
    }
    setSolicitudOverride(updatedSol)
    onUpdated?.(updatedSol)
  }

  function handleDesembolsoSuccess(credito) {
    const updatedSol = {
      ...currentSolicitud,
      estado: 'DESEMBOLSADO',
    }
    setSolicitudOverride(updatedSol)
    onUpdated?.(updatedSol)
    setCreditoDesembolsado(credito)
    setComprobanteModalOpen(true)
  }

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={`Solicitud ${numero}`}
        subtitle={`Expediente crediticio &bull; Registrado el ${formatDate(currentSolicitud.fecha_solicitud)}`}
        footer={
          <div className="flex w-full items-center justify-between">
            <Button variant="secondary" size="sm" onClick={onClose} type="button">
              Cerrar
            </Button>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handlePrint}
                type="button"
                className="gap-1.5"
                title={
                  activeTab === 'scoring'
                    ? 'Imprimir informe de scoring y dictamen de riesgo'
                    : 'Imprimir formulario de solicitud de crédito'
                }
              >
                <span className="material-symbols-outlined text-[16px]">print</span>
                <span>
                  {activeTab === 'scoring' ? 'Imprimir Scoring' : 'Imprimir Formulario'}
                </span>
              </Button>

              {/* Botón Plan de Pagos / Amortización (CU-W24) */}
              {(currentSolicitud.estado === 'APROBADO' || currentSolicitud.estado === 'DESEMBOLSADO') && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPlanPagosModalOpen(true)}
                  type="button"
                  className="gap-1.5 text-emerald-800 border-emerald-300 hover:bg-emerald-50"
                  title="Ver y proyectar cronograma de amortización"
                >
                  <span className="material-symbols-outlined text-[16px]">calendar_month</span>
                  <span>Plan de Pagos</span>
                </Button>
              )}

              {/* Botón Acta de Comité (CU-W25) */}
              {(currentSolicitud.ronda_comite > 0 || currentSolicitud.resultado_comite || currentSolicitud.estado === 'EN_COMITE') && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setActaModalOpen(true)}
                  type="button"
                  className="gap-1.5 text-purple-800 border-purple-300 hover:bg-purple-50"
                  title="Ver e imprimir acta oficial de deliberación en comité de crédito"
                >
                  <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                  <span>Acta de Comité</span>
                </Button>
              )}

              {/* Botón Desembolsar (CU-W26) */}
              {currentSolicitud.estado === 'APROBADO' && canEval && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setDesembolsoModalOpen(true)}
                  type="button"
                  className="gap-1.5 bg-[#064e3b] hover:bg-[#043327] text-white shadow-sm"
                  title="Ejecutar desembolso del crédito aprobado en cuenta o ventanilla"
                >
                  <span className="material-symbols-outlined text-[16px]">payments</span>
                  <span>Desembolsar</span>
                </Button>
              )}

              {/* Botón Resolver para Administrador */}
              {canResolve && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setResolverModalOpen(true)}
                  type="button"
                  className="gap-1.5 bg-amber-600 hover:bg-amber-700 text-white border-amber-600 shadow-sm"
                >
                  <span className="material-symbols-outlined text-[16px]">gavel</span>
                  <span>Resolver Dictamen</span>
                </Button>
              )}

              {/* Botón Evaluar Solicitud */}
              {esEvaluable && canEval && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleEvaluar}
                  loading={evaluando}
                  type="button"
                  className="gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {evaluaciones.length > 0 ? 'refresh' : 'play_arrow'}
                  </span>
                  <span>{evaluaciones.length > 0 ? 'Re-evaluar' : 'Evaluar Solicitud'}</span>
                </Button>
              )}

              {/* Acciones de edición/anulación */}
              {esEditable && onAnular && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    onClose()
                    onAnular(currentSolicitud)
                  }}
                  type="button"
                  className="gap-1 text-rose-700 hover:text-rose-900 hover:bg-rose-50 hover:border-rose-300"
                >
                  <span className="material-symbols-outlined text-[16px]">cancel</span>
                  <span>Anular</span>
                </Button>
              )}

              {esEditable && onEditar && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    onClose()
                    onEditar(currentSolicitud)
                  }}
                  type="button"
                  className="gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">edit</span>
                  <span>Editar Solicitud</span>
                </Button>
              )}
            </div>
          </div>
        }
      >
        <style>{`
          @media print {
            body * { visibility: hidden !important; }
            .printable-active-report, .printable-active-report * { visibility: visible !important; }
            .printable-active-report {
              position: fixed !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              margin: 0 !important;
              padding: 24px !important;
              border: 1px dashed #cbd5e1 !important;
              box-shadow: none !important;
              background: white !important;
            }
          }
        `}</style>

        {/* ── Navegación por Pestañas ── */}
        <div className="flex border-b border-slate-200 mb-4">
          <button
            type="button"
            onClick={() => setActiveTab('expediente')}
            className={`px-4 py-2.5 text-xs font-bold transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'expediente'
                ? 'border-[#064e3b] text-[#064e3b]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">folder_open</span>
            <span>Expediente del Crédito</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('scoring')}
            className={`px-4 py-2.5 text-xs font-bold transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'scoring'
                ? 'border-[#064e3b] text-[#064e3b]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">neurology</span>
            <span>Scoring y Dictamen (CU-W23)</span>
            {evaluacionActiva?.dictamen ? (
              <Badge variant={getDictamenBadgeVariant(evaluacionActiva.dictamen)} className="!text-[9px] !py-0 !px-1.5">
                {evaluacionActiva.dictamen}
              </Badge>
            ) : currentSolicitud.ultima_evaluacion?.dictamen ? (
              <Badge variant={getDictamenBadgeVariant(currentSolicitud.ultima_evaluacion.dictamen)} className="!text-[9px] !py-0 !px-1.5">
                {currentSolicitud.ultima_evaluacion.dictamen}
              </Badge>
            ) : null}
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
            <span>Garantías y Avales (CU-W22)</span>
            {currentSolicitud.producto?.requiere_garantia && (
              <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 font-semibold">
                Requerida
              </span>
            )}
          </button>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            PESTAÑA 1: EXPEDIENTE GENERAL Y FORMATO IMPRIMIBLE CU-W21
           ══════════════════════════════════════════════════════════════ */}
        <div className={activeTab === 'expediente' ? 'block' : 'hidden'}>
          <div className="printable-active-report space-y-4 text-xs font-sans text-slate-800">
            {/* Encabezado Fiduciario para Impresión */}
            <div className="border-b border-slate-200 pb-3 text-center">
              <h2 className="font-display text-sm font-bold uppercase text-slate-900">
                NexaCoop Core Banking &bull; Solicitud de Crédito
              </h2>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Recepción y Formulario Socioeconómico &bull; {numero}
              </p>
              <div className="mt-2 flex items-center justify-center gap-2">
                <Badge variant={getEstadoBadgeVariant(currentSolicitud.estado)}>
                  {currentSolicitud.estado}
                </Badge>
                <span className="font-mono text-slate-500 text-[11px]">
                  Fecha: {formatDate(currentSolicitud.fecha_solicitud)}
                </span>
              </div>
            </div>

            {/* Motivo de anulación si aplica */}
            {currentSolicitud.estado === 'ANULADA' && currentSolicitud.motivo_anulacion && (
              <div className="rounded-lg border border-rose-300 bg-rose-50 p-3 text-rose-900 space-y-1">
                <span className="font-bold block uppercase text-[10px] tracking-wider text-rose-700">
                  Solicitud Anulada
                </span>
                <p className="text-xs">{currentSolicitud.motivo_anulacion}</p>
              </div>
            )}

            {/* Banner de Crédito Aprobado listo para Desembolso */}
            {currentSolicitud.estado === 'APROBADO' && (
              <div className="rounded-xl border border-emerald-300 bg-emerald-50/80 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700 shrink-0">
                    <span className="material-symbols-outlined text-xl">verified</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-emerald-950">Solicitud Aprobada &bull; Lista para Desembolso</h4>
                    <p className="text-xs text-emerald-800">
                      Esta solicitud cuenta con dictamen aprobatorio. Puede previsualizar e imprimir el cronograma de cuotas o proceder con el desembolso de fondos.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setPlanPagosModalOpen(true)}
                    type="button"
                    className="gap-1.5 bg-white text-emerald-900 border-emerald-300 hover:bg-emerald-100"
                  >
                    <span className="material-symbols-outlined text-[16px]">calendar_month</span>
                    <span>Plan de Pagos</span>
                  </Button>
                  {canEval && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setDesembolsoModalOpen(true)}
                      type="button"
                      className="gap-1.5 bg-[#064e3b] hover:bg-[#043327] text-white"
                    >
                      <span className="material-symbols-outlined text-[16px]">payments</span>
                      <span>Desembolsar</span>
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Banner de Crédito Desembolsado */}
            {currentSolicitud.estado === 'DESEMBOLSADO' && (
              <div className="rounded-xl border border-teal-300 bg-teal-50/80 p-3.5 shadow-sm flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 text-teal-900">
                  <span className="material-symbols-outlined text-xl text-teal-700">check_circle</span>
                  <span className="text-xs font-semibold">
                    Crédito desembolsado exitosamente. Puede consultar las cuotas en la sección de Cartera.
                  </span>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPlanPagosModalOpen(true)}
                  type="button"
                  className="gap-1.5 bg-white text-teal-900 border-teal-300 hover:bg-teal-100 text-xs"
                >
                  <span className="material-symbols-outlined text-[15px]">calendar_month</span>
                  <span>Ver Plan</span>
                </Button>
              </div>
            )}

            {/* Banner de Solicitud en Comité de Crédito (CU-W25) */}
            {currentSolicitud.estado === 'EN_COMITE' && (
              <div className="rounded-xl border border-purple-300 bg-purple-50/80 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-purple-100 p-2 text-purple-700 shrink-0">
                    <span className="material-symbols-outlined text-xl">how_to_vote</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-purple-950">
                        Solicitud Derivada a Comité de Crédito
                      </h4>
                      <Badge variant="purple" className="!text-[9px]">
                        Ronda #{currentSolicitud.ronda_comite || 1}
                      </Badge>
                    </div>
                    <p className="text-xs text-purple-800">
                      Esta solicitud requiere deliberación y votación colegiada estatutaria de los vocales del comité.
                    </p>
                  </div>
                </div>
                {(currentSolicitud.ronda_comite > 0 || currentSolicitud.resultado_comite) && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setActaModalOpen(true)}
                    type="button"
                    className="gap-1.5 bg-white text-purple-900 border-purple-300 hover:bg-purple-100 shrink-0"
                  >
                    <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                    <span>Acta de Comité</span>
                  </Button>
                )}
              </div>
            )}

            {/* Resolución de Comité si ya fue resuelta en rondas previas */}
            {currentSolicitud.resultado_comite && currentSolicitud.estado !== 'EN_COMITE' && (
              <div className="rounded-lg border border-purple-200 bg-purple-50/60 p-2.5 flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-purple-700">gavel</span>
                  <span className="text-slate-700 font-medium">
                    Resolución de Comité (Ronda #{currentSolicitud.ronda_comite || 1}):
                  </span>
                  <Badge variant={getResultadoBadgeVariant(currentSolicitud.resultado_comite)}>
                    {currentSolicitud.resultado_comite}
                  </Badge>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setActaModalOpen(true)}
                  type="button"
                  className="!py-0.5 !px-2 !text-[11px] gap-1 text-purple-800 border-purple-300 hover:bg-purple-50"
                >
                  <span className="material-symbols-outlined text-[13px]">receipt_long</span>
                  <span>Ver Acta</span>
                </Button>
              </div>
            )}

            {/* ── Datos del Socio ── */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Datos del Socio Solicitante
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Nombre Completo:</span>
                  <span className="font-bold text-slate-900 block text-sm">
                    {currentSolicitud.socio?.nombre_completo || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Cédula de Identidad:</span>
                  <span className="font-mono font-bold text-slate-800 block text-xs">
                    CI: {currentSolicitud.socio?.ci || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Oficial Receptor:</span>
                  <span className="font-medium text-slate-700 block">
                    {currentSolicitud.oficial?.nombre || 'Oficial de crédito'}
                  </span>
                </div>
              </div>
            </div>

            {/* ── Condiciones del Crédito Solicitado ── */}
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Condiciones del Préstamo Solicitado
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="rounded-lg bg-slate-50 p-2 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Monto Solicitado</span>
                  <span className="font-display font-bold text-slate-900 text-sm tabular-nums">
                    {formatMoney(currentSolicitud.monto, sim)}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono block">{iso}</span>
                </div>

                <div className="rounded-lg bg-slate-50 p-2 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Plazo de Pago</span>
                  <span className="font-display font-bold text-slate-900 text-sm tabular-nums">
                    {currentSolicitud.plazo_meses} meses
                  </span>
                  <span className="text-[10px] text-slate-400 block">Frecuencia mensual</span>
                </div>

                <div className="rounded-lg bg-slate-50 p-2 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Tasa Nominal (TNA)</span>
                  <span className="font-display font-bold text-[#064e3b] text-sm tabular-nums">
                    {Number(currentSolicitud.tasa_interes).toFixed(2)}%
                  </span>
                  <span className="text-[10px] text-emerald-800 font-semibold block">
                    {currentSolicitud.producto?.tipo_amortizacion === 'ALEMAN' ? 'Alemán (Capital)' : 'Francés (Cuota)'}
                  </span>
                </div>

                <div className="rounded-lg bg-slate-50 p-2 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Cuota Estimada</span>
                  <span className="font-display font-bold text-slate-900 text-sm tabular-nums">
                    {currentSolicitud.cuota_estimada ? formatMoney(currentSolicitud.cuota_estimada, sim) : '—'}
                  </span>
                  <span className="text-[10px] text-slate-400 block">Mensual</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-100">
                <div>
                  <span className="text-[10px] uppercase text-slate-400 block font-semibold">Producto Crediticio:</span>
                  <span className="font-bold text-slate-800">
                    {currentSolicitud.producto ? `${currentSolicitud.producto.codigo} — ${currentSolicitud.producto.nombre}` : 'Sin producto formal asignado (Legacy)'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-400 block font-semibold">Destino Declarado:</span>
                  <span className="font-semibold text-slate-800">
                    {currentSolicitud.destino || 'No especificado'}
                    {currentSolicitud.destino_detalle && ` (${currentSolicitud.destino_detalle})`}
                  </span>
                </div>
              </div>

              {currentSolicitud.observaciones && (
                <div className="pt-1">
                  <span className="text-[10px] uppercase text-slate-400 block font-semibold">Observaciones:</span>
                  <p className="text-slate-600 mt-0.5">{currentSolicitud.observaciones}</p>
                </div>
              )}
            </div>

            {/* ── Evaluación Socioeconómica y Capacidad de Pago ── */}
            {currentSolicitud.evaluacion && (
              <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Evaluación Socioeconómica y Capacidad de Pago
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                  <div className="rounded-lg bg-slate-50 p-2 border border-slate-200">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Ingreso Mensual</span>
                    <span className="font-bold text-slate-900 text-sm tabular-nums">
                      {formatMoney(currentSolicitud.evaluacion.ingreso_mensual, sim)}
                    </span>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-2 border border-slate-200">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Egreso Mensual</span>
                    <span className="font-bold text-slate-700 text-sm tabular-nums">
                      {formatMoney(currentSolicitud.evaluacion.egreso_mensual, sim)}
                    </span>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-2 border border-slate-200">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Otras Deudas</span>
                    <span className="font-bold text-slate-700 text-sm tabular-nums">
                      {formatMoney(currentSolicitud.evaluacion.cuota_deudas_mensual, sim)}
                    </span>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-2 border border-slate-200">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Capacidad Neta</span>
                    <span className={`font-display font-bold text-sm tabular-nums ${
                      parseFloat(currentSolicitud.evaluacion.capacidad_pago) < 0 ? 'text-rose-600' : 'text-emerald-700'
                    }`}>
                      {formatMoney(currentSolicitud.evaluacion.capacidad_pago, sim)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 block font-semibold">Actividad Económica:</span>
                    <span className="font-medium text-slate-800">{currentSolicitud.evaluacion.actividad_economica || '—'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 block font-semibold">Fuente de Ingreso:</span>
                    <span className="font-medium text-slate-800">{currentSolicitud.evaluacion.fuente_ingresos || '—'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 block font-semibold">Antigüedad Laboral:</span>
                    <span className="font-medium text-slate-800">{currentSolicitud.evaluacion.antiguedad_laboral_meses} meses</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 block font-semibold">Calificación ASFI:</span>
                    <span className="font-bold text-slate-900">Categoría {currentSolicitud.evaluacion.calificacion_asfi || 'A'}</span>
                  </div>
                </div>

                {/* Relación Cuota/Ingreso */}
                {currentSolicitud.relacion_cuota_ingreso != null && (
                  <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-semibold text-slate-700">Relación Cuota / Ingreso Neto (RCI):</span>
                      <span className="font-bold text-slate-900 ml-1">
                        {Number(currentSolicitud.relacion_cuota_ingreso).toFixed(1)}%
                      </span>
                    </div>
                    {currentSolicitud.supera_relacion_maxima ? (
                      <Badge variant="amber">Supera Límite Recomendado</Badge>
                    ) : (
                      <Badge variant="green">RCI Conforme</Badge>
                    )}
                  </div>
                )}

                {currentSolicitud.evaluacion.observaciones && (
                  <div className="pt-1">
                    <span className="text-[10px] uppercase text-slate-400 block font-semibold">Observaciones del Oficial:</span>
                    <p className="text-slate-600 mt-0.5">{currentSolicitud.evaluacion.observaciones}</p>
                  </div>
                )}
              </div>
            )}

            {/* Firmas de Conformidad para Impresión */}
            <div className="pt-10 grid grid-cols-2 gap-8 text-center text-[10px] text-slate-500 border-t border-slate-200 mt-6">
              <div>
                <div className="border-b border-slate-300 w-3/4 mx-auto mb-1.5" />
                <span className="font-semibold block text-slate-800 text-xs">
                  {currentSolicitud.socio?.nombre_completo || 'Socio Solicitante'}
                </span>
                <span>Firma del Socio Solicitante (CI: {currentSolicitud.socio?.ci || '—'})</span>
              </div>
              <div>
                <div className="border-b border-slate-300 w-3/4 mx-auto mb-1.5" />
                <span className="font-semibold block text-slate-800 text-xs">
                  {currentSolicitud.oficial?.nombre || 'Oficial de Crédito'}
                </span>
                <span>Firma y Sello del Oficial de Crédito / Recepción</span>
              </div>
            </div>

            <p className="text-[10px] text-center text-slate-400 pt-2">
              Expediente crediticio institucional &bull; Válido para evaluación fiduciaria conforme a la normativa ASFI y Ley N° 393.
            </p>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            PESTAÑA 2: SCORING Y DICTAMEN DE RIESGO (CU-W23)
           ══════════════════════════════════════════════════════════════ */}
        <div className={activeTab === 'scoring' ? 'block' : 'hidden'}>
          {/* Contenido en pantalla */}
          <EvaluacionCrediticiaView
            solicitud={currentSolicitud}
            evaluacion={evaluacionActiva}
            evaluacionesHistory={evaluaciones}
            selectedEvalId={selectedEvalId}
            onSelectEval={setSelectedEvalId}
            onEvaluar={handleEvaluar}
            evaluando={evaluando}
            errorEval={errorEval}
            onResolver={() => setResolverModalOpen(true)}
            canResolve={canResolve}
            canEval={canEval}
            onPrintScoring={handlePrint}
          />

          {/* Formato imprimible oficial exclusivo para el Dictamen de Scoring */}
          {evaluacionActiva && (
            <div className="printable-active-report hidden space-y-4 text-xs font-sans text-slate-800">
              <div className="border-b border-slate-200 pb-3 text-center">
                <h2 className="font-display text-sm font-bold uppercase text-slate-900">
                  NexaCoop Core Banking &bull; Informe de Scoring Crediticio
                </h2>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Dictamen de Riesgo Algorítmico (Modelo {evaluacionActiva.version_modelo || 'reglas-v1'}) &bull; {numero}
                </p>
                <div className="mt-2 flex items-center justify-center gap-3">
                  <Badge variant={getDictamenBadgeVariant(evaluacionActiva.dictamen)}>
                    DICTAMEN: {evaluacionActiva.dictamen}
                  </Badge>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    Puntaje: {evaluacionActiva.score} / 1000 pts
                  </span>
                  <span className="font-mono text-slate-500 text-[11px]">
                    Fecha: {formatDate(evaluacionActiva.fecha)}
                  </span>
                </div>
              </div>

              {/* Datos Generales */}
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Socio Titular</span>
                  <span className="font-bold text-slate-900 block">{currentSolicitud.socio?.nombre_completo || '—'}</span>
                  <span className="font-mono text-[10px] text-slate-500">CI: {currentSolicitud.socio?.ci || '—'}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Monto y Moneda</span>
                  <span className="font-bold text-slate-900 block font-display">
                    {formatMoney(currentSolicitud.monto, sim)}
                  </span>
                  <span className="font-mono text-[10px] text-slate-500">{iso}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Plazo y Cuota</span>
                  <span className="font-bold text-slate-900 block">{currentSolicitud.plazo_meses} meses</span>
                  <span className="font-mono text-[10px] text-slate-500">
                    Cuota: {evaluacionActiva.cuota_estimada ? formatMoney(evaluacionActiva.cuota_estimada, sim) : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">RCI Motor</span>
                  <span className="font-bold text-slate-900 block font-mono">
                    {evaluacionActiva.relacion_cuota_ingreso != null ? `${Number(evaluacionActiva.relacion_cuota_ingreso).toFixed(1)}%` : '—'}
                  </span>
                  <span className="text-[10px] text-slate-500">Capacidad evaluada</span>
                </div>
              </div>

              {/* Explicación Determinística */}
              {evaluacionActiva.explicacion && (
                <div className="p-3 rounded-lg border border-slate-200 bg-white space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Fundamentación del Dictamen
                  </span>
                  <p className="text-slate-800 text-xs leading-relaxed">{evaluacionActiva.explicacion}</p>
                </div>
              )}

              {/* Knockouts si existieran */}
              {evaluacionActiva.knockouts?.length > 0 && (
                <div className="p-3 rounded-lg border border-rose-200 bg-rose-50 space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-rose-800 block">
                    Reglas de Exclusión Crítica (Knock-outs)
                  </span>
                  {evaluacionActiva.knockouts.map((ko, i) => (
                    <div key={i} className="flex justify-between items-center text-xs text-rose-900">
                      <span><strong>{ko.codigo}:</strong> {ko.descripcion}</span>
                      <Badge variant={ko.efecto === 'RECHAZADO' ? 'red' : 'amber'}>
                        {ko.efecto}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}

              {/* Desglose de Factores */}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Desglose de Factores Ponderados
                </span>
                <table className="w-full text-left border-collapse text-xs border border-slate-200">
                  <thead>
                    <tr className="bg-slate-100 text-[10px] font-bold uppercase text-slate-600">
                      <th className="p-2 border border-slate-200">Factor</th>
                      <th className="p-2 border border-slate-200">Valor Observado</th>
                      <th className="p-2 border border-slate-200 text-center">Puntos / Máx</th>
                      <th className="p-2 border border-slate-200">Motivo / Criterio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {evaluacionActiva.factores?.map((f, i) => (
                      <tr key={i} className="border-b border-slate-200">
                        <td className="p-2 border border-slate-200 font-semibold">{f.descripcion || f.codigo}</td>
                        <td className="p-2 border border-slate-200 font-mono">{f.valor}</td>
                        <td className="p-2 border border-slate-200 text-center font-bold font-mono">{f.puntos} / {f.maximo}</td>
                        <td className="p-2 border border-slate-200 text-slate-600">{f.motivo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Resolución Administrativa si existe */}
              {evaluacionActiva.resolucion && (
                <div className="p-3 rounded-lg border border-slate-300 bg-slate-50 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] uppercase font-bold text-slate-600">
                      Resolución de Revisión Manual (Administración)
                    </span>
                    <Badge variant={evaluacionActiva.resolucion.decision === 'APROBADO' ? 'green' : 'red'}>
                      {evaluacionActiva.resolucion.decision}
                    </Badge>
                  </div>
                  <p className="text-xs italic text-slate-800">&ldquo;{evaluacionActiva.resolucion.justificacion}&rdquo;</p>
                  <div className="flex justify-between text-[10px] text-slate-500 pt-1">
                    <span>Resuelto por: {evaluacionActiva.resolucion.usuario?.nombre || 'Administrador'}</span>
                    <span>Fecha: {formatDate(evaluacionActiva.resolucion.fecha)}</span>
                  </div>
                </div>
              )}

              {/* Firmas de Autorización Institucional */}
              <div className="pt-10 grid grid-cols-3 gap-6 text-center text-[10px] text-slate-500 border-t border-slate-200 mt-6">
                <div>
                  <div className="border-b border-slate-300 w-3/4 mx-auto mb-1.5" />
                  <span className="font-semibold block text-slate-800 text-xs">
                    {evaluacionActiva.usuario?.nombre || currentSolicitud.oficial?.nombre || 'Oficial de Crédito'}
                  </span>
                  <span>Oficial de Crédito / Evaluador</span>
                </div>
                <div>
                  <div className="border-b border-slate-300 w-3/4 mx-auto mb-1.5" />
                  <span className="font-semibold block text-slate-800 text-xs">
                    {evaluacionActiva.resolucion?.usuario?.nombre || 'Comité de Créditos / Administrador'}
                  </span>
                  <span>Resolución / Dictamen Administrativo</span>
                </div>
                <div>
                  <div className="border-b border-slate-300 w-3/4 mx-auto mb-1.5" />
                  <span className="font-semibold block text-slate-800 text-xs">
                    {currentSolicitud.socio?.nombre_completo || 'Socio Solicitante'}
                  </span>
                  <span>Notificación del Socio Titular</span>
                </div>
              </div>

              <p className="text-[10px] text-center text-slate-400 pt-2">
                Dictamen técnico institucional conforme a manuales de riesgo crediticio ASFI y políticas de crédito NexaCoop.
              </p>
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════════
            PESTAÑA 3: GESTIÓN DE GARANTÍAS Y AVALES (CU-W22)
           ══════════════════════════════════════════════════════════════ */}
        <div className={activeTab === 'garantias' ? 'block' : 'hidden'}>
          <GarantiasSection
            solicitud={currentSolicitud}
            onUpdated={async () => {
              try {
                const refreshed = await getSolicitudCredito(currentSolicitud.id)
                setSolicitudOverride(refreshed)
                onUpdated?.(refreshed)
              } catch {
                onUpdated?.(currentSolicitud)
              }
            }}
          />
        </div>
      </Modal>

      {/* Modal de Resolución para Administrador */}
      {resolverModalOpen && (
        <ResolverDictamenModal
          open={resolverModalOpen}
          onClose={() => setResolverModalOpen(false)}
          solicitud={currentSolicitud}
          evaluacion={evaluacionActiva}
          onSuccess={handleResolverSuccess}
        />
      )}

      {/* Modal de Plan de Pagos / Amortización (CU-W24) */}
      {planPagosModalOpen && (
        <PlanPagosModal
          open={planPagosModalOpen}
          onClose={() => setPlanPagosModalOpen(false)}
          solicitud={currentSolicitud}
        />
      )}

      {/* Modal de Desembolso (CU-W26) */}
      {desembolsoModalOpen && (
        <DesembolsoModal
          open={desembolsoModalOpen}
          onClose={() => setDesembolsoModalOpen(false)}
          solicitud={currentSolicitud}
          onSuccess={handleDesembolsoSuccess}
        />
      )}

      {/* Comprobante de Desembolso Imprimible (CU-W26) */}
      {comprobanteModalOpen && creditoDesembolsado && (
        <ComprobanteDesembolsoModal
          open={comprobanteModalOpen}
          onClose={() => setComprobanteModalOpen(false)}
          credito={creditoDesembolsado}
        />
      )}

      {/* Modal de Acta Oficial de Comité (CU-W25) */}
      {actaModalOpen && (
        <ActaComiteModal
          open={actaModalOpen}
          onClose={() => setActaModalOpen(false)}
          solicitudId={currentSolicitud.id}
        />
      )}
    </>
  )
}
