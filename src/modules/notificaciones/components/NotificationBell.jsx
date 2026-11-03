import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getNoLeidas } from '../../../core/api/notificacionesApi'
import { getRolePrefix } from '../../../core/utils/roles'
import { NOTIFICACIONES_CHANGED_EVENT as CHANGED_EVENT } from '../notificacionesUtils'

const POLL_MS = 60000

/**
 * Header bell: socios see their unread count and open their inbox;
 * admin/cajero open "Gestionar notificaciones"; other roles see a plain bell.
 */
export default function NotificationBell({ roleName }) {
  const navigate = useNavigate()
  const prefix = getRolePrefix(roleName)
  const esSocio = prefix === 'socio'
  const destino = ['socio', 'admin', 'cajero'].includes(prefix) ? `/${prefix}/notificaciones` : null
  const [noLeidas, setNoLeidas] = useState(0)

  useEffect(() => {
    if (!esSocio) return undefined
    let active = true
    async function refresh() {
      try {
        const { no_leidas: count } = await getNoLeidas()
        if (active) setNoLeidas(count)
      } catch {
        // The bell is best-effort; the inbox page reports errors.
      }
    }
    refresh()
    const timer = setInterval(refresh, POLL_MS)
    globalThis.addEventListener(CHANGED_EVENT, refresh)
    return () => {
      active = false
      clearInterval(timer)
      globalThis.removeEventListener(CHANGED_EVENT, refresh)
    }
  }, [esSocio])

  const label = esSocio && noLeidas > 0 ? `Notificaciones (${noLeidas} sin leer)` : 'Notificaciones'

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={destino ? () => navigate(destino) : undefined}
      className="relative p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
    >
      <span className="material-symbols-outlined text-[20px]">notifications</span>
      {esSocio && noLeidas > 0 && (
        <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#dc2626] text-white text-[10px] font-bold leading-[18px] text-center">
          {noLeidas > 9 ? '9+' : noLeidas}
        </span>
      )}
    </button>
  )
}
