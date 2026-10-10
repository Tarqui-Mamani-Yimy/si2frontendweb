import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { registrarUsuario } from '../../../core/api/adminApi'
import { listCooperativas } from '../../../core/api/cooperativasApi'
import { selectUser, useAuthStore } from '../../../core/store/authStore'
import AlertBanner from '../../../components/ui/AlertBanner'
import Button from '../../../components/ui/Button'
import PasswordInput from '../../../components/ui/PasswordInput'
import { PASSWORD_HINT, PASSWORD_MIN_LENGTH, PASSWORD_PATTERN } from '../../../core/utils/password'

const FIELD_CLASS =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 ' +
  'placeholder-slate-400 outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/20'

const ROLES = [
  { value: 'ADMINISTRADOR', label: 'Administrador' },
  { value: 'CAJERO', label: 'Cajero' },
  { value: 'OFICIAL_CREDITO', label: 'Oficial de crédito' },
  { value: 'CONTADOR', label: 'Contador' },
  { value: 'SOCIO', label: 'Socio' },
]

function errorMessage(error) {
  return error.response?.data?.detail ?? 'No se pudo registrar el usuario.'
}

export default function RegistrarUsuarioPage() {
  const user = useAuthStore(selectUser)
  const isSuperAdmin = user?.rol?.nombre === 'SUPERADMIN'
  // Un SUPERADMIN siempre elige la cooperativa del nuevo usuario. Un
  // ADMINISTRADOR que todavía no tiene cooperativa asignada (bootstrap de su
  // tenant) también debe poder elegirla; uno que ya pertenece a una queda
  // forzado a la suya en el backend, así que aquí no necesita el campo.
  const canChooseCooperativa = isSuperAdmin || !user?.cooperativa_id

  const [form, setForm] = useState({
    nombre: '',
    correo: '',
    contrasena: '',
    rol: 'CAJERO',
    cooperativa_id: '',
  })
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState(null)

  const [cooperativas, setCooperativas] = useState([])
  const [loadingCoops, setLoadingCoops] = useState(canChooseCooperativa)

  useEffect(() => {
    if (!canChooseCooperativa) return
    setLoadingCoops(true)
    listCooperativas({ estado: 'ACTIVO' })
      .then(setCooperativas)
      .catch(() => setCooperativas([]))
      .finally(() => setLoadingCoops(false))
  }, [canChooseCooperativa])

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setStatus('loading')
    setMessage(null)
    try {
      const payload = canChooseCooperativa
        ? { ...form, cooperativa_id: Number(form.cooperativa_id) }
        : { nombre: form.nombre, correo: form.correo, contrasena: form.contrasena, rol: form.rol }
      await registrarUsuario(payload)
      setStatus('success')
      setMessage('Usuario registrado correctamente.')
      setForm({ nombre: '', correo: '', contrasena: '', rol: 'CAJERO', cooperativa_id: '' })
    } catch (error) {
      setStatus('error')
      setMessage(errorMessage(error))
    }
  }

  const isLoading = status === 'loading'

  return (
    <section className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-forest">Administración</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Registrar usuario</h1>
          <p className="mt-1 text-sm text-slate-500">Crea una cuenta para un miembro del equipo o socio.</p>
        </div>
        <Link
          to="/admin/dashboard"
          className="inline-flex items-center justify-center rounded-xl bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 ring-1 ring-inset ring-slate-200 transition hover:bg-slate-50"
        >
          Volver
        </Link>
      </div>

      {message && (
        <AlertBanner variant={status === 'success' ? 'success' : 'error'} className="mb-5">
          {message}
        </AlertBanner>
      )}

      <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="nombre" className="mb-1.5 block text-sm font-medium text-slate-700">Nombre completo</label>
            <input id="nombre" name="nombre" required minLength={2} maxLength={100} value={form.nombre} onChange={updateField} className={FIELD_CLASS} placeholder="Nombre del usuario" disabled={isLoading} />
          </div>

          <div>
            <label htmlFor="correo" className="mb-1.5 block text-sm font-medium text-slate-700">Correo electrónico</label>
            <input id="correo" name="correo" type="email" required value={form.correo} onChange={updateField} className={FIELD_CLASS} placeholder="usuario@cooperativa.com" disabled={isLoading} />
          </div>

          <div>
            <label htmlFor="rol" className="mb-1.5 block text-sm font-medium text-slate-700">Rol</label>
            <select id="rol" name="rol" value={form.rol} onChange={updateField} className={FIELD_CLASS} disabled={isLoading}>
              {ROLES.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
            </select>
          </div>

          {canChooseCooperativa && (
            <div>
              <label htmlFor="cooperativa_id" className="mb-1.5 block text-sm font-medium text-slate-700">Cooperativa</label>
              <select
                id="cooperativa_id"
                name="cooperativa_id"
                required
                value={form.cooperativa_id}
                onChange={updateField}
                className={FIELD_CLASS}
                disabled={isLoading || loadingCoops}
              >
                <option value="" disabled>
                  {loadingCoops ? 'Cargando cooperativas…' : 'Selecciona una cooperativa'}
                </option>
                {cooperativas.map((coop) => (
                  <option key={coop.id} value={coop.id}>{coop.nombre}</option>
                ))}
              </select>
              {!loadingCoops && cooperativas.length === 0 && (
                <p className="mt-1.5 text-xs text-amber-600">
                  No hay cooperativas activas registradas. Crea una primero en Cooperativas.
                </p>
              )}
            </div>
          )}

          <div className="sm:col-span-2">
            <label htmlFor="contrasena" className="mb-1.5 block text-sm font-medium text-slate-700">Contraseña temporal</label>
            <PasswordInput
              id="contrasena"
              name="contrasena"
              required
              minLength={PASSWORD_MIN_LENGTH}
              maxLength={128}
              pattern={PASSWORD_PATTERN}
              title={PASSWORD_HINT}
              value={form.contrasena}
              onChange={updateField}
              className={FIELD_CLASS}
              placeholder={`Mínimo ${PASSWORD_MIN_LENGTH} caracteres`}
              disabled={isLoading}
            />
            <p className="mt-1.5 text-xs text-slate-500">{PASSWORD_HINT}</p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
          <Link to="/admin/dashboard" className="text-sm font-medium text-slate-500 hover:text-slate-800">Cancelar</Link>
          <Button type="submit" loading={isLoading} size="lg">Registrar usuario</Button>
        </div>
      </form>
    </section>
  )
}