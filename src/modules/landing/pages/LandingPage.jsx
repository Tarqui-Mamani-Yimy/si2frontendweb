import { useEffect, useState } from 'react'
import LandingLoader from '../components/LandingLoader'
import MagneticCursor from '../components/MagneticCursor'
import LandingHeader from '../components/LandingHeader'
import LandingHero from '../components/LandingHero'
import LandingModules from '../components/LandingModules'
import LandingSecurity from '../components/LandingSecurity'
import PricingSection from '../components/PricingSection'
import LandingCta from '../components/LandingCta'
import LandingFooter from '../components/LandingFooter'
import SimulatorModal from '../components/SimulatorModal'
import TechSheetModal from '../components/TechSheetModal'

/**
 * Public Landing Page of CoopIA / NexaCoop Core Banking 4.0.
 * Faithfully recreates the reference App.tsx architecture:
 * - Fullscreen fiduciary loader with bounce and stepping animation
 * - 3D wireframe dotted rotating Earth Globe on Canvas 2D
 * - Magnetic follower cursor with exclusion blending
 * - Progressive filling carousel with HUD metrics & slide tabs
 * - Interactive credit & DPF simulator modal
 * - Institutional cooperatives strip, security pillars, testimonial, pricing tiers, and contact form
 * - Full dark mode support with scoped unmount cleanup (zero leakage to internal routes)
 */
export default function LandingPage() {
  // Dark mode state matching App.tsx
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nexacoop_dark')
      if (saved !== null) return saved === 'true'
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return false
  })

  // Synchronize documentElement dark class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('nexacoop_dark', 'true')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('nexacoop_dark', 'false')
    }
  }, [darkMode])

  // Scope cleanup on unmount so styles and dark class never leak to dashboard / login
  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth'
    document.documentElement.style.scrollPaddingTop = '5rem'

    return () => {
      document.documentElement.classList.remove('dark')
      document.documentElement.style.scrollBehavior = ''
      document.documentElement.style.scrollPaddingTop = ''
    }
  }, [])

  // Interactive modal states
  const [simulatorOpen, setSimulatorOpen] = useState(false)
  const [techSheetOpen, setTechSheetOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(null)

  return (
    <MagneticCursor
      cursorSize={26}
      magneticFactor={0.3}
      blendMode="exclusion"
      contrastBoost={1.4}
    >
      <div
        className={`min-h-screen font-body-md flex flex-col transition-colors duration-200 selection:bg-[#6cf8bb] selection:text-[#003527] ${
          darkMode ? 'dark bg-[#061210] text-[#e2f0ea]' : 'bg-[#f8f9ff] text-[#0b1c30]'
        }`}
      >
        {/* Initial Fullscreen Animated Fiduciary Loader */}
        <LandingLoader />

        {/* Sticky Header with Navigation & Dark Mode Switch */}
        <LandingHeader
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          onOpenSimulator={() => setSimulatorOpen(true)}
          onOpenTechSheet={() => setTechSheetOpen(true)}
        />

        {/* Main Sections matching App.tsx */}
        <main className="w-full pt-20 bg-[#f8f9ff] dark:bg-[#061210] transition-colors duration-200">
          <div className="flex flex-col w-full">
            {/* 1. Hero Section with 3D Rotating Earth Globe */}
            <LandingHero onOpenSimulator={() => setSimulatorOpen(true)} />

            {/* 2. Specialized Core Modules & Progressive Carousel */}
            <LandingModules
              onOpenSimulator={() => setSimulatorOpen(true)}
              onOpenTechSheet={() => setTechSheetOpen(true)}
            />

            {/* 3. Regulatory Compliance & Bank-Grade Infrastructure */}
            <LandingSecurity />

            {/* 4. Pricing Section */}
            <PricingSection onSelectPlan={(plan) => setSelectedPlan(plan)} />

            {/* 5. Final Call to Action & Demonstration Request Form */}
            <LandingCta selectedPlan={selectedPlan} />
          </div>
        </main>

        {/* Institutional 5-Column Footer */}
        <LandingFooter />

        {/* Interactive Modals */}
        <SimulatorModal
          open={simulatorOpen}
          onClose={() => setSimulatorOpen(false)}
        />
        <TechSheetModal
          open={techSheetOpen}
          onClose={() => setTechSheetOpen(false)}
        />
      </div>
    </MagneticCursor>
  )
}
