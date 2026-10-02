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
  fromCents,
  formatDate,
  getTodayIso,
  formatExchangeRate,
  MODOS_MONEDA,
  triggerCsvDownload,
} from '../components/contabilidadUtils'
import {
  getBalanceGeneral,
  exportBalanceGeneral,
} from '../../../core/api/contabilidadApi'
import { getApiErrorMessage } from '../../../core/api/errors'

export default function BalanceGeneralPage() {
  const [fechaCorte, setFechaCorte] = useState(getTodayIso())
  const [moneda, setMoneda] = useState('CONSOLIDADO') // CONSOLIDADO | BOB | USD
  const [nivel, setNivel] = useState(3) // 2 (solo grupos) | 3 (grupos y cuentas)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [missingTcMessage, setMissingTcMessage] = useState(null)
  const [exporting, setExporting] = useState(false)

  // Guard contra condiciones de carrera
  const requestIdRef = useRef(0)

  useEffect(() => {
    let isMounted = true
    const reqId = ++requestIdRef.current

    const params = {
      fecha_corte: fechaCorte,
      moneda,
      nivel,
    }

    getBalanceGeneral(params)
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
          'Error al emitir el Balance General.',
        )
        // Detectar si el backend señala falta de tipo de cambio
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
  }, [fechaCorte, moneda, nivel, refreshTrigger])

  function handleFilterSubmit(e) {
    e?.preventDefault()
    setLoading(true)
    setRefreshTrigger((k) => k + 1)
  }

  function handleResetFilters() {
    setFechaCorte(getTodayIso())
    setMoneda('CONSOLIDADO')
    setNivel(3)
    setLoading(true)
    setRefreshTrigger((k) => k + 1)
  }

  async function handleExportCsv() {
    setExporting(true)
    try {
      const response = await exportBalanceGeneral({
        fecha_corte: fechaCorte,
        moneda,
        nivel,
      })
      const defaultFilename = `balance-general-${moneda}-${fechaCorte}.csv`
      triggerCsvDownload(
        response.data,
        defaultFilename,
        response.headers?.['content-disposition'],
      )
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          'Error al exportar el Balance General a CSV.',
        ),
      )
    } finally {
      setExporting(false)
    }
  }

  function handlePrint() {
    globalThis.print()
  }

  const sim = moneda === 'USD' ? '$' : 'Bs.'
  const totalActivo = data?.total_activo ?? '0.00'
  const totalPasivo = data?.total_pasivo ?? '0.00'
  const totalPatrimonio = data?.total_patrimonio ?? '0.00'
  const totalPasivoPatrimonio = fromCents(toCents(totalPasivo) + toCents(totalPatrimonio))
  const cuadra = Boolean(data?.cuadra)
  const diferenciaCuadre = fromCents(Math.abs(toCents(totalActivo) - toCents(totalPasivoPatrimonio)))

  // Secciones son objetos con claves "ACTIVO", "PASIVO", "PATRIMONIO", cada una con grupos indexados por código
  const gruposActivo = Object.values(data?.secciones?.ACTIVO || {}).filter((g) => g && typeof g.codigo === 'string').sort((a, b) => a.codigo.localeCompare(b.codigo))
  const gruposPasivo = Object.values(data?.secciones?.PASIVO || {}).filter((g) => g && typeof g.codigo === 'string').sort((a, b) => a.codigo.localeCompare(b.codigo))
  const gruposPatrimonio = Object.values(data?.secciones?.PATRIMONIO || {}).filter((g) => g && typeof g.codigo === 'string').sort((a, b) => a.codigo.localeCompare(b.codigo))

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Encabezado */}
      <PageHeader
        title="Balance General"
        subtitle="Estado de Situación Patrimonial acumulado a la fecha de corte (CU-W32)."
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
                Tipo de Cambio No Encontrado
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
          {/* Fecha de Corte */}
          <div className="md:col-span-4">
            <label htmlFor="bg_corte" className="font-semibold text-slate-700 block mb-1">
              Fecha de Corte:
            </label>
            <input
              id="bg_corte"
              type="date"
              value={fechaCorte}
              onChange={(e) => setFechaCorte(e.target.value)}
              className="w-full h-8 px-2 border border-slate-300 rounded-lg text-xs font-mono outline-none focus:border-[#006c49]"
            />
          </div>

          {/* Modo de Moneda */}
          <div className="md:col-span-4">
            <label htmlFor="bg_moneda" className="font-semibold text-slate-700 block mb-1">
              Modo de Expresión Monetaria:
            </label>
            <select
              id="bg_moneda"
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

          {/* Nivel de Agrupación */}
          <div className="md:col-span-3">
            <label htmlFor="bg_nivel" className="font-semibold text-slate-700 block mb-1">
              Detalle de Cuentas:
            </label>
            <select
              id="bg_nivel"
              value={nivel}
              onChange={(e) => setNivel(Number(e.target.value))}
              className="w-full h-8 px-2 border border-slate-300 rounded-lg text-xs outline-none focus:border-[#006c49]"
            >
              <option value={3}>Nivel 3 — Grupos y Cuentas (Completo)</option>
              <option value={2}>Nivel 2 — Solo Grupos (Sintético)</option>
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
              title="Actualizar Balance"
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

      {/* Banner de Estado de Cuadre y Valuación */}
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
                ? 'Consolidando estados financieros...'
                : cuadra
                  ? 'BALANCE GENERAL CUADRADO — Ecuación Patrimonial Cumplida'
                  : 'DESCUADRE EN EL BALANCE GENERAL'}
            </h3>
            <p className="text-xs opacity-90 mt-0.5">
              {data?.criterio_conversion ||
                (moneda === 'CONSOLIDADO'
                  ? 'Saldos consolidados en moneda nacional con valuación oficial de cartera y obligaciones en USD.'
                  : `Saldos expresados exclusivamente en ${moneda}.`)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {data?.tipo_cambio && (
            <Badge variant="navy" className="text-xs py-1 px-2.5">
              TC: 1 USD = {formatExchangeRate(data.tipo_cambio.valor)} Bs. ({formatDate(data.tipo_cambio.fecha)})
            </Badge>
          )}

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

      {/* Tarjetas Resumen de Ecuación Contable */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-card">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Total Activo (100)
          </span>
          <span className="text-lg font-bold font-mono text-[#064e3b]">
            {loading ? '—' : formatMoney(totalActivo, sim)}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-card">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Total Pasivo (200)
          </span>
          <span className="text-lg font-bold font-mono text-slate-900">
            {loading ? '—' : formatMoney(totalPasivo, sim)}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-card">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Total Patrimonio (300)
          </span>
          <span className="text-lg font-bold font-mono text-slate-900">
            {loading ? '—' : formatMoney(totalPatrimonio, sim)}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-card">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Total Pasivo + Patrimonio
          </span>
          <span className={`text-lg font-bold font-mono ${cuadra ? 'text-[#064e3b]' : 'text-red-700'}`}>
            {loading ? '—' : formatMoney(totalPasivoPatrimonio, sim)}
          </span>
        </div>
      </div>

      {/* Encabezado visible únicamente en impresión */}
      <div className="hidden print:block mb-4 text-center border-b pb-3">
        <h1 className="text-lg font-bold text-slate-900 uppercase">
          BALANCE GENERAL (ESTADO DE SITUACIÓN PATRIMONIAL)
        </h1>
        <p className="text-xs text-slate-600">
          Al {formatDate(fechaCorte)} | Moneda: {sim} ({moneda})
          {data?.tipo_cambio && ` | TC Oficial: ${formatExchangeRate(data.tipo_cambio.valor)}`}
        </p>
      </div>

      {/* Secciones del Balance General */}
      {loading ? (
        <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-card space-y-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : !data ? null : (
        <div className="space-y-6">
          {/* 1. ACTIVO */}
          <SeccionBalance
            titulo="ACTIVO"
            codigo="100"
            subtitulo="Recursos económicos y derechos controlados por la entidad"
            grupos={gruposActivo}
            total={totalActivo}
            sim={sim}
            mostrarCuentas={nivel === 3}
          />

          {/* 2. PASIVO */}
          <SeccionBalance
            titulo="PASIVO"
            codigo="200"
            subtitulo="Obligaciones presentes con socios, público y entidades financieras"
            grupos={gruposPasivo}
            total={totalPasivo}
            sim={sim}
            mostrarCuentas={nivel === 3}
          />

          {/* 3. PATRIMONIO */}
          <SeccionBalance
            titulo="PATRIMONIO"
            codigo="300"
            subtitulo="Participación residual en los activos una vez deducidos todos los pasivos"
            grupos={gruposPatrimonio}
            total={totalPatrimonio}
            sim={sim}
            mostrarCuentas={nivel === 3}
          />

          {/* Resumen Final de Comprobación de Ecuación Contable */}
          <div className="p-4 bg-slate-50 border-2 border-slate-300 rounded-xl flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
            <div>
              <span className="font-bold text-slate-800 uppercase block">
                Total Activo:
              </span>
              <span className="text-base font-bold text-[#064e3b]">
                {formatMoney(totalActivo, sim)}
              </span>
            </div>

            <div className="text-slate-400 text-lg hidden sm:block">=</div>

            <div>
              <span className="font-bold text-slate-800 uppercase block">
                Total Pasivo y Patrimonio:
              </span>
              <span className={`text-base font-bold ${cuadra ? 'text-[#064e3b]' : 'text-red-700'}`}>
                {formatMoney(totalPasivoPatrimonio, sim)}
              </span>
            </div>

            <div>
              <span className="text-slate-500 uppercase block text-[10px]">
                Diferencia:
              </span>
              <span className="font-bold text-slate-700">
                {formatMoney(diferenciaCuadre, sim)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SeccionBalance({
  titulo,
  codigo,
  subtitulo,
  grupos,
  total,
  sim,
  mostrarCuentas,
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden break-inside-avoid">
      <div className="px-4 py-3 bg-slate-50/90 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-[#064e3b]">
              CLASE {codigo}
            </span>
            <span className="font-bold text-sm text-slate-900 tracking-wide">
              {titulo}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 block mt-0.5">
            {subtitulo}
          </span>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Total {titulo}
          </span>
          <span className="text-base font-bold font-mono text-[#064e3b]">
            {formatMoney(total, sim)}
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/50 border-b border-slate-200 text-slate-500 text-[11px]">
            <tr>
              <th className="py-2 px-4 w-28">Código</th>
              <th className="py-2 px-4 min-w-[280px]">Descripción / Nomenclatura MCEF</th>
              <th className="py-2 px-4 text-right w-36">Importe ({sim})</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-sans">
            {grupos.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-4 text-center text-slate-400">
                  Sin movimientos registrados en esta clase
                </td>
              </tr>
            ) : (
              grupos.map((g) => {
                const cuentas = Array.isArray(g.cuentas) ? g.cuentas : []
                const isNegative = toCents(g.monto) < 0
                const isResultadoGestion = g.codigo === 'RESULTADO_GESTION'

                return (
                  <tr key={g.codigo} className="contents">
                    {/* Fila del Grupo (Nivel 2) */}
                    <tr className={`hover:bg-slate-50 font-semibold text-slate-800 ${isResultadoGestion ? 'bg-emerald-50/40' : 'bg-slate-50/40'}`}>
                      <td className="py-2 px-4 font-mono font-bold text-[#064e3b]">
                        {g.codigo}
                      </td>
                      <td className="py-2 px-4 uppercase tracking-tight">
                        <div className="flex items-center gap-2">
                          <span>{g.nombre}</span>
                          {isResultadoGestion && (
                            <Badge variant={!isNegative ? 'teal' : 'red'}>
                              {!isNegative ? 'Utilidad' : 'Pérdida'}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className={`py-2 px-4 text-right font-mono font-bold ${isNegative ? 'text-red-700' : 'text-slate-900'}`}>
                        {formatMoney(g.monto, sim)}
                      </td>
                    </tr>

                    {/* Cuentas Hijas (Nivel 3) */}
                    {mostrarCuentas &&
                      cuentas.map((c) => {
                        const isCtaNeg = toCents(c.monto) < 0
                        return (
                          <tr
                            key={c.codigo}
                            className="hover:bg-slate-50/70 text-slate-600 transition"
                          >
                            <td className="py-1.5 px-4 pl-8 font-mono text-[11px] text-slate-500">
                              {c.codigo}
                            </td>
                            <td className="py-1.5 px-4 text-slate-700">
                              {c.nombre}
                            </td>
                            <td
                              className={`py-1.5 px-4 text-right font-mono text-[11px] ${
                                isCtaNeg ? 'text-red-700' : 'text-slate-800'
                              }`}
                            >
                              {formatMoney(c.monto, sim)}
                            </td>
                          </tr>
                        )
                      })}
                  </tr>
                )
              })
            )}
          </tbody>
          <tfoot className="bg-slate-50/90 border-t-2 border-slate-300 font-semibold text-xs">
            <tr>
              <td colSpan={2} className="py-2.5 px-4 text-right uppercase tracking-wider font-bold text-slate-800">
                Total {titulo}:
              </td>
              <td className="py-2.5 px-4 text-right font-mono font-bold text-[#064e3b] text-sm">
                {formatMoney(total, sim)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
