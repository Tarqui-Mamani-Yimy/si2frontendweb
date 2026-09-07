import { useEffect, useState } from 'react'
import * as adminApi from '../../../core/api/adminApi'

const EMPTY = { nombre: '', correo: '', contrasena: '', rol: 'CAJERO', estado: 'ACTIVO' }
const ROLES = ['ADMINISTRADOR', 'CAJERO', 'OFICIAL_CREDITO', 'CONTADOR', 'SOCIO']

function message(error) {
  return error.response?.data?.detail ?? 'No se pudo completar la operación.'
}

function UsuarioModal({ usuario, roles, onClose, onSave }) {
  const [form, setForm] = useState(usuario ? { nombre: usuario.nombre, correo: usuario.correo, rol: usuario.rol.nombre, estado: usuario.estado, contrasena: '' } : EMPTY)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const payload = { nombre: form.nombre, correo: form.correo, rol: form.rol, estado: form.estado }
      if (form.contrasena) payload.contrasena = form.contrasena
      await onSave(payload)
      onClose()
    } catch (err) {
      setError(message(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <form onSubmit={submit} className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <h2 className="mb-5 text-lg font-semibold text-slate-900">{usuario ? 'Editar usuario' : 'Nuevo usuario'}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="sm:col-span-2"><span className="text-sm font-medium text-slate-700">Nombre</span><input required minLength={2} value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
          <label><span className="text-sm font-medium text-slate-700">Correo</span><input required type="email" value={form.correo} onChange={(e) => setForm({ ...form, correo: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
          <label><span className="text-sm font-medium text-slate-700">Rol</span><select value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">{(roles.length ? roles : ROLES.map((nombre) => ({ nombre }))).map((rol) => <option key={rol.nombre} value={rol.nombre}>{rol.nombre}</option>)}</select></label>
          <label><span className="text-sm font-medium text-slate-700">Estado</span><select value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"><option>ACTIVO</option><option>INACTIVO</option><option>BLOQUEADO</option></select></label>
          <label><span className="text-sm font-medium text-slate-700">{usuario ? 'Nueva contraseña' : 'Contraseña'}</span><input type="password" minLength={8} required={!usuario} value={form.contrasena} onChange={(e) => setForm({ ...form, contrasena: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
        </div>
        {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}
        <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={onClose} className="rounded-lg border px-4 py-2 text-sm">Cancelar</button><button disabled={saving} className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving ? 'Guardando…' : 'Guardar'}</button></div>
      </form>
    </div>
  )
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState([])
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [modal, setModal] = useState(null)

  async function cargar() {
    setLoading(true)
    try {
      const [users, availableRoles] = await Promise.all([adminApi.listUsuarios(), adminApi.listRoles()])
      setUsuarios(users)
      setRoles(availableRoles)
      setError(null)
    } catch (err) { setError(message(err)) } finally { setLoading(false) }
  }

  useEffect(() => { cargar() }, [])

  async function guardar(usuario, payload) {
    if (usuario) await adminApi.updateUsuario(usuario.id, payload)
    else await adminApi.registrarUsuario(payload)
    await cargar()
  }

  async function alternar(usuario) {
    if (usuario.estado === 'ACTIVO' && !window.confirm(`¿Desactivar a ${usuario.nombre}?`)) return
    try {
      if (usuario.estado === 'ACTIVO') await adminApi.deactivateUsuario(usuario.id)
      else await adminApi.reactivateUsuario(usuario.id)
      await cargar()
    } catch (err) { setError(message(err)) }
  }

  return (
    <section>
      <div className="mb-6 flex items-start justify-between"><div><p className="text-xs font-semibold uppercase tracking-widest text-forest">Administración</p><h1 className="mt-1 text-2xl font-bold text-slate-900">Usuarios</h1><p className="mt-1 text-sm text-slate-500">Gestiona cuentas, roles y estados de acceso.</p></div><button onClick={() => setModal('new')} className="rounded-xl bg-navy px-4 py-2 text-sm font-semibold text-white">Nuevo usuario</button></div>
      {error && <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm"><table className="w-full text-left text-sm"><thead className="border-b bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Nombre</th><th className="px-4 py-3">Correo</th><th className="px-4 py-3">Rol</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3 text-right">Acciones</th></tr></thead><tbody className="divide-y divide-slate-100">{loading ? <tr><td colSpan="5" className="px-4 py-8 text-center text-slate-500">Cargando…</td></tr> : usuarios.map((usuario) => <tr key={usuario.id}><td className="px-4 py-3 font-medium text-slate-900">{usuario.nombre}</td><td className="px-4 py-3 text-slate-600">{usuario.correo}</td><td className="px-4 py-3">{usuario.rol.nombre}</td><td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-xs font-semibold ${usuario.estado === 'ACTIVO' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>{usuario.estado}</span></td><td className="px-4 py-3 text-right"><button onClick={() => setModal(usuario)} className="mr-3 text-sm font-semibold text-navy">Editar</button><button onClick={() => alternar(usuario)} className="text-sm font-semibold text-red-600">{usuario.estado === 'ACTIVO' ? 'Desactivar' : 'Reactivar'}</button></td></tr>)}</tbody></table></div>
      {modal && <UsuarioModal usuario={modal === 'new' ? null : modal} roles={roles.filter((rol) => rol.nombre !== 'SUPERADMIN')} onClose={() => setModal(null)} onSave={(payload) => guardar(modal === 'new' ? null : modal, payload)} />}
    </section>
  )
}