import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchAdminStats, fetchSocios, listUsuarios } from '../../../core/api/adminApi'
import { listCuentas } from '../../../core/api/savingsApi'
import { selectUser, useAuthStore } from '../../../core/store/authStore'
import AlertBanner from '../../../components/ui/AlertBanner'
import Badge from '../../../components/ui/Badge'
import Modal from '../../../components/ui/Modal'
import PageHeader from '../../../components/ui/PageHeader'
import Skeleton from '../../../components/ui/Skeleton'

// ── Íconos de línea (estilo consistente, sin emojis) ────────────────────────

const ICON_PROPS = {
  viewBox:          '0 0 24 24',
  fill:             'none',
  stroke:           'currentColor',
  strokeWidth:      1.5,
  strokeLinecap:    'round',
  strokeLinejoin:   'round',
  'aria-hidden':    true,
  className:        'h-6 w-6',
}

function UsersIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.7M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
  )
}

function CheckBadgeIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
    </svg>
  )
}

function BuildingLibraryIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12.75 6.75h.008v.008h-.008V6.75Z" />
    </svg>
  )
}

function ShieldCheckIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M9 12.75 11.25 15 15 9.75M21 12c0 4.556-3.86 8.25-8.618 8.994a1.5 1.5 0 0 1-.764 0C7.86 20.25 4 16.556 4 12V6.75a1.5 1.5 0 0 1 1.5-1.5h.75c2.086 0 4.13-.586 5.874-1.694a.75.75 0 0 1 .752 0C14.62 4.664 16.664 5.25 18.75 5.25h.75a1.5 1.5 0 0 1 1.5 1.5V12Z" />
    </svg>
  )
}

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

// ── StatCard ───────────────────────────────────────────────────────────────

const STAT_GRADIENTS = {
  forest: 'from-forest   to-forest-2',
  navy:   'from-navy     to-navy-2',
  teal:   'from-teal-600 to-teal-700',
  amber:  'from-amber-500 to-amber-600',
}

function StatCard({ label, value, icon, gradient = 'navy', onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative overflow-hidden rounded-2xl bg-white p-6 text-left shadow-card transition-all duration-200 hover:shadow-card-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/30"
    >
      {/* Ícono con gradiente CoopIA */}
      <div
        className={`absolute right-4 top-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${STAT_GRADIENTS[gradient]} text-white shadow-sm`}
      >
        {icon}
      </div>
      <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
        {label}
      </p>
      <p className="mt-2.5 font-mono text-4xl font-bold tabular-nums text-slate-900">
        {value ?? <span className="text-slate-300">—</span>}
      </p>
    </button>
  )
}

// ── Componente principal ───────────────────────────────────────────────────

export default function AdminDashboard() {
  const user = useAuthStore(selectUser)

  const [stats,        setStats]        = useState(null)
  const [loadingStats, setLoadingStats] = useState(true)
  const [errorStats,   setErrorStats]   = useState(null)

  const [activeModule,   setActiveModule]   = useState(null) // clave de MODULES
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
    <div className="space-y-8 animate-fade-in">

      {/* ── Encabezado ── */}
      <PageHeader
        title="Panel de Administración"
        subtitle={
          <>
            Bienvenido,{' '}
            <span className="font-semibold text-slate-700">{user?.nombre}</span>
            {' — '}
            <span className="capitalize text-slate-600">
              {user?.rol?.nombre?.toLowerCase().replace(/_/g, ' ')}
            </span>
          </>
        }
      />

      {/* ── Tarjetas de resumen ── */}
      {loadingStats ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : errorStats ? (
        <AlertBanner
          variant="error"
          title="Error al cargar estadísticas"
          onClose={() => {
            setLoadingStats(true)
            fetchAdminStats().then(setStats).catch((e) => setErrorStats(e.message)).finally(() => setLoadingStats(false))
          }}
        >
          {errorStats}
          <button
            onClick={() => {
              setLoadingStats(true)
              fetchAdminStats().then(setStats).catch((e) => setErrorStats(e.message)).finally(() => setLoadingStats(false))
            }}
            className="ml-2 underline font-medium"
          >
            Reintentar
          </button>
        </AlertBanner>
      ) : (
        <>
          <p className="-mb-2 text-xs text-slate-400">Toca una tarjeta para ver el detalle.</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total Socios"        value={stats?.total_socios}    icon={<UsersIcon />}           gradient="forest" onClick={() => openPreview('total_socios')} />
            <StatCard label="Socios Activos"      value={stats?.socios_activos}  icon={<CheckBadgeIcon />}      gradient="teal"   onClick={() => openPreview('socios_activos')} />
            <StatCard label="Cuentas Activas"     value={stats?.cuentas_activas} icon={<BuildingLibraryIcon />} gradient="navy"   onClick={() => openPreview('cuentas_activas')} />
            <StatCard label="Usuarios en Sistema" value={stats?.total_usuarios}  icon={<ShieldCheckIcon />}     gradient="amber"  onClick={() => openPreview('total_usuarios')} />
          </div>
        </>
      )}

      {/* ── Preview del módulo seleccionado ── */}
      <Modal
        open={Boolean(activeModule)}
        onClose={closePreview}
        title={activeConfig?.title}
        subtitle={
          !previewLoading && !previewError
            ? previewItems.length === 20
              ? 'Mostrando los 20 más recientes'
              : `${previewItems.length} en total`
            : undefined
        }
        footer={
          activeConfig && (
            <Link
              to={activeConfig.viewAllTo}
              onClick={closePreview}
              className="text-sm font-medium text-navy hover:underline"
            >
              {activeConfig.viewAllLabel} →
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
