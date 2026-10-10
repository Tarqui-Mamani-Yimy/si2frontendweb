import { Link } from 'react-router-dom'
import RotatingEarth from './RotatingEarth'

/**
 * Public Landing Page Hero Section matching App.tsx.
 * Features value proposition, CTAs, fiduciary metric cards,
 * and the 3D Wireframe Dotted Rotating Earth Globe.
 */
export default function LandingHero({ onOpenSimulator }) {
  return (
    <section className="relative w-full overflow-hidden bg-gradient-to-b from-[#f8f9ff] via-[#eff4ff]/40 to-[#f8f9ff] dark:from-[#061210] dark:via-[#092019]/80 dark:to-[#061210] pt-8 pb-16 lg:pb-24 transition-colors duration-200">
      {/* Subtle Ambient Glow Orbs */}
      <div
        className="absolute -top-32 -left-20 w-96 h-96 rounded-full bg-[#6cf8bb]/20 dark:bg-[#006c49]/25 blur-3xl pointer-events-none motion-reduce:hidden"
        aria-hidden="true"
      />
      <div
        className="absolute top-1/3 -right-24 w-[30rem] h-[30rem] rounded-full bg-[#95d3ba]/20 dark:bg-[#004d38]/25 blur-3xl pointer-events-none motion-reduce:hidden"
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left: Value Proposition & CTAs */}
          <div className="lg:col-span-7 flex flex-col items-start space-y-6">
            {/* Badge */}
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white dark:bg-[#0b1f19] shadow-xs text-[#006c49] dark:text-[#6cf8bb] font-label-caps text-label-caps uppercase tracking-wider border border-[#bfc9c3]/30 dark:border-emerald-900/50">
              <span className="w-2 h-2 rounded-full bg-[#006c49] dark:bg-[#4edea3] animate-pulse motion-reduce:animate-none" />
              <span>Plataforma Core Banking &amp; Gestión Integral para Cooperativas</span>
            </div>

            {/* Main Headline */}
            <h1 className="font-display-hero text-display-hero text-[#0b1c30] dark:text-white tracking-tight leading-tight">
              El Core Banking inteligente que impulsa el{' '}
              <span className="text-[#064e3b] dark:text-[#6cf8bb] bg-gradient-to-r from-[#003527] to-[#006c49] dark:from-[#6cf8bb] dark:to-[#4edea3] bg-clip-text text-transparent">
                crecimiento cooperativo
              </span>
              .
            </h1>

            {/* Subtitle */}
            <p className="font-body-lg text-body-lg text-[#404944] dark:text-slate-300 max-w-2xl">
              Centralice cuentas de ahorro, créditos fiduciarios, caja en ventanilla y auditoría regulatoria en una plataforma multi-tenant de alta disponibilidad con interconexión global en tiempo real.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto pt-2">
              <Link
                to="/login"
                data-magnetic
                className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-[#064e3b] dark:bg-[#006c49] text-white font-headline-sm text-headline-sm hover:bg-[#003527] dark:hover:bg-[#005236] shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
              >
                <span>Ingresar al Sistema</span>
                <span className="material-symbols-outlined text-[20px]">login</span>
              </Link>
              <a
                data-magnetic
                href="#demo"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white dark:bg-[#0b1f19] text-[#0b1c30] dark:text-white font-label-numeric text-label-numeric hover:bg-[#e5eeff] dark:hover:bg-[#003527]/50 shadow-xs border border-[#bfc9c3]/40 dark:border-emerald-900/40 transition-all duration-200 cursor-pointer"
              >
                <span>Solicitar Demo</span>
                <span className="material-symbols-outlined text-[20px] text-[#006c49] dark:text-[#6cf8bb]">arrow_forward</span>
              </a>
              <a
                data-magnetic
                href="#modulos"
                className="inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl text-[#006c49] dark:text-[#6cf8bb] hover:bg-[#eff4ff] dark:hover:bg-[#003527]/40 text-sm font-semibold transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">grid_view</span>
                <span>Módulos</span>
              </a>
              {onOpenSimulator && (
                <button
                  type="button"
                  data-magnetic
                  onClick={onOpenSimulator}
                  className="inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl text-[#006c49] dark:text-[#6cf8bb] hover:bg-[#eff4ff] dark:hover:bg-[#003527]/40 text-sm font-semibold transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">calculate</span>
                  <span>Simulador</span>
                </button>
              )}
            </div>

            {/* Institutional Pillars Grid */}
            <div className="w-full pt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-white dark:bg-[#0b1f19] shadow-xs border border-[#bfc9c3]/20 dark:border-emerald-900/30 hover:border-[#6cf8bb] transition-colors">
                <p className="font-label-caps text-label-caps text-[#707974] dark:text-slate-400 uppercase tracking-wider">
                  Marco Regulatorio
                </p>
                <p className="font-headline-lg text-lg sm:text-xl font-bold text-[#003527] dark:text-[#6cf8bb] mt-1">
                  Normativa ASFI
                </p>
                <p className="font-body-sm text-body-sm text-[#404944] dark:text-slate-300 flex items-center gap-1 mt-0.5">
                  <span className="material-symbols-outlined text-[#006c49] dark:text-[#6cf8bb] text-[15px]">
                    verified_user
                  </span>{' '}
                  Ley N° 393
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white dark:bg-[#0b1f19] shadow-xs border border-[#bfc9c3]/20 dark:border-emerald-900/30 hover:border-[#6cf8bb] transition-colors">
                <p className="font-label-caps text-label-caps text-[#707974] dark:text-slate-400 uppercase tracking-wider">
                  Arquitectura
                </p>
                <p className="font-headline-lg text-lg sm:text-xl font-bold text-[#0b1c30] dark:text-white mt-1">
                  Multi-Tenant
                </p>
                <p className="font-body-sm text-body-sm text-[#404944] dark:text-slate-300 flex items-center gap-1 mt-0.5">
                  <span className="material-symbols-outlined text-[#006c49] dark:text-[#6cf8bb] text-[15px]">
                    corporate_fare
                  </span>{' '}
                  Aislamiento Lógico
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white dark:bg-[#0b1f19] shadow-xs border border-[#bfc9c3]/20 dark:border-emerald-900/30 hover:border-[#6cf8bb] transition-colors">
                <p className="font-label-caps text-label-caps text-[#707974] dark:text-slate-400 uppercase tracking-wider">
                  Trazabilidad
                </p>
                <p className="font-headline-lg text-lg sm:text-xl font-bold text-[#006c49] dark:text-[#4edea3] mt-1">
                  SHA-256
                </p>
                <p className="font-body-sm text-body-sm text-[#404944] dark:text-slate-300 flex items-center gap-1 mt-0.5">
                  <span className="material-symbols-outlined text-[#006c49] dark:text-[#6cf8bb] text-[15px]">
                    history_edu
                  </span>{' '}
                  Bitácora Inmutable
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white dark:bg-[#0b1f19] shadow-xs border border-[#bfc9c3]/20 dark:border-emerald-900/30 hover:border-[#6cf8bb] transition-colors">
                <p className="font-label-caps text-label-caps text-[#707974] dark:text-slate-400 uppercase tracking-wider">
                  Seguridad
                </p>
                <p className="font-headline-lg text-lg sm:text-xl font-bold text-[#064e3b] dark:text-[#6cf8bb] mt-1">
                  Backups Continuos
                </p>
                <p className="font-body-sm text-body-sm text-[#404944] dark:text-slate-300 flex items-center gap-1 mt-0.5">
                  <span className="material-symbols-outlined text-[#006c49] dark:text-[#6cf8bb] text-[15px]">
                    backup
                  </span>{' '}
                  Manual &amp; Automático
                </p>
              </div>
            </div>
          </div>

          {/* Right: Interactive 3D Wireframe Dotted Globe */}
          <div className="lg:col-span-5 relative flex flex-col items-center justify-center">
            <div className="relative w-full max-w-lg aspect-square flex items-center justify-center">
              <RotatingEarth
                width={520}
                height={500}
                className="w-full h-auto drop-shadow-[0_0_35px_rgba(78,222,163,0.18)]"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
