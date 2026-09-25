/**
 * AlertBanner — banner de retroalimentación fiduciaria NexaCoop.
 *
 * Props:
 *   variant: 'error' | 'success' | 'info' | 'warning'
 *   title:   string (opcional)
 *   onClose: función (opcional)
 *   children: contenido del mensaje
 */

const CONFIG = {
  error: {
    wrap:  'border-[#fecaca] bg-[#fef2f2] text-[#991b1b]',
    icon:  'error',
    iconColor: 'text-[#dc2626]',
    title: 'text-[#991b1b]',
    body:  'text-[#b91c1c]',
    close: 'text-[#ef4444] hover:text-[#991b1b]',
  },
  success: {
    wrap:  'border-[#a7f3d0] bg-[#ecfdf5] text-[#065f46]',
    icon:  'check_circle',
    iconColor: 'text-[#059669]',
    title: 'text-[#065f46]',
    body:  'text-[#047857]',
    close: 'text-[#10b981] hover:text-[#065f46]',
  },
  info: {
    wrap:  'border-[#bae6fd] bg-[#f0f9ff] text-[#075985]',
    icon:  'info',
    iconColor: 'text-[#0284c7]',
    title: 'text-[#075985]',
    body:  'text-[#0369a1]',
    close: 'text-[#38bdf8] hover:text-[#075985]',
  },
  warning: {
    wrap:  'border-[#fde68a] bg-[#fffbeb] text-[#92400e]',
    icon:  'warning',
    iconColor: 'text-[#d97706]',
    title: 'text-[#92400e]',
    body:  'text-[#b45309]',
    close: 'text-[#f59e0b] hover:text-[#92400e]',
  },
}

export default function AlertBanner({
  variant  = 'error',
  title,
  onClose,
  children,
  className = '',
}) {
  const c = CONFIG[variant] ?? CONFIG.error

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 rounded-xl border p-4 animate-slide-up shadow-xs ${c.wrap} ${className}`}
    >
      <span className={`material-symbols-outlined text-[20px] shrink-0 mt-0.5 ${c.iconColor}`} aria-hidden="true">
        {c.icon}
      </span>
      <div className="flex-1 min-w-0">
        {title && (
          <p className={`text-sm font-semibold font-display tracking-tight ${c.title}`}>{title}</p>
        )}
        <div className={`text-sm leading-relaxed ${title ? 'mt-0.5' : ''} ${c.body}`}>{children}</div>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className={`shrink-0 p-1 rounded-md text-lg leading-none transition hover:bg-black/5 ${c.close}`}
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      )}
    </div>
  )
}
