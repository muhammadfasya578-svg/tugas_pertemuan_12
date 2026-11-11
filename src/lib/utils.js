export function formatDate(dateString) {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount || 0)
}

export function calculateLateFine(dueDate, returnedAt = null) {
  if (!dueDate) {
    return { isOverdue: false, daysLate: 0, fineAmount: 0, formattedFine: 'Rp0' }
  }

  const due = new Date(dueDate).getTime()
  const compareTime = returnedAt ? new Date(returnedAt).getTime() : Date.now()

  if (compareTime <= due) {
    return { isOverdue: false, daysLate: 0, fineAmount: 0, formattedFine: 'Rp0' }
  }

  const diffMs = compareTime - due
  const daysLate = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  const fineRatePerDay = 1000
  const fineAmount = daysLate * fineRatePerDay

  return {
    isOverdue: true,
    daysLate,
    fineAmount,
    formattedFine: formatRupiah(fineAmount),
  }
}
