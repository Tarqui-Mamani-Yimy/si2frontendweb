import { useState, useEffect, useCallback } from 'react'
import PageHeader from '../../../components/ui/PageHeader'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import AlertBanner from '../../../components/ui/AlertBanner'
import Skeleton from '../../../components/ui/Skeleton'
import PlanCuentasResumenCards from '../components/PlanCuentasResumenCards'
import PlanCuentasTree from '../components/PlanCuentasTree'
import PlanCuentaDetailPanel from '../components/PlanCuentaDetailPanel'
import CrearAnaliticaModal from '../components/CrearAnaliticaModal'
import EditarAnaliticaModal from '../components/EditarAnaliticaModal'
import CambiarEstadoModal from '../components/CambiarEstadoModal'
import EliminarAnaliticaModal from '../components/EliminarAnaliticaModal'
import {
  CLASES_CONTABLES,
  getNivelNombre,
} from '../components/constants'
import {
  getPlanCuentasResumen,
  getPlanCuentasArbol,
  listPlanCuentas,
  getPlanCuenta,
} from '../../../core/api/contabilidadApi'
import { getApiErrorMessage } from '../../../core/api/errors'

function collectAllIds(nodes) {
  const ids = new Set()
  function walk(arr) {
    const list = Array.isArray(arr) ? arr : arr ? [arr] : []
    list.forEach((n) => {
      if (n.id != null) ids.add(n.id)
      if (n.hijos) walk(n.hijos)
      if (n.children) walk(n.children)
    })
  }
  walk(nodes)
  return ids
}

