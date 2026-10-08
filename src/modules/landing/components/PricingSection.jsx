import { useState } from 'react'

const PLANS = [
  {
    name: 'Cooperativa Base',
    description: 'Ideal para cooperativas locales y cajas de ahorro en fase de modernización digital',
    price: 49,
    yearlyPrice: 399,
    buttonText: 'Comenzar Afiliación',
    buttonVariant: 'outline',
    features: [
      { text: 'Hasta 2,500 socios activos', icon: 'group' },
      { text: 'Bóveda cifrada hasta 50GB', icon: 'database' },
      { text: 'Auditoría fiduciaria básica', icon: 'dns' },
    ],
    includes: [
      'El plan Base incluye:',
      'Padrón & Aportaciones ilimitadas',
      'Ventanilla única con arqueo ciego',
      'Autenticación criptográfica 2FA',
      'Reportes automáticos ASFI',
    ],
  },
  {
    name: 'Crecimiento Pro',
    description: 'El estándar preferido para entidades financieras en expansión con sucursales activas',
    price: 149,
    yearlyPrice: 1190,
    popular: true,
    buttonText: 'Elegir Plan Pro',
    buttonVariant: 'default',
    features: [
      { text: 'Socios y cuentas ilimitadas', icon: 'group' },
      { text: 'Almacenamiento fiduciario 500GB', icon: 'database' },
      { text: 'Copiloto de Scoring en tiempo real', icon: 'psychology' },
    ],
    includes: [
      'Todo lo de Cooperativa Base, más:',
      'Scoring crediticio preventivo ASFI',
      'Contingencia offline para ventanilla',
      'Colocaciones automáticas de DPFs',
      'Soporte fiduciario prioritario 24/7',
    ],
  },
  {
    name: 'Red Enterprise',
    description: 'Para federaciones, redes intercooperativas y grandes uniones de crédito fiduciarias',
    price: 299,
    yearlyPrice: 2390,
    buttonText: 'Solicitar Ficha Corporativa',
    buttonVariant: 'outline',
    features: [
      { text: 'Multi-tenant federado ilimitado', icon: 'corporate_fare' },
      { text: 'Almacenamiento HSM sin límite', icon: 'database' },
      { text: 'Cluster dedicado de alta disponibilidad', icon: 'dns' },
    ],
    includes: [
      'Todo lo de Crecimiento Pro, más:',
      'Aislamiento de bases de datos por tenant',
      'Matriz regulatoria Maker-Checker',
      'Integración API Core interbancaria',
      'SLA garantizado 99.99% con HSM',
    ],
  },
]

/**
 * Institutional Pricing Section matching App.tsx and pricing-section-3.tsx.
 */
