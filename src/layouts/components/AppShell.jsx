import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { selectUser, useAuthStore } from '../../core/store/authStore'
import CastorChatbot from '../../components/ui/CastorChatbot'

function formatRoleName(roleName) {
  if (!roleName) return ''
  return roleName.toLowerCase().replace(/_/g, ' ')
}

function getNavIcon(label = '', path = '') {
  const l = (label + ' ' + path).toLowerCase()
  if (l.includes('dashboard')) return 'dashboard'
  if (l.includes('registrar') || l.includes('nuevo')) return 'person_add'
  if (l.includes('usuario')) return 'manage_accounts'
  if (l.includes('rol')) return 'admin_panel_settings'
  if (l.includes('socio') || l.includes('miembro')) return 'group'
  if (l.includes('crédito') || l.includes('credito')) return 'request_quote'
  if (l.includes('caja') || l.includes('ventanilla')) return 'point_of_sale'
  if (l.includes('reporte')) return 'monitoring'
  if (l.includes('bitácora') || l.includes('bitacora')) return 'receipt_long'
  if (l.includes('configura')) return 'settings'
  if (l.includes('cooperativa') || l.includes('tenant')) return 'domain'
  if (l.includes('plan-cuentas') || l.includes('plan de cuentas')) return 'account_tree'
  if (l.includes('comprobante')) return 'receipt_long'
  if (l.includes('parámetro') || l.includes('parametro')) return 'tune'
  if (l.includes('cuenta')) return 'account_balance'
  if (l.includes('cumplimiento')) return 'verified_user'
  return 'folder_open'
}

// ── Marca Institucional NexaCoop ──────────────────────────────────────────
function NexaCoopMark() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="h-8 w-8 rounded-lg bg-[#064e3b] border border-emerald-400/40 flex items-center justify-center text-[#6ffbbe] shadow-sm shrink-0">
        <span className="material-symbols-outlined text-[20px]">account_balance</span>
      </div>
      <div className="flex flex-col">
        <span className="font-display text-sm font-bold text-white tracking-tight leading-tight">
          NexaCoop
        </span>
        <span className="text-[10px] font-bold text-[#6ffbbe] uppercase tracking-wider">
          Fintech Core
        </span>
      </div>
    </div>
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
    <div className="flex h-screen bg-[#f8f9ff] text-[#0b1c30] overflow-hidden">

      {/* ── Sidebar Institucional NexaCoop Precision ── */}
      <aside className="flex w-[260px] shrink-0 flex-col bg-[#06281E] border-r border-white/5 z-30 shadow-[0_1px_8px_rgba(0,0,0,0.08)]">

        {/* Encabezado Sidebar */}
        <div className="h-16 px-4 flex items-center justify-between bg-[#041d16] border-b border-white/5">
          <NexaCoopMark />
        </div>

        {/* Lista de Navegación */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-[#80bea6]">
            Módulos del Sistema
          </div>
          {navItems.map((item) => {
            const iconName = getNavIcon(item.label, item.path)
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end
                className={({ isActive }) =>
                  `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ` +
                  (isActive
                    ? 'bg-[#064e3b] text-white shadow-xs font-semibold'
                    : 'text-[#d3e4fe] hover:bg-[#0c4f30] hover:text-white')
                }
              >
                <span className="material-symbols-outlined text-[18px] shrink-0" aria-hidden="true">
                  {iconName}
                </span>
                <span className="truncate">{item.label}</span>
              </NavLink>
            )
          })}
        </nav>

        {/* Footer del Sidebar */}
        <div className="p-3 bg-[#041d16] space-y-2 border-t border-white/5">
          {/* SaaS Status */}
          <div className="bg-[#0c4f30] rounded-lg px-2.5 py-1.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#6ffbbe] animate-pulse" />
              <span className="text-xs text-white font-medium">SaaS Online</span>
            </div>
            <span className="text-[10px] font-bold text-[#6ffbbe] uppercase tracking-wider">v2.4.0</span>
          </div>

          {/* Cooperativa / Tenant Activo */}
          <div className="bg-[#063527] rounded-lg px-2.5 py-2">
            <span className="block text-[9px] font-bold text-[#80bea6] uppercase tracking-wider mb-0.5">
              Entorno Activo
            </span>
            <span className="block text-xs font-semibold text-white truncate">
              {user?.cooperativa?.nombre ?? 'NexaCoop Matriz Central'}
            </span>
          </div>

          {/* User Profile Mini */}
          {user && (
            <div className="px-2 pt-1 flex items-center justify-between text-xs text-slate-300">
              <div className="min-w-0 flex-1 mr-2">
                <p className="font-semibold text-white truncate text-xs">{user.nombre}</p>
                <p className="text-[10px] capitalize text-[#80bea6] truncate">
                  {formatRoleName(user.rol?.nombre)}
                </p>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ── Contenido Principal & Topbar ── */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">

        {/* Header / Topbar */}
        <header className="h-16 shrink-0 bg-white/90 backdrop-blur-md border-b border-[#e2e8f0] px-6 flex items-center justify-between z-20 shadow-xs">
          {/* Lado izquierdo: Breadcrumb & Omni-search */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <span className="material-symbols-outlined text-[18px] text-[#006c49]">home</span>
              <span>/</span>
              <span className="font-semibold text-[#0b1c30]">Plataforma Institucional</span>
            </div>

            <div className="relative hidden md:flex items-center">
              <span className="material-symbols-outlined absolute left-2.5 text-[18px] text-slate-400 pointer-events-none">
                search
              </span>
              <input
                type="text"
                readOnly
                placeholder="Buscar socios, folios, transacciones..."
                className="w-72 h-9 pl-8 pr-10 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 placeholder:text-slate-400 outline-none hover:bg-slate-100/70 transition-colors cursor-default"
              />
              <kbd className="absolute right-2.5 text-[10px] font-bold text-slate-400 bg-slate-200/60 px-1 py-0.5 rounded">
                ⌘K
              </kbd>
            </div>
          </div>

          {/* Lado derecho: Acciones & Usuario */}
          <div className="flex items-center gap-4">
            {/* Notificaciones */}
            <button
              type="button"
              aria-label="Notificaciones"
              className="relative p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#dc2626]" />
            </button>

            {/* Info usuario */}
            {user && (
              <div className="hidden sm:flex items-center gap-3 border-l border-slate-200 pl-4">
                <div className="h-8 w-8 rounded-full bg-[#064e3b] text-white flex items-center justify-center font-display font-bold text-xs uppercase shadow-xs">
                  {user.nombre?.charAt(0) ?? 'U'}
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-[#0b1c30] leading-tight truncate max-w-[140px]">
                    {user.nombre}
                  </p>
                  <p className="text-[10px] capitalize text-slate-500 truncate">
                    {formatRoleName(user.rol?.nombre)}
                  </p>
                </div>
              </div>
            )}

            {/* Botón Logout */}
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-red-700 hover:border-red-200 text-xs font-semibold transition-colors shadow-xs"
            >
              <span className="material-symbols-outlined text-[16px]">logout</span>
              <span className="hidden sm:inline">Cerrar sesión</span>
            </button>
          </div>
        </header>

        {/* Área de Trabajo Canvas */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 animate-fade-in relative">
          <div className="mx-auto max-w-[1600px]">
            <Outlet />
          </div>
        </main>
      </div>

      {/* ── Asistente Chatbot Flotante Castor IA ── */}
      <CastorChatbot />
    </div>
  )
}
