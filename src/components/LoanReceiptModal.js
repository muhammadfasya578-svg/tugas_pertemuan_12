'use client'

import { formatDate, calculateLateFine } from '@/lib/utils'
import { formatMemberId } from '@/lib/storage'
import { Printer, X, BookOpen, CheckCircle, AlertTriangle, ShieldCheck } from 'lucide-react'

export default function LoanReceiptModal({ loan, onClose }) {
  if (!loan) return null

  const fine = calculateLateFine(loan.due_date, loan.returned_at)
  const receiptNo = `REC-${loan.id}-${new Date(loan.created_at || Date.now()).getFullYear()}`

  const handlePrint = () => {
    window.print()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col print:shadow-none print:border-none print:m-0 print:w-full print:max-w-none print:max-h-none"
      >
        {/* Modal Top Actions (Hidden in Print) */}
        <div className="print:hidden flex items-center justify-between px-4 sm:px-5 py-2.5 border-b border-slate-100 bg-slate-50/80 flex-shrink-0">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
            <span>Resi Peminjaman</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-2xs transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Resi</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition cursor-pointer"
              aria-label="Tutup resi"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper Container (Scrollable if screen is very short) */}
        <div className="p-4 sm:p-5 space-y-3.5 text-slate-800 overflow-y-auto">
          {/* Header */}
          <div className="text-center pb-3 border-b border-dashed border-slate-300">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <div className="w-6 h-6 rounded-lg bg-emerald-700 text-white flex items-center justify-center shadow-xs">
                <BookOpen className="w-3.5 h-3.5" />
              </div>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                THE BOOKS DIGITAL LIBRARY
              </h2>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Sistem Peminjaman & Sirkulasi Koleksi Buku Digital
            </p>
            <div className="mt-1.5 inline-block px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-mono font-bold">
              {receiptNo}
            </div>
          </div>

          {/* Info Peminjam & Transaksi */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-400 block font-semibold uppercase text-[9px]">
                Nama Peminjam
              </span>
              <span className="font-bold text-slate-900 text-xs sm:text-sm truncate block">
                {loan.userName || loan.user?.name || 'Pengguna Perpustakaan'}
              </span>
              <span className="text-slate-500 block text-[10px] font-mono truncate">
                {loan.userEmail || loan.user?.email || '-'}
              </span>
            </div>

            <div className="text-right">
              <span className="text-slate-400 block font-semibold uppercase text-[9px]">
                Tanggal Transaksi
              </span>
              <span className="font-bold text-slate-900 text-xs">
                {formatDate(loan.created_at)}
              </span>
              <span className="text-slate-500 block text-[10px]">
                Status:{' '}
                <strong className={loan.status === 'dikembalikan' ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                  {loan.status === 'dikembalikan' ? 'Dikembalikan' : 'Dipinjam'}
                </strong>
              </span>
            </div>
          </div>

          {/* Tabel Buku */}
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[9px] font-bold uppercase text-emerald-800 tracking-wider block">
                  Buku yang Dipinjam
                </span>
                <h3 className="font-bold text-slate-900 text-sm leading-tight mt-0.5 truncate">
                  {loan.bookTitle || loan.book?.title || 'Buku Perpustakaan'}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                  {loan.book?.author ? `Karya ${loan.book.author} • ` : ''}Kategori: {loan.bookCategory || loan.book?.category || '-'}
                </p>
              </div>

              <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-mono font-bold text-slate-700 flex-shrink-0">
                1 Eks
              </span>
            </div>
          </div>

          {/* Batas Waktu & Keterlambatan */}
          <div className="space-y-1.5 text-xs border-t border-b border-dashed border-slate-300 py-2.5">
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-slate-500">Masa Pinjam:</span>
              <span className="font-semibold text-slate-800">7 Hari Kalender</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 text-[11px]">Jatuh Tempo:</span>
              <span className="font-bold text-emerald-800 text-xs sm:text-sm">
                {formatDate(loan.due_date)}
              </span>
            </div>
            {loan.renewed && (
              <div className="flex justify-between items-center text-emerald-700 text-[11px]">
                <span>Perpanjangan:</span>
                <span className="font-semibold">+7 Hari (Digunakan)</span>
              </div>
            )}
            {loan.returned_at && (
              <div className="flex justify-between items-center text-slate-600 text-[11px]">
                <span>Tgl Kembali:</span>
                <span className="font-semibold">{formatDate(loan.returned_at)}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-1.5 border-t border-slate-200">
              <span className="text-slate-700 font-semibold text-[11px]">Denda:</span>
              <span
                className={`font-mono font-bold text-xs ${
                  fine.isOverdue ? 'text-red-600' : 'text-slate-800'
                }`}
              >
                {fine.isOverdue ? `${fine.formattedFine} (${fine.daysLate} hari)` : 'Rp0 (Tepat Waktu)'}
              </span>
            </div>
          </div>

          {/* Barcode & Verification */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-1.5">
              <div className="flex items-end h-5 gap-0.5" aria-hidden="true">
                {[2, 4, 1, 3, 2, 4, 1, 3, 2, 1, 4, 2, 3, 1, 2, 4, 1, 3].map(
                  (h, i) => (
                    <div
                      key={i}
                      className={`w-0.5 bg-slate-900 ${
                        h === 1
                          ? 'h-2.5'
                          : h === 2
                          ? 'h-3.5'
                          : h === 3
                          ? 'h-4.5'
                          : 'h-5'
                      }`}
                    />
                  )
                )}
              </div>
              <span className="text-[9px] font-mono text-slate-500 font-bold ml-1">
                {receiptNo}
              </span>
            </div>

            <div className="text-right text-[10px] text-slate-500">
              <div className="flex items-center justify-end gap-1 text-emerald-700 font-semibold">
                <ShieldCheck className="w-3 h-3" />
                <span>Terverifikasi Digital</span>
              </div>
              <span>The Books Digital Library</span>
            </div>
          </div>

          {/* Footer Note */}
          <p className="text-[9px] text-center text-slate-400 leading-normal pt-1">
            Simpan bukti ini sebagai bukti peminjaman sah. Keterlambatan dikenakan denda Rp1.000/hari.
          </p>
        </div>
      </div>
    </div>
  )
}
