import { computeDonutSegments } from './reportesChartUtils'

/**
 * Pure SVG Donut Chart with side legend and center summary label.
 *
 * Props:
 *   slices: Array<{
 *     label: string,
 *     value: string|number,
 *     formattedValue?: string,
 *     color?: string
 *   }>
 *   centerLabel?: string
 *   centerValue?: string
 *   emptyMessage?: string
 */
export default function DonutChart({
  slices = [],
  centerLabel,
  centerValue,
  emptyMessage = 'Sin datos registrados',
}) {
  const radius = 42
  const strokeWidth = 14
  const cx = 60
  const cy = 60
  const { total, segments } = computeDonutSegments(slices, radius)

  if (total <= 0 || segments.length === 0) {
    return (
      <div className="py-10 text-center text-slate-400 text-xs italic">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 p-4">
      {/* SVG Donut */}
      <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
        <svg
          viewBox="0 0 120 120"
          className="w-full h-full -rotate-90 transform"
        >
          {/* Background neutral ring */}
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="transparent"
            stroke="#f1f5f9"
            strokeWidth={strokeWidth}
          />

          {/* Slices */}
          {segments.map((seg, idx) => (
            <circle
              key={seg.label || idx}
              cx={cx}
              cy={cy}
              r={radius}
              fill="transparent"
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeDasharray={seg.strokeDasharray}
              strokeDashoffset={seg.strokeDashoffset}
              strokeLinecap="butt"
              className="transition-all duration-500 ease-out hover:opacity-85"
            />
          ))}
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {centerLabel || 'Total'}
          </span>
          <span className="font-mono font-bold text-xs text-slate-800 truncate max-w-[100px]" title={centerValue || String(total)}>
            {centerValue || total}
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-2.5 w-full max-w-xs text-xs">
        {segments.map((seg, idx) => (
          <div key={seg.label || idx} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 truncate">
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: seg.color }}
              />
              <span className="text-slate-700 font-medium truncate" title={seg.label}>
                {seg.label}
              </span>
            </div>

            <div className="flex items-center gap-2 font-mono shrink-0 text-right">
              <span className="font-bold text-slate-500 text-[11px]">
                {seg.percentage}%
              </span>
              <span className="font-semibold text-slate-900">
                {seg.formattedValue ?? seg.value}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
