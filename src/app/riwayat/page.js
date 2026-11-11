'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import AppSidebar from '@/components/AppSidebar'
import StatusBadge from '@/components/StatusBadge'
import LoanAlertBanner from '@/components/LoanAlertBanner'
import LoanReceiptModal from '@/components/LoanReceiptModal'
import { useDialog } from '@/components/DialogContext'
import {
  fetchLoans,
  returnBookData,
  extendLoanData,
  getSession,
  syncSessionFromSupabase,
  exportToCSV,
} from '@/lib/storage'
import { formatDate, formatRupiah, calculateLateFine } from '@/lib/utils'
import {
  History,
  BookOpen,
  RotateCcw,
  Loader2,
  CalendarPlus,
  Download,
  AlertTriangle,
  Printer,
} from 'lucide-react'

export default function RiwayatPage() {
  const { confirm, alert, toast } = useDialog()
  const [selectedReceiptLoan, setSelectedReceiptLoan] = useState(null)
  const [user, setUser] = useState(() => {
    if (typeof window === 'undefined') return null
    return getSession()
  })
  const [loans, setLoans] = useState([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState(null)

  const loadData = async () => {
    setLoading(true)
    const currentSession = await syncSessionFromSupabase()
    setUser(currentSession)

    if (currentSession) {
      const userLoans = await fetchLoans(currentSession.id)
      setLoans(userLoans)
    } else {
      setLoans([])
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleReturn = async (loanId) => {
    const confirmed = await confirm({
      title: 'Kembalikan Buku',
      message: 'Apakah kamu yakin ingin mengembalikan buku ini ke perpustakaan sekarang?',
      confirmText: 'Ya, Kembalikan',
      cancelText: 'Batal',
      type: 'return',
    })
    if (!confirmed) return

    setProcessingId(loanId)
    const res = await returnBookData(loanId, user)
    setProcessingId(null)

    if (res?.error) {
      await alert({
        title: 'Pengembalian Gagal',
        message: res.error,
        type: 'error',
      })
    } else {
      toast({
        message: 'Buku berhasil dikembalikan!',
        type: 'success',
      })
      await loadData()
    }
  }

  const handleExtend = async (loanId) => {
    const confirmed = await confirm({
      title: 'Perpanjang Peminjaman',
      message: 'Perpanjang batas waktu peminjaman buku ini selama 7 hari tambahan?',
      confirmText: 'Perpanjang (+7 Hari)',
      cancelText: 'Batal',
      type: 'extend',
    })
    if (!confirmed) return

    setProcessingId(loanId)
    const res = await extendLoanData(loanId, user)
    setProcessingId(null)

    if (res?.error) {
      await alert({
        title: 'Perpanjangan Gagal',
        message: res.error,
        type: 'error',
      })
    } else {
      toast({
        message: 'Peminjaman berhasil diperpanjang 7 hari!',
        type: 'success',
      })
      await loadData()
    }
  }

  const handleExportUserLoans = () => {
    if (loans.length === 0) return
    const headers = [
      'ID Peminjaman',
      'Judul Buku',
      'Kategori',
      'Tanggal Pinjam',
      'Jatuh Tempo',
      'Status',
      'Tanggal Kembali',
      'Perpanjangan',
      'Denda Keterlambatan',
    ]

    const rows = loans.map((l) => {
      const fine = calculateLateFine(l.due_date, l.returned_at)
      return [
        l.id,
        l.bookTitle || l.book?.title || 'Buku dihapus',
        l.bookCategory || l.book?.category || '-',
        formatDate(l.created_at),
        formatDate(l.due_date),
        l.status,
        formatDate(l.returned_at),
        l.renewed ? 'Ya (+7 hari)' : 'Tidak',
        fine.formattedFine,
      ]
    })

    exportToCSV(`riwayat-peminjaman-${user?.name || 'user'}`, headers, rows)
  }

  const activeLoans = loans.filter((l) => l.status === 'dipinjam')
  const activeLoansCount = activeLoans.length

  let totalUserFines = 0
  activeLoans.forEach((l) => {
    const fine = calculateLateFine(l.due_date)
    if (fine.isOverdue) {
      totalUserFines += fine.fineAmount
    }
  })

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      <AppSidebar profile={user} />

      <div className="flex-1 flex flex-col min-w-0">
        <main className="p-4 sm:p-8 pb-24 md:pb-8 max-w-6xl w-full mx-auto flex-1 space-y-6">
          {user?.id && <LoanAlertBanner userId={user.id} />}

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

            <div className="flex items-center flex-wrap gap-2.5">
              <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold px-3.5 py-2 rounded-xl">
                <span>Peminjaman Aktif:</span>
                <span className="bg-emerald-700 text-white px-2 py-0.5 rounded-full font-bold">
                  {activeLoansCount} / 3 buku
                </span>
              </div>

              {totalUserFines > 0 && (
                <div className="inline-flex items-center gap-1.5 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold px-3 py-2 rounded-xl">
                  <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Denda Tertunggak: {formatRupiah(totalUserFines)}</span>
                </div>
              )}

              {loans.length > 0 && (
                <button
                  type="button"
                  onClick={handleExportUserLoans}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition cursor-pointer"
                  title="Unduh riwayat peminjaman dalam format CSV"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
                  <span>Ekspor CSV</span>
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500 bg-white rounded-2xl border border-slate-200">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-3" />
              <p className="text-sm">Memuat riwayat peminjaman dari Supabase...</p>
            </div>
          ) : loans.length > 0 ? (
            <div className="space-y-4">
              {/* TAMPILAN MOBILE: Kartu Peminjaman Responsif (md:hidden) */}
              <div className="md:hidden space-y-3">
                {loans.map((loan) => {
                  const isOverdue =
                    loan.status === 'dipinjam' &&
                    new Date(loan.due_date).getTime() < Date.now()
                  const canExtend =
                    loan.status === 'dipinjam' && !loan.renewed && !isOverdue

                  return (
                    <article
                      key={loan.id}
                      className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm leading-snug">
                            {loan.bookTitle || loan.book?.title || 'Buku Perpustakaan'}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-slate-500 font-medium">
                              {loan.bookCategory || loan.book?.category || '-'}
                            </span>
                            {loan.renewed && (
                              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-sm">
                                Diperpanjang
                              </span>
                            )}
                          </div>
                        </div>

                        <StatusBadge
                          status={loan.status}
                          dueDate={loan.due_date}
                          returnedAt={loan.returned_at}
                        />
                      </div>

                      {/* Info Tanggal Pinjam & Jatuh Tempo */}
                      <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                            Tgl Pinjam
                          </span>
                          <span className="font-medium text-slate-800">
                            {formatDate(loan.created_at)}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                            Jatuh Tempo
                          </span>
                          <span className={`font-semibold ${isOverdue ? 'text-red-600' : 'text-slate-900'}`}>
                            {formatDate(loan.due_date)}
                          </span>
                        </div>
                        {loan.returned_at && (
                          <div className="col-span-2 pt-1 border-t border-slate-200/60 text-[11px] text-slate-600">
                            Dikembalikan pada: <strong>{formatDate(loan.returned_at)}</strong>
                          </div>
                        )}
                      </div>

                      {/* Tombol Aksi Mobile (Ukuran tap target >= 44px) */}
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setSelectedReceiptLoan(loan)}
                          className="flex-1 min-h-[44px] px-3 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1.5 shadow-2xs transition cursor-pointer"
                        >
                          <Printer className="w-4 h-4 text-emerald-700" />
                          <span>Resi</span>
                        </button>

                        {loan.status === 'dipinjam' && (
                          <>
                            {canExtend && (
                              <button
                                type="button"
                                onClick={() => handleExtend(loan.id)}
                                disabled={processingId === loan.id}
                                className="flex-1 min-h-[44px] px-3 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-emerald-700 flex items-center justify-center gap-1.5 shadow-2xs transition cursor-pointer"
                              >
                                <CalendarPlus className="w-4 h-4" />
                                <span>Perpanjang</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleReturn(loan.id)}
                              disabled={processingId === loan.id}
                              className="flex-1 min-h-[44px] px-3 rounded-xl text-xs font-semibold bg-emerald-700 text-white hover:bg-emerald-800 flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
                            >
                              <RotateCcw className="w-4 h-4" />
                              <span>Kembalikan</span>
                            </button>
                          </>
                        )}
                      </div>
                    </article>
                  )
                })}
              </div>

              {/* TAMPILAN DESKTOP: Tabel Riwayat Lengkap (hidden md:block) */}
              <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-700">
                    <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-600">
                      <tr>
                        <th scope="col" className="px-6 py-4">Buku</th>
                        <th scope="col" className="px-6 py-4">Tgl Pinjam</th>
                        <th scope="col" className="px-6 py-4">Jatuh Tempo</th>
                        <th scope="col" className="px-6 py-4">Status & Denda</th>
                        <th scope="col" className="px-6 py-4">Tgl Kembali</th>
                        <th scope="col" className="px-6 py-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {loans.map((loan) => {
                        const isOverdue =
                          loan.status === 'dipinjam' &&
                          new Date(loan.due_date).getTime() < Date.now()
                        const canExtend =
                          loan.status === 'dipinjam' && !loan.renewed && !isOverdue

                        return (
                          <tr key={loan.id} className="hover:bg-emerald-50/40 transition">
                            <td className="px-6 py-4">
                              <div className="font-semibold text-slate-900">
                                {loan.bookTitle || loan.book?.title || 'Buku tidak ditemukan'}
                              </div>
                              <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                                <span>{loan.bookCategory || loan.book?.category || '-'}</span>
                                {loan.renewed && (
                                  <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-sm">
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
                            <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                              {formatDate(loan.returned_at)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
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
                                        title="Perpanjang masa pinjam +7 hari"
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
                                  <span className="text-xs text-emerald-700 font-semibold px-2 py-1 bg-emerald-50 rounded-lg">
                                    Selesai
                                  </span>
                                )}
                              </div>
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
            /* Empty State */
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto shadow-xs">
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
                className="mt-5 inline-flex items-center px-4 py-2 rounded-xl bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 transition cursor-pointer"
              >
                Jelajahi Katalog Buku
              </Link>
            </div>
          )}
        </main>
      </div>

      {/* Loan Receipt Modal */}
      <LoanReceiptModal
        loan={selectedReceiptLoan}
        onClose={() => setSelectedReceiptLoan(null)}
      />
    </div>
  )
}
