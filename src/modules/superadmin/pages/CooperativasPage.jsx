import { useEffect, useMemo, useState } from 'react'
import * as cooperativasApi from '../../../core/api/cooperativasApi'
import SubscriptionBadge from '../../../shared/components/SubscriptionBadge'

const ESTADOS = ['ACTIVO', 'INACTIVO']

const EMPTY_FORM = {
  nombre: '',
  razon_social: '',
  nit: '',
  correo: '',
  telefono: '',
  direccion: '',
}

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('es-BO', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  })
}

function EstadoBadge({ estado }) {
  const activo = estado === 'ACTIVO'
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        activo ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
      }`}
    >
      {estado}
    </span>
  )
}

function CooperativaModal({ inicial, onClose, onSubmit, saving, error }) {
  const [form, setForm] = useState(inicial ?? EMPTY_FORM)

  function handleChange(event) {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    onSubmit(form)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div className="border-b border-slate-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-slate-900">
            {inicial?.id ? 'Editar cooperativa' : 'Nueva cooperativa'}
          </h3>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4 px-6 py-5 sm:grid-cols-2">
            <label className="sm:col-span-2 block">
              <span className="text-sm font-medium text-slate-700">Nombre *</span>
              <input
                type="text"
                name="nombre"
                required
                minLength={2}
                maxLength={150}
                value={form.nombre}
                onChange={handleChange}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">Razón social</span>
              <input
                type="text"
                name="razon_social"
                maxLength={200}
                value={form.razon_social ?? ''}
                onChange={handleChange}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">NIT</span>
              <input
                type="text"
                name="nit"
                maxLength={20}
                value={form.nit ?? ''}
                onChange={handleChange}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">Correo</span>
              <input
                type="email"
                name="correo"
                value={form.correo ?? ''}
                onChange={handleChange}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">Teléfono</span>
              <input
                type="text"
                name="telefono"
                maxLength={20}
                value={form.telefono ?? ''}
                onChange={handleChange}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </label>

            <label className="sm:col-span-2 block">
              <span className="text-sm font-medium text-slate-700">Dirección</span>
              <textarea
                name="direccion"
                rows={2}
                value={form.direccion ?? ''}
                onChange={handleChange}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </label>

            <div className="sm:col-span-2 rounded-lg bg-slate-50 border border-slate-200 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Plan de suscripción
                  </span>
                  <p className="mt-0.5 text-xs text-slate-600">
                    Plan institucional asignado a la entidad
                  </p>
                </div>
                <SubscriptionBadge />
              </div>
            </div>
          </div>

          {error && (
            <p className="mx-6 mb-4 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function CooperativasPage() {
  const [cooperativas, setCooperativas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [editando, setEditando] = useState(null)
  const [saving, setSaving] = useState(false)
  const [modalError, setModalError] = useState(null)
  const [accionEnCurso, setAccionEnCurso] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let activo = true
    cooperativasApi
      .listCooperativas()
      .then((data) => {
        if (!activo) return
        setCooperativas(data)
        setLoading(false)
      })
      .catch((err) => {
        if (!activo) return
        setError(
          err.response?.data?.detail ?? 'No se pudo cargar el listado de cooperativas',
        )
        setLoading(false)
      })
    return () => {
      activo = false
    }
  }, [reloadKey])

  const visibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()
    return cooperativas.filter((coop) => {
      const coincideTexto =
        !texto ||
        coop.nombre.toLowerCase().includes(texto) ||
        (coop.nit ?? '').toLowerCase().includes(texto)
      const coincideEstado = !filtroEstado || coop.estado === filtroEstado
      return coincideTexto && coincideEstado
    })
  }, [cooperativas, busqueda, filtroEstado])

  function abrirCrear() {
    setEditando(null)
    setModalError(null)
    setModalAbierto(true)
  }

  function abrirEditar(coop) {
    setEditando({
      id: coop.id,
      nombre: coop.nombre,
      razon_social: coop.razon_social ?? '',
      nit: coop.nit ?? '',
      correo: coop.correo ?? '',
      telefono: coop.telefono ?? '',
      direccion: coop.direccion ?? '',
    })
    setModalError(null)
    setModalAbierto(true)
  }

  async function guardar(form) {
    setSaving(true)
    setModalError(null)
    try {
      if (editando?.id) {
        await cooperativasApi.updateCooperativa(editando.id, form)
      } else {
        await cooperativasApi.createCooperativa(form)
      }
      setModalAbierto(false)
      setReloadKey((k) => k + 1)
    } catch (err) {
      setModalError(err.response?.data?.detail ?? 'No se pudo guardar la cooperativa')
    } finally {
      setSaving(false)
    }
  }

  async function alternarEstado(coop) {
    const accion = coop.estado === 'ACTIVO' ? 'desactivar' : 'reactivar'
    if (
      accion === 'desactivar' &&
      !window.confirm(`¿Desactivar la cooperativa "${coop.nombre}"? Sus datos no se eliminan.`)
    ) {
      return
    }
    setAccionEnCurso(coop.id)
    setError(null)
    try {
      if (accion === 'desactivar') {
        await cooperativasApi.deactivateCooperativa(coop.id)
      } else {
        await cooperativasApi.reactivateCooperativa(coop.id)
      }
      setReloadKey((k) => k + 1)
    } catch (err) {
      setError(err.response?.data?.detail ?? `No se pudo ${accion} la cooperativa`)
    } finally {
      setAccionEnCurso(null)
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cooperativas</h1>
          <p className="mt-1 text-sm text-slate-500">
            Gestión de tenants de la plataforma SI2.
          </p>
        </div>
        <button
          type="button"
          onClick={abrirCrear}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          + Nueva cooperativa
        </button>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <input
          type="search"
          placeholder="Buscar por nombre o NIT…"
          value={busqueda}
          onChange={(event) => setBusqueda(event.target.value)}
          className="w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
        <select
          value={filtroEstado}
          onChange={(event) => setFiltroEstado(event.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        >
          <option value="">Todos los estados</option>
          {ESTADOS.map((estado) => (
            <option key={estado} value={estado}>
              {estado}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</p>
      )}

      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
        {loading ? (
          <p className="px-6 py-10 text-center text-sm text-slate-500">Cargando…</p>
        ) : visibles.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-slate-500">
            No hay cooperativas que coincidan con los filtros.
          </p>
        ) : (
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-6 py-3">Nombre</th>
                <th className="px-6 py-3">NIT</th>
                <th className="px-6 py-3">Correo</th>
                <th className="px-6 py-3">Plan</th>
                <th className="px-6 py-3">Estado</th>
                <th className="px-6 py-3">Creada</th>
                <th className="px-6 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibles.map((coop) => (
                <tr key={coop.id} className="hover:bg-slate-50">
                  <td className="px-6 py-3.5">
                    <p className="font-medium text-slate-900">{coop.nombre}</p>
                    {coop.razon_social && (
                      <p className="text-xs text-slate-500">{coop.razon_social}</p>
                    )}
                  </td>
                  <td className="px-6 py-3.5 text-slate-700">{coop.nit || '—'}</td>
                  <td className="px-6 py-3.5 text-slate-700">{coop.correo || '—'}</td>
                  <td className="px-6 py-3.5">
                    <SubscriptionBadge />
                  </td>
                  <td className="px-6 py-3.5">
                    <EstadoBadge estado={coop.estado} />
                  </td>
                  <td className="px-6 py-3.5 text-slate-700">
                    {formatDate(coop.fecha_creacion)}
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => abrirEditar(coop)}
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => alternarEstado(coop)}
                        disabled={accionEnCurso === coop.id}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                          coop.estado === 'ACTIVO'
                            ? 'border border-red-200 text-red-600 hover:bg-red-50'
                            : 'border border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                        } disabled:cursor-not-allowed disabled:opacity-60`}
                      >
                        {coop.estado === 'ACTIVO' ? 'Desactivar' : 'Reactivar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalAbierto && (
        <CooperativaModal
          inicial={editando}
          saving={saving}
          error={modalError}
          onClose={() => setModalAbierto(false)}
          onSubmit={guardar}
        />
      )}
    </div>
  )
}
