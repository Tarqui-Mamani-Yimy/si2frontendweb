import { useState } from 'react'

/**
 * Final Call-To-Action & Demonstration Request Form.
 */
export default function LandingCta({ selectedPlan }) {
  const [formData, setFormData] = useState({
    nombre: '',
    cargo: '',
    cooperativa: '',
    correo: '',
    telefono: '',
    socios: '2,000 a 10,000 socios',
  })
  const [formSubmitted, setFormSubmitted] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    setFormSubmitted(true)
  }

  return (
    <section id="demo" className="w-full py-20 bg-[#064e3b] text-white relative overflow-hidden">
      {/* Ambient Graphic Shapes */}
      <div
        className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-[#006c49]/30 blur-3xl pointer-events-none motion-reduce:hidden"
        aria-hidden="true"
      />
      <div
        className="absolute left-10 top-10 w-64 h-64 rounded-full bg-[#003527]/40 blur-2xl pointer-events-none motion-reduce:hidden"
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left: Hook copy */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#6ffbbe]/20 text-[#6ffbbe] text-xs font-bold uppercase tracking-wider">
              <span>Afiliación y Modernización ASFI</span>
            </div>

            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight">
              ¿Listo para llevar las finanzas de tu cooperativa al siguiente nivel?
            </h2>

            <p className="text-base sm:text-lg text-[#80bea6] leading-relaxed">
              Agenda una sesión personalizada con nuestros especialistas fiduciarios. Te demostraremos la migración sin fricciones desde tu sistema actual y el valor inmediato de NexaCoop bajo normativa ASFI.
            </p>

            <div className="space-y-3 pt-2 text-sm text-[#80bea6]">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#6ffbbe] text-[20px]">check_circle</span>
                <span>Demostración técnica con datos adaptados a normativa boliviana</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#6ffbbe] text-[20px]">check_circle</span>
                <span>Evaluación de compatibilidad con plan de cuentas ASFI</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#6ffbbe] text-[20px]">check_circle</span>
                <span>Planes accesibles según escala de socios activos</span>
              </div>
            </div>
          </div>

          {/* Right: Fast Form Card */}
          <div className="lg:col-span-6">
            <div className="bg-white dark:bg-[#0b1f19] text-[#0b1c30] dark:text-white p-8 rounded-2xl shadow-2xl border border-[#bfc9c3]/20 dark:border-emerald-900/40">
              <div className="mb-6">
                <h3 className="font-display text-xl font-bold text-[#003527] dark:text-[#6cf8bb]">
                  Solicitar Demostración Técnica
                </h3>
                <p className="text-xs text-[#404944] dark:text-slate-300 mt-1">
                  Completa los datos de tu institución y te contactaremos en breve.
                </p>
                {selectedPlan && (
                  <span className="inline-block mt-2 px-2.5 py-1 rounded bg-emerald-100 text-[#003527] text-xs font-bold">
                    Plan Seleccionado: {selectedPlan}
                  </span>
                )}
              </div>

              {formSubmitted ? (
                <div className="p-6 rounded-xl bg-[#eff4ff] dark:bg-[#061814] border border-[#6cf8bb] text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-[#6cf8bb]/40 dark:bg-[#003527] text-[#006c49] dark:text-[#6cf8bb] flex items-center justify-center mx-auto">
                    <span className="material-symbols-outlined text-[28px]">check_circle</span>
                  </div>
                  <h4 className="font-bold text-[#003527] dark:text-white">¡Solicitud Recibida con Éxito!</h4>
                  <p className="text-xs text-[#404944] dark:text-slate-300">
                    Un consultor senior de NexaCoop se comunicará con <strong>{formData.correo || 'usted'}</strong> para coordinar la agenda de la demostración.
                  </p>
                  <button
                    type="button"
                    onClick={() => setFormSubmitted(false)}
                    className="px-4 py-2 bg-[#006c49] text-white rounded-lg text-xs font-semibold hover:bg-[#005236] transition-colors"
                  >
                    Enviar otra solicitud
                  </button>
                </div>
              ) : (
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-[#707974] dark:text-slate-300 mb-1">
                        Nombre Completo
                      </label>
                      <input
                        className="w-full px-3.5 py-2.5 rounded-lg bg-[#f8f9ff] dark:bg-[#061511] border border-[#bfc9c3]/40 dark:border-emerald-900/50 focus:outline-none focus:ring-2 focus:ring-[#006c49] text-sm text-[#0b1c30] dark:text-white"
                        placeholder="Ej. Carlos Arguedas"
                        required
                        type="text"
                        value={formData.nombre}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-[#707974] dark:text-slate-300 mb-1">
                        Cargo Institucional
                      </label>
                      <input
                        className="w-full px-3.5 py-2.5 rounded-lg bg-[#f8f9ff] dark:bg-[#061511] border border-[#bfc9c3]/40 dark:border-emerald-900/50 focus:outline-none focus:ring-2 focus:ring-[#006c49] text-sm text-[#0b1c30] dark:text-white"
                        placeholder="Ej. Gerente / Auditor"
                        required
                        type="text"
                        value={formData.cargo}
                        onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-[#707974] dark:text-slate-300 mb-1">
                      Nombre de la Cooperativa
                    </label>
                    <input
                      className="w-full px-3.5 py-2.5 rounded-lg bg-[#f8f9ff] dark:bg-[#061511] border border-[#bfc9c3]/40 dark:border-emerald-900/50 focus:outline-none focus:ring-2 focus:ring-[#006c49] text-sm text-[#0b1c30] dark:text-white"
                      placeholder="Ej. Cooperativa de Ahorro y Crédito"
                      required
                      type="text"
                      value={formData.cooperativa}
                      onChange={(e) => setFormData({ ...formData, cooperativa: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-[#707974] dark:text-slate-300 mb-1">
                        Correo Corporativo
                      </label>
                      <input
                        className="w-full px-3.5 py-2.5 rounded-lg bg-[#f8f9ff] dark:bg-[#061511] border border-[#bfc9c3]/40 dark:border-emerald-900/50 focus:outline-none focus:ring-2 focus:ring-[#006c49] text-sm text-[#0b1c30] dark:text-white"
                        placeholder="contacto@cooperativa.bo"
                        required
                        type="email"
                        value={formData.correo}
                        onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-[#707974] dark:text-slate-300 mb-1">
                        Teléfono / Celular
                      </label>
                      <input
                        className="w-full px-3.5 py-2.5 rounded-lg bg-[#f8f9ff] dark:bg-[#061511] border border-[#bfc9c3]/40 dark:border-emerald-900/50 focus:outline-none focus:ring-2 focus:ring-[#006c49] text-sm text-[#0b1c30] dark:text-white"
                        placeholder="+591 70000000"
                        required
                        type="tel"
                        value={formData.telefono}
                        onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-[#707974] dark:text-slate-300 mb-1">
                      Socios Activos Estimados
                    </label>
                    <select
                      className="w-full px-3.5 py-2.5 rounded-lg bg-[#f8f9ff] dark:bg-[#061511] border border-[#bfc9c3]/40 dark:border-emerald-900/50 focus:outline-none focus:ring-2 focus:ring-[#006c49] text-sm text-[#0b1c30] dark:text-white"
                      value={formData.socios}
                      onChange={(e) => setFormData({ ...formData, socios: e.target.value })}
                    >
                      <option className="dark:bg-[#0b1f19]">Menos de 2,000 socios</option>
                      <option className="dark:bg-[#0b1f19]">2,000 a 10,000 socios</option>
                      <option className="dark:bg-[#0b1f19]">10,000 a 50,000 socios</option>
                      <option className="dark:bg-[#0b1f19]">Más de 50,000 socios</option>
                    </select>
                  </div>

                  <button
                    data-magnetic
                    type="submit"
                    className="w-full py-3.5 rounded-xl bg-[#006c49] hover:bg-[#005236] text-white font-bold text-sm transition-all shadow-md mt-2 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                  >
                    <span>Agendar Demostración Técnica</span>
                    <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                  </button>

                  <p className="text-[11px] text-center text-[#707974] dark:text-slate-400 pt-1">
                    Confidencialidad garantizada. Sin compromiso de contratación.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
