import { useMemo, useState } from 'react'

/**
 * Interactive Financial Simulator Modal for Credit & DPF matching App.tsx.
 */
export default function SimulatorModal({ open, onClose }) {
  const [simMonto, setSimMonto] = useState(15000)
  const [simPlazo, setSimPlazo] = useState(36)
  const [simTasa, setSimTasa] = useState(12.8)

  const cuotaEstimada = useMemo(() => {
    const monthlyRate = simTasa / 100 / 12
    if (monthlyRate === 0) return simMonto / simPlazo
    return (
      (simMonto * (monthlyRate * Math.pow(1 + monthlyRate, simPlazo))) /
      (Math.pow(1 + monthlyRate, simPlazo) - 1)
    )
  }, [simMonto, simPlazo, simTasa])

  if (!open) return null

  const handleApply = () => {
    onClose()
    const demoSection = document.getElementById('demo')
    if (demoSection) {
      demoSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Simulador de Crédito & DPFs"
    >
      <div
        className="bg-white dark:bg-[#0b1f19] rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#bfc9c3]/40 dark:border-emerald-900/40 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b pb-3 border-[#bfc9c3]/20 dark:border-emerald-900/30">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#006c49] dark:text-[#6cf8bb]">
              calculate
            </span>
            <h3 className="font-headline-md text-lg text-[#003527] dark:text-white font-bold">
              Simulador de Crédito &amp; DPFs
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-[#707974] dark:text-slate-400 hover:text-[#0b1c30] dark:hover:text-white rounded-lg cursor-pointer"
            aria-label="Cerrar modal"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-[#707974] dark:text-slate-400">Monto a Colocar:</span>
              <span className="font-bold text-[#003527] dark:text-[#6cf8bb]">
                {simMonto.toLocaleString('es-BO')} Bs.
              </span>
            </div>
            <input
              type="range"
              min="1000"
              max="100000"
              step="1000"
              value={simMonto}
              onChange={(e) => setSimMonto(Number(e.target.value))}
              className="w-full accent-[#006c49]"
            />
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-[#707974] dark:text-slate-400">Plazo de Financiamiento:</span>
              <span className="font-bold text-[#003527] dark:text-[#6cf8bb]">
                {simPlazo} meses
              </span>
            </div>
            <input
              type="range"
              min="6"
              max="120"
              step="6"
              value={simPlazo}
              onChange={(e) => setSimPlazo(Number(e.target.value))}
              className="w-full accent-[#006c49]"
            />
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-[#707974] dark:text-slate-400">
                Tasa de Interés Efectiva Anual (E.A.):
              </span>
              <span className="font-bold text-[#006c49] dark:text-[#6cf8bb]">{simTasa}%</span>
            </div>
            <input
              type="range"
              min="7"
              max="28"
              step="0.1"
              value={simTasa}
              onChange={(e) => setSimTasa(Number(e.target.value))}
              className="w-full accent-[#006c49]"
            />
          </div>

          {/* Result Box */}
          <div className="p-4 rounded-xl bg-[#eff4ff] dark:bg-[#061814] border border-[#dce9ff] dark:border-emerald-900/40 text-center space-y-1">
            <span className="text-xs uppercase text-[#707974] dark:text-slate-400 font-bold">
              Cuota Mensual Estimada
            </span>
            <p className="text-2xl font-bold text-[#003527] dark:text-white">
              {isNaN(cuotaEstimada) ? '0.00' : cuotaEstimada.toFixed(2)} Bs.
            </p>
            <p className="text-xs text-[#006c49] dark:text-[#6cf8bb] font-medium">
              Amortización calculada mediante método francés según regulación ASFI
            </p>
          </div>
        </div>

        <div className="pt-2 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 dark:border-emerald-800 rounded-lg text-sm font-semibold text-[#404944] dark:text-slate-200 cursor-pointer"
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-5 py-2 bg-[#064e3b] text-white rounded-lg text-sm font-semibold hover:bg-[#003527] cursor-pointer"
          >
            Solicitar Demostración
          </button>
        </div>
      </div>
    </div>
  )
}
