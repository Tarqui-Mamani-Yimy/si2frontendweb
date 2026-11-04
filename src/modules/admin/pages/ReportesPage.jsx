import { useCallback, useState } from 'react'
import PageHeader from '../../../components/ui/PageHeader'
import Button from '../../../components/ui/Button'
import AlertBanner from '../../../components/ui/AlertBanner'
import {
  formatDate,
  getTodayIso,
  triggerCsvDownload,
} from '../../contador/components/contabilidadUtils'
import {
  exportCarteraReport,
  exportCaptacionesReport,
  exportIndicadoresReport,
} from '../../../core/api/reportesApi'
import { getApiErrorMessage } from '../../../core/api/errors'
import { selectModulosInfo, useAuthStore } from '../../../core/store/authStore'
import { isModuloPermitido } from '../../../core/utils/planModulos'

import ResumenTab from '../components/reportes/ResumenTab'
import CarteraTab from '../components/reportes/CarteraTab'
import CaptacionesTab from '../components/reportes/CaptacionesTab'
import IndicadoresTab from '../components/reportes/IndicadoresTab'
import ComandoVozReportes from '../components/reportes/ComandoVozReportes'
import { filtrosDesdeComando } from '../components/reportes/comandoVozUtils'

const TABS = [
  { id: 'resumen', label: 'Resumen Ejecutivo', icon: 'dashboard' },
  { id: 'cartera', label: 'Cartera de Créditos', icon: 'account_balance_wallet' },
  { id: 'captaciones', label: 'Captaciones (Ahorro y DPF)', icon: 'savings' },
  { id: 'indicadores', label: 'Indicadores de Gestión', icon: 'query_stats' },
]

