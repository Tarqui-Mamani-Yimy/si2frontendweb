import { useState, useEffect } from 'react'
import Modal from '../../../components/ui/Modal'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import Skeleton from '../../../components/ui/Skeleton'
import AlertBanner from '../../../components/ui/AlertBanner'
import {
  formatMoney,
  formatDate,
  TIPO_COMPROBANTE_CONFIG,
  ESTADO_COMPROBANTE_CONFIG,
  ORIGEN_COMPROBANTE_CONFIG,
} from './contabilidadUtils'
import { getComprobante } from '../../../core/api/contabilidadApi'
import { getApiErrorMessage } from '../../../core/api/errors'

/**
 * ComprobanteDetailModal — Inspección detallada de asiento contable y enlaces de reversión (CU-W30).
 *
 * @param {{
 *   comprobanteId: number | string | null,
 *   open: boolean,
 *   onClose: () => void,
 *   onOpenAnular?: (comprobante: object) => void,
 *   onNavigateToVoucher?: (targetId: number|string) => void
 * }} props
 */
export default function ComprobanteDetailModal({
  comprobanteId,
  open,
  onClose,
  onOpenAnular,
  onNavigateToVoucher,
}) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!open || !comprobanteId) return
    let isMounted = true

    getComprobante(comprobanteId)
      .then((res) => {
        if (!isMounted) return
        setData(res)
      })
      .catch((err) => {
        if (!isMounted) return
        setError(
          getApiErrorMessage(
            err,
            'Error al cargar el detalle del comprobante contable.',
          ),
        )
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [open, comprobanteId])

  if (!open) return null

  const comp = data
  const sim = comp?.moneda?.simbolo || (Number(comp?.moneda_id) === 2 ? '$' : 'Bs.')
  const lines = Array.isArray(comp?.lineas)
    ? comp.lineas
    : Array.isArray(comp?.detalles)
      ? comp.detalles
      : []

  const tipoConfig = TIPO_COMPROBANTE_CONFIG[comp?.tipo] || {
    label: comp?.tipo,
    badgeVariant: 'slate',
  }
  const estadoConfig = ESTADO_COMPROBANTE_CONFIG[comp?.estado] || {
    label: comp?.estado,
    badgeVariant: 'slate',
  }
  const origenConfig = ORIGEN_COMPROBANTE_CONFIG[comp?.origen] || {
    label: comp?.origen,
    badgeVariant: 'slate',
  }

  const canAnular = comp?.estado === 'REGISTRADO' && comp?.origen === 'MANUAL'

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={comp ? `Comprobante ${comp.numero}` : 'Detalle de Comprobante'}
      subtitle="Asiento fiduciario y registro de partida doble (CU-W30)"
      footer={
        <div className="flex items-center justify-between w-full">
          <div>
            {canAnular && (
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={() => {
                  onClose()
                  onOpenAnular?.(comp)
                }}
                className="gap-1.5 !bg-red-600 hover:!bg-red-700"
              >
                <span className="material-symbols-outlined text-[15px]">block</span>
                <span>Anular Comprobante</span>
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => window.print()}
              className="gap-1.5"
            >
              <span className="material-symbols-outlined text-[15px]">print</span>
              <span>Imprimir</span>
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {error && <AlertBanner variant="error">{error}</AlertBanner>}

        {loading ? (
          <div className="space-y-3 p-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : comp ? (
          <div className="space-y-4 text-xs">
            {/* Header Cards */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/70 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base font-bold text-[#064e3b]">
                    {comp.numero}
                  </span>
                  <Badge variant={tipoConfig.badgeVariant}>{tipoConfig.label}</Badge>
                  <Badge variant={origenConfig.badgeVariant}>{origenConfig.label}</Badge>
                  <Badge variant={estadoConfig.badgeVariant}>{estadoConfig.label}</Badge>
                </div>

                <div className="text-slate-500 font-mono">
                  Fecha Contable: <strong>{formatDate(comp.fecha_contable)}</strong>
                </div>
              </div>

              {/* Glosa */}
              <div>
                <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider">
                  Glosa General:
                </span>
                <p className="text-slate-800 font-medium text-xs mt-0.5 leading-relaxed bg-white p-2.5 rounded-lg border border-slate-200">
                  {comp.glosa || 'Sin glosa general'}
                </p>
              </div>

              {/* Metadatos operativos */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px] text-slate-600">
                <div>
                  <span className="text-slate-400 block">Moneda:</span>
                  <span className="font-semibold text-slate-800">
                    {comp.moneda?.nombre || (Number(comp.moneda_id) === 2 ? 'Dólares (USD)' : 'Bolivianos (BOB)')}
                  </span>
                </div>

                {comp.gestion && (
                  <div>
                    <span className="text-slate-400 block">Gestión Fiscal:</span>
                    <span className="font-semibold text-slate-800 font-mono">
                      {comp.gestion}
                    </span>
                  </div>
                )}

                {comp.transaccion_id && (
                  <div>
                    <span className="text-slate-400 block">Transacción Origen:</span>
                    <span className="font-semibold text-slate-800 font-mono">
                      #{comp.transaccion_id}
                    </span>
                  </div>
                )}

                {comp.usuario && (
                  <div>
                    <span className="text-slate-400 block">Registrado por:</span>
                    <span className="font-semibold text-slate-800 truncate block">
                      {typeof comp.usuario === 'object'
                        ? comp.usuario.nombre_completo || comp.usuario.email
                        : comp.usuario}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Enlaces de Reversión */}
            {comp.comprobante_reversion_id && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-950 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-red-600 text-[18px]">
                    history
                  </span>
                  <div>
                    <span className="font-bold block">
                      Comprobante Anulado mediante Reversión
                    </span>
                    {comp.motivo_anulacion && (
                      <span className="text-[11px] text-red-800 block">
                        Motivo: "{comp.motivo_anulacion}"
                      </span>
                    )}
                  </div>
                </div>

                {onNavigateToVoucher && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => onNavigateToVoucher(comp.comprobante_reversion_id)}
                    className="shrink-0 text-xs gap-1"
                  >
                    <span>Ver Reversión</span>
                    <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </Button>
                )}
              </div>
            )}

            {comp.revierte_a_id && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-950 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-600 text-[18px]">
                    sync_problem
                  </span>
                  <div>
                    <span className="font-bold block">
                      Este comprobante es una reversión contable
                    </span>
                    <span className="text-[11px] text-amber-800 block">
                      Revierte al comprobante original #{comp.revierte_a_id}
                    </span>
                  </div>
                </div>

                {onNavigateToVoucher && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => onNavigateToVoucher(comp.revierte_a_id)}
                    className="shrink-0 text-xs gap-1"
                  >
                    <span>Ver Original</span>
                    <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </Button>
                )}
              </div>
            )}

            {/* Tabla de Líneas del Asiento */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
              <div className="px-3.5 py-2 bg-slate-50 border-b border-slate-200 font-semibold text-slate-700 flex items-center justify-between">
                <span>Asiento de Partida Doble</span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {lines.length} líneas
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/50 border-b border-slate-200 text-slate-600 font-semibold">
                    <tr>
                      <th className="py-2 px-3 w-10 text-center">#</th>
                      <th className="py-2 px-3 min-w-[200px]">Cuenta Contable</th>
                      <th className="py-2 px-3">Glosa Específica</th>
                      <th className="py-2 px-3 w-28 text-right">Debe ({sim})</th>
                      <th className="py-2 px-3 w-28 text-right">Haber ({sim})</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {lines.map((l, idx) => {
                      const cuenta = l.cuenta || {}
                      return (
                        <tr key={l.id || idx} className="hover:bg-slate-50/60">
                          <td className="py-2 px-3 text-center text-slate-400 font-mono">
                            {l.orden || idx + 1}
                          </td>
                          <td className="py-2 px-3">
                            <span className="font-mono font-bold text-[#064e3b] mr-1.5">
                              {cuenta.codigo || '—'}
                            </span>
                            <span className="text-slate-800 font-medium">
                              {cuenta.nombre || ''}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-slate-600">
                            {l.glosa || '—'}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-semibold text-slate-900">
                            {parseFloat(l.debe ?? 0) > 0 ? formatMoney(l.debe, sim) : '—'}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-semibold text-slate-900">
                            {parseFloat(l.haber ?? 0) > 0 ? formatMoney(l.haber, sim) : '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot className="bg-slate-50/90 border-t-2 border-slate-300 font-semibold text-xs">
                    <tr>
                      <td colSpan={3} className="py-2.5 px-3 text-right font-bold text-slate-800 uppercase tracking-wider">
                        Totales:
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        {formatMoney(comp.total_debe, sim)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        {formatMoney(comp.total_haber, sim)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </Modal>
  )
}
