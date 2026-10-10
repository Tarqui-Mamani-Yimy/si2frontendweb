import { useState, useEffect, useRef } from 'react'
import PageHeader from '../../../components/ui/PageHeader'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import Skeleton from '../../../components/ui/Skeleton'
import AlertBanner from '../../../components/ui/AlertBanner'
import {
  formatMoney,
  formatDate,
  getTodayIso,
  getFirstDayOfMonthIso,
  MONEDAS_DISPONIBLES,
  getMonedaSimbolo,
  triggerCsvDownload,
} from '../components/contabilidadUtils'
import {
  getBalanceComprobacion,
  exportBalanceComprobacion,
} from '../../../core/api/contabilidadApi'
import { getApiErrorMessage } from '../../../core/api/errors'

const NIVELES_CATALOGO = [
  { id: 1, label: 'Nivel 1 — Clase (100..900)' },
  { id: 2, label: 'Nivel 2 — Grupo (110..920)' },
  { id: 3, label: 'Nivel 3 — Cuenta (111..921)' },
  { id: 4, label: 'Nivel 4 — Subcuenta Oficial ASFI (Recomendado)' },
  { id: 5, label: 'Nivel 5 — Analítica (Detalle Cooperativo)' },
]

export default function BalanceComprobacionPage() {
  const [desde, setDesde] = useState(getFirstDayOfMonthIso())
  const [hasta, setHasta] = useState(getTodayIso())
  const [monedaId, setMonedaId] = useState(1)
  const [nivel, setNivel] = useState(4)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [exporting, setExporting] = useState(false)

  // Guard contra condiciones de carrera
  const requestIdRef = useRef(0)

  useEffect(() => {
    let isMounted = true
    const reqId = ++requestIdRef.current

    const params = {
      desde,
      hasta,
      moneda_id: monedaId,
      nivel,
    }

    getBalanceComprobacion(params)
      .then((res) => {
        if (!isMounted || reqId !== requestIdRef.current) return
        setError(null)
        setData(res)
      })
      .catch((err) => {
        if (!isMounted || reqId !== requestIdRef.current) return
        setError(
          getApiErrorMessage(
            err,
            'Error al cargar el Balance de Comprobación de Sumas y Saldos.',
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
  }, [desde, hasta, monedaId, nivel, refreshTrigger])

  function handleFilterSubmit(e) {
    e?.preventDefault()
    setLoading(true)
    setRefreshTrigger((k) => k + 1)
  }

  function handleResetFilters() {
    setDesde(getFirstDayOfMonthIso())
    setHasta(getTodayIso())
    setMonedaId(1)
    setNivel(4)
    setLoading(true)
    setRefreshTrigger((k) => k + 1)
  }

  async function handleExportCsv() {
    setExporting(true)
    try {
      const response = await exportBalanceComprobacion({
        desde,
        hasta,
        moneda_id: monedaId,
        nivel,
      })
      const defaultFilename = `balance-comprobacion-nivel${nivel}-${desde}_${hasta}.csv`
      triggerCsvDownload(
        response.data,
        defaultFilename,
        response.headers?.['content-disposition'],
      )
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          'Error al exportar el archivo CSV del Balance de Comprobación.',
        ),
      )
    } finally {
      setExporting(false)
    }
  }

  function handlePrint() {
    window.print()
  }

  const sim = getMonedaSimbolo(monedaId)
  const items = Array.isArray(data?.items) ? data.items : []
  const totales = data?.totales || {
    sumas_debe: '0.00',
    sumas_haber: '0.00',
    saldo_deudor: '0.00',
    saldo_acreedor: '0.00',
  }
  const cuadra = data?.cuadra === true

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Encabezado */}
      <PageHeader
        title="Balance de Comprobación"
        subtitle="Sumas del periodo y saldos acumulados de la nomenclatura contable (CU-W31)."
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3 items-end">
          {/* Desde */}
          <div className="md:col-span-3">
            <label htmlFor="bal_desde" className="font-semibold text-slate-700 block mb-1">
              Fecha Desde:
            </label>
            <input
              id="bal_desde"
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              className="w-full h-8 px-2 border border-slate-300 rounded-lg text-xs font-mono outline-none focus:border-[#006c49]"
            />
          </div>

          {/* Hasta */}
          <div className="md:col-span-3">
            <label htmlFor="bal_hasta" className="font-semibold text-slate-700 block mb-1">
              Fecha Hasta:
            </label>
            <input
              id="bal_hasta"
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              className="w-full h-8 px-2 border border-slate-300 rounded-lg text-xs font-mono outline-none focus:border-[#006c49]"
            />
          </div>

          {/* Moneda */}
          <div className="md:col-span-2">
            <label htmlFor="bal_moneda" className="font-semibold text-slate-700 block mb-1">
              Moneda:
            </label>
            <select
              id="bal_moneda"
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

          {/* Nivel de Agrupación */}
          <div className="md:col-span-3">
            <label htmlFor="bal_nivel" className="font-semibold text-slate-700 block mb-1">
              Nivel de Agregación MCEF:
            </label>
            <select
              id="bal_nivel"
              value={nivel}
              onChange={(e) => setNivel(Number(e.target.value))}
              className="w-full h-8 px-2 border border-slate-300 rounded-lg text-xs outline-none focus:border-[#006c49]"
            >
              {NIVELES_CATALOGO.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.label}
                </option>
              ))}
            </select>
          </div>

          {/* Botones */}
          <div className="md:col-span-1 flex items-center gap-1">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={loading}
              className="!bg-[#064e3b] w-full h-8"
              title="Filtrar Balance"
            >
              <span className="material-symbols-outlined text-[16px]">filter_list</span>
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

      {/* Banner de Estado de Cuadre */}
      <div
        className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${
          loading
            ? 'bg-slate-50 border-slate-200'
            : cuadra
              ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
              : 'bg-red-50 border-red-300 text-red-950'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <span
            className={`material-symbols-outlined text-[24px] ${
              loading
                ? 'text-slate-400'
                : cuadra
                  ? 'text-[#064e3b]'
                  : 'text-red-600'
            }`}
          >
            {loading ? 'hourglass_top' : cuadra ? 'verified' : 'error'}
          </span>
          <div>
            <h3 className="font-bold text-sm leading-tight">
              {loading
                ? 'Calculando balance de comprobación...'
                : cuadra
                  ? 'BALANCE CUADRADO — Partida Doble Verificada'
                  : 'DESCUADRE CONTABLE DETECTADO'}
            </h3>
            <p className="text-xs opacity-90 mt-0.5">
              {data?.criterio ||
                'Sumas calculadas para el periodo seleccionado; saldos acumulados a la fecha de corte.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {loading ? (
            <Badge variant="slate">Procesando</Badge>
          ) : cuadra ? (
            <Badge variant="green" className="font-bold uppercase tracking-wider text-xs py-1 px-3">
              Cuadra
            </Badge>
          ) : (
            <Badge variant="red" className="font-bold uppercase tracking-wider text-xs py-1 px-3">
              No Cuadra
            </Badge>
          )}
        </div>
      </div>

      {/* Tarjetas Resumen de Totales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-card">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Sumas Debe (Periodo)
          </span>
          <span className="text-lg font-bold font-mono text-slate-900">
            {loading ? '—' : formatMoney(totales.sumas_debe, sim)}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-card">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Sumas Haber (Periodo)
          </span>
          <span className="text-lg font-bold font-mono text-slate-900">
            {loading ? '—' : formatMoney(totales.sumas_haber, sim)}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-card">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Saldo Deudor Acumulado
          </span>
          <span className="text-lg font-bold font-mono text-emerald-800">
            {loading ? '—' : formatMoney(totales.saldo_deudor, sim)}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-card">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Saldo Acreedor Acumulado
          </span>
          <span className="text-lg font-bold font-mono text-indigo-800">
            {loading ? '—' : formatMoney(totales.saldo_acreedor, sim)}
          </span>
        </div>
      </div>

      {/* Encabezado visible únicamente en impresión */}
      <div className="hidden print:block mb-4 text-center border-b pb-3">
        <h1 className="text-lg font-bold text-slate-900">
          BALANCE DE COMPROBACIÓN DE SUMAS Y SALDOS
        </h1>
        <p className="text-xs text-slate-600">
          Periodo: {formatDate(desde)} al {formatDate(hasta)} | Moneda: {sim} | Nivel:{' '}
          {NIVELES_CATALOGO.find((n) => n.id === nivel)?.label || nivel}
        </p>
      </div>

      {/* Tabla del Balance */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <span className="material-symbols-outlined text-[40px] text-slate-300 block mb-1">
              balance
            </span>
            <p className="text-sm font-semibold text-slate-700">
              No se encontraron cuentas con saldo o movimientos
            </p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Ajuste el rango de fechas o el nivel de agregación seleccionado.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th rowSpan={2} className="py-2.5 px-3 border-r border-slate-200 w-24">
                    Código
                  </th>
                  <th rowSpan={2} className="py-2.5 px-4 min-w-[220px] border-r border-slate-200">
                    Nombre de Cuenta
                  </th>
                  <th rowSpan={2} className="py-2.5 px-2 text-center border-r border-slate-200 w-14">
                    Nat.
                  </th>
                  <th colSpan={2} className="py-1 px-3 text-center border-b border-r border-slate-200 bg-slate-100/70">
                    Sumas del Periodo
                  </th>
                  <th colSpan={2} className="py-1 px-3 text-center border-b border-slate-200 bg-slate-100/70">
                    Saldos Acumulados
                  </th>
                </tr>
                <tr>
                  <th className="py-1.5 px-3 text-right w-28 border-r border-slate-200 text-slate-600">
                    Debe ({sim})
                  </th>
                  <th className="py-1.5 px-3 text-right w-28 border-r border-slate-200 text-slate-600">
                    Haber ({sim})
                  </th>
                  <th className="py-1.5 px-3 text-right w-28 border-r border-slate-200 text-emerald-800">
                    Deudor ({sim})
                  </th>
                  <th className="py-1.5 px-3 text-right w-28 text-indigo-800">
                    Acreedor ({sim})
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {items.map((it, idx) => {
                  const esDeudora = it.naturaleza === 'DEUDORA'
                  return (
                    <tr key={it.codigo || idx} className="hover:bg-slate-50/70 transition">
                      <td className="py-2 px-3 font-mono font-bold text-[#064e3b] border-r border-slate-100">
                        {it.codigo}
                      </td>

                      <td className="py-2 px-4 text-slate-800 font-medium border-r border-slate-100">
                        {it.nombre}
                      </td>

                      <td className="py-2 px-2 text-center border-r border-slate-100">
                        <Badge
                          variant={esDeudora ? 'teal' : 'navy'}
                          className="!text-[9px] !py-0 !px-1.5"
                          title={esDeudora ? 'Naturaleza Deudora' : 'Naturaleza Acreedora'}
                        >
                          {esDeudora ? 'D' : 'A'}
                        </Badge>
                      </td>

                      <td className="py-2 px-3 text-right font-mono text-slate-900 border-r border-slate-100">
                        {parseFloat(it.sumas?.debe ?? 0) > 0 ? formatMoney(it.sumas.debe, sim) : '—'}
                      </td>

                      <td className="py-2 px-3 text-right font-mono text-slate-900 border-r border-slate-100">
                        {parseFloat(it.sumas?.haber ?? 0) > 0 ? formatMoney(it.sumas.haber, sim) : '—'}
                      </td>

                      <td className="py-2 px-3 text-right font-mono font-semibold text-emerald-800 border-r border-slate-100">
                        {parseFloat(it.saldos?.deudor ?? 0) > 0 ? formatMoney(it.saldos.deudor, sim) : '—'}
                      </td>

                      <td className="py-2 px-3 text-right font-mono font-semibold text-indigo-800">
                        {parseFloat(it.saldos?.acreedor ?? 0) > 0 ? formatMoney(it.saldos.acreedor, sim) : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot className="bg-slate-50/95 border-t-2 border-slate-300 font-semibold text-xs">
                <tr>
                  <td colSpan={3} className="py-3 px-4 text-right font-bold text-slate-800 uppercase tracking-wider border-r border-slate-200">
                    Totales Generales:
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 border-r border-slate-200">
                    {formatMoney(totales.sumas_debe, sim)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 border-r border-slate-200">
                    {formatMoney(totales.sumas_haber, sim)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-emerald-900 border-r border-slate-200">
                    {formatMoney(totales.saldo_deudor, sim)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-indigo-900">
                    {formatMoney(totales.saldo_acreedor, sim)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
