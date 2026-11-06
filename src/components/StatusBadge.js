import { Clock, CheckCircle2, AlertTriangle } from 'lucide-react'

export default function StatusBadge({ status, dueDate, returnedAt }) {
  const isReturned = status === 'dikembalikan'
  const isOverdue =
    !isReturned && dueDate && new Date(dueDate).getTime() < new Date().getTime()

  if (isReturned) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Dikembalikan
      </span>
    )
  }

  if (isOverdue) {
    // Hitung hari telat
    const diffTime = Math.abs(new Date().getTime() - new Date(dueDate).getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
        <AlertTriangle className="w-3.5 h-3.5" />
        Terlambat ({diffDays} hari)
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
      <Clock className="w-3.5 h-3.5" />
      Dipinjam
    </span>
  )
}
