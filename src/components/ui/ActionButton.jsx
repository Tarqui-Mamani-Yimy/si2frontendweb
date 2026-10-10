/**
 * ActionButton — botón de acción interactivo NexaCoop.
 *
 * Variantes:
 *   'primary'   → institucional emerald (#064e3b)
 *   'accent'    → fintech mint (#10b981)
 *   'secondary' → blanco con borde hairline slate (#e2e8f0)
 *   'ghost'     → transparente
 *   'danger'    → rojo precisión (#dc2626)
 */

const BASE =
  'inline-flex items-center justify-center gap-2 font-semibold rounded-lg ' +
  'transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 ' +
  'focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ' +
  'active:scale-[0.98] select-none'

const VARIANTS = {
  primary:
    'bg-[#064e3b] text-white border border-[#04382a] hover:bg-[#0c4f30] ' +
    'focus-visible:ring-[#064e3b] shadow-sm',
  accent:
    'bg-[#10b981] text-white border border-[#059669] hover:bg-[#059669] ' +
    'focus-visible:ring-[#10b981] shadow-sm',
  secondary:
    'bg-white text-[#0b1c30] border border-[#e2e8f0] hover:bg-slate-50 ' +
    'hover:border-[#cbd5e1] focus-visible:ring-slate-400 shadow-xs',
  ghost:
    'bg-transparent text-slate-700 hover:bg-slate-100 hover:text-slate-900 ' +
    'focus-visible:ring-slate-300',
  danger:
    'bg-[#dc2626] text-white border border-[#b91c1c] hover:bg-[#b91c1c] ' +
    'focus-visible:ring-red-500 shadow-sm',
}

const SIZES = {
  sm: 'text-xs px-3.5 py-1.5 min-h-[32px]',
  md: 'text-sm px-5 py-2 min-h-[40px]',
  lg: 'text-sm px-6 py-2.5 min-h-[44px]',
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  )
}

export default function ActionButton({
  variant   = 'primary',
  size      = 'md',
  loading   = false,
  disabled,
  children,
  className = '',
  ...rest
}) {
  return (
    <button
      disabled={disabled || loading}
      className={`${BASE} ${VARIANTS[variant] ?? VARIANTS.primary} ${SIZES[size] ?? SIZES.md} ${className}`}
      {...rest}
    >
      {loading && <Spinner />}
      {children}
    </button>
  )
}
