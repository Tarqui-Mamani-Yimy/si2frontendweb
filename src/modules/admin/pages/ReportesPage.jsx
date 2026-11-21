import { useCallback, useEffect, useState } from 'react'
import PageHeader from '../../../components/ui/PageHeader'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
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
  getReportesFiltros,
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

const TIPO_CREDITO_LABELS = {
  CONSUMO: 'Consumo',
  MICROCREDITO: 'Microcrédito',
  MICROCREDITO_AGROPECUARIO: 'Microcrédito agropecuario',
  VIVIENDA_HIPOTECARIA: 'Vivienda hipotecaria',
  VIVIENDA_SIN_GARANTIA: 'Vivienda sin garantía',
}

export default function ReportesPage() {
  const modulosInfo = useAuthStore(selectModulosInfo)
  const today = getTodayIso()
  const [activeTab, setActiveTab] = useState('resumen')
  const [fechaCorte, setFechaCorte] = useState(today)
  const [monedaId, setMonedaId] = useState(1) // 1: BOB, 2: USD
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Filtros de cartera (S2)
  const [opcionesFiltros, setOpcionesFiltros] = useState({
    productos: [],
    oficiales: [],
    tipos_credito: [],
    estados_mora: [],
  })
  const [productoId, setProductoId] = useState('')
  const [tipoCredito, setTipoCredito] = useState('')
  const [oficialId, setOficialId] = useState('')
  const [colocacionDesde, setColocacionDesde] = useState('')
  const [estadoMora, setEstadoMora] = useState('')

  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState(null)

  useEffect(() => {
    getReportesFiltros()
      .then((res) => {
        if (res) {
          setOpcionesFiltros({
            productos: res.productos || [],
            oficiales: res.oficiales || [],
            tipos_credito: res.tipos_credito || [],
            estados_mora: res.estados_mora || [],
          })
        }
      })
      .catch(() => {})
  }, [])

  const isFutureDate = fechaCorte > today
  const sim = Number(monedaId) === 2 ? '$' : 'Bs.'
  const monedaNombre = Number(monedaId) === 2 ? 'Dólares (USD)' : 'Bolivianos (BOB)'

  const carteraFiltros = {
    producto_id: productoId ? Number(productoId) : undefined,
    tipo_credito: tipoCredito || undefined,
    oficial_id: oficialId ? Number(oficialId) : undefined,
    desde: colocacionDesde || undefined,
    estado_mora: estadoMora || undefined,
  }

  function handleFilterSubmit(e) {
    e?.preventDefault()
    if (isFutureDate) return
    setExportError(null)
    setRefreshTrigger((k) => k + 1)
  }

  function handleResetFilters() {
    setFechaCorte(today)
    setMonedaId(1)
    setProductoId('')
    setTipoCredito('')
    setOficialId('')
    setColocacionDesde('')
    setEstadoMora('')
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
          ...carteraFiltros,
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 items-end">
          {/* Fecha de Corte */}
          <div>
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
          <div>
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
              <option value={2}>Dólares (USD)</option>
            </select>
          </div>

          {/* Producto */}
          <div>
            <label htmlFor="rep_producto" className="font-semibold text-slate-700 block mb-1">
              Producto:
            </label>
            <select
              id="rep_producto"
              value={productoId}
              onChange={(e) => setProductoId(e.target.value)}
              className="w-full h-8 px-2 border border-slate-300 rounded-lg text-xs outline-none focus:border-[#006c49]"
            >
              <option value="">Todos los productos</option>
              {opcionesFiltros.productos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Tipo de Crédito */}
          <div>
            <label htmlFor="rep_tipo_credito" className="font-semibold text-slate-700 block mb-1">
              Tipo de Crédito:
            </label>
            <select
              id="rep_tipo_credito"
              value={tipoCredito}
              onChange={(e) => setTipoCredito(e.target.value)}
              className="w-full h-8 px-2 border border-slate-300 rounded-lg text-xs outline-none focus:border-[#006c49]"
            >
              <option value="">Todos los tipos</option>
              {opcionesFiltros.tipos_credito.map((t) => (
                <option key={t} value={t}>
                  {TIPO_CREDITO_LABELS[t] || t}
                </option>
              ))}
            </select>
          </div>

          {/* Oficial de Crédito */}
          <div>
            <label htmlFor="rep_oficial" className="font-semibold text-slate-700 block mb-1">
              Oficial / Asesor:
            </label>
            <select
              id="rep_oficial"
              value={oficialId}
              onChange={(e) => setOficialId(e.target.value)}
              className="w-full h-8 px-2 border border-slate-300 rounded-lg text-xs outline-none focus:border-[#006c49]"
            >
              <option value="">Todos los oficiales</option>
              {opcionesFiltros.oficiales.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Colocación Desde */}
          <div>
            <label htmlFor="rep_desde" className="font-semibold text-slate-700 block mb-1">
              Colocación Desde:
            </label>
            <input
              id="rep_desde"
              type="date"
              max={fechaCorte}
              value={colocacionDesde}
              onChange={(e) => setColocacionDesde(e.target.value)}
              className="w-full h-8 px-2 border border-slate-300 rounded-lg text-xs font-mono outline-none focus:border-[#006c49]"
            />
          </div>

          {/* Estado de Mora */}
          <div>
            <label htmlFor="rep_mora" className="font-semibold text-slate-700 block mb-1">
              Estado de Mora:
            </label>
            <select
              id="rep_mora"
              value={estadoMora}
              onChange={(e) => setEstadoMora(e.target.value)}
              className="w-full h-8 px-2 border border-slate-300 rounded-lg text-xs outline-none focus:border-[#006c49]"
            >
              <option value="">Todos (Al día y Mora)</option>
              <option value="AL_DIA">Al día</option>
              <option value="EN_MORA">En mora</option>
            </select>
          </div>
        </div>

        {/* Botones de acción y filtros activos */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-500">Filtros activos:</span>
            {productoId && (
              <Badge variant="navy">
                Producto: {opcionesFiltros.productos.find((p) => String(p.id) === String(productoId))?.nombre || productoId}
              </Badge>
            )}
            {tipoCredito && (
              <Badge variant="teal">
                Tipo: {TIPO_CREDITO_LABELS[tipoCredito] || tipoCredito}
              </Badge>
            )}
            {oficialId && (
              <Badge variant="purple">
                Oficial: {opcionesFiltros.oficiales.find((o) => String(o.id) === String(oficialId))?.nombre || oficialId}
              </Badge>
            )}
            {colocacionDesde && (
              <Badge variant="slate">
                Desde: {colocacionDesde}
              </Badge>
            )}
            {estadoMora && (
              <Badge variant={estadoMora === 'EN_MORA' ? 'red' : 'green'}>
                {estadoMora === 'EN_MORA' ? 'En mora' : 'Al día'}
              </Badge>
            )}
            {!productoId && !tipoCredito && !oficialId && !colocacionDesde && !estadoMora && (
              <span className="text-[11px] text-slate-400 italic">Ningún filtro adicional</span>
            )}
          </div>

          <div className="flex items-center gap-1.5 ml-auto">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isFutureDate}
              className="!bg-[#064e3b] h-8 gap-1 px-3"
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
              className="h-8 px-2 text-slate-400 hover:text-slate-600 gap-1"
              title="Restablecer filtros"
            >
              <span className="material-symbols-outlined text-[16px]">restart_alt</span>
              <span>Limpiar filtros</span>
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
              filtros={carteraFiltros}
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
