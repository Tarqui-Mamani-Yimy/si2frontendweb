import { useState, useEffect, useMemo } from 'react'
import PageHeader from '../../../components/ui/PageHeader'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import AlertBanner from '../../../components/ui/AlertBanner'
import Skeleton from '../../../components/ui/Skeleton'
import AtenderAlertaModal from '../components/alertas/AtenderAlertaModal'
import DescartarAlertaModal from '../components/alertas/DescartarAlertaModal'
import CreditoDetalleModal from '../components/creditos/CreditoDetalleModal'
import {
  ejecutarMonitoreoMora,
  listarAlertas,
  getResumenMonitoreo,
} from '../../../core/api/creditosApi'

function formatMoney(value, simbolo = 'Bs.') {
  const n = Number(value ?? 0)
  return `${simbolo} ${n.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(isoStr) {
  if (!isoStr) return '—'
  const d = new Date(isoStr)
  if (isNaN(d.getTime())) return isoStr
  return d.toLocaleDateString('es-BO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function formatDateTime(isoStr) {
  if (!isoStr) return '—'
  const d = new Date(isoStr)
  if (isNaN(d.getTime())) return isoStr
  return d.toLocaleString('es-BO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getSeveridadBadgeVariant(severidad) {
  switch (severidad) {
    case 'CRITICA':
      return 'red'
    case 'ADVERTENCIA':
      return 'amber'
    case 'INFO':
      return 'indigo'
    default:
      return 'slate'
  }
}

function getEstadoAlertaBadgeVariant(estado) {
  switch (estado) {
    case 'ACTIVA':
      return 'rose'
    case 'ATENDIDA':
      return 'green'
    case 'DESCARTADA':
      return 'slate'
    case 'RESUELTA':
      return 'teal'
    default:
      return 'slate'
  }
}

function getRiesgoBadgeVariant(nivel) {
  switch (nivel) {
    case 'ALTO':
      return 'red'
    case 'MEDIO':
      return 'amber'
    case 'BAJO':
      return 'green'
    default:
      return 'slate'
  }
}

/**
 * AlertasPage — Centro de Monitoreo Predictivo de Mora y Alertas de Cartera (CU-W28).
 * Accesible para Oficial de Crédito y Administrador.
 */
export default function AlertasPage() {
  const [resumen, setResumen] = useState(null)
  const [alertas, setAlertas] = useState([])
  const [loading, setLoading] = useState(true)
  const [executingRun, setExecutingRun] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  // Filtros
  const [filtroEstado, setFiltroEstado] = useState('ACTIVA') // 'ACTIVA' por defecto, '' = todas
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroSeveridad, setFiltroSeveridad] = useState('')
  const [busqueda, setBusqueda] = useState('')

  // Modales
  const [alertaParaAtender, setAlertaParaAtender] = useState(null)
  const [alertaParaDescartar, setAlertaParaDescartar] = useState(null)
  const [creditoModalId, setCreditoModalId] = useState(null)

  // Carga inicial
  useEffect(() => {
    let isMounted = true
    Promise.all([
      getResumenMonitoreo(),
      listarAlertas({ estado: 'ACTIVA' }),
    ])
      .then(([resData, alertsData]) => {
        if (!isMounted) return
        setResumen(resData)
        setAlertas(Array.isArray(alertsData) ? alertsData : [])
      })
      .catch((err) => {
        if (!isMounted) return
        setError(
          err.response?.data?.detail ||
            'Error al cargar el resumen de monitoreo y alertas de mora.',
        )
      })
      .finally(() => {
        if (!isMounted) return
        setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  async function reloadAlertas(paramsOverride = {}) {
    setLoading(true)
    setError(null)
    try {
      const params = {}
      const est = paramsOverride.estado !== undefined ? paramsOverride.estado : filtroEstado
      const tip = paramsOverride.tipo !== undefined ? paramsOverride.tipo : filtroTipo
      const sev = paramsOverride.severidad !== undefined ? paramsOverride.severidad : filtroSeveridad

      if (est) params.estado = est
      if (tip) params.tipo = tip
      if (sev) params.severidad = sev

      const data = await listarAlertas(params)
      setAlertas(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(
        err.response?.data?.detail || 'Error al filtrar las alertas de mora.',
      )
    } finally {
      setLoading(false)
    }
  }

  async function reloadResumen() {
    try {
      const data = await getResumenMonitoreo()
      setResumen(data)
    } catch {
      // Ignorar fallo de resumen si alertas cargaron
    }
  }

  async function handleEjecutarMonitoreo() {
    setExecutingRun(true)
    setError(null)
    setSuccessMessage(null)
    try {
      const resultado = await ejecutarMonitoreoMora()
      setSuccessMessage(
        `Monitoreo predictivo completado con éxito: ${resultado.creditos_monitoreados} créditos evaluados, ${resultado.alertas_creadas} alertas generadas, ${resultado.alertas_resueltas} alertas resueltas automáticamente.`,
      )
      await Promise.all([reloadResumen(), reloadAlertas()])
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          'Error al ejecutar la corrida de monitoreo predictivo de mora.',
      )
    } finally {
      setExecutingRun(false)
    }
  }

  function handleFilterEstado(nuevoEstado) {
    setFiltroEstado(nuevoEstado)
    reloadAlertas({ estado: nuevoEstado })
  }

  function handleFilterTipo(nuevoTipo) {
    setFiltroTipo(nuevoTipo)
    reloadAlertas({ tipo: nuevoTipo })
  }

  function handleFilterSeveridad(nuevaSeveridad) {
    setFiltroSeveridad(nuevaSeveridad)
    reloadAlertas({ severidad: nuevaSeveridad })
  }

  function handleAtencionExitosa(updatedAlerta) {
    setSuccessMessage(
      `Gestión de cobranza registrada para el crédito ${updatedAlerta.credito?.numero_credito || `#${updatedAlerta.credito?.id}`}. Alerta marcada como ATENDIDA.`,
    )
    reloadAlertas()
    reloadResumen()
  }

  function handleDescarteExitoso(updatedAlerta) {
    setSuccessMessage(
      `Alerta del crédito ${updatedAlerta.credito?.numero_credito || `#${updatedAlerta.credito?.id}`} descartada correctamente.`,
    )
    reloadAlertas()
    reloadResumen()
  }

  // Filtrado local por término de búsqueda
  const alertasFiltradas = useMemo(() => {
    if (!busqueda.trim()) return alertas
    const term = busqueda.trim().toLowerCase()
    return alertas.filter((a) => {
      const numCred = a.credito?.numero_credito?.toLowerCase() || ''
      const socNom = a.socio?.nombre_completo?.toLowerCase() || ''
      const socCi = a.socio?.ci?.toLowerCase() || ''
      const msg = a.mensaje?.toLowerCase() || ''
      return (
        numCred.includes(term) ||
        socNom.includes(term) ||
        socCi.includes(term) ||
        msg.includes(term)
      )
    })
  }, [alertas, busqueda])

  const porMoneda = Array.isArray(resumen?.por_moneda) ? resumen.por_moneda : []
  const topRiesgo = Array.isArray(resumen?.top_riesgo) ? resumen.top_riesgo : []
  const creditosRiesgo = resumen?.creditos_por_riesgo || {}
  const alertasActivas = resumen?.alertas_activas || {}

  return (
    <div className="space-y-6">
      {/* ── Encabezado Institucional ── */}
      <PageHeader
        title="Monitoreo Predictivo de Mora y Alertas"
        subtitle="Detección temprana de mora, alertas por cuotas vencidas y modelo predictivo de riesgo (CU-W28)"
        actions={
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                reloadResumen()
                reloadAlertas()
              }}
              loading={loading && !executingRun}
              className="gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">refresh</span>
              <span>Actualizar</span>
            </Button>

            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleEjecutarMonitoreo}
              loading={executingRun}
              className="gap-1.5 bg-[#064e3b] hover:bg-[#043327] text-white shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px]">radar</span>
              <span>Ejecutar Monitoreo</span>
            </Button>
          </div>
        }
      />

      {/* ── Banners de Alerta / Éxito ── */}
      {successMessage && (
        <AlertBanner variant="success" dismissible onDismiss={() => setSuccessMessage(null)}>
          {successMessage}
        </AlertBanner>
      )}

      {error && (
        <AlertBanner variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </AlertBanner>
      )}

      {/* ── Sección 1: Métricas de Mora por Moneda e Indicadores de Cartera ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#064e3b] text-[20px]">analytics</span>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Índice de Morosidad y Estado de Cartera
            </h3>
          </div>
          {resumen?.ultima_ejecucion && (
            <span className="text-[11px] text-slate-500 font-mono">
              Última corrida: {formatDateTime(resumen.ultima_ejecucion)}
            </span>
          )}
        </div>

        {/* Tarjetas por Moneda */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {porMoneda.length === 0 ? (
            <div className="md:col-span-2 p-6 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
              <span className="text-xs">No se registran datos consolidados de cartera por moneda.</span>
            </div>
          ) : (
            porMoneda.map((item, idx) => {
              const sim =
                typeof item.moneda === 'object' ? item.moneda?.simbolo : item.moneda || 'Bs.'
              const iso =
                typeof item.moneda === 'object' ? item.moneda?.codigo_iso : item.moneda || 'BOB'
              const indice = Number(item.indice_mora ?? 0)
              const esAlto = indice > 5
              const esMedio = indice > 2 && indice <= 5

              return (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                        {iso}
                      </span>
                      <span className="text-xs font-bold text-slate-700">
                        Cartera en {iso} ({sim})
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">
                        Índice Mora:
                      </span>
                      <Badge variant={esAlto ? 'red' : esMedio ? 'amber' : 'green'}>
                        {indice.toFixed(2)}%
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                        Cartera Vigente Total
                      </span>
                      <span className="font-mono font-bold text-slate-900 text-sm block mt-0.5">
                        {formatMoney(item.cartera_total, sim)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                        Cartera en Mora
                      </span>
                      <span
                        className={`font-mono font-bold text-sm block mt-0.5 ${
                          Number(item.cartera_en_mora ?? 0) > 0 ? 'text-rose-600' : 'text-slate-700'
                        }`}
                      >
                        {formatMoney(item.cartera_en_mora, sim)}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* ── Sección 2: Alertas Activas por Severidad y Distribución de Riesgo ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Conteo de Alertas por Severidad (5 cols) */}
        <div className="lg:col-span-5 p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[17px] text-rose-600">notifications_active</span>
              <span>Alertas Activas por Severidad</span>
            </span>
            <span className="font-mono text-xs font-bold text-slate-600">
              {(alertasActivas.CRITICA || 0) + (alertasActivas.ADVERTENCIA || 0) + (alertasActivas.INFO || 0)} total
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-3 rounded-lg bg-red-50/70 border border-red-200/80 space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-red-700 block">
                Críticas
              </span>
              <span className="font-mono font-bold text-xl text-red-900 block">
                {alertasActivas.CRITICA ?? 0}
              </span>
              <span className="text-[9px] text-red-600 block">Mora &gt; gracia</span>
            </div>

            <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-200/80 space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">
                Advertencia
              </span>
              <span className="font-mono font-bold text-xl text-amber-900 block">
                {alertasActivas.ADVERTENCIA ?? 0}
              </span>
              <span className="text-[9px] text-amber-600 block">Vencida / Riesgo</span>
            </div>

            <div className="p-3 rounded-lg bg-indigo-50/70 border border-indigo-200/80 space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block">
                Informativas
              </span>
              <span className="font-mono font-bold text-xl text-indigo-900 block">
                {alertasActivas.INFO ?? 0}
              </span>
              <span className="text-[9px] text-indigo-600 block">Por vencer 0–5d</span>
            </div>
          </div>
        </div>

        {/* Modelo Sintético de Riesgo (IA) (7 cols) */}
        <div className="lg:col-span-7 p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-indigo-600">psychology</span>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Distribución de Riesgo de Cartera
              </span>
            </div>
            <Badge variant="indigo" className="!text-[9px] !py-0 !px-1.5 font-bold">
              Modelo sintético (informativo)
            </Badge>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
            <div className="p-2.5 rounded-lg border border-red-100 bg-red-50/50">
              <span className="text-[10px] uppercase font-bold text-red-700 block">Riesgo Alto</span>
              <span className="font-mono font-bold text-base text-red-900 block mt-0.5">
                {creditosRiesgo.ALTO ?? 0}
              </span>
              <span className="text-[9px] text-slate-500">Prob &gt; 40%</span>
            </div>

            <div className="p-2.5 rounded-lg border border-amber-100 bg-amber-50/50">
              <span className="text-[10px] uppercase font-bold text-amber-700 block">Riesgo Medio</span>
              <span className="font-mono font-bold text-base text-amber-900 block mt-0.5">
                {creditosRiesgo.MEDIO ?? 0}
              </span>
              <span className="text-[9px] text-slate-500">Prob 15–40%</span>
            </div>

            <div className="p-2.5 rounded-lg border border-emerald-100 bg-emerald-50/50">
              <span className="text-[10px] uppercase font-bold text-emerald-700 block">Riesgo Bajo</span>
              <span className="font-mono font-bold text-base text-emerald-900 block mt-0.5">
                {creditosRiesgo.BAJO ?? 0}
              </span>
              <span className="text-[9px] text-slate-500">Prob &lt; 15%</span>
            </div>

            <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Sin Predicción</span>
              <span className="font-mono font-bold text-base text-slate-800 block mt-0.5">
                {creditosRiesgo.SIN_PREDICCION ?? 0}
              </span>
              <span className="text-[9px] text-slate-400">Sin scoring W23</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Sección 3: Top 5 Créditos con Mayor Probabilidad de Mora Estimada ── */}
      {topRiesgo.length > 0 && (
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-amber-600">warning</span>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Top Créditos en Mayor Riesgo Predictivo
              </span>
            </div>
            <span className="text-[10px] text-indigo-700 font-semibold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
              Modelo sintético (informativo)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase font-bold text-slate-400">
                  <th className="py-2 px-3">Crédito</th>
                  <th className="py-2 px-3">Socio</th>
                  <th className="py-2 px-3 text-center">Probabilidad Mora</th>
                  <th className="py-2 px-3 text-center">Nivel Riesgo</th>
                  <th className="py-2 px-3 text-right">Saldo Pendiente</th>
                  <th className="py-2 px-3 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11px]">
                {topRiesgo.map((t) => {
                  const socNombre = t.socio?.nombre_completo || `Socio #${t.socio?.id || '—'}`
                  const prob = t.probabilidad_mora != null ? (Number(t.probabilidad_mora) * 100).toFixed(1) : '—'
                  return (
                    <tr key={t.credito_id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                        {t.numero_credito || `CRE-#${t.credito_id}`}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                        {socNombre}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-rose-700">
                        {prob}%
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <Badge variant={getRiesgoBadgeVariant(t.nivel_riesgo)}>
                          {t.nivel_riesgo || 'SIN DATOS'}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                        {formatMoney(t.saldo_pendiente)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => setCreditoModalId(t.credito_id)}
                          className="!py-0.5 !px-2 !text-[11px]"
                          title="Ver detalle del crédito y cronograma"
                        >
                          Ver
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Sección 4: Bandeja de Alertas de Mora y Filtros Operativos ── */}
      <div className="space-y-4">
        {/* Barra de Filtros */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
          {/* Filtros de Pestañas de Estado */}
          <div className="flex flex-wrap items-center gap-1.5 border-b lg:border-b-0 pb-2 lg:pb-0">
            {[
              { id: 'ACTIVA', label: 'Activas' },
              { id: 'ATENDIDA', label: 'Atendidas' },
              { id: 'DESCARTADA', label: 'Descartadas' },
              { id: 'RESUELTA', label: 'Resueltas' },
              { id: '', label: 'Todas' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleFilterEstado(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filtroEstado === tab.id
                    ? 'bg-[#064e3b] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Filtros Secundarios y Búsqueda */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Filtro Tipo */}
            <select
              value={filtroTipo}
              onChange={(e) => handleFilterTipo(e.target.value)}
              className="text-xs py-1.5 px-2.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-[#064e3b]"
            >
              <option value="">Todos los tipos</option>
              <option value="CUOTA_POR_VENCER">Por vencer (0–5d)</option>
              <option value="CUOTA_VENCIDA">Cuota vencida</option>
              <option value="MORA">En Mora</option>
              <option value="RIESGO_ALTO">Riesgo Alto (IA)</option>
            </select>

            {/* Filtro Severidad */}
            <select
              value={filtroSeveridad}
              onChange={(e) => handleFilterSeveridad(e.target.value)}
              className="text-xs py-1.5 px-2.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-[#064e3b]"
            >
              <option value="">Todas las severidades</option>
              <option value="CRITICA">Crítica</option>
              <option value="ADVERTENCIA">Advertencia</option>
              <option value="INFO">Informativa</option>
            </select>

            {/* Búsqueda */}
            <div className="relative w-full sm:w-60">
              <span className="material-symbols-outlined absolute left-2.5 top-2 text-slate-400 text-[16px]">
                search
              </span>
              <input
                type="text"
                placeholder="Buscar socio, crédito o CI..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-[#064e3b]"
              />
            </div>
          </div>
        </div>

        {/* Tabla / Lista de Alertas */}
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        ) : alertasFiltradas.length === 0 ? (
          <div className="p-12 text-center rounded-xl border border-dashed border-slate-300 bg-white space-y-2">
            <span className="material-symbols-outlined text-[36px] text-slate-300 block">
              verified
            </span>
            <h4 className="text-sm font-bold text-slate-700">
              No hay alertas que coincidan con los filtros seleccionados
            </h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              {busqueda || filtroTipo || filtroSeveridad
                ? 'Pruebe ajustando o limpiando los criterios de búsqueda y filtros.'
                : 'No existen alertas activas actualmente en la cartera de créditos.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {alertasFiltradas.map((alerta) => {
              const numCred = alerta.credito?.numero_credito || `CRE-#${alerta.credito?.id || '—'}`
              const socNombre = alerta.socio?.nombre_completo || `Socio #${alerta.socio?.id || '—'}`
              const esActiva = alerta.estado === 'ACTIVA'

              return (
                <div
                  key={alerta.id}
                  className={`p-4 rounded-xl border transition-all bg-white shadow-xs ${
                    alerta.severidad === 'CRITICA' && esActiva
                      ? 'border-red-200 hover:border-red-300'
                      : alerta.severidad === 'ADVERTENCIA' && esActiva
                      ? 'border-amber-200 hover:border-amber-300'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    {/* Contenido Principal */}
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={getSeveridadBadgeVariant(alerta.severidad)}>
                          {alerta.severidad}
                        </Badge>
                        <Badge variant={getEstadoAlertaBadgeVariant(alerta.estado)}>
                          {alerta.estado}
                        </Badge>
                        <span className="font-mono text-xs font-bold text-slate-800">
                          {alerta.tipo}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          &bull; Emitida: {formatDateTime(alerta.fecha_creacion)}
                        </span>
                      </div>

                      <p className="text-xs font-semibold text-slate-900 leading-snug">
                        {alerta.mensaje}
                      </p>

                      <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-[11px] text-slate-600">
                        <div>
                          <span className="text-slate-400">Crédito: </span>
                          <span className="font-mono font-bold text-slate-800">{numCred}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Socio: </span>
                          <span className="font-bold text-slate-800">{socNombre}</span>
                          {alerta.socio?.ci && (
                            <span className="text-slate-500 font-mono text-[10px] ml-1">
                              (C.I. {alerta.socio.ci})
                            </span>
                          )}
                        </div>
                        {alerta.cuota && (
                          <div>
                            <span className="text-slate-400">Cuota: </span>
                            <span className="font-mono text-slate-800 font-semibold">
                              #{alerta.cuota.numero} (Vto: {formatDate(alerta.cuota.fecha_vencimiento)})
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Detalles de Cierre / Gestión si no está ACTIVA */}
                      {alerta.estado === 'ATENDIDA' && alerta.gestion && (
                        <div className="mt-2 p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200/70 text-xs text-emerald-950 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[10px] uppercase tracking-wider text-emerald-800">
                              Gestión de Cobranza Registrada ({alerta.gestion.tipo_contacto})
                            </span>
                            <span className="font-mono text-[10px] text-emerald-700">
                              {formatDateTime(alerta.gestion.fecha)}
                            </span>
                          </div>
                          <p className="text-[11px] italic text-emerald-900">
                            &ldquo;{alerta.gestion.resultado_gestion}&rdquo;
                          </p>
                          {alerta.gestion.fecha_compromiso_pago && (
                            <div className="text-[10px] text-emerald-800 font-semibold">
                              Compromiso de Pago: {formatDate(alerta.gestion.fecha_compromiso_pago)}
                            </div>
                          )}
                        </div>
                      )}

                      {alerta.estado === 'DESCARTADA' && (
                        <div className="mt-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-0.5">
                          <span className="font-bold text-[10px] uppercase text-slate-500 block">
                            Motivo de Descarte:
                          </span>
                          <p className="text-[11px] italic">
                            &ldquo;{alerta.comentario_cierre || 'Sin comentario'}&rdquo;
                          </p>
                        </div>
                      )}

                      {alerta.estado === 'RESUELTA' && (
                        <div className="mt-1 text-[11px] text-teal-800 font-medium">
                          Resuelta automáticamente al regularizarse la cuota en corrida de monitoreo.
                        </div>
                      )}
                    </div>

                    {/* Botones de Acción */}
                    <div className="flex sm:flex-col items-center sm:items-end gap-1.5 shrink-0 pt-2 sm:pt-0">
                      {esActiva && (
                        <>
                          <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            onClick={() => setAlertaParaAtender(alerta)}
                            className="gap-1 !text-xs !py-1 !px-2.5 bg-[#064e3b] text-white hover:bg-[#043327]"
                            title="Registrar gestión de cobro efectuada"
                          >
                            <span className="material-symbols-outlined text-[15px]">support_agent</span>
                            <span>Atender</span>
                          </Button>

                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => setAlertaParaDescartar(alerta)}
                            className="gap-1 !text-xs !py-1 !px-2.5 text-slate-600 hover:text-slate-900"
                            title="Descartar alerta con justificación"
                          >
                            <span className="material-symbols-outlined text-[15px]">close</span>
                            <span>Descartar</span>
                          </Button>
                        </>
                      )}

                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setCreditoModalId(alerta.credito?.id)}
                        className="gap-1 !text-xs !py-1 !px-2.5"
                        title="Ver detalle del crédito y cronograma"
                      >
                        <span className="material-symbols-outlined text-[15px]">visibility</span>
                        <span>Ver Crédito</span>
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Modal de Atención de Alerta (CU-W28) ── */}
      {alertaParaAtender && (
        <AtenderAlertaModal
          open={Boolean(alertaParaAtender)}
          onClose={() => setAlertaParaAtender(null)}
          alerta={alertaParaAtender}
          onSuccess={handleAtencionExitosa}
        />
      )}

      {/* ── Modal de Descarte de Alerta (CU-W28) ── */}
      {alertaParaDescartar && (
        <DescartarAlertaModal
          open={Boolean(alertaParaDescartar)}
          onClose={() => setAlertaParaDescartar(null)}
          alerta={alertaParaDescartar}
          onSuccess={handleDescarteExitoso}
        />
      )}

      {/* ── Modal de Detalle de Crédito (CU-W24 / CU-W27 / CU-W28) ── */}
      {creditoModalId && (
        <CreditoDetalleModal
          open={Boolean(creditoModalId)}
          onClose={() => setCreditoModalId(null)}
          creditoId={creditoModalId}
          onUpdated={() => {
            reloadAlertas()
            reloadResumen()
          }}
        />
      )}
    </div>
  )
}
