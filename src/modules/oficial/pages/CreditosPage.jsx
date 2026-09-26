import { useState, useEffect, useMemo } from 'react'
import PageHeader from '../../../components/ui/PageHeader'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import AlertBanner from '../../../components/ui/AlertBanner'
import Skeleton from '../../../components/ui/Skeleton'
import { getProductosCredito } from '../../../core/api/creditosApi'

function formatMoney(value, simbolo = 'Bs.') {
  const n = Number(value ?? 0)
  return `${simbolo} ${n.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function OficialCreditosPage() {
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filtros locales
  const [busqueda, setBusqueda] = useState('')
  const [filtroMoneda, setFiltroMoneda] = useState('')
  const [vistaModo, setVistaModo] = useState('cards') // 'cards' | 'tabla'

  useEffect(() => {
    let isMounted = true
    getProductosCredito({ estado: 'ACTIVO' })
      .then((data) => {
        if (!isMounted) return
        setProductos(Array.isArray(data) ? data : [])
      })
      .catch((err) => {
        if (!isMounted) return
        setError(err.response?.data?.detail || 'Error al cargar el catálogo de productos crediticios.')
      })
      .finally(() => {
        if (!isMounted) return
        setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  async function reloadProductos() {
    setLoading(true)
    setError(null)
    try {
      const data = await getProductosCredito({ estado: 'ACTIVO' })
      setProductos(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al actualizar el catálogo de productos.')
    } finally {
      setLoading(false)
    }
  }

  // Lista de monedas disponibles entre los productos activos
  const monedasDisponibles = useMemo(() => {
    const map = new Map()
    productos.forEach((p) => {
      if (p.moneda && typeof p.moneda === 'object' && p.moneda.id) {
        map.set(p.moneda.id, p.moneda)
      }
    })
    return Array.from(map.values())
  }, [productos])

  // Filtrado de productos activos
  const productosFiltrados = useMemo(() => {
    return productos.filter((p) => {
      const matchMoneda = !filtroMoneda || String(p.moneda?.id) === String(filtroMoneda)
      if (!matchMoneda) return false

      if (!busqueda.trim()) return true
      const term = busqueda.trim().toLowerCase()
      const cod = p.codigo?.toLowerCase() ?? ''
      const nom = p.nombre?.toLowerCase() ?? ''
      const desc = p.descripcion?.toLowerCase() ?? ''
      return cod.includes(term) || nom.includes(term) || desc.includes(term)
    })
  }, [productos, busqueda, filtroMoneda])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Catálogo de Productos Crediticios"
        subtitle="Condiciones oficiales, plazos, tasas y límites vigentes para originación y evaluación crediticia (CU-W20)"
      />

      {/* ── Banner de error ── */}
      {error && (
        <AlertBanner variant="error" onClose={() => setError(null)}>
          {error}
        </AlertBanner>
      )}

      {/* ── Barra de Herramientas y Filtros ── */}
      <div className="p-4 rounded-xl border border-[#e2e8f0] bg-white shadow-card flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Búsqueda rápida */}
          <div className="relative flex-1 md:w-80">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-[18px]">
              search
            </span>
            <input
              type="text"
              placeholder="Buscar por código, nombre o destino..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#064e3b]"
            />
          </div>

          {/* Filtro por moneda */}
          {monedasDisponibles.length > 1 && (
            <select
              value={filtroMoneda}
              onChange={(e) => setFiltroMoneda(e.target.value)}
              className="h-9 px-3 text-xs border border-slate-200 rounded-lg bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#064e3b]"
            >
              <option value="">Todas las monedas</option>
              {monedasDisponibles.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.codigo_iso} ({m.simbolo})
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          {/* Selector de Vista (Tarjetas vs Tabla) */}
          <div className="flex rounded-lg border border-slate-200 bg-slate-100 p-0.5">
            <button
              type="button"
              onClick={() => setVistaModo('cards')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md transition ${
                vistaModo === 'cards'
                  ? 'bg-white text-[#064e3b] shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Vista en tarjetas descriptivas"
            >
              <span className="material-symbols-outlined text-[16px]">grid_view</span>
              <span className="hidden sm:inline">Tarjetas</span>
            </button>
            <button
              type="button"
              onClick={() => setVistaModo('tabla')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md transition ${
                vistaModo === 'tabla'
                  ? 'bg-white text-[#064e3b] shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Vista en tabla de catálogo"
            >
              <span className="material-symbols-outlined text-[16px]">table_rows</span>
              <span className="hidden sm:inline">Tabla</span>
            </button>
          </div>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={reloadProductos}
            disabled={loading}
            title="Refrescar catálogo"
          >
            <span className="material-symbols-outlined text-[16px]">refresh</span>
          </Button>
        </div>
      </div>

      {/* ── Contenido: Cargando, Vacío o Listado ── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      ) : productosFiltrados.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-card">
          <div className="flex flex-col items-center justify-center gap-2">
            <span className="material-symbols-outlined text-[42px] text-slate-300">credit_card_off</span>
            <span className="font-semibold text-slate-700 text-base">No hay productos crediticios activos</span>
            <span className="text-xs text-slate-400 max-w-sm">
              {busqueda || filtroMoneda
                ? 'No se encontraron productos activos que coincidan con los criterios de búsqueda.'
                : 'Actualmente no hay productos crediticios disponibles para originación en la cooperativa.'}
            </span>
          </div>
        </div>
      ) : vistaModo === 'cards' ? (
        /* ── Vista en Tarjetas Informativas ── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {productosFiltrados.map((p) => {
            const sim = (typeof p.moneda === 'object' ? p.moneda?.simbolo : 'Bs.') || 'Bs.'
            const iso = (typeof p.moneda === 'object' ? p.moneda?.codigo_iso : 'BOB') || 'BOB'

            return (
              <div
                key={p.id}
                className="group flex flex-col justify-between rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-card transition-all duration-200 hover:border-[#cbd5e1] hover:shadow-card-hover"
              >
                <div>
                  {/* Encabezado de la Tarjeta */}
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 text-sm">{p.codigo}</span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {iso} ({sim})
                      </span>
                    </div>
                    <Badge variant="green">Vigente</Badge>
                  </div>

                  {/* Nombre y Descripción */}
                  <div className="mt-3">
                    <h3 className="font-display font-bold text-slate-900 text-base group-hover:text-[#064e3b] transition-colors">
                      {p.nombre}
                    </h3>
                    {p.descripcion ? (
                      <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {p.descripcion}
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-slate-400 italic">Condiciones generales de crédito institucional.</p>
                    )}
                  </div>

                  {/* Destacado de Tasa y Amortización */}
                  <div className="my-4 p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                        Tasa de Interés Anual
                      </span>
                      <span className="font-display text-2xl font-bold text-[#064e3b] tabular-nums">
                        {Number(p.tasa_interes_anual).toFixed(2)}%
                      </span>
                      <span className="text-[10px] text-emerald-700 font-semibold ml-1">TNA</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                        Amortización
                      </span>
                      <span className="text-xs font-bold text-slate-800 block mt-0.5">
                        {p.tipo_amortizacion === 'FRANCES' ? 'Francés (Cuota fija)' : 'Alemán (Capital fijo)'}
                      </span>
                    </div>
                  </div>

                  {/* Parámetros Operativos */}
                  <div className="space-y-2 text-xs divide-y divide-slate-100">
                    <div className="flex items-center justify-between py-1">
                      <span className="text-slate-500">Monto Financiamiento:</span>
                      <span className="font-bold text-slate-900 font-mono tabular-nums">
                        {formatMoney(p.monto_min, sim)} – {formatMoney(p.monto_max, sim)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1">
                      <span className="text-slate-500">Plazo Permitido:</span>
                      <span className="font-bold text-slate-900 tabular-nums">
                        {p.plazo_min_meses} a {p.plazo_max_meses} meses
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1">
                      <span className="text-slate-500">RCI Máx. Permitido:</span>
                      <span className="font-bold text-slate-800 tabular-nums">
                        {Number(p.relacion_cuota_ingreso_max).toFixed(0)}% del ingreso
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1">
                      <span className="text-slate-500">Tolerancia Mora:</span>
                      <span className="text-slate-700">
                        {p.dias_gracia_mora}d gracia
                        {Number(p.tasa_mora_anual) > 0 && ` &bull; ${Number(p.tasa_mora_anual).toFixed(2)}% TNA mora`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer de la Tarjeta */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    {p.requiere_garantia ? (
                      <Badge variant="amber">Garantía Requerida</Badge>
                    ) : (
                      <Badge variant="slate">Sin Garantía</Badge>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    ID #{p.id}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* ── Vista en Tabla Detallada ── */
        <div className="overflow-x-auto rounded-xl border border-[#e2e8f0] bg-white shadow-card">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#e2e8f0] bg-[#f8f9ff]">
                <th className="px-4 py-3.5 font-table-header text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Código
                </th>
                <th className="px-4 py-3.5 font-table-header text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Nombre Comercial
                </th>
                <th className="px-4 py-3.5 font-table-header text-[11px] font-semibold uppercase tracking-wider text-slate-500 text-center">
                  Moneda
                </th>
                <th className="px-4 py-3.5 font-table-header text-[11px] font-semibold uppercase tracking-wider text-slate-500 text-right">
                  Rango de Monto
                </th>
                <th className="px-4 py-3.5 font-table-header text-[11px] font-semibold uppercase tracking-wider text-slate-500 text-center">
                  Plazo
                </th>
                <th className="px-4 py-3.5 font-table-header text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  TNA & Sistema
                </th>
                <th className="px-4 py-3.5 font-table-header text-[11px] font-semibold uppercase tracking-wider text-slate-500 text-center">
                  Garantía
                </th>
                <th className="px-4 py-3.5 font-table-header text-[11px] font-semibold uppercase tracking-wider text-slate-500 text-right">
                  RCI Máx.
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]/80">
              {productosFiltrados.map((p) => {
                const sim = (typeof p.moneda === 'object' ? p.moneda?.simbolo : 'Bs.') || 'Bs.'
                const iso = (typeof p.moneda === 'object' ? p.moneda?.codigo_iso : 'BOB') || 'BOB'

                return (
                  <tr key={p.id} className="transition-colors hover:bg-slate-50/80">
                    <td className="px-4 py-3 text-xs font-mono font-bold text-slate-900">
                      {p.codigo}
                    </td>
                    <td className="px-4 py-3 text-xs max-w-xs">
                      <span className="font-bold text-slate-900 block">{p.nombre}</span>
                      {p.descripcion && (
                        <span className="text-[11px] text-slate-400 block line-clamp-1">{p.descripcion}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded font-mono font-bold text-xs bg-slate-100 text-slate-700 border border-slate-200">
                        {iso} ({sim})
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-right font-display font-semibold text-slate-900 tabular-nums">
                      {formatMoney(p.monto_min, sim)} – {formatMoney(p.monto_max, sim)}
                    </td>
                    <td className="px-4 py-3 text-xs text-center font-medium text-slate-700">
                      {p.plazo_min_meses} a {p.plazo_max_meses} meses
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span className="font-display font-bold text-[#064e3b] tabular-nums block">
                        {Number(p.tasa_interes_anual).toFixed(2)}% TNA
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        {p.tipo_amortizacion === 'FRANCES' ? 'Francés (Cuota fija)' : 'Alemán (Capital fijo)'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-center">
                      {p.requiere_garantia ? (
                        <Badge variant="amber">Obligatoria</Badge>
                      ) : (
                        <Badge variant="slate">No requerida</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-right font-semibold text-slate-800">
                      {Number(p.relacion_cuota_ingreso_max).toFixed(0)}%
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Nota fiduciaria */}
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-[11px] flex items-center gap-2">
        <span className="material-symbols-outlined text-[18px] text-slate-400 shrink-0">info</span>
        <span>
          Catálogo oficial de productos crediticios activos. Las condiciones mostradas son de solo lectura y rigen las evaluaciones y solicitudes vigentes. Para solicitar modificaciones o nuevos productos, comuníquese con el Administrador de la cooperativa.
        </span>
      </div>
    </div>
  )
}
