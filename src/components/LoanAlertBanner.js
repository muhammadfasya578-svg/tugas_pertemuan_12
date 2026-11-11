'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, Clock, ArrowRight, X } from 'lucide-react'
import { fetchLoans } from '@/lib/storage'
import { calculateLateFine } from '@/lib/utils'

export default function LoanAlertBanner({ userId }) {
  const [alerts, setAlerts] = useState({ overdue: [], dueSoon: [] })
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (!userId) return
    let isMounted = true

    async function checkUserLoans() {
      const userLoans = await fetchLoans(userId)
      if (!isMounted) return

      const now = Date.now()
      const oneDayMs = 24 * 60 * 60 * 1000

      const activeLoans = userLoans.filter((l) => l.status === 'dipinjam')
      const overdue = []
      const dueSoon = []

      activeLoans.forEach((loan) => {
        const dueTime = new Date(loan.due_date).getTime()
        if (dueTime < now) {
          overdue.push(loan)
        } else if (dueTime - now <= oneDayMs) {
          dueSoon.push(loan)
        }
      })

      setAlerts({ overdue, dueSoon })
    }

    checkUserLoans()
    return () => {
      isMounted = false
    }
  }, [userId])

  if (dismissed) return null
  if (alerts.overdue.length === 0 && alerts.dueSoon.length === 0) return null

  const isOverdue = alerts.overdue.length > 0
  const count = isOverdue ? alerts.overdue.length : alerts.dueSoon.length

  return (
    <div
      role="alert"
      className={`rounded-2xl border p-4 sm:p-5 transition-all shadow-xs mb-6 ${
        isOverdue
          ? 'bg-red-50/80 border-red-200 text-red-900'
          : 'bg-amber-50/80 border-amber-200 text-amber-900'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
              isOverdue
                ? 'bg-red-100 text-red-700'
                : 'bg-amber-100 text-amber-800'
            }`}
          >
            {isOverdue ? (
              <AlertTriangle className="w-5 h-5" aria-hidden="true" />
            ) : (
              <Clock className="w-5 h-5" aria-hidden="true" />
            )}
          </div>

          <div className="space-y-1 flex-1">
            <h2 className="text-sm font-bold">
              {isOverdue
                ? `Peringatan: ${count} buku melewati batas jatuh tempo`
                : `Pengingat: ${count} buku akan jatuh tempo besok`}
            </h2>
            <p className="text-xs text-slate-700 leading-relaxed">
              {isOverdue
                ? 'Buku yang terlambat dikenakan denda keterlambatan Rp1.000 per hari. Silakan segera kembalikan buku melalui menu Riwayat.'
                : 'Segera lakukan pengembalian atau ajukan perpanjangan waktu peminjaman sebelum tenggat berakhir.'}
            </p>

            <div className="pt-2">
              <Link
                href="/riwayat"
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  isOverdue
                    ? 'bg-red-700 text-white hover:bg-red-800'
                    : 'bg-amber-800 text-white hover:bg-amber-900'
                }`}
              >
                <span>Buka Riwayat Peminjaman</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Tutup pemberitahuan"
          className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
