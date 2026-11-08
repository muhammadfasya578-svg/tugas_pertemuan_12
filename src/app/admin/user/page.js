'use client'

import { useState, useEffect } from 'react'
import { fetchProfiles, fetchLoans } from '@/lib/storage'
import { Users, Shield, User, Loader2 } from 'lucide-react'

export default function AdminUserPage() {
  const [profiles, setProfiles] = useState([])
  const [loanCountMap, setLoanCountMap] = useState({})
  const [loading, setLoading] = useState(true)

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
          <Users className="w-6 h-6 text-emerald-700" aria-hidden="true" />
          <span>Daftar Pengguna</span>
        </h1>
        <p className="text-slate-600 text-sm mt-1">
          Daftar seluruh akun terdaftar di Supabase dan jumlah peminjaman buku aktif masing-masing pengguna.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-slate-500 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-3" />
            <p>Memuat daftar pengguna dari Supabase...</p>
          </div>
        ) : profiles.length > 0 ? (
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
                {profiles.map((p) => {
                  const activeCount = loanCountMap[p.id] || 0
                  const isAdmin = p.role === 'admin'

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-semibold text-xs">
                            {p.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
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
        ) : (
          <div className="p-8 text-center text-sm text-slate-500">
            Belum ada profil pengguna terdaftar di database Supabase.
          </div>
        )}
      </div>
    </div>
  )
}
