'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import StatusBadge from '@/components/StatusBadge'
import { formatDate } from '@/lib/utils'
import { fetchDashboardMetrics } from '@/lib/storage'
import {
  BookOpen,
  Users,
  Clock,
  AlertTriangle,
  LayoutDashboard,
  RefreshCw,
  Database,
  Loader2,
} from 'lucide-react'

const ICON_MAP = {
  BookOpen,
  Users,
  Clock,
  AlertTriangle,
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState([])
  const [recentLoans, setRecentLoans] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [isLive, setIsLive] = useState(false)

  const loadData = async () => {
    setRefreshing(true)
    const data = await fetchDashboardMetrics()
    setStats(data.stats || [])
    setRecentLoans(data.recent || [])
    setIsLive(data.isLive)
    setRefreshing(false)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
              <LayoutDashboard className="w-6 h-6 text-emerald-700" aria-hidden="true" />
              <span>Dashboard Ringkasan</span>
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <Database className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
              <span>Supabase Live</span>
            </span>
          </div>
          <p className="text-slate-600 text-sm mt-1">
            Pantau metrik langsung dari database Supabase PostgreSQL secara real-time.
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition self-start sm:self-auto cursor-pointer disabled:opacity-50"
          title="Sinkronkan data dengan Supabase"
          aria-label="Segarkan data dari Supabase"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-emerald-700 ${refreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
          <span>{refreshing ? 'Menyinkronkan...' : 'Segarkan Data'}</span>
        </button>
      </div>

      {/* 4 StatCards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs animate-pulse flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-100" />
              <div className="space-y-2 flex-1">
                <div className="h-3 bg-slate-100 rounded-sm w-20" />
                <div className="h-6 bg-slate-100 rounded-sm w-12" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {stats.map((stat, i) => {
            const Icon = ICON_MAP[stat.iconName] || BookOpen
            return (
              <div
                key={i}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex items-center gap-4"
              >
                <div
                  className={`w-14 h-14 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center flex-shrink-0`}
                >
                  <Icon className="w-7 h-7" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-600 uppercase tracking-wider">
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
      )}

      {/* Recent Loans Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Peminjaman Terbaru
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              5 transaksi peminjaman buku terakhir dari Supabase
            </p>
          </div>
          <Link
            href="/admin/peminjaman"
            className="inline-flex items-center text-xs font-semibold text-emerald-700 hover:text-emerald-800 underline-offset-4 hover:underline"
          >
            Lihat Semua Peminjaman
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
            <span>Memuat peminjaman terbaru...</span>
          </div>
        ) : recentLoans.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-600">
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
                      <div className="text-xs text-slate-500">
                        {loan.userEmail}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-slate-900">
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
          <div className="p-8 text-center text-sm text-slate-600">
            Belum ada aktivitas peminjaman di Supabase.
          </div>
        )}
      </div>
    </div>
  )
}
