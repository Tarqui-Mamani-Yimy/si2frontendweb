/**
 * DataTable — tabla de datos financieros NexaCoop Precision.
 *
 * Props:
 *   columns: Array<{ key: string, label: string, className?: string, cellClassName?: string }>
 *   rows:    Array<{ id, [key]: any | node }>
 *   emptyMessage: string
 */
export default function DataTable({ columns = [], rows = [], emptyMessage = 'Sin registros disponibles.' }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[#e2e8f0] bg-white shadow-card">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-[#e2e8f0] bg-[#f8f9ff]">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-5 py-3.5 font-table-header text-[11px] font-semibold uppercase tracking-wider text-slate-500 ${col.className ?? ''}`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#e2e8f0]/80">
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-6 py-12 text-center text-sm text-slate-400"
              >
                <div className="flex flex-col items-center justify-center gap-1.5">
                  <span className="material-symbols-outlined text-[28px] text-slate-300">inbox</span>
                  <span>{emptyMessage}</span>
                </div>
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={row.id}
                className="h-[52px] transition-colors hover:bg-slate-50/80"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-5 py-3 text-sm text-[#0b1c30] ${col.cellClassName ?? ''}`}
                  >
                    {row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
