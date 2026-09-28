import { useState, useEffect, useRef } from 'react'
import PageHeader from '../../../components/ui/PageHeader'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import Skeleton from '../../../components/ui/Skeleton'
import AlertBanner from '../../../components/ui/AlertBanner'
import ComprobanteDetailModal from '../components/ComprobanteDetailModal'
import {
  formatMoney,
  formatDate,
  toCents,
  getTodayIso,
  getFirstDayOfMonthIso,
  MONEDAS_DISPONIBLES,
  getMonedaSimbolo,
  triggerCsvDownload,
  TIPO_COMPROBANTE_CONFIG,
  ESTADO_COMPROBANTE_CONFIG,
  ORIGEN_COMPROBANTE_CONFIG,
} from '../components/contabilidadUtils'
import { getLibroDiario, exportLibroDiario } from '../../../core/api/contabilidadApi'
import { getApiErrorMessage } from '../../../core/api/errors'

export default function LibroDiarioPage() {
  const [desde, setDesde] = useState(getFirstDayOfMonthIso())
  const [hasta, setHasta] = useState(getTodayIso())
  const [monedaId, setMonedaId] = useState(1)
  const [limit] = useState(50)
  const [offset, setOffset] = useState(0)

  const [data, setData] = useState({ total: 0, items: [], totales_periodo: { debe: '0.00', haber: '0.00' } })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [exporting, setExporting] = useState(false)

  // Modal para detalle de comprobante
  const [selectedComprobanteId, setSelectedComprobanteId] = useState(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)

  // Guard contra condiciones de carrera
  const requestIdRef = useRef(0)

  useEffect(() => {
    let isMounted = true
    const reqId = ++requestIdRef.current

    const params = {
      desde,
      hasta,
      moneda_id: monedaId,
      limit,
      offset,
    }

    getLibroDiario(params)
      .then((res) => {
        if (!isMounted || reqId !== requestIdRef.current) return
        setError(null)
        setData({
          total: Number(res?.total ?? 0),
          items: Array.isArray(res?.items) ? res.items : [],
          totales_periodo: res?.totales_periodo || { debe: '0.00', haber: '0.00' },
        })
      })
      .catch((err) => {
        if (!isMounted || reqId !== requestIdRef.current) return
        setError(
          getApiErrorMessage(
            err,
            'Error al cargar el Libro Diario. Verifique el rango de fechas seleccionado.',
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
  }, [desde, hasta, monedaId, limit, offset])

  function handleFilterSubmit(e) {
    e?.preventDefault()
    setOffset(0)
    setLoading(true)
  }

  function handleResetFilters() {
    setDesde(getFirstDayOfMonthIso())
    setHasta(getTodayIso())
    setMonedaId(1)
    setOffset(0)
    setLoading(true)
  }

  async function handleExportCsv() {
    setExporting(true)
    try {
      const response = await exportLibroDiario({
        desde,
        hasta,
        moneda_id: monedaId,
      })
      const defaultFilename = `libro-diario-${desde}_${hasta}.csv`
      triggerCsvDownload(
        response.data,
        defaultFilename,
        response.headers?.['content-disposition'],
      )
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          'Error al exportar el archivo CSV del Libro Diario.',
        ),
      )
    } finally {
      setExporting(false)
    }
  }

  function handlePrint() {
    window.print()
  }

  function handleOpenVoucher(id) {
    setSelectedComprobanteId(id)
    setDetailModalOpen(true)
  }

  const sim = getMonedaSimbolo(monedaId)
  const totalDebePeriodoCents = toCents(data.totales_periodo?.debe)
  const totalHaberPeriodoCents = toCents(data.totales_periodo?.haber)
  const periodIsBalanced = totalDebePeriodoCents === totalHaberPeriodoCents && (data.total === 0 || totalDebePeriodoCents > 0)

  const currentPage = Math.floor(offset / limit) + 1
  const totalPages = Math.max(1, Math.ceil(data.total / limit))

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Encabezado */}
      <PageHeader
        title="Libro Diario"
        subtitle="Registro cronológico oficial de asientos contables y partida doble (CU-W31)."
        action={
          <div className="flex items-center gap-2 print:hidden">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handlePrint}
              className="gap-1.5"
            >
              <span className="material-symbols-outlined text-[17px]">print</span>
              <span>Imprimir</span>
            </Button>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              loading={exporting}
              onClick={handleExportCsv}
              className="gap-1.5"
            >
              <span className="material-symbols-outlined text-[17px]">download</span>
              <span>Descargar CSV</span>
            </Button>
          </div>
        }
      />

      {/* Banner de error */}
      {error && (
        <AlertBanner variant="error" dismissible onDismiss={() => setError(null)} className="print:hidden">
          {error}
        </AlertBanner>
      )}

      {/* Barra de Filtros */}
      <form
        onSubmit={handleFilterSubmit}
        className="p-4 rounded-xl bg-white border border-slate-200 shadow-card space-y-3 text-xs print:hidden"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Desde */}
          <div>
            <label htmlFor="filter_desde" className="font-semibold text-slate-700 block mb-1">
              Fecha Desde:
            </label>
            <input
              id="filter_desde"
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              className="w-full h-8 px-2 border border-slate-300 rounded-lg text-xs font-mono outline-none focus:border-[#006c49]"
            />
          </div>

          {/* Hasta */}
          <div>
            <label htmlFor="filter_hasta" className="font-semibold text-slate-700 block mb-1">
              Fecha Hasta:
            </label>
            <input
              id="filter_hasta"
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              className="w-full h-8 px-2 border border-slate-300 rounded-lg text-xs font-mono outline-none focus:border-[#006c49]"
            />
          </div>

          {/* Moneda */}
          <div>
            <label htmlFor="filter_moneda" className="font-semibold text-slate-700 block mb-1">
              Moneda:
            </label>
            <select
              id="filter_moneda"
              value={monedaId}
              onChange={(e) => setMonedaId(Number(e.target.value))}
              className="w-full h-8 px-2 border border-slate-300 rounded-lg text-xs outline-none focus:border-[#006c49]"
            >
              {MONEDAS_DISPONIBLES.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Acciones */}
          <div className="flex items-end gap-2">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={loading}
              className="!bg-[#064e3b] gap-1 h-8 flex-1"
            >
              <span className="material-symbols-outlined text-[15px]">filter_list</span>
              <span>Filtrar</span>
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-8 text-slate-500"
            >
              Restablecer
            </Button>
          </div>
        </div>
      </form>

      {/* Tarjetas Resumen de Totales del Periodo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-card">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Asientos en Rango
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-slate-900">
              {loading ? '—' : data.total}
            </span>
            <span className="text-xs text-slate-500">comprobantes</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-card">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Total Debe del Periodo
          </span>
          <span className="text-xl font-bold font-mono text-[#064e3b]">
            {loading ? '—' : formatMoney(data.totales_periodo?.debe, sim)}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-card">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Total Haber del Periodo
          </span>
          <span className="text-xl font-bold font-mono text-[#064e3b]">
            {loading ? '—' : formatMoney(data.totales_periodo?.haber, sim)}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-card flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Verificación de Cuadre
          </span>
          <div>
            {loading ? (
              <span className="text-xs text-slate-400">Verificando...</span>
            ) : periodIsBalanced ? (
              <Badge variant="green" className="gap-1 !text-xs !py-1 !px-2.5 font-semibold">
                <span className="material-symbols-outlined text-[15px]">check_circle</span>
                <span>Partida Doble Cuadrada</span>
              </Badge>
            ) : (
              <Badge variant="red" className="gap-1 !text-xs !py-1 !px-2.5 font-semibold">
                <span className="material-symbols-outlined text-[15px]">warning</span>
                <span>Descuadre Detectado</span>
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Encabezado visible únicamente en impresión */}
      <div className="hidden print:block mb-4 text-center border-b pb-3">
        <h1 className="text-lg font-bold text-slate-900">LIBRO DIARIO GENERAL</h1>
        <p className="text-xs text-slate-600">
          Periodo: {formatDate(desde)} al {formatDate(hasta)} | Moneda: {sim}
        </p>
      </div>

      {/* Contenedor de Comprobantes Agrupados */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-card space-y-4">
            <Skeleton className="h-7 w-64" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : data.items.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-xl border border-slate-200 shadow-card space-y-2">
            <span className="material-symbols-outlined text-[42px] text-slate-300 block mb-1">
              menu_book
            </span>
            <p className="text-sm font-semibold text-slate-700">
              No existen comprobantes registrados en el periodo seleccionado
            </p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Intente ajustar el rango de fechas o cambie la moneda de consulta.
            </p>
          </div>
        ) : (
          data.items.map((c) => {
            const lines = Array.isArray(c.lineas) ? c.lineas : []
            const isAnulado = c.estado === 'ANULADO'
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

            // Totales del comprobante
            const voucherDebe = lines.reduce((acc, l) => acc + toCents(l.debe), 0)
            const voucherHaber = lines.reduce((acc, l) => acc + toCents(l.haber), 0)

            return (
              <div
                key={c.id}
                className={`bg-white rounded-xl border shadow-card overflow-hidden transition break-inside-avoid ${
                  isAnulado ? 'border-red-200 bg-red-50/20' : 'border-slate-200'
                }`}
              >
                {/* Cabecera del Comprobante */}
                <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenVoucher(c.id)}
                      className="font-mono text-sm font-bold text-[#064e3b] hover:underline cursor-pointer flex items-center gap-1"
                      title="Ver detalle del comprobante"
                    >
                      <span>{c.numero}</span>
                      <span className="material-symbols-outlined text-[15px] opacity-70 print:hidden">
                        open_in_new
                      </span>
                    </button>

                    <span className="text-slate-500 font-mono">
                      {formatDate(c.fecha_contable)}
                    </span>

                    <Badge variant={tipoCfg.badgeVariant}>{tipoCfg.label}</Badge>
                    <Badge variant={origenCfg.badgeVariant}>{origenCfg.label}</Badge>
                    <Badge variant={estadoCfg.badgeVariant}>{estadoCfg.label}</Badge>

                    {isAnulado && (
                      <span className="text-[11px] font-semibold text-red-700 bg-red-100 px-2 py-0.5 rounded">
                        {c.anulado_por_numero
                          ? `Anulado por reversión #${c.anulado_por_numero}`
                          : 'Comprobante Anulado'}
                      </span>
                    )}

                    {c.revierte_a_numero && (
                      <span className="text-[11px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                        Reversión de #{c.revierte_a_numero}
                      </span>
                    )}
                  </div>

                  <div className="text-slate-600 truncate max-w-md font-medium text-[11px]">
                    {c.glosa || 'Sin glosa general'}
                  </div>
                </div>

                {/* Tabla de Líneas del Asiento */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/50 border-b border-slate-200 text-slate-500 text-[11px]">
                      <tr>
                        <th className="py-1.5 px-4 w-12 text-center">#</th>
                        <th className="py-1.5 px-3 min-w-[220px]">Cuenta Contable</th>
                        <th className="py-1.5 px-3">Glosa Específica</th>
                        <th className="py-1.5 px-4 w-28 text-right">Debe ({sim})</th>
                        <th className="py-1.5 px-4 w-28 text-right">Haber ({sim})</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {lines.map((l, idx) => {
                        const cuenta = l.cuenta || {}
                        return (
                          <tr key={l.id || idx} className="hover:bg-slate-50/60">
                            <td className="py-1.5 px-4 text-center text-slate-400 font-mono text-[11px]">
                              {l.orden || idx + 1}
                            </td>
                            <td className="py-1.5 px-3">
                              <span className="font-mono font-bold text-[#064e3b] mr-2">
                                {cuenta.codigo || '—'}
                              </span>
                              <span className="text-slate-800 font-medium">
                                {cuenta.nombre || ''}
                              </span>
                            </td>
                            <td className="py-1.5 px-3 text-slate-600 text-[11px]">
                              {l.glosa || '—'}
                            </td>
                            <td className="py-1.5 px-4 text-right font-mono font-semibold text-slate-900">
                              {parseFloat(l.debe ?? 0) > 0 ? formatMoney(l.debe, sim) : '—'}
                            </td>
                            <td className="py-1.5 px-4 text-right font-mono font-semibold text-slate-900">
                              {parseFloat(l.haber ?? 0) > 0 ? formatMoney(l.haber, sim) : '—'}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                    <tfoot className="bg-slate-50/80 border-t border-slate-200 font-semibold text-[11px]">
                      <tr>
                        <td colSpan={3} className="py-1.5 px-4 text-right text-slate-600 uppercase tracking-wider">
                          Subtotales Asiento:
                        </td>
                        <td className="py-1.5 px-4 text-right font-mono text-slate-900">
                          {formatMoney(voucherDebe / 100, sim)}
                        </td>
                        <td className="py-1.5 px-4 text-right font-mono text-slate-900">
                          {formatMoney(voucherHaber / 100, sim)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )
          })
        )}

        {/* Paginación */}
        {data.total > limit && (
          <div className="flex items-center justify-between px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-600 print:hidden">
            <div>
              Mostrando <strong>{offset + 1}</strong> a{' '}
              <strong>{Math.min(offset + limit, data.total)}</strong> de{' '}
              <strong>{data.total}</strong> comprobantes
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
                disabled={offset + limit >= data.total}
                onClick={() => setOffset((prev) => prev + limit)}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Detalle */}
      <ComprobanteDetailModal
        comprobanteId={selectedComprobanteId}
        open={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false)
          setSelectedComprobanteId(null)
        }}
        onNavigateToVoucher={(targetId) => setSelectedComprobanteId(targetId)}
      />
    </div>
  )
}
