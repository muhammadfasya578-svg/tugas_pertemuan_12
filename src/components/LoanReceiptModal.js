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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 print:shadow-none print:border-none print:m-0 print:w-full print:max-w-none"
      >
        {/* Modal Top Actions (Hidden in Print) */}
        <div className="print:hidden flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wider">
            <BookOpen className="w-4 h-4 text-emerald-600" />
            <span>Resi Peminjaman Resmi</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Resi</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              aria-label="Tutup resi"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper Container */}
        <div className="p-6 sm:p-8 space-y-6 text-slate-800">
          {/* Header */}
          <div className="text-center pb-6 border-b border-dashed border-slate-300">
            <div className="w-12 h-12 rounded-2xl bg-emerald-700 text-white mx-auto flex items-center justify-center mb-2.5 shadow-xs">
              <BookOpen className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              THE BOOKS DIGITAL LIBRARY
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Sistem Peminjaman & Sirkulasi Koleksi Buku Digital
            </p>
            <div className="mt-3 inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-mono font-bold tracking-wider">
              {receiptNo}
            </div>
          </div>

          {/* Info Peminjam & Transaksi */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block font-semibold uppercase text-[10px]">
                Nama Peminjam
              </span>
              <span className="font-bold text-slate-900 text-sm">
                {loan.userName || loan.user?.name || 'Pengguna Perpustakaan'}
              </span>
              <span className="text-slate-500 block text-[11px] font-mono">
                {loan.userEmail || loan.user?.email || '-'}
              </span>
            </div>

            <div className="text-right">
              <span className="text-slate-400 block font-semibold uppercase text-[10px]">
                Tanggal Transaksi
              </span>
              <span className="font-bold text-slate-900">
                {formatDate(loan.created_at)}
              </span>
              <span className="text-slate-500 block text-[11px]">
                Status:{' '}
                <strong className={loan.status === 'dikembalikan' ? 'text-emerald-700' : 'text-amber-700'}>
                  {loan.status === 'dikembalikan' ? 'Dikembalikan' : 'Dipinjam'}
                </strong>
              </span>
            </div>
          </div>

          {/* Tabel Buku */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase text-emerald-800 tracking-wider block">
                  Buku yang Dipinjam
                </span>
                <h3 className="font-bold text-slate-900 text-base leading-tight mt-0.5">
                  {loan.bookTitle || loan.book?.title || 'Buku Perpustakaan'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Karya {loan.book?.author || '-'} &bull; Kategori: {loan.bookCategory || loan.book?.category || '-'}
                </p>
              </div>

              <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-mono font-bold text-slate-700">
                1 Eksemplar
              </span>
            </div>
          </div>

          {/* Batas Waktu & Keterlambatan */}
          <div className="space-y-2 text-xs border-t border-b border-dashed border-slate-300 py-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Masa Pinjam Standar:</span>
              <span className="font-semibold text-slate-800">7 Hari Kalender</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Batas Waktu Pengembalian:</span>
              <span className="font-bold text-emerald-800 text-sm">
                {formatDate(loan.due_date)}
              </span>
            </div>
            {loan.renewed && (
              <div className="flex justify-between items-center text-emerald-700">
                <span>Perpanjangan Masa Pinjam:</span>
                <span className="font-semibold">+7 Hari Tambahan (Sudah Digunakan)</span>
              </div>
            )}
            {loan.returned_at && (
              <div className="flex justify-between items-center text-slate-600">
                <span>Tanggal Dikembalikan:</span>
                <span className="font-semibold">{formatDate(loan.returned_at)}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-2 border-t border-slate-200">
              <span className="text-slate-700 font-semibold">Denda Keterlambatan:</span>
              <span
                className={`font-mono font-bold text-sm ${
                  fine.isOverdue ? 'text-red-600' : 'text-slate-800'
                }`}
              >
                {fine.isOverdue ? `${fine.formattedFine} (${fine.daysLate} hari)` : 'Rp0 (Tepat Waktu)'}
              </span>
            </div>
          </div>

          {/* Barcode & Verification */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-1.5">
              <div className="flex items-end h-8 gap-0.5" aria-hidden="true">
                {[2, 4, 1, 3, 2, 4, 1, 3, 2, 1, 4, 2, 3, 1, 2, 4, 1, 3, 2, 4, 1].map(
                  (h, i) => (
                    <div
                      key={i}
                      className={`w-0.5 bg-slate-900 ${
                        h === 1
                          ? 'h-4'
                          : h === 2
                          ? 'h-6'
                          : h === 3
                          ? 'h-7'
                          : 'h-8'
                      }`}
                    />
                  )
                )}
              </div>
              <span className="text-[10px] font-mono text-slate-500 font-bold ml-1">
                {receiptNo}
              </span>
            </div>

            <div className="text-center sm:text-right text-[11px] text-slate-500">
              <div className="flex items-center justify-center sm:justify-end gap-1 text-emerald-700 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Validasi Digital Sistem</span>
              </div>
              <span>The Books Digital Library</span>
            </div>
          </div>

          {/* Footer Note */}
          <p className="text-[10px] text-center text-slate-400 leading-normal pt-2">
            Harap simpan struk ini sebagai bukti peminjaman sah. Keterlambatan pengembalian buku dikenakan denda Rp1.000 per hari.
          </p>
        </div>
      </div>
    </div>
  )
}
