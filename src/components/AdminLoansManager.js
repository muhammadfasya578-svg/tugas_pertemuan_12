'use client'

import { useState, useEffect } from 'react'
import { useDialog } from '@/components/DialogContext'
import {
  fetchLoans,
  returnBookData,
  extendLoanData,
  getSession,
  syncSessionFromSupabase,
  exportToCSV,
} from '@/lib/storage'
import StatusBadge from '@/components/StatusBadge'
import LoanReceiptModal from '@/components/LoanReceiptModal'
import { formatDate, formatRupiah, calculateLateFine } from '@/lib/utils'
import {
  Search,
  RotateCcw,
  Loader2,
  Download,
  Printer,
  CalendarPlus,
  AlertTriangle,
} from 'lucide-react'

export default function AdminLoansManager() {
  const { confirm, alert, toast } = useDialog()
  const [selectedReceiptLoan, setSelectedReceiptLoan] = useState(null)
  const [loans, setLoans] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('semua')
  const [currentUser, setCurrentUser] = useState(null)
  const [processingId, setProcessingId] = useState(null)

  const loadLoans = async () => {
    setLoading(true)
    const userSession = await syncSessionFromSupabase()
    setCurrentUser(userSession)
    const data = await fetchLoans()
    setLoans(data)
    setLoading(false)
  }

  useEffect(() => {
    loadLoans()
  }, [])

  const handleReturn = async (loanId) => {
    const confirmed = await confirm({
      title: 'Konfirmasi Pengembalian',
      message: 'Konfirmasi pengembalian buku ini untuk peminjam?',
      confirmText: 'Ya, Tandai Kembali',
      cancelText: 'Batal',
      type: 'return',
    })
    if (!confirmed) return

    setProcessingId(loanId)
    const res = await returnBookData(loanId, currentUser)
    setProcessingId(null)

    if (res?.error) {
      await alert({
        title: 'Pengembalian Gagal',
        message: res.error,
        type: 'error',
      })
    } else {
      toast({
        message: 'Buku berhasil ditandai sebagai dikembalikan!',
        type: 'success',
      })
      await loadLoans()
    }
  }

  const handleExtend = async (loanId) => {
    const confirmed = await confirm({
      title: 'Perpanjang Peminjaman',
      message: 'Perpanjang masa peminjaman ini selama 7 hari tambahan?',
      confirmText: 'Perpanjang (+7 Hari)',
      cancelText: 'Batal',
      type: 'extend',
    })
    if (!confirmed) return

    setProcessingId(loanId)
    const res = await extendLoanData(loanId, currentUser)
    setProcessingId(null)

    if (res?.error) {
      await alert({
        title: 'Perpanjangan Gagal',
        message: res.error,
        type: 'error',
      })
    } else {
      toast({
        message: 'Masa peminjaman berhasil diperpanjang 7 hari!',
        type: 'success',
      })
      await loadLoans()
    }
  }

  const handleExportCSV = () => {
    if (loans.length === 0) return

    const headers = [
      'ID Peminjaman',
      'Nama Peminjam',
      'Email Peminjam',
      'Judul Buku',
      'Kategori',
      'Tanggal Pinjam',
      'Jatuh Tempo',
      'Status',
      'Tanggal Kembali',
      'Diperpanjang',
      'Hari Keterlambatan',
      'Denda',
    ]

    const rows = filteredLoans.map((loan) => {
      const fine = calculateLateFine(loan.due_date, loan.returned_at)
      return [
        loan.id,
        loan.userName,
        loan.userEmail,
        loan.bookTitle,
        loan.bookCategory,
        formatDate(loan.created_at),
        formatDate(loan.due_date),
        loan.status,
        formatDate(loan.returned_at),
        loan.renewed ? 'Ya (+7 hari)' : 'Tidak',
        fine.isOverdue ? fine.daysLate : 0,
        fine.formattedFine,
      ]
    })

    exportToCSV('rekap-peminjaman-perpustakaan', headers, rows)
  }

  const handlePrint = () => {
    window.print()
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

  // Perhitungan total denda tertunggak
  let totalPendingFines = 0
  loans.forEach((loan) => {
    if (loan.status === 'dipinjam') {
      const fine = calculateLateFine(loan.due_date)
      if (fine.isOverdue) {
        totalPendingFines += fine.fineAmount
      }
    }
  })

  return (
    <div className="space-y-6">
      {/* Top Bar: Action Buttons & Fine Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div className="flex items-center flex-wrap gap-2">
          {totalPendingFines > 0 && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
              <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Total Denda Tertunggak: {formatRupiah(totalPendingFines)}</span>
            </div>
          )}
          <span className="text-xs text-slate-500 font-medium">
            Total {filteredLoans.length} transaksi peminjaman
          </span>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition cursor-pointer"
            title="Cetak tabel laporan peminjaman"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" aria-hidden="true" />
            <span>Cetak Laporan</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
            title="Ekspor seluruh data peminjaman ke format CSV"
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Ekspor CSV</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div className="relative flex-1 max-w-sm">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <Search className="w-4 h-4 text-slate-500" aria-hidden="true" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari peminjam, email, atau judul buku..."
            aria-label="Cari peminjam, email, atau judul buku"
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
                className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? 'bg-emerald-700 text-white font-semibold'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Printable Report Header */}
      <div className="hidden print:block mb-4 text-center">
        <h1 className="text-xl font-bold text-slate-900">
          Laporan Rekap Peminjaman Perpustakaan
        </h1>
        <p className="text-xs text-slate-600 mt-1">
          Dicetak pada: {formatDate(new Date().toISOString())}
        </p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-600">
              <tr>
                <th scope="col" className="px-6 py-4">Peminjam</th>
                <th scope="col" className="px-6 py-4">Buku</th>
                <th scope="col" className="px-6 py-4">Tgl Pinjam</th>
                <th scope="col" className="px-6 py-4">Jatuh Tempo</th>
                <th scope="col" className="px-6 py-4">Status & Denda</th>
                <th scope="col" className="px-6 py-4 text-right print:hidden">Aksi</th>
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
                  const canExtend =
                    loan.status === 'dipinjam' && !loan.renewed && !isOverdue

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
                        <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                          <span>{loan.bookCategory}</span>
                          {loan.renewed && (
                            <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded-sm">
                              Diperpanjang
                            </span>
                          )}
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
                      <td className="px-6 py-4 whitespace-nowrap text-right print:hidden">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <button
                            type="button"
                            onClick={() => setSelectedReceiptLoan(loan)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-emerald-700 transition cursor-pointer"
                            title="Cetak resi peminjaman resmi"
                          >
                            <Printer className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Resi</span>
                          </button>

                          {loan.status === 'dipinjam' ? (
                            <>
                              {canExtend && (
                                <button
                                  type="button"
                                  onClick={() => handleExtend(loan.id)}
                                  disabled={processingId === loan.id}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-emerald-700 transition cursor-pointer"
                                  title="Perpanjang batas peminjaman 7 hari"
                                >
                                  <CalendarPlus className="w-3.5 h-3.5" aria-hidden="true" />
                                  <span>Perpanjang</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleReturn(loan.id)}
                                disabled={processingId === loan.id}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-700 text-white hover:bg-emerald-800 active:bg-emerald-900 transition cursor-pointer"
                              >
                                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                                <span>Kembalikan</span>
                              </button>
                            </>
                          ) : (
                            <span className="text-xs text-slate-500 font-medium px-2 py-1 bg-slate-100 rounded-lg">
                              {loan.returned_at ? `Kembali ${formatDate(loan.returned_at)}` : 'Selesai'}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-600 text-sm">
                    Tidak ada transaksi peminjaman yang cocok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Loan Receipt Modal */}
      <LoanReceiptModal
        loan={selectedReceiptLoan}
        onClose={() => setSelectedReceiptLoan(null)}
      />
    </div>
  )
}
