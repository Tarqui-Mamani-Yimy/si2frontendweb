import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../../../components/ui/PageHeader'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import AlertBanner from '../../../components/ui/AlertBanner'
import MetricCard from '../../../components/ui/MetricCard'
import Skeleton from '../../../components/ui/Skeleton'
import DescartarOfertaModal from '../components/recreditos/DescartarOfertaModal'
import ModeloMoraModal from '../components/recreditos/ModeloMoraModal'
import {
  listarRecreditos,
  generarRecreditos,
  aceptarRecredito,
} from '../../../core/api/creditosApi'
import { useAuthStore, selectUser } from '../../../core/store/authStore'
import { normalizeRole } from '../../../core/utils/roles'

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

function getEstadoOfertaBadge(estado) {
  switch (estado) {
    case 'VIGENTE':
      return 'green'
    case 'ACEPTADA':
      return 'indigo'
    case 'DESCARTADA':
      return 'red'
    case 'EXPIRADA':
      return 'slate'
    default:
      return 'slate'
  }
}

/**
 * RecreditosPage — Gestión de ofertas predictivas de re-crédito para socios puntuales (CU-W23 p2).
 */
export default function RecreditosPage() {
  const navigate = useNavigate()
  const user = useAuthStore(selectUser)
  const roleName = user?.rol?.nombre || ''
  const roleNorm = normalizeRole(roleName)
  const canManage =
    roleNorm === 'oficial_credito' ||
    roleNorm === 'oficial' ||
    roleNorm === 'administrador' ||
    roleNorm === 'admin' ||
    roleNorm === 'superadmin'

  const solicitudesPath =
    roleNorm === 'administrador' || roleNorm === 'admin' || roleNorm === 'superadmin'
      ? '/admin/solicitudes'
      : '/oficial/solicitudes'

  const [ofertas, setOfertas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [successBanner, setSuccessBanner] = useState(null)

  // Filtros
  const [filtroEstado, setFiltroEstado] = useState('VIGENTE')
  const [busqueda, setBusqueda] = useState('')

  // Acción Generar
  const [generando, setGenerando] = useState(false)

  // Acción Aceptar
  const [aceptandoId, setAceptandoId] = useState(null)

  // Modales
  const [ofertaADescartar, setOfertaADescartar] = useState(null)
  const [modeloMoraModalOpen, setModeloMoraModalOpen] = useState(false)

  async function loadOfertas(st = filtroEstado) {
    setLoading(true)
    setError(null)
    try {
      const params = {}
      if (st) params.estado = st
      const data = await listarRecreditos(params)
      setOfertas(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          'Error al consultar las ofertas de re-crédito.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOfertas(filtroEstado)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroEstado])

  async function handleGenerar() {
    setGenerando(true)
    setError(null)
    setSuccessBanner(null)
    try {
      const res = await generarRecreditos()
      setSuccessBanner(
        `Generación completada: ${res.generadas ?? 0} nuevas ofertas vigentes creadas (${res.omitidas ?? 0} socios analizados y omitidos por criterios normativos).`,
      )
      loadOfertas(filtroEstado)
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          'Error al generar ofertas de re-crédito automáticas.',
      )
    } finally {
      setGenerando(false)
    }
  }

  async function handleAceptar(oferta) {
    setAceptandoId(oferta.id)
    setError(null)
    setSuccessBanner(null)
    try {
      const res = await aceptarRecredito(oferta.id)
      const numSol = res.solicitud?.numero_solicitud || `#${res.solicitud?.id || 'NUEVA'}`
      setSuccessBanner(
        `¡Oferta aceptada con éxito! Se ha registrado automáticamente la solicitud ${numSol} en estado PENDIENTE con las condiciones preaprobadas.`,
      )
      loadOfertas(filtroEstado)
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          'Error al aceptar la oferta de re-crédito.',
      )
    } finally {
      setAceptandoId(null)
    }
  }

  // Filtrado en memoria por búsqueda de socio o CI
  const ofertasFiltradas = useMemo(() => {
    if (!busqueda.trim()) return ofertas
    const q = busqueda.toLowerCase().trim()
    return ofertas.filter((o) => {
      const socio = o.socio?.nombre_completo?.toLowerCase() || ''
      const ci = o.socio?.ci?.toLowerCase() || ''
      const prod = o.producto?.nombre?.toLowerCase() || ''
      return socio.includes(q) || ci.includes(q) || prod.includes(q)
    })
  }, [ofertas, busqueda])

  // Métricas del módulo
  const metrics = useMemo(() => {
    const vigentes = ofertas.filter((o) => o.estado === 'VIGENTE').length
    const aceptadas = ofertas.filter((o) => o.estado === 'ACEPTADA').length
    const totalMontoVigente = ofertas
      .filter((o) => o.estado === 'VIGENTE')
      .reduce((acc, o) => acc + Number(o.monto_sugerido || 0), 0)

    const sociosDistintos = new Set(ofertas.map((o) => o.socio?.id).filter(Boolean)).size

    return { vigentes, aceptadas, totalMontoVigente, sociosDistintos }
  }, [ofertas])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ofertas de Re-crédito Preaprobadas"
        subtitle="Generación predictiva y preaprobación proactiva para socios puntuales (CU-W23 p2)"
        action={
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => setModeloMoraModalOpen(true)}
              className="gap-1.5"
              title="Consultar la ficha técnica y variables del modelo de mora"
            >
              <span className="material-symbols-outlined text-[18px]">psychology</span>
              <span>Modelo de Mora (IA)</span>
            </Button>

            {canManage && (
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleGenerar}
                loading={generando}
                className="gap-2 bg-[#064e3b] hover:bg-[#043327] text-white shadow-sm"
                title="Escanear cartera de socios y generar ofertas automáticas"
              >
                <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                <span>Generar Ofertas</span>
              </Button>
            )}
          </div>
        }
      />

      {successBanner && (
        <AlertBanner variant="success" onClose={() => setSuccessBanner(null)}>
          {successBanner}
        </AlertBanner>
      )}

      {error && (
        <AlertBanner variant="error" onClose={() => setError(null)}>
          {error}
        </AlertBanner>
      )}

      {/* ── Métricas del Programa de Re-créditos ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Ofertas Vigentes"
          value={metrics.vigentes}
          icon="campaign"
          iconBg="bg-emerald-50"
          iconColor="text-[#064e3b]"
        />
        <MetricCard
          label="Ofertas Aceptadas"
          value={metrics.aceptadas}
          icon="task_alt"
          iconBg="bg-indigo-50"
          iconColor="text-indigo-700"
        />
        <MetricCard
          label="Monto Preaprobado Vigente"
          value={`Bs. ${metrics.totalMontoVigente.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon="savings"
          iconBg="bg-amber-50"
          iconColor="text-amber-800"
        />
        <MetricCard
          label="Socios Elegibles"
          value={metrics.sociosDistintos}
          icon="groups"
          iconBg="bg-blue-50"
          iconColor="text-blue-700"
        />
      </div>

      {/* ── Barra de Filtros y Búsqueda ── */}
      <div className="p-4 rounded-xl border border-[#e2e8f0] bg-white shadow-card flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div>
            <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">
              Estado de la Oferta
            </label>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="h-10 px-3 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#064e3b]"
            >
              <option value="VIGENTE">Solo Ofertas VIGENTES</option>
              <option value="ACEPTADA">Ofertas ACEPTADAS</option>
              <option value="DESCARTADA">Ofertas DESCARTADAS</option>
              <option value="EXPIRADA">Ofertas EXPIRADAS</option>
              <option value="">Todas las Ofertas</option>
            </select>
          </div>

          <div className="flex-1 sm:w-64">
            <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">
              Buscar Socio o CI
            </label>
            <input
              type="text"
              placeholder="Nombre o CI del socio..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full h-10 px-3 text-xs border border-slate-200 rounded-lg bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#064e3b]"
            />
          </div>
        </div>

        <Button
          type="button"
          variant="secondary"
          size="md"
          onClick={() => loadOfertas(filtroEstado)}
          disabled={loading}
          title="Actualizar listado de ofertas"
        >
          <span className="material-symbols-outlined text-[16px]">refresh</span>
          <span>Actualizar</span>
        </Button>
      </div>

      {/* ── Tabla de Ofertas de Re-crédito ── */}
      <div className="overflow-x-auto rounded-xl border border-[#e2e8f0] bg-white shadow-card">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#e2e8f0] bg-[#f8f9ff]">
              <th className="px-4 py-3.5 font-table-header text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                N° Oferta
              </th>
              <th className="px-4 py-3.5 font-table-header text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Socio Titular
              </th>
              <th className="px-4 py-3.5 font-table-header text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Crédito Origen
              </th>
              <th className="px-4 py-3.5 font-table-header text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Producto Sugerido
              </th>
              <th className="px-4 py-3.5 font-table-header text-[11px] font-semibold uppercase tracking-wider text-slate-500 text-right">
                Monto Sugerido
              </th>
              <th className="px-4 py-3.5 font-table-header text-[11px] font-semibold uppercase tracking-wider text-slate-500 text-center">
                Plazo / Tasa
              </th>
              <th className="px-4 py-3.5 font-table-header text-[11px] font-semibold uppercase tracking-wider text-slate-500 text-right">
                Cuota Estimada
              </th>
              <th className="px-4 py-3.5 font-table-header text-[11px] font-semibold uppercase tracking-wider text-slate-500 text-center">
                Mora Sintética
              </th>
              <th className="px-4 py-3.5 font-table-header text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Motivos
              </th>
              <th className="px-4 py-3.5 font-table-header text-[11px] font-semibold uppercase tracking-wider text-slate-500 text-center">
                Estado
              </th>
              <th className="px-4 py-3.5 font-table-header text-[11px] font-semibold uppercase tracking-wider text-slate-500 text-center">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e2e8f0]/80">
            {loading ? (
              <tr>
                <td colSpan={11} className="p-6">
                  <div className="space-y-3">
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-full" />
                  </div>
                </td>
              </tr>
            ) : ofertasFiltradas.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-6 py-12 text-center text-sm text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-[36px] text-slate-300">campaign</span>
                    <span className="font-semibold text-slate-600">No se encontraron ofertas de re-crédito</span>
                    <span className="text-xs text-slate-400">
                      {filtroEstado
                        ? `No hay ofertas en estado ${filtroEstado}. Puede generar nuevas ofertas automáticas con el botón superior.`
                        : 'No se registran ofertas generadas actualmente.'}
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              ofertasFiltradas.map((o) => {
                const sim = (typeof o.moneda === 'object' ? o.moneda?.simbolo : 'Bs.') || 'Bs.'
                const numCreditoOrigen = o.credito_origen?.numero_credito || `CRE-#${o.credito_origen?.id || '—'}`
                const esVigente = o.estado === 'VIGENTE'

                return (
                  <tr key={o.id} className="transition-colors hover:bg-slate-50/80">
                    {/* N° Oferta */}
                    <td className="px-4 py-3.5 font-mono font-bold text-slate-900">
                      #{o.id}
                      <span className="text-[10px] text-slate-400 font-normal block">
                        Vence: {formatDate(o.fecha_vencimiento)}
                      </span>
                    </td>

                    {/* Socio */}
                    <td className="px-4 py-3.5">
                      <span className="font-bold text-slate-900 block">
                        {o.socio?.nombre_completo || '—'}
                      </span>
                      <span className="font-mono text-[11px] text-slate-500">
                        CI: {o.socio?.ci || '—'}
                      </span>
                    </td>

                    {/* Crédito Origen */}
                    <td className="px-4 py-3.5">
                      <span className="font-mono font-bold text-slate-800 block">
                        {numCreditoOrigen}
                      </span>
                      <Badge variant={o.credito_origen?.estado === 'CANCELADO' ? 'teal' : 'green'} className="!text-[9px] !py-0 !px-1.5">
                        {o.credito_origen?.estado || 'VIGENTE'}
                      </Badge>
                    </td>

                    {/* Producto */}
                    <td className="px-4 py-3.5 font-semibold text-slate-800 max-w-[150px] truncate" title={o.producto?.nombre}>
                      {o.producto?.nombre || '—'}
                    </td>

                    {/* Monto Sugerido */}
                    <td className="px-4 py-3.5 text-right font-display font-bold text-slate-900 tabular-nums">
                      {formatMoney(o.monto_sugerido, sim)}
                    </td>

                    {/* Plazo / Tasa */}
                    <td className="px-4 py-3.5 text-center text-slate-600 font-mono text-[11px]">
                      <span>{o.plazo_meses} meses</span>
                      <span className="text-slate-400 block">{Number(o.tasa_interes ?? 0).toFixed(2)}% TNA</span>
                    </td>

                    {/* Cuota Estimada */}
                    <td className="px-4 py-3.5 text-right font-mono font-bold text-[#064e3b] tabular-nums">
                      {formatMoney(o.cuota_estimada, sim)}
                    </td>

                    {/* Mora Sintética */}
                    <td className="px-4 py-3.5 text-center">
                      {o.probabilidad_mora != null ? (
                        <div className="inline-flex flex-col items-center">
                          <span className="font-mono font-bold text-slate-800 text-[11px]">
                            {(Number(o.probabilidad_mora) * 100).toFixed(1)}%
                          </span>
                          <Badge
                            variant={
                              o.nivel_riesgo === 'ALTO'
                                ? 'red'
                                : o.nivel_riesgo === 'MEDIO'
                                ? 'amber'
                                : 'green'
                            }
                            className="!text-[8px] !py-0 !px-1 font-bold"
                          >
                            {o.nivel_riesgo || 'RIESGO'}
                          </Badge>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                    </td>

                    {/* Motivos */}
                    <td className="px-4 py-3.5 max-w-[200px]">
                      {Array.isArray(o.motivos) && o.motivos.length > 0 ? (
                        <ul className="list-disc list-inside text-[10px] text-slate-600 space-y-0.5">
                          {o.motivos.slice(0, 2).map((m, idx) => (
                            <li key={idx} className="truncate" title={m}>{m}</li>
                          ))}
                          {o.motivos.length > 2 && (
                            <li className="text-slate-400 italic">+{o.motivos.length - 2} motivos adicionales</li>
                          )}
                        </ul>
                      ) : (
                        <span className="text-slate-400 text-[10px]">—</span>
                      )}
                    </td>

                    {/* Estado */}
                    <td className="px-4 py-3.5 text-center">
                      <Badge variant={getEstadoOfertaBadge(o.estado)} className="font-bold">
                        {o.estado}
                      </Badge>
                      {o.solicitud_generada && (
                        <span className="text-[10px] text-indigo-700 font-mono block mt-1">
                          Sol: {o.solicitud_generada.numero_solicitud || `#${o.solicitud_generada.id}`}
                        </span>
                      )}
                    </td>

                    {/* Acciones */}
                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      {esVigente && canManage ? (
                        <div className="inline-flex items-center gap-1.5">
                          <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            loading={aceptandoId === o.id}
                            onClick={() => handleAceptar(o)}
                            className="gap-1 !text-xs !py-1 !px-2.5 bg-[#064e3b] hover:bg-[#043327] text-white"
                            title="Aceptar oferta y crear solicitud PENDIENTE"
                          >
                            <span className="material-symbols-outlined text-[15px]">check_circle</span>
                            <span>Aceptar</span>
                          </Button>

                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => setOfertaADescartar(o)}
                            className="gap-1 !text-xs !py-1 !px-2 text-rose-700 hover:text-rose-900 hover:bg-rose-50 border-rose-200"
                            title="Descartar con justificación"
                          >
                            <span className="material-symbols-outlined text-[15px]">cancel</span>
                            <span>Descartar</span>
                          </Button>
                        </div>
                      ) : o.solicitud_generada ? (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => navigate(solicitudesPath)}
                          className="gap-1 !text-xs !py-1 !px-2"
                          title="Ir al listado de solicitudes para revisar el expediente"
                        >
                          <span className="material-symbols-outlined text-[15px]">open_in_new</span>
                          <span>Ver Solicitud</span>
                        </Button>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Modal para Descartar Oferta ── */}
      {ofertaADescartar && (
        <DescartarOfertaModal
          open={Boolean(ofertaADescartar)}
          onClose={() => setOfertaADescartar(null)}
          oferta={ofertaADescartar}
          onDescartada={() => {
            setSuccessBanner('Oferta descartada exitosamente con el motivo registrado.')
            loadOfertas(filtroEstado)
          }}
        />
      )}

      {/* ── Modal Ficha Técnica Modelo de Mora (IA) ── */}
      {modeloMoraModalOpen && (
        <ModeloMoraModal
          open={modeloMoraModalOpen}
          onClose={() => setModeloMoraModalOpen(false)}
        />
      )}
    </div>
  )
}
