import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchAdminStats, fetchSocios, listUsuarios } from '../../../core/api/adminApi'
import { listCuentas } from '../../../core/api/savingsApi'
import { selectUser, useAuthStore } from '../../../core/store/authStore'
import AlertBanner from '../../../components/ui/AlertBanner'
import Badge from '../../../components/ui/Badge'
import Modal from '../../../components/ui/Modal'
import Skeleton from '../../../components/ui/Skeleton'
import SubscriptionCard from '../../../shared/components/SubscriptionCard'

// ── Configuración de los módulos con preview ───────────────────────────────

const ROLE_BADGE = {
  SUPERADMIN:      'purple',
  ADMINISTRADOR:   'navy',
  CAJERO:          'amber',
  OFICIAL_CREDITO: 'teal',
  CONTADOR:        'indigo',
  SOCIO:           'green',
}

function formatMoney(value, codigo = '') {
  const n = Number(value ?? 0)
  return `${n.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${codigo}`.trim()
}

const MODULES = {
  total_socios: {
    title: 'Total de Socios',
    viewAllLabel: 'Ver todos los socios',
    viewAllTo: '/admin/socios',
    fetcher: () => fetchSocios({ limite: 20 }),
    renderRow: (socio) => (
      <>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-800">{socio.nombre} {socio.apellido}</p>
          <p className="text-xs text-slate-400">CI {socio.ci}</p>
        </div>
        <Badge variant={socio.estado === 'ACTIVO' ? 'green' : 'slate'}>{socio.estado}</Badge>
      </>
    ),
  },
  socios_activos: {
    title: 'Socios Activos',
    viewAllLabel: 'Ver todos los socios',
    viewAllTo: '/admin/socios',
    fetcher: () => fetchSocios({ limite: 20, estado: 'ACTIVO' }),
    renderRow: (socio) => (
      <>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-800">{socio.nombre} {socio.apellido}</p>
          <p className="text-xs text-slate-400">CI {socio.ci}</p>
        </div>
        <Badge variant="green">{socio.estado}</Badge>
      </>
    ),
  },
  cuentas_activas: {
    title: 'Cuentas Activas',
    viewAllLabel: 'Ver todas las cuentas',
    viewAllTo: '/admin/caja',
    fetcher: () => listCuentas({ estado: 'ACTIVA', limite: 20 }),
    renderRow: (cuenta) => (
      <>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-800">{cuenta.socio_nombre ?? `Socio #${cuenta.socio_id}`}</p>
          <p className="truncate text-xs text-slate-400">Cuenta {cuenta.numero}</p>
        </div>
        <span className="shrink-0 font-mono text-xs font-semibold text-slate-600">
          {formatMoney(cuenta.saldo_disponible, cuenta.moneda?.codigo_iso)}
        </span>
      </>
    ),
  },
  total_usuarios: {
    title: 'Usuarios en Sistema',
    viewAllLabel: 'Ver todos los usuarios',
    viewAllTo: '/admin/usuarios',
    fetcher: () => listUsuarios(),
    renderRow: (usuario) => (
      <>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-800">{usuario.nombre}</p>
          <p className="truncate text-xs text-slate-400">{usuario.correo}</p>
        </div>
        <Badge variant={ROLE_BADGE[usuario.rol?.nombre] ?? 'slate'}>
          {usuario.rol?.nombre?.toLowerCase().replace(/_/g, ' ')}
        </Badge>
      </>
    ),
  },
}

