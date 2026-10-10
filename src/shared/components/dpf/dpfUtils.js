export function formatNullableMoney(value, simbolo = 'Bs.') {
  if (value == null) return '—'
  const amount = typeof value === 'number' ? value : parseFloat(value)
  const safe = Number.isNaN(amount) ? 0 : amount
  return `${simbolo} ${safe.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function calculateKnownMaturityTotal(principal, netInterest) {
  if (principal == null || netInterest == null) return null
  const principalAmount = Number(principal)
  const interestAmount = Number(netInterest)
  if (!Number.isFinite(principalAmount) || !Number.isFinite(interestAmount)) return null
  return principalAmount + interestAmount
}
