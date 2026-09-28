import { useState, useEffect, useRef } from 'react'
import PageHeader from '../../../components/ui/PageHeader'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import Skeleton from '../../../components/ui/Skeleton'
import AlertBanner from '../../../components/ui/AlertBanner'
import ComprobanteDetailModal from '../components/ComprobanteDetailModal'
import NuevoComprobanteModal from '../components/NuevoComprobanteModal'
import AnularComprobanteModal from '../components/AnularComprobanteModal'
import GenerarAutomaticosModal from '../components/GenerarAutomaticosModal'
import {
  formatMoney,
  formatDate,
  TIPO_COMPROBANTE_CONFIG,
  ESTADO_COMPROBANTE_CONFIG,
  ORIGEN_COMPROBANTE_CONFIG,
} from '../components/contabilidadUtils'
import { listComprobantes } from '../../../core/api/contabilidadApi'
import { getApiErrorMessage } from '../../../core/api/errors'

export default function ComprobantesPage() {
  const [comprobantes, setComprobantes] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filtros
  const [q, setQ] = useState('')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [tipo, setTipo] = useState('')
  const [origen, setOrigen] = useState('')
  const [estado, setEstado] = useState('')
  const [limit] = useState(15)
  const [offset, setOffset] = useState(0)

  // Modales
  const [selectedComprobanteId, setSelectedComprobanteId] = useState(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)

  const [modalNuevoOpen, setModalNuevoOpen] = useState(false)

  const [comprobanteToAnular, setComprobanteToAnular] = useState(null)
  const [modalAnularOpen, setModalAnularOpen] = useState(false)

  const [modalAutomaticosOpen, setModalAutomaticosOpen] = useState(false)

  // Banner feedback
  const [feedback, setFeedback] = useState(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Request counter to avoid race conditions when filtering quickly
  const requestIdRef = useRef(0)

  useEffect(() => {
    let isMounted = true
    const reqId = ++requestIdRef.current

    const params = {
      limit,
      offset,
    }
    if (q.trim()) params.q = q.trim()
    if (desde) params.desde = desde
    if (hasta) params.hasta = hasta
    if (tipo) params.tipo = tipo
    if (origen) params.origen = origen
    if (estado) params.estado = estado

    listComprobantes(params)
      .then((data) => {
        if (!isMounted || reqId !== requestIdRef.current) return
        setError(null)
        if (data && typeof data === 'object' && Array.isArray(data.items)) {
          setComprobantes(data.items)
          setTotal(Number(data.total ?? data.items.length))
        } else if (Array.isArray(data)) {
          setComprobantes(data)
          setTotal(data.length)
        } else {
          setComprobantes([])
          setTotal(0)
        }
      })
      .catch((err) => {
        if (!isMounted || reqId !== requestIdRef.current) return
        setError(
          getApiErrorMessage(
            err,
            'Error al cargar el listado de comprobantes contables.',
          ),
        )
      })
      .finally(() => {
        if (isMounted && reqId === requestIdRef.current) {
          setLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [q, desde, hasta, tipo, origen, estado, limit, offset, refreshTrigger])

  function handleFilterSubmit(e) {
    e?.preventDefault()
    setOffset(0)
    setLoading(true)
    setRefreshTrigger((k) => k + 1)
  }

  function handleClearFilters() {
    setQ('')
    setDesde('')
    setHasta('')
    setTipo('')
    setOrigen('')
    setEstado('')
    setOffset(0)
    setLoading(true)
    setRefreshTrigger((k) => k + 1)
  }

  function handleOpenDetail(id) {
    setSelectedComprobanteId(id)
    setDetailModalOpen(true)
  }

  function handleOpenAnular(comp) {
    setComprobanteToAnular(comp)
    setModalAnularOpen(true)
  }

  function handleAnularSuccess() {
    setFeedback({
      variant: 'info',
      message: 'Comprobante anulado y asiento de reversión generado con éxito.',
    })
    setLoading(true)
    setRefreshTrigger((k) => k + 1)
  }

  function handleNuevoSuccess(created) {
    setFeedback({
      variant: 'success',
      message: `Comprobante ${created?.numero || ''} registrado con éxito en los libros contables.`,
    })
    setLoading(true)
    setRefreshTrigger((k) => k + 1)
  }

  function handleAutomaticosSuccess(res) {
    setFeedback({
      variant: 'success',
      message: `Generación completada: ${res.generados ?? 0} comprobantes creados (${res.procesadas ?? 0} transacciones procesadas).`,
    })
    setLoading(true)
    setRefreshTrigger((k) => k + 1)
  }

  const currentPage = Math.floor(offset / limit) + 1
  const totalPages = Math.max(1, Math.ceil(total / limit))

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Encabezado */}
      <PageHeader
        title="Comprobantes Contables"
        subtitle="Gestión de asientos fiduciarios, partida doble y automatización operativa (CU-W30)."
        action={
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              className="gap-1.5"
              onClick={() => setModalAutomaticosOpen(true)}
            >
              <span className="material-symbols-outlined text-[17px]">sync</span>
              <span>Generar Automáticos</span>
            </Button>

            <Button
              type="button"
              variant="primary"
              className="gap-1.5 !bg-[#064e3b]"
              onClick={() => setModalNuevoOpen(true)}
            >
              <span className="material-symbols-outlined text-[17px]">add_circle</span>
              <span>Nuevo Comprobante</span>
            </Button>
          </div>
        }
      />

      {feedback && (
        <AlertBanner
          variant={feedback.variant}
          dismissible
          onDismiss={() => setFeedback(null)}
        >
          {feedback.message}
        </AlertBanner>
      )}

      {/* Barra de Filtros */}
      <form
        onSubmit={handleFilterSubmit}
        className="p-4 rounded-xl bg-white border border-slate-200 shadow-card space-y-3 text-xs"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Búsqueda */}
          <div className="lg:col-span-2">
            <label htmlFor="filter_q" className="font-semibold text-slate-700 block mb-1">
              Búsqueda:
            </label>
            <div className="relative">
              <span className="material-symbols-outlined text-[16px] text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2">
                search
              </span>
              <input
                id="filter_q"
                type="text"
                placeholder="Número (ej. I-2026), glosa..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-full h-8 pl-8 pr-2.5 border border-slate-300 rounded-lg text-xs outline-none focus:border-[#006c49]"
              />
            </div>
          </div>

          {/* Tipo */}
          <div>
            <label htmlFor="filter_tipo" className="font-semibold text-slate-700 block mb-1">
              Tipo:
            </label>
            <select
              id="filter_tipo"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="w-full h-8 px-2 border border-slate-300 rounded-lg text-xs outline-none focus:border-[#006c49]"
            >
              <option value="">Todos los tipos</option>
              <option value="INGRESO">Ingreso</option>
              <option value="EGRESO">Egreso</option>
              <option value="TRASPASO">Traspaso</option>
            </select>
          </div>

          {/* Origen */}
          <div>
            <label htmlFor="filter_origen" className="font-semibold text-slate-700 block mb-1">
              Origen:
            </label>
            <select
              id="filter_origen"
              value={origen}
              onChange={(e) => setOrigen(e.target.value)}
              className="w-full h-8 px-2 border border-slate-300 rounded-lg text-xs outline-none focus:border-[#006c49]"
            >
              <option value="">Todos los orígenes</option>
              <option value="MANUAL">Manual</option>
              <option value="AUTOMATICO">Automático</option>
            </select>
          </div>

          {/* Estado */}
          <div>
            <label htmlFor="filter_estado" className="font-semibold text-slate-700 block mb-1">
              Estado:
            </label>
            <select
              id="filter_estado"
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              className="w-full h-8 px-2 border border-slate-300 rounded-lg text-xs outline-none focus:border-[#006c49]"
            >
              <option value="">Todos los estados</option>
              <option value="REGISTRADO">Registrado</option>
              <option value="ANULADO">Anulado</option>
            </select>
          </div>

          {/* Fechas desde/hasta */}
          <div>
            <label htmlFor="filter_desde" className="font-semibold text-slate-700 block mb-1">
              Desde:
            </label>
            <input
              id="filter_desde"
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              className="w-full h-8 px-2 border border-slate-300 rounded-lg text-xs font-mono outline-none focus:border-[#006c49]"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <label htmlFor="filter_hasta" className="font-semibold text-slate-700 text-xs">
              Hasta:
            </label>
            <input
              id="filter_hasta"
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              className="h-8 px-2 border border-slate-300 rounded-lg text-xs font-mono outline-none focus:border-[#006c49]"
            />
          </div>

          <div className="flex items-center gap-2">
            {(q || desde || hasta || tipo || origen || estado) && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
              >
                Limpiar Filtros
              </Button>
            )}
            <Button
              type="submit"
              variant="secondary"
              size="sm"
              loading={loading}
              className="gap-1"
            >
              <span className="material-symbols-outlined text-[15px]">filter_list</span>
              <span>Filtrar</span>
            </Button>
          </div>
        </div>
      </form>

      {error && (
        <AlertBanner variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </AlertBanner>
      )}

      {/* Listado de Comprobantes */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : comprobantes.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <span className="material-symbols-outlined text-[40px] text-slate-300 block mb-1">
              receipt_long
            </span>
            <p className="text-sm font-semibold text-slate-700">
              No se encontraron comprobantes contables
            </p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Ajuste los filtros o registre un nuevo comprobante manual o automático.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-3 px-4">Número</th>
                  <th className="py-3 px-3">Fecha</th>
                  <th className="py-3 px-3">Tipo</th>
                  <th className="py-3 px-3">Origen</th>
                  <th className="py-3 px-4 min-w-[200px]">Glosa</th>
                  <th className="py-3 px-3 text-right">Total Debe</th>
                  <th className="py-3 px-3 text-right">Total Haber</th>
                  <th className="py-3 px-3 text-center">Estado</th>
                  <th className="py-3 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {comprobantes.map((c) => {
                  const tipoCfg = TIPO_COMPROBANTE_CONFIG[c.tipo] || {
                    label: c.tipo,
                    badgeVariant: 'slate',
                  }
                  const estadoCfg = ESTADO_COMPROBANTE_CONFIG[c.estado] || {
                    label: c.estado,
                    badgeVariant: 'slate',
                  }
                  const origenCfg = ORIGEN_COMPROBANTE_CONFIG[c.origen] || {
                    label: c.origen,
                    badgeVariant: 'slate',
                  }
                  const sim =
                    c.moneda?.simbolo || (Number(c.moneda_id) === 2 ? '$' : 'Bs.')

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-mono font-bold text-[#064e3b]">
                        <button
                          type="button"
                          onClick={() => handleOpenDetail(c.id)}
                          className="hover:underline text-left cursor-pointer"
                        >
                          {c.numero}
                        </button>
                      </td>

                      <td className="py-3 px-3 text-slate-600 font-mono">
                        {formatDate(c.fecha_contable)}
                      </td>

                      <td className="py-3 px-3">
                        <Badge variant={tipoCfg.badgeVariant}>
                          {tipoCfg.label}
                        </Badge>
                      </td>

                      <td className="py-3 px-3">
                        <Badge variant={origenCfg.badgeVariant}>
                          {origenCfg.label}
                        </Badge>
                      </td>

                      <td className="py-3 px-4 text-slate-700 truncate max-w-xs" title={c.glosa}>
                        {c.glosa || '—'}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-semibold text-slate-900">
                        {formatMoney(c.total_debe, sim)}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-semibold text-slate-900">
                        {formatMoney(c.total_haber, sim)}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <Badge variant={estadoCfg.badgeVariant}>
                          {estadoCfg.label}
                        </Badge>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDetail(c.id)}
                            className="!p-1.5 text-slate-600 hover:text-slate-900"
                            title="Ver detalle de asiento"
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              visibility
                            </span>
                          </Button>

                          {c.estado === 'REGISTRADO' && c.origen === 'MANUAL' && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenAnular(c)}
                              className="!p-1.5 text-red-600 hover:text-red-800"
                              title="Anular comprobante"
                            >
                              <span className="material-symbols-outlined text-[16px]">
                                block
                              </span>
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginación */}
        {total > limit && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50 text-xs text-slate-600">
            <div>
              Mostrando <strong>{offset + 1}</strong> a{' '}
              <strong>{Math.min(offset + limit, total)}</strong> de{' '}
              <strong>{total}</strong> comprobantes
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={offset === 0}
                onClick={() => setOffset((prev) => Math.max(0, prev - limit))}
              >
                Anterior
              </Button>

              <span className="font-mono text-slate-500">
                Pág. {currentPage} / {totalPages}
              </span>

              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={offset + limit >= total}
                onClick={() => setOffset((prev) => prev + limit)}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modales */}
      <NuevoComprobanteModal
        open={modalNuevoOpen}
        onClose={() => setModalNuevoOpen(false)}
        onSuccess={handleNuevoSuccess}
      />

      <ComprobanteDetailModal
        comprobanteId={selectedComprobanteId}
        open={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false)
          setSelectedComprobanteId(null)
        }}
        onOpenAnular={handleOpenAnular}
        onNavigateToVoucher={(targetId) => setSelectedComprobanteId(targetId)}
      />

      <AnularComprobanteModal
        open={modalAnularOpen}
        onClose={() => {
          setModalAnularOpen(false)
          setComprobanteToAnular(null)
        }}
        comprobante={comprobanteToAnular}
        onSuccess={handleAnularSuccess}
      />

      <GenerarAutomaticosModal
        open={modalAutomaticosOpen}
        onClose={() => setModalAutomaticosOpen(false)}
        onSuccess={handleAutomaticosSuccess}
      />
    </div>
  )
}