export default function PlanCuentasPage() {
  // Resumen metrics
  const [resumen, setResumen] = useState(null)
  const [loadingResumen, setLoadingResumen] = useState(true)

  // Clases y Árbol
  const [selectedClase, setSelectedClase] = useState(1) // 100 Activo por defecto
  const [treeData, setTreeData] = useState(null)
  const [loadingTree, setLoadingTree] = useState(true)
  const [errorTree, setErrorTree] = useState(null)
  const [expandedIds, setExpandedIds] = useState(new Set())

  // Búsqueda
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState(null)
  const [isSearching, setIsSearching] = useState(false)
  const [loadingSearch, setLoadingSearch] = useState(false)
  const [errorSearch, setErrorSearch] = useState(null)

  // Detalle de cuenta seleccionada
  const [selectedAccountId, setSelectedAccountId] = useState(null)
  const [selectedAccountDetail, setSelectedAccountDetail] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [errorDetail, setErrorDetail] = useState(null)

  // Modales
  const [modalCrearOpen, setModalCrearOpen] = useState(false)
  const [parentForCrear, setParentForCrear] = useState(null)
  const [modalEditarOpen, setModalEditarOpen] = useState(false)
  const [modalEstadoOpen, setModalEstadoOpen] = useState(false)
  const [modalEliminarOpen, setModalEliminarOpen] = useState(false)

  // Feedback banner general
  const [feedback, setFeedback] = useState(null)

  // Carga de Resumen
  const cargarResumen = useCallback(() => {
    getPlanCuentasResumen()
      .then((data) => setResumen(data))
      .catch(() => {
        // En caso de que el backend no tenga aún datos
      })
      .finally(() => setLoadingResumen(false))
  }, [])

  useEffect(() => {
    cargarResumen()
  }, [cargarResumen])

  // Carga del árbol según la clase seleccionada
  const cargarArbol = useCallback((claseId) => {
    getPlanCuentasArbol(claseId)
      .then((data) => {
        setTreeData(data)
        // Auto-expandir niveles 1 y 2
        const ids = new Set()
        function expandInitial(arr) {
          const list = Array.isArray(arr) ? arr : arr ? [arr] : []
          list.forEach((n) => {
            if (Number(n.nivel) <= 2) {
              ids.add(n.id)
            }
            if (n.hijos) expandInitial(n.hijos)
            if (n.children) expandInitial(n.children)
          })
        }
        expandInitial(data)
        setExpandedIds(ids)
      })
      .catch((err) => {
        setErrorTree(
          getApiErrorMessage(
            err,
            'Error al cargar la nomenclatura contable de la clase seleccionada.',
          ),
        )
      })
      .finally(() => setLoadingTree(false))
  }, [])

  useEffect(() => {
    cargarArbol(selectedClase)
  }, [selectedClase, cargarArbol])

  // Cargar detalle completo de cuenta
  const handleSelectAccount = useCallback((account) => {
    if (!account?.id) return
    setSelectedAccountId(account.id)
    setLoadingDetail(true)
    setErrorDetail(null)

    getPlanCuenta(account.id)
      .then((data) => {
        setSelectedAccountDetail(data)
      })
      .catch((err) => {
        setErrorDetail(
          getApiErrorMessage(
            err,
            'Error al obtener el detalle de la cuenta seleccionada.',
          ),
        )
      })
      .finally(() => setLoadingDetail(false))
  }, [])

  // Cambio de clase
  function handleChangeClase(claseId) {
    if (claseId === selectedClase && !isSearching) return
    setIsSearching(false)
    setSearchQuery('')
    setSearchResults(null)
    setSelectedClase(claseId)
    setLoadingTree(true)
    setErrorTree(null)
  }

  // Manejo de búsqueda
  async function handleSearch(e) {
    e?.preventDefault()
    const q = searchQuery.trim()
    if (!q) {
      handleClearSearch()
      return
    }

    setIsSearching(true)
    setLoadingSearch(true)
    setErrorSearch(null)

    try {
      const data = await listPlanCuentas({ q })
      const list = Array.isArray(data) ? data : data?.items || []
      setSearchResults(list)
    } catch (err) {
      setErrorSearch(
        getApiErrorMessage(
          err,
          'Error al buscar cuentas en el plan contable.',
        ),
      )
    } finally {
      setLoadingSearch(false)
    }
  }

  function handleClearSearch() {
    setIsSearching(false)
    setSearchQuery('')
    setSearchResults(null)
    setErrorSearch(null)
  }

  // Toggles de árbol
  function handleToggleExpand(nodeId) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(nodeId)) {
        next.delete(nodeId)
      } else {
        next.add(nodeId)
      }
      return next
    })
  }

  function handleExpandAll() {
    if (treeData) {
      setExpandedIds(collectAllIds(treeData))
    }
  }

  function handleCollapseAll() {
    setExpandedIds(new Set())
  }

  // Abrir modal de creación
  function handleOpenCrear(parent = null) {
    setParentForCrear(parent)
    setModalCrearOpen(true)
  }

  // Callbacks de éxito tras mutaciones
  function handleCrearSuccess(nuevaCuenta) {
    setFeedback({
      variant: 'success',
      message: `Cuenta analítica ${nuevaCuenta.codigo} (${nuevaCuenta.nombre}) creada con éxito.`,
    })
    cargarResumen()
    cargarArbol(selectedClase)
    if (nuevaCuenta?.id) {
      handleSelectAccount(nuevaCuenta)
    }
  }

  function handleEditarSuccess(cuentaActualizada) {
    setFeedback({
      variant: 'success',
      message: `Cuenta analítica ${cuentaActualizada.codigo} actualizada con éxito.`,
    })
    cargarArbol(selectedClase)
    handleSelectAccount(cuentaActualizada)
  }

  function handleEstadoSuccess(cuentaActualizada) {
    const estadoStr =
      cuentaActualizada.estado === 'ACTIVA' ? 'activada' : 'desactivada'
    setFeedback({
      variant: 'success',
      message: `Cuenta analítica ${cuentaActualizada.codigo} ${estadoStr} correctamente.`,
    })
    cargarResumen()
    cargarArbol(selectedClase)
    handleSelectAccount(cuentaActualizada)
  }

  function handleEliminarSuccess(deletedId) {
    setFeedback({
      variant: 'info',
      message: 'Cuenta analítica eliminada del catálogo.',
    })
    cargarResumen()
    cargarArbol(selectedClase)
    if (selectedAccountId === deletedId) {
      setSelectedAccountId(null)
      setSelectedAccountDetail(null)
    }
  }

  const activeClaseObj = CLASES_CONTABLES.find((c) => c.id === selectedClase)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Encabezado */}
      <PageHeader
        title="Plan de Cuentas"
        subtitle="Nomenclatura oficial ASFI (Manual de Cuentas MCEF Título II) y cuentas analíticas de la cooperativa (CU-W29)."
        action={
          <Button
            variant="primary"
            className="gap-2 !bg-[#064e3b]"
            onClick={() => handleOpenCrear(null)}
          >
            <span className="material-symbols-outlined text-[18px]">
              add_circle
            </span>
            <span>Nueva Cuenta Analítica</span>
          </Button>
        }
      />

      {/* Banner de Feedback Global */}
      {feedback && (
        <AlertBanner
          variant={feedback.variant}
          dismissible
          onDismiss={() => setFeedback(null)}
        >
          {feedback.message}
        </AlertBanner>
      )}

      {/* Tarjetas Resumen */}
      <PlanCuentasResumenCards resumen={resumen} loading={loadingResumen} />

      {/* Selector de Clases Contables (100 a 900) */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-card space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Clases Contables MCEF (ASFI)
          </span>
          {activeClaseObj && (
            <span className="text-[11px] text-slate-500 hidden sm:inline">
              Naturaleza ordinaria:{' '}
              <strong className="text-slate-800">
                {activeClaseObj.naturaleza}
              </strong>
            </span>
          )}
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {CLASES_CONTABLES.map((clase) => {
            const isActive = selectedClase === clase.id && !isSearching
            return (
              <button
                key={clase.id}
                type="button"
                onClick={() => handleChangeClase(clase.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer border ${
                  isActive
                    ? 'bg-[#064e3b] text-white border-[#064e3b] shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                }`}
                title={clase.descripcion}
              >
                <span className="font-mono text-[11px] font-bold opacity-90">
                  {clase.codigo}
                </span>
                <span>{clase.nombre}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Área Principal de Trabajo: Árbol / Búsqueda + Detalle */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Columna Izquierda: Búsqueda y Árbol Jerárquico (7 de 12) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Barra de Búsqueda */}
          <form
            onSubmit={handleSearch}
            className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-200 shadow-xs"
          >
            <div className="relative flex-1">
              <span className="material-symbols-outlined text-[18px] text-slate-400 absolute left-3 top-1/2 -translate-y-1/2">
                search
              </span>
              <input
                type="text"
                placeholder="Buscar por código (ej. 111.01) o nombre de cuenta..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-8 text-xs font-sans rounded-lg border-0 bg-transparent text-[#0b1c30] placeholder:text-slate-400 outline-none focus:ring-0"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    close
                  </span>
                </button>
              )}
            </div>

            <Button
              type="submit"
              variant="secondary"
              size="sm"
              loading={loadingSearch}
              className="gap-1 shrink-0"
            >
              <span>Buscar</span>
            </Button>
          </form>

          {/* Vista de Búsqueda Activa */}
          {isSearching ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50 text-xs">
                <span className="font-semibold text-slate-700">
                  Resultados para: "{searchQuery}"
                </span>
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="text-emerald-700 font-semibold hover:underline flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[15px]">
                    arrow_back
                  </span>
                  <span>Volver al árbol</span>
                </button>
              </div>

              {errorSearch && (
                <div className="p-4">
                  <AlertBanner variant="error">{errorSearch}</AlertBanner>
                </div>
              )}

              {loadingSearch ? (
                <div className="p-4 space-y-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : searchResults && searchResults.length === 0 ? (
                <div className="p-8 text-center text-slate-400 space-y-2">
                  <span className="material-symbols-outlined text-[32px] text-slate-300 block mb-1">
                    search_off
                  </span>
                  <p className="text-xs font-semibold text-slate-700">
                    No se encontraron cuentas con el criterio ingresado.
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Intente con otro código numérico o palabras clave en el nombre.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                  {searchResults?.map((acc) => {
                    const isSelected = selectedAccountId === acc.id
                    return (
                      <div
                        key={acc.id}
                        onClick={() => handleSelectAccount(acc)}
                        className={`p-3.5 flex items-center justify-between gap-3 cursor-pointer transition ${
                          isSelected
                            ? 'bg-emerald-50/80 border-l-4 border-[#064e3b]'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-[#064e3b]">
                              {acc.codigo}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              Nivel {acc.nivel} ({getNivelNombre(acc.nivel)})
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-slate-800 truncate">
                            {acc.nombre}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <Badge
                            variant={acc.naturaleza === 'DEUDORA' ? 'teal' : 'navy'}
                            className="!text-[9px] !py-0 !px-1.5"
                          >
                            {acc.naturaleza === 'DEUDORA' ? 'D' : 'A'}
                          </Badge>
                          {acc.es_oficial ? (
                            <Badge variant="slate" className="!text-[9px] !py-0 !px-1.5">
                              ASFI
                            </Badge>
                          ) : (
                            <Badge variant="purple" className="!text-[9px] !py-0 !px-1.5">
                              Analítica
                            </Badge>
                          )}
                          {acc.estado === 'INACTIVA' && (
                            <Badge variant="red" className="!text-[9px] !py-0 !px-1.5">
                              Inactiva
                            </Badge>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Vista del Árbol Jerárquico */
            <div>
              {errorTree && (
                <div className="mb-4">
                  <AlertBanner variant="error">{errorTree}</AlertBanner>
                </div>
              )}

              {loadingTree ? (
                <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-card space-y-3">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-5/6" />
                  <Skeleton className="h-8 w-4/6" />
                  <Skeleton className="h-8 w-3/6" />
                </div>
              ) : (
                <PlanCuentasTree
                  data={treeData}
                  selectedId={selectedAccountId}
                  onSelectAccount={handleSelectAccount}
                  onOpenCrearAnalitica={handleOpenCrear}
                  expandedIds={expandedIds}
                  onToggleExpand={handleToggleExpand}
                  onExpandAll={handleExpandAll}
                  onCollapseAll={handleCollapseAll}
                />
              )}
            </div>
          )}
        </div>

        {/* Columna Derecha: Panel de Detalle y Operaciones (5 de 12) */}
        <div className="lg:col-span-5 sticky top-6">
          <PlanCuentaDetailPanel
            account={selectedAccountDetail}
            loading={loadingDetail}
            error={errorDetail}
            onOpenCrearAnalitica={handleOpenCrear}
            onOpenEditar={() => setModalEditarOpen(true)}
            onOpenCambiarEstado={() => setModalEstadoOpen(true)}
            onOpenEliminar={() => setModalEliminarOpen(true)}
          />
        </div>
      </div>

      {/* Modales de Operación */}
      <CrearAnaliticaModal
        open={modalCrearOpen}
        onClose={() => setModalCrearOpen(false)}
        parentAccount={parentForCrear}
        onSuccess={handleCrearSuccess}
      />

      <EditarAnaliticaModal
        open={modalEditarOpen}
        onClose={() => setModalEditarOpen(false)}
        account={selectedAccountDetail}
        onSuccess={handleEditarSuccess}
      />

      <CambiarEstadoModal
        open={modalEstadoOpen}
        onClose={() => setModalEstadoOpen(false)}
        account={selectedAccountDetail}
        onSuccess={handleEstadoSuccess}
      />

      <EliminarAnaliticaModal
        open={modalEliminarOpen}
        onClose={() => setModalEliminarOpen(false)}
        account={selectedAccountDetail}
        onSuccess={handleEliminarSuccess}
      />
    </div>
  )
}
