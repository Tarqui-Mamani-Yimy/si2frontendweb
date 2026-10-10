import { useState } from 'react'
import ModulesCarousel from './ModulesCarousel'

/**
 * Real Core Modules of the NexaCoop system.
 */
const ALL_MODULES = [
  {
    id: 'socios',
    title: 'Socios & KYC',
    tag: 'Filiación Institucional',
    icon: 'group',
    category: 'operaciones',
    desc: 'Registro integral del socio con cédula boliviana y complemento, debida diligencia UIF/AML, control de aportaciones ordinarias y padrón institucional.',
  },
  {
    id: 'ahorros',
    title: 'Ahorros & DPFs',
    tag: 'Captaciones Fiduciarias',
    icon: 'savings',
    category: 'operaciones',
    desc: 'Administración de cajas de ahorro a la vista y Depósitos a Plazo Fijo con cálculo de devengo de intereses bajo tasas y plazos regulados.',
  },
  {
    id: 'creditos',
    title: 'Créditos & Recréditos con IA',
    tag: 'Colocaciones Asistidas',
    icon: 'request_quote',
    category: 'finanzas',
    desc: 'Motor de evaluación de capacidad de pago, scoring crediticio, comités de crédito y recréditos asistidos para socios cumplidos.',
  },
  {
    id: 'caja',
    title: 'Caja & Ventanilla Única',
    tag: 'Front-Office de Pagos',
    icon: 'point_of_sale',
    category: 'operaciones',
    desc: 'Operaciones de caja de alta velocidad con cobro de cuotas, desembolsos, arqueo por denominación de billetes y corte ciego por turno de cajero.',
  },
  {
    id: 'contabilidad',
    title: 'Contabilidad & Balances',
    tag: 'Plan de Cuentas ASFI',
    icon: 'menu_book',
    category: 'finanzas',
    desc: 'Estructura contable adaptada al manual de cuentas ASFI: comprobantes automáticos, libro diario, mayor, balance de comprobación y balance general.',
  },
  {
    id: 'informes-asfi',
    title: 'Informes Regulatorios ASFI',
    tag: 'Cumplimiento Normativo',
    icon: 'description',
    category: 'gobierno',
    desc: 'Generación de reportes oficiales de supervisión: calificación de riesgo de cartera (A a F), previsiones genéricas y específicas, y control de mora.',
  },
  {
    id: 'app-socio',
    title: 'App Móvil para Socios',
    tag: 'Canal Digital',
    icon: 'smartphone',
    category: 'operaciones',
    desc: 'Experiencia digital para los socios: consulta de saldos de ahorro, extractos de cuenta, estado de sus cuotas de crédito y simulación.',
  },
  {
    id: 'backups',
    title: 'Copias de Seguridad (Backups)',
    tag: 'Resguardo Fiduciario',
    icon: 'backup',
    category: 'gobierno',
    desc: 'Módulo de copias de seguridad de la base de datos con generación manual, respaldos programados, verificación SHA-256 y descarga para SUPERADMIN.',
  },
]

/**
 * Specialized Core Modules Section matching App.tsx.
 */
export default function LandingModules({ onOpenSimulator, onOpenTechSheet }) {
  const [activeCategory, setActiveCategory] = useState('todos')

  const filteredModules = ALL_MODULES.filter((mod) =>
    activeCategory === 'todos' ? true : mod.category === activeCategory,
  )

  return (
    <section className="w-full py-20 bg-[#f8f9ff] dark:bg-[#061210] transition-colors" id="modulos">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 space-y-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#6cf8bb]/30 dark:bg-[#6cf8bb]/20 text-[#005236] dark:text-[#6cf8bb] font-label-caps text-label-caps uppercase border border-[#6cf8bb]/50">
              <span>Arquitectura Modular Fiduciaria</span>
            </div>
            <h2 className="font-headline-lg text-headline-lg text-[#0b1c30] dark:text-white">
              Módulos Core diseñados para el ciclo de vida del socio cooperativo.
            </h2>
            <p className="font-body-md text-body-md text-[#404944] dark:text-slate-300">
              Desde la filiación de cuotas de aportación hasta la colocación de líneas fiduciarias masivas y cierres contables instantáneos.
            </p>
          </div>
          <div className="shrink-0">
            {onOpenTechSheet && (
              <button
                type="button"
                data-magnetic
                onClick={onOpenTechSheet}
                className="inline-flex items-center gap-2 font-label-numeric text-label-numeric text-[#006c49] dark:text-[#6cf8bb] hover:text-[#003527] dark:hover:text-[#4edea3] font-semibold cursor-pointer group"
              >
                <span>Descargar ficha técnica de integración</span>
                <span className="material-symbols-outlined text-[18px] group-hover:translate-y-0.5 transition-transform motion-reduce:transition-none">
                  download
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Progressive Interactive Carousel */}
        <ModulesCarousel
          onOpenSimulator={onOpenSimulator}
          onOpenTechSheet={onOpenTechSheet}
        />

        {/* Catalog Grid */}
        <div className="pt-10 border-t border-[#bfc9c3]/20 dark:border-emerald-950/60 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-[#0b1c30] dark:text-white">
                Catálogo Integral de Módulos del Sistema
              </h3>
              <p className="text-xs text-[#707974] dark:text-slate-400 mt-0.5">
                Módulos integrados y homologados bajo normativa ASFI Bolivia
              </p>
            </div>

            {/* Category Filters */}
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: 'todos', label: 'Todos' },
                { id: 'operaciones', label: 'Operaciones & Socios' },
                { id: 'finanzas', label: 'Finanzas & Cartera' },
                { id: 'gobierno', label: 'Gobierno & Seguridad' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  data-magnetic
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeCategory === cat.id
                      ? 'bg-[#064e3b] dark:bg-[#006c49] text-white shadow-xs'
                      : 'bg-white dark:bg-[#0b1f19] text-[#404944] dark:text-slate-300 hover:bg-[#eff4ff] dark:hover:bg-[#003527]/50 border border-[#bfc9c3]/30 dark:border-emerald-900/40'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredModules.map((mod) => (
              <div
                key={mod.id}
                className="p-4 rounded-xl border border-[#bfc9c3]/20 dark:border-emerald-900/30 bg-white dark:bg-[#0b1f19] hover:border-[#6cf8bb] dark:hover:border-[#4edea3] hover:shadow-xs transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#6cf8bb]/20 dark:bg-[#003527] text-[#006c49] dark:text-[#6cf8bb] flex items-center justify-center">
                      <span className="material-symbols-outlined text-[18px]">{mod.icon}</span>
                    </div>
                    <span className="text-[10px] font-bold text-[#707974] dark:text-slate-400 uppercase tracking-wider">
                      {mod.tag}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-[#0b1c30] dark:text-white mb-1">
                    {mod.title}
                  </h4>
                  <p className="text-xs text-[#404944] dark:text-slate-300 leading-relaxed">
                    {mod.desc}
                  </p>
                </div>
                <div className="pt-3 mt-3 border-t border-[#bfc9c3]/15 dark:border-emerald-900/30 flex items-center justify-between text-[11px] text-[#006c49] dark:text-[#6cf8bb] font-semibold">
                  <span>Módulo Operativo</span>
                  <span className="material-symbols-outlined text-[14px]">check</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
