import { useCallback, useEffect, useState } from 'react'
import PageHeader from '../../../components/ui/PageHeader'
import Card from '../../../components/ui/Card'
import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import AlertBanner from '../../../components/ui/AlertBanner'
import Modal from '../../../components/ui/Modal'
import Skeleton from '../../../components/ui/Skeleton'
import { FormField, Textarea } from '../../../components/ui/FormField'
import {
  getMisReclamos,
  registrarConformidad,
  ESTADOS_RECLAMO,
  TIPOS_RECLAMO,
} from '../../../core/api/reclamosApi'
import { getApiErrorMessage } from '../../../core/api/errors'

function formatDate(isoString) {
  if (!isoString) return '—'
  try {
    const d = new Date(isoString)
    if (isNaN(d.getTime())) return String(isoString)
    return d.toLocaleDateString('es-BO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return String(isoString)
  }
}

function getTipoLabel(tipo) {
  const item = TIPOS_RECLAMO.find((t) => t.value === tipo)
  return item ? item.label : tipo || 'Otro'
}

function getEstadoBadge(estado) {
  const item = ESTADOS_RECLAMO.find((e) => e.value === estado)
  return item ? { label: item.label, color: item.color } : { label: estado, color: 'slate' }
}

export default function MisReclamosPage() {
  const [reclamos, setReclamos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [successBanner, setSuccessBanner] = useState(null)

  // Escalar modal
  const [escalarModalOpen, setEscalarModalOpen] = useState(false)
  const [selectedReclamo, setSelectedReclamo] = useState(null)
  const [motivoDisconformidad, setMotivoDisconformidad] = useState('')
  const [modalError, setModalError] = useState(null)
  const [submittingEscalar, setSubmittingEscalar] = useState(false)

  // Conformidad modal
  const [conformidadModalOpen, setConformidadModalOpen] = useState(false)
  const [reclamoAConformar, setReclamoAConformar] = useState(null)
  const [submittingConformidad, setSubmittingConformidad] = useState(false)

  const loadReclamos = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getMisReclamos()
      setReclamos(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          'No se pudieron cargar tus reclamos registrados.',
        ),
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadReclamos()
  }, [loadReclamos])

  function handleAbrirEscalar(r) {
    setSelectedReclamo(r)
    setMotivoDisconformidad('')
    setModalError(null)
    setEscalarModalOpen(true)
  }

  function handleAbrirConformidad(r) {
    setReclamoAConformar(r)
    setModalError(null)
    setConformidadModalOpen(true)
  }

  async function handleConfirmarConformidad() {
    if (!reclamoAConformar) return
    setSubmittingConformidad(true)
    setError(null)
    try {
      await registrarConformidad(reclamoAConformar.id, { conforme: true })
      setConformidadModalOpen(false)
      setReclamoAConformar(null)
      setSuccessBanner(
        `Se ha registrado tu conformidad con la respuesta del reclamo ${reclamoAConformar.numero_reclamo}. El caso queda cerrado.`,
      )
      loadReclamos()
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          'No se pudo registrar la conformidad del reclamo.',
        ),
      )
    } finally {
      setSubmittingConformidad(false)
    }
  }

  async function handleEnviarEscalamiento(e) {
    e.preventDefault()
    if (!selectedReclamo) return
    const motivoLimpio = motivoDisconformidad.trim()
    if (!motivoLimpio) {
      setModalError('Debes ingresar el motivo de disconformidad.')
      return
    }

    setSubmittingEscalar(true)
    setModalError(null)
    try {
      await registrarConformidad(selectedReclamo.id, {
        conforme: false,
        motivo: motivoLimpio,
      })
      setEscalarModalOpen(false)
      setSelectedReclamo(null)
      setSuccessBanner(
        `El reclamo ${selectedReclamo.numero_reclamo} ha sido escalado exitosamente ante la ASFI.`,
      )
      loadReclamos()
    } catch (err) {
      setModalError(
        getApiErrorMessage(
          err,
          'Error al escalar el reclamo a ASFI.',
        ),
      )
    } finally {
      setSubmittingEscalar(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-fade-in pb-12">
      <PageHeader
        title="Mis Reclamos"
        subtitle="Consulta el estado de tus reclamos presentados, respuestas institucionales y ejerce tu derecho a la conformidad o escalamiento ante ASFI."
      />

      {successBanner && (
        <AlertBanner
          variant="success"
          dismissible
          onDismiss={() => setSuccessBanner(null)}
        >
          {successBanner}
        </AlertBanner>
      )}

      {error && (
        <AlertBanner variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </AlertBanner>
      )}

      {loading ? (
        <Card className="p-6 space-y-4">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </Card>
      ) : reclamos.length === 0 ? (
        <Card className="p-8 text-center text-slate-400">
          <span className="material-symbols-outlined text-4xl text-slate-300 mb-2 block">
            assignment_turned_in
          </span>
          <p className="text-sm font-medium text-slate-600">
            No tienes reclamos registrados
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Si presentas un reclamo en ventanilla o por nuestros canales oficiales, podrás consultar aquí su seguimiento y dictamen.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {reclamos.map((r) => {
            const badge = getEstadoBadge(r.estado)
            const canConforme = r.estado === 'RESPONDIDO'
            const canEscalar =
              r.estado === 'RESPONDIDO' ||
              (r.vencido && r.estado !== 'CERRADO' && r.estado !== 'ESCALADO_ASFI')

            return (
              <Card key={r.id} className="p-5 sm:p-6 space-y-4 border-slate-200">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-base text-slate-900">
                        {r.numero_reclamo}
                      </span>
                      <Badge variant={badge.color}>{badge.label}</Badge>
                      {r.vencido && (
                        <Badge variant="red" className="font-bold">
                          Plazo Vencido
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-slate-500 mt-0.5 block">
                      Tipo: <span className="font-semibold text-slate-700">{getTipoLabel(r.tipo)}</span>
                    </span>
                  </div>

                  <div className="text-right text-xs text-slate-500 font-mono space-y-0.5">
                    <div>
                      <span className="text-slate-400">Registro:</span> {formatDate(r.fecha_registro)}
                    </div>
                    <div>
                      <span className="text-slate-400">Límite:</span> {formatDate(r.fecha_limite_respuesta)}
                    </div>
                  </div>
                </div>

                {/* Descripción del reclamo */}
                <div className="space-y-1 text-xs">
                  <span className="font-semibold uppercase tracking-wider text-slate-400 text-[10px] block">
                    Descripción del Reclamo
                  </span>
                  <p className="text-slate-700 whitespace-pre-wrap leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                    {r.descripcion}
                  </p>
                </div>

                {/* Respuesta Institucional */}
                {r.respuesta && (
                  <div className="space-y-1.5 text-xs bg-emerald-50/50 p-3.5 rounded-lg border border-emerald-100">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px]">reply</span>
                        Respuesta de la Cooperativa
                      </span>
                      <div className="flex items-center gap-2">
                        {r.procedente !== null && r.procedente !== undefined && (
                          <Badge variant={r.procedente ? 'green' : 'amber'}>
                            {r.procedente ? 'Procedente' : 'No procedente'}
                          </Badge>
                        )}
                        <span className="font-mono text-slate-400 text-[11px]">
                          {formatDate(r.fecha_respuesta)}
                        </span>
                      </div>
                    </div>
                    <p className="text-slate-800 whitespace-pre-wrap leading-relaxed mt-1">
                      {r.respuesta}
                    </p>
                  </div>
                )}

                {/* Info de Disconformidad / Escalamiento si ya ocurrió */}
                {r.motivo_disconformidad && (
                  <div className="space-y-1 text-xs bg-rose-50/50 p-3 rounded-lg border border-rose-100">
                    <span className="font-bold text-rose-900 block">
                      Motivo de Escalamiento / Disconformidad (ASFI):
                    </span>
                    <p className="text-slate-700 italic">
                      "{r.motivo_disconformidad}"
                    </p>
                  </div>
                )}

                {/* Botones de acción */}
                {(canConforme || canEscalar) && (
                  <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    {canEscalar && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => handleAbrirEscalar(r)}
                        className="gap-1 text-xs text-rose-700 hover:text-rose-900 hover:bg-rose-50 border-rose-200"
                      >
                        <span className="material-symbols-outlined text-[16px]">gavel</span>
                        <span>Escalar a ASFI</span>
                      </Button>
                    )}

                    {canConforme && (
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={() => handleAbrirConformidad(r)}
                        className="gap-1 text-xs bg-[#006c49] hover:bg-[#005a3c]"
                      >
                        <span className="material-symbols-outlined text-[16px]">check_circle</span>
                        <span>Dar conformidad</span>
                      </Button>
                    )}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* ── Modal: Dar Conformidad ── */}
      {conformidadModalOpen && (
        <Modal
          open={conformidadModalOpen}
          onClose={() => setConformidadModalOpen(false)}
          title={`Conformidad de Reclamo — ${reclamoAConformar?.numero_reclamo || ''}`}
          subtitle="Aceptación formal de la respuesta emitida por la cooperativa."
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setConformidadModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                loading={submittingConformidad}
                onClick={handleConfirmarConformidad}
                className="bg-[#006c49] hover:bg-[#005a3c]"
              >
                Confirmar Conformidad
              </Button>
            </div>
          }
        >
          <div className="space-y-3 text-xs text-slate-600">
            <p>
              ¿Declaras tu plena conformidad con la respuesta proporcionada por la cooperativa al reclamo{' '}
              <strong className="text-slate-900">{reclamoAConformar?.numero_reclamo}</strong>?
            </p>
            <p className="text-slate-400 italic">
              Al confirmar, el reclamo se marcará como CERRADO con resolución definitiva.
            </p>
          </div>
        </Modal>
      )}

      {/* ── Modal: Escalar a ASFI ── */}
      {escalarModalOpen && (
        <Modal
          open={escalarModalOpen}
          onClose={() => setEscalarModalOpen(false)}
          title={`Escalar a ASFI — ${selectedReclamo?.numero_reclamo || ''}`}
          subtitle="Formulario de manifestación de disconformidad ante la Autoridad de Supervisión del Sistema Financiero."
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setEscalarModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                loading={submittingEscalar}
                onClick={handleEnviarEscalamiento}
                className="bg-rose-600 hover:bg-rose-700 text-white"
              >
                Remitir a ASFI
              </Button>
            </div>
          }
        >
          <form onSubmit={handleEnviarEscalamiento} className="space-y-4 text-xs">
            {modalError && (
              <AlertBanner variant="error" dismissible onDismiss={() => setModalError(null)}>
                {modalError}
              </AlertBanner>
            )}

            <p className="text-slate-600">
              Conforme a la Ley 393 de Servicios Financieros, puedes remitir tu reclamo ante la ASFI si no estás de acuerdo con la respuesta recibida o si el plazo normativo de respuesta venció sin atención.
            </p>

            <FormField
              label="Motivo de la Disconformidad"
              required
              helper="Describe claramente por qué rechazas la respuesta o los motivos de tu queja ante la ASFI."
            >
              <Textarea
                rows={4}
                value={motivoDisconformidad}
                onChange={(e) => setMotivoDisconformidad(e.target.value)}
                placeholder="Escribe aquí los fundamentos de tu disconformidad..."
                required
              />
            </FormField>
          </form>
        </Modal>
      )}
    </div>
  )
}
