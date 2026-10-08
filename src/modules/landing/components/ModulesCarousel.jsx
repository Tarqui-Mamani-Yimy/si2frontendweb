import { useEffect, useRef, useState } from 'react'

const CAROUSEL_MODULES = [
  {
    id: 'padron',
    tag: 'Padrón & Aportaciones',
    icon: 'group',
    title: 'Gestión Integral del Socio y KYC Institucional',
    subtitle: 'Filiación fiduciaria con validación de identidad y control electoral',
    desc: 'Centraliza el padrón institucional con validación de aportes ordinarios, fondos de previsión social, cálculo de excedentes cooperativos y registro oficial de delegados para asambleas.',
    img: 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?auto=format&fit=crop&w=1600&q=80',
    metrics: [
      { label: 'Padrón de Socios', val: 'Filiación Digital' },
      { label: 'Cálculo de Aportes', val: 'Automatizado' },
      { label: 'Debida Diligencia', val: 'Matriz UIF' },
    ],
    checks: [
      'Cumple directrices de Padrón Electoral Cooperativo',
      'Validación de cédula de identidad con complementación',
      'Distribución de excedentes según certificados de aportación',
    ],
  },
  {
    id: 'credito',
    tag: 'Colocaciones & DPFs',
    icon: 'credit_card',
    title: 'Cartera de Crédito, Scoring & Depósitos a Plazo',
    subtitle: 'Motor de colocación ágil con scoring solidario y evaluación patrimonial',
    desc: 'Planes de amortización francesa y alemana, pagarés y garantías fiduciarias e hipotecarias, con administración integral de Certificados de Depósito a Plazo Fijo según manual ASFI.',
    img: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1600&q=80',
    metrics: [
      { label: 'Amortización', val: 'Cuota Fija / Decreciente' },
      { label: 'Calificación', val: 'Categorías A a F' },
      { label: 'Devengo DPF', val: 'Base 360 Días' },
    ],
    checks: [
      'Simulador interactivo con cálculo de capacidad de pago',
      'Scoring de riesgo adaptado al historial del socio',
      'Emisión, custodia y devengo de pagarés y DPFs',
    ],
    hasSimulatorBtn: true,
  },
  {
    id: 'cajas',
    tag: 'Front-Office & Ventanilla',
    icon: 'point_of_sale',
    title: 'Cajas y Ventanilla Única en Tiempo Real',
    subtitle: 'Operaciones de caja de alta velocidad con arqueo y corte ciego',
    desc: 'Flujos ágiles para cajeros con conteo por denominación de billetes, control de bóveda en tiempo real, corte por turno ciego antifraude y cobro inmediato de cuotas de cartera.',
    img: 'https://images.unsplash.com/photo-1556740758-90de374c12ad?auto=format&fit=crop&w=1600&q=80',
    metrics: [
      { label: 'Corte por Turno', val: 'Ciego Antifraude' },
      { label: 'Control en Bóveda', val: 'Por Denominación' },
      { label: 'Emisión de Boletas', val: 'Instantánea' },
    ],
    checks: [
      'Arqueo de bóveda y corte ciego por turno de ventanilla',
      'Cobro de amortizaciones y retiros de cajas de ahorro',
      'Límites operativos por ventanilla y autorizaciones supervisor',
    ],
  },
  {
    id: 'gobernanza',
    tag: 'Gobernanza & Cumplimiento',
    icon: 'shield',
    title: 'Arquitectura Multi-Tenant, Bitácora SHA-256 & Backups',
    subtitle: 'Segregación dual de funciones (Maker-Checker) con auditoría inmutable',
    desc: 'Aislamiento estricto de bases de datos por cooperativa. Asignación granular de roles (SuperAdmin, Admin, Cajero, Oficial, Contador, Socio) con respaldos verificados por checksum.',
    img: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1600&q=80',
    metrics: [
      { label: 'Multi-Tenant', val: 'Aislamiento Lógico' },
      { label: 'Sello Bitácora', val: 'SHA-256 Inmutable' },
      { label: 'Supervisión', val: 'Normativa ASFI' },
    ],
    checks: [
      'Bitácora inmutable con hashing criptográfico por transacción',
      'Matriz de roles y permisos por menor privilegio',
      'Generación de copias de seguridad con control de concurrencia',
    ],
    hasTechSheetBtn: true,
  },
]

/**
 * Interactive Progressive Carousel with animated progress bar tabs.
 */
