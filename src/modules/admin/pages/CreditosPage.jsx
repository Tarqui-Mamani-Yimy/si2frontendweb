import { useState, useEffect, useMemo } from 'react'
import PageHeader from '../../../components/ui/PageHeader'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import AlertBanner from '../../../components/ui/AlertBanner'
import MetricCard from '../../../components/ui/MetricCard'
import Skeleton from '../../../components/ui/Skeleton'
import ProductoCreditoModal from '../components/creditos/ProductoCreditoModal'
import ConfirmarEstadoModal from '../components/creditos/ConfirmarEstadoModal'
import { getProductosCredito, listMonedas } from '../../../core/api/creditosApi'

function formatMoney(value, simbolo = 'Bs.') {
  const n = Number(value ?? 0)
  return `${simbolo} ${n.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function AdminCreditosPage() {
  const [productos, setProductos] = useState([])
  const [monedas, setMonedas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  // Filtros
  const [filtroEstado, setFiltroEstado] = useState('') // '' (todos), 'ACTIVO', 'INACTIVO'
  const [busqueda, setBusqueda] = useState('')

  // Modales
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedProducto, setSelectedProducto] = useState(null) // null = crear, object = editar
  const [statusProducto, setStatusProducto] = useState(null) // object = confirmar cambio estado

  useEffect(() => {
    let isMounted = true
    Promise.all([
      getProductosCredito(),
      listMonedas().catch(() => [
        { id: 1, codigo_iso: 'BOB', nombre: 'Bolivianos', simbolo: 'Bs.' },
        { id: 2, codigo_iso: 'USD', nombre: 'Dólares Americanos', simbolo: '$us' },
      ]),
    ])
      .then(([prods, mons]) => {
        if (!isMounted) return
        setProductos(Array.isArray(prods) ? prods : [])
        setMonedas(Array.isArray(mons) ? mons : [])
      })
      .catch((err) => {
        if (!isMounted) return
        setError(err.response?.data?.detail || 'Error al cargar los productos crediticios.')
      })
      .finally(() => {
        if (!isMounted) return
        setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  async function reloadProductos(estadoParam = filtroEstado) {
    setLoading(true)
    setError(null)
    try {
      const params = {}
      if (estadoParam) params.estado = estadoParam
      const data = await getProductosCredito(params)
      setProductos(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al actualizar listado de productos.')
    } finally {
      setLoading(false)
    }
  }

  function handleCambiarFiltroEstado(nuevoEstado) {
    setFiltroEstado(nuevoEstado)
    reloadProductos(nuevoEstado)
  }

  function handleNuevoProducto() {
    setSelectedProducto(null)
    setModalOpen(true)
  }

  function handleEditarProducto(prod) {
    setSelectedProducto(prod)
    setModalOpen(true)
  }

  function handleModalSuccess() {
    setSuccessMessage(
      selectedProducto
        ? `Producto crediticio ${selectedProducto.codigo} actualizado correctamente.`
        : 'Nuevo producto crediticio configurado con éxito.',
    )
    reloadProductos()
  }

  function handleStatusSuccess() {
    if (statusProducto) {
      const esActivo = statusProducto.estado === 'ACTIVO'
      setSuccessMessage(
        `Producto ${statusProducto.codigo} ${esActivo ? 'desactivado' : 'activado'} correctamente.`,
      )
    }
    reloadProductos()
  }

  // Filtrado local por término de búsqueda
  const productosFiltrados = useMemo(() => {
    if (!busqueda.trim()) return productos
    const term = busqueda.trim().toLowerCase()
    return productos.filter((p) => {
      const cod = p.codigo?.toLowerCase() ?? ''
      const nom = p.nombre?.toLowerCase() ?? ''
      const desc = p.descripcion?.toLowerCase() ?? ''
      const iso = (typeof p.moneda === 'object' ? p.moneda?.codigo_iso : '')?.toLowerCase() ?? ''
      return cod.includes(term) || nom.includes(term) || desc.includes(term) || iso.includes(term)
    })
  }, [productos, busqueda])

  // Indicadores
  const metrics = useMemo(() => {
    const total = productos.length
    const activos = productos.filter((p) => p.estado === 'ACTIVO').length
    const inactivos = total - activos
    const sumaTna = productos.reduce((acc, p) => acc + (parseFloat(p.tasa_interes_anual) || 0), 0)
    const tasaPromedio = total > 0 ? (sumaTna / total).toFixed(2) : '0.00'

    return { total, activos, inactivos, tasaPromedio }
  }, [productos])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Productos Crediticios"
        subtitle="Configuración institucional de tasas, plazos, reglas de amortización y mora (CU-W20)"
        action={
          <Button variant="primary" size="md" onClick={handleNuevoProducto} className="gap-2">
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span>Nuevo Producto</span>
          </Button>
        }
      />

      {/* ── Banners informativos ── */}
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

      {/* ── Métricas Clave ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Productos"
          value={metrics.total}
          icon="credit_score"
          iconBg="bg-blue-50"
          iconColor="text-blue-700"
        />
        <MetricCard
          label="Productos Activos"
          value={metrics.activos}
          icon="check_circle"
          iconBg="bg-emerald-50"
          iconColor="text-[#064e3b]"
        />
        <MetricCard
          label="Productos Inactivos"
          value={metrics.inactivos}
          icon="pause_circle"
          iconBg="bg-slate-100"
          iconColor="text-slate-600"
        />
        <MetricCard
          label="TNA Promedio Catálogo"
          value={`${metrics.tasaPromedio}%`}
          icon="percent"
          iconBg="bg-amber-50"
          iconColor="text-amber-700"
        />
      </div>

      {/* ── Filtros y Búsqueda ── */}
      <div className="p-4 rounded-xl border border-[#e2e8f0] bg-white shadow-card flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mr-1">
            Estado:
          </span>
          <button
            type="button"
            onClick={() => handleCambiarFiltroEstado('')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              filtroEstado === ''
                ? 'bg-[#064e3b] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos ({metrics.total})
          </button>
          <button
            type="button"
            onClick={() => handleCambiarFiltroEstado('ACTIVO')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              filtroEstado === 'ACTIVO'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Activos ({metrics.activos})
          </button>
          <button
            type="button"
            onClick={() => handleCambiarFiltroEstado('INACTIVO')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              filtroEstado === 'INACTIVO'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Inactivos ({metrics.inactivos})
          </button>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-[18px]">
              search
            </span>
            <input
              type="text"
              placeholder="Buscar por código o nombre..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#064e3b]"
            />
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => reloadProductos()}
            disabled={loading}
            title="Refrescar catálogo"
          >
            <span className="material-symbols-outlined text-[16px]">refresh</span>
          </Button>
        </div>
      </div>

      {/* ── Catálogo de Productos Crediticios ── */}
      <div className="overflow-x-auto rounded-xl border border-[#e2e8f0] bg-white shadow-card">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#e2e8f0] bg-[#f8f9ff]">
              <th className="px-4 py-3.5 font-table-header text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Código / Estado
              </th>
              <th className="px-4 py-3.5 font-table-header text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Producto y Destino
              </th>
              <th className="px-4 py-3.5 font-table-header text-[11px] font-semibold uppercase tracking-wider text-slate-500 text-center">
                Moneda
              </th>
              <th className="px-4 py-3.5 font-table-header text-[11px] font-semibold uppercase tracking-wider text-slate-500 text-right">
                Rango Monto
              </th>
              <th className="px-4 py-3.5 font-table-header text-[11px] font-semibold uppercase tracking-wider text-slate-500 text-center">
                Plazo
              </th>
              <th className="px-4 py-3.5 font-table-header text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                TNA y Amortización
              </th>
              <th className="px-4 py-3.5 font-table-header text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Garantía y Riesgo
              </th>
              <th className="px-4 py-3.5 font-table-header text-[11px] font-semibold uppercase tracking-wider text-slate-500 text-center">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e2e8f0]/80">
            {loading ? (
              <tr>
                <td colSpan={8} className="p-6">
                  <div className="space-y-3">
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-full" />
                  </div>
                </td>
              </tr>
            ) : productosFiltrados.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-sm text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-[36px] text-slate-300">credit_card_off</span>
                    <span className="font-semibold text-slate-600">No se encontraron productos crediticios</span>
                    <span className="text-xs text-slate-400">
                      {busqueda ? 'Ningún producto coincide con el filtro de búsqueda.' : 'Cree un nuevo producto crediticio para comenzar.'}
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              productosFiltrados.map((p) => {
                const sim = (typeof p.moneda === 'object' ? p.moneda?.simbolo : 'Bs.') || 'Bs.'
                const iso = (typeof p.moneda === 'object' ? p.moneda?.codigo_iso : 'BOB') || 'BOB'
                const esActivo = p.estado === 'ACTIVO'

                return (
                  <tr key={p.id} className="transition-colors hover:bg-slate-50/80">
                    {/* Código y Estado */}
                    <td className="px-4 py-3.5 text-xs">
                      <span className="font-mono font-bold text-slate-900 block text-sm">{p.codigo}</span>
                      <div className="mt-1">
                        <Badge variant={esActivo ? 'green' : 'slate'}>{p.estado}</Badge>
                      </div>
                    </td>

                    {/* Nombre y Descripción */}
                    <td className="px-4 py-3.5 text-xs max-w-xs">
                      <span className="font-bold text-slate-900 block text-sm">{p.nombre}</span>
                      {p.descripcion ? (
                        <span className="text-[11px] text-slate-500 block line-clamp-2 mt-0.5" title={p.descripcion}>
                          {p.descripcion}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic block mt-0.5">Sin descripción</span>
                      )}
                    </td>

                    {/* Moneda */}
                    <td className="px-4 py-3.5 text-xs text-center">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md font-mono font-bold text-xs bg-slate-100 text-slate-700 border border-slate-200">
                        {iso} ({sim})
                      </span>
                    </td>

                    {/* Rango de Montos */}
                    <td className="px-4 py-3.5 text-xs text-right font-display font-semibold text-slate-900 tabular-nums">
                      <span className="block font-bold text-slate-900">{formatMoney(p.monto_max, sim)}</span>
                      <span className="text-[10px] text-slate-400 block">Min: {formatMoney(p.monto_min, sim)}</span>
                      <span className="text-[10px] text-purple-700 font-sans block mt-0.5" title="Monto máximo para aprobación directa antes de derivación a comité">
                        Dir: {Number(p.monto_aprobacion_directa ?? 0) > 0 ? formatMoney(p.monto_aprobacion_directa, sim) : 'Comité (0)'}
                      </span>
                    </td>

                    {/* Plazo */}
                    <td className="px-4 py-3.5 text-xs text-center font-medium text-slate-700">
                      <span className="font-bold text-slate-900 block">{p.plazo_min_meses} – {p.plazo_max_meses} m</span>
                      <span className="text-[10px] text-slate-400 block">Meses plazo</span>
                    </td>

                    {/* Tasa y Amortización */}
                    <td className="px-4 py-3.5 text-xs">
                      <span className="font-display font-bold text-[#064e3b] text-sm tabular-nums block">
                        {Number(p.tasa_interes_anual).toFixed(2)}% TNA
                      </span>
                      <span className="text-[11px] text-slate-600 block mt-0.5">
                        {p.tipo_amortizacion === 'FRANCES' ? 'Francés (Cuota fija)' : 'Alemán (Capital fijo)'}
                      </span>
                    </td>

                    {/* Garantía y Riesgo */}
                    <td className="px-4 py-3.5 text-xs">
                      <div>
                        {p.requiere_garantia ? (
                          <Badge variant="amber">Garantía Requerida</Badge>
                        ) : (
                          <Badge variant="slate">Sin Garantía</Badge>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1 space-x-1">
                        <span>RCI: <strong>{Number(p.relacion_cuota_ingreso_max).toFixed(0)}%</strong></span>
                        <span>&bull;</span>
                        <span>Gracia: <strong>{p.dias_gracia_mora}d</strong></span>
                        {Number(p.tasa_mora_anual) > 0 && (
                          <>
                            <span>&bull;</span>
                            <span>Mora: <strong>{Number(p.tasa_mora_anual).toFixed(2)}%</strong></span>
                          </>
                        )}
                      </div>
                    </td>

                    {/* Acciones */}
                    <td className="px-4 py-3.5 text-xs text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => handleEditarProducto(p)}
                          className="gap-1 !text-xs !py-1 !px-2.5"
                          title="Modificar parámetros del producto"
                        >
                          <span className="material-symbols-outlined text-[15px]">edit</span>
                          <span>Editar</span>
                        </Button>

                        <Button
                          type="button"
                          variant={esActivo ? 'secondary' : 'primary'}
                          size="sm"
                          onClick={() => setStatusProducto(p)}
                          className={`gap-1 !text-xs !py-1 !px-2.5 ${
                            esActivo
                              ? 'hover:!bg-amber-50 hover:!text-amber-900 hover:!border-amber-300'
                              : '!bg-[#064e3b]'
                          }`}
                          title={esActivo ? 'Desactivar producto para nuevas solicitudes' : 'Activar producto en catálogo'}
                        >
                          <span className="material-symbols-outlined text-[15px]">
                            {esActivo ? 'pause_circle' : 'play_circle'}
                          </span>
                          <span>{esActivo ? 'Desactivar' : 'Activar'}</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Modal de Creación / Edición ── */}
      {modalOpen && (
        <ProductoCreditoModal
          open={modalOpen}
          producto={selectedProducto}
          monedas={monedas}
          onClose={() => {
            setModalOpen(false)
            setSelectedProducto(null)
          }}
          onSuccess={handleModalSuccess}
        />
      )}

      {/* ── Modal de Confirmación de Estado ── */}
      {statusProducto && (
        <ConfirmarEstadoModal
          open={Boolean(statusProducto)}
          producto={statusProducto}
          onClose={() => setStatusProducto(null)}
          onSuccess={handleStatusSuccess}
        />
      )}
    </div>
  )
}
