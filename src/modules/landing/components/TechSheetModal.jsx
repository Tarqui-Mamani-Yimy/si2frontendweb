/**
 * Technical Sheet Modal matching App.tsx.
 */
export default function TechSheetModal({ open, onClose }) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Ficha Técnica de Integración Core 4.0"
    >
      <div
        className="bg-white dark:bg-[#0b1f19] rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-[#bfc9c3]/40 dark:border-emerald-900/40 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b pb-3 border-[#bfc9c3]/20 dark:border-emerald-900/30">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#006c49] dark:text-[#6cf8bb]">
              description
            </span>
            <h3 className="font-headline-md text-lg text-[#003527] dark:text-white font-bold">
              Ficha Técnica de Integración Core 4.0
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

        <div className="text-xs text-[#404944] dark:text-slate-300 space-y-3">
          <p>
            NexaCoop Core Banking opera con una arquitectura orientada a microservicios con aislamiento criptográfico multi-tenant bajo estándares ASFI.
          </p>

          <div className="p-3 bg-[#eff4ff] dark:bg-[#061814] rounded-lg space-y-1.5 border border-[#dce9ff] dark:border-emerald-900/40">
            <p className="font-bold text-[#003527] dark:text-[#6cf8bb] text-sm">
              Especificaciones de Conectividad:
            </p>
            <p>
              • <strong>APIs RESTful &amp; WebSockets:</strong> Integración reactiva de alta concurrencia para operaciones en ventanilla y canales digitales.
            </p>
            <p>
              • <strong>Bases de Datos Aisladas:</strong> PostgreSQL multi-schema con segregación de datos por cooperativa.
            </p>
            <p>
              • <strong>Redes de Pago:</strong> Conectores para QR Simple (Bolivia), ACH y transferencias intercooperativas.
            </p>
            <p>
              • <strong>Motor Contable:</strong> Catálogo de cuentas estructurado bajo el manual de cuentas para entidades financieras de la ASFI.
            </p>
          </div>

          <div className="p-3 bg-[#e5eeff] dark:bg-[#061814] rounded-lg space-y-1 border border-[#dce9ff] dark:border-emerald-900/40">
            <p className="font-bold text-[#003527] dark:text-[#6cf8bb]">Requisitos de Despliegue:</p>
            <p>
              Arquitectura Cloud Nativa en contenedores o infraestructura On-Premise según las políticas de seguridad de la cooperativa.
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
          <a
            href="#demo"
            onClick={onClose}
            className="px-5 py-2 bg-[#006c49] text-white rounded-lg text-sm font-semibold hover:bg-[#005236] inline-flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            <span>Obtener Documentación Completa</span>
          </a>
        </div>
      </div>
    </div>
  )
}