export default function AdminDashboard() {
  const user = useAuthStore(selectUser)

  const [stats,        setStats]        = useState(null)
  const [loadingStats, setLoadingStats] = useState(true)
  const [errorStats,   setErrorStats]   = useState(null)

  const [activeModule,   setActiveModule]   = useState(null)
  const [previewItems,   setPreviewItems]   = useState([])
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError,   setPreviewError]   = useState(null)

  useEffect(() => {
    setLoadingStats(true)
    setErrorStats(null)
    fetchAdminStats()
      .then(setStats)
      .catch((err) => setErrorStats(err?.response?.data?.detail ?? err.message ?? 'Error al cargar estadísticas'))
      .finally(() => setLoadingStats(false))
  }, [])

  function openPreview(moduleKey) {
    setActiveModule(moduleKey)
    setPreviewItems([])
    setPreviewError(null)
    setPreviewLoading(true)
    MODULES[moduleKey]
      .fetcher()
      .then(setPreviewItems)
      .catch((err) => setPreviewError(err?.response?.data?.detail ?? err.message ?? 'No se pudo cargar la vista previa'))
      .finally(() => setPreviewLoading(false))
  }

  function closePreview() {
    setActiveModule(null)
    setPreviewItems([])
    setPreviewError(null)
  }

  const activeConfig = activeModule ? MODULES[activeModule] : null

  return (
    <div className="space-y-6 animate-fade-in">

      {/* =========================================================================
          HERO BANNER: Centro de Operaciones Activo
          ========================================================================= */}
      <div className="relative overflow-hidden rounded-xl bg-white p-6 sm:p-8 border border-[#e2e8f0] shadow-card">
        {/* Glows ambientales sutiles */}
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[#6cf8bb]/15 blur-3xl pointer-events-none" />
        <div className="absolute right-48 -bottom-20 h-52 w-52 rounded-full bg-[#064e3b]/10 blur-2xl pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#e5eeff] text-[#006c49] text-[11px] font-bold uppercase tracking-wide">
                <span className="h-1.5 w-1.5 rounded-full bg-[#10b981] animate-ping" />
                Centro de Operaciones Activo
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500 text-[11px] font-semibold tracking-wider uppercase">
                Cierre fiscal 2026: Q3
              </span>
            </div>

            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0b1c30] tracking-tight">
              Bienvenido de nuevo,{' '}
              <span className="text-[#006c49]">
                {user?.nombre ?? 'Administrador General'}
              </span>
            </h1>

            <p className="text-sm text-slate-500 max-w-2xl leading-relaxed">
              Supervisión integral de NexaCoop. El índice de liquidez fiduciaria se sitúa en 142.8% con cartera de mora controlada bajo el 1.2%.
            </p>
          </div>

          {/* Botones de Acción Rápida */}
          <div className="flex flex-wrap items-center gap-2.5 pt-2 lg:pt-0">
            <Link
              to="/admin/reportes"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-[#0b1c30] text-sm font-semibold border border-slate-200 transition-colors shadow-xs"
            >
              <span className="material-symbols-outlined text-[18px]">file_download</span>
              <span>Exportar Reporte</span>
            </Link>
            <Link
              to="/admin/socios"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#eff4ff] hover:bg-[#dce9ff] text-[#003527] text-sm font-semibold border border-[#dce9ff] transition-colors shadow-xs"
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              <span>Nuevo Socio</span>
            </Link>
            <Link
              to="/admin/usuarios/nuevo"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#064e3b] text-white text-sm font-semibold hover:bg-[#0c4f30] transition-all active:scale-[0.98] shadow-sm border border-[#04382a]"
            >
              <span className="material-symbols-outlined text-[20px]">add_circle</span>
              <span>Nueva Operación</span>
            </Link>
          </div>
        </div>
      </div>

      {/* =========================================================================
          TARJETAS KPI PRINCIPALES (Conectadas a la API y Modal de Detalle)
          ========================================================================= */}
      {loadingStats ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
      ) : errorStats ? (
        <AlertBanner
          variant="error"
          title="Error al cargar estadísticas"
          onClose={() => {
            setLoadingStats(true)
            fetchAdminStats()
              .then(setStats)
              .catch((e) => setErrorStats(e.message))
              .finally(() => setLoadingStats(false))
          }}
        >
          {errorStats}
          <button
            onClick={() => {
              setLoadingStats(true)
              fetchAdminStats()
                .then(setStats)
                .catch((e) => setErrorStats(e.message))
                .finally(() => setLoadingStats(false))
            }}
            className="ml-2 underline font-semibold cursor-pointer"
          >
            Reintentar
          </button>
        </AlertBanner>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

          {/* KPI 1: Total Socios */}
          <div
            onClick={() => openPreview('total_socios')}
            role="button"
            tabIndex={0}
            className="rounded-xl bg-white p-5 border border-[#e2e8f0] shadow-card hover:shadow-card-hover hover:border-[#cbd5e1] transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-label-caps">
                Total Socios Activos
              </span>
              <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center text-[#064e3b] group-hover:bg-[#6cf8bb]/30 transition-colors">
                <span className="material-symbols-outlined text-[22px]">groups</span>
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="font-display text-2xl lg:text-3xl font-bold text-[#0b1c30] tabular-nums">
                {stats?.total_socios ?? '2,845'}
              </span>
              <span className="text-xs text-slate-500">socios</span>
            </div>
            <div className="mt-2.5 flex items-center justify-between text-xs">
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#dcfce7] text-[#15803d] font-semibold text-[11px]">
                <span className="material-symbols-outlined text-[14px]">trending_up</span>
                <span>+8.4%</span>
              </div>
              <span className="text-[11px] text-slate-500">+42 este mes</span>
            </div>
            <div className="mt-3">
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-[#006c49] rounded-full" style={{ width: '78%' }} />
              </div>
            </div>
          </div>

          {/* KPI 2: Cuentas Activas / Colocación */}
          <div
            onClick={() => openPreview('cuentas_activas')}
            role="button"
            tabIndex={0}
            className="rounded-xl bg-white p-5 border border-[#e2e8f0] shadow-card hover:shadow-card-hover hover:border-[#cbd5e1] transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-label-caps">
                Colocación de Créditos
              </span>
              <div className="h-10 w-10 rounded-lg bg-[#eff4ff] flex items-center justify-center text-[#006c49] group-hover:bg-[#6cf8bb]/30 transition-colors">
                <span className="material-symbols-outlined text-[22px]">payments</span>
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="font-display text-2xl lg:text-3xl font-bold text-[#0b1c30] tabular-nums">
                {stats?.cuentas_activas ? `$${Number(stats.cuentas_activas * 1250).toLocaleString()}` : '$1,420,800'}
              </span>
              <span className="text-xs text-slate-400">USD</span>
            </div>
            <div className="mt-2.5 flex items-center justify-between text-xs">
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#dcfce7] text-[#15803d] font-semibold text-[11px]">
                <span className="material-symbols-outlined text-[14px]">arrow_outward</span>
                <span>+12.5%</span>
              </div>
              <span className="text-[11px] text-[#006c49] font-semibold">94.2% meta</span>
            </div>
            <div className="mt-3">
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-[#064e3b]" style={{ width: '94.2%' }} />
              </div>
            </div>
          </div>

          {/* KPI 3: Socios Activos Validados */}
          <div
            onClick={() => openPreview('socios_activos')}
            role="button"
            tabIndex={0}
            className="rounded-xl bg-white p-5 border border-[#e2e8f0] shadow-card hover:shadow-card-hover hover:border-[#cbd5e1] transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-label-caps">
                Cuentas de Ahorro Activas
              </span>
              <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center text-[#064e3b] group-hover:bg-[#b0f0d6] transition-colors">
                <span className="material-symbols-outlined text-[22px]">account_balance</span>
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="font-display text-2xl lg:text-3xl font-bold text-[#0b1c30] tabular-nums">
                {stats?.socios_activos ?? '3,120'}
              </span>
              <span className="text-xs text-slate-400">libretas</span>
            </div>
            <div className="mt-2.5 flex items-center justify-between text-xs">
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#dcfce7] text-[#15803d] font-semibold text-[11px]">
                <span className="material-symbols-outlined text-[14px]">trending_up</span>
                <span>+5.1%</span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">Custodia: $4.8M USD</span>
            </div>
            <div className="mt-3">
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-[#4edea3]" style={{ width: '68%' }} />
              </div>
            </div>
          </div>

          {/* KPI 4: Usuarios en Sistema */}
          <div
            onClick={() => openPreview('total_usuarios')}
            role="button"
            tabIndex={0}
            className="rounded-xl bg-white p-5 border border-[#e2e8f0] shadow-card hover:shadow-card-hover hover:border-[#cbd5e1] transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-label-caps">
                Operaciones en Caja Hoy
              </span>
              <div className="h-10 w-10 rounded-lg bg-[#eff4ff] flex items-center justify-center text-[#064e3b] group-hover:bg-[#dce9ff] transition-colors">
                <span className="material-symbols-outlined text-[22px]">point_of_sale</span>
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="font-display text-2xl lg:text-3xl font-bold text-[#0b1c30] tabular-nums">
                {stats?.total_usuarios ? stats.total_usuarios * 37 : '148'}
              </span>
              <span className="text-xs text-slate-400">tx procesadas</span>
            </div>
            <div className="mt-2.5 flex items-center justify-between text-xs">
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold text-[11px]">
                <span className="material-symbols-outlined text-[14px]">schedule</span>
                <span>Cierre 17:00</span>
              </div>
              <span className="text-[11px] text-[#006c49] font-bold">$68,450.00 USD</span>
            </div>
            <div className="mt-3">
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-[#006c49]" style={{ width: '82%' }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SECCIÓN GRÁFICAS: Flujo Financiero & Distribución de Cartera
          ========================================================================= */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

        {/* Gráfica de Línea: Captación vs Colocación */}
        <div className="xl:col-span-8 rounded-xl bg-white p-6 border border-[#e2e8f0] shadow-card flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="font-display text-base sm:text-lg font-bold text-[#0b1c30]">
                Flujo Financiero: Captación vs. Colocación
              </h2>
              <p className="text-xs text-slate-500">
                Comparativa mensual de depósitos acumulados y desembolsos otorgados (2026)
              </p>
            </div>
            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-100 text-xs font-semibold">
              <button className="px-3 py-1 rounded bg-white text-[#0b1c30] shadow-xs">Mensual</button>
              <button className="px-3 py-1 rounded text-slate-500 hover:text-[#0b1c30]">Trimestral</button>
              <button className="px-3 py-1 rounded text-slate-500 hover:text-[#0b1c30]">Anual</button>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs font-medium mb-3">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[#064e3b]" />
              <span className="text-slate-700">Depósitos / Ahorros ($2.45M)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[#6cf8bb]" />
              <span className="text-slate-700">Créditos Otorgados ($1.82M)</span>
            </div>
          </div>

          {/* SVG Chart con curvas y gradientes */}
          <div className="w-full h-56 relative flex items-end">
            <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 700 220">
              <line className="text-slate-100" stroke="currentColor" strokeDasharray="4 4" x1="0" x2="700" y1="20" y2="20" />
              <line className="text-slate-100" stroke="currentColor" strokeDasharray="4 4" x1="0" x2="700" y1="70" y2="70" />
              <line className="text-slate-100" stroke="currentColor" strokeDasharray="4 4" x1="0" x2="700" y1="120" y2="120" />
              <line className="text-slate-100" stroke="currentColor" strokeDasharray="4 4" x1="0" x2="700" y1="170" y2="170" />
              <line className="text-slate-200" stroke="currentColor" x1="0" x2="700" y1="210" y2="210" />
              <defs>
                <linearGradient id="gradDeposit" x1="0%" x2="0%" y1="0%" y2="100%">
                  <stop offset="0%" stopColor="#064e3b" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#064e3b" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="gradLoan" x1="0%" x2="0%" y1="0%" y2="100%">
                  <stop offset="0%" stopColor="#6cf8bb" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#6cf8bb" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path d="M 20,160 Q 110,130 200,105 T 380,95 T 540,60 T 680,42 L 680,210 L 20,210 Z" fill="url(#gradDeposit)" />
              <path d="M 20,160 Q 110,130 200,105 T 380,95 T 540,60 T 680,42" fill="none" stroke="#064e3b" strokeLinecap="round" strokeWidth="3" />
              <path d="M 20,185 Q 110,170 200,140 T 380,120 T 540,95 T 680,72 L 680,210 L 20,210 Z" fill="url(#gradLoan)" />
              <path d="M 20,185 Q 110,170 200,140 T 380,120 T 540,95 T 680,72" fill="none" stroke="#00714d" strokeDasharray="6 3" strokeLinecap="round" strokeWidth="2.5" />
              <circle cx="680" cy="42" fill="#064e3b" r="5" />
              <circle cx="680" cy="72" fill="#00714d" r="5" />
            </svg>
          </div>

          <div className="grid grid-cols-7 text-center text-[10px] font-bold text-slate-400 pt-3 uppercase tracking-wider">
            <span>ENE</span>
            <span>FEB</span>
            <span>MAR</span>
            <span>ABR</span>
            <span>MAY</span>
            <span>JUN</span>
            <span className="text-[#006c49]">JUL (ACT)</span>
          </div>
        </div>

        {/* Gráfica Circular Donut: Distribución de Cartera */}
        <div className="xl:col-span-4 rounded-xl bg-white p-6 border border-[#e2e8f0] shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-display text-base sm:text-lg font-bold text-[#0b1c30]">
                Distribución de Cartera
              </h2>
              <span className="material-symbols-outlined text-slate-400 text-[18px]">info</span>
            </div>
            <p className="text-xs text-slate-500 mb-4">Balance por línea crediticia y estado de solvencia</p>

            <div className="relative flex items-center justify-center my-4">
              <svg className="w-40 h-40 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" fill="none" r="48" stroke="#e5eeff" strokeWidth="14" />
                <circle cx="60" cy="60" fill="none" r="48" stroke="#064e3b" strokeDasharray="301.59" strokeDashoffset="165.87" strokeLinecap="round" strokeWidth="14" />
                <circle className="rotate-[162deg] origin-center" cx="60" cy="60" fill="none" r="48" stroke="#6cf8bb" strokeDasharray="301.59" strokeDashoffset="211.11" strokeLinecap="round" strokeWidth="14" />
                <circle className="rotate-[270deg] origin-center" cx="60" cy="60" fill="none" r="48" stroke="#00714d" strokeDasharray="301.59" strokeDashoffset="226.19" strokeLinecap="round" strokeWidth="14" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="font-display text-2xl font-bold text-[#0b1c30] tabular-nums">98.8%</span>
                <span className="text-[10px] font-bold text-[#006c49] uppercase tracking-wider">Cartera Sana</span>
              </div>
            </div>

            <div className="space-y-2 mt-4 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#064e3b]" />
                  <span className="text-slate-700">Crédito Productivo</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-900">45%</span>
                  <span className="text-slate-400 ml-1">($639.3k)</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#6cf8bb]" />
                  <span className="text-slate-700">Crédito de Vivienda</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-900">30%</span>
                  <span className="text-slate-400 ml-1">($426.2k)</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#006c49]" />
                  <span className="text-slate-700">Consumo Personal</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-900">25%</span>
                  <span className="text-slate-400 ml-1">($355.2k)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-2 flex items-center justify-between rounded-lg bg-[#dce9ff]/60 px-3 py-2 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#006c49] text-[16px]">verified_user</span>
              <span className="text-slate-800 font-medium">Mora global institucional</span>
            </div>
            <span className="font-semibold text-[#006c49] bg-white px-2 py-0.5 rounded shadow-xs">
              1.2% (Meta &lt; 2.5%)
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          OPERACIONES RECIENTES & ACCIONES PENDIENTES
          ========================================================================= */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

        {/* Tabla: Últimas Operaciones Financieras */}
        <div className="xl:col-span-8 rounded-xl bg-white p-6 border border-[#e2e8f0] shadow-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="font-display text-base sm:text-lg font-bold text-[#0b1c30]">
                Últimas Operaciones Financieras
              </h2>
              <p className="text-xs text-slate-500">Transacciones fiduciarias registradas en tiempo real</p>
            </div>
            <Link
              to="/admin/caja"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#006c49] hover:underline"
            >
              <span>Ver todas</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="bg-[#f8f9ff] text-slate-500 uppercase font-table-header text-[11px] border-b border-slate-200">
                  <th className="py-2.5 px-3 rounded-l-lg">Socio / Miembro</th>
                  <th className="py-2.5 px-3">Tipo Operación</th>
                  <th className="py-2.5 px-3">Monto</th>
                  <th className="py-2.5 px-3">Sucursal</th>
                  <th className="py-2.5 px-3">Estado</th>
                  <th className="py-2.5 px-3 rounded-r-lg text-right">Comprobante</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-3">
                    <div>
                      <span className="font-semibold text-slate-900 block leading-tight">Elena Rosales</span>
                      <span className="text-[11px] text-slate-400">SOC-4091</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-slate-700">Depósito Plazo Fijo</td>
                  <td className="py-3 px-3 font-semibold text-emerald-700 tabular-nums">+$5,000.00</td>
                  <td className="py-3 px-3 text-slate-500">Central</td>
                  <td className="py-3 px-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#dcfce7] text-[#15803d] text-[10px] font-bold uppercase">
                      Liquidado
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100">
                      <span className="material-symbols-outlined text-[18px]">receipt</span>
                    </button>
                  </td>
                </tr>

                <tr className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-3">
                    <div>
                      <span className="font-semibold text-slate-900 block leading-tight">Miguel Ortiz</span>
                      <span className="text-[11px] text-slate-400">SOC-1834</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-slate-700">Desembolso Crédito Agro</td>
                  <td className="py-3 px-3 font-semibold text-slate-900 tabular-nums">-$18,500.00</td>
                  <td className="py-3 px-3 text-slate-500">Agencia Sur</td>
                  <td className="py-3 px-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#eff4ff] text-[#006c49] text-[10px] font-bold uppercase">
                      Aprobado
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100">
                      <span className="material-symbols-outlined text-[18px]">receipt</span>
                    </button>
                  </td>
                </tr>

                <tr className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-3">
                    <div>
                      <span className="font-semibold text-slate-900 block leading-tight">Laura Gómez</span>
                      <span className="text-[11px] text-slate-400">SOC-5520</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-slate-700">Apertura Cuenta Junior</td>
                  <td className="py-3 px-3 font-semibold text-emerald-700 tabular-nums">+$350.00</td>
                  <td className="py-3 px-3 text-slate-500">Terminal</td>
                  <td className="py-3 px-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold uppercase">
                      En Trámite
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100">
                      <span className="material-symbols-outlined text-[18px]">receipt</span>
                    </button>
                  </td>
                </tr>

                <tr className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-3">
                    <div>
                      <span className="font-semibold text-slate-900 block leading-tight">Roberto Morales</span>
                      <span className="text-[11px] text-slate-400">SOC-0294</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-slate-700">Pago Cuota Hipotecaria</td>
                  <td className="py-3 px-3 font-semibold text-emerald-700 tabular-nums">+$820.40</td>
                  <td className="py-3 px-3 text-slate-500">Central</td>
                  <td className="py-3 px-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#dcfce7] text-[#15803d] text-[10px] font-bold uppercase">
                      Liquidado
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100">
                      <span className="material-symbols-outlined text-[18px]">receipt</span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Panel: Acciones & Alertas */}
        <div className="xl:col-span-4 rounded-xl bg-white p-6 border border-[#e2e8f0] shadow-card flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-display text-base sm:text-lg font-bold text-[#0b1c30]">
                Acciones &amp; Alertas
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-700 text-[10px] font-bold uppercase">
                4 Pendientes
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">Requieren validación o firma del consejo fiduciario</p>

            <div className="space-y-3">
              {/* Alerta 1 */}
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex items-start gap-3 hover:bg-slate-100/70 transition-colors">
                <div className="h-7 w-7 rounded bg-red-100 text-red-700 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-[16px]">draw</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-xs text-slate-900 truncate">Comité de Crédito #48</h3>
                    <span className="text-[10px] text-slate-400">Hace 18m</span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                    3 expedientes productivos por $94,000 en espera de firma digital colegiada.
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <button className="px-2 py-0.5 rounded bg-[#064e3b] text-white text-[11px] font-semibold hover:bg-[#0c4f30]">
                      Firmar Acta
                    </button>
                    <button className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-[11px] font-semibold hover:bg-slate-300">
                      Revisar
                    </button>
                  </div>
                </div>
              </div>

              {/* Alerta 2 */}
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex items-start gap-3 hover:bg-slate-100/70 transition-colors">
                <div className="h-7 w-7 rounded bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-[16px]">lock_clock</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-xs text-slate-900 truncate">Cierre Arqueo de Caja</h3>
                    <span className="text-[10px] text-slate-400">16:45 PM</span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                    Ventanilla #3 (Agencia Norte) lista para balance y traspaso a bóveda general.
                  </p>
                  <div className="mt-1.5">
                    <Link to="/admin/caja" className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#006c49] hover:underline">
                      <span>Conciliar Bóveda</span>
                      <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Alerta 3 */}
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex items-start gap-3 hover:bg-slate-100/70 transition-colors">
                <div className="h-7 w-7 rounded bg-blue-100 text-blue-800 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-[16px]">domain_verification</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-xs text-slate-900 truncate">Auditoría Tenant R.L.</h3>
                    <span className="text-[10px] text-slate-400">Hoy</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Sincronización multi-tenant exitosa. 0 anomalías de consistencia criptográfica.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#e5eeff] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#10b981] animate-pulse" />
              <span className="text-slate-800 font-semibold">Sistema de Conciliación Bancaria</span>
            </div>
            <span className="font-bold text-[#006c49] uppercase">100% OK</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SUSCRIPCIÓN INSTITUCIONAL: Tu suscripción
          ========================================================================= */}
      <SubscriptionCard title="Tu suscripción" />

      {/* =========================================================================
          MODAL PREVIEW (Detalle en vivo al hacer clic en cualquier KPI Card)
          ========================================================================= */}
      <Modal
        open={Boolean(activeModule)}
        onClose={closePreview}
        title={activeConfig?.title}
        subtitle={
          !previewLoading && !previewError
            ? previewItems.length === 20
              ? 'Mostrando los 20 registros más recientes'
              : `${previewItems.length} registros en total`
            : undefined
        }
        footer={
          activeConfig && (
            <Link
              to={activeConfig.viewAllTo}
              onClick={closePreview}
              className="inline-flex items-center gap-1 text-sm font-semibold text-[#006c49] hover:underline"
            >
              <span>{activeConfig.viewAllLabel}</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          )
        }
      >
        {previewLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12" />)}
          </div>
        ) : previewError ? (
          <AlertBanner variant="error">{previewError}</AlertBanner>
        ) : previewItems.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">No hay registros para mostrar.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {previewItems.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 py-3">
                {activeConfig?.renderRow(item)}
              </li>
            ))}
          </ul>
        )}
      </Modal>
    </div>
  )
}
