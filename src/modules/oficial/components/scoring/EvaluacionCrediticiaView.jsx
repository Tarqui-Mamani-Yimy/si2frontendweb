import { useState } from 'react'
import Button from '../../../../components/ui/Button'
import Badge from '../../../../components/ui/Badge'
import AlertBanner from '../../../../components/ui/AlertBanner'
import ScoreGauge from './ScoreGauge'
import KnockoutsList from './KnockoutsList'
import FactoresTable from './FactoresTable'
import ModeloMoraModal from '../recreditos/ModeloMoraModal'
import ExplicacionDictamenModal from '../recreditos/ExplicacionDictamenModal'

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
 * EvaluacionCrediticiaView — Vista integrada de scoring crediticio, desglose de factores, historial y resolución.
 *
 * @param {{
 *   solicitud: object,
 *   evaluacion: object|null,
 *   evaluacionesHistory: Array<object>,
 *   selectedEvalId: number|string|null,
 *   onSelectEval: (id: number|string) => void,
 *   onEvaluar: () => void,
 *   evaluando: boolean,
 *   errorEval: string|null,
 *   onResolver?: () => void,
 *   canResolve?: boolean,
 *   canEval?: boolean,
 *   onPrintScoring?: () => void
 * }} props
 */
export default function EvaluacionCrediticiaView({
  solicitud,
  evaluacion,
  evaluacionesHistory = [],
  selectedEvalId,
  onSelectEval,
  onEvaluar,
  evaluando = false,
  errorEval = null,
  onResolver,
  canResolve = false,
  canEval = true,
  onPrintScoring,
}) {
  const [modeloMoraModalOpen, setModeloMoraModalOpen] = useState(false)
  const [explicacionModalOpen, setExplicacionModalOpen] = useState(false)

  const esEvaluable =
    solicitud?.estado === 'PENDIENTE' ||
    solicitud?.estado === 'OBSERVADA' ||
    solicitud?.estado === 'EN_EVALUACION'

  const tieneProducto = Boolean(solicitud?.producto)
  const sim = (typeof solicitud?.moneda === 'object' ? solicitud?.moneda?.simbolo : 'Bs.') || 'Bs.'

  return (
    <div className="space-y-4">
      {/* ── Banners de Alerta / Error ── */}
      {errorEval && (
        <AlertBanner variant="error">
          {errorEval}
        </AlertBanner>
      )}

      {/* ── Barra de Control Superior: Historial y Acciones ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/70">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-[#064e3b]">neurology</span>
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Motor de Scoring de Riesgo
            </h3>
            <span className="text-[10px] text-slate-500 font-mono">
              Modelo: {evaluacion?.version_modelo || 'reglas-v1'} &bull; Base normativa ASFI
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Selector de Historial de Evaluaciones */}
          {evaluacionesHistory.length > 1 && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-semibold text-slate-500 uppercase">Versión:</span>
              <select
                value={selectedEvalId || evaluacion?.id || ''}
                onChange={(e) => onSelectEval?.(e.target.value)}
                className="h-8 px-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#064e3b]"
              >
                {evaluacionesHistory.map((ev, idx) => (
                  <option key={ev.id} value={ev.id}>
                    #{evaluacionesHistory.length - idx} &bull; {ev.dictamen} ({ev.score} pts) — {formatDate(ev.fecha)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Botón Explicación en Lenguaje Natural (CU-W23 p2) */}
          {evaluacion && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setExplicacionModalOpen(true)}
              className="gap-1 !text-xs !py-1 !px-2.5 text-indigo-800 border-indigo-200 hover:bg-indigo-50"
              title="Ver explicación en lenguaje natural del dictamen"
            >
              <span className="material-symbols-outlined text-[15px]">record_voice_over</span>
              <span>Explicación</span>
            </Button>
          )}

          {/* Botón Imprimir Dictamen de Scoring */}
          {evaluacion && onPrintScoring && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onPrintScoring}
              className="gap-1 !text-xs !py-1 !px-2.5"
              title="Imprimir informe oficial de scoring"
            >
              <span className="material-symbols-outlined text-[15px]">print</span>
              <span>Imprimir Scoring</span>
            </Button>
          )}

          {/* Botón Evaluar / Re-evaluar */}
          {esEvaluable && canEval && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={onEvaluar}
              loading={evaluando}
              disabled={!tieneProducto || evaluando}
              className="gap-1.5 !text-xs !py-1 !px-3"
              title={
                !tieneProducto
                  ? 'La solicitud no tiene producto crediticio formal asignado'
                  : evaluacion
                  ? 'Ejecutar una nueva evaluación con las condiciones actuales'
                  : 'Ejecutar el motor de scoring algorítmico'
              }
            >
              <span className="material-symbols-outlined text-[16px]">
                {evaluacion ? 'refresh' : 'play_arrow'}
              </span>
              <span>{evaluacion ? 'Re-evaluar' : 'Evaluar Solicitud'}</span>
            </Button>
          )}
        </div>
      </div>

      {/* ── Si no hay producto asociado (Legacy) ── */}
      {!tieneProducto && (
        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-900 text-xs space-y-1">
          <div className="flex items-center gap-1.5 font-bold">
            <span className="material-symbols-outlined text-[16px]">warning</span>
            <span>Solicitud sin producto crediticio formal</span>
          </div>
          <p className="text-[11px] text-amber-800">
            Esta solicitud proviene de un registro antiguo o no cuenta con un producto parametrizado.
            Debe asignar o editar la solicitud para asociarla a un producto crediticio antes de ejecutar el scoring.
          </p>
        </div>
      )}

      {/* ── Estado Sin Evaluación ── */}
      {!evaluacion && (
        <div className="p-8 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-[#064e3b] flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-[28px]">query_stats</span>
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h4 className="font-bold text-slate-800 text-sm">
              Expediente pendiente de evaluación algorítmica
            </h4>
            <p className="text-xs text-slate-500">
              El motor evaluará automáticamente la capacidad de pago, calificación ASFI, endeudamiento,
              antigüedad laboral, cuentas de ahorro y mora interna (modelo reglas-v1).
            </p>
          </div>

          {esEvaluable && canEval && tieneProducto && (
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={onEvaluar}
              loading={evaluando}
              className="gap-2 mx-auto"
            >
              <span className="material-symbols-outlined text-[18px]">play_arrow</span>
              <span>Iniciar Evaluación de Scoring</span>
            </Button>
          )}
        </div>
      )}

      {/* ── Contenido de la Evaluación Activa ── */}
      {evaluacion && (
        <div className="space-y-4">
          {/* Fila Principal: Score Gauge y Resumen de Dictamen */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <ScoreGauge
                score={evaluacion.score}
                dictamen={evaluacion.dictamen}
              />
            </div>

            {/* Tarjeta de Dictamen y Metadatos */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between space-y-2">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                  Dictamen Automático
                </span>
                <div className="mt-1 flex items-center gap-2">
                  <Badge
                    variant={getDictamenBadgeVariant(evaluacion.dictamen)}
                    className="!text-xs !py-1 !px-3 font-bold"
                  >
                    {evaluacion.dictamen}
                  </Badge>
                </div>
              </div>

              <div className="space-y-1 pt-2 border-t border-slate-100 text-[11px] text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-400">Evaluado por:</span>
                  <span className="font-bold text-slate-800">{evaluacion.usuario?.nombre || 'Sistema'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Fecha evaluación:</span>
                  <span className="font-mono text-slate-800">{formatDate(evaluacion.fecha)}</span>
                </div>
                {evaluacion.cuota_estimada && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Cuota modelo:</span>
                    <span className="font-mono font-bold text-slate-800">
                      {sim} {Number(evaluacion.cuota_estimada).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                {evaluacion.relacion_cuota_ingreso != null && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">RCI motor:</span>
                    <span className="font-mono font-bold text-slate-800">
                      {Number(evaluacion.relacion_cuota_ingreso).toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Tarjeta de Modelo Predictivo de Mora (Sintético / Informativo - CU-W23 p2) ── */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-indigo-50 p-2 text-indigo-700 shrink-0">
                <span className="material-symbols-outlined text-xl">psychology</span>
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Probabilidad de Mora Estimada
                  </h4>
                  <Badge variant="indigo" className="!text-[9px] !py-0 !px-1.5 font-bold">
                    Modelo sintético (informativo)
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-500">
                  Estimación predictiva auxiliar calculada con modelo logístico ({evaluacion.version_modelo_mora || 'mora-logit-v1'}). No altera scores ni dictamen ASFI.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 flex-wrap">
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Probabilidad</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {evaluacion.probabilidad_mora != null
                    ? `${(Number(evaluacion.probabilidad_mora) * 100).toFixed(1)}%`
                    : 'No calculada'}
                </span>
              </div>

              {evaluacion.nivel_riesgo && (
                <div className="text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Nivel de Riesgo</span>
                  <Badge
                    variant={
                      evaluacion.nivel_riesgo === 'ALTO'
                        ? 'red'
                        : evaluacion.nivel_riesgo === 'MEDIO'
                        ? 'amber'
                        : 'green'
                    }
                    className="font-bold text-xs !py-0.5 !px-2.5"
                  >
                    {evaluacion.nivel_riesgo}
                  </Badge>
                </div>
              )}

              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setModeloMoraModalOpen(true)}
                className="gap-1 !text-xs !py-1 !px-2 text-slate-600 hover:text-slate-900"
                title="Ver ficha técnica del modelo y dataset sintético"
              >
                <span className="material-symbols-outlined text-[15px]">info</span>
                <span>Acerca del modelo</span>
              </Button>
            </div>
          </div>

          {/* Banner de Resolución Pendiente para Administrador */}
          {canResolve && evaluacion.dictamen === 'REVISION_MANUAL' && !evaluacion.resolucion && (
            <div className="p-4 rounded-xl border border-amber-300 bg-amber-50/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs uppercase tracking-wider">
                  <span className="material-symbols-outlined text-[18px]">gavel</span>
                  <span>Acción Requerida: Resolución Administrativa</span>
                </div>
                <p className="text-xs text-amber-800">
                  Esta solicitud requiere dictamen definitivo de un Administrador para ser Aprobada o Rechazada.
                </p>
              </div>

              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={onResolver}
                className="gap-1.5 shrink-0 bg-amber-600 hover:bg-amber-700 text-white border-amber-600 shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px]">how_to_reg</span>
                <span>Resolver Dictamen</span>
              </Button>
            </div>
          )}

          {/* Card de Resolución ya Emitida */}
          {evaluacion.resolucion && (
            <div className={`p-4 rounded-xl border ${
              evaluacion.resolucion.decision === 'APROBADO'
                ? 'border-emerald-200 bg-emerald-50/70'
                : 'border-rose-200 bg-rose-50/70'
            } space-y-2`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-slate-800">verified_user</span>
                  <span className="font-bold text-xs uppercase tracking-wider text-slate-900">
                    Resolución Administrativa Vinculante
                  </span>
                </div>
                <Badge variant={evaluacion.resolucion.decision === 'APROBADO' ? 'green' : 'red'}>
                  {evaluacion.resolucion.decision}
                </Badge>
              </div>

              <p className="text-xs text-slate-800 font-medium italic bg-white/70 p-2.5 rounded-lg border border-slate-200/60">
                &ldquo;{evaluacion.resolucion.justificacion}&rdquo;
              </p>

              <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-1">
                <span>
                  Resuelto por: <strong className="text-slate-800">{evaluacion.resolucion.usuario?.nombre || 'Administrador'}</strong>
                </span>
                <span className="font-mono">
                  Fecha: {formatDate(evaluacion.resolucion.fecha)}
                </span>
              </div>
            </div>
          )}

          {/* Explicación en Lenguaje Natural */}
          {evaluacion.explicacion && (
            <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-1.5">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-[#064e3b]">format_quote</span>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Explicación Determinística del Dictamen
                </h4>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed bg-slate-50/70 p-3 rounded-lg border border-slate-100">
                {evaluacion.explicacion}
              </p>
            </div>
          )}

          {/* Knock-outs si existen */}
          <KnockoutsList knockouts={evaluacion.knockouts} />

          {/* Desglose de Factores Ponderados */}
          <FactoresTable factores={evaluacion.factores} />
        </div>
      )}

      {/* ── Modal Ficha Técnica Modelo de Mora (CU-W23 p2) ── */}
      {modeloMoraModalOpen && (
        <ModeloMoraModal
          open={modeloMoraModalOpen}
          onClose={() => setModeloMoraModalOpen(false)}
        />
      )}

      {/* ── Modal Explicación en Lenguaje Natural (CU-W23 p2) ── */}
      {explicacionModalOpen && evaluacion && (
        <ExplicacionDictamenModal
          open={explicacionModalOpen}
          onClose={() => setExplicacionModalOpen(false)}
          evaluacionId={evaluacion.id}
        />
      )}
    </div>
  )
}
