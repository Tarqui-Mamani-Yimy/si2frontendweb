import { DEFAULT_SUBSCRIPTION } from '../constants/subscription'

/**
 * SubscriptionBadge — Compact badge for tables and detail views.
 * Displays the institutional subscription plan.
 */
export default function SubscriptionBadge({
  plan = DEFAULT_SUBSCRIPTION.name,
  className = '',
  showIcon = true,
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide bg-emerald-50 dark:bg-emerald-950/60 text-[#006c49] dark:text-[#4edea3] border border-emerald-200/80 dark:border-emerald-800/60 shadow-xs whitespace-nowrap ${className}`}
    >
      {showIcon && (
        <span
          className="material-symbols-outlined text-[14px] text-[#006c49] dark:text-[#4edea3]"
          aria-hidden="true"
        >
          corporate_fare
        </span>
      )}
      <span>{plan}</span>
    </span>
  )
}
