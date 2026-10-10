import { Link } from 'react-router-dom'
import { LogoEmblem } from './LandingHeader'

/**
 * Public Landing Page Footer matching App.tsx.
 */
export default function LandingFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="w-full bg-[#eff4ff] dark:bg-[#040e0c] border-t border-[#bfc9c3]/30 dark:border-emerald-950/60 transition-colors">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          {/* Col 1: Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <LogoEmblem className="w-8 h-8" />
              <span className="font-headline-md text-headline-md text-[#003527] dark:text-[#6cf8bb] font-bold">
                NexaCoop
              </span>
            </div>
            <p className="font-body-md text-body-md text-[#404944] dark:text-slate-300 max-w-sm">
              Ecosistema tecnológico y core financiero institucional diseñado exclusivamente para cooperativas de ahorro y crédito, cajas populares y mutuales bajo normativa ASFI.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-[#6cf8bb]/40 dark:bg-[#003527] text-[#005236] dark:text-[#6cf8bb] font-label-caps text-label-caps border border-[#6cf8bb]/60 dark:border-emerald-900/40 font-semibold">
                <span className="material-symbols-outlined text-[14px]">verified_user</span>
                <span>Normativa ASFI • Ley N° 393</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-[#6cf8bb]/40 dark:bg-[#003527] text-[#005236] dark:text-[#6cf8bb] font-label-caps text-label-caps border border-[#6cf8bb]/60 dark:border-emerald-900/40 font-semibold">
                <span className="material-symbols-outlined text-[14px]">lock</span>
                <span>Cifrado Bancario</span>
              </div>
            </div>
          </div>

          {/* Col 2: Plataforma Core */}
          <div className="space-y-3">
            <h4 className="font-label-caps text-label-caps uppercase text-[#006c49] dark:text-[#6cf8bb] tracking-wider font-bold">
              Plataforma Core
            </h4>
            <ul className="space-y-2 font-body-sm text-body-sm text-[#404944] dark:text-slate-300">
              <li>
                <a className="hover:text-[#003527] dark:hover:text-[#6cf8bb] transition-colors" href="#modulos">
                  Módulo de Aportaciones
                </a>
              </li>
              <li>
                <a className="hover:text-[#003527] dark:hover:text-[#6cf8bb] transition-colors" href="#modulos">
                  Colocaciones &amp; Créditos
                </a>
              </li>
              <li>
                <a className="hover:text-[#003527] dark:hover:text-[#6cf8bb] transition-colors" href="#modulos">
                  Cajas &amp; Ventanilla Única
                </a>
              </li>
              <li>
                <a className="hover:text-[#003527] dark:hover:text-[#6cf8bb] transition-colors" href="#modulos">
                  Scoring &amp; Análisis de Riesgo
                </a>
              </li>
              <li>
                <a className="hover:text-[#003527] dark:hover:text-[#6cf8bb] transition-colors" href="#modulos">
                  Tesorería &amp; Contabilidad
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Cumplimiento & Seguridad */}
          <div className="space-y-3">
            <h4 className="font-label-caps text-label-caps uppercase text-[#006c49] dark:text-[#6cf8bb] tracking-wider font-bold">
              Cumplimiento &amp; Seguridad
            </h4>
            <ul className="space-y-2 font-body-sm text-body-sm text-[#404944] dark:text-slate-300">
              <li>
                <a className="hover:text-[#003527] dark:hover:text-[#6cf8bb] transition-colors" href="#seguridad-y-cumplimiento">
                  Debida Diligencia UIF / AML
                </a>
              </li>
              <li>
                <a className="hover:text-[#003527] dark:hover:text-[#6cf8bb] transition-colors" href="#seguridad-y-cumplimiento">
                  Auditoría &amp; Trazabilidad
                </a>
              </li>
              <li>
                <a className="hover:text-[#003527] dark:hover:text-[#6cf8bb] transition-colors" href="#seguridad-y-cumplimiento">
                  Normativas Ley 393 ASFI
                </a>
              </li>
              <li>
                <a className="hover:text-[#003527] dark:hover:text-[#6cf8bb] transition-colors" href="#seguridad-y-cumplimiento">
                  Segregación Fiduciaria
                </a>
              </li>
              <li>
                <a className="hover:text-[#003527] dark:hover:text-[#6cf8bb] transition-colors" href="#seguridad-y-cumplimiento">
                  Copias de Seguridad (Backups)
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Corporativo */}
          <div className="space-y-3">
            <h4 className="font-label-caps text-label-caps uppercase text-[#006c49] dark:text-[#6cf8bb] tracking-wider font-bold">
              Corporativo
            </h4>
            <ul className="space-y-2 font-body-sm text-body-sm text-[#404944] dark:text-slate-300">
              <li>
                <a className="hover:text-[#003527] dark:hover:text-[#6cf8bb] transition-colors" href="#modulos">
                  Arquitectura del Sistema
                </a>
              </li>
              <li>
                <a className="hover:text-[#003527] dark:hover:text-[#6cf8bb] transition-colors" href="#precios">
                  Planes &amp; Licenciamiento
                </a>
              </li>
              <li>
                <a className="hover:text-[#003527] dark:hover:text-[#6cf8bb] transition-colors" href="#demo">
                  Mesa de Ayuda
                </a>
              </li>
              <li>
                <a className="hover:text-[#003527] dark:hover:text-[#6cf8bb] transition-colors" href="#demo">
                  Afiliaciones Nuevas
                </a>
              </li>
              <li>
                <Link to="/login" className="hover:text-[#003527] dark:hover:text-[#6cf8bb] transition-colors font-medium">
                  Portal Institucional
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-[#bfc9c3]/30 dark:border-emerald-950/60 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-body-sm text-body-sm text-[#404944] dark:text-slate-400">
            © {currentYear} NexaCoop Technologies Inc. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-6 font-body-sm text-body-sm text-[#404944] dark:text-slate-400">
            <a className="hover:text-[#003527] dark:hover:text-[#6cf8bb] transition-colors" href="#seguridad-y-cumplimiento">
              Términos de Servicio
            </a>
            <a className="hover:text-[#003527] dark:hover:text-[#6cf8bb] transition-colors" href="#seguridad-y-cumplimiento">
              Política de Privacidad
            </a>
            <a className="hover:text-[#003527] dark:hover:text-[#6cf8bb] transition-colors" href="#seguridad-y-cumplimiento">
              Seguridad Bancaria
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
