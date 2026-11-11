import { Clock, CheckCircle2, AlertTriangle } from 'lucide-react'
import { calculateLateFine } from '@/lib/utils'

export default function StatusBadge({ status, dueDate, returnedAt, showFine = true }) {
  const isReturned = status === 'dikembalikan'
  const fineInfo = calculateLateFine(dueDate, returnedAt)

  if (isReturned) {
    if (fineInfo.isOverdue && showFine) {
      return (
        <div className="inline-flex flex-col gap-0.5">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
            Dikembalikan
          </span>
          <span className="text-[10px] text-red-600 font-medium pl-1">
            Telat {fineInfo.daysLate} hari ({fineInfo.formattedFine})
          </span>
        </div>
      )
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
        <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
        Dikembalikan
      </span>
    )
  }

  if (fineInfo.isOverdue) {
    return (
      <div className="inline-flex flex-col gap-0.5">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
          <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
          Terlambat ({fineInfo.daysLate} hari)
        </span>
        {showFine && (
          <span className="text-[10px] text-red-700 font-bold pl-1">
            Denda: {fineInfo.formattedFine}
          </span>
        )}
      </div>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
      <Clock className="w-3.5 h-3.5" aria-hidden="true" />
      Dipinjam
    </span>
  )
}
