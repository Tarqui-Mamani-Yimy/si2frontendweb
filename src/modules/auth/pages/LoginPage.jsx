import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  selectStatus,
  useAuthStore,
} from '../../../core/store/authStore'
import { getRoleHomePath, getRolePrefix } from '../../../core/utils/roles'
import AlertBanner from '../../../components/ui/AlertBanner'
import screenImg from '../../../assets/screen.png'

function resolveErrorMessage(error) {
  if (error.response) {
    if (error.response.status === 401) {
      return error.response.data?.detail ?? 'Correo o contraseña incorrectos'
    }
    return 'Error del servidor. Intente nuevamente en unos minutos.'
  }
  return 'No se pudo conectar con el servidor. Verifique su conexión e intente de nuevo.'
}

export default function LoginPage() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const status    = useAuthStore(selectStatus)
  const login     = useAuthStore((state) => state.login)

  const [correo,         setCorreo]         = useState('')
  const [contrasena,     setContrasena]     = useState('')
  const [mostrarPass,    setMostrarPass]    = useState(false)
  const [errorMessage,   setErrorMessage]   = useState(null)

  const isLoading = status === 'loading'

  async function handleSubmit(event) {
    event.preventDefault()
    setErrorMessage(null)
    try {
      await login(correo, contrasena)
      const user       = useAuthStore.getState().user
      const prefix     = getRolePrefix(user?.rol?.nombre)
      const fallback   = getRoleHomePath(user?.rol?.nombre) ?? '/'
      const fromPath   = location.state?.from?.pathname
      const target     =
        prefix && fromPath && fromPath.startsWith(`/${prefix}/`)
          ? fromPath
          : fallback
      navigate(target, { replace: true })
    } catch (error) {
      setErrorMessage(resolveErrorMessage(error))
    }
  }

  return (
    <main className="w-full max-w-6xl bg-white rounded-2xl shadow-2xl border border-white/60 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">

      {/* =========================================================================
          PANEL IZQUIERDO: Bienvenida & Marca NexaCoop
          ========================================================================= */}
      <section className="lg:col-span-5 bg-[#064e3b] text-white p-8 sm:p-10 lg:p-12 flex flex-col justify-between relative overflow-hidden">
        {/* Decoración geométrica institucional de fondo */}
        <div className="absolute -right-24 -top-24 w-80 h-80 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-[#6ffbbe]/10 blur-3xl pointer-events-none" />
        <svg
          className="absolute inset-0 w-full h-full opacity-5 pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern height="40" id="grid-pattern-login" patternUnits="userSpaceOnUse" width="40">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#ffffff" strokeWidth="1" />
            </pattern>
          </defs>
          <rect fill="url(#grid-pattern-login)" height="100%" width="100%" />
        </svg>

        {/* Encabezado Izquierdo: Badge & Identidad de Marca */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-900/60 border border-emerald-400/30 text-[#6ffbbe] text-xs font-semibold tracking-wider uppercase mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#6ffbbe] animate-pulse" />
            Plataforma Multi-Tenant Fiduciaria
          </div>

          {/* Bloque de Logo / Mascota NexaCoop con screen.png */}
          <div className="space-y-4">
            <div className="w-full bg-black/25 backdrop-blur-md rounded-2xl p-2 border border-emerald-500/20 shadow-xl overflow-hidden">
              <img
                alt="NexaCoop Ilustración Fiduciaria"
                className="w-full h-auto max-h-64 object-contain rounded-xl"
                src={screenImg}
              />
            </div>
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white !text-white leading-tight">
                Construyendo el futuro <br className="hidden sm:block" />
                <span className="text-[#6ffbbe]">financiero cooperativo</span>.
              </h2>
              <p className="mt-2 text-emerald-100/80 text-sm leading-relaxed max-w-sm">
                Ecosistema bancario y administrativo diseñado para impulsar el crecimiento, la solidez y el impacto social de las cooperativas.
              </p>
            </div>
          </div>
        </div>

        {/* Zona Inferior: Badges de Seguridad Fiduciaria */}
        <div className="relative z-10 pt-8 mt-6 border-t border-emerald-800/80">
          <div className="grid grid-cols-3 gap-2.5 p-3 rounded-xl bg-emerald-950/40 border border-emerald-700/30 backdrop-blur-sm">
            {/* Cifrado */}
            <div className="flex flex-col items-center text-center p-1">
              <span className="material-symbols-outlined text-[#6ffbbe] text-xl mb-1">lock</span>
              <span className="text-xs font-bold text-white tracking-tight">256-Bit</span>
              <span className="text-[10px] text-emerald-200/70 font-medium">Cifrado Militar</span>
            </div>
            {/* Respaldo */}
            <div className="flex flex-col items-center text-center p-1 border-x border-emerald-800/50">
              <span className="material-symbols-outlined text-[#6ffbbe] text-xl mb-1">sync_saved_locally</span>
              <span className="text-xs font-bold text-white tracking-tight">100% Real-Time</span>
              <span className="text-[10px] text-emerald-200/70 font-medium">Respaldo Activo</span>
            </div>
            {/* Regulación */}
            <div className="flex flex-col items-center text-center p-1">
              <span className="material-symbols-outlined text-[#6ffbbe] text-xl mb-1">verified_user</span>
              <span className="text-xs font-bold text-white tracking-tight">Regulado</span>
              <span className="text-[10px] text-emerald-200/70 font-medium">SUGEF / SBS</span>
            </div>
          </div>

          {/* Versión del Core */}
          <div className="flex items-center justify-between mt-5 text-[11px] text-emerald-200/60 font-medium">
            <span>NexaCoop Core Banking v2.4.0</span>
            <span className="flex items-center gap-1.5 text-[#6ffbbe]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#6ffbbe]" />
              Sistemas Operativos
            </span>
          </div>
        </div>
      </section>

      {/* =========================================================================
          PANEL DERECHO: Formulario de Autenticación Limpio
          ========================================================================= */}
      <section className="lg:col-span-7 bg-[#ffffff] p-8 sm:p-10 lg:p-12 flex flex-col justify-center">
        <div>
          {/* Cabecera del formulario */}
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <span className="text-[11px] font-bold tracking-widest text-[#006c49] uppercase">
                Portal Seguro de Acceso
              </span>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
                Iniciar Sesión
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                Ingrese sus credenciales corporativas autorizadas para continuar.
              </p>
            </div>
            {/* Badge TLS */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200 shrink-0">
              <span className="material-symbols-outlined text-[16px] text-emerald-700">shield</span>
              <span>TLS 1.3 Seguro</span>
            </div>
          </div>

          {/* Formulario de Login */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>

            {/* Selector de Entorno Cooperativo Multi-Tenant */}
            <div>
              <label
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
                htmlFor="tenantSelect"
              >
                Entorno Institucional / Cooperativa
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                  <span className="material-symbols-outlined text-[20px]">account_balance</span>
                </span>
                <select
                  id="tenantSelect"
                  defaultValue="central"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-sm font-medium focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:bg-white outline-none transition appearance-none cursor-pointer"
                >
                  <option value="central">NexaCoop Matriz Central (Administración)</option>
                  <option value="sanjuan">Coop. de Ahorro y Crédito San Juan R.L.</option>
                  <option value="alianza">Coop. Alianza Fiduciaria</option>
                  <option value="progreso">Coop. Progreso Andino</option>
                  <option value="nacional">Federación Nacional de Cooperativas</option>
                </select>
                <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                  <span className="material-symbols-outlined text-[20px]">expand_more</span>
                </span>
              </div>
            </div>

            {/* Identificación o Correo Institucional */}
            <div>
              <label
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
                htmlFor="correo"
              >
                Identificación o Correo Institucional
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                  <span className="material-symbols-outlined text-[20px]">badge</span>
                </span>
                <input
                  id="correo"
                  type="email"
                  autoComplete="email"
                  required
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  placeholder="ej. carlos.mendoza@nexacoop.com"
                  disabled={isLoading}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-sm placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:bg-white outline-none transition disabled:opacity-50"
                />
              </div>
            </div>

            {/* Contraseña Fiduciaria */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  className="text-xs font-semibold uppercase tracking-wider text-slate-700"
                  htmlFor="contrasena"
                >
                  Contraseña Fiduciaria
                </label>
                <Link
                  to="/recuperar"
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 transition"
                >
                  ¿Olvidó su contraseña?
                </Link>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                  <span className="material-symbols-outlined text-[20px]">key</span>
                </span>
                <input
                  id="contrasena"
                  type={mostrarPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                  placeholder="••••••••••••"
                  disabled={isLoading}
                  className="w-full pl-10 pr-11 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-sm placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:bg-white outline-none transition disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setMostrarPass((v) => !v)}
                  disabled={isLoading}
                  aria-label={mostrarPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-700 transition"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {mostrarPass ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Recordar Sesión Checkbox */}
            <div className="flex items-center pt-1">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  id="rememberMe"
                  className="w-4 h-4 rounded border-slate-300 text-emerald-800 focus:ring-emerald-700 focus:ring-offset-0 cursor-pointer"
                />
                <span className="text-xs sm:text-sm text-slate-600">
                  Recordar sesión en esta estación autorizada
                </span>
              </label>
            </div>

            {/* Alerta de Error */}
            {errorMessage && (
              <AlertBanner variant="error" onClose={() => setErrorMessage(null)}>
                {errorMessage}
              </AlertBanner>
            )}

            {/* Botón Principal CTA */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-6 rounded-lg bg-[#064e3b] hover:bg-[#047857] text-white font-display text-base font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[20px]">sync</span>
                    <span>Verificando credenciales fiduciarias...</span>
                  </>
                ) : (
                  <>
                    <span>Acceder al Sistema NexaCoop</span>
                    <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  )
}
