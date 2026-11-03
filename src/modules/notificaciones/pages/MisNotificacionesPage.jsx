import { useCallback, useEffect, useState } from 'react'
import PageHeader from '../../../components/ui/PageHeader'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import AlertBanner from '../../../components/ui/AlertBanner'
import { getApiErrorMessage } from '../../../core/api/errors'
import { getMisNotificaciones, marcarLeida, marcarTodasLeidas } from '../../../core/api/notificacionesApi'
import { TIPOS_NOTIFICACION, emitNotificacionesChanged, fechaRelativa } from '../notificacionesUtils'

const FILTROS = [
  { id: 'todas', label: 'Todas' },
  { id: 'no-leidas', label: 'No leídas' },
]

export default function MisNotificacionesPage() {
  const [items, setItems] = useState([])
  const [noLeidas, setNoLeidas] = useState(0)
  const [filtro, setFiltro] = useState('todas')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getMisNotificaciones()
      setItems(data.items)
      setNoLeidas(data.no_leidas)
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudieron cargar tus notificaciones.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function handleRead(item) {
    if (item.leida) return
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, leida: true } : i)))
    setNoLeidas((n) => Math.max(0, n - 1))
    try {
      await marcarLeida(item.id)
      emitNotificacionesChanged()
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo marcar como leída.'))
      load()
    }
  }

  async function handleReadAll() {
    try {
      await marcarTodasLeidas()
      setItems((prev) => prev.map((i) => ({ ...i, leida: true })))
      setNoLeidas(0)
      emitNotificacionesChanged()
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudieron marcar como leídas.'))
    }
  }

  const visibles = filtro === 'no-leidas' ? items.filter((i) => !i.leida) : items

  return (
    <div className="mx-auto max-w-3xl space-y-5 animate-fade-in">
      <PageHeader
        title="Mis notificaciones"
        subtitle="Recordatorios de pago, promociones y avisos de tu cooperativa."
        action={
          <Button type="button" variant="secondary" size="sm" onClick={handleReadAll} disabled={noLeidas === 0} className="gap-1.5">
            <span className="material-symbols-outlined text-[17px]">done_all</span>
            Marcar todas como leídas
          </Button>
        }
      />

      {error && (
        <AlertBanner variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </AlertBanner>
      )}

      <div className="flex gap-1 rounded-lg bg-slate-100 p-1 text-xs font-semibold w-fit">
        {FILTROS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFiltro(f.id)}
            className={`rounded-md px-3 py-1.5 transition ${
              filtro === f.id ? 'bg-white text-[#064e3b] shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {f.label}
            {f.id === 'no-leidas' && noLeidas > 0 && (
              <span className="ml-1.5 rounded-full bg-[#dc2626] px-1.5 py-0.5 text-[10px] text-white">{noLeidas}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-slate-500">Cargando…</p>
      ) : visibles.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-14 text-center">
          <span className="material-symbols-outlined text-[40px] text-slate-300">notifications_off</span>
          <p className="mt-2 text-sm text-slate-500">
            {filtro === 'no-leidas' ? 'No tienes notificaciones sin leer.' : 'Aún no tienes notificaciones.'}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {visibles.map((item) => {
            const meta = TIPOS_NOTIFICACION[item.tipo] ?? TIPOS_NOTIFICACION.AVISO
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => handleRead(item)}
                  className={`flex w-full gap-3 rounded-xl border p-4 text-left transition ${
                    item.leida
                      ? 'border-slate-200 bg-white'
                      : 'border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50'
                  }`}
                  aria-label={`${item.titulo}${item.leida ? '' : ' (no leída)'}`}
                >
                  <span
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${
                      item.leida ? 'bg-slate-100 text-slate-400' : 'bg-white text-[#064e3b] shadow-xs'
                    }`}
                  >
                    <span className="material-symbols-outlined">{meta.icon}</span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="mb-0.5 flex flex-wrap items-center gap-2">
                      <span className={`text-sm ${item.leida ? 'font-semibold text-slate-700' : 'font-bold text-[#0b1c30]'}`}>
                        {item.titulo}
                      </span>
                      <Badge variant={meta.badge}>{meta.label}</Badge>
                    </span>
                    <span className="block whitespace-pre-line break-words text-sm text-slate-600">{item.mensaje}</span>
                    <span className="mt-1.5 block text-[11px] text-slate-400">{fechaRelativa(item.fecha)}</span>
                  </span>
                  {!item.leida && <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-[#10b981]" aria-hidden="true" />}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