export default function ReportesPage() {
  const modulosInfo = useAuthStore(selectModulosInfo)
  const today = getTodayIso()
  const [activeTab, setActiveTab] = useState('resumen')
  const [fechaCorte, setFechaCorte] = useState(today)
  const [monedaId, setMonedaId] = useState(1) // 1: BOB, 2: USD
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState(null)

  const isFutureDate = fechaCorte > today
  const sim = Number(monedaId) === 2 ? '$' : 'Bs.'
  const monedaNombre = Number(monedaId) === 2 ? 'Dólares (USD)' : 'Bolivianos (BOB)'

  function handleFilterSubmit(e) {
    e?.preventDefault()
    if (isFutureDate) return
    setExportError(null)
    setRefreshTrigger((k) => k + 1)
  }

  function handleResetFilters() {
    setFechaCorte(today)
    setMonedaId(1)
    setExportError(null)
    setRefreshTrigger((k) => k + 1)
  }

  // A voice-requested report that matches a tab is also shown on the page.
  const handleVoiceReport = useCallback((command) => {
    const filtros = filtrosDesdeComando(command)
    if (!filtros) return
    setActiveTab(filtros.tab)
    if (filtros.fechaCorte) setFechaCorte(filtros.fechaCorte)
    if (filtros.monedaId) setMonedaId(Number(filtros.monedaId))
    setExportError(null)
    setRefreshTrigger((k) => k + 1)
  }, [])

  function handlePrint() {
    globalThis.print()
  }

  async function handleExportCsv() {
    setExporting(true)
    setExportError(null)

    try {
      let response
      let defaultFilename = `reporte-${activeTab}-${fechaCorte}.csv`

      if (activeTab === 'cartera' || activeTab === 'resumen') {
        response = await exportCarteraReport({
          fecha_corte: fechaCorte,
          moneda_id: monedaId,
        })
        defaultFilename = `reporte-cartera-${fechaCorte}.csv`
      } else if (activeTab === 'captaciones') {
        response = await exportCaptacionesReport({
          fecha_corte: fechaCorte,
          moneda_id: monedaId,
        })
        defaultFilename = `reporte-captaciones-${fechaCorte}.csv`
      } else if (activeTab === 'indicadores') {
        response = await exportIndicadoresReport({
          fecha_corte: fechaCorte,
          moneda_id: monedaId,
        })
        defaultFilename = `reporte-indicadores-${fechaCorte}.csv`
      }

      if (response?.data) {
        triggerCsvDownload(
          response.data,
          defaultFilename,
          response.headers?.['content-disposition'],
        )
      }
    } catch (err) {
      setExportError(
        getApiErrorMessage(err, 'Error al exportar el reporte a archivo CSV.'),
      )
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Encabezado */}
      <PageHeader
        title="Reportes Financieros y Gerenciales"
        subtitle="Métricas consolidadas de cartera, captaciones e indicadores directivos (CU-W33)."
        action={
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            {isModuloPermitido(modulosInfo, 'chatbot_ia') && (
              <ComandoVozReportes onReport={handleVoiceReport} />
            )}

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

      {exportError && (
        <AlertBanner
          variant="error"
          dismissible
          onDismiss={() => setExportError(null)}
          className="print:hidden"
        >
          {exportError}
        </AlertBanner>
      )}

      {isFutureDate && (
        <AlertBanner variant="error" className="print:hidden">
          La fecha de corte no puede ser futura a la fecha actual ({formatDate(today)}).
        </AlertBanner>
      )}

      {/* Barra de Filtros */}
      <form
        onSubmit={handleFilterSubmit}
        className="p-4 rounded-xl bg-white border border-slate-200 shadow-card space-y-3 text-xs print:hidden"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3 items-end">
          {/* Fecha de Corte */}
          <div className="md:col-span-5">
            <label htmlFor="rep_corte" className="font-semibold text-slate-700 block mb-1">
              Fecha de Corte:
            </label>
            <input
              id="rep_corte"
              type="date"
              max={today}
              value={fechaCorte}
              onChange={(e) => setFechaCorte(e.target.value)}
              className="w-full h-8 px-2 border border-slate-300 rounded-lg text-xs font-mono outline-none focus:border-[#006c49]"
            />
          </div>

          {/* Moneda */}
          <div className="md:col-span-5">
            <label htmlFor="rep_moneda" className="font-semibold text-slate-700 block mb-1">
              Moneda:
            </label>
            <select
              id="rep_moneda"
              value={monedaId}
              onChange={(e) => setMonedaId(Number(e.target.value))}
              className="w-full h-8 px-2 border border-slate-300 rounded-lg text-xs outline-none focus:border-[#006c49]"
            >
              <option value={1}>Bolivianos (BOB)</option>
              <option value={2}>Dólares Americanos (USD)</option>
            </select>
          </div>

          {/* Botones de acción */}
          <div className="md:col-span-2 flex items-center gap-1.5">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isFutureDate}
              className="!bg-[#064e3b] w-full h-8 gap-1"
              title="Actualizar métricas"
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
              title="Restablecer filtros"
            >
              <span className="material-symbols-outlined text-[16px]">restart_alt</span>
            </Button>
          </div>
        </div>
      </form>

      {/* Pestañas de Navegación */}
      <div className="border-b border-slate-200 print:hidden">
        <nav className="flex space-x-2 -mb-px overflow-x-auto">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? 'border-[#064e3b] text-[#064e3b] bg-emerald-50/40 rounded-t-lg'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {tab.icon}
                </span>
                <span>{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Encabezado formal visible únicamente en impresión */}
      <div className="hidden print:block mb-6 text-center border-b pb-3">
        <h1 className="text-xl font-bold text-slate-900 uppercase">
          REPORTE GERENCIAL Y FINANCIERO — {TABS.find((t) => t.id === activeTab)?.label.toUpperCase()}
        </h1>
        <p className="text-xs text-slate-600 mt-1">
          Al corte del {formatDate(fechaCorte)} | Expresado en: {monedaNombre} ({sim})
        </p>
      </div>

      {/* Contenido de la pestaña activa */}
      {!isFutureDate && (
        <div>
          {activeTab === 'resumen' && (
            <ResumenTab
              fechaCorte={fechaCorte}
              monedaId={monedaId}
              refreshTrigger={refreshTrigger}
              sim={sim}
            />
          )}

          {activeTab === 'cartera' && (
            <CarteraTab
              fechaCorte={fechaCorte}
              monedaId={monedaId}
              refreshTrigger={refreshTrigger}
              sim={sim}
            />
          )}

          {activeTab === 'captaciones' && (
            <CaptacionesTab
              fechaCorte={fechaCorte}
              monedaId={monedaId}
              refreshTrigger={refreshTrigger}
              sim={sim}
            />
          )}

          {activeTab === 'indicadores' && (
            <IndicadoresTab
              fechaCorte={fechaCorte}
              refreshTrigger={refreshTrigger}
              sim={sim}
            />
          )}
        </div>
      )}
    </div>
  )
}
