import { useEffect, useState } from 'react'
import * as adminApi from '../../../core/api/adminApi'

function errorMessage(error) { return error.response?.data?.detail ?? 'No se pudo completar la operación.' }

export default function RolesPage() {
  const [roles, setRoles] = useState([])
  const [permisos, setPermisos] = useState([])
  const [form, setForm] = useState({ nombre: '', descripcion: '', permiso_ids: [] })
  const [editando, setEditando] = useState(null)
  const [error, setError] = useState(null)

  async function cargar() {
    try { setRoles(await adminApi.listRoles()); setPermisos(await adminApi.listPermisos()) } catch (err) { setError(errorMessage(err)) }
  }
  useEffect(() => { cargar() }, [])

  function editar(rol) { setEditando(rol); setForm({ nombre: rol.nombre, descripcion: rol.descripcion ?? '', permiso_ids: rol.permisos.map((permiso) => permiso.id) }) }
  function togglePermiso(id) { setForm((prev) => ({ ...prev, permiso_ids: prev.permiso_ids.includes(id) ? prev.permiso_ids.filter((value) => value !== id) : [...prev.permiso_ids, id] })) }
  async function guardar(event) {
    event.preventDefault(); setError(null)
    try { if (editando) await adminApi.updateRole(editando.id, form); else await adminApi.createRole(form); setEditando(null); setForm({ nombre: '', descripcion: '', permiso_ids: [] }); await cargar() } catch (err) { setError(errorMessage(err)) }
  }
  async function eliminar(rol) {
    if (!window.confirm(`¿Eliminar el rol ${rol.nombre}?`)) return
    try { await adminApi.deleteRole(rol.id); await cargar() } catch (err) { setError(errorMessage(err)) }
  }

  return <section><div className="mb-6"><p className="text-xs font-semibold uppercase tracking-widest text-forest">Administración</p><h1 className="mt-1 text-2xl font-bold text-slate-900">Roles y permisos</h1><p className="mt-1 text-sm text-slate-500">Configura los permisos asociados a cada rol.</p></div>{error && <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}<div className="grid gap-6 lg:grid-cols-[1fr_360px]"><div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm"><table className="w-full text-left text-sm"><thead className="border-b bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Rol</th><th className="px-4 py-3">Permisos</th><th className="px-4 py-3 text-right">Acciones</th></tr></thead><tbody className="divide-y divide-slate-100">{roles.map((rol) => <tr key={rol.id}><td className="px-4 py-3 font-semibold">{rol.nombre}</td><td className="px-4 py-3 text-slate-600">{rol.permisos.length}</td><td className="px-4 py-3 text-right"><button onClick={() => editar(rol)} className="mr-3 font-semibold text-navy">Editar</button><button onClick={() => eliminar(rol)} className="font-semibold text-red-600">Eliminar</button></td></tr>)}</tbody></table></div><form onSubmit={guardar} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="mb-4 font-semibold">{editando ? 'Editar rol' : 'Nuevo rol'}</h2><input required minLength={2} placeholder="Nombre del rol" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /><textarea placeholder="Descripción" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" rows="3" /><p className="mb-2 text-sm font-medium">Permisos</p><div className="mb-5 max-h-48 space-y-2 overflow-y-auto">{permisos.map((permiso) => <label key={permiso.id} className="flex gap-2 text-sm text-slate-600"><input type="checkbox" checked={form.permiso_ids.includes(permiso.id)} onChange={() => togglePermiso(permiso.id)} />{permiso.nombre}</label>)}</div><div className="flex justify-end gap-2">{editando && <button type="button" onClick={() => { setEditando(null); setForm({ nombre: '', descripcion: '', permiso_ids: [] }) }} className="rounded-lg border px-3 py-2 text-sm">Cancelar</button>}<button className="rounded-lg bg-navy px-3 py-2 text-sm font-semibold text-white">Guardar</button></div></form></div></section>
}