import { useEffect } from 'react'
import { createPortal } from 'react-dom'

const SIZES = {
  md: 'max-w-lg',
  lg: 'max-w-4xl',
}

/**
 * Modal — ventana modal institucional NexaCoop Precision.
 */
export default function Modal({ open, onClose, title, subtitle, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!open) return
    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fade-in"
      onClick={onClose}
      role="presentation"
    >
      <div
        className={`flex max-h-[85vh] w-full ${SIZES[size] ?? SIZES.md} flex-col overflow-hidden rounded-2xl bg-white border border-[#e2e8f0] shadow-2xl`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-[#e2e8f0] px-6 py-4 bg-[#f8f9ff]">
          <div>
            <h3 className="font-display text-lg font-bold text-[#0b1c30] tracking-tight">{title}</h3>
            {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-200/60 hover:text-slate-700"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-4">{children}</div>

        {footer && (
          <div className="border-t border-[#e2e8f0] bg-slate-50/60 px-6 py-3.5 flex justify-end items-center gap-2">{footer}</div>
        )}
      </div>
    </div>,
    document.body,
  )
}
