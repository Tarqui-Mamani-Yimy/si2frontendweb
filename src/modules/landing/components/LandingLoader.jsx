import { useEffect, useState } from 'react'

/**
 * Initial Fiduciary Fullscreen Loading Screen with animated loader.
 * Automatically fades out smoothly on initial mount.
 */
export default function LandingLoader() {
  const [visible, setVisible] = useState(true)
  const [fadingOut, setFadingOut] = useState(false)

  useEffect(() => {
    // Show for 1.8 seconds then fade out smoothly
    const timer = setTimeout(() => {
      setFadingOut(true)
      const removeTimer = setTimeout(() => {
        setVisible(false)
      }, 500)
      return () => clearTimeout(removeTimer)
    }, 1800)

    return () => clearTimeout(timer)
  }, [])

  if (!visible) return null

  return (
    <div
      className={`fixed inset-0 z-[100000] bg-[#00261c] flex flex-col items-center justify-center transition-all duration-500 ${
        fadingOut ? 'opacity-0 pointer-events-none scale-102' : 'opacity-100'
      }`}
      aria-live="polite"
      aria-label="Cargando entorno fiduciario NexaCoop"
    >
      <style>{`
        .uiverse-loader {
          position: relative;
          width: 120px;
          height: 90px;
          margin: 0 auto;
        }
        .uiverse-loader:before {
          content: "";
          position: absolute;
          bottom: 30px;
          left: 50px;
          height: 30px;
          width: 30px;
          border-radius: 50%;
          background: #2a9d8f;
          animation: uiverse-bounce 0.5s ease-in-out infinite alternate;
        }
        .uiverse-loader:after {
          content: "";
          position: absolute;
          right: 0;
          top: 0;
          height: 7px;
          width: 45px;
          border-radius: 4px;
          box-shadow: 0 5px 0 #f2f2f2, -35px 50px 0 #f2f2f2, -70px 95px 0 #f2f2f2;
          animation: uiverse-step 1s ease-in-out infinite;
        }
        @keyframes uiverse-bounce {
          0% { transform: scale(1, 0.7); }
          40% { transform: scale(0.8, 1.2); }
          60% { transform: scale(1, 1); }
          100% { bottom: 140px; }
        }
        @keyframes uiverse-step {
          0% {
            box-shadow: 0 10px 0 rgba(0, 0, 0, 0),
                        0 10px 0 #f2f2f2,
                        -35px 50px 0 #f2f2f2,
                        -70px 90px 0 #f2f2f2;
          }
          100% {
            box-shadow: 0 10px 0 #f2f2f2,
                        -35px 50px 0 #f2f2f2,
                        -70px 90px 0 #f2f2f2,
                        -70px 90px 0 rgba(0, 0, 0, 0);
          }
        }
      `}</style>

      {/* Subtle ambient lighting */}
      <div className="absolute w-96 h-96 rounded-full bg-[#006c49]/25 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center gap-7 px-6 text-center">
        {/* NexaCoop Branding Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#006c49] to-[#003527] p-2 flex items-center justify-center shadow-xs shrink-0 border border-emerald-400/40">
            <span className="material-symbols-outlined text-white text-[22px]">
              account_balance
            </span>
          </div>
          <div className="flex flex-col text-left">
            <span className="font-display text-2xl text-white font-extrabold tracking-tight leading-none">
              NexaCoop
            </span>
            <span className="text-[10px] text-[#6cf8bb] uppercase tracking-widest mt-0.5 font-bold">
              Core Banking 4.0 • ASFI
            </span>
          </div>
        </div>

        {/* The Animated Loader */}
        <div className="py-6">
          <div className="uiverse-loader" />
        </div>

        {/* Status indicator */}
        <div className="space-y-1.5 max-w-xs">
          <div className="flex items-center justify-center gap-2 text-[#4edea3] text-xs font-semibold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-[#4edea3] animate-ping" />
            <span>Iniciando Entorno Fiduciario</span>
          </div>
          <p className="text-xs text-[#80bea6] font-medium leading-relaxed">
            Cargando módulos cooperativos y verificando integridad ASFI...
          </p>
        </div>
      </div>
    </div>
  )
}
