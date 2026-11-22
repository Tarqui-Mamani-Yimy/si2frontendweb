import { useCallback, useEffect, useState, useMemo, useRef } from 'react'
import PageHeader from '../../../components/ui/PageHeader'
import MetricCard from '../../../components/ui/MetricCard'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import AlertBanner from '../../../components/ui/AlertBanner'
import Modal from '../../../components/ui/Modal'
import Skeleton from '../../../components/ui/Skeleton'
import { FormField, Input, Textarea } from '../../../components/ui/FormField'
import { getApiErrorMessage } from '../../../core/api/errors'
import { buscarSociosCredito } from '../../../core/api/creditosApi'
import {
  listReclamos,
  getReclamo,
  crearReclamo,
  atenderReclamo,
  responderReclamo,
  TIPOS_RECLAMO,
  ESTADOS_RECLAMO,
} from '../../../core/api/reclamosApi'

function formatDate(dateStr) {
  if (!dateStr) return '—'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return String(dateStr)
    return d.toLocaleDateString('es-BO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return String(dateStr)
  }
}

function formatDateTime(isoStr) {
  if (!isoStr) return '—'
  try {
    const d = new Date(isoStr)
    if (isNaN(d.getTime())) return String(isoStr)
    return d.toLocaleString('es-BO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return String(isoStr)
  }
}

function getEstadoBadge(estado) {
  switch (estado) {
    case 'REGISTRADO':
      return <Badge variant="navy">Registrado</Badge>
    case 'EN_ATENCION':
      return <Badge variant="amber">En Atención</Badge>
    case 'RESPONDIDO':
      return <Badge variant="teal">Respondido</Badge>
    case 'CERRADO':
      return <Badge variant="green">Cerrado</Badge>
    case 'ESCALADO_ASFI':
      return <Badge variant="red">Escalado ASFI</Badge>
    default:
      return <Badge variant="slate">{estado}</Badge>
  }
}

function getTipoLabel(tipo) {
  const found = TIPOS_RECLAMO.find((t) => t.value === tipo)
  return found ? found.label : tipo
}

export default function ReclamosPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  // Filtros
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroVencido, setFiltroVencido] = useState('')
  const [busqueda, setBusqueda] = useState('')

  // Modales
  const [nuevoModalOpen, setNuevoModalOpen] = useState(false)
  const [detalleModalOpen, setDetalleModalOpen] = useState(false)
  const [responderModalOpen, setResponderModalOpen] = useState(false)

  // Reclamo seleccionado para detalle o respuesta
  const [selectedReclamo, setSelectedReclamo] = useState(null)
  const [loadingDetalle, setLoadingDetalle] = useState(false)

  // Estado para registro de reclamo en ventanilla
  const [busquedaSocio, setBusquedaSocio] = useState('')
  const [sociosEncontrados, setSociosEncontrados] = useState([])
  const [buscandoSocio, setBuscandoSocio] = useState(false)
  const [socioSeleccionado, setSocioSeleccionado] = useState(null)
  const [nuevoTipo, setNuevoTipo] = useState('CREDITO')
  const [nuevoCreditoId, setNuevoCreditoId] = useState('')
  const [nuevaDescripcion, setNuevaDescripcion] = useState('')
  const [guardandoReclamo, setGuardandoReclamo] = useState(false)
  const [formErrors, setFormErrors] = useState({})

  // Estado para responder reclamo
  const [respuestaTexto, setRespuestaTexto] = useState('')
  const [respuestaProcedente, setRespuestaProcedente] = useState(true)
  const [respondiendo, setRespondiendo] = useState(false)
  const [atendiendoId, setAtendiendoId] = useState(null)

  const debounceSocioRef = useRef(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = {}
      if (filtroEstado) params.estado = filtroEstado
      if (filtroVencido !== '') params.vencido = filtroVencido === 'true'
      const data = await listReclamos(params)
      setItems(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo cargar la lista de reclamos.'))
    } finally {
      setLoading(false)
    }
  }, [filtroEstado, filtroVencido])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Filtrado local por término de búsqueda (socio o número)
  const itemsFiltrados = useMemo(() => {
    if (!busqueda.trim()) return items
    const term = busqueda.trim().toLowerCase()
    return items.filter((r) => {
      const num = r.numero_reclamo?.toLowerCase() ?? ''
      const socioNom = (r.socio || r.socio_nombre || '')?.toLowerCase()
      const desc = r.descripcion?.toLowerCase() ?? ''
      return num.includes(term) || socioNom.includes(term) || desc.includes(term)
    })
  }, [items, busqueda])

  // Métricas calculadas
  const metrics = useMemo(() => {
    const total = items.length
    const pendientes = items.filter(
      (r) => r.estado === 'REGISTRADO' || r.estado === 'EN_ATENCION',
    ).length
    const vencidos = items.filter((r) => Boolean(r.vencido)).length
    const escalados = items.filter((r) => r.estado === 'ESCALADO_ASFI').length
    const respondidos = items.filter(
      (r) => r.estado === 'RESPONDIDO' || r.estado === 'CERRADO',
    ).length
    return { total, pendientes, vencidos, escalados, respondidos }
  }, [items])

  // Búsqueda de socios debounced
  function handleBuscarSocioChange(text) {
    setBusquedaSocio(text)
    if (debounceSocioRef.current) clearTimeout(debounceSocioRef.current)
    const trimmed = text.trim()
    if (trimmed.length < 3) {
      setSociosEncontrados([])
      return
    }
    debounceSocioRef.current = setTimeout(async () => {
      setBuscandoSocio(true)
      try {
        const res = await buscarSociosCredito(trimmed)
        setSociosEncontrados(Array.isArray(res) ? res : [])
      } catch {
        setSociosEncontrados([])
      } finally {
        setBuscandoSocio(false)
      }
    }, 350)
  }

  function handleOpenNuevo() {
    setSocioSeleccionado(null)
    setBusquedaSocio('')
    setSociosEncontrados([])
    setNuevoTipo('CREDITO')
    setNuevoCreditoId('')
    setNuevaDescripcion('')
    setFormErrors({})
    setNuevoModalOpen(true)
  }

  async function handleCrearReclamoSubmit(e) {
    e.preventDefault()
    const errs = {}
    if (!socioSeleccionado) {
      errs.socio = 'Debe buscar y seleccionar al socio reclamante.'
    }
    if (!nuevaDescripcion.trim()) {
      errs.descripcion = 'Debe ingresar la descripción detallada del reclamo.'
    } else if (nuevaDescripcion.trim().length > 2000) {
      errs.descripcion = 'La descripción no puede exceder 2000 caracteres.'
    }

    if (Object.keys(errs).length > 0) {
      setFormErrors(errs)
      return
    }

    setGuardandoReclamo(true)
    setError(null)
    try {
      const payload = {
        socio_id: socioSeleccionado.id,
        tipo: nuevoTipo,
        descripcion: nuevaDescripcion.trim(),
        credito_id: nuevoCreditoId ? Number(nuevoCreditoId) : undefined,
      }
      const nuevo = await crearReclamo(payload)
      setSuccessMessage(
        `Reclamo ${nuevo.numero_reclamo || ''} registrado exitosamente por Ventanilla (Plazo ASFI: 5 días hábiles).`,
      )
      setNuevoModalOpen(false)
      loadData()
    } catch (err) {
      setError(getApiErrorMessage(err, 'Error al registrar el reclamo.'))
    } finally {
      setGuardandoReclamo(false)
    }
  }

  async function handleVerDetalle(id) {
    setLoadingDetalle(true)
    setSelectedReclamo(null)
    setDetalleModalOpen(true)
    try {
      const data = await getReclamo(id)
      setSelectedReclamo(data)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Error al cargar el detalle del reclamo.'))
      setDetalleModalOpen(false)
    } finally {
      setLoadingDetalle(false)
    }
  }

  async function handleAtender(id) {
    setAtendiendoId(id)
    setError(null)
    try {
      await atenderReclamo(id)
      setSuccessMessage('Reclamo pasado al estado EN ATENCIÓN.')
      loadData()
      if (selectedReclamo?.id === id) {
        const updated = await getReclamo(id)
        setSelectedReclamo(updated)
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Error al atender el reclamo.'))
    } finally {
      setAtendiendoId(null)
    }
  }

  function handleOpenResponder(reclamo) {
    setSelectedReclamo(reclamo)
    setRespuestaTexto('')
    setRespuestaProcedente(true)
    setResponderModalOpen(true)
  }

  async function handleResponderSubmit(e) {
    e.preventDefault()
    if (!respuestaTexto.trim()) {
      setError('Debe redactar la fundamentación de la respuesta oficial.')
      return
    }

    setRespondiendo(true)
    setError(null)
    try {
      await responderReclamo(selectedReclamo.id, {
        respuesta: respuestaTexto.trim(),
        procedente: Boolean(respuestaProcedente),
      })
      setSuccessMessage(
        `Respuesta emitida formalmente al reclamo ${selectedReclamo.numero_reclamo || ''}.`,
      )
      setResponderModalOpen(false)
      loadData()
      if (detalleModalOpen) {
        const updated = await getReclamo(selectedReclamo.id)
        setSelectedReclamo(updated)
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Error al emitir respuesta al reclamo.'))
    } finally {
      setRespondiendo(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Punto de Reclamo — Ley 393"
        subtitle="Gestión regulatoria de apelaciones y reclamos de socios con plazo perentorio de 5 días hábiles y segunda instancia ASFI"
      >
        <Button
          type="button"
          variant="primary"
          size="md"
          onClick={handleOpenNuevo}
          className="gap-1.5"
        >
          <span className="material-symbols-outlined text-[18px]">add_circle</span>
          <span>Registrar Reclamo en Ventanilla</span>
        </Button>
      </PageHeader>

      {error && (
        <AlertBanner variant="error" onClose={() => setError(null)}>
          {error}
        </AlertBanner>
      )}

      {successMessage && (
        <AlertBanner variant="success" onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </AlertBanner>
      )}

      {/* Métricas ASFI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <MetricCard
          label="Total Reclamos"
          value={metrics.total}
          icon="contact_support"
          iconBg="bg-blue-50"
          iconColor="text-blue-700"
        />
        <MetricCard
          label="En Atención / Reg."
          value={metrics.pendientes}
          icon="pending_actions"
          iconBg="bg-amber-50"
          iconColor="text-amber-800"
        />
        <MetricCard
          label="Vencidos (> 5 días)"
          value={metrics.vencidos}
          icon="timer_off"
          iconBg={metrics.vencidos > 0 ? 'bg-rose-50' : 'bg-slate-50'}
          iconColor={metrics.vencidos > 0 ? 'text-rose-700' : 'text-slate-400'}
        />
        <MetricCard
          label="Escalados a ASFI"
          value={metrics.escalados}
          icon="gavel"
          iconBg="bg-purple-50"
          iconColor="text-purple-800"
        />
        <MetricCard
          label="Respondidos / Cerrados"
          value={metrics.respondidos}
          icon="task_alt"
          iconBg="bg-emerald-50"
          iconColor="text-emerald-700"
        />
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="p-4 rounded-xl border border-[#e2e8f0] bg-white shadow-card flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="h-10 px-3 text-xs border border-slate-200 rounded-lg bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#064e3b]"
            >
              <option value="">Todos los estados</option>
              {ESTADOS_RECLAMO.map((st) => (
                <option key={st.value} value={st.value}>
                  {st.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={filtroVencido}
              onChange={(e) => setFiltroVencido(e.target.value)}
              className="h-10 px-3 text-xs border border-slate-200 rounded-lg bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#064e3b]"
            >
              <option value="">Plazo legal: Todos</option>
              <option value="true">Solo Vencidos (&gt; 5 días)</option>
              <option value="false">Dentro de plazo</option>
            </select>
          </div>

          <div className="relative flex-1 sm:w-64">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-[18px]">
              search
            </span>
            <input
              type="text"
              placeholder="Buscar PR-*, socio o descripción..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full h-10 pl-9 pr-3 text-xs border border-slate-200 rounded-lg bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#064e3b]"
            />
          </div>
        </div>

        <Button
          type="button"
          variant="secondary"
          size="md"
          onClick={loadData}
          loading={loading}
          className="gap-1.5 self-end md:self-auto"
        >
          <span className="material-symbols-outlined text-[16px]">refresh</span>
          <span>Actualizar</span>
        </Button>
      </div>

      {/* Tabla de Reclamos */}
      <div className="overflow-x-auto rounded-xl border border-[#e2e8f0] bg-white shadow-card">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#e2e8f0] bg-[#f8f9ff]">
              <th className="px-4 py-3.5 font-table-header text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                N° Reclamo
              </th>
              <th className="px-4 py-3.5 font-table-header text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Socio
              </th>
              <th className="px-4 py-3.5 font-table-header text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Tipo / Canal
              </th>
              <th className="px-4 py-3.5 font-table-header text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Registro / Plazo Límite
              </th>
              <th className="px-4 py-3.5 font-table-header text-[11px] font-semibold uppercase tracking-wider text-slate-500 text-center">
                Estado
              </th>
              <th className="px-4 py-3.5 font-table-header text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Descripción
              </th>
              <th className="px-4 py-3.5 font-table-header text-[11px] font-semibold uppercase tracking-wider text-slate-500 text-center">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e2e8f0]">
            {loading ? (
              <tr>
                <td colSpan={7} className="p-8 text-center">
                  <div className="space-y-3 max-w-sm mx-auto">
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-full" />
                  </div>
                </td>
              </tr>
            ) : itemsFiltrados.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-[36px] text-slate-300">
                      verified_user
                    </span>
                    <span className="font-semibold text-slate-600">No se encontraron reclamos</span>
                    <span className="text-xs text-slate-400">
                      {busqueda || filtroEstado || filtroVencido
                        ? 'No hay registros que coincidan con los filtros aplicados.'
                        : 'No se registran reclamos pendientes en el Punto de Reclamo.'}
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              itemsFiltrados.map((r) => {
                const isRegistrado = r.estado === 'REGISTRADO'
                const isEnAtencion = r.estado === 'EN_ATENCION'
                const isRespondible = isRegistrado || isEnAtencion
                const socioNombre = r.socio || r.socio_nombre || 'Socio #' + (r.socio_id || '—')

                return (
                  <tr key={r.id} className="transition-colors hover:bg-slate-50/80">
                    <td className="px-4 py-3.5 font-mono font-bold text-slate-900">
                      {r.numero_reclamo || `PR-#${r.id}`}
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="font-bold text-slate-900 block">{socioNombre}</span>
                      {r.credito_id && (
                        <span className="font-mono text-[10px] text-slate-500 block">
                          Crédito: CRE-#{r.credito_id}
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="font-semibold text-slate-800 block">
                        {getTipoLabel(r.tipo)}
                      </span>
                      <span className="text-[10px] text-slate-400 block uppercase">
                        Canal: {r.canal || 'VENTANILLA'}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="text-slate-800 block">{formatDate(r.fecha_registro)}</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-slate-500 font-mono">
                          Límite: {formatDate(r.fecha_limite_respuesta)}
                        </span>
                        {r.vencido && (
                          <Badge variant="red" className="!text-[9px] !py-0 !px-1 font-bold">
                            Vencido
                          </Badge>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      {getEstadoBadge(r.estado)}
                    </td>

                    <td className="px-4 py-3.5 text-slate-600 max-w-xs truncate" title={r.descripcion}>
                      {r.descripcion}
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => handleVerDetalle(r.id)}
                          className="!py-1 !px-2 !text-xs gap-1"
                          title="Ver expediente del reclamo"
                        >
                          <span className="material-symbols-outlined text-[15px]">visibility</span>
                          <span>Ver</span>
                        </Button>

                        {isRegistrado && (
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => handleAtender(r.id)}
                            loading={atendiendoId === r.id}
                            className="!py-1 !px-2 !text-xs text-amber-800 border-amber-300 hover:bg-amber-50"
                            title="Poner reclamo en atención y asignarme"
                          >
                            Atender
                          </Button>
                        )}

                        {isRespondible && (
                          <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            onClick={() => handleOpenResponder(r)}
                            className="!py-1 !px-2 !text-xs bg-[#064e3b] hover:bg-[#003527]"
                            title="Emitir respuesta formal institucional"
                          >
                            Responder
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Modal: Registrar Reclamo (Ventanilla) ── */}
      {nuevoModalOpen && (
        <Modal
          open={nuevoModalOpen}
          onClose={() => setNuevoModalOpen(false)}
          title="Punto de Reclamo — Apertura por Ventanilla"
          subtitle="Formulario oficial de recepción de reclamos según regulación ASFI / Ley 393"
          footer={
            <div className="flex w-full items-center justify-between">
              <Button
                variant="secondary"
                size="sm"
                type="button"
                onClick={() => setNuevoModalOpen(false)}
                disabled={guardandoReclamo}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                form="nuevo-reclamo-form"
                loading={guardandoReclamo}
              >
                Registrar Reclamo
              </Button>
            </div>
          }
        >
          <form id="nuevo-reclamo-form" onSubmit={handleCrearReclamoSubmit} className="space-y-4 text-xs">
            {/* Socio */}
            <div className="space-y-2">
              <span className="font-bold text-slate-800 block uppercase text-[11px]">
                1. Socio Reclamante *
              </span>
              {socioSeleccionado ? (
                <div className="p-3 rounded-lg border border-emerald-300 bg-emerald-50/60 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 block">{socioSeleccionado.nombre_completo}</span>
                    <span className="font-mono text-xs text-slate-600">CI: {socioSeleccionado.ci}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSocioSeleccionado(null)}
                    className="text-xs text-emerald-800 hover:text-emerald-950 font-semibold underline cursor-pointer"
                  >
                    Cambiar socio
                  </button>
                </div>
              ) : (
                <div>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-[18px]">
                      search
                    </span>
                    <input
                      type="text"
                      placeholder="Buscar por cédula o apellido (mínimo 3 caracteres)..."
                      value={busquedaSocio}
                      onChange={(e) => handleBuscarSocioChange(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#064e3b]"
                    />
                    {buscandoSocio && (
                      <span className="absolute right-3 top-2.5 text-[11px] text-slate-400">
                        Buscando...
                      </span>
                    )}
                  </div>
                  {formErrors.socio && (
                    <p className="mt-1 text-xs text-rose-600 font-medium">{formErrors.socio}</p>
                  )}

                  {sociosEncontrados.length > 0 && (
                    <div className="mt-1 max-h-36 overflow-y-auto rounded-lg border border-slate-200 bg-white divide-y divide-slate-100 shadow-sm">
                      {sociosEncontrados.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => {
                            setSocioSeleccionado(s)
                            setSociosEncontrados([])
                            setBusquedaSocio('')
                            setFormErrors((prev) => {
                              const next = { ...prev }
                              delete next.socio
                              return next
                            })
                          }}
                          className="w-full text-left p-2.5 hover:bg-emerald-50/60 transition flex items-center justify-between"
                        >
                          <div>
                            <span className="font-semibold text-slate-800 block">{s.nombre_completo}</span>
                            <span className="font-mono text-slate-500 text-[11px]">CI: {s.ci}</span>
                          </div>
                          <Badge variant="green">Activo</Badge>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Tipo de reclamo y Crédito ID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField id="nuevo_tipo" label="Tipo de Reclamo *">
                <select
                  id="nuevo_tipo"
                  value={nuevoTipo}
                  onChange={(e) => setNuevoTipo(e.target.value)}
                  className="w-full h-10 px-3 text-xs border border-slate-200 rounded-lg bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#064e3b]"
                >
                  {TIPOS_RECLAMO.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField id="nuevo_credito_id" label="N° de Crédito Asociado (Opcional)">
                <Input
                  id="nuevo_credito_id"
                  type="number"
                  placeholder="Ej. 12"
                  value={nuevoCreditoId}
                  onChange={(e) => setNuevoCreditoId(e.target.value)}
                  className="tabular-nums"
                />
              </FormField>
            </div>

            {/* Descripción */}
            <FormField
              id="nueva_descripcion"
              label="Hechos que motivan el reclamo (1 a 2000 caracteres) *"
              error={formErrors.descripcion}
            >
              <Textarea
                id="nueva_descripcion"
                rows={4}
                maxLength={2000}
                placeholder="Describa con precisión los hechos acontecidos, fechas, funcionarios intervinientes y el petitorio o pretensión del socio..."
                value={nuevaDescripcion}
                onChange={(e) => setNuevaDescripcion(e.target.value)}
                required
              />
              <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                <span>Plazo normativo perentorio de respuesta: 5 días hábiles</span>
                <span>{nuevaDescripcion.length} / 2000</span>
              </div>
            </FormField>
          </form>
        </Modal>
      )}

      {/* ── Modal: Detalle del Reclamo ── */}
      {detalleModalOpen && (
        <Modal
          open={detalleModalOpen}
          onClose={() => setDetalleModalOpen(false)}
          title={`Expediente: ${selectedReclamo?.numero_reclamo || 'Detalle'}`}
          subtitle={`Registrado el ${formatDateTime(selectedReclamo?.fecha_registro)} &bull; Canal: ${selectedReclamo?.canal || 'VENTANILLA'}`}
          footer={
            <div className="flex w-full items-center justify-between">
              <Button
                variant="secondary"
                size="sm"
                type="button"
                onClick={() => setDetalleModalOpen(false)}
              >
                Cerrar
              </Button>

              <div className="flex items-center gap-2">
                {selectedReclamo?.estado === 'REGISTRADO' && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => handleAtender(selectedReclamo.id)}
                    loading={atendiendoId === selectedReclamo.id}
                    className="text-amber-800 border-amber-300 hover:bg-amber-50"
                  >
                    Atender Reclamo
                  </Button>
                )}

                {(selectedReclamo?.estado === 'REGISTRADO' || selectedReclamo?.estado === 'EN_ATENCION') && (
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => handleOpenResponder(selectedReclamo)}
                    className="bg-[#064e3b] hover:bg-[#003527]"
                  >
                    Responder Reclamo
                  </Button>
                )}
              </div>
            </div>
          }
        >
          {loadingDetalle ? (
            <div className="space-y-3 p-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : selectedReclamo && (
            <div className="space-y-4 text-xs font-sans text-slate-800">
              {/* Alerta si está vencido */}
              {selectedReclamo.vencido && (
                <div className="p-3 rounded-lg border border-rose-300 bg-rose-50 text-rose-900 flex items-start gap-2">
                  <span className="material-symbols-outlined text-[18px] text-rose-700 shrink-0">timer_off</span>
                  <div>
                    <strong className="block text-rose-950 font-bold uppercase text-[11px]">
                      Plazo Legal Vencido (Ley 393 / ASFI)
                    </strong>
                    <span>
                      Han transcurrido más de 5 días hábiles desde la fecha de registro sin haber emitido respuesta oficial. El socio está facultado para apelar directamente ante la Defensoría del Consumidor Financiero de la ASFI.
                    </span>
                  </div>
                </div>
              )}

              {/* Alerta si está escalado ASFI */}
              {selectedReclamo.estado === 'ESCALADO_ASFI' && (
                <div className="p-3 rounded-lg border border-purple-300 bg-purple-50 text-purple-900 flex items-start gap-2">
                  <span className="material-symbols-outlined text-[18px] text-purple-700 shrink-0">gavel</span>
                  <div>
                    <strong className="block text-purple-950 font-bold uppercase text-[11px]">
                      Reclamo Escalado a Segunda Instancia ASFI
                    </strong>
                    <span>
                      El socio ha manifestado su disconformidad con la resolución interna o vencimiento de plazos.
                    </span>
                    {selectedReclamo.motivo_disconformidad && (
                      <p className="mt-1 font-semibold text-purple-950">
                        Motivo de disconformidad: &ldquo;{selectedReclamo.motivo_disconformidad}&rdquo;
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Ficha técnica del reclamo */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Socio</span>
                  <span className="font-bold text-slate-900 block truncate">
                    {selectedReclamo.socio || selectedReclamo.socio_nombre || 'Socio #' + selectedReclamo.socio_id}
                  </span>
                </div>

                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Tipo Reclamo</span>
                  <span className="font-bold text-slate-800 block truncate">
                    {getTipoLabel(selectedReclamo.tipo)}
                  </span>
                </div>

                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Estado Actual</span>
                  <div className="mt-0.5">{getEstadoBadge(selectedReclamo.estado)}</div>
                </div>

                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Plazo Límite</span>
                  <span className="font-mono font-bold text-slate-800 block">
                    {formatDate(selectedReclamo.fecha_limite_respuesta)}
                  </span>
                </div>
              </div>

              {/* Descripción del Reclamo */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Descripción y Petitorio del Socio
                </span>
                <p className="text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {selectedReclamo.descripcion}
                </p>
              </div>

              {/* Respuesta Institucional si ya fue emitida */}
              {selectedReclamo.respuesta && (
                <div className="p-3.5 rounded-xl border border-teal-200 bg-teal-50/50 space-y-2">
                  <div className="flex items-center justify-between border-b border-teal-200/60 pb-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-teal-900 block">
                      Respuesta Oficial Institucional Emitida
                    </span>
                    <Badge variant={selectedReclamo.procedente ? 'green' : 'amber'}>
                      {selectedReclamo.procedente ? 'Procedente' : 'Improcedente'}
                    </Badge>
                  </div>
                  <p className="text-slate-800 whitespace-pre-wrap leading-relaxed">
                    {selectedReclamo.respuesta}
                  </p>
                  <div className="text-[10px] text-slate-500 pt-1 border-t border-teal-100 flex items-center justify-between">
                    <span>Fecha de respuesta: {formatDateTime(selectedReclamo.fecha_respuesta)}</span>
                    {selectedReclamo.conforme !== null && selectedReclamo.conforme !== undefined && (
                      <span className="font-semibold text-slate-700">
                        Conformidad del socio: {selectedReclamo.conforme ? 'Conforme' : 'Disconforme'}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal>
      )}

      {/* ── Modal: Responder Reclamo ── */}
      {responderModalOpen && (
        <Modal
          open={responderModalOpen}
          onClose={() => setResponderModalOpen(false)}
          title={`Responder Reclamo: ${selectedReclamo?.numero_reclamo || ''}`}
          subtitle="Dictamen formal institucional de primera instancia según Ley 393"
          footer={
            <div className="flex w-full items-center justify-between">
              <Button
                variant="secondary"
                size="sm"
                type="button"
                onClick={() => setResponderModalOpen(false)}
                disabled={respondiendo}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                form="responder-reclamo-form"
                loading={respondiendo}
                className="bg-[#064e3b] hover:bg-[#003527]"
              >
                Emitir Respuesta Oficial
              </Button>
            </div>
          }
        >
          <form id="responder-reclamo-form" onSubmit={handleResponderSubmit} className="space-y-4 text-xs">
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Reclamo Original</span>
              <p className="text-slate-700 line-clamp-2 italic">
                &ldquo;{selectedReclamo?.descripcion}&rdquo;
              </p>
            </div>

            <FormField id="respuesta_procedencia" label="Dictamen Técnico de Procedencia *">
              <div className="flex gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="procedente"
                    checked={respuestaProcedente === true}
                    onChange={() => setRespuestaProcedente(true)}
                    className="h-4 w-4 text-[#064e3b] focus:ring-[#064e3b]"
                  />
                  <span className="font-semibold text-slate-800">
                    Procedente (Aceptado en favor del socio)
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="procedente"
                    checked={respuestaProcedente === false}
                    onChange={() => setRespuestaProcedente(false)}
                    className="h-4 w-4 text-[#064e3b] focus:ring-[#064e3b]"
                  />
                  <span className="font-semibold text-slate-800">
                    Improcedente (Desestimado / Infundado)
                  </span>
                </label>
              </div>
            </FormField>

            <FormField id="respuesta_texto" label="Fundamentación y Respuesta Institucional *" required>
              <Textarea
                id="respuesta_texto"
                rows={5}
                placeholder="Redacte la respuesta clara, técnica y fundada en contratos, extractos o reglamentos institucionales..."
                value={respuestaTexto}
                onChange={(e) => setRespuestaTexto(e.target.value)}
                required
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Esta respuesta se notificará al socio en su aplicación móvil y quedará registrada en el Punto de Reclamo.
              </p>
            </FormField>
          </form>
        </Modal>
      )}
    </div>
  )
}
