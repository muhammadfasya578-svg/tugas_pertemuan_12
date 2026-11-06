'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import StatusBadge from '@/components/StatusBadge'
import { formatDate } from '@/lib/utils'
import { getBooks, getUsers, getLoans, getBookById, resetToDefaultSeed } from '@/lib/storage'
import {
  BookOpen,
  Users,
  Clock,
  AlertTriangle,
  ArrowRight,
  LayoutDashboard,
  RotateCcw,
} from 'lucide-react'

export default function AdminDashboardPage() {
  const [stats, setStats] = useState([])
  const [recentLoans, setRecentLoans] = useState([])

  const loadDashboardData = () => {
    const books = getBooks()
    const users = getUsers()
    const loans = getLoans()
    const now = Date.now()

    const activeLoans = loans.filter((l) => l.status === 'dipinjam')
    const overdueLoans = activeLoans.filter(
      (l) => l.due_date && new Date(l.due_date).getTime() < now
    )

    setStats([
      {
        label: 'Total Buku',
        value: books.length,
        icon: BookOpen,
        color: 'text-emerald-600',
        bg: 'bg-emerald-50',
      },
      {
        label: 'Total Pengguna',
        value: users.length,
        icon: Users,
        color: 'text-blue-600',
        bg: 'bg-blue-50',
      },
      {
        label: 'Peminjaman Aktif',
        value: activeLoans.length,
        icon: Clock,
        color: 'text-amber-600',
        bg: 'bg-amber-50',
      },
      {
        label: 'Peminjaman Terlambat',
        value: overdueLoans.length,
        icon: AlertTriangle,
        color: 'text-red-600',
        bg: 'bg-red-50',
      },
    ])

    // 5 peminjaman terakhir
    const populated = loans.slice(0, 5).map((l) => {
      const u = users.find((usr) => usr.id === l.user_id)
      const b = getBookById(l.book_id)
      return {
        ...l,
        userName: u?.name || 'User',
        userEmail: u?.email || '-',
        bookTitle: b?.title || 'Buku dihapus',
      }
    })
    setRecentLoans(populated)
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  const handleResetSeed = () => {
    const confirmed = window.confirm(
      'Apakah kamu yakin ingin mereset seluruh data ke seeder awal bawaan (8 buku, 4 akun pengguna, dan data peminjaman default)?'
    )
    if (!confirmed) return

    resetToDefaultSeed()
    loadDashboardData()
    alert('Data berhasil di-reset ke data seeder bawaan!')
  }

  return (
    <div className="space-y-8">
      {/* Header & Seeder Reset Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <LayoutDashboard className="w-6 h-6 text-emerald-600" />
            <span>Dashboard Ringkasan</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Pantau metrik perpustakaan, aktivitas peminjaman, dan status koleksi buku.
          </p>
        </div>

        <button
          onClick={handleResetSeed}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition cursor-pointer self-start sm:self-auto"
          title="Reset semua data ke seeder awal"
        >
          <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
          <span>Reset ke Data Seeder</span>
        </button>
      </div>

      {/* 4 StatCards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, i) => {
          const Icon = stat.icon
          return (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex items-center gap-4"
            >
              <div
                className={`w-14 h-14 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center flex-shrink-0`}
              >
                <Icon className="w-7 h-7" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  {stat.label}
                </p>
                <p className="text-2xl font-bold text-slate-900 mt-0.5">
                  {stat.value}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Recent Loans Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Peminjaman Terbaru
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              5 transaksi peminjaman buku terakhir
            </p>
          </div>
          <Link
            href="/admin/peminjaman"
            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
          >
            <span>Lihat Semua</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentLoans.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th scope="col" className="px-6 py-4">Peminjam</th>
                  <th scope="col" className="px-6 py-4">Buku</th>
                  <th scope="col" className="px-6 py-4">Tgl Pinjam</th>
                  <th scope="col" className="px-6 py-4">Jatuh Tempo</th>
                  <th scope="col" className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentLoans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">
                        {loan.userName}
                      </div>
                      <div className="text-xs text-slate-400">
                        {loan.userEmail}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-slate-800">
                        {loan.bookTitle}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                      {formatDate(loan.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-700">
                      {formatDate(loan.due_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge
                        status={loan.status}
                        dueDate={loan.due_date}
                        returnedAt={loan.returned_at}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-sm text-slate-500">
            Belum ada aktivitas peminjaman.
          </div>
        )}
      </div>
    </div>
  )
}
