import { useState, useEffect } from 'react'
import Modal from '../../../../components/ui/Modal'
import Button from '../../../../components/ui/Button'
import Badge from '../../../../components/ui/Badge'
import Skeleton from '../../../../components/ui/Skeleton'
import AlertBanner from '../../../../components/ui/AlertBanner'
import { getModeloMora } from '../../../../core/api/creditosApi'

/**
 * ModeloMoraModal — Ficha técnica / Model Card del modelo de probabilidad de mora (CU-W23 p2).
 *
 * @param {{
 *   open: boolean,
 *   onClose: () => void
 * }} props
 */
export default function ModeloMoraModal({ open, onClose }) {
  const [modelCard, setModelCard] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!open) return
    let isMounted = true

    async function loadModelCard() {
      setLoading(true)
      setError(null)
      try {
        const data = await getModeloMora()
        if (isMounted) setModelCard(data)
      } catch (err) {
        if (isMounted) {
          setError(
            err.response?.data?.detail ||
              'Error al consultar la ficha técnica del modelo de morosidad.',
          )
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadModelCard()

    return () => {
      isMounted = false
    }
  }, [open])

  if (!open) return null

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Ficha Técnica &bull; Modelo de Probabilidad de Mora"
      subtitle={`Transparencia algorítmica &bull; Versión: ${modelCard?.version || 'mora-logit-v1'}`}
      footer={
        <div className="flex w-full items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Regulación ASFI &bull; Modelo auxiliar exclusivamente informativo
          </span>
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Entendido / Cerrar
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
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : modelCard ? (
          <>
            {/* ── Declaración Obligatoria de Dataset Sintético ── */}
            <div className="rounded-xl border border-amber-300 bg-amber-50/90 p-3.5 space-y-1.5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-800 text-lg">science</span>
                  <span className="font-bold text-xs uppercase tracking-wide text-amber-950">
                    Naturaleza del Modelo: {modelCard.dataset || 'SINTÉTICO'}
                  </span>
                </div>
                <Badge variant="amber" className="font-bold text-[10px]">
                  INFORMATIVO
                </Badge>
              </div>
              <p className="text-xs text-amber-900 leading-relaxed">
                {modelCard.advertencia ||
                  'Este modelo fue entrenado exclusivamente sobre un conjunto de datos sintético generado bajo reglas logísticas controladas. Es una herramienta predictiva auxiliar y NUNCA reemplaza el dictamen técnico normativo ni altera los factores de scoring ASFI.'}
              </p>
            </div>

            {/* ── Métricas y Parámetros de Entrenamiento ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
              <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Muestra (N)</span>
                <span className="font-mono font-bold text-slate-900 text-base">
                  {(modelCard.n_muestras ?? 5000).toLocaleString('es-BO')}
                </span>
                <span className="text-[10px] text-slate-400 block">registros</span>
              </div>

              <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Semilla RNG</span>
                <span className="font-mono font-bold text-slate-800 text-base">
                  {modelCard.semilla ?? 2026}
                </span>
                <span className="text-[10px] text-slate-400 block">reproducible</span>
              </div>

              <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">ROC-AUC</span>
                <span className="font-mono font-bold text-[#064e3b] text-base">
                  {modelCard.metricas?.auc != null
                    ? (Number(modelCard.metricas.auc) * 100).toFixed(1) + '%'
                    : '—'}
                </span>
                <span className="text-[10px] text-slate-400 block">holdout test</span>
              </div>

              <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Exactitud</span>
                <span className="font-mono font-bold text-slate-800 text-base">
                  {modelCard.metricas?.accuracy != null
                    ? (Number(modelCard.metricas.accuracy) * 100).toFixed(1) + '%'
                    : '—'}
                </span>
                <span className="text-[10px] text-slate-400 block">precisión global</span>
              </div>
            </div>

            {/* ── Descripción del Dataset ── */}
            {modelCard.descripcion_dataset && (
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 block tracking-wider">
                  Metodología de Generación de Datos
                </span>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {modelCard.descripcion_dataset}
                </p>
              </div>
            )}

            {/* ── Umbrales de Clasificación de Riesgo ── */}
            <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-500 block tracking-wider">
                Umbrales de Clasificación de Riesgo de Mora
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                  <Badge variant="green" className="mb-1 font-bold">RIESGO BAJO</Badge>
                  <span className="font-mono text-xs block text-emerald-900 font-bold">
                    p &lt; {modelCard.umbrales?.bajo != null ? (Number(modelCard.umbrales.bajo) * 100).toFixed(0) + '%' : '15%'}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-amber-50 border border-amber-200">
                  <Badge variant="amber" className="mb-1 font-bold">RIESGO MEDIO</Badge>
                  <span className="font-mono text-xs block text-amber-900 font-bold">
                    {modelCard.umbrales?.bajo != null ? (Number(modelCard.umbrales.bajo) * 100).toFixed(0) + '%' : '15%'} &le; p &lt; {modelCard.umbrales?.medio != null ? (Number(modelCard.umbrales.medio) * 100).toFixed(0) + '%' : '35%'}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-rose-50 border border-rose-200">
                  <Badge variant="red" className="mb-1 font-bold">RIESGO ALTO</Badge>
                  <span className="font-mono text-xs block text-rose-900 font-bold">
                    p &ge; {modelCard.umbrales?.medio != null ? (Number(modelCard.umbrales.medio) * 100).toFixed(0) + '%' : '35%'}
                  </span>
                </div>
              </div>
            </div>

            {/* ── Coeficientes de las Variables del Modelo (Features) ── */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-500 block tracking-wider">
                Variables de Entrada y Coeficientes Logísticos
              </span>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#f8f9ff] border-b border-slate-200 text-[10px] text-slate-600 uppercase font-semibold">
                      <th className="px-3.5 py-2">Variable</th>
                      <th className="px-3.5 py-2">Definición / Descripción</th>
                      <th className="px-3.5 py-2 text-right">Coeficiente</th>
                      <th className="px-3.5 py-2 text-center">Impacto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {Array.isArray(modelCard.features) &&
                      modelCard.features.map((feat, idx) => {
                        const coef = Number(feat.coeficiente ?? 0)
                        const esPositivo = coef > 0

                        return (
                          <tr key={idx} className="hover:bg-slate-50/70">
                            <td className="px-3.5 py-2 font-mono font-bold text-slate-800">
                              {feat.nombre}
                            </td>
                            <td className="px-3.5 py-2 text-slate-600 text-[11px]">
                              {feat.descripcion || '—'}
                            </td>
                            <td className="px-3.5 py-2 text-right font-mono font-bold">
                              <span className={esPositivo ? 'text-rose-700' : 'text-emerald-700'}>
                                {coef > 0 ? `+${coef.toFixed(4)}` : coef.toFixed(4)}
                              </span>
                            </td>
                            <td className="px-3.5 py-2 text-center">
                              <Badge
                                variant={esPositivo ? 'red' : 'green'}
                                className="!text-[9px] !py-0 !px-1.5"
                              >
                                {esPositivo ? 'Aumenta Mora' : 'Reduce Mora'}
                              </Badge>
                            </td>
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </Modal>
  )
}
