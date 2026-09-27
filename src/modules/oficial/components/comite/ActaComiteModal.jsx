import { useState, useEffect } from 'react'
import Modal from '../../../../components/ui/Modal'
import Button from '../../../../components/ui/Button'
import Badge from '../../../../components/ui/Badge'
import AlertBanner from '../../../../components/ui/AlertBanner'
import Skeleton from '../../../../components/ui/Skeleton'
import { getActaComite } from '../../../../core/api/creditosApi'

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

function getVotoBadgeVariant(voto) {
  switch (voto) {
    case 'APROBAR':
      return 'green'
    case 'RECHAZAR':
      return 'red'
    case 'OBSERVAR':
      return 'amber'
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

/**
 * ActaComiteModal — Acta oficial imprimible de deliberación y resolución en comité de crédito (CU-W25).
 *
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   solicitudId: number|string|null,
 *   initialActa?: object|null
 * }} props
 */
export default function ActaComiteModal({
  open,
  onClose,
  solicitudId,
  initialActa = null,
}) {
  const [fetchedActa, setFetchedActa] = useState(null)
  const [fetching, setFetching] = useState(false)
  const [error, setError] = useState(null)

  const acta = initialActa || fetchedActa
  const loading = fetching || (open && !initialActa && Boolean(solicitudId) && !fetchedActa && !error)

  useEffect(() => {
    if (!open || initialActa || !solicitudId) return

    let isMounted = true

    getActaComite(solicitudId)
      .then((data) => {
        if (!isMounted) return
        setFetchedActa(data)
        setError(null)
      })
      .catch((err) => {
        if (!isMounted) return
        setError(
          err.response?.data?.detail ||
            'No fue posible obtener el acta oficial del comité de créditos.',
        )
      })
      .finally(() => {
        if (!isMounted) return
        setFetching(false)
      })

    return () => {
      isMounted = false
    }
  }, [open, solicitudId, initialActa])

  if (!open) return null

  const solicitud = acta?.solicitud
  const socio = solicitud?.socio
  const socioNombre = socio?.nombre_completo || [socio?.nombres, socio?.apellidos].filter(Boolean).join(' ') || `Socio #${socio?.id || '—'}`
  const socioCi = socio?.ci_numero ? `${socio.ci_numero}${socio.ci_expedido ? ` ${socio.ci_expedido}` : ''}` : '—'
  const sim = (typeof solicitud?.moneda === 'object' ? solicitud?.moneda?.simbolo : 'Bs.') || 'Bs.'
  const iso = (typeof solicitud?.moneda === 'object' ? solicitud?.moneda?.codigo_iso : 'BOB') || 'BOB'
  const numeroSolicitud = solicitud?.numero_solicitud || `SOL-#${solicitud?.id || '—'}`
  const rondas = Array.isArray(acta?.rondas) ? acta.rondas : []
  const evaluacion = acta?.evaluacion
  const cooperativaNombre = acta?.cooperativa?.nombre || 'NexaCoop Core Banking'

  function handlePrint() {
    window.print()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Acta de Resolución de Comité de Crédito"
      subtitle={`Resolución colegiada &bull; Solicitud ${numeroSolicitud}`}
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
            disabled={loading || !acta}
            className="gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">print</span>
            <span>Imprimir Acta Oficial</span>
          </Button>
        </div>
      }
    >
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #acta-comite-print, #acta-comite-print * { visibility: visible !important; }
          #acta-comite-print {
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

      {loading && (
        <div className="space-y-4 p-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      )}

      {error && (
        <div className="p-4">
          <AlertBanner variant="error">{error}</AlertBanner>
        </div>
      )}

      {!loading && !error && acta && (
        <div id="acta-comite-print" className="space-y-5 text-xs font-sans text-slate-800">
          {/* ── Encabezado Institucional ── */}
          <div className="border-b border-slate-200 pb-4 text-center">
            <h2 className="font-display text-base font-bold uppercase tracking-wider text-slate-900">
              {cooperativaNombre}
            </h2>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#064e3b]">
              Comité de Crédito Institucional &bull; Acta Oficial de Resolución (CU-W25)
            </p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                {numeroSolicitud}
              </span>
              <Badge variant={getResultadoBadgeVariant(solicitud?.resultado_comite || solicitud?.estado)}>
                {solicitud?.resultado_comite || solicitud?.estado || 'EN_COMITE'}
              </Badge>
              <span className="font-mono text-slate-500 text-[11px]">
                Ronda actual: #{solicitud?.ronda_comite || rondas.length || 1}
              </span>
            </div>
          </div>

          {/* ── 1. Resumen de la Solicitud y Socio ── */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 space-y-2">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[15px] text-[#064e3b]">person</span>
              <span>1. Datos del Solicitante y Condiciones del Crédito</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Socio</span>
                <span className="font-bold text-slate-900">{socioNombre}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Cédula de Identidad</span>
                <span className="font-mono font-bold text-slate-800">{socioCi}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Producto Crediticio</span>
                <span className="font-semibold text-slate-800">
                  {solicitud?.producto?.nombre || '—'} ({solicitud?.producto?.codigo || '—'})
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Moneda</span>
                <span className="font-bold text-slate-800">{iso} ({sim})</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Monto Solicitado</span>
                <span className="font-mono font-bold text-[#064e3b] text-xs">
                  {formatMoney(solicitud?.monto, sim)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Plazo Solicitado</span>
                <span className="font-bold text-slate-800">{solicitud?.plazo_meses ?? '—'} meses</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Ingresos Declarados</span>
                <span className="font-mono text-slate-800">
                  {formatMoney(solicitud?.ingresos_mensuales_declarados, sim)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Destino del Crédito</span>
                <span className="text-slate-800 truncate" title={solicitud?.destino_credito || '—'}>
                  {solicitud?.destino_credito || '—'}
                </span>
              </div>
            </div>
          </div>

          {/* ── 2. Evaluación de Scoring y Riesgo (CU-W23) ── */}
          {evaluacion && (
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-2">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px] text-[#064e3b]">analytics</span>
                <span>2. Dictamen de Scoring Crediticio y Modelo Predictivo</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Puntaje Obtenido</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {evaluacion.score}/1000 pts
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Dictamen Motor</span>
                  <Badge variant={getResultadoBadgeVariant(evaluacion.dictamen)} className="mt-0.5">
                    {evaluacion.dictamen}
                  </Badge>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Cuota Estimada</span>
                  <span className="font-mono font-bold text-slate-800">
                    {formatMoney(evaluacion.cuota_estimada, sim)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">RCI Calculado</span>
                  <span className="font-mono font-bold text-slate-800">
                    {Number(evaluacion.relacion_cuota_ingreso ?? 0).toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Modelo de Mora Informativo */}
              <div className="mt-2 rounded-lg bg-indigo-50/60 border border-indigo-100 p-2.5 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-indigo-700">psychology</span>
                  <div>
                    <span className="font-semibold text-indigo-950 block">
                      Probabilidad de Mora Estimada:{' '}
                      <strong className="font-mono">
                        {evaluacion.probabilidad_mora != null
                          ? `${(Number(evaluacion.probabilidad_mora) * 100).toFixed(1)}%`
                          : 'No estimada'}
                      </strong>
                      {evaluacion.nivel_riesgo && (
                        <span className="ml-2 font-normal text-indigo-800">
                          (Riesgo: <strong>{evaluacion.nivel_riesgo}</strong>)
                        </span>
                      )}
                    </span>
                    <span className="text-[10px] text-indigo-600">
                      Modelo sintético (informativo) &bull; No constituye causal vinculante de rechazo
                    </span>
                  </div>
                </div>
                <Badge variant="indigo" className="!text-[9px]">
                  Informativo
                </Badge>
              </div>

              {/* Knockouts si existen */}
              {Array.isArray(evaluacion.knockouts) && evaluacion.knockouts.length > 0 && (
                <div className="rounded-lg bg-rose-50 border border-rose-200 p-2.5 text-[11px] text-rose-900">
                  <span className="font-bold block uppercase text-[10px] tracking-wider text-rose-700">
                    Factores Impeditivos Detectados (Knock-outs):
                  </span>
                  <ul className="list-disc list-inside mt-1 space-y-0.5 text-[11px]">
                    {evaluacion.knockouts.map((k, i) => (
                      <li key={i}>{typeof k === 'object' ? k.motivo || k.descripcion || JSON.stringify(k) : String(k)}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* ── 3. Historial de Rondas de Deliberación y Votación ── */}
          <div className="space-y-3">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[15px] text-[#064e3b]">how_to_vote</span>
              <span>3. Deliberación y Votación Colegiada por Ronda</span>
            </h3>

            {rondas.length === 0 ? (
              <p className="text-slate-400 italic text-center py-4">
                No se registran rondas de votación completadas para esta solicitud.
              </p>
            ) : (
              rondas.map((rondaItem, idx) => {
                const votos = Array.isArray(rondaItem.votos) ? rondaItem.votos : []
                const numRonda = rondaItem.ronda || idx + 1
                return (
                  <div
                    key={numRonda}
                    className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-2 shadow-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-900 text-white font-bold text-[10px]">
                          {numRonda}
                        </span>
                        <span className="font-bold text-xs text-slate-900">
                          Ronda #{numRonda} de Comité
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500">
                          Resolución:
                        </span>
                        <Badge variant={getResultadoBadgeVariant(rondaItem.resultado)}>
                          {rondaItem.resultado || 'EN CURSO'}
                        </Badge>
                        {rondaItem.fecha_resolucion && (
                          <span className="font-mono text-[10px] text-slate-400">
                            {formatDate(rondaItem.fecha_resolucion)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Tabla de Votos */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 text-[10px] uppercase font-bold text-slate-400 bg-slate-50/50">
                            <th className="py-1.5 px-2">Miembro del Comité</th>
                            <th className="py-1.5 px-2">Rol Institucional</th>
                            <th className="py-1.5 px-2 text-center">Voto</th>
                            <th className="py-1.5 px-2">Fecha y Hora</th>
                            <th className="py-1.5 px-2">Fundamentación / Comentario</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-[11px]">
                          {votos.map((v) => {
                            const miembroNombre = v.usuario?.nombre || `Usuario #${v.usuario?.id || '—'}`
                            const miembroRol = typeof v.usuario?.rol === 'object' ? v.usuario?.rol?.nombre : v.usuario?.rol || 'Miembro'
                            return (
                              <tr key={v.id || v.fecha} className="hover:bg-slate-50/60">
                                <td className="py-2 px-2 font-bold text-slate-900">
                                  {miembroNombre}
                                </td>
                                <td className="py-2 px-2 text-slate-600">
                                  {miembroRol}
                                </td>
                                <td className="py-2 px-2 text-center">
                                  <Badge variant={getVotoBadgeVariant(v.voto)}>
                                    {v.voto}
                                  </Badge>
                                </td>
                                <td className="py-2 px-2 font-mono text-[10px] text-slate-500 whitespace-nowrap">
                                  {formatDate(v.fecha)}
                                </td>
                                <td className="py-2 px-2 text-slate-700 italic max-w-xs">
                                  &ldquo;{v.comentario}&rdquo;
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* ── 4. Conclusión / Resolución Final del Comité ── */}
          <div className="rounded-xl border border-slate-300 bg-slate-50 p-4 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-800">
                Dictamen Resolutivo Colegiado
              </span>
              <Badge
                variant={getResultadoBadgeVariant(solicitud?.resultado_comite || solicitud?.estado)}
                className="!text-xs !py-1 !px-3 font-bold"
              >
                {solicitud?.resultado_comite || solicitud?.estado || 'EN RESOLUCIÓN'}
              </Badge>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              El Comité de Crédito de {cooperativaNombre}, en cumplimiento del estatuto orgánico y la normativa de solvencia crediticia, deja constancia fehaciente de la decisión adoptada precedentemente por sus integrantes con quórum estatutario verificado.
            </p>
          </div>

          {/* ── 5. Firmas Institucionales ── */}
          <div className="pt-8 space-y-4">
            <h4 className="text-[10px] uppercase font-bold text-center text-slate-400 tracking-wider">
              Firmas de Conformidad del Comité de Crédito
            </h4>
            <div className="grid grid-cols-3 gap-6 text-center text-[10px] text-slate-600 pt-6">
              <div className="flex flex-col items-center">
                <div className="w-full border-t border-slate-400 pt-1.5 mb-1" />
                <span className="font-bold text-slate-800 block text-[11px]">Administración General</span>
                <span className="text-slate-500">Presidencia del Comité</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-full border-t border-slate-400 pt-1.5 mb-1" />
                <span className="font-bold text-slate-800 block text-[11px]">Oficialía de Crédito</span>
                <span className="text-slate-500">Vocal Titular</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-full border-t border-slate-400 pt-1.5 mb-1" />
                <span className="font-bold text-slate-800 block text-[11px]">Contabilidad / Control</span>
                <span className="text-slate-500">Vocal Titular</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}
