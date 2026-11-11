'use client'

import { useState, useEffect } from 'react'
import { fetchProfiles, fetchLoans, exportToCSV } from '@/lib/storage'
import { Users, Shield, User, Loader2, Search, Download } from 'lucide-react'

export default function AdminUserPage() {
  const [profiles, setProfiles] = useState([])
  const [loanCountMap, setLoanCountMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadData() {
      setLoading(true)
      const [allProfiles, allLoans] = await Promise.all([
        fetchProfiles(),
        fetchLoans(),
      ])

      const activeCounts = {}
      allLoans
        .filter((l) => l.status === 'dipinjam')
        .forEach((l) => {
          activeCounts[l.user_id] = (activeCounts[l.user_id] || 0) + 1
        })

      if (isMounted) {
        setProfiles(allProfiles)
        setLoanCountMap(activeCounts)
        setLoading(false)
      }
    }

    loadData()

    return () => {
      isMounted = false
    }
  }, [])

  const handleExportCSV = () => {
    if (profiles.length === 0) return
    const headers = ['ID', 'Nama Lengkap', 'Email', 'Role', 'Peminjaman Aktif']
    const rows = filteredProfiles.map((p) => [
      p.id,
      p.name,
      p.email,
      p.role,
      loanCountMap[p.id] || 0,
    ])
    exportToCSV(`daftar_pengguna_perpus_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows)
  }

  const filteredProfiles = profiles.filter((p) => {
    const s = search.toLowerCase()
    return (
      (p.name && p.name.toLowerCase().includes(s)) ||
      (p.email && p.email.toLowerCase().includes(s))
    )
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <Users className="w-6 h-6 text-emerald-700" aria-hidden="true" />
            <span>Daftar Pengguna</span>
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm mt-1">
            Daftar seluruh akun terdaftar di Supabase dan jumlah peminjaman buku aktif masing-masing pengguna.
          </p>
        </div>
      </div>

      {/* Search and Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 w-full sm:max-w-sm">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama atau email pengguna..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 pl-10 pr-4 text-sm rounded-xl border border-slate-200 bg-white placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-2xs transition"
          />
        </div>

        <button
          type="button"
          onClick={handleExportCSV}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 h-11 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-emerald-700" />
          <span>Ekspor CSV</span>
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-sm text-slate-500 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-3" />
          <p>Memuat daftar pengguna dari Supabase...</p>
        </div>
      ) : filteredProfiles.length > 0 ? (
        <div className="space-y-4">
          {/* TAMPILAN MOBILE: Kartu Pengguna Responsif (md:hidden) */}
          <div className="md:hidden space-y-3">
            {filteredProfiles.map((p) => {
              const activeCount = loanCountMap[p.id] || 0
              const isAdmin = p.role === 'admin'

              return (
                <article
                  key={p.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      {p.avatar_url ? (
                        <img
                          src={p.avatar_url}
                          alt={p.name}
                          className="w-9 h-9 rounded-xl object-cover border border-slate-200"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-xs">
                          {p.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm leading-tight">{p.name}</h3>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">{p.email}</p>
                      </div>
                    </div>

                    {isAdmin ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <Shield className="w-3 h-3 text-emerald-700" />
                        Admin
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                        <User className="w-3 h-3 text-slate-500" />
                        User
                      </span>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Peminjaman Buku Aktif:</span>
                    {activeCount > 0 ? (
                      <span className="px-2.5 py-0.5 text-xs font-bold bg-amber-100 text-amber-800 rounded-full">
                        {activeCount} buku aktif
                      </span>
                    ) : (
                      <span className="text-slate-400 font-medium">0 buku</span>
                    )}
                  </div>
                </article>
              )
            })}
          </div>

          {/* TAMPILAN DESKTOP: Tabel Pengguna Lengkap (hidden md:block) */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-600">
                  <tr>
                    <th scope="col" className="px-6 py-4">Nama Pengguna</th>
                    <th scope="col" className="px-6 py-4">Email</th>
                    <th scope="col" className="px-6 py-4">Role Akun</th>
                    <th scope="col" className="px-6 py-4 text-right">Pinjaman Aktif</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProfiles.map((p) => {
                    const activeCount = loanCountMap[p.id] || 0
                    const isAdmin = p.role === 'admin'

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {p.avatar_url ? (
                              <img
                                src={p.avatar_url}
                                alt={p.name}
                                className="w-8 h-8 rounded-full object-cover border border-slate-200"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-semibold text-xs">
                                {p.name?.charAt(0).toUpperCase() || 'U'}
                              </div>
                            )}
                            <span className="font-semibold text-slate-900">{p.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-600">{p.email}</td>
                        <td className="px-6 py-4">
                          {isAdmin ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <Shield className="w-3 h-3 text-emerald-700" aria-hidden="true" />
                              Admin
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                              <User className="w-3 h-3 text-slate-500" aria-hidden="true" />
                              User
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right font-medium">
                          {activeCount > 0 ? (
                            <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 text-xs font-bold bg-amber-100 text-amber-800 rounded-full">
                              {activeCount} buku
                            </span>
                          ) : (
                            <span className="text-slate-500 text-xs">0 buku</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-500">
          Belum ada profil pengguna terdaftar di database Supabase.
        </div>
      )}
    </div>
  )
}
