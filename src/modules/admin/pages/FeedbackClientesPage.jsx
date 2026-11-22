import { useCallback, useEffect, useState } from 'react'
import PageHeader from '../../../components/ui/PageHeader'
import MetricCard from '../../../components/ui/MetricCard'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import AlertBanner from '../../../components/ui/AlertBanner'
import DataTable from '../../../components/ui/DataTable'
import { getApiErrorMessage } from '../../../core/api/errors'
import {
  SERVICIOS_FEEDBACK,
  CANALES_FEEDBACK,
  getFeedbackEstadisticas,
  getFeedbackList,
} from '../../../core/api/feedbackApi'

const SERVICE_LABELS = {
  CREDITO: 'Crédito',
  AHORRO: 'Ahorro',
  CAJA: 'Caja y Ventanilla',
  ATENCION: 'Atención al Cliente',
  APP_MOVIL: 'Banca Móvil',
  OTRO: 'Otro',
}

const STAR_COLORS = {
  5: '#10b981', // Emerald
  4: '#34d399', // Light emerald
  3: '#f59e0b', // Amber
  2: '#f97316', // Orange
  1: '#ef4444', // Red
}

function formatDate(isoString) {
  if (!isoString) return '—'
  try {
    const d = new Date(isoString)
    return d.toLocaleDateString('es-BO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return isoString
  }
}

export default function FeedbackClientesPage() {
  const [servicio, setServicio] = useState('')
  const [calificacion, setCalificacion] = useState('')
  const [canal, setCanal] = useState('')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')

  const [stats, setStats] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadData = useCallback(async (filtros = {}) => {
    setLoading(true)
    setError(null)

    try {
      const [statsData, listData] = await Promise.all([
        getFeedbackEstadisticas(filtros),
        getFeedbackList(filtros),
      ])
      setStats(statsData)
      setItems(Array.isArray(listData) ? listData : [])
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          'No se pudieron cargar los datos de feedback y satisfacción.',
        ),
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData({
      servicio: servicio || undefined,
      calificacion: calificacion ? Number(calificacion) : undefined,
      canal: canal || undefined,
      desde: desde || undefined,
      hasta: hasta || undefined,
    })
  }, [loadData, servicio, calificacion, canal, desde, hasta])

  function handleFilterSubmit(e) {
    e.preventDefault()
    loadData({
      servicio: servicio || undefined,
      calificacion: calificacion ? Number(calificacion) : undefined,
      canal: canal || undefined,
      desde: desde || undefined,
      hasta: hasta || undefined,
    })
  }

  function handleResetFilters() {
    setServicio('')
    setCalificacion('')
    setCanal('')
    setDesde('')
    setHasta('')
  }

  // Prepara columnas para el DataTable
  const columns = [
    { key: 'fechaFormatted', label: 'Fecha' },
    { key: 'socio', label: 'Socio' },
    { key: 'servicioBadge', label: 'Servicio' },
    { key: 'calificacionDisplay', label: 'Calificación' },
    { key: 'recomendariaDisplay', label: 'Recomendación (NPS)' },
    { key: 'canalBadge', label: 'Canal' },
    { key: 'comentarioDisplay', label: 'Comentario' },
  ]

  const rows = items.map((row) => ({
    id: row.id,
    fechaFormatted: (
      <span className="text-xs text-slate-500 font-mono">
        {formatDate(row.fecha)}
      </span>
    ),
    socio: (
      <span className="font-semibold text-xs text-slate-800">
        {row.socio || `Socio #${row.socio_id}`}
      </span>
    ),
    servicioBadge: (
      <Badge variant="navy">
        {SERVICE_LABELS[row.servicio] || row.servicio}
      </Badge>
    ),
    calificacionDisplay: (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`material-symbols-outlined text-[16px] ${
              star <= row.calificacion ? 'text-amber-400' : 'text-slate-200'
            }`}
            style={{
              fontVariationSettings:
                star <= row.calificacion ? "'FILL' 1" : "'FILL' 0",
            }}
          >
            star
          </span>
        ))}
        <span className="ml-1 text-xs font-bold text-slate-700 font-mono">
          {row.calificacion}/5
        </span>
      </div>
    ),
    recomendariaDisplay:
      row.recomendaria !== null && row.recomendaria !== undefined ? (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold font-mono ${
            row.recomendaria >= 9
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : row.recomendaria >= 7
              ? 'bg-amber-50 text-amber-700 border border-amber-200'
              : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}
        >
          {row.recomendaria}/10
        </span>
      ) : (
        <span className="text-slate-400 text-xs">—</span>
      ),
    canalBadge: (
      <Badge variant={row.canal === 'MOVIL' ? 'teal' : 'slate'}>
        {row.canal}
      </Badge>
    ),
    comentarioDisplay: row.comentario ? (
      <span className="text-xs text-slate-700 line-clamp-2 max-w-xs" title={row.comentario}>
        {row.comentario}
      </span>
    ) : (
      <span className="text-slate-300 italic text-xs">Sin comentario</span>
    ),
  }))

  const nps = stats?.nps
  const totalAnswers = stats?.total ?? 0

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <PageHeader
        title="Feedback de clientes"
        subtitle="Monitoreo de satisfacción, Net Promoter Score (NPS) y opiniones de los socios."
      />

      {error && (
        <AlertBanner variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </AlertBanner>
      )}

      {/* Barra de Filtros */}
      <Card className="p-4 sm:p-5">
        <form onSubmit={handleFilterSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Filtro Servicio */}
            <div className="space-y-1">
              <label
                htmlFor="filtro-servicio"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-600"
              >
                Servicio
              </label>
              <select
                id="filtro-servicio"
                value={servicio}
                onChange={(e) => setServicio(e.target.value)}
                className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50/60 px-3 text-xs text-slate-800 outline-none focus:border-[#006c49] focus:bg-white"
              >
                <option value="">Todos los servicios</option>
                {SERVICIOS_FEEDBACK.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro Calificación */}
            <div className="space-y-1">
              <label
                htmlFor="filtro-calificacion"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-600"
              >
                Calificación
              </label>
              <select
                id="filtro-calificacion"
                value={calificacion}
                onChange={(e) => setCalificacion(e.target.value)}
                className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50/60 px-3 text-xs text-slate-800 outline-none focus:border-[#006c49] focus:bg-white"
              >
                <option value="">Todas las calificaciones</option>
                <option value="5">⭐⭐⭐⭐⭐ (5 estrellas)</option>
                <option value="4">⭐⭐⭐⭐ (4 estrellas)</option>
                <option value="3">⭐⭐⭐ (3 estrellas)</option>
                <option value="2">⭐⭐ (2 estrellas)</option>
                <option value="1">⭐ (1 estrella)</option>
              </select>
            </div>

            {/* Filtro Canal */}
            <div className="space-y-1">
              <label
                htmlFor="filtro-canal"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-600"
              >
                Canal
              </label>
              <select
                id="filtro-canal"
                value={canal}
                onChange={(e) => setCanal(e.target.value)}
                className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50/60 px-3 text-xs text-slate-800 outline-none focus:border-[#006c49] focus:bg-white"
              >
                {CANALES_FEEDBACK.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro Desde */}
            <div className="space-y-1">
              <label
                htmlFor="filtro-desde"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-600"
              >
                Desde
              </label>
              <input
                id="filtro-desde"
                type="date"
                value={desde}
                onChange={(e) => setDesde(e.target.value)}
                className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50/60 px-3 text-xs text-slate-800 outline-none focus:border-[#006c49] focus:bg-white"
              />
            </div>

            {/* Filtro Hasta */}
            <div className="space-y-1">
              <label
                htmlFor="filtro-hasta"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-600"
              >
                Hasta
              </label>
              <input
                id="filtro-hasta"
                type="date"
                value={hasta}
                onChange={(e) => setHasta(e.target.value)}
                className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50/60 px-3 text-xs text-slate-800 outline-none focus:border-[#006c49] focus:bg-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-slate-100">
            <span className="text-xs text-slate-400">
              {loading ? 'Cargando datos...' : `${items.length} resultados encontrados`}
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="text-xs"
              >
                Limpiar filtros
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                loading={loading}
                className="gap-1.5 text-xs"
              >
                <span className="material-symbols-outlined text-[16px]">filter_alt</span>
                Aplicar filtros
              </Button>
            </div>
          </div>
        </form>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          label="Total Calificaciones"
          value={stats?.total ?? 0}
          subtitle="Opiniones registradas en el período"
          icon="reviews"
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />

        <MetricCard
          label="Calificación Promedio"
          value={
            stats?.promedio !== null && stats?.promedio !== undefined
              ? `${stats.promedio.toFixed(1)} / 5.0`
              : '—'
          }
          subtitle={
            stats?.promedio ? (
              <span className="inline-flex items-center gap-1 text-amber-500 font-semibold">
                <span className="material-symbols-outlined text-[14px]">star</span>
                Satisfacción general
              </span>
            ) : (
              'Sin evaluaciones'
            )
          }
          icon="star"
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />

        <MetricCard
          label="NPS Score"
          value={
            nps?.score !== null && nps?.score !== undefined
              ? `${nps.score > 0 ? '+' : ''}${nps.score}`
              : '—'
          }
          subtitle={
            nps?.respuestas ? (
              <span className="text-[11px] font-mono">
                {nps.promotores} prom / {nps.pasivos} pas / {nps.detractores} det
              </span>
            ) : (
              'Sin respuestas de recomendación'
            )
          }
          icon="sentiment_satisfied"
          iconBg={
            nps?.score && nps.score >= 50
              ? 'bg-emerald-50'
              : nps?.score && nps.score >= 0
              ? 'bg-amber-50'
              : 'bg-rose-50'
          }
          iconColor={
            nps?.score && nps.score >= 50
              ? 'text-emerald-700'
              : nps?.score && nps.score >= 0
              ? 'text-amber-700'
              : 'text-rose-700'
          }
        />
      </div>

      {/* Gráficos y Desgloses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Distribución 1-5 Estrellas */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-sm text-[#0b1c30]">
                Distribución de Calificaciones (1 a 5 Estrellas)
              </h3>
              <p className="text-xs text-slate-400">
                Frecuencia y proporción de cada puntuación
              </p>
            </div>
            <span className="material-symbols-outlined text-slate-400">bar_chart</span>
          </div>

          <div className="space-y-3 pt-1">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = stats?.distribucion?.[String(star)] ?? 0
              const percentage =
                totalAnswers > 0 ? Math.round((count / totalAnswers) * 100) : 0
              const barColor = STAR_COLORS[star]

              return (
                <div key={star} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                      <span className="w-4 font-mono">{star}</span>
                      <span className="material-symbols-outlined text-[15px] text-amber-400">
                        star
                      </span>
                    </div>
                    <div className="flex items-center gap-2 font-mono text-xs">
                      <span className="text-slate-500 font-semibold">{percentage}%</span>
                      <span className="text-slate-800 font-bold">({count})</span>
                    </div>
                  </div>

                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500 ease-out"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: barColor,
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Calificación por Servicio */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-sm text-[#0b1c30]">
                Satisfacción por Servicio
              </h3>
              <p className="text-xs text-slate-400">
                Puntuación promedio y volumen de respuestas
              </p>
            </div>
            <span className="material-symbols-outlined text-slate-400">category</span>
          </div>

          {stats?.por_servicio?.length ? (
            <div className="space-y-3 pt-1">
              {stats.por_servicio.map((s) => {
                const serviceLabel = SERVICE_LABELS[s.servicio] || s.servicio
                const avg = s.promedio ?? 0
                const width = Math.min(100, Math.round((avg / 5.0) * 100))

                return (
                  <div key={s.servicio} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800 truncate">
                          {serviceLabel}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          ({s.total} {s.total === 1 ? 'opinión' : 'opiniones'})
                        </span>
                      </div>
                      <div className="flex items-center gap-1 font-mono text-xs font-bold text-slate-800">
                        <span>{s.promedio !== null ? s.promedio.toFixed(1) : '—'}</span>
                        <span className="material-symbols-outlined text-[13px] text-amber-500">
                          star
                        </span>
                      </div>
                    </div>

                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#006c49] transition-all duration-500 ease-out"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 text-xs italic">
              Sin datos de servicio registrados
            </div>
          )}
        </Card>
      </div>

      {/* Tendencia Mensual */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-sm text-[#0b1c30]">
              Tendencia Mensual de Satisfacción
            </h3>
            <p className="text-xs text-slate-400">
              Evolución histórica del promedio de calificación mensual
            </p>
          </div>
          <span className="material-symbols-outlined text-slate-400">trending_up</span>
        </div>

        {stats?.tendencia_mensual?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase font-semibold">
                  <th className="py-2 px-3">Mes</th>
                  <th className="py-2 px-3">Total Evaluaciones</th>
                  <th className="py-2 px-3">Promedio</th>
                  <th className="py-2 px-3">Evolución</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.tendencia_mensual.map((m) => {
                  const score = m.promedio ?? 0
                  const width = Math.min(100, Math.round((score / 5.0) * 100))

                  return (
                    <tr key={m.mes} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-700">
                        {m.mes}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">
                        {m.total}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                        {m.promedio !== null ? `${m.promedio.toFixed(1)} / 5.0` : '—'}
                      </td>
                      <td className="py-2.5 px-3 w-48">
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-600 rounded-full"
                            style={{ width: `${width}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400 text-xs italic">
            Sin tendencia mensual registrada
          </div>
        )}
      </Card>

      {/* Tabla Detallada de Feedback */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-[#0b1c30]">
              Detalle de Feedback y Comentarios
            </h3>
            <p className="text-xs text-slate-500">
              Listado completo de opiniones recibidas con sus filtros aplicados.
            </p>
          </div>
        </div>

        <DataTable
          columns={columns}
          rows={rows}
          emptyMessage="No se encontraron registros de feedback para los filtros seleccionados."
        />
      </div>
    </div>
  )
}
