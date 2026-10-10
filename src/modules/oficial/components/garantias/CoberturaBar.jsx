import Badge from '../../../../components/ui/Badge'

function formatMoney(value, simbolo = 'Bs.') {
  const n = typeof value === 'number' ? value : parseFloat(value ?? 0)
  const safe = isNaN(n) ? 0 : n
  return `${simbolo} ${safe.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/**
 * CoberturaBar — Visualizador de cobertura de garantías (verificadas vs pendientes vs requeridas).
 *
 * @param {{
 *   cobertura: {
 *     requiere_garantia: boolean,
 *     cobertura_minima: number|string,
 *     monto_solicitado: number|string,
 *     valor_realizable_verificado: number|string,
 *     valor_realizable_pendiente: number|string,
 *     porcentaje_cobertura: number|string,
 *     cumple: boolean
 *   } | null,
 *   simboloMoneda?: string
 * }} props
 */
export default function CoberturaBar({ cobertura, simboloMoneda = 'Bs.' }) {
  if (!cobertura) return null

  const requiereGarantia = Boolean(cobertura.requiere_garantia)
  const montoSolicitado = parseFloat(cobertura.monto_solicitado ?? 0)
  const cobMinPct = parseFloat(cobertura.cobertura_minima ?? 100)
  const montoMinimoRequerido = montoSolicitado * (cobMinPct / 100)

  const valVerif = parseFloat(cobertura.valor_realizable_verificado ?? 0)
  const valPend = parseFloat(cobertura.valor_realizable_pendiente ?? 0)

  const pctVerif = montoSolicitado > 0 ? (valVerif / montoSolicitado) * 100 : 0
  const pctPend = montoSolicitado > 0 ? (valPend / montoSolicitado) * 100 : 0
  const pctTotal = pctVerif + pctPend

  // Escala para barra visual (máximo entre 150% o el total + 10%)
  const maxScale = Math.max(120, cobMinPct * 1.1, pctTotal * 1.05)
  const barVerifWidth = Math.min(100, (pctVerif / maxScale) * 100)
  const barPendWidth = Math.min(100 - barVerifWidth, (pctPend / maxScale) * 100)
  const markerPos = Math.min(98, Math.max(2, (cobMinPct / maxScale) * 100))

  const cumple = Boolean(cobertura.cumple)
  const tienePendientes = valPend > 0
  const alcanzariaConPendientes = !cumple && pctTotal >= cobMinPct

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
      {/* ── Encabezado de Cobertura ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-[#064e3b]">
            shield
          </span>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Cobertura de Garantías
            </h4>
            <span className="text-[10px] text-slate-500">
              {requiereGarantia
                ? `Exigencia mínima: ${cobMinPct.toFixed(0)}% del monto solicitado (${formatMoney(montoMinimoRequerido, simboloMoneda)})`
                : 'Este producto crediticio no exige garantías obligatorias'}
            </span>
          </div>
        </div>

        <div>
          {!requiereGarantia ? (
            <Badge variant="slate">Garantía Opcional</Badge>
          ) : cumple ? (
            <Badge variant="green" className="gap-1 font-bold">
              <span className="material-symbols-outlined text-[13px]">check_circle</span>
              <span>Cobertura Cumplida ({pctVerif.toFixed(1)}%)</span>
            </Badge>
          ) : alcanzariaConPendientes ? (
            <Badge variant="amber" className="gap-1 font-bold">
              <span className="material-symbols-outlined text-[13px]">hourglass_empty</span>
              <span>Requiere Verificación ({pctTotal.toFixed(1)}%)</span>
            </Badge>
          ) : (
            <Badge variant="red" className="gap-1 font-bold">
              <span className="material-symbols-outlined text-[13px]">warning</span>
              <span>Cobertura Insuficiente ({pctVerif.toFixed(1)}%)</span>
            </Badge>
          )}
        </div>
      </div>

      {/* ── Métricas Clave ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            Monto Solicitado
          </span>
          <span className="font-mono font-bold text-slate-900 text-sm block mt-0.5">
            {formatMoney(montoSolicitado, simboloMoneda)}
          </span>
          <span className="text-[10px] text-slate-500">Base 100%</span>
        </div>

        <div className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-100">
          <span className="text-[10px] uppercase font-bold text-emerald-800 block">
            Realizable Verificado
          </span>
          <span className="font-mono font-bold text-emerald-900 text-sm block mt-0.5">
            {formatMoney(valVerif, simboloMoneda)}
          </span>
          <span className="text-[10px] font-semibold text-emerald-700">
            {pctVerif.toFixed(1)}% cobertura
          </span>
        </div>

        <div className="p-2.5 rounded-lg bg-amber-50/60 border border-amber-100">
          <span className="text-[10px] uppercase font-bold text-amber-800 block">
            Pendiente Verificación
          </span>
          <span className="font-mono font-bold text-amber-900 text-sm block mt-0.5">
            {formatMoney(valPend, simboloMoneda)}
          </span>
          <span className="text-[10px] font-semibold text-amber-700">
            +{pctPend.toFixed(1)}% en revisión
          </span>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            Mínimo Requerido
          </span>
          <span className="font-mono font-bold text-slate-900 text-sm block mt-0.5">
            {formatMoney(montoMinimoRequerido, simboloMoneda)}
          </span>
          <span className="text-[10px] text-slate-500 font-semibold">
            Meta: {cobMinPct.toFixed(0)}%
          </span>
        </div>
      </div>

      {/* ── Barra de Progreso Multi-segmento ── */}
      {requiereGarantia && (
        <div className="space-y-1.5 pt-1">
          <div className="relative h-4 w-full rounded-full bg-slate-100 overflow-hidden border border-slate-200">
            {/* Segmento Verificado (Verde) */}
            <div
              className="absolute left-0 top-0 bottom-0 bg-emerald-500 transition-all duration-300"
              style={{ width: `${barVerifWidth}%` }}
              title={`Verificado: ${pctVerif.toFixed(1)}%`}
            />

            {/* Segmento Pendiente (Ámbar) */}
            <div
              className="absolute top-0 bottom-0 bg-amber-400 transition-all duration-300 opacity-90"
              style={{
                left: `${barVerifWidth}%`,
                width: `${barPendWidth}%`,
              }}
              title={`Pendiente: +${pctPend.toFixed(1)}%`}
            />

            {/* Marcador de meta mínima */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-slate-900 z-10"
              style={{ left: `${markerPos}%` }}
              title={`Mínimo requerido: ${cobMinPct}%`}
            />
          </div>

          {/* Leyenda debajo de la barra */}
          <div className="flex flex-wrap items-center justify-between text-[10px] text-slate-500">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                <span>Verificado ({pctVerif.toFixed(1)}%)</span>
              </span>
              {tienePendientes && (
                <span className="inline-flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                  <span>Pendiente ({pctPend.toFixed(1)}%)</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 font-mono">
              <span className="font-bold text-slate-700">|</span>
              <span>Meta Mínima: <strong>{cobMinPct.toFixed(0)}%</strong></span>
            </div>
          </div>
        </div>
      )}

      {/* Aviso contextual si falta verificación */}
      {requiereGarantia && !cumple && alcanzariaConPendientes && (
        <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px] text-amber-700 shrink-0">
            info
          </span>
          <span>
            Las garantías registradas cubren el mínimo requerido ({pctTotal.toFixed(1)}%), pero un Administrador debe verificarlas antes de que sean computadas formalmente en el scoring crediticio.
          </span>
        </div>
      )}
    </div>
  )
}
