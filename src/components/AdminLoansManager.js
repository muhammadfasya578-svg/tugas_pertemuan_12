'use client'

import { useState, useEffect } from 'react'
import { getLoans, getBookById, getUsers, returnBookData, getSession } from '@/lib/storage'
import StatusBadge from '@/components/StatusBadge'
import { formatDate } from '@/lib/utils'
import { Search, RotateCcw } from 'lucide-react'

export default function AdminLoansManager() {
  const [loans, setLoans] = useState([])
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('semua')
  const [currentUser, setCurrentUser] = useState(null)

  const loadLoans = () => {
    const allLoans = getLoans()
    const allUsers = getUsers()
    const populated = allLoans.map((l) => {
      const u = allUsers.find((usr) => usr.id === l.user_id)
      const b = getBookById(l.book_id)
      return {
        ...l,
        userName: u?.name || 'User',
        userEmail: u?.email || '-',
        bookTitle: b?.title || 'Buku dihapus',
        bookCategory: b?.category || '-',
      }
    })
    setLoans(populated)
  }

  useEffect(() => {
    setCurrentUser(getSession())
    loadLoans()
  }, [])

  const handleReturn = (loanId) => {
    const confirmed = window.confirm(
      'Konfirmasi pengembalian buku ini untuk peminjam?'
    )
    if (!confirmed) return

    const res = returnBookData(loanId, currentUser)
    if (res?.error) {
      alert(res.error)
    } else {
      loadLoans()
    }
  }

  const now = Date.now()

  const filteredLoans = loans.filter((loan) => {
    const isReturned = loan.status === 'dikembalikan'
    const isOverdue =
      !isReturned && loan.due_date && new Date(loan.due_date).getTime() < now

    if (filterStatus === 'dipinjam' && (loan.status !== 'dipinjam' || isOverdue)) {
      return false
    }
    if (filterStatus === 'dikembalikan' && loan.status !== 'dikembalikan') {
      return false
    }
    if (filterStatus === 'terlambat' && !isOverdue) {
      return false
    }

    const searchLower = search.toLowerCase()
    return (
      loan.userName.toLowerCase().includes(searchLower) ||
      loan.userEmail.toLowerCase().includes(searchLower) ||
      loan.bookTitle.toLowerCase().includes(searchLower)
    )
  })

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari peminjam, email, atau judul buku..."
            className="w-full h-10 pl-9 pr-4 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>

        {/* Status Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {[
            { id: 'semua', label: 'Semua' },
            { id: 'dipinjam', label: 'Aktif Dipinjam' },
            { id: 'terlambat', label: 'Terlambat' },
            { id: 'dikembalikan', label: 'Dikembalikan' },
          ].map((item) => {
            const isActive = filterStatus === item.id
            return (
              <button
                key={item.id}
                onClick={() => setFilterStatus(item.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th scope="col" className="px-6 py-4">Peminjam</th>
                <th scope="col" className="px-6 py-4">Buku</th>
                <th scope="col" className="px-6 py-4">Tgl Pinjam</th>
                <th scope="col" className="px-6 py-4">Jatuh Tempo</th>
                <th scope="col" className="px-6 py-4">Status</th>
                <th scope="col" className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLoans.length > 0 ? (
                filteredLoans.map((loan) => {
                  const isReturned = loan.status === 'dikembalikan'
                  const isOverdue =
                    !isReturned &&
                    loan.due_date &&
                    new Date(loan.due_date).getTime() < now

                  return (
                    <tr
                      key={loan.id}
                      className={`transition ${
                        isOverdue
                          ? 'bg-red-50/40 hover:bg-red-50/70'
                          : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">
                          {loan.userName}
                        </div>
                        <div className="text-xs text-slate-500">
                          {loan.userEmail}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900 line-clamp-1">
                          {loan.bookTitle}
                        </div>
                        <div className="text-xs text-slate-400">
                          {loan.bookCategory}
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
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {loan.status === 'dipinjam' ? (
                          <button
                            onClick={() => handleReturn(loan.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 transition cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Kembalikan</span>
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">
                            {loan.returned_at ? `Dikembalikan ${formatDate(loan.returned_at)}` : 'Selesai'}
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-500 text-sm">
                    Tidak ada transaksi peminjaman yang cocok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
