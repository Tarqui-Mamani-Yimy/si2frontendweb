import { useState } from 'react'
import PageHeader from '../../../components/ui/PageHeader'
import Button from '../../../components/ui/Button'
import AlertBanner from '../../../components/ui/AlertBanner'
import { getTodayIso } from '../components/contabilidadUtils'

import CalificacionTab from '../components/informes-asfi/CalificacionTab'
import EstadosFinancierosTab from '../components/informes-asfi/EstadosFinancierosTab'
import CarteraDeudoresTab from '../components/informes-asfi/CarteraDeudoresTab'
import HistorialTab from '../components/informes-asfi/HistorialTab'
import CatalogoTab from '../components/informes-asfi/CatalogoTab'
import GenerarInformeModal from '../components/informes-asfi/GenerarInformeModal'

const TABS = [
  { id: 'calificacion', label: 'Calificación y Previsiones', icon: 'verified' },
  { id: 'estados-financieros', label: 'Estados Financieros', icon: 'account_balance' },
  { id: 'deudores', label: 'Cartera por Deudores', icon: 'badge' },
  { id: 'historial', label: 'Historial de Reportes', icon: 'history' },
  { id: 'catalogo', label: 'Catálogo Normativo', icon: 'menu_book' },
]

/**
 * Main Page: Informes Normativos ASFI (CU-W34).
 * Reusable for both CONTADOR and ADMINISTRADOR.
 */
export default function InformesAsfiPage() {
  const today = getTodayIso()
  const [activeTab, setActiveTab] = useState('calificacion')
  const [fechaCorte, setFechaCorte] = useState(today)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const [modalGenerarOpen, setModalGenerarOpen] = useState(false)
  const [successBanner, setSuccessBanner] = useState(null)

  const isFutureDate = fechaCorte > today

  function handleFilterSubmit(e) {
    e?.preventDefault()
    if (isFutureDate) return
    setSuccessBanner(null)
    setRefreshTrigger((k) => k + 1)
  }

  function handleGenerarSuccess(res) {
    setSuccessBanner(
      `Informe normativo registrado con éxito (ID #${res?.id || res?.reporte_id || 'OK'}). Integridad SHA-256 almacenada.`,
    )
    setRefreshTrigger((k) => k + 1)
  }

  const showFechaCorteFilter = ['calificacion', 'estados-financieros', 'deudores'].includes(activeTab)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Informes Normativos ASFI"
        subtitle="Evaluación de cartera, estados financieros regulatorios, reportes CIC e historial oficial (CU-W34)"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              icon="add_circle"
              onClick={() => setModalGenerarOpen(true)}
            >
              Generar Informe
            </Button>
          </div>
        }
      />

      {successBanner && (
        <AlertBanner variant="success" onClose={() => setSuccessBanner(null)}>
          {successBanner}
        </AlertBanner>
      )}

      {/* Tabs Bar */}
      <div className="border-b border-[#e2e8f0]">
        <nav className="flex space-x-2 sm:space-x-4 overflow-x-auto pb-px" aria-label="Pestañas de Informes ASFI">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id)
                  setSuccessBanner(null)
                }}
                className={`flex items-center gap-2 py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition whitespace-nowrap ${
                  isActive
                    ? 'border-[#064e3b] text-[#064e3b]'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Filter Toolbar for Preview Tabs */}
      {showFechaCorteFilter && (
        <form
          onSubmit={handleFilterSubmit}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-card"
        >
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label htmlFor="fecha_corte_input" className="text-xs font-bold text-slate-700">
                Fecha de Corte:
              </label>
              <input
                id="fecha_corte_input"
                type="date"
                max={today}
                value={fechaCorte}
                onChange={(e) => setFechaCorte(e.target.value)}
                className={`h-9 rounded-lg border px-3 text-xs outline-none transition ${
                  isFutureDate
                    ? 'border-rose-300 bg-rose-50 text-rose-900 focus:border-rose-500'
                    : 'border-slate-200 bg-slate-50 text-slate-900 focus:border-[#006c49] focus:bg-white'
                }`}
              />
            </div>

            {isFutureDate && (
              <span className="text-xs font-semibold text-rose-600 flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">error</span>
                No se permiten fechas futuras
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              type="submit"
              icon="refresh"
              disabled={isFutureDate}
            >
              Actualizar Vista
            </Button>
            <Button
              variant="outline"
              size="sm"
              type="button"
              icon="playlist_add_check"
              disabled={isFutureDate}
              onClick={() => setModalGenerarOpen(true)}
            >
              Generar Este Snapshot
            </Button>
          </div>
        </form>
      )}

      {/* Tab Panels */}
      {activeTab === 'calificacion' && (
        <CalificacionTab
          fechaCorte={fechaCorte}
          refreshTrigger={refreshTrigger}
          onGenerarClick={() => setModalGenerarOpen(true)}
        />
      )}

      {activeTab === 'estados-financieros' && (
        <EstadosFinancierosTab
          fechaCorte={fechaCorte}
          refreshTrigger={refreshTrigger}
        />
      )}

      {activeTab === 'deudores' && (
        <CarteraDeudoresTab
          fechaCorte={fechaCorte}
          refreshTrigger={refreshTrigger}
        />
      )}

      {activeTab === 'historial' && (
        <HistorialTab
          refreshTrigger={refreshTrigger}
          onGenerarClick={() => setModalGenerarOpen(true)}
        />
      )}

      {activeTab === 'catalogo' && <CatalogoTab />}

      {/* Modal para Generar Informe */}
      <GenerarInformeModal
        open={modalGenerarOpen}
        onClose={() => setModalGenerarOpen(false)}
        defaultTipo={
          activeTab === 'estados-financieros'
            ? 'ESTADOS_FINANCIEROS'
            : activeTab === 'deudores'
            ? 'CARTERA_DEUDORES'
            : 'CALIFICACION_CARTERA'
        }
        defaultFechaCorte={fechaCorte}
        onSuccess={handleGenerarSuccess}
      />
    </div>
  )
}
