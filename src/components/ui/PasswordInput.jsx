import { useState } from 'react'

/**
 * PasswordInput — input de contraseña con alternador de visibilidad.
 */
export default function PasswordInput({ className = '', disabled = false, ...rest }) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative">
      <input
        type={visible ? 'text' : 'password'}
        disabled={disabled}
        className={`${className} pr-11`}
        {...rest}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        disabled={disabled}
        tabIndex={-1}
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        aria-pressed={visible}
        title={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        className="absolute inset-y-0 right-0 flex items-center justify-center px-3.5 text-slate-400 transition hover:text-[#064e3b] focus:outline-none focus-visible:text-[#064e3b] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
          {visible ? 'visibility_off' : 'visibility'}
        </span>
      </button>
    </div>
  )
}
