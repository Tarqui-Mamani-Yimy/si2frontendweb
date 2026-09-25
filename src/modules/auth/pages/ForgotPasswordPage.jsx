import { useState } from 'react'
import { Link } from 'react-router-dom'
import { requestPasswordReset } from '../../../core/api/authApi'
import Button from '../../../components/ui/Button'
import AlertBanner from '../../../components/ui/AlertBanner'
import castorAvatar from '../../../assets/screen copy.png'

const FIELD_CLASS =
  'w-full h-10 rounded-lg border border-slate-200 bg-slate-50/60 px-3.5 text-sm text-[#0b1c30] ' +
  'placeholder:text-slate-400 outline-none transition duration-150 ' +
  'focus:border-[#006c49] focus:ring-2 focus:ring-[#006c49]/20 focus:bg-white ' +
  'disabled:bg-slate-100 disabled:text-slate-400'

export default function ForgotPasswordPage() {
  const [correo,        setCorreo]        = useState('')
  const [submitting,    setSubmitting]    = useState(false)
  const [successMsg,    setSuccessMsg]    = useState(null)
  const [errorMessage,  setErrorMessage]  = useState(null)

  async function handleSubmit(event) {
    event.preventDefault()
    setSuccessMsg(null)
    setErrorMessage(null)
    setSubmitting(true)
    try {
      const data = await requestPasswordReset(correo)
      if (data?.debug_token) {
        const link = `${window.location.origin}/recuperar/${data.debug_token}`
        setSuccessMsg(
          'Modo desarrollo: el enlace generado es ' +
          `${link} . Cópialo y ábrelo en tu navegador para continuar.`
        )
      } else if (data?.delivered === false) {
        setSuccessMsg(
          'Solicitud registrada, pero no pudimos entregar el correo al SMTP. ' +
          'Revisa la configuración del servidor o contacta al administrador.'
        )
      } else {
        setSuccessMsg(
          'Si el correo está registrado, enviaremos un enlace de recuperación ' +
          'en los próximos minutos. Revisa también la carpeta de spam.',
        )
      }
      setCorreo('')
    } catch (error) {
      if (error.response?.status === 422) {
        setErrorMessage('Verifica que el correo tenga un formato válido.')
      } else {
        setErrorMessage(
          'No se pudo procesar la solicitud. Intente nuevamente en unos minutos.',
        )
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl border border-white/80 animate-slide-up">
      {/* Brand Header */}
      <div className="flex flex-col items-center mb-6 text-center">
        <div className="h-16 w-16 rounded-2xl bg-[#064e3b] p-1 border border-emerald-400/30 shadow-md mb-3 flex items-center justify-center overflow-hidden">
          <img src={castorAvatar} alt="NexaCoop Logo" className="w-full h-full object-cover rounded-xl" />
        </div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
          Recuperar Contraseña
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Ingrese su correo institucional para recibir las instrucciones fiduciarias de recuperación.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label
            htmlFor="correo"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700"
          >
            Correo electrónico
          </label>
          <input
            id="correo"
            type="email"
            autoComplete="email"
            required
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            placeholder="usuario@nexacoop.com"
            className={FIELD_CLASS}
            disabled={submitting}
          />
        </div>

        {errorMessage && (
          <AlertBanner variant="error" onClose={() => setErrorMessage(null)}>
            {errorMessage}
          </AlertBanner>
        )}

        {successMsg && (
          <AlertBanner variant="success" onClose={() => setSuccessMsg(null)}>
            {successMsg}
          </AlertBanner>
        )}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={submitting}
          className="w-full bg-[#064e3b] hover:bg-[#0c4f30] text-white"
        >
          {submitting ? 'Enviando instrucciones…' : 'Enviar enlace de recuperación'}
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-slate-500 border-t border-slate-100 pt-4">
        <Link
          to="/login"
          className="font-semibold text-emerald-700 hover:text-emerald-900 transition flex items-center justify-center gap-1"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>Volver al inicio de sesión</span>
        </Link>
      </div>

      <p className="mt-5 text-center text-[11px] text-slate-400">
        NexaCoop Core Banking · Sistema protegido
      </p>
    </div>
  )
}
