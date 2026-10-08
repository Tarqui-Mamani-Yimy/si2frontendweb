import { useState } from 'react'
import { Link } from 'react-router-dom'

const PROFILE_AVATAR =
  'https://lh3.googleusercontent.com/aida/AEtjO1XQJlxo3RAy5n2zgOZ0tzv8RVIJTwTqEtkmpYkLSpc9xk-3lckr2-9auE-Qchi9PKfTo6kSP4RYXOKNN5HDPXQPXOP2xAW9CppBaZQEGrnHv3ICjJXOWrnwj69BgVjs44rJnzYqQzH-SNFRduv8ROrAVc8VMehTiH8xCLmNfHIROWF6IjqjVzSb8hyYH6XPZw_Vgy6sSPaNRpiMAzhEI3idZOr_4enBEmFwpD--A5EBkvCSK1StngE2UVoQjYC7g29HgdDTbLXRpiw'

/**
 * Reusable Crisp Logo Emblem matching App.tsx.
 */
export function LogoEmblem({ className = 'w-9 h-9' }) {
  return (
    <div
      className={`${className} rounded-xl bg-gradient-to-br from-[#006c49] to-[#003527] dark:from-[#4edea3] dark:to-[#005236] p-1.5 flex items-center justify-center shadow-xs shrink-0 transition-transform group-hover:scale-105`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="w-full h-full text-white dark:text-[#002117]"
        stroke="currentColor"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
      </svg>
    </div>
  )
}

/**
 * Public Landing Page Header / Navigation Bar matching App.tsx.
 */
export default function LandingHeader({
  darkMode,
  setDarkMode,
  onOpenSimulator,
  onOpenTechSheet,
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  return (
    <header className="fixed top-0 w-full z-50 bg-white/90 dark:bg-[#061814]/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-[#bfc9c3]/30 dark:border-emerald-950/60 transition-colors">
      <div className="h-20 max-w-7xl mx-auto px-6 lg:px-12 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <a href="#" className="flex items-center gap-3 shrink-0 group">
          <LogoEmblem className="w-9 h-9" />
          <div className="flex flex-col">
            <span className="font-headline-md text-headline-md tracking-tight text-[#003527] dark:text-[#6cf8bb] leading-none font-bold">
              NexaCoop
            </span>
            <span className="font-label-caps text-label-caps uppercase text-[#006c49] dark:text-[#4edea3] tracking-widest mt-0.5 font-bold">
              Core Banking 4.0
            </span>
          </div>
        </a>

        {/* Desktop Nav Links */}
        <nav className="hidden xl:flex items-center gap-6">
          <a
            data-magnetic
            href="#modulos"
            className="font-body-md text-body-md text-[#404944] dark:text-slate-300 hover:text-[#0b1c30] dark:hover:text-white transition-colors"
          >
            Módulos Core
          </a>
          <a
            data-magnetic
            href="#seguridad-y-cumplimiento"
            className="font-body-md text-body-md text-[#404944] dark:text-slate-300 hover:text-[#0b1c30] dark:hover:text-white transition-colors"
          >
            Seguridad &amp; ASFI
          </a>
          <a
            data-magnetic
            href="#precios"
            className="font-body-md text-body-md text-[#404944] dark:text-slate-300 hover:text-[#0b1c30] dark:hover:text-white transition-colors"
          >
            Precios
          </a>
        </nav>

        {/* Actions, Theme Switcher & Profile */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Dark Mode Switcher */}
          <button
            data-magnetic
            type="button"
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-lg border border-[#bfc9c3]/50 dark:border-emerald-800/80 text-[#404944] dark:text-[#6cf8bb] hover:bg-[#eff4ff] dark:hover:bg-[#003527]/50 transition-colors cursor-pointer flex items-center justify-center"
            title={darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            aria-label="Cambiar tema"
          >
            <span className="material-symbols-outlined text-[20px]">
              {darkMode ? 'light_mode' : 'dark_mode'}
            </span>
          </button>

          <Link
            to="/login"
            data-magnetic
            className="hidden sm:inline-flex items-center justify-center px-4 py-2 rounded-lg bg-white dark:bg-[#0b1f19] text-[#0b1c30] dark:text-white border border-[#bfc9c3] dark:border-emerald-800/80 font-label-numeric text-label-numeric hover:bg-[#dce9ff]/50 dark:hover:bg-[#003527] transition-all cursor-pointer font-semibold text-xs"
          >
            Iniciar Sesión
          </Link>

          <a
            data-magnetic
            href="#demo"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-[#064e3b] dark:bg-[#006c49] text-white font-label-numeric text-label-numeric hover:bg-[#003527] dark:hover:bg-[#005236] transition-all shadow-xs cursor-pointer font-semibold text-xs"
          >
            Solicitar Demo / Afiliar
          </a>

          {/* Profile Avatar with Dropdown */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="w-8 h-8 rounded-full overflow-hidden shrink-0 ml-1 ring-2 ring-[#6cf8bb]/40 hover:ring-[#006c49] transition-all cursor-pointer"
              title="Perfil Fiduciario"
              type="button"
              aria-label="Abrir menú de perfil fiduciario"
            >
              <img
                src={PROFILE_AVATAR}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#0b1f19] rounded-xl shadow-xl border border-[#bfc9c3]/30 dark:border-emerald-900/50 p-2 z-50">
                <div className="px-3 py-2 border-b border-[#bfc9c3]/20 dark:border-emerald-900/40">
                  <p className="font-headline-sm text-sm text-[#0b1c30] dark:text-white font-bold">
                    Oficial de Crédito
                  </p>
                  <p className="text-xs text-[#707974] dark:text-slate-400">
                    oficial@cooperativa.bo
                  </p>
                </div>
                {onOpenSimulator && (
                  <button
                    onClick={() => {
                      onOpenSimulator()
                      setProfileOpen(false)
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-[#404944] dark:text-slate-200 hover:bg-[#eff4ff] dark:hover:bg-[#003527]/40 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px] text-[#006c49] dark:text-[#6cf8bb]">
                      calculate
                    </span>
                    Simulador de Cartera
                  </button>
                )}
                {onOpenTechSheet && (
                  <button
                    onClick={() => {
                      onOpenTechSheet()
                      setProfileOpen(false)
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-[#404944] dark:text-slate-200 hover:bg-[#eff4ff] dark:hover:bg-[#003527]/40 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px] text-[#006c49] dark:text-[#6cf8bb]">
                      description
                    </span>
                    Ficha Técnica Core
                  </button>
                )}
                <Link
                  to="/login"
                  onClick={() => setProfileOpen(false)}
                  className="w-full text-left px-3 py-2 text-sm text-[#ba1a1a] dark:text-red-400 hover:bg-[#ffdad6]/40 dark:hover:bg-red-950/40 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                  Iniciar Sesión
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden p-2 text-[#404944] dark:text-slate-300 hover:text-[#0b1c30] dark:hover:text-white"
            aria-label="Abrir menú"
            type="button"
          >
            <span className="material-symbols-outlined">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-white dark:bg-[#0b1f19] border-b border-[#bfc9c3]/30 dark:border-emerald-900/40 px-6 py-4 space-y-3">
          <a
            onClick={() => setMobileMenuOpen(false)}
            href="#modulos"
            className="block py-2 text-[#404944] dark:text-slate-200 font-medium"
          >
            Módulos Core
          </a>
          <a
            onClick={() => setMobileMenuOpen(false)}
            href="#seguridad-y-cumplimiento"
            className="block py-2 text-[#404944] dark:text-slate-200 font-medium"
          >
            Seguridad &amp; ASFI
          </a>
          <a
            onClick={() => setMobileMenuOpen(false)}
            href="#precios"
            className="block py-2 text-[#404944] dark:text-slate-200 font-medium"
          >
            Precios
          </a>
          <div className="pt-2 border-t border-[#bfc9c3]/20 dark:border-emerald-900/40 flex flex-col gap-2">
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2.5 rounded-lg border border-[#bfc9c3] dark:border-emerald-800 text-[#0b1c30] dark:text-white font-medium"
            >
              Iniciar Sesión
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
