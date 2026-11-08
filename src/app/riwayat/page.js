'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import StatusBadge from '@/components/StatusBadge'
import { getLoans, getBookById, returnBookData, getSession } from '@/lib/storage'
import { formatDate } from '@/lib/utils'
import { History, BookOpen, RotateCcw } from 'lucide-react'

export default function RiwayatPage() {
  const [loans, setLoans] = useState([])
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadData = () => {
    const currentSession = getSession()
    setUser(currentSession)

    if (currentSession) {
      const allLoans = getLoans()
      // Filter loans milik user sendiri
      const userLoans = allLoans
        .filter((l) => l.user_id === currentSession.id)
        .map((l) => ({
          ...l,
          book: getBookById(l.book_id),
        }))
      setLoans(userLoans)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleReturn = (loanId) => {
    const confirmed = window.confirm('Apakah kamu yakin ingin mengembalikan buku ini?')
    if (!confirmed) return

    const res = returnBookData(loanId, user)
    if (res.error) {
      alert(res.error)
    } else {
      loadData()
    }
  }

  const activeLoansCount = loans.filter((l) => l.status === 'dipinjam').length

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500 text-sm">Memuat data riwayat...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar profile={user} />

      <main className="max-w-6xl mx-auto px-4 py-8 flex-1 w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
              <History className="w-6 h-6 text-emerald-700" aria-hidden="true" />
              <span>Riwayat Peminjaman</span>
            </h1>
            <p className="text-slate-600 text-sm mt-1">
              Daftar seluruh buku yang pernah dan sedang kamu pinjam
            </p>
          </div>

          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold px-3.5 py-2 rounded-xl self-start sm:self-auto">
            <span>Peminjaman Aktif:</span>
            <span className="bg-emerald-700 text-white px-2 py-0.5 rounded-full font-bold">
              {activeLoansCount} / 3 buku
            </span>
          </div>
        </div>

        {loans.length > 0 ? (
          /* Tabel Riwayat */
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-600">
                  <tr>
                    <th scope="col" className="px-6 py-4">Buku</th>
                    <th scope="col" className="px-6 py-4">Tgl Pinjam</th>
                    <th scope="col" className="px-6 py-4">Jatuh Tempo</th>
                    <th scope="col" className="px-6 py-4">Status</th>
                    <th scope="col" className="px-6 py-4">Tgl Kembali</th>
                    <th scope="col" className="px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loans.map((loan) => (
                    <tr key={loan.id} className="hover:bg-emerald-50/40 transition">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">
                          {loan.book?.title || 'Buku tidak ditemukan'}
                        </div>
                        <div className="text-xs text-slate-500">
                          {loan.book?.author} &bull; {loan.book?.category}
                        </div>
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
                      <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                        {formatDate(loan.returned_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {loan.status === 'dipinjam' ? (
                          <button
                            type="button"
                            onClick={() => handleReturn(loan.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 transition"
                          >
                            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Kembalikan</span>
                          </button>
                        ) : (
                          <span className="text-xs text-slate-500">Selesai</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Empty State */
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8" aria-hidden="true" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">
              Belum Ada Peminjaman
            </h3>
            <p className="text-xs text-slate-600 mt-1 max-w-xs mx-auto">
              Kamu belum pernah meminjam buku. Cari dan pinjam buku favoritmu sekarang!
            </p>
            <Link
              href="/"
              className="mt-5 inline-flex items-center px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition"
            >
              Jelajahi Katalog Buku
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
