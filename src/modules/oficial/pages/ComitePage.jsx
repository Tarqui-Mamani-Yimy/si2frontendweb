import { useState, useEffect, useMemo } from 'react'
import PageHeader from '../../../components/ui/PageHeader'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import AlertBanner from '../../../components/ui/AlertBanner'
import MetricCard from '../../../components/ui/MetricCard'
import Skeleton from '../../../components/ui/Skeleton'
import ActaComiteModal from '../components/comite/ActaComiteModal'
import DetalleSolicitudModal from '../components/solicitudes/DetalleSolicitudModal'
import ExplicacionDictamenModal from '../components/recreditos/ExplicacionDictamenModal'
import { listarComite, votarComite } from '../../../core/api/creditosApi'
import { useAuthStore, selectUser } from '../../../core/store/authStore'

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

function getRiesgoBadgeVariant(nivel) {
  switch (nivel) {
    case 'BAJO':
      return 'green'
    case 'MEDIO':
      return 'amber'
    case 'ALTO':
      return 'red'
    default:
      return 'slate'
  }
}

/**
 * ComitePage — Cola de deliberación y votación colegiada del Comité de Crédito (CU-W25).
 * Accesible para Administrador, Oficial de Crédito y Contador.
 */
export default function ComitePage() {
  const user = useAuthStore(selectUser)
  const roleName = user?.rol?.nombre || ''

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  // Filtros
  const [busqueda, setBusqueda] = useState('')

  // Estado del formulario de voto por solicitud id: { [solicitudId]: { voto: 'APROBAR'|'RECHAZAR'|'OBSERVAR', comentario: '', error: null, voting: false } }
  const [voteForms, setVoteForms] = useState({})

  // Modales
  const [actaModalSolicitudId, setActaModalSolicitudId] = useState(null)
  const [detalleModalSolicitud, setDetalleModalSolicitud] = useState(null)
  const [explicacionModalEvalId, setExplicacionModalEvalId] = useState(null)

  async function reloadComite() {
    setLoading(true)
    setError(null)
    try {
      const data = await listarComite()
      setItems(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          'Error al cargar las solicitudes pendientes en el comité de créditos.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let isMounted = true
    listarComite()
      .then((data) => {
        if (!isMounted) return
        setItems(Array.isArray(data) ? data : [])
      })
      .catch((err) => {
        if (!isMounted) return
        setError(
          err.response?.data?.detail ||
            'Error al cargar las solicitudes pendientes en el comité de créditos.',
        )
      })
      .finally(() => {
        if (!isMounted) return
        setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  function handleVoteChange(solicitudId, field, value) {
    setVoteForms((prev) => ({
      ...prev,
      [solicitudId]: {
        ...(prev[solicitudId] || { voto: 'APROBAR', comentario: '' }),
        [field]: value,
        error: null,
      },
    }))
  }

  async function handleEmitirVoto(item) {
    const solicitudId = item.solicitud?.id
    if (!solicitudId) return

    const currentForm = voteForms[solicitudId] || { voto: 'APROBAR', comentario: '' }
    const voto = currentForm.voto || 'APROBAR'
    const comentario = (currentForm.comentario || '').trim()

    if (comentario.length < 10) {
      setVoteForms((prev) => ({
        ...prev,
        [solicitudId]: {
          ...currentForm,
          error: 'El comentario de fundamentación debe tener al menos 10 caracteres.',
        },
      }))
      return
    }

    setVoteForms((prev) => ({
      ...prev,
      [solicitudId]: {
        ...currentForm,
        voting: true,
        error: null,
      },
    }))

    try {
      const updatedItem = await votarComite(solicitudId, { voto, comentario })
      setSuccessMessage(
        `Voto (${voto}) registrado exitosamente para la solicitud ${item.solicitud?.numero_solicitud || `#${solicitudId}`}.`,
      )

      // Limpiar formulario de voto para esta solicitud
      setVoteForms((prev) => {
        const next = { ...prev }
        delete next[solicitudId]
        return next
      })

      // Si la solicitud ya se resolvió (quórum 3 completado), recargamos la lista
      if (updatedItem?.solicitud?.estado !== 'EN_COMITE') {
        setSuccessMessage(
          `¡Quórum completado! La solicitud ${item.solicitud?.numero_solicitud || `#${solicitudId}`} fue resuelta con dictamen: ${updatedItem?.solicitud?.resultado_comite || updatedItem?.solicitud?.estado}.`,
        )
      }

      await reloadComite()
    } catch (err) {
      const detail =
        err.response?.data?.detail || 'Error al emitir el voto en el comité.'
      setVoteForms((prev) => ({
        ...prev,
        [solicitudId]: {
          ...currentForm,
          voting: false,
          error: detail,
        },
      }))
    }
  }

  // Filtrado local
  const itemsFiltrados = useMemo(() => {
    if (!busqueda.trim()) return items
    const term = busqueda.trim().toLowerCase()
    return items.filter((it) => {
      const sol = it.solicitud
      const soc = sol?.socio
      const num = sol?.numero_solicitud?.toLowerCase() || ''
      const ci = soc?.ci_numero?.toLowerCase() || ''
      const nom = (soc?.nombre_completo || [soc?.nombres, soc?.apellidos].filter(Boolean).join(' ')).toLowerCase()
      const prod = sol?.producto?.nombre?.toLowerCase() || ''
      return num.includes(term) || ci.includes(term) || nom.includes(term) || prod.includes(term)
    })
  }, [items, busqueda])

  const totalPendientes = items.length
  const pendientesMiVoto = items.filter((it) => it.puede_votar).length
  const enEsperaOtros = totalPendientes - pendientesMiVoto

  return (
    <div className="space-y-6">
      {/* ── Encabezado de Página ── */}
      <PageHeader
        title="Comité de Crédito"
        subtitle="Deliberación colegiada, emisión de votos institucionales y emisión de actas oficiales (CU-W25)"
        actions={
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={reloadComite}
            loading={loading}
            className="gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">refresh</span>
            <span>Actualizar Cola</span>
          </Button>
        }
      />

      {/* ── Mensajes de Éxito / Error Global ── */}
      {successMessage && (
        <AlertBanner
          variant="success"
          dismissible
          onDismiss={() => setSuccessMessage(null)}
        >
          {successMessage}
        </AlertBanner>
      )}

      {error && (
        <AlertBanner variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </AlertBanner>
      )}

      {/* ── Tarjetas Métricas Superiores ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title="En Cola de Comité"
          value={loading ? '—' : totalPendientes}
          subtitle="Solicitudes derivadas a deliberación"
          icon="how_to_vote"
        />
        <MetricCard
          title="Pendientes de Mi Voto"
          value={loading ? '—' : pendientesMiVoto}
          subtitle={`Rol activo: ${roleName || 'Miembro'}`}
          icon="pending_actions"
          variant={pendientesMiVoto > 0 ? 'accent' : 'default'}
        />
        <MetricCard
          title="En Espera de Quórum"
          value={loading ? '—' : enEsperaOtros}
          subtitle="Esperando votos de otros vocales (3 requeridos)"
          icon="group"
        />
      </div>

      {/* ── Buscador ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="relative w-full sm:w-80">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-[18px]">
            search
          </span>
          <input
            type="text"
            placeholder="Buscar por socio, CI, número o producto..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#064e3b] focus:border-transparent bg-slate-50/50"
          />
        </div>
        <div className="text-xs text-slate-500">
          Mostrando <strong>{itemsFiltrados.length}</strong> de <strong>{items.length}</strong> solicitudes
        </div>
      </div>

      {/* ── Listado de Solicitudes en Cola ── */}
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-44 w-full rounded-xl" />
          <Skeleton className="h-44 w-full rounded-xl" />
        </div>
      ) : itemsFiltrados.length === 0 ? (
        <div className="p-12 text-center rounded-xl border border-dashed border-slate-300 bg-white space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-[28px]">assignment_turned_in</span>
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-slate-800 text-sm">
              No hay solicitudes pendientes en el Comité de Crédito
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              {busqueda
                ? 'Ninguna solicitud coincide con el criterio de búsqueda.'
                : 'Todas las solicitudes derivadas han sido resueltas o no superan el límite de aprobación directa.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {itemsFiltrados.map((item) => {
            const sol = item.solicitud
            const socio = sol?.socio
            const socioNombre =
              socio?.nombre_completo ||
              [socio?.nombres, socio?.apellidos].filter(Boolean).join(' ') ||
              `Socio #${socio?.id || '—'}`
            const socioCi = socio?.ci_numero
              ? `${socio.ci_numero}${socio.ci_expedido ? ` ${socio.ci_expedido}` : ''}`
              : '—'
            const evalCrediticia = item.evaluacion
            const sim =
              (typeof sol?.moneda === 'object' ? sol?.moneda?.simbolo : 'Bs.') || 'Bs.'
            const iso =
              (typeof sol?.moneda === 'object' ? sol?.moneda?.codigo_iso : 'BOB') || 'BOB'
            const numSol = sol?.numero_solicitud || `SOL-#${sol?.id}`

            const votos = Array.isArray(item.votos) ? item.votos : []
            const votosReq = item.votos_requeridos || 3
            const quorumCompletado = votos.length >= votosReq

            const currentForm = voteForms[sol?.id] || {
              voto: 'APROBAR',
              comentario: '',
              error: null,
              voting: false,
            }

            return (
              <div
                key={sol.id}
                className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden transition-all hover:border-slate-300"
              >
                {/* ── Encabezado de la Tarjeta ── */}
                <div className="bg-slate-50/80 px-5 py-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-bold text-sm text-slate-900 bg-white px-2.5 py-1 rounded border border-slate-200 shadow-xs">
                      {numSol}
                    </span>
                    <Badge variant="purple">EN_COMITE</Badge>
                    <Badge variant="slate" className="font-mono text-[10px]">
                      Ronda #{item.ronda}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="material-symbols-outlined text-[15px]">event</span>
                    <span>Ingresó: {formatDate(sol.fecha_solicitud)}</span>
                  </div>
                </div>

                {/* ── Cuerpo Principal en 2 Columnas ── */}
                <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Columna Izquierda: Información Financiera y Scoring Algorítmico (7 cols) */}
                  <div className="lg:col-span-7 space-y-4">
                    {/* Datos del Socio y Producto */}
                    <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                            Socio Solicitante
                          </span>
                          <span className="font-bold text-sm text-slate-900 block mt-0.5">
                            {socioNombre}
                          </span>
                          <span className="font-mono text-xs text-slate-600">
                            C.I. {socioCi}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                            Producto
                          </span>
                          <span className="font-bold text-xs text-slate-800 block mt-0.5">
                            {sol.producto?.nombre || 'Crédito General'}
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono">
                            {iso} ({sim})
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-200/70 text-xs">
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-semibold">Monto</span>
                          <span className="font-mono font-bold text-[#064e3b] text-sm">
                            {formatMoney(sol.monto, sim)}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-semibold">Plazo</span>
                          <span className="font-bold text-slate-800">{sol.plazo_meses} meses</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-semibold">Ingresos Declarados</span>
                          <span className="font-mono text-slate-700">
                            {formatMoney(sol.ingresos_mensuales_declarados, sim)}
                          </span>
                        </div>
                      </div>

                      {sol.destino_credito && (
                        <div className="mt-2 text-[11px] text-slate-600">
                          <span className="font-semibold text-slate-500">Destino: </span>
                          <span>{sol.destino_credito}</span>
                        </div>
                      )}
                    </div>

                    {/* Resumen del Scoring Crediticio (CU-W23) */}
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[17px] text-[#064e3b]">neurology</span>
                          <span className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                            Dictamen Técnico de Scoring
                          </span>
                        </div>

                        {evalCrediticia?.id && (
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => setExplicacionModalEvalId(evalCrediticia.id)}
                            className="!py-0.5 !px-2 !text-[11px] gap-1"
                            title="Ver explicación en lenguaje natural"
                          >
                            <span className="material-symbols-outlined text-[13px]">lightbulb</span>
                            <span>Explicación</span>
                          </Button>
                        )}
                      </div>

                      {evalCrediticia ? (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Puntaje</span>
                            <span className="font-mono font-bold text-slate-900 text-sm">
                              {evalCrediticia.score}/1000 pts
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Dictamen</span>
                            <Badge variant={getDictamenBadgeVariant(evalCrediticia.dictamen)} className="mt-0.5">
                              {evalCrediticia.dictamen}
                            </Badge>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Cuota Estimada</span>
                            <span className="font-mono font-bold text-slate-800">
                              {formatMoney(evalCrediticia.cuota_estimada, sim)}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-semibold">RCI Calculado</span>
                            <span className="font-mono font-bold text-slate-800">
                              {Number(evalCrediticia.relacion_cuota_ingreso ?? 0).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">
                          Solicitud sin informe de scoring generado.
                        </p>
                      )}

                      {/* Modelo Sintético de Mora (Informativo) */}
                      {evalCrediticia && (
                        <div className="mt-2 rounded-lg bg-indigo-50/70 border border-indigo-100 p-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-indigo-950 text-[11px]">
                                Probabilidad de Mora:
                              </span>
                              <span className="font-mono font-bold text-indigo-900">
                                {evalCrediticia.probabilidad_mora != null
                                  ? `${(Number(evalCrediticia.probabilidad_mora) * 100).toFixed(1)}%`
                                  : 'No estimada'}
                              </span>
                              {evalCrediticia.nivel_riesgo && (
                                <Badge variant={getRiesgoBadgeVariant(evalCrediticia.nivel_riesgo)} className="!text-[9px] !py-0 !px-1.5">
                                  Riesgo {evalCrediticia.nivel_riesgo}
                                </Badge>
                              )}
                            </div>
                            <span className="text-[10px] text-indigo-600 block">
                              Modelo sintético (informativo) &bull; Sugerencia no vinculante
                            </span>
                          </div>

                          <Badge variant="indigo" className="!text-[9px]">
                            Informativo
                          </Badge>
                        </div>
                      )}

                      {/* Knockouts si existieran */}
                      {Array.isArray(evalCrediticia?.knockouts) && evalCrediticia.knockouts.length > 0 && (
                        <div className="rounded-lg bg-rose-50 border border-rose-200 p-2 text-[11px] text-rose-800">
                          <span className="font-bold text-[10px] uppercase tracking-wide text-rose-700 block">
                            Factores Impeditivos (Knock-outs):
                          </span>
                          <ul className="list-disc list-inside mt-0.5 space-y-0.5">
                            {evalCrediticia.knockouts.map((ko, i) => (
                              <li key={i}>{typeof ko === 'object' ? ko.motivo || ko.descripcion || JSON.stringify(ko) : String(ko)}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Columna Derecha: Quórum, Historial de Votos y Formulario (5 cols) */}
                  <div className="lg:col-span-5 flex flex-col justify-between space-y-4 border-t lg:border-t-0 lg:border-l border-slate-200 lg:pl-6 pt-4 lg:pt-0">
                    <div>
                      {/* Estado del Quórum */}
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[17px] text-slate-700">groups</span>
                          <span className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                            Quórum de Votación
                          </span>
                        </div>
                        <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                          {votos.length} / {votosReq} votos
                        </span>
                      </div>

                      {/* Historial de Votos en esta Ronda */}
                      <div className="mt-3 space-y-2">
                        {votos.length === 0 ? (
                          <div className="p-3 rounded-lg bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-400 italic">
                            Aún no se han emitido votos en esta ronda.
                          </div>
                        ) : (
                          votos.map((v) => {
                            const uNombre = v.usuario?.nombre || `Usuario #${v.usuario?.id}`
                            const uRol = typeof v.usuario?.rol === 'object' ? v.usuario?.rol?.nombre : v.usuario?.rol || 'Miembro'
                            return (
                              <div
                                key={v.id || v.fecha}
                                className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/70 text-xs space-y-1"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-slate-800">
                                    {uNombre} <span className="font-normal text-slate-500 text-[10px]">({uRol})</span>
                                  </span>
                                  <Badge variant={getVotoBadgeVariant(v.voto)}>
                                    {v.voto}
                                  </Badge>
                                </div>
                                <p className="text-[11px] text-slate-600 italic">
                                  &ldquo;{v.comentario}&rdquo;
                                </p>
                                <span className="text-[10px] text-slate-400 font-mono block text-right">
                                  {formatDate(v.fecha)}
                                </span>
                              </div>
                            )
                          })
                        )}
                      </div>
                    </div>

                    {/* ── Formulario de Emisión de Voto ── */}
                    <div className="pt-3 border-t border-slate-200">
                      {item.puede_votar ? (
                        <div className="space-y-3">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block">
                            Emitir Mi Voto
                          </span>

                          {currentForm.error && (
                            <AlertBanner variant="error">{currentForm.error}</AlertBanner>
                          )}

                          {/* Opciones de Voto */}
                          <div className="grid grid-cols-3 gap-2">
                            <button
                              type="button"
                              onClick={() => handleVoteChange(sol.id, 'voto', 'APROBAR')}
                              className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1 ${
                                currentForm.voto === 'APROBAR'
                                  ? 'bg-[#dcfce7] text-[#15803d] border-emerald-400 ring-2 ring-emerald-500/20 shadow-xs'
                                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              <span className="material-symbols-outlined text-[15px]">check_circle</span>
                              <span>APROBAR</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleVoteChange(sol.id, 'voto', 'RECHAZAR')}
                              className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1 ${
                                currentForm.voto === 'RECHAZAR'
                                  ? 'bg-[#fee2e2] text-[#b91c1c] border-red-400 ring-2 ring-red-500/20 shadow-xs'
                                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              <span className="material-symbols-outlined text-[15px]">cancel</span>
                              <span>RECHAZAR</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleVoteChange(sol.id, 'voto', 'OBSERVAR')}
                              className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1 ${
                                currentForm.voto === 'OBSERVAR'
                                  ? 'bg-[#fef3c7] text-[#b45309] border-amber-400 ring-2 ring-amber-500/20 shadow-xs'
                                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              <span className="material-symbols-outlined text-[15px]">visibility</span>
                              <span>OBSERVAR</span>
                            </button>
                          </div>

                          {/* Justificación obligatoria */}
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <label className="text-[10px] uppercase font-bold text-slate-500">
                                Fundamentación Obligatoria
                              </label>
                              <span
                                className={`text-[10px] font-mono ${
                                  (currentForm.comentario?.trim().length || 0) >= 10
                                    ? 'text-emerald-700 font-bold'
                                    : 'text-slate-400'
                                }`}
                              >
                                {currentForm.comentario?.trim().length || 0}/10 mín.
                              </span>
                            </div>
                            <textarea
                              rows={2}
                              value={currentForm.comentario || ''}
                              onChange={(e) => handleVoteChange(sol.id, 'comentario', e.target.value)}
                              placeholder="Escriba la justificación técnica o de riesgo del voto (mínimo 10 caracteres)..."
                              className="w-full p-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#064e3b] focus:border-transparent bg-slate-50/50"
                            />
                          </div>

                          <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            onClick={() => handleEmitirVoto(item)}
                            loading={currentForm.voting}
                            className="w-full justify-center gap-1.5"
                          >
                            <span className="material-symbols-outlined text-[16px]">how_to_vote</span>
                            <span>Emitir Voto de Comité</span>
                          </Button>
                        </div>
                      ) : (
                        <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-200 text-amber-900 text-xs space-y-1">
                          <div className="flex items-center gap-1.5 font-bold text-amber-800">
                            <span className="material-symbols-outlined text-[16px]">info</span>
                            <span>Voto no habilitado</span>
                          </div>
                          <p className="text-[11px] text-amber-800 leading-relaxed">
                            {item.motivo_no_puede_votar ||
                              (quorumCompletado
                                ? 'La ronda actual ya cuenta con quórum completo.'
                                : 'No posee habilitación para emitir voto en esta solicitud.')}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── Pie de Tarjeta con Acciones ── */}
                <div className="bg-slate-50 px-5 py-2.5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setDetalleModalSolicitud(sol)}
                      className="gap-1 !text-xs !py-1 !px-2.5"
                      title="Ver expediente socioeconómico completo"
                    >
                      <span className="material-symbols-outlined text-[15px]">folder_open</span>
                      <span>Ver Expediente</span>
                    </Button>

                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setActaModalSolicitudId(sol.id)}
                      className="gap-1 !text-xs !py-1 !px-2.5 text-[#064e3b] border-emerald-300 hover:bg-emerald-50"
                      title="Ver e imprimir acta oficial de resolución colegiada"
                    >
                      <span className="material-symbols-outlined text-[15px]">receipt_long</span>
                      <span>Acta de Comité</span>
                    </Button>
                  </div>

                  <span className="text-[11px] text-slate-400">
                    Oficial: {sol.oficial?.nombre || '—'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Modal de Acta Oficial de Comité (CU-W25) ── */}
      {actaModalSolicitudId && (
        <ActaComiteModal
          open={Boolean(actaModalSolicitudId)}
          onClose={() => setActaModalSolicitudId(null)}
          solicitudId={actaModalSolicitudId}
        />
      )}

      {/* ── Modal de Detalle de Solicitud (Expediente) ── */}
      {detalleModalSolicitud && (
        <DetalleSolicitudModal
          open={Boolean(detalleModalSolicitud)}
          onClose={() => setDetalleModalSolicitud(null)}
          solicitud={detalleModalSolicitud}
          onUpdated={() => {
            reloadComite()
          }}
        />
      )}

      {/* ── Modal de Explicación en Lenguaje Natural ── */}
      {explicacionModalEvalId && (
        <ExplicacionDictamenModal
          open={Boolean(explicacionModalEvalId)}
          onClose={() => setExplicacionModalEvalId(null)}
          evaluacionId={explicacionModalEvalId}
        />
      )}
    </div>
  )
}
