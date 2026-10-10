import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../../../components/ui/PageHeader'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import Skeleton from '../../../components/ui/Skeleton'
import AlertBanner from '../../../components/ui/AlertBanner'
import {
  formatMoney,
  toCents,
  formatDate,
  getTodayIso,
  getFirstDayOfYearIso,
  formatExchangeRate,
  MODOS_MONEDA,
  triggerCsvDownload,
} from '../components/contabilidadUtils'
import {
  getEstadoResultados,
  exportEstadoResultados,
} from '../../../core/api/contabilidadApi'
import { getApiErrorMessage } from '../../../core/api/errors'

export default function EstadoResultadosPage() {
  const [desde, setDesde] = useState(getFirstDayOfYearIso())
  const [hasta, setHasta] = useState(getTodayIso())
  const [moneda, setMoneda] = useState('CONSOLIDADO') // CONSOLIDADO | BOB | USD
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [missingTcMessage, setMissingTcMessage] = useState(null)
  const [exporting, setExporting] = useState(false)

  // Control de grupos expandidos (código de grupo como clave)
  const [expandedGroups, setExpandedGroups] = useState(new Set())

  // Guard contra condiciones de carrera
  const requestIdRef = useRef(0)

  const isDifferentYear = Boolean(desde && hasta && desde.slice(0, 4) !== hasta.slice(0, 4))
  const effectiveLoading = loading && !isDifferentYear

  useEffect(() => {
    // Si el año difiere, no ejecutamos la petición
    if (isDifferentYear) {
      return
    }

    let isMounted = true
    const reqId = ++requestIdRef.current

    const params = {
      desde,
      hasta,
      moneda,
    }

    getEstadoResultados(params)
      .then((res) => {
        if (!isMounted || reqId !== requestIdRef.current) return
        setError(null)
        setMissingTcMessage(null)
        setData(res)
      })
      .catch((err) => {
        if (!isMounted || reqId !== requestIdRef.current) return
        const errMsg = getApiErrorMessage(
          err,
          'Error al emitir el Estado de Resultados.',
        )
        if (
          err.response?.status === 422 &&
          (errMsg.toLowerCase().includes('tipo de cambio') ||
            errMsg.toLowerCase().includes('cotización') ||
            errMsg.toLowerCase().includes('tc'))
        ) {
          setMissingTcMessage(errMsg)
          setError(null)
        } else {
          setError(errMsg)
          setMissingTcMessage(null)
        }
      })
      .finally(() => {
        if (isMounted && reqId === requestIdRef.current) {
          setLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [desde, hasta, moneda, refreshTrigger, isDifferentYear])

  function handleFilterSubmit(e) {
    e?.preventDefault()
    if (isDifferentYear) return
    setLoading(true)
    setRefreshTrigger((k) => k + 1)
  }

  function handleResetFilters() {
    setDesde(getFirstDayOfYearIso())
    setHasta(getTodayIso())
    setMoneda('CONSOLIDADO')
    setLoading(true)
    setRefreshTrigger((k) => k + 1)
  }

  async function handleExportCsv() {
    setExporting(true)
    try {
      const response = await exportEstadoResultados({
        desde,
        hasta,
        moneda,
      })
      const defaultFilename = `estado-resultados-${moneda}-${desde}_${hasta}.csv`
      triggerCsvDownload(
        response.data,
        defaultFilename,
        response.headers?.['content-disposition'],
      )
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          'Error al exportar el Estado de Resultados a CSV.',
        ),
      )
    } finally {
      setExporting(false)
    }
  }

  function handlePrint() {
    globalThis.print()
  }

  function toggleGroup(groupCode) {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(groupCode)) {
        next.delete(groupCode)
      } else {
        next.add(groupCode)
      }
      return next
    })
  }

  function handleToggleAll(expand) {
    if (!expand) {
      setExpandedGroups(new Set())
      return
    }
    const allCodes = new Set()
    const lineas = Array.isArray(data?.lineas) ? data.lineas : []
    lineas.forEach((l) => {
      l.componentes?.forEach((g) => {
        if (g.cuentas && g.cuentas.length > 0) {
          allCodes.add(g.codigo)
        }
      })
    })
    setExpandedGroups(allCodes)
  }

  const sim = moneda === 'USD' ? '$' : 'Bs.'
  const resultadoNetoGestion =
    data?.resultado_neto_gestion != null ? data.resultado_neto_gestion : null
  const isResultadoPositivo =
    resultadoNetoGestion != null && toCents(resultadoNetoGestion) >= 0

  const lineas = Array.isArray(data?.lineas) ? data.lineas : []

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Encabezado */}
      <PageHeader
        title="Estado de Resultados"
        subtitle="Estado de Rendimiento Económico por Escalera MCEF (CU-W32)."
        action={
          <div className="flex items-center gap-2 print:hidden">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handlePrint}
              disabled={!data}
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
              disabled={!data}
              className="gap-1.5"
            >
              <span className="material-symbols-outlined text-[17px]">download</span>
              <span>Descargar CSV</span>
            </Button>
          </div>
        }
      />

      {/* Banner de error por falta de tipo de cambio con enlace a registrar */}
      {missingTcMessage && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 flex flex-wrap items-center justify-between gap-3 print:hidden shadow-xs">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-amber-600 text-[26px]">
              warning
            </span>
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-amber-900">
                Tipo de Cambio Requerido
              </h4>
              <p className="text-xs text-amber-800 mt-0.5">{missingTcMessage}</p>
            </div>
          </div>

          <Link
            to="/contador/tipos-cambio"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#064e3b] hover:bg-[#043d2e] text-white rounded-lg text-xs font-semibold shadow-xs transition"
          >
            <span className="material-symbols-outlined text-[16px]">currency_exchange</span>
            <span>Registrar Tipo de Cambio</span>
          </Link>
        </div>
      )}

      {(error || isDifferentYear) && (
        <AlertBanner
          variant="error"
          dismissible={!isDifferentYear}
          onDismiss={() => setError(null)}
          className="print:hidden"
        >
          {isDifferentYear
            ? 'El rango de fechas debe pertenecer a la misma gestión anual (mismo año fiscal).'
            : error}
        </AlertBanner>
      )}

      {/* Barra de Filtros */}
      <form
        onSubmit={handleFilterSubmit}
        className="p-4 rounded-xl bg-white border border-slate-200 shadow-card space-y-3 text-xs print:hidden"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3 items-end">
          {/* Desde */}
          <div className="md:col-span-3">
            <label htmlFor="er_desde" className="font-semibold text-slate-700 block mb-1">
              Fecha Desde:
            </label>
            <input
              id="er_desde"
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              className="w-full h-8 px-2 border border-slate-300 rounded-lg text-xs font-mono outline-none focus:border-[#006c49]"
            />
          </div>

          {/* Hasta */}
          <div className="md:col-span-3">
            <label htmlFor="er_hasta" className="font-semibold text-slate-700 block mb-1">
              Fecha Hasta:
            </label>
            <input
              id="er_hasta"
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              className="w-full h-8 px-2 border border-slate-300 rounded-lg text-xs font-mono outline-none focus:border-[#006c49]"
            />
          </div>

          {/* Modo de Moneda */}
          <div className="md:col-span-4">
            <label htmlFor="er_moneda" className="font-semibold text-slate-700 block mb-1">
              Modo de Expresión Monetaria:
            </label>
            <select
              id="er_moneda"
              value={moneda}
              onChange={(e) => setMoneda(e.target.value)}
              className="w-full h-8 px-2 border border-slate-300 rounded-lg text-xs outline-none focus:border-[#006c49]"
            >
              {MODOS_MONEDA.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* Botones */}
          <div className="md:col-span-2 flex items-center gap-1">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={effectiveLoading}
              className="!bg-[#064e3b] w-full h-8"
              title="Actualizar Estado de Resultados"
            >
              <span className="material-symbols-outlined text-[16px]">filter_list</span>
              <span>Filtrar</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-8 px-2 text-slate-400 hover:text-slate-600"
              title="Restablecer"
            >
              <span className="material-symbols-outlined text-[16px]">restart_alt</span>
            </Button>
          </div>
        </div>
      </form>

      {/* Banner de Valuación y Parámetros */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-[#064e3b]">
            analytics
          </span>
          <div>
            <span className="font-bold text-slate-900 block">
              Formato Normativo: {data?.formato || 'MCEF grupos (Título II)'}
            </span>
            <span className="text-slate-500 text-[11px]">
              {data?.criterio_conversion ||
                'Movimientos del periodo evaluados al tipo de cambio oficial vigente a la fecha de corte.'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {data?.tipo_cambio && (
            <Badge variant="navy" className="text-xs py-1 px-2.5">
              TC: 1 USD = {formatExchangeRate(data.tipo_cambio.valor)} Bs. ({formatDate(data.tipo_cambio.fecha)})
            </Badge>
          )}

          <div className="flex items-center gap-1 print:hidden">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => handleToggleAll(true)}
              className="!text-[11px] !py-1 !px-2"
            >
              Expandir Cuentas
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleToggleAll(false)}
              className="!text-[11px] !py-1 !px-2 text-slate-500"
            >
              Colapsar
            </Button>
          </div>
        </div>
      </div>

      {/* Encabezado visible únicamente en impresión */}
      <div className="hidden print:block mb-4 text-center border-b pb-3">
        <h1 className="text-lg font-bold text-slate-900 uppercase">
          ESTADO DE RESULTADOS (RENDIMIENTO ECONÓMICO)
        </h1>
        <p className="text-xs text-slate-600">
          Del {formatDate(desde)} al {formatDate(hasta)} | Moneda: {sim} ({moneda})
          {data?.tipo_cambio && ` | TC Oficial: ${formatExchangeRate(data.tipo_cambio.valor)}`}
        </p>
      </div>

      {/* Tarjeta de Honor: Resultado Neto de la Gestión */}
      {resultadoNetoGestion !== null && !effectiveLoading && (
        <div
          className={`p-5 rounded-xl border-2 flex flex-wrap items-center justify-between gap-4 shadow-sm ${
            isResultadoPositivo
              ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
              : 'bg-red-50/70 border-red-300 text-red-950'
          }`}
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm uppercase tracking-wider">
                {isResultadoPositivo ? 'Resultado Neto: Utilidad del Ejercicio' : 'Resultado Neto: Pérdida del Ejercicio'}
              </span>
              <Badge variant={isResultadoPositivo ? 'green' : 'red'}>
                {isResultadoPositivo ? 'Utilidad Neta' : 'Pérdida Neta'}
              </Badge>
            </div>
            <p className="text-xs opacity-80">
              Coincide exactamente con el resultado de la gestión reflejado en el Patrimonio del Balance General.
            </p>
          </div>

          <div className="text-right font-mono">
            <span className="text-[11px] font-bold uppercase tracking-wider block opacity-70">
              Monto Neto
            </span>
            <span className={`text-2xl font-bold ${isResultadoPositivo ? 'text-[#064e3b]' : 'text-red-700'}`}>
              {formatMoney(resultadoNetoGestion, sim)}
            </span>
          </div>
        </div>
      )}

      {/* Escalera de Subtotales (Tabla Interactiva MCEF) */}
      {effectiveLoading ? (
        <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-card space-y-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : !data || lineas.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200 shadow-card space-y-2">
          <span className="material-symbols-outlined text-[42px] text-slate-300 block mb-1">
            query_stats
          </span>
          <p className="text-sm font-semibold text-slate-700">
            Sin movimientos registrados para el periodo seleccionado
          </p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Verifique las fechas consultadas o compruebe los registros contables en el Libro Diario.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-2.5 px-4 w-12 text-center">#</th>
                  <th className="py-2.5 px-4 min-w-[320px]">
                    Concepto / Escalera de Subtotales MCEF
                  </th>
                  <th className="py-2.5 px-4 text-right w-40">Importe Parcial ({sim})</th>
                  <th className="py-2.5 px-4 text-right w-44">Subtotal Acumulado ({sim})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {lineas.map((linea, lIdx) => {
                  const isSubtotalNeg = toCents(linea.monto) < 0
                  const componentes = Array.isArray(linea.componentes) ? linea.componentes : []

                  return (
                    <tr key={lIdx} className="contents">
                      {/* Filas de los grupos componentes del paso */}
                      {componentes.map((g) => {
                        const isExpanded = expandedGroups.has(g.codigo)
                        const cuentas = Array.isArray(g.cuentas) ? g.cuentas : []
                        const hasCuentas = cuentas.length > 0
                        const isGrpNeg = toCents(g.monto) < 0
                        const signoLabel = isGrpNeg ? '(−)' : '(+)'

                        return (
                          <tr key={g.codigo} className="contents">
                            <tr className="hover:bg-slate-50/80 transition text-slate-700">
                              <td className="py-2 px-4 text-center font-mono text-[11px] text-slate-400">
                                {g.codigo}
                              </td>
                              <td className="py-2 px-4">
                                <div className="flex items-center gap-2">
                                  <span className={`font-mono font-bold text-[11px] ${isGrpNeg ? 'text-red-700' : 'text-emerald-800'}`}>
                                    {signoLabel}
                                  </span>
                                  <span className="font-semibold text-slate-900">
                                    {g.nombre}
                                  </span>

                                  {hasCuentas && (
                                    <button
                                      type="button"
                                      onClick={() => toggleGroup(g.codigo)}
                                      className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] text-slate-500 bg-slate-100 hover:bg-slate-200 cursor-pointer print:hidden transition"
                                      title={isExpanded ? 'Colapsar cuentas' : 'Ver cuentas'}
                                    >
                                      <span>{cuentas.length} cuentas</span>
                                      <span className="material-symbols-outlined text-[14px]">
                                        {isExpanded ? 'expand_less' : 'expand_more'}
                                      </span>
                                    </button>
                                  )}
                                </div>
                              </td>
                              <td className={`py-2 px-4 text-right font-mono font-semibold ${isGrpNeg ? 'text-red-700' : 'text-slate-900'}`}>
                                {formatMoney(g.monto, sim)}
                              </td>
                              <td className="py-2 px-4 text-right font-mono text-slate-400 text-[11px]">
                                —
                              </td>
                            </tr>

                            {/* Cuentas Hijas desplegables */}
                            {isExpanded &&
                              hasCuentas &&
                              cuentas.map((c) => {
                                const isCtaNeg = toCents(c.monto) < 0
                                return (
                                  <tr
                                    key={c.codigo}
                                    className="bg-slate-50/60 text-slate-500 text-[11px]"
                                  >
                                    <td className="py-1 px-4 text-center font-mono text-[10px] text-slate-400">
                                      {c.codigo}
                                    </td>
                                    <td className="py-1 px-4 pl-12 text-slate-700">
                                      {c.nombre}
                                    </td>
                                    <td className={`py-1 px-4 text-right font-mono ${isCtaNeg ? 'text-red-700' : 'text-slate-600'}`}>
                                      {formatMoney(c.monto, sim)}
                                    </td>
                                    <td className="py-1 px-4 text-right text-slate-300">
                                      —
                                    </td>
                                  </tr>
                                )
                              })}
                          </tr>
                        )
                      })}

                      {/* Fila del Subtotal del Paso */}
                      <tr className="bg-slate-100/90 font-bold border-t border-b border-slate-300 text-slate-900 text-xs">
                        <td className="py-2.5 px-4 text-center font-mono text-slate-500">
                          ={lIdx + 1}
                        </td>
                        <td className="py-2.5 px-4 uppercase tracking-tight text-[#064e3b]">
                          {linea.subtotal}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono text-slate-400 text-[11px]">
                          Subtotal
                        </td>
                        <td className={`py-2.5 px-4 text-right font-mono text-sm ${isSubtotalNeg ? 'text-red-700' : 'text-[#064e3b]'}`}>
                          {formatMoney(linea.monto, sim)}
                        </td>
                      </tr>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