export default function PricingSection({ onSelectPlan }) {
  const [isYearly, setIsYearly] = useState(false)

  const handlePlanClick = (planName) => {
    if (onSelectPlan) {
      onSelectPlan(planName)
    }
    const demoEl = document.getElementById('demo')
    if (demoEl) {
      demoEl.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section
      id="precios"
      className="w-full py-20 bg-white dark:bg-[#061210] border-t border-[#bfc9c3]/20 dark:border-emerald-950/60 transition-colors"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12 space-y-12">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#eff4ff] dark:bg-emerald-950/60 text-[#006c49] dark:text-[#6cf8bb] font-label-caps text-label-caps uppercase border border-[#bfc9c3]/40 dark:border-emerald-900/40">
            <span>Precios Transparentes para Cada Etapa Cooperativa</span>
          </div>
          <h2 className="font-headline-lg text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#0b1c30] dark:text-white">
            Tarifas según la escala institucional de tu entidad.
          </h2>
          <p className="font-body-md text-body-md text-[#404944] dark:text-slate-300">
            Acceso completo a la plataforma SaaS Core Banking sin costos ocultos de servidores o licencias por usuario.
          </p>

          {/* Monthly / Yearly Switch */}
          <div className="pt-4 flex items-center justify-center gap-3">
            <span
              className={`text-xs font-semibold ${
                !isYearly ? 'text-[#003527] dark:text-[#6cf8bb]' : 'text-[#707974] dark:text-slate-400'
              }`}
            >
              Facturación Mensual
            </span>
            <button
              type="button"
              data-magnetic
              onClick={() => setIsYearly(!isYearly)}
              className="w-14 h-7 rounded-full bg-[#064e3b] dark:bg-[#003527] p-1 flex items-center transition-colors cursor-pointer border border-[#6cf8bb]/40"
              aria-label="Alternar facturación mensual o anual"
            >
              <div
                className={`w-5 h-5 rounded-full bg-white dark:bg-[#6cf8bb] transition-transform ${
                  isYearly ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </button>
            <span
              className={`text-xs font-semibold flex items-center gap-1.5 ${
                isYearly ? 'text-[#003527] dark:text-[#6cf8bb]' : 'text-[#707974] dark:text-slate-400'
              }`}
            >
              <span>Facturación Anual</span>
              <span className="px-2 py-0.5 rounded-full bg-[#6cf8bb]/30 dark:bg-[#6cf8bb]/20 text-[#005236] dark:text-[#6cf8bb] text-[10px] font-bold">
                -20% Descuento
              </span>
            </span>
          </div>
        </div>

        {/* 3 Pricing Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {PLANS.map((plan) => {
            const isPopular = Boolean(plan.popular)
            const displayedPrice = isYearly ? plan.yearlyPrice : plan.price
            const billingPeriod = isYearly ? '/año' : '/mes'

            return (
              <div
                key={plan.name}
                className={`relative rounded-2xl p-8 flex flex-col justify-between transition-all duration-200 ${
                  isPopular
                    ? 'bg-[#eff4ff] dark:bg-[#0b1f19] border-2 border-[#006c49] dark:border-[#4edea3] shadow-xl scale-[1.02]'
                    : 'bg-white dark:bg-[#0b1f19] border border-[#bfc9c3]/30 dark:border-emerald-900/40 shadow-xs hover:shadow-md'
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#006c49] dark:bg-[#4edea3] text-white dark:text-[#002117] text-[11px] font-extrabold uppercase tracking-wider shadow-sm">
                    Recomendado • Más Popular
                  </div>
                )}

                <div className="space-y-6">
                  {/* Plan Header */}
                  <div>
                    <h3 className="font-headline-sm text-lg font-bold text-[#0b1c30] dark:text-white">
                      {plan.name}
                    </h3>
                    <p className="font-body-sm text-xs text-[#404944] dark:text-slate-300 mt-1 min-h-[32px]">
                      {plan.description}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="pt-2 border-t border-[#bfc9c3]/20 dark:border-emerald-900/30">
                    <div className="flex items-baseline gap-1">
                      <span className="font-headline-lg text-4xl font-extrabold text-[#003527] dark:text-[#6cf8bb]">
                        ${displayedPrice}
                      </span>
                      <span className="text-xs text-[#707974] dark:text-slate-400 font-semibold">
                        USD {billingPeriod}
                      </span>
                    </div>
                    {isYearly && (
                      <p className="text-[11px] text-[#006c49] dark:text-[#4edea3] font-medium mt-1">
                        Ahorro del 20% aplicado en facturación anual
                      </p>
                    )}
                  </div>

                  {/* Highlights */}
                  <div className="space-y-2.5 pt-2">
                    {plan.features.map((feat) => (
                      <div
                        key={feat.text}
                        className="flex items-center gap-2.5 text-xs text-[#0b1c30] dark:text-white font-medium"
                      >
                        <span className="material-symbols-outlined text-[18px] text-[#006c49] dark:text-[#6cf8bb]">
                          check_circle
                        </span>
                        <span>{feat.text}</span>
                      </div>
                    ))}
                  </div>

                  {/* Includes List */}
                  <div className="pt-4 border-t border-[#bfc9c3]/20 dark:border-emerald-900/30 space-y-2">
                    <p className="text-[11px] font-bold uppercase text-[#707974] dark:text-slate-400 tracking-wider">
                      {plan.includes[0]}
                    </p>
                    <ul className="space-y-1.5 text-xs text-[#404944] dark:text-slate-300">
                      {plan.includes.slice(1).map((inc) => (
                        <li key={inc} className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[15px] text-[#006c49] dark:text-[#6cf8bb]">
                            done
                          </span>
                          <span>{inc}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* CTA Button */}
                <div className="pt-8">
                  <button
                    type="button"
                    data-magnetic
                    onClick={() => handlePlanClick(plan.name)}
                    className={`w-full py-3 rounded-xl font-headline-sm text-sm font-semibold transition-all cursor-pointer shadow-xs ${
                      isPopular
                        ? 'bg-[#064e3b] dark:bg-[#006c49] text-white hover:bg-[#003527] dark:hover:bg-[#005236]'
                        : 'bg-white dark:bg-[#061814] text-[#003527] dark:text-[#6cf8bb] border border-[#bfc9c3] dark:border-emerald-800/80 hover:bg-[#dce9ff]/50 dark:hover:bg-[#003527]'
                    }`}
                  >
                    {plan.buttonText}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
