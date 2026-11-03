import { useCallback, useEffect, useRef, useState } from 'react'
import PageHeader from '../../../components/ui/PageHeader'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import Modal from '../../../components/ui/Modal'
import AlertBanner from '../../../components/ui/AlertBanner'
import { selectUser, useAuthStore } from '../../../core/store/authStore'
import { getApiErrorMessage } from '../../../core/api/errors'
import {
  buscarSocios,
  enviarNotificacion,
  getHistorialNotificaciones,
  getSegmentos,
} from '../../../core/api/notificacionesApi'
import {
  DESTINOS_NOTIFICACION,
  PLANTILLAS,
  TIPOS_NOTIFICACION,
  VARIABLES,
  contarDestinatarios,
  esPlantilla,
  fechaRelativa,
  insertToken,
  nombreSocio,
  porcentajeLeidas,
  renderPreview,
} from '../notificacionesUtils'

const INPUT =
  'w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-[#006c49] focus:ring-2 focus:ring-emerald-100'

function OptionCard({ selected, onClick, icon, title, detail, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={`flex w-full items-start gap-2.5 rounded-xl border p-3 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
        selected
          ? 'border-[#064e3b] bg-emerald-50/70 ring-1 ring-[#064e3b]'
          : 'border-slate-200 bg-white hover:border-emerald-300'
      }`}
    >
      <span className={`material-symbols-outlined text-[20px] ${selected ? 'text-[#064e3b]' : 'text-slate-400'}`}>
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-[#0b1c30]">{title}</span>
        {detail && <span className="block text-xs text-slate-500">{detail}</span>}
      </span>
    </button>
  )
}

function SocioSearch({ selected, onChange }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setResults([])
      return undefined
    }
    let active = true
    setLoading(true)
    const timer = setTimeout(async () => {
      try {
        const rows = await buscarSocios(q)
        if (active) setResults(rows)
      } catch {
        if (active) setResults([])
      } finally {
        if (active) setLoading(false)
      }
    }, 300)
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [query])

  const selectedIds = new Set(selected.map((s) => s.id))

  return (
    <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
      <div className="relative">
        <span className="material-symbols-outlined pointer-events-none absolute left-2.5 top-2 text-[18px] text-slate-400">
          search
        </span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar socio por nombre, apellido o C.I."
          aria-label="Buscar socio"
          className={`${INPUT} h-9 pl-8`}
        />
      </div>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((socio) => (
            <span
              key={socio.id}
              className="inline-flex items-center gap-1 rounded-full bg-[#064e3b] py-0.5 pl-2.5 pr-1 text-xs font-medium text-white"
            >
              {nombreSocio(socio)}
              <button
                type="button"
                onClick={() => onChange(selected.filter((s) => s.id !== socio.id))}
                aria-label={`Quitar a ${nombreSocio(socio)}`}
                className="grid h-4 w-4 place-items-center rounded-full hover:bg-white/20"
              >
                <span className="material-symbols-outlined text-[14px]">close</span>
              </button>
            </span>
          ))}
        </div>
      )}

      {loading && <p className="text-xs text-slate-500">Buscando…</p>}
      {!loading && query.trim().length >= 2 && results.length === 0 && (
        <p className="text-xs text-slate-500">No se encontraron socios.</p>
      )}
      {results.length > 0 && (
        <ul className="max-h-48 divide-y divide-slate-100 overflow-y-auto rounded-lg border border-slate-200 bg-white">
          {results.map((socio) => {
            const picked = selectedIds.has(socio.id)
            return (
              <li key={socio.id}>
                <button
                  type="button"
                  disabled={!socio.tiene_cuenta}
                  onClick={() =>
                    onChange(picked ? selected.filter((s) => s.id !== socio.id) : [...selected, socio])
                  }
                  className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-emerald-50/60 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent"
                >
                  <span>
                    <span className="font-medium text-[#0b1c30]">{nombreSocio(socio)}</span>
                    <span className="ml-2 text-xs text-slate-500">C.I. {socio.ci}</span>
                  </span>
                  {socio.tiene_cuenta ? (
                    <span className={`material-symbols-outlined text-[18px] ${picked ? 'text-[#064e3b]' : 'text-slate-300'}`}>
                      {picked ? 'check_circle' : 'add_circle'}
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400">Sin cuenta web</span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export default function GestionarNotificacionesPage() {
  const user = useAuthStore(selectUser)
  const cooperativa = user?.cooperativa?.nombre

  const [tipo, setTipo] = useState('RECORDATORIO_PAGO')
  const [destino, setDestino] = useState('CUOTAS_POR_VENCER')
  const [dias, setDias] = useState(7)
  const [seleccionados, setSeleccionados] = useState([])
  const [titulo, setTitulo] = useState(PLANTILLAS.RECORDATORIO_PAGO.titulo)
  const [mensaje, setMensaje] = useState(PLANTILLAS.RECORDATORIO_PAGO.mensaje)
  const [segmentos, setSegmentos] = useState(null)
  const [historial, setHistorial] = useState([])
  const [loadingHistorial, setLoadingHistorial] = useState(true)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const mensajeRef = useRef(null)

  useEffect(() => {
    let active = true
    getSegmentos(dias)
      .then((data) => active && setSegmentos(data.segmentos))
      .catch((err) => active && setError(getApiErrorMessage(err, 'No se pudieron cargar los destinatarios.')))
    return () => {
      active = false
    }
  }, [dias])

  const loadHistorial = useCallback(async () => {
    setLoadingHistorial(true)
    try {
      setHistorial(await getHistorialNotificaciones())
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo cargar el historial.'))
    } finally {
      setLoadingHistorial(false)
    }
  }, [])

  useEffect(() => {
    loadHistorial()
  }, [loadHistorial])

  function handleTipo(nuevo) {
    setTipo(nuevo)
    // Only replace the text while it is still an untouched template.
    if (esPlantilla(titulo, mensaje)) {
      setTitulo(PLANTILLAS[nuevo].titulo)
      setMensaje(PLANTILLAS[nuevo].mensaje)
    }
  }

  function handleInsert(token) {
    const el = mensajeRef.current
    const { text, caret } = insertToken(mensaje, el?.selectionStart, el?.selectionEnd, token)
    setMensaje(text)
    requestAnimationFrame(() => {
      el?.focus()
      el?.setSelectionRange(caret, caret)
    })
  }

  const total = contarDestinatarios(destino, segmentos, seleccionados)
  const sinCuenta = destino === 'SOCIO' ? 0 : segmentos?.[destino]?.sin_cuenta ?? 0
  const usaDatosCuota = /\{(monto_cuota|fecha_cuota)\}/.test(mensaje)
  const valido = titulo.trim().length >= 3 && mensaje.trim().length >= 3 && total > 0

  async function handleSend() {
    setSending(true)
    setError(null)
    try {
      const result = await enviarNotificacion({
        tipo,
        titulo: titulo.trim(),
        mensaje: mensaje.trim(),
        destino,
        socio_ids: destino === 'SOCIO' ? seleccionados.filter((s) => s.tiene_cuenta).map((s) => s.id) : [],
        dias,
      })
      setSuccess(
        `Notificación enviada a ${result.total_destinatarios} socio(s)` +
          (result.omitidos_sin_cuenta ? ` · ${result.omitidos_sin_cuenta} sin cuenta web no la recibirán.` : '.'),
      )
      setConfirmOpen(false)
      setSeleccionados([])
      setTitulo(PLANTILLAS[tipo].titulo)
      setMensaje(PLANTILLAS[tipo].mensaje)
      loadHistorial()
    } catch (err) {
      setConfirmOpen(false)
      setError(getApiErrorMessage(err, 'No se pudo enviar la notificación.'))
    } finally {
      setSending(false)
    }
  }

  function destinoDetalle(key) {
    if (key === 'SOCIO') return 'Elige uno o varios socios'
    const seg = segmentos?.[key]
    if (!seg) return 'Cargando…'
    return `${seg.destinatarios} socio(s)${seg.sin_cuenta ? ` · ${seg.sin_cuenta} sin cuenta web` : ''}`
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Gestionar notificaciones"
        subtitle="Envía recordatorios de pago, promociones y avisos a los socios de tu cooperativa. Los reciben en su bandeja web."
      />

      {error && (
        <AlertBanner variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </AlertBanner>
      )}
      {success && (
        <AlertBanner variant="success" dismissible onDismiss={() => setSuccess(null)}>
          {success}
        </AlertBanner>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        {/* Redactar */}
        <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-card xl:col-span-3">
          <div>
            <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">1. Tipo de notificación</h2>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {Object.entries(TIPOS_NOTIFICACION).map(([key, meta]) => (
                <OptionCard
                  key={key}
                  selected={tipo === key}
                  onClick={() => handleTipo(key)}
                  icon={meta.icon}
                  title={meta.label}
                />
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">2. ¿A quién se envía?</h2>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {Object.entries(DESTINOS_NOTIFICACION).map(([key, meta]) => (
                <OptionCard
                  key={key}
                  selected={destino === key}
                  onClick={() => setDestino(key)}
                  icon={meta.icon}
                  title={meta.label}
                  detail={destinoDetalle(key)}
                />
              ))}
            </div>

            {destino === 'CUOTAS_POR_VENCER' && (
              <label className="mt-2 flex items-center gap-2 text-xs text-slate-600">
                Cuotas que vencen en los próximos
                <select
                  value={dias}
                  onChange={(e) => setDias(Number(e.target.value))}
                  className="h-8 rounded-lg border border-slate-300 px-2 text-xs outline-none focus:border-[#006c49]"
                >
                  {[3, 7, 15, 30].map((d) => (
                    <option key={d} value={d}>
                      {d} días
                    </option>
                  ))}
                </select>
              </label>
            )}
            {destino === 'SOCIO' && (
              <div className="mt-2">
                <SocioSearch selected={seleccionados} onChange={setSeleccionados} />
              </div>
            )}
          </div>

          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500">3. Mensaje</h2>
            <div>
              <label htmlFor="notif_titulo" className="mb-1 block text-xs font-semibold text-slate-700">
                Título
              </label>
              <input
                id="notif_titulo"
                type="text"
                value={titulo}
                maxLength={120}
                onChange={(e) => setTitulo(e.target.value)}
                className={`${INPUT} h-10`}
              />
            </div>
            <div>
              <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                <label htmlFor="notif_mensaje" className="text-xs font-semibold text-slate-700">
                  Mensaje
                </label>
                <span className="text-[11px] text-slate-400">{mensaje.length}/2000</span>
              </div>
              <textarea
                id="notif_mensaje"
                ref={mensajeRef}
                rows={5}
                value={mensaje}
                maxLength={2000}
                onChange={(e) => setMensaje(e.target.value)}
                className={`${INPUT} py-2 leading-relaxed`}
              />
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-slate-500">Insertar dato del socio:</span>
                {VARIABLES.map((v) => (
                  <button
                    key={v.token}
                    type="button"
                    onClick={() => handleInsert(v.token)}
                    className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-[11px] text-slate-600 transition hover:border-emerald-300 hover:text-[#064e3b]"
                    title={v.label}
                  >
                    {v.token}
                  </button>
                ))}
              </div>
              {usaDatosCuota && (destino === 'SOCIO' || destino === 'TODOS') && (
                <p className="mt-1.5 flex items-start gap-1 text-[11px] text-amber-700">
                  <span className="material-symbols-outlined text-[14px]">info</span>
                  Los socios sin cuotas pendientes verán «—» en el monto y la fecha. Para recordatorios de pago
                  conviene elegir «Con cuotas por vencer» o «Con cuotas vencidas».
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <p className="text-sm text-slate-600">
              Llegará a <strong className="text-[#0b1c30]">{total}</strong> socio(s)
              {sinCuenta > 0 && <span className="text-xs text-slate-400"> · {sinCuenta} sin cuenta web</span>}
            </p>
            <Button type="button" onClick={() => setConfirmOpen(true)} disabled={!valido} className="gap-1.5">
              <span className="material-symbols-outlined text-[18px]">send</span>
              Enviar notificación
            </Button>
          </div>
        </section>

        {/* Vista previa */}
        <aside className="space-y-2 xl:col-span-2">
          <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500">Vista previa del socio</h2>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex gap-3 rounded-xl border border-emerald-200 bg-white p-4 shadow-sm">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald-50 text-[#064e3b]">
                <span className="material-symbols-outlined">{TIPOS_NOTIFICACION[tipo].icon}</span>
              </span>
              <div className="min-w-0">
                <div className="mb-0.5 flex flex-wrap items-center gap-2">
                  <p className="font-bold text-[#0b1c30]">{titulo || 'Título de la notificación'}</p>
                  <Badge variant={TIPOS_NOTIFICACION[tipo].badge}>{TIPOS_NOTIFICACION[tipo].label}</Badge>
                </div>
                <p className="whitespace-pre-line break-words text-sm text-slate-600">
                  {renderPreview(mensaje, cooperativa) || 'El mensaje aparecerá aquí.'}
                </p>
                <p className="mt-2 text-[11px] text-slate-400">ahora</p>
              </div>
            </div>
            <p className="mt-2 text-[11px] text-slate-500">
              Ejemplo con datos ficticios: cada socio verá su propio nombre, monto y fecha de cuota.
            </p>
          </div>
        </aside>
      </div>

      {/* Historial */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-card">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <h2 className="text-sm font-bold text-[#0b1c30]">Notificaciones enviadas</h2>
          <Button type="button" variant="ghost" size="sm" onClick={loadHistorial} title="Actualizar">
            <span className="material-symbols-outlined text-[18px]">refresh</span>
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-2 font-semibold">Fecha</th>
                <th className="px-3 py-2 font-semibold">Tipo</th>
                <th className="px-3 py-2 font-semibold">Título</th>
                <th className="px-3 py-2 font-semibold">Destinatarios</th>
                <th className="px-3 py-2 font-semibold">Leídas</th>
                <th className="px-5 py-2 font-semibold">Enviado por</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loadingHistorial && (
                <tr>
                  <td colSpan={6} className="px-5 py-6 text-center text-xs text-slate-500">
                    Cargando…
                  </td>
                </tr>
              )}
              {!loadingHistorial && historial.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-xs text-slate-500">
                    Todavía no se enviaron notificaciones.
                  </td>
                </tr>
              )}
              {!loadingHistorial &&
                historial.map((n) => {
                  const pct = porcentajeLeidas(n.leidas, n.total_destinatarios)
                  return (
                    <tr key={n.id} className="align-top">
                      <td className="whitespace-nowrap px-5 py-3 text-xs text-slate-500" title={new Date(n.fecha_creacion).toLocaleString('es-BO')}>
                        {fechaRelativa(n.fecha_creacion)}
                      </td>
                      <td className="px-3 py-3">
                        <Badge variant={TIPOS_NOTIFICACION[n.tipo]?.badge}>{TIPOS_NOTIFICACION[n.tipo]?.label ?? n.tipo}</Badge>
                      </td>
                      <td className="max-w-xs px-3 py-3">
                        <p className="font-medium text-[#0b1c30]">{n.titulo}</p>
                        <p className="line-clamp-1 text-xs text-slate-500" title={n.mensaje}>{n.mensaje}</p>
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-600">
                        <p className="font-semibold text-[#0b1c30]">{n.total_destinatarios}</p>
                        <p>{DESTINOS_NOTIFICACION[n.destino]?.label ?? n.destino}</p>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                            <div className="h-full rounded-full bg-[#10b981]" style={{ width: `${pct}%` }} />
                          </div>
                          {n.leidas}/{n.total_destinatarios}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-600">{n.enviado_por}</td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      </section>

      <Modal
        open={confirmOpen}
        onClose={() => !sending && setConfirmOpen(false)}
        title="Confirmar envío"
        subtitle="Esta acción no se puede deshacer."
        footer={
          <>
            <Button type="button" variant="secondary" size="sm" onClick={() => setConfirmOpen(false)} disabled={sending}>
              Cancelar
            </Button>
            <Button type="button" size="sm" loading={sending} onClick={handleSend}>
              Enviar a {total} socio(s)
            </Button>
          </>
        }
      >
        <div className="space-y-2 text-sm text-slate-600">
          <p>
            Vas a enviar <strong className="text-[#0b1c30]">«{titulo.trim()}»</strong> (
            {TIPOS_NOTIFICACION[tipo].label.toLowerCase()}) a{' '}
            <strong className="text-[#0b1c30]">{total} socio(s)</strong>:{' '}
            {destino === 'SOCIO'
              ? seleccionados.filter((s) => s.tiene_cuenta).map(nombreSocio).join(', ')
              : DESTINOS_NOTIFICACION[destino].label.toLowerCase()}
            .
          </p>
        </div>
      </Modal>
    </div>
  )
}