export default function ModulesCarousel({ onOpenSimulator, onOpenTechSheet }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const durationMs = 6000
  const animFrameRef = useRef(null)
  const startTimeRef = useRef(0)

  useEffect(() => {
    startTimeRef.current = performance.now()

    function step(now) {
      const elapsed = now - startTimeRef.current
      const pct = Math.min(100, (elapsed / durationMs) * 100)
      setProgress(pct)

      if (pct >= 100) {
        setActiveIndex((prev) => (prev + 1) % CAROUSEL_MODULES.length)
        startTimeRef.current = performance.now()
        setProgress(0)
      }

      animFrameRef.current = requestAnimationFrame(step)
    }

    animFrameRef.current = requestAnimationFrame(step)

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [activeIndex])

  function handleSelectSlide(index) {
    setActiveIndex(index)
    setProgress(0)
  }

  const activeModule = CAROUSEL_MODULES[activeIndex]

  return (
    <div className="w-full space-y-4">
      {/* Slide Container */}
      <div className="relative w-full rounded-2xl overflow-hidden shadow-xl border border-slate-200 bg-[#00261c]">
        <div className="relative min-h-[480px] lg:min-h-[520px] w-full flex flex-col justify-between p-6 sm:p-10 text-white overflow-hidden">
          {/* Background Photo with Dual Overlay */}
          <img
            src={activeModule.img}
            alt={activeModule.title}
            className="absolute inset-0 w-full h-full object-cover object-center -z-20 filter brightness-[0.35] saturate-[1.2] transition-opacity duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#002117]/95 via-[#003527]/85 to-[#002117]/60 -z-10" />

          {/* Top Bar inside Slide */}
          <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#6cf8bb]/20 border border-[#6cf8bb]/40 text-[#6cf8bb] text-xs font-bold uppercase tracking-wider backdrop-blur-md">
              <span className="material-symbols-outlined text-[16px]">{activeModule.icon}</span>
              <span>{activeModule.tag}</span>
            </div>

            <div className="flex items-center gap-2">
              {activeModule.hasSimulatorBtn && onOpenSimulator && (
                <button
                  type="button"
                  data-magnetic
                  onClick={onOpenSimulator}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#6cf8bb] text-[#003527] text-xs font-bold hover:bg-[#4edea3] transition-all shadow-md active:scale-95"
                >
                  <span className="material-symbols-outlined text-[16px]">calculate</span>
                  <span>Simulador de Crédito</span>
                </button>
              )}
              {activeModule.hasTechSheetBtn && onOpenTechSheet && (
                <button
                  type="button"
                  data-magnetic
                  onClick={onOpenTechSheet}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-semibold transition-all backdrop-blur-md border border-white/30 active:scale-95"
                >
                  <span className="material-symbols-outlined text-[16px]">description</span>
                  <span>Ficha Técnica ASFI</span>
                </button>
              )}
            </div>
          </div>

          {/* Middle Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end my-6 relative z-10">
            <div className="lg:col-span-7 space-y-3">
              <h3 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
                {activeModule.title}
              </h3>
              <p className="text-sm sm:text-base text-[#b0f0d6] font-medium max-w-xl leading-relaxed">
                {activeModule.subtitle}
              </p>
              <p className="text-xs sm:text-sm text-slate-200/90 leading-relaxed max-w-xl">
                {activeModule.desc}
              </p>

              <div className="pt-2 space-y-2">
                {activeModule.checks.map((chk, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs sm:text-sm text-slate-100">
                    <span className="material-symbols-outlined text-[#6cf8bb] text-[18px] shrink-0">
                      check_circle
                    </span>
                    <span>{chk}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Metrics HUD Box */}
            <div className="lg:col-span-5 flex flex-col gap-2.5">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 shadow-lg space-y-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#6cf8bb] flex items-center justify-between">
                  <span>Métricas del Módulo</span>
                  <span className="text-[10px] text-white/80 font-medium">Normativa ASFI</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {activeModule.metrics.map((m, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-black/35 border border-white/10">
                      <span className="text-[10px] text-slate-300 block leading-tight">{m.label}</span>
                      <p className="text-xs sm:text-sm font-bold text-[#6cf8bb] mt-0.5 truncate">{m.val}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs with Progressively Filling Progress Bars */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {CAROUSEL_MODULES.map((item, index) => {
          const isActive = index === activeIndex
          return (
            <button
              key={item.id}
              type="button"
              data-magnetic
              onClick={() => handleSelectSlide(index)}
              className={`text-left p-4 rounded-xl border transition-all relative overflow-hidden bg-white shadow-xs hover:shadow-md ${
                isActive ? 'border-[#006c49] ring-1 ring-[#006c49]' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Animated Progress Bar fill */}
              {isActive && (
                <div
                  className="absolute bottom-0 left-0 top-0 bg-[#006c49]/15 pointer-events-none transition-[width] duration-75 ease-linear"
                  style={{ width: `${progress}%` }}
                />
              )}

              <div className="relative z-10 flex items-center gap-2 mb-1.5">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    isActive ? 'bg-[#064e3b] text-white' : 'bg-slate-100 text-[#006c49]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">{item.icon}</span>
                </div>
                <span className="text-xs font-bold text-[#006c49] tracking-tight">
                  {item.tag}
                </span>
              </div>

              <h4 className="relative z-10 text-xs sm:text-sm font-bold text-[#0b1c30] truncate">
                {item.title}
              </h4>
              <p className="relative z-10 text-[11px] text-slate-500 truncate mt-0.5">
                {item.subtitle}
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
