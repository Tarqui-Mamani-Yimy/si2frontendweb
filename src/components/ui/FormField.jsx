/**
 * FormField — wrapper de campo con etiqueta y feedback de validación.
 * Input — campo de texto estandarizado NexaCoop Precision.
 * Textarea — área de texto estandarizada NexaCoop Precision.
 */

export function FormField({ id, label, required, error, children }) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
      >
        {label}
        {required && (
          <span className="ml-1 text-red-500" aria-hidden="true">*</span>
        )}
      </label>
      {children}
      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1" role="alert">
          <span className="material-symbols-outlined text-[14px]">error</span>
          <span>{error}</span>
        </p>
      )}
    </div>
  )
}

const INPUT_BASE =
  'w-full h-10 rounded-lg border px-3.5 text-sm text-[#0b1c30] ' +
  'placeholder:text-slate-400 outline-none transition duration-150 ' +
  'focus:ring-2 focus:ring-[#006c49]/20 focus:border-[#006c49] focus:bg-white ' +
  'disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed'

const INPUT_NORMAL = 'border-slate-200 bg-slate-50/60 hover:border-slate-300'
const INPUT_ERROR  = 'border-red-400 bg-red-50/60 focus:ring-red-400/20 focus:border-red-500'

export function Input({ hasError = false, className = '', ...rest }) {
  return (
    <input
      className={`${INPUT_BASE} ${hasError ? INPUT_ERROR : INPUT_NORMAL} ${className}`}
      {...rest}
    />
  )
}

export function Textarea({ hasError = false, className = '', ...rest }) {
  return (
    <textarea
      className={`w-full min-h-[96px] rounded-lg border p-3 text-sm text-[#0b1c30] placeholder:text-slate-400 outline-none transition duration-150 focus:ring-2 focus:ring-[#006c49]/20 focus:border-[#006c49] focus:bg-white disabled:bg-slate-100 disabled:text-slate-400 resize-none ${hasError ? INPUT_ERROR : INPUT_NORMAL} ${className}`}
      {...rest}
    />
  )
}
