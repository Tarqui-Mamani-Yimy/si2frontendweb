import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { confirmPasswordReset } from '../../../core/api/authApi'
import Button from '../../../components/ui/Button'
import AlertBanner from '../../../components/ui/AlertBanner'
import PasswordInput from '../../../components/ui/PasswordInput'
import { PASSWORD_HINT, PASSWORD_MIN_LENGTH, PASSWORD_PATTERN, isPasswordValid } from '../../../core/utils/password'
import castorAvatar from '../../../assets/screen copy.png'

const FIELD_CLASS =
  'w-full h-10 rounded-lg border border-slate-200 bg-slate-50/60 px-3.5 text-sm text-[#0b1c30] ' +
  'placeholder:text-slate-400 outline-none transition duration-150 ' +
  'focus:border-[#006c49] focus:ring-2 focus:ring-[#006c49]/20 focus:bg-white ' +
  'disabled:bg-slate-100 disabled:text-slate-400'

function getPasswordStrength(pwd) {
  if (!pwd) return { score: 0, label: '—', color: 'bg-slate-200' }
  let score = 0
  if (pwd.length >= 6) score++
  if (pwd.length >= PASSWORD_MIN_LENGTH) score++
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++
  if (/\d/.test(pwd)) score++
  if (/[^A-Za-z0-9]/.test(pwd)) score++

  const labels = ['Muy débil', 'Débil', 'Aceptable', 'Buena', 'Fuerte', 'Muy fuerte']
  const colors = [
    'bg-red-400', 'bg-red-400', 'bg-amber-400', 'bg-amber-400', 'bg-emerald-400', 'bg-emerald-500',
  ]
  return {
    score,
    label: labels[Math.min(score, labels.length - 1)],
    color: colors[Math.min(score, colors.length - 1)],
  }
}

export default function ResetPasswordPage() {
  const { token } = useParams()
  const navigate = useNavigate()

  const [nueva,             setNueva]            = useState('')
  const [confirmacion,      setConfirmacion]     = useState('')
  const [submitting,        setSubmitting]       = useState(false)
  const [success,           setSuccess]          = useState(false)
  const [errorMessage,      setErrorMessage]     = useState(null)

  const tokenValido = useMemo(() => Boolean(token && token.trim().length > 0), [token])
  const strength    = useMemo(() => getPasswordStrength(nueva), [nueva])

  async function handleSubmit(event) {
    event.preventDefault()
    setErrorMessage(null)

    if (!tokenValido) {
      setErrorMessage('El enlace de recuperación no es válido.')
      return
    }
    if (!isPasswordValid(nueva)) {
      setErrorMessage(PASSWORD_HINT)
      return
    }
    if (nueva !== confirmacion) {
      setErrorMessage('Las contraseñas no coinciden.')
      return
    }

    setSubmitting(true)
    try {
      await confirmPasswordReset({ token, nueva_contrasena: nueva })
      setSuccess(true)
      setTimeout(() => navigate('/login', { replace: true }), 2500)
    } catch (error) {
      const status = error.response?.status
      const detail = error.response?.data?.detail
      if (status === 400 || status === 422) {
        setErrorMessage(detail ?? 'El enlace es inválido o ha expirado.')
      } else if (status === 410) {
        setErrorMessage('El enlace ha expirado. Solicita uno nuevo.')
      } else {
        setErrorMessage('No se pudo restablecer la contraseña. Intente nuevamente.')
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
          Nueva Contraseña
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Establezca su nueva contraseña corporativa autorizada.
        </p>
      </div>

      {!tokenValido ? (
        <AlertBanner variant="error">
          El enlace de recuperación no es válido. Solicita uno nuevo desde la
          pantalla de inicio de sesión.
        </AlertBanner>
      ) : success ? (
        <AlertBanner variant="success" title="¡Contraseña fiduciaria actualizada!">
          Te redirigiremos al portal de inicio de sesión en unos segundos.
        </AlertBanner>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Nueva contraseña */}
          <div>
            <label
              htmlFor="nueva"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700"
            >
              Nueva contraseña
            </label>
            <PasswordInput
              id="nueva"
              autoComplete="new-password"
              required
              minLength={PASSWORD_MIN_LENGTH}
              pattern={PASSWORD_PATTERN}
              title={PASSWORD_HINT}
              value={nueva}
              onChange={(e) => setNueva(e.target.value)}
              placeholder={`Mínimo ${PASSWORD_MIN_LENGTH} caracteres`}
              className={FIELD_CLASS}
              disabled={submitting}
            />
            <p className="mt-1 text-[11px] text-slate-500">{PASSWORD_HINT}</p>
            {nueva && (
              <div className="mt-2 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className={`h-full transition-all duration-200 ${strength.color}`}
                    style={{ width: `${(strength.score / 5) * 100}%` }}
                  />
                </div>
                <span className="text-[11px] font-semibold text-slate-600">
                  {strength.label}
                </span>
              </div>
            )}
          </div>

          {/* Confirmación */}
          <div>
            <label
              htmlFor="confirmacion"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700"
            >
              Confirmar contraseña
            </label>
            <PasswordInput
              id="confirmacion"
              autoComplete="new-password"
              required
              value={confirmacion}
              onChange={(e) => setConfirmacion(e.target.value)}
              placeholder="••••••••••••"
              className={FIELD_CLASS}
              disabled={submitting}
            />
          </div>

          {errorMessage && (
            <AlertBanner variant="error" onClose={() => setErrorMessage(null)}>
              {errorMessage}
            </AlertBanner>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={submitting}
            className="w-full bg-[#064e3b] hover:bg-[#0c4f30] text-white"
          >
            {submitting ? 'Guardando credenciales…' : 'Guardar nueva contraseña'}
          </Button>
        </form>
      )}

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
