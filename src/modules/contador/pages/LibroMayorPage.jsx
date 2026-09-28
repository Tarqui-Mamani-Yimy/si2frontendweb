import { useState, useEffect, useRef } from 'react'
import PageHeader from '../../../components/ui/PageHeader'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import Skeleton from '../../../components/ui/Skeleton'
import AlertBanner from '../../../components/ui/AlertBanner'
import CuentaContablePicker from '../components/CuentaContablePicker'
import ComprobanteDetailModal from '../components/ComprobanteDetailModal'
import {
  formatMoney,
  formatDate,
  getTodayIso,
  getFirstDayOfMonthIso,
  MONEDAS_DISPONIBLES,
  getMonedaSimbolo,
  triggerCsvDownload,
  TIPO_COMPROBANTE_CONFIG,
} from '../components/contabilidadUtils'
import { getLibroMayor, exportLibroMayor } from '../../../core/api/contabilidadApi'
import { getApiErrorMessage } from '../../../core/api/errors'

export default function LibroMayorPage() {
  const [selectedAccount, setSelectedAccount] = useState(null)
  const [desde, setDesde] = useState(getFirstDayOfMonthIso())
  const [hasta, setHasta] = useState(getTodayIso())
  const [monedaId, setMonedaId] = useState(1)
  const [incluirSubcuentas, setIncluirSubcuentas] = useState(true)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const [mayorData, setMayorData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [exporting, setExporting] = useState(false)

  // Modal para detalle de comprobante
  const [selectedComprobanteId, setSelectedComprobanteId] = useState(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)

  // Guard contra condiciones de carrera
  const requestIdRef = useRef(0)

  useEffect(() => {
    if (!selectedAccount?.id) return

    let isMounted = true
    const reqId = ++requestIdRef.current

    const params = {
      cuenta_id: selectedAccount.id,
      desde,
      hasta,
      moneda_id: monedaId,
      incluir_subcuentas: incluirSubcuentas,
    }

    getLibroMayor(params)
      .then((res) => {
        if (!isMounted || reqId !== requestIdRef.current) return
        setError(null)
        setMayorData(res)
      })
      .catch((err) => {
        if (!isMounted || reqId !== requestIdRef.current) return
        setError(
          getApiErrorMessage(
            err,
            'Error al cargar el Libro Mayor de la cuenta seleccionada.',
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
  }, [selectedAccount, desde, hasta, monedaId, incluirSubcuentas, refreshTrigger])

  function handleFilterSubmit(e) {
    e?.preventDefault()
    if (selectedAccount?.id) {
      setLoading(true)
      setRefreshTrigger((k) => k + 1)
    }
  }

  async function handleExportCsv() {
    if (!selectedAccount?.id) return
    setExporting(true)
    try {
      const response = await exportLibroMayor({
        cuenta_id: selectedAccount.id,
        desde,
        hasta,
        moneda_id: monedaId,
        incluir_subcuentas: incluirSubcuentas,
      })
      const defaultFilename = `libro-mayor-${selectedAccount.codigo || selectedAccount.id}-${desde}_${hasta}.csv`
      triggerCsvDownload(
        response.data,
        defaultFilename,
        response.headers?.['content-disposition'],
      )
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          'Error al exportar el archivo CSV del Libro Mayor.',
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
  const cuenta = mayorData?.cuenta || selectedAccount
  const movimientos = Array.isArray(mayorData?.movimientos) ? mayorData.movimientos : []
  const naturaleza = cuenta?.naturaleza || 'DEUDORA'
  const esDeudora = naturaleza === 'DEUDORA'

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Encabezado */}
      <PageHeader
        title="Libro Mayor"
        subtitle="Movimientos cronológicos y saldo corrido por cuenta contable (CU-W31)."
        action={
          <div className="flex items-center gap-2 print:hidden">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handlePrint}
              disabled={!mayorData}
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
              disabled={!selectedAccount?.id}
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

      {/* Barra de Filtros y Selección de Cuenta */}
      <form
        onSubmit={handleFilterSubmit}
        className="p-4 rounded-xl bg-white border border-slate-200 shadow-card space-y-3 text-xs print:hidden"
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          {/* Selector de Cuenta Contable (permite también cuentas título) */}
          <div className="md:col-span-5 space-y-1">
            <label className="font-semibold text-slate-700 block">
              Cuenta Contable (imputable o de título):
            </label>
            <CuentaContablePicker
              value={selectedAccount}
              onChange={(acc) => {
                setSelectedAccount(acc)
                if (!acc?.id) {
                  setMayorData(null)
                  setError(null)
                  setLoading(false)
                } else {
                  setLoading(true)
                  setRefreshTrigger((k) => k + 1)
                }
              }}
              placeholder="Buscar cuenta para mayorizar (ej. 111.01 o 110)..."
              permitirCuentasTitulo={true}
            />
          </div>

          {/* Fecha Desde */}
          <div className="md:col-span-2">
            <label htmlFor="mayor_desde" className="font-semibold text-slate-700 block mb-1">
              Desde:
            </label>
            <input
              id="mayor_desde"
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              className="w-full h-8 px-2 border border-slate-300 rounded-lg text-xs font-mono outline-none focus:border-[#006c49]"
            />
          </div>

          {/* Fecha Hasta */}
          <div className="md:col-span-2">
            <label htmlFor="mayor_hasta" className="font-semibold text-slate-700 block mb-1">
              Hasta:
            </label>
            <input
              id="mayor_hasta"
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              className="w-full h-8 px-2 border border-slate-300 rounded-lg text-xs font-mono outline-none focus:border-[#006c49]"
            />
          </div>

          {/* Moneda */}
          <div className="md:col-span-2">
            <label htmlFor="mayor_moneda" className="font-semibold text-slate-700 block mb-1">
              Moneda:
            </label>
            <select
              id="mayor_moneda"
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

          {/* Botón Filtrar */}
          <div className="md:col-span-1">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={loading}
              className="!bg-[#064e3b] w-full h-8"
              title="Actualizar Mayor"
            >
              <span className="material-symbols-outlined text-[17px]">search</span>
            </Button>
          </div>
        </div>

        {/* Checkbox Incluir Subcuentas */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
          <input
            type="checkbox"
            id="check_subcuentas"
            checked={incluirSubcuentas}
            onChange={(e) => setIncluirSubcuentas(e.target.checked)}
            className="w-4 h-4 rounded text-[#064e3b] border-slate-300 focus:ring-[#006c49] cursor-pointer"
          />
          <label htmlFor="check_subcuentas" className="text-slate-700 font-medium cursor-pointer">
            Incluir subcuentas y cuentas descendientes (agregación consolidada de movimientos)
          </label>
          <span className="text-[11px] text-slate-400">
            — Requerido para cuentas de título (niveles 1–3 y subcuentas con analíticas)
          </span>
        </div>
      </form>

      {/* Encabezado visible únicamente en impresión */}
      {mayorData && cuenta && (
        <div className="hidden print:block mb-4 text-center border-b pb-3">
          <h1 className="text-lg font-bold text-slate-900">LIBRO MAYOR GENERAL</h1>
          <p className="text-xs font-semibold text-slate-800">
            Cuenta: {cuenta.codigo} — {cuenta.nombre} (Naturaleza: {cuenta.naturaleza})
          </p>
          <p className="text-xs text-slate-600">
            Periodo: {formatDate(desde)} al {formatDate(hasta)} | Moneda: {sim}
          </p>
        </div>
      )}

      {/* Tarjeta de Información de Cuenta y Resumen de Saldos */}
      {cuenta && (
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-card space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-base font-bold text-[#064e3b]">
                {cuenta.codigo}
              </span>
              <span className="text-sm font-bold text-slate-900">
                {cuenta.nombre}
              </span>
              <span className="text-xs text-slate-400">
                Nivel {cuenta.nivel ?? '—'}
              </span>

              <Badge
                variant={esDeudora ? 'teal' : 'navy'}
                className="gap-1 !text-xs !py-0.5 !px-2"
              >
                <span>Naturaleza {esDeudora ? 'Deudora' : 'Acreedora'}</span>
              </Badge>

              {cuenta.es_regularizadora && (
                <Badge variant="purple" className="!text-xs !py-0.5 !px-2">
                  Regularizadora
                </Badge>
              )}
            </div>

            <span className="text-xs text-slate-500 font-medium">
              Fórmula de saldo: <strong>{esDeudora ? 'Debe − Haber' : 'Haber − Debe'}</strong>
            </span>
          </div>

          {/* Métricas de Saldo */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Saldo Inicial (al {formatDate(desde)})
              </span>
              <span className="text-base font-bold font-mono text-slate-800">
                {loading ? '—' : formatMoney(mayorData?.saldo_inicial ?? 0, sim)}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Total Debe del Periodo
              </span>
              <span className="text-base font-bold font-mono text-emerald-800">
                {loading ? '—' : formatMoney(mayorData?.totales?.debe ?? 0, sim)}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Total Haber del Periodo
              </span>
              <span className="text-base font-bold font-mono text-indigo-800">
                {loading ? '—' : formatMoney(mayorData?.totales?.haber ?? 0, sim)}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200">
              <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider block mb-1">
                Saldo Final (al {formatDate(hasta)})
              </span>
              <span className="text-base font-bold font-mono text-[#064e3b]">
                {loading ? '—' : formatMoney(mayorData?.saldo_final ?? 0, sim)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Contenido Principal / Tabla de Movimientos */}
      {!selectedAccount ? (
        <div className="p-16 text-center bg-white rounded-xl border border-slate-200 shadow-card space-y-3">
          <span className="material-symbols-outlined text-[48px] text-slate-300 block mb-1">
            auto_stories
          </span>
          <p className="text-sm font-semibold text-slate-700">
            Seleccione una cuenta contable para visualizar su Libro Mayor
          </p>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Puede elegir una cuenta que acepte movimientos directos o una cuenta de título (clase, grupo o cuenta) activando la agregación de subcuentas.
          </p>
        </div>
      ) : loading ? (
        <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-card space-y-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Fecha</th>
                  <th className="py-2.5 px-3">Comprobante</th>
                  <th className="py-2.5 px-3">Cuenta Aux.</th>
                  <th className="py-2.5 px-4 min-w-[200px]">Glosa del Movimiento</th>
                  <th className="py-2.5 px-3 text-right w-28">Debe ({sim})</th>
                  <th className="py-2.5 px-3 text-right w-28">Haber ({sim})</th>
                  <th className="py-2.5 px-4 text-right w-32">Saldo Corrido ({sim})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {/* Fila especial: Saldo Inicial */}
                <tr className="bg-slate-50/60 font-semibold text-slate-700">
                  <td className="py-2.5 px-3 font-mono text-slate-500">
                    {formatDate(desde)}
                  </td>
                  <td className="py-2.5 px-3 text-slate-400 font-mono">—</td>
                  <td className="py-2.5 px-3 text-slate-400 font-mono">—</td>
                  <td className="py-2.5 px-4 italic text-slate-600">
                    SALDO INICIAL AL {formatDate(desde)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-400">—</td>
                  <td className="py-2.5 px-3 text-right text-slate-400">—</td>
                  <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                    {formatMoney(mayorData?.saldo_inicial ?? 0, sim)}
                  </td>
                </tr>

                {movimientos.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No se registraron movimientos en esta cuenta dentro del periodo seleccionado.
                    </td>
                  </tr>
                ) : (
                  movimientos.map((m, idx) => {
                    const comp = m.comprobante || {}
                    const tipoCfg = TIPO_COMPROBANTE_CONFIG[comp.tipo] || {
                      label: comp.tipo,
                      badgeVariant: 'slate',
                    }
                    const isAnulado = comp.estado === 'ANULADO'

                    return (
                      <tr key={idx} className="hover:bg-slate-50/70 transition">
                        <td className="py-2.5 px-3 font-mono text-slate-600">
                          {formatDate(m.fecha)}
                        </td>

                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => comp.id && handleOpenVoucher(comp.id)}
                              className="font-mono font-bold text-[#064e3b] hover:underline cursor-pointer"
                              title="Ver comprobante"
                            >
                              {comp.numero || `#${comp.id}`}
                            </button>
                            {comp.tipo && (
                              <Badge variant={tipoCfg.badgeVariant} className="!text-[9px] !py-0 !px-1">
                                {tipoCfg.label}
                              </Badge>
                            )}
                            {isAnulado && (
                              <Badge variant="red" className="!text-[9px] !py-0 !px-1">
                                Anulado
                              </Badge>
                            )}
                          </div>
                        </td>

                        <td className="py-2.5 px-3 font-mono text-slate-600">
                          {m.cuenta_codigo || cuenta?.codigo || '—'}
                        </td>

                        <td className="py-2.5 px-4 text-slate-700 truncate max-w-sm" title={m.glosa}>
                          {m.glosa || '—'}
                        </td>

                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                          {parseFloat(m.debe ?? 0) > 0 ? formatMoney(m.debe, sim) : '—'}
                        </td>

                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                          {parseFloat(m.haber ?? 0) > 0 ? formatMoney(m.haber, sim) : '—'}
                        </td>

                        <td className="py-2.5 px-4 text-right font-mono font-bold text-[#064e3b]">
                          {formatMoney(m.saldo ?? 0, sim)}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
              <tfoot className="bg-slate-50/90 border-t-2 border-slate-300 font-semibold text-xs">
                <tr>
                  <td colSpan={4} className="py-3 px-4 text-right font-bold text-slate-800 uppercase tracking-wider">
                    Totales del Periodo y Saldo Final:
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                    {formatMoney(mayorData?.totales?.debe ?? 0, sim)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                    {formatMoney(mayorData?.totales?.haber ?? 0, sim)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-[#064e3b] text-sm">
                    {formatMoney(mayorData?.saldo_final ?? 0, sim)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Detalle de Comprobante */}
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
