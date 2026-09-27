import { useState, useEffect } from 'react'
import Modal from '../../../../components/ui/Modal'
import Button from '../../../../components/ui/Button'
import Badge from '../../../../components/ui/Badge'
import Skeleton from '../../../../components/ui/Skeleton'
import AlertBanner from '../../../../components/ui/AlertBanner'
import { getExplicacionDictamen } from '../../../../core/api/creditosApi'

/**
 * ExplicacionDictamenModal — Explicación en lenguaje natural del dictamen crediticio (CU-W23 p2).
 *
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   evaluacionId: number|string|null
 * }} props
 */
export default function ExplicacionDictamenModal({ open, onClose, evaluacionId }) {
  const [explicacion, setExplicacion] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!open || !evaluacionId) return
    let isMounted = true

    async function loadExplicacion() {
      setLoading(true)
      setError(null)
      try {
        const data = await getExplicacionDictamen(evaluacionId)
        if (isMounted) setExplicacion(data)
      } catch (err) {
        if (isMounted) {
          setError(
            err.response?.data?.detail ||
              'Error al consultar la explicación en lenguaje natural del dictamen.',
          )
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadExplicacion()

    return () => {
      isMounted = false
    }
  }, [open, evaluacionId])

  if (!open) return null

  function handleCopy() {
    if (explicacion?.texto) {
      navigator.clipboard.writeText(explicacion.texto)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const esLlm = explicacion?.fuente === 'LLM'
  const prob = explicacion?.probabilidad_mora != null
    ? (Number(explicacion.probabilidad_mora) * 100).toFixed(1) + '%'
    : null

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Explicación del Dictamen Crediticio"
      subtitle={`Comunicación transparente para el socio &bull; Evaluación #${evaluacionId}`}
      footer={
        <div className="flex w-full items-center justify-between">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleCopy}
            disabled={!explicacion?.texto}
            className="gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">
              {copied ? 'check' : 'content_copy'}
            </span>
            <span>{copied ? 'Copiado al portapapeles' : 'Copiar Explicación'}</span>
          </Button>

          <Button type="button" variant="primary" size="sm" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      }
    >
      <div className="space-y-4 text-xs font-sans text-slate-800">
        {error && (
          <AlertBanner variant="error" onClose={() => setError(null)}>
            {error}
          </AlertBanner>
        )}

        {loading ? (
          <div className="space-y-3 p-3">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : explicacion ? (
          <>
            {/* ── Fuente de Generación y Metadatos ── */}
            <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/80 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500 font-semibold uppercase">Fuente:</span>
                <Badge variant={esLlm ? 'indigo' : 'navy'} className="font-bold text-[10px]">
                  {esLlm ? 'Modelo de Lenguaje (LLM)' : 'Plantilla Determinística'}
                </Badge>
              </div>

              {prob && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500">Mora sintética:</span>
                  <Badge
                    variant={
                      explicacion.nivel_riesgo === 'ALTO'
                        ? 'red'
                        : explicacion.nivel_riesgo === 'MEDIO'
                        ? 'amber'
                        : 'green'
                    }
                    className="font-bold text-[10px]"
                  >
                    {prob} ({explicacion.nivel_riesgo || 'RIESGO'})
                  </Badge>
                </div>
              )}
            </div>

            {/* ── Texto Explicativo en Lenguaje Natural ── */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-card space-y-2">
              <div className="flex items-center gap-1.5 text-slate-700 font-bold text-xs uppercase tracking-wider">
                <span className="material-symbols-outlined text-[18px] text-[#064e3b]">record_voice_over</span>
                <span>Fundamentación para Notificación al Socio</span>
              </div>
              <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-line bg-slate-50/60 p-3.5 rounded-lg border border-slate-100">
                {explicacion.texto}
              </p>
            </div>

            <p className="text-[11px] text-slate-400 text-center">
              Esta explicación sintetiza los factores ponderados, ratios de endeudamiento y capacidad de pago evaluados conforme a políticas de la cooperativa.
            </p>
          </>
        ) : null}
      </div>
    </Modal>
  )
}
