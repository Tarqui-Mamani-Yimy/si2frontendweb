import { useCallback, useEffect, useState } from 'react'
import PageHeader from '../../../components/ui/PageHeader'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import AlertBanner from '../../../components/ui/AlertBanner'
import { FormField, Textarea } from '../../../components/ui/FormField'
import { getApiErrorMessage } from '../../../core/api/errors'
import {
  SERVICIOS_FEEDBACK,
  calificarServicio,
  getMisCalificaciones,
} from '../../../core/api/feedbackApi'

const CALIFICACION_LABELS = {
  1: 'Muy insatisfecho',
  2: 'Insatisfecho',
  3: 'Neutral / Regular',
  4: 'Satisfecho',
  5: 'Excelente / Muy satisfecho',
}

const SERVICE_LABELS = {
  CREDITO: 'Crédito',
  AHORRO: 'Ahorro',
  CAJA: 'Caja y Ventanilla',
  ATENCION: 'Atención al Cliente',
  APP_MOVIL: 'Banca Móvil',
  OTRO: 'Otro',
}

function formatDate(isoString) {
  if (!isoString) return ''
  try {
    const d = new Date(isoString)
    return d.toLocaleDateString('es-BO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return isoString
  }
}

export default function CalificarServicioPage() {
  const [servicio, setServicio] = useState('CREDITO')
  const [calificacion, setCalificacion] = useState(5)
  const [hoverStar, setHoverStar] = useState(null)
  const [recomendaria, setRecomendaria] = useState(null)
  const [comentario, setComentario] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(null)
  const [submitError, setSubmitError] = useState(null)

  const [ratings, setRatings] = useState([])
  const [loadingRatings, setLoadingRatings] = useState(true)
  const [ratingsError, setRatingsError] = useState(null)

  const loadRatings = useCallback(async () => {
    setLoadingRatings(true)
    setRatingsError(null)
    try {
      const data = await getMisCalificaciones()
      setRatings(Array.isArray(data) ? data : [])
    } catch (err) {
      setRatingsError(
        getApiErrorMessage(err, 'No se pudo cargar el historial de calificaciones.'),
      )
    } finally {
      setLoadingRatings(false)
    }
  }, [])

  useEffect(() => {
    loadRatings()
  }, [loadRatings])

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setSubmitSuccess(null)
    setSubmitError(null)

    try {
      await calificarServicio({
        servicio,
        calificacion,
        recomendaria: recomendaria === null ? null : Number(recomendaria),
        comentario: comentario.trim() || null,
        canal: 'WEB',
      })

      setSubmitSuccess('¡Gracias por tu opinión! Tu calificación ha sido registrada exitosamente.')
      // Reset optional fields, keep sane defaults
      setComentario('')
      setRecomendaria(null)
      loadRatings()
    } catch (err) {
      setSubmitError(
        getApiErrorMessage(err, 'Ocurrió un error al registrar la calificación.'),
      )
    } finally {
      setSubmitting(false)
    }
  }

  const activeRating = hoverStar || calificacion

  return (
    <div className="mx-auto max-w-4xl space-y-8 animate-fade-in pb-12">
      <PageHeader
        title="Calificar servicio"
        subtitle="Tu experiencia es fundamental para mejorar nuestros productos y la atención que te brindamos."
      />

      {submitSuccess && (
        <AlertBanner
          variant="success"
          dismissible
          onDismiss={() => setSubmitSuccess(null)}
        >
          {submitSuccess}
        </AlertBanner>
      )}

      {submitError && (
        <AlertBanner
          variant="error"
          dismissible
          onDismiss={() => setSubmitError(null)}
        >
          {submitError}
        </AlertBanner>
      )}

      {/* Formulario de Calificación */}
      <Card className="p-6 md:p-8 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-[#0b1c30]">
            Comparte tu experiencia
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Selecciona el servicio y cuéntanos qué tal fue tu experiencia con nosotros.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. Selección de Servicio */}
          <div className="space-y-1.5">
            <label
              htmlFor="servicio-select"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
            >
              Servicio a calificar <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {SERVICIOS_FEEDBACK.map((s) => {
                const isSelected = servicio === s.id
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setServicio(s.id)}
                    className={`flex items-center gap-2 p-3 rounded-lg border text-xs font-medium text-left transition-all ${
                      isSelected
                        ? 'border-[#006c49] bg-[#ecfdf5] text-[#064e3b] font-bold shadow-sm ring-1 ring-[#006c49]'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        isSelected ? 'bg-[#006c49]' : 'bg-slate-300'
                      }`}
                    />
                    <span className="truncate">{s.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 2. Selector de 1-5 Estrellas */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Calificación general <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => {
                const filled = star <= activeRating
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setCalificacion(star)}
                    onMouseEnter={() => setHoverStar(star)}
                    onMouseLeave={() => setHoverStar(null)}
                    className="p-1 rounded-lg transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#006c49]/30"
                    aria-label={`${star} estrellas - ${CALIFICACION_LABELS[star]}`}
                  >
                    <span
                      className={`material-symbols-outlined text-3xl md:text-4xl transition-colors ${
                        filled ? 'text-amber-400' : 'text-slate-200'
                      }`}
                      style={{ fontVariationSettings: filled ? "'FILL' 1" : "'FILL' 0" }}
                    >
                      star
                    </span>
                  </button>
                )
              })}
              <span className="ml-3 text-sm font-semibold text-slate-700">
                {CALIFICACION_LABELS[activeRating] || ''}
              </span>
            </div>
          </div>

          {/* 3. Escala NPS 0-10 (opcional) */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                ¿Recomendarías este servicio? (Opcional - NPS)
              </label>
              {recomendaria !== null && (
                <button
                  type="button"
                  onClick={() => setRecomendaria(null)}
                  className="text-[11px] text-slate-400 hover:text-slate-600 underline"
                >
                  Limpiar selección
                </button>
              )}
            </div>
            <p className="text-xs text-slate-500">
              En una escala de 0 (nada probable) a 10 (muy probable):
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                const isSelected = recomendaria === num
                // Promoters 9-10, passives 7-8, detractors 0-6
                let activeClass = 'bg-[#006c49] text-white border-[#006c49]'
                if (num <= 6) {
                  activeClass = 'bg-rose-600 text-white border-rose-600'
                } else if (num <= 8) {
                  activeClass = 'bg-amber-500 text-white border-amber-500'
                }

                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setRecomendaria(recomendaria === num ? null : num)}
                    className={`w-9 h-9 rounded-lg border text-xs font-bold transition-all ${
                      isSelected
                        ? `${activeClass} shadow-sm ring-2 ring-offset-1`
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    {num}
                  </button>
                )
              })}
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 px-1 pt-0.5">
              <span>0 = Nada probable</span>
              <span>10 = Muy probable</span>
            </div>
          </div>

          {/* 4. Comentario Opcional */}
          <FormField
            id="comentario"
            label="Comentarios u observaciones (Opcional)"
          >
            <Textarea
              id="comentario"
              rows={3}
              maxLength={1000}
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="Escribe aquí tus sugerencias o detalles adicionales sobre el servicio recibido..."
            />
            <div className="flex justify-end text-[11px] text-slate-400 mt-1">
              {comentario.length}/1000 caracteres
            </div>
          </FormField>

          {/* Botón de Envío */}
          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={submitting}
              className="gap-2 px-6"
            >
              <span className="material-symbols-outlined text-[18px]">send</span>
              <span>Enviar calificación</span>
            </Button>
          </div>
        </form>
      </Card>

      {/* Historial de Calificaciones Anteriores */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#0b1c30]">
              Mis calificaciones anteriores
            </h2>
            <p className="text-xs text-slate-500">
              Registro histórico de tus evaluaciones enviadas.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={loadRatings}
            disabled={loadingRatings}
            className="gap-1 text-xs"
          >
            <span
              className={`material-symbols-outlined text-[16px] ${
                loadingRatings ? 'animate-spin' : ''
              }`}
            >
              refresh
            </span>
            <span>Actualizar</span>
          </Button>
        </div>

        {ratingsError && (
          <AlertBanner variant="error" dismissible onDismiss={() => setRatingsError(null)}>
            {ratingsError}
          </AlertBanner>
        )}

        {loadingRatings ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            <span className="material-symbols-outlined text-2xl animate-spin mb-2 block">
              progress_activity
            </span>
            Cargando historial de calificaciones...
          </div>
        ) : ratings.length === 0 ? (
          <Card className="p-8 text-center text-slate-400">
            <span className="material-symbols-outlined text-4xl text-slate-300 mb-2 block">
              rate_review
            </span>
            <p className="text-sm font-medium text-slate-600">
              Aún no has registrado ninguna calificación
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Las opiniones que envíes se mostrarán aquí para tu control.
            </p>
          </Card>
        ) : (
          <div className="grid gap-3.5 sm:grid-cols-2">
            {ratings.map((r) => (
              <Card key={r.id} className="p-4 space-y-2.5 border-slate-200">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-800">
                        {SERVICE_LABELS[r.servicio] || r.servicio}
                      </span>
                      <Badge variant="neutral" size="sm">
                        {r.canal}
                      </Badge>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono block">
                      {formatDate(r.fecha)}
                    </span>
                  </div>

                  {/* Stars display */}
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={`material-symbols-outlined text-[17px] ${
                          star <= r.calificacion ? 'text-amber-400' : 'text-slate-200'
                        }`}
                        style={{
                          fontVariationSettings:
                            star <= r.calificacion ? "'FILL' 1" : "'FILL' 0",
                        }}
                      >
                        star
                      </span>
                    ))}
                  </div>
                </div>

                {r.recomendaria !== null && r.recomendaria !== undefined && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-600">
                    <span className="text-slate-400 font-medium">Recomendación:</span>
                    <span className="font-bold font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 text-[11px]">
                      {r.recomendaria}/10
                    </span>
                  </div>
                )}

                {r.comentario && (
                  <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 italic">
                    "{r.comentario}"
                  </p>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
