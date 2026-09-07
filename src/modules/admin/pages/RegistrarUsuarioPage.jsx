import { useState } from 'react'
import { Link } from 'react-router-dom'
import { registrarUsuario } from '../../../core/api/adminApi'
import AlertBanner from '../../../components/ui/AlertBanner'
import Button from '../../../components/ui/Button'

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
  const [form, setForm] = useState({
    nombre: '',
    correo: '',
    contrasena: '',
    rol: 'CAJERO',
  })
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState(null)

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setStatus('loading')
    setMessage(null)
    try {
      await registrarUsuario(form)
      setStatus('success')
      setMessage('Usuario registrado correctamente.')
      setForm({ nombre: '', correo: '', contrasena: '', rol: 'CAJERO' })
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

          <div className="sm:col-span-2">
            <label htmlFor="contrasena" className="mb-1.5 block text-sm font-medium text-slate-700">Contraseña temporal</label>
            <input id="contrasena" name="contrasena" type="password" required minLength={8} maxLength={128} value={form.contrasena} onChange={updateField} className={FIELD_CLASS} placeholder="Mínimo 8 caracteres" disabled={isLoading} />
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