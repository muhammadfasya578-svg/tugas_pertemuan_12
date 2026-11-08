'use client'

import { useState, useEffect, Suspense } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { getBookById, getLoans, borrowBookData, getSession } from '@/lib/storage'
import {
  BookOpen,
  ArrowLeft,
  Calendar,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react'

function BookDetailContent() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id

  const [book, setBook] = useState(null)
  const [user, setUser] = useState(null)
  const [isAlreadyBorrowed, setIsAlreadyBorrowed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    if (!id) return
    const currentSession = getSession()
    setUser(currentSession)

    const b = getBookById(id)
    setBook(b)

    if (currentSession) {
      const loans = getLoans()
      const active = loans.some(
        (l) =>
          l.user_id === currentSession.id &&
          Number(l.book_id) === Number(id) &&
          l.status === 'dipinjam'
      )
      setIsAlreadyBorrowed(active)
    }
  }, [id])

  const handleBorrow = () => {
    setErrorMsg('')
    setSuccessMsg('')
    setLoading(true)

    const res = borrowBookData(id, user)
    setLoading(false)

    if (res.error) {
      setErrorMsg(res.error)
    } else {
      setSuccessMsg('Buku berhasil dipinjam! Silakan cek di menu Riwayat.')
      setIsAlreadyBorrowed(true)
      setBook(getBookById(id))
    }
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-slate-500 mb-4">Buku tidak ditemukan</p>
          <Link
            href="/"
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold"
          >
            Kembali ke Katalog
          </Link>
        </div>
      </div>
    )
  }

  const isOutOfStock = book.stock <= 0

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar profile={user} />

      <main className="max-w-5xl mx-auto px-4 py-8 flex-1 w-full">
        {/* Tombol Kembali */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-emerald-700 transition mb-6"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Kembali ke Katalog</span>
        </Link>

        {/* Card Detail Buku (2 Kolom) */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden grid grid-cols-1 md:grid-cols-12">
          {/* Kolom Kiri: Cover Placeholder */}
          <div className="md:col-span-5 bg-slate-50 p-8 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-200">
            <div className="w-28 h-28 rounded-3xl bg-white shadow-sm flex items-center justify-center text-emerald-700 mb-4">
              <BookOpen className="w-14 h-14" aria-hidden="true" />
            </div>
            <span className="text-xs font-semibold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full uppercase tracking-wider">
              {book.category}
            </span>
          </div>

          {/* Kolom Kanan: Info & Aksi */}
          <div className="md:col-span-7 p-6 sm:p-10 flex flex-col justify-between">
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">
                  {book.title}
                </h1>
                <p className="text-base text-slate-600 mt-1">
                  Penulis: <span className="font-medium text-slate-800">{book.author}</span>
                </p>
              </div>

              {/* Status Stok */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-600">Ketersediaan Stok:</span>
                {book.stock > 0 ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
                    Tersedia ({book.stock} eksemplar)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                    Stok Habis
                  </span>
                )}
              </div>

              {/* Aturan Peminjaman Box */}
              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-2.5 text-xs text-slate-600">
                <div className="flex items-center gap-2 font-semibold text-slate-800">
                  <ShieldAlert className="w-4 h-4 text-emerald-700" aria-hidden="true" />
                  <span>Ketentuan Peminjaman:</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                  <span>Durasi peminjaman: <strong>7 hari</strong> sejak tanggal peminjaman.</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                  <span>Maksimal <strong>3 buku aktif</strong> per akun peminjam.</span>
                </div>
              </div>
            </div>

            {/* Tombol Pinjam */}
            <div className="mt-8 pt-6 border-t border-slate-100">
              {isAlreadyBorrowed ? (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-sm flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-700 mt-0.5" aria-hidden="true" />
                  <div>
                    <p className="font-semibold">Buku ini sedang kamu pinjam</p>
                    <p className="text-xs text-amber-700 mt-0.5">
                      Kamu dapat mengembalikan buku ini di halaman Riwayat.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {errorMsg && (
                    <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2.5" role="alert">
                      <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600 mt-0.5" aria-hidden="true" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  {successMsg && (
                    <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-2.5" role="status">
                      <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-700 mt-0.5" aria-hidden="true" />
                      <span>{successMsg}</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleBorrow}
                    disabled={isOutOfStock || loading}
                    className="w-full sm:w-auto px-8 h-12 rounded-xl bg-emerald-700 text-white font-medium text-sm hover:bg-emerald-800 active:bg-emerald-900 disabled:opacity-50 transition flex items-center justify-center gap-2 shadow-xs"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                        <span>Memproses...</span>
                      </>
                    ) : isOutOfStock ? (
                      'Stok Habis'
                    ) : (
                      <>
                        <BookOpen className="w-4 h-4" aria-hidden="true" />
                        <span>Pinjam Buku Ini</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function BookDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <p className="text-slate-500 text-sm">Memuat detail buku...</p>
        </div>
      }
    >
      <BookDetailContent />
    </Suspense>
  )
}
