/**
 * PageHeader — encabezado de vista estandarizado NexaCoop Precision.
 *
 * Props:
 *   title:    string | node  — título principal (h1)
 *   subtitle: string | node  — descripción corta (opcional)
 *   action:   node           — slot de acción derecha (botón, Link, etc.)
 */
export default function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0b1c30]">
          {title}
        </h1>
        {subtitle && (
          <div className="mt-1 text-sm text-slate-500 leading-relaxed">
            {subtitle}
          </div>
        )}
      </div>
      {action && (
        <div className="shrink-0 flex items-center gap-2">{action}</div>
      )}
    </div>
  )
}
