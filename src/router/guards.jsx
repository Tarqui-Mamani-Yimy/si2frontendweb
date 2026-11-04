import { useEffect } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import {
  selectIsAuthenticated,
  selectModulosInfo,
  selectUser,
  useAuthStore,
} from '../core/store/authStore'
import { getRoleHomePath, getRolePrefix } from '../core/utils/roles'
import { getMensajeBloqueoModulo, isModuloPermitido } from '../core/utils/planModulos'

export function ProtectedRoute() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated)
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  return <Outlet />
}

export function GuestRoute() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated)
  const user = useAuthStore(selectUser)

  if (isAuthenticated) {
    return <Navigate to={getRoleHomePath(user?.rol?.nombre) ?? '/'} replace />
  }
  return <Outlet />
}

export function RoleRoute({ allow }) {
  const isAuthenticated = useAuthStore(selectIsAuthenticated)
  const user = useAuthStore(selectUser)
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  if (getRolePrefix(user?.rol?.nombre) !== allow) {
    return <Navigate to={getRoleHomePath(user?.rol?.nombre) ?? '/'} replace />
  }
  return <Outlet />
}

export function FeatureRoute({ modulo, children }) {
  const modulosInfo = useAuthStore(selectModulosInfo)
  const logout = useAuthStore((state) => state.logout)
  const isAllowed = isModuloPermitido(modulosInfo, modulo)

  if (!isAllowed) {
    const mensaje = getMensajeBloqueoModulo(modulosInfo, modulo)
    return (
      <div className="p-6 max-w-xl mx-auto my-8">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900 shadow-xs">
          <div className="flex items-center gap-3 mb-2">
            <span className="material-symbols-outlined text-amber-600 text-2xl">lock</span>
            <h3 className="font-semibold text-base text-amber-950">Módulo no disponible</h3>
          </div>
          <p className="text-sm text-amber-900 leading-relaxed mb-4">{mensaje}</p>
          <button
            type="button"
            onClick={() => logout()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-300 bg-white hover:bg-amber-100/50 text-amber-900 text-xs font-semibold transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">logout</span>
            <span>Cerrar sesión</span>
          </button>
        </div>
      </div>
    )
  }

  return children ?? <Outlet />
}

export function RootRedirect() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated)
  const user = useAuthStore(selectUser)
  const clearSession = useAuthStore((state) => state.clearSession)
  const homePath = getRoleHomePath(user?.rol?.nombre)

  useEffect(() => {
    if (isAuthenticated && !homePath) {
      clearSession()
    }
  }, [isAuthenticated, homePath, clearSession])

  if (!isAuthenticated || !homePath) {
    return <Navigate to="/login" replace />
  }
  return <Navigate to={homePath} replace />
}
