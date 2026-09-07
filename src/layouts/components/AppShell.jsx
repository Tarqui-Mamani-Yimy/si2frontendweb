import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { selectUser, useAuthStore } from '../../core/store/authStore'
import Button from '../../components/ui/Button'

function formatRoleName(roleName) {
  if (!roleName) return ''
  return roleName.toLowerCase().replace(/_/g, ' ')
}

// ── Ícono CoopIA (hoja/escudo SVG inline) ─────────────────────────────────
function CoopIAMark() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      {/* Escudo base */}
      <path
        d="M14 2L4 6.5V14c0 5.5 4 9.8 10 12 6-2.2 10-6.5 10-12V6.5L14 2Z"
        fill="rgba(255,255,255,0.12)"
        stroke="rgba(255,255,255,0.25)"
        strokeWidth="1.5"
      />
      {/* Hoja interior */}
      <path
        d="M14 8c0 0-5 2.5-5 7.5 0 2.5 2 4 5 5 3-1 5-2.5 5-5C19 10.5 14 8 14 8Z"
        fill="#4ade80"
        opacity="0.85"
      />
    </svg>
  )
}

export default function AppShell({ navItems = [] }) {
  const navigate = useNavigate()
  const user     = useAuthStore(selectUser)
  const logout   = useAuthStore((state) => state.logout)

  async function handleLogout() {
    try {
      await logout()
    } finally {
      navigate('/login', { replace: true })
    }
  }

  return (
    <div className="flex h-screen bg-surface overflow-hidden">

      {/* ── Sidebar ── */}
      <aside className="flex w-64 shrink-0 flex-col bg-forest border-r border-white/5">

        {/* Logotipo */}
        <div className="flex items-center gap-3 border-b border-white/8 px-5 py-5">
          <CoopIAMark />
          <div>
            <p className="text-base font-bold tracking-tight text-white leading-none">
              CoopIA
            </p>
            <p className="mt-0.5 text-[10px] font-medium uppercase tracking-widest text-coopia-green-fg/60">
              Cooperativa de Ahorro
            </p>
          </div>
        </div>

        {/* Navegación */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ` +
                (isActive
                  ? 'bg-forest-2 text-white border-l-2 border-emerald-400 pl-[10px]'
                  : 'text-coopia-green-fg/70 hover:bg-coopia-green-light/50 hover:text-forest-fg')
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Footer del sidebar — info de usuario */}
        {user && (
          <div className="border-t border-white/8 px-4 py-3">
            <p className="text-xs font-semibold text-white truncate">{user.nombre}</p>
            <p className="text-[10px] capitalize text-forest-fg/50 truncate">
              {formatRoleName(user.rol?.nombre)}
            </p>
          </div>
        )}
      </aside>

      {/* ── Contenido principal ── */}
      <div className="flex min-w-0 flex-1 flex-col">

        {/* Header */}
        <header className="flex items-center justify-between border-b border-slate-100 bg-white px-6 py-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              CoopIA
            </span>
            <span className="text-slate-200">·</span>
            <span className="text-xs text-slate-400">Sistema Integral Cooperativo</span>
          </div>

          <div className="flex items-center gap-4">
            {user && (
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-800">{user.nombre}</p>
                <p className="text-[11px] capitalize text-slate-400">
                  {formatRoleName(user.rol?.nombre)}
                </p>
              </div>
            )}
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={handleLogout}
            >
              Cerrar sesión
            </Button>
          </div>
        </header>

        {/* Contenido de página */}
        <main className="flex-1 overflow-y-auto p-6 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
