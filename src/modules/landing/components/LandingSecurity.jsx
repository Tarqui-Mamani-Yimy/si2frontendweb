/**
 * Regulatory Compliance & Bank-Grade Infrastructure Section.
 * Strictly reflects actual system capabilities under ASFI / UIF regulation.
 */
export default function LandingSecurity() {
  return (
    <section
      className="w-full py-20 bg-[#f8f9ff] dark:bg-[#061210] transition-colors"
      id="seguridad-y-cumplimiento"
    >
      <div id="seguridad" className="max-w-7xl mx-auto px-6 lg:px-12 space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded bg-[#dce9ff] dark:bg-emerald-950/60 text-[#003527] dark:text-[#6cf8bb] font-label-caps text-label-caps uppercase border border-[#bfc9c3]/30 dark:border-emerald-900/40">
            <span className="material-symbols-outlined text-[16px]">verified_user</span>
            <span>Solidez Institucional</span>
          </div>
          <h2 className="font-headline-lg text-headline-lg text-[#0b1c30] dark:text-white">
            Seguridad Grado Bancario y Cumplimiento Normativo.
          </h2>
          <p className="font-body-md text-body-md text-[#404944] dark:text-slate-300">
            Diseñado para cumplir con las exigencias normativas de la ASFI y la UIF en Bolivia, optimizando la preparación y entrega de auditorías regulatorias.
          </p>
        </div>

        {/* Feature Cards Grid (3 Columns) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Pillar 1 */}
          <div className="bg-white dark:bg-[#0b1f19] p-8 rounded-2xl shadow-xs border border-[#bfc9c3]/30 dark:border-emerald-900/30 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-[#6cf8bb]/40 dark:bg-[#003527] text-[#005236] dark:text-[#6cf8bb] flex items-center justify-center">
                <span className="material-symbols-outlined text-[28px]">lock</span>
              </div>
              <h3 className="font-headline-sm text-headline-sm text-[#0b1c30] dark:text-white">
                Cifrado Criptográfico Integral
              </h3>
              <p className="font-body-md text-body-md text-[#404944] dark:text-slate-300">
                Aislamiento estricto de esquemas por cooperativa con protección criptográfica en bases de datos, contraseñas hasheadas con algoritmos robustos y sesiones seguras mediante tokens firmados.
              </p>
            </div>
            <div className="pt-6 font-label-caps text-label-caps text-[#006c49] dark:text-[#6cf8bb] uppercase flex items-center gap-1.5 font-semibold">
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              <span>Segregación Fiduciaria</span>
            </div>
          </div>

          {/* Pillar 2 */}
          <div className="bg-white dark:bg-[#0b1f19] p-8 rounded-2xl shadow-xs border border-[#bfc9c3]/30 dark:border-emerald-900/30 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-[#b0f0d6] dark:bg-[#004d38] flex items-center justify-center text-[#003527] dark:text-[#6cf8bb]">
                <span className="material-symbols-outlined text-[28px]">policy</span>
              </div>
              <h3 className="font-headline-sm text-headline-sm text-[#0b1c30] dark:text-white">
                Reportes Normativos ASFI / UIF
              </h3>
              <p className="font-body-md text-body-md text-[#404944] dark:text-slate-300">
                Generación de calificación de cartera (A a F), cálculo de previsiones genéricas y específicas, control de mora y matrices de debida diligencia según las directrices de la Ley N° 393.
              </p>
            </div>
            <div className="pt-6 font-label-caps text-label-caps text-[#006c49] dark:text-[#6cf8bb] uppercase flex items-center gap-1.5 font-semibold">
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              <span>Normativa Ley N° 393</span>
            </div>
          </div>

          {/* Pillar 3 */}
          <div className="bg-white dark:bg-[#0b1f19] p-8 rounded-2xl shadow-xs border border-[#bfc9c3]/30 dark:border-emerald-900/30 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-[#dce9ff] dark:bg-emerald-950/80 flex items-center justify-center text-[#064e3b] dark:text-[#6cf8bb]">
                <span className="material-symbols-outlined text-[28px]">cloud_sync</span>
              </div>
              <h3 className="font-headline-sm text-headline-sm text-[#0b1c30] dark:text-white">
                Copias de Seguridad &amp; Bitácora SHA-256
              </h3>
              <p className="font-body-md text-body-md text-[#404944] dark:text-slate-300">
                Módulo institucional de backups manuales y automáticos con verificación de suma de comprobación SHA-256, control de concurrencia y registro inmutable de acciones críticas.
              </p>
            </div>
            <div className="pt-6 font-label-caps text-label-caps text-[#006c49] dark:text-[#6cf8bb] uppercase flex items-center gap-1.5 font-semibold">
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              <span>Integridad Verificada</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
