'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { fetchLoans } from '@/lib/storage'
import { calculateLateFine, formatDate } from '@/lib/utils'
import {
  Bell,
  Clock,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  Check,
  X,
  ExternalLink,
} from 'lucide-react'

export default function NotificationCenter({ user }) {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [readIds, setReadIds] = useState([])
  const dropdownRef = useRef(null)

  useEffect(() => {
    if (!user?.id) return
    let isMounted = true

    // Baca ID yang sudah dibaca dari localStorage
    try {
      const stored = localStorage.getItem(`perpus_read_notifs_${user.id}`)
      if (stored) {
        setReadIds(JSON.parse(stored))
      }
    } catch {}

    async function loadNotifications() {
      const loans = await fetchLoans(user.id)
      const list = []
      const now = Date.now()

      loans.forEach((loan) => {
        const fine = calculateLateFine(loan.due_date, loan.returned_at)
        const dueTime = new Date(loan.due_date).getTime()
        const diffDays = Math.ceil((dueTime - now) / (1000 * 60 * 60 * 24))

        if (loan.status === 'dipinjam') {
          if (fine.isOverdue) {
            list.push({
              id: `notif-overdue-${loan.id}`,
              type: 'danger',
              title: 'Peringatan: Peminjaman Terlambat',
              message: `Buku "${loan.bookTitle}" telah melewati jatuh tempo (${fine.daysLate} hari). Denda saat ini ${fine.formattedFine}.`,
              timestamp: loan.due_date,
              link: '/riwayat',
            })
          } else if (diffDays <= 2 && diffDays >= 0) {
            list.push({
              id: `notif-soon-${loan.id}`,
              type: 'warning',
              title: 'Pengingat Batas Pengembalian',
              message: `Buku "${loan.bookTitle}" jatuh tempo ${diffDays === 0 ? 'hari ini' : `${diffDays} hari lagi`} (${formatDate(loan.due_date)}).`,
              timestamp: loan.due_date,
              link: '/riwayat',
            })
          } else {
            list.push({
              id: `notif-active-${loan.id}`,
              type: 'info',
              title: 'Peminjaman Aktif',
              message: `Kamu sedang meminjam "${loan.bookTitle}". Batas pengembalian: ${formatDate(loan.due_date)}.`,
              timestamp: loan.created_at,
              link: '/riwayat',
            })
          }
        } else if (loan.status === 'dikembalikan') {
          list.push({
            id: `notif-returned-${loan.id}`,
            type: 'success',
            title: 'Pengembalian Berhasil',
            message: `Buku "${loan.bookTitle}" telah berhasil dikembalikan ke perpustakaan.`,
            timestamp: loan.returned_at || loan.created_at,
            link: '/riwayat',
          })
        }
      })

      if (isMounted) {
        // Urutkan prioritas: danger -> warning -> info -> success
        const priorityOrder = { danger: 1, warning: 2, info: 3, success: 4 }
        list.sort((a, b) => {
          const pA = priorityOrder[a.type] || 5
          const pB = priorityOrder[b.type] || 5
          if (pA !== pB) return pA - pB
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        })
        setNotifications(list)
      }
    }

    loadNotifications()
    return () => {
      isMounted = false
    }
  }, [user?.id])

  // Tutup dropdown saat klik di luar
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const unreadCount = notifications.filter((n) => !readIds.includes(n.id)).length

  const handleMarkAllRead = () => {
    const allIds = notifications.map((n) => n.id)
    setReadIds(allIds)
    if (user?.id) {
      try {
        localStorage.setItem(`perpus_read_notifs_${user.id}`, JSON.stringify(allIds))
      } catch {}
    }
  }

  const handleItemClick = (id) => {
    if (!readIds.includes(id)) {
      const updated = [...readIds, id]
      setReadIds(updated)
      if (user?.id) {
        try {
          localStorage.setItem(`perpus_read_notifs_${user.id}`, JSON.stringify(updated))
        } catch {}
      }
    }
    setIsOpen(false)
  }

  if (!user) return null

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Pusat notifikasi"
        className="relative p-2.5 rounded-2xl bg-white border border-slate-200/90 text-slate-600 hover:text-emerald-700 hover:border-emerald-300 shadow-2xs hover:bg-emerald-50/50 transition cursor-pointer"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white shadow-xs animate-bounce">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-slate-200/90 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-900 text-sm">Notifikasi</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                  {unreadCount} baru
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 transition cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Tandai dibaca</span>
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 p-1">
            {notifications.length === 0 ? (
              <div className="py-12 px-6 text-center text-slate-400">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs font-medium text-slate-500">Belum ada notifikasi baru</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Pemberitahuan peminjaman dan pengembalian akan muncul di sini.
                </p>
              </div>
            ) : (
              notifications.map((notif) => {
                const isRead = readIds.includes(notif.id)
                return (
                  <Link
                    key={notif.id}
                    href={notif.link}
                    onClick={() => handleItemClick(notif.id)}
                    className={`flex items-start gap-3 p-3.5 rounded-2xl transition group ${
                      isRead
                        ? 'opacity-70 hover:opacity-100 hover:bg-slate-50'
                        : 'bg-emerald-50/40 hover:bg-emerald-50/80 font-medium'
                    }`}
                  >
                    {/* Icon Indicator */}
                    <div className="flex-shrink-0 mt-0.5">
                      {notif.type === 'danger' && (
                        <div className="w-8 h-8 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                      )}
                      {notif.type === 'warning' && (
                        <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                          <Clock className="w-4 h-4" />
                        </div>
                      )}
                      {notif.type === 'info' && (
                        <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                          <BookOpen className="w-4 h-4" />
                        </div>
                      )}
                      {notif.type === 'success' && (
                        <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <h4 className="text-xs font-bold text-slate-900 truncate">
                          {notif.title}
                        </h4>
                        {!isRead && (
                          <span className="w-2 h-2 rounded-full bg-emerald-600 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>
                    </div>
                  </Link>
                )
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-slate-100 text-center bg-slate-50/50">
            <Link
              href="/riwayat"
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 transition"
            >
              <span>Lihat Semua Peminjaman</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
