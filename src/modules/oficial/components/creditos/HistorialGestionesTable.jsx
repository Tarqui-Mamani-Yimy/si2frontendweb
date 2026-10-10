import { useState, useEffect } from 'react'
import Badge from '../../../../components/ui/Badge'
import Skeleton from '../../../../components/ui/Skeleton'
import AlertBanner from '../../../../components/ui/AlertBanner'
import { listarGestionesCredito } from '../../../../core/api/creditosApi'

function formatDate(isoStr) {
  if (!isoStr) return '—'
  const d = new Date(isoStr)
  if (isNaN(d.getTime())) return isoStr
  return d.toLocaleDateString('es-BO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function formatDateTime(isoStr) {
  if (!isoStr) return '—'
  const d = new Date(isoStr)
  if (isNaN(d.getTime())) return isoStr
  return d.toLocaleString('es-BO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getTipoContactoBadgeVariant(tipo) {
  switch (tipo) {
    case 'LLAMADA':
      return 'navy'
    case 'VISITA':
      return 'green'
    case 'MENSAJE':
      return 'indigo'
    case 'OTRO':
      return 'slate'
    default:
      return 'slate'
  }
}

/**
 * HistorialGestionesTable — Historial de acciones de cobranza realizadas sobre un crédito (CU-W28).
 *
 * @param {{ creditoId: number|string }} props
 */
export default function HistorialGestionesTable({ creditoId }) {
  const [gestiones, setGestiones] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!creditoId) return
    let isMounted = true

    listarGestionesCredito(creditoId)
      .then((data) => {
        if (!isMounted) return
        setGestiones(Array.isArray(data) ? data : [])
      })
      .catch((err) => {
        if (!isMounted) return
        setError(
          err.response?.data?.detail ||
            'Error al cargar el historial de gestiones de cobranza.',
        )
      })
      .finally(() => {
        if (!isMounted) return
        setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [creditoId])

  if (loading) {
    return (
      <div className="space-y-2 p-3">
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <AlertBanner variant="error" dismissible onDismiss={() => setError(null)}>
        {error}
      </AlertBanner>
    )
  }

  if (gestiones.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400 bg-slate-50/60 rounded-xl border border-slate-200 space-y-1">
        <span className="material-symbols-outlined text-[32px] text-slate-300 block mb-1">
          support_agent
        </span>
        <span className="font-semibold text-slate-600 block text-xs">
          No hay gestiones de cobranza registradas
        </span>
        <span className="text-[11px] text-slate-400 block">
          Aún no se han registrado acciones ni contactos de cobro para este crédito.
        </span>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase font-bold text-slate-500">
            <th className="py-2.5 px-3">Fecha y Hora</th>
            <th className="py-2.5 px-3">Contacto</th>
            <th className="py-2.5 px-3">Gestor / Oficial</th>
            <th className="py-2.5 px-3">Resultado de la Gestión</th>
            <th className="py-2.5 px-3 text-center">Compromiso de Pago</th>
            <th className="py-2.5 px-3 text-center">Alerta</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-[11px]">
          {gestiones.map((g) => {
            const usuarioNombre = g.usuario?.nombre || 'Sistema'
            return (
              <tr key={g.id || g.fecha} className="hover:bg-slate-50/70 transition-colors">
                <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">
                  {formatDateTime(g.fecha)}
                </td>
                <td className="py-2.5 px-3">
                  <Badge variant={getTipoContactoBadgeVariant(g.tipo_contacto)}>
                    {g.tipo_contacto}
                  </Badge>
                </td>
                <td className="py-2.5 px-3 font-semibold text-slate-800">
                  {usuarioNombre}
                </td>
                <td className="py-2.5 px-3 text-slate-700 max-w-xs">
                  {g.resultado_gestion}
                </td>
                <td className="py-2.5 px-3 text-center whitespace-nowrap">
                  {g.fecha_compromiso_pago ? (
                    <span className="inline-flex items-center gap-1 font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60 text-[10px]">
                      <span className="material-symbols-outlined text-[12px]">event_available</span>
                      <span>{formatDate(g.fecha_compromiso_pago)}</span>
                    </span>
                  ) : (
                    <span className="text-slate-400 text-[10px]">—</span>
                  )}
                </td>
                <td className="py-2.5 px-3 text-center font-mono text-[10px] text-slate-500">
                  {g.alerta_id ? `#${g.alerta_id}` : '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
