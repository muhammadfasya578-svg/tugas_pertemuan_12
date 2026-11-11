'use client'

import { useState, useEffect } from 'react'
import { fetchActivityLogs, exportToCSV } from '@/lib/storage'
import { formatDate } from '@/lib/utils'
import {
  History,
  Search,
  Download,
  BookOpen,
  CheckCircle,
  Clock,
  Sparkles,
  Layers,
  Filter,
  Loader2,
  Calendar,
  User,
} from 'lucide-react'

export default function AdminActivityLogPage() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('semua')

  useEffect(() => {
    let isMounted = true

    async function loadLogs() {
      const data = await fetchActivityLogs()
      if (isMounted) {
        setLogs(data)
        setLoading(false)
      }
    }

    loadLogs()
    return () => {
      isMounted = false
    }
  }, [])

  const handleExportCSV = () => {
    if (logs.length === 0) return
    const headers = ['ID Log', 'Waktu', 'Aktor / Pengguna', 'Tipe Aktivitas', 'Keterangan']
    const rows = filteredLogs.map((l) => [
      l.id,
      new Date(l.timestamp).toLocaleString('id-ID'),
      l.actor,
      l.type,
      l.description,
    ])
    exportToCSV(`audit_log_perpus_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows)
  }

  const filteredLogs = logs.filter((l) => {
    const matchSearch =
      l.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.actor.toLowerCase().includes(searchQuery.toLowerCase())

    const matchType = typeFilter === 'semua' || l.type === typeFilter

    return matchSearch && matchType
  })

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <History className="w-6 h-6 text-emerald-600" />
            <span>Log Aktivitas Sistem</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Rekam jejak dan audit trail transaksi serta aktivitas operasional perpustakaan.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCSV}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition cursor-pointer"
        >
          <Download className="w-4 h-4 text-emerald-700" />
          <span>Ekspor CSV</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Type Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {[
            { id: 'semua', label: 'Semua Log' },
            { id: 'pinjam', label: 'Peminjaman' },
            { id: 'kembali', label: 'Pengembalian' },
            { id: 'usulan', label: 'Usulan Buku' },
            { id: 'sistem', label: 'Operasional' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setTypeFilter(tab.id)}
              className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                typeFilter === tab.id
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari aktor, keterangan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-9 pr-4 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
          />
        </div>
      </div>

      {/* Log Feed List */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-2xs">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-2" />
            <p className="text-xs">Mengumpulkan log sistem...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <History className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-semibold text-slate-600">Tidak ada log aktivitas</p>
            <p className="text-xs text-slate-400 mt-1">
              Setiap peminjaman, pengembalian, dan usulan buku akan tercatat di sini.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider pb-2 border-b border-slate-100">
              <span>Aktivitas ({filteredLogs.length})</span>
              <span>Waktu Kejadian</span>
            </div>

            <div className="divide-y divide-slate-100">
              {filteredLogs.map((item) => (
                <div
                  key={item.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 p-2 rounded-2xl transition"
                >
                  <div className="flex items-start gap-3">
                    {/* Badge Icon */}
                    <div className="mt-0.5 flex-shrink-0">
                      {item.type === 'pinjam' && (
                        <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                          <BookOpen className="w-4 h-4" />
                        </div>
                      )}
                      {item.type === 'kembali' && (
                        <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                          <CheckCircle className="w-4 h-4" />
                        </div>
                      )}
                      {item.type === 'usulan' && (
                        <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                          <Sparkles className="w-4 h-4" />
                        </div>
                      )}
                      {item.type !== 'pinjam' && item.type !== 'kembali' && item.type !== 'usulan' && (
                        <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                          <Layers className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs sm:text-sm">
                          {item.actor}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            item.type === 'pinjam'
                              ? 'bg-blue-50 text-blue-700'
                              : item.type === 'kembali'
                              ? 'bg-emerald-50 text-emerald-700'
                              : item.type === 'usulan'
                              ? 'bg-purple-50 text-purple-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {item.type}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5 font-medium">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div className="text-right text-[11px] text-slate-400 font-mono sm:self-center">
                    {formatDate(item.timestamp)}
                    <span className="block text-[10px] text-slate-400">
                      {new Date(item.timestamp).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
