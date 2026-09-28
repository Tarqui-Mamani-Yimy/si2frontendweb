import { calculateBarWidth } from './reportesChartUtils'

/**
 * Pure SVG/CSS Horizontal Bar Chart for breakdown by status, product, destination, or mora ranges.
 *
 * Props:
 *   items: Array<{
 *     label: string,
 *     value: string|number,
 *     formattedValue?: string,
 *     percentage?: number,
 *     count?: number|string,
 *     color?: string,
 *     badgeText?: string,
 *     badgeVariant?: string
 *   }>
 *   maxValue?: number|string
 *   emptyMessage?: string
 */
export default function HorizontalBarChart({
  items = [],
  maxValue,
  emptyMessage = 'Sin datos registrados',
}) {
  if (!items || items.length === 0) {
    return (
      <div className="py-8 text-center text-slate-400 text-xs italic">
        {emptyMessage}
      </div>
    )
  }

  // Calculate highest value if not provided
  const computedMax =
    maxValue != null
      ? maxValue
      : items.reduce((max, it) => {
          const val = typeof it.value === 'number' ? it.value : parseFloat(String(it.value).replace(',', '.')) || 0
          return Math.max(max, val)
        }, 0)

  return (
    <div className="space-y-3.5 text-xs">
      {items.map((item, idx) => {
        const width = calculateBarWidth(item.value, computedMax)
        const barColor = item.color || '#064e3b'

        return (
          <div key={item.label || idx} className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 truncate">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: barColor }}
                />
                <span className="font-semibold text-slate-800 truncate" title={item.label}>
                  {item.label}
                </span>
                {item.count != null && (
                  <span className="text-[11px] text-slate-400 font-mono">
                    ({item.count} {typeof item.count === 'number' && item.count === 1 ? 'crédito' : 'créditos'})
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 font-mono text-right shrink-0">
                {item.percentage != null && (
                  <span className="text-[11px] font-bold text-slate-500">
                    {item.percentage}%
                  </span>
                )}
                <span className="font-bold text-slate-900">
                  {item.formattedValue ?? item.value}
                </span>
              </div>
            </div>

            {/* Horizontal progress bar */}
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${width}%`,
                  backgroundColor: barColor,
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
