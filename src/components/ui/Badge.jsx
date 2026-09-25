/**
 * Badge — chip / pill de estado NexaCoop Precision.
 *
 * Props:
 *   variant: 'green' | 'navy' | 'amber' | 'red' | 'slate' | 'teal' | 'purple' | 'rose' | 'indigo' | 'orange' | 'pink'
 *   className: string (extra overrides)
 */

const VARIANTS = {
  green:  'bg-[#dcfce7] text-[#15803d] border border-emerald-200/60',
  navy:   'bg-[#eff4ff] text-[#003527] border border-emerald-300/40',
  amber:  'bg-[#fef3c7] text-[#b45309] border border-amber-200/60',
  red:    'bg-[#fee2e2] text-[#b91c1c] border border-red-200/60',
  slate:  'bg-slate-100 text-slate-700 border border-slate-200',
  teal:   'bg-[#e6fffa] text-[#0d9488] border border-teal-200/60',
  purple: 'bg-[#f3e8ff] text-[#7e22ce] border border-purple-200/60',
  rose:   'bg-[#ffe4e6] text-[#be123c] border border-rose-200/60',
  indigo: 'bg-[#e0e7ff] text-[#4338ca] border border-indigo-200/60',
  orange: 'bg-[#ffedd5] text-[#c2410c] border border-orange-200/60',
  pink:   'bg-[#fce7f3] text-[#be185d] border border-pink-200/60',
}

export default function Badge({ variant = 'slate', children, className = '' }) {
  const base = 'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide uppercase border transition-colors'
  return (
    <span className={`${base} ${VARIANTS[variant] ?? VARIANTS.slate} ${className}`}>
      {children}
    </span>
  )
}
