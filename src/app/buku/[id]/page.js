'use client'

import { useState, useEffect, Suspense } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import AppSidebar from '@/components/AppSidebar'
import {
  fetchBookById,
  fetchLoans,
  borrowBookData,
  getSession,
  syncSessionFromSupabase,
  resolveBookCover,
  fetchReviews,
  addReview,
  fetchFavorites,
  toggleFavorite,
} from '@/lib/storage'
import { formatDate } from '@/lib/utils'
import {
  BookOpen,
  ArrowLeft,
  Calendar,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Bookmark,
  Star,
  QrCode,
  Copy,
  Check,
  MessageSquare,
} from 'lucide-react'

function BookDetailContent() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id

  const [book, setBook] = useState(null)
  const [user, setUser] = useState(null)
  const [isAlreadyBorrowed, setIsAlreadyBorrowed] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Reviews state
  const [reviewsData, setReviewsData] = useState({ reviews: [], averageRating: 0, totalReviews: 0 })
  const [ratingInput, setRatingInput] = useState(5)
  const [commentInput, setCommentInput] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewMsg, setReviewMsg] = useState('')

  // Inventory barcode copied state
  const [copiedCode, setCopiedCode] = useState(false)

  useEffect(() => {
    if (!id) return
    let isMounted = true

    async function loadData() {
      setInitialLoading(true)
      const currentSession = await syncSessionFromSupabase()
      setUser(currentSession)

      const [b, loans, revs, favs] = await Promise.all([
        fetchBookById(id),
        currentSession ? fetchLoans(currentSession.id) : Promise.resolve([]),
        fetchReviews(id),
        currentSession ? fetchFavorites(currentSession.id) : Promise.resolve([]),
      ])

      if (isMounted) {
        setBook(b)
        setReviewsData(revs)
        if (currentSession && loans) {
          const active = loans.some(
            (l) =>
              Number(l.book_id) === Number(id) &&
              l.status === 'dipinjam'
          )
          setIsAlreadyBorrowed(active)
        }
        if (favs) {
          setIsFavorite(favs.includes(Number(id)))
        }
        setInitialLoading(false)
      }
    }

    loadData()

    return () => {
      isMounted = false
    }
  }, [id])

  const handleBorrow = async () => {
    setErrorMsg('')
    setSuccessMsg('')
    setLoading(true)

    const res = await borrowBookData(id, user)
    setLoading(false)

    if (res.error) {
      setErrorMsg(res.error)
    } else {
      setSuccessMsg('Buku berhasil dipinjam! Silakan cek di menu Riwayat.')
      setIsAlreadyBorrowed(true)
      const updated = await fetchBookById(id)
      setBook(updated)
    }
  }

  const handleToggleFav = async () => {
    if (!user) {
      alert('Silakan login terlebih dahulu untuk menyimpan buku favorit.')
      return
    }
    const res = await toggleFavorite(id, user.id)
    if (res.success) {
      setIsFavorite(res.isFavorite)
    }
  }

  const handleReviewSubmit = async (e) => {
    e.preventDefault()
    if (!user) {
      alert('Silakan login terlebih dahulu untuk menulis ulasan.')
      return
    }
    setSubmittingReview(true)
    setReviewMsg('')

    const res = await addReview({
      bookId: id,
      rating: ratingInput,
      comment: commentInput,
      user,
    })

    setSubmittingReview(false)
    if (res?.error) {
      setReviewMsg(res.error)
    } else {
      setCommentInput('')
      setReviewMsg('Ulasan berhasil dikirim!')
      const updatedRevs = await fetchReviews(id)
      setReviewsData(updatedRevs)
    }
  }

  const inventoryCode = `INV-PERPUS-${String(id).padStart(4, '0')}`

  const handleCopyInventory = () => {
    navigator.clipboard?.writeText(inventoryCode)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center flex flex-col items-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-3" />
          <p className="text-slate-500 text-sm">Memuat informasi buku dari Supabase...</p>
        </div>
      </div>
    )
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-slate-500 mb-4">Buku tidak ditemukan</p>
          <Link
            href="/"
            className="px-4 py-2 rounded-xl bg-emerald-700 text-white text-xs font-semibold"
          >
            Kembali ke Katalog
          </Link>
        </div>
      </div>
    )
  }

  const isOutOfStock = book.stock <= 0

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      <AppSidebar profile={user} />

      <div className="flex-1 flex flex-col min-w-0">
        <main className="max-w-5xl mx-auto px-4 py-8 flex-1 w-full space-y-8">
          {/* Header Action: Kembali & Bookmark */}
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-emerald-700 transition"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              <span>Kembali ke Katalog</span>
            </Link>

            {user && (
              <button
                type="button"
                onClick={handleToggleFav}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition shadow-2xs cursor-pointer ${
                  isFavorite
                    ? 'bg-emerald-700 text-white border-emerald-700'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Bookmark className={`w-3.5 h-3.5 ${isFavorite ? 'fill-white' : ''}`} aria-hidden="true" />
                <span>{isFavorite ? 'Tersimpan di Favorit' : 'Tambah ke Favorit'}</span>
              </button>
            )}
          </div>

          {/* Card Detail Buku (2 Kolom) */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden grid grid-cols-1 md:grid-cols-12">
            {/* Kolom Kiri: Cover Image Viewport */}
            <div className="md:col-span-5 bg-gradient-to-b from-slate-50 via-white to-slate-100/60 p-8 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-200">
              <div className="relative h-72 sm:h-84 w-full flex items-center justify-center mb-5">
                <img
                  src={resolveBookCover(book)}
                  alt={`Sampul buku ${book.title}`}
                  className="max-h-full max-w-full object-contain drop-shadow-2xl transition-transform duration-300 hover:scale-103"
                />
              </div>
              <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3.5 py-1 rounded-full uppercase tracking-wider">
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

                  {/* Rating Stars Summary */}
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center text-amber-500">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= Math.round(reviewsData.averageRating)
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-200'
                          }`}
                          aria-hidden="true"
                        />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-slate-800">
                      {reviewsData.averageRating > 0 ? reviewsData.averageRating : 'Belum ada rating'}
                    </span>
                    <span className="text-xs text-slate-400">
                      ({reviewsData.totalReviews} ulasan)
                    </span>
                  </div>
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
                    <span>Durasi pinjam: <strong>7 hari</strong> sejak tanggal transaksi.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                    <span>Maksimal <strong>3 buku aktif</strong> per akun peminjam.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                    <span>Denda keterlambatan: <strong>Rp1.000 / hari</strong> setelah jatuh tempo.</span>
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
                        Kamu dapat mengembalikan atau memperpanjang buku ini di halaman Riwayat.
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
                      className="w-full sm:w-auto px-8 h-12 rounded-xl bg-emerald-700 text-white font-medium text-sm hover:bg-emerald-800 active:bg-emerald-900 disabled:opacity-50 transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
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

          {/* Section: Inventaris Digital & Barcode Koleksi */}
          <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center flex-shrink-0">
                  <QrCode className="w-5 h-5" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Identitas Inventaris Digital Perpustakaan
                  </h2>
                  <p className="text-xs text-slate-500">
                    Kode verifikasi unik untuk sirkulasi fisik dan pencatatan buku.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <code className="text-xs font-mono font-bold bg-slate-100 text-slate-800 px-3 py-1.5 rounded-lg border border-slate-200">
                  {inventoryCode}
                </code>
                <button
                  type="button"
                  onClick={handleCopyInventory}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
                  title="Salin kode inventaris"
                  aria-label="Salin kode inventaris"
                >
                  {copiedCode ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Visual Barcode SVG */}
            <div className="pt-5 flex flex-col items-center justify-center">
              <div className="bg-white p-3 border border-slate-200 rounded-xl flex flex-col items-center">
                <svg className="w-56 h-12" viewBox="0 0 200 40">
                  <rect x="0" y="0" width="200" height="40" fill="#ffffff" />
                  {[2, 7, 11, 14, 18, 24, 28, 31, 36, 42, 45, 50, 54, 59, 64, 70, 75, 80, 85, 91, 95, 101, 106, 112, 118, 124, 130, 135, 140, 146, 152, 158, 164, 170, 176, 182, 188, 194].map((x, i) => (
                    <rect
                      key={x}
                      x={x}
                      y="4"
                      width={i % 3 === 0 ? 3 : i % 2 === 0 ? 2 : 1}
                      height="32"
                      fill="#0f172a"
                    />
                  ))}
                </svg>
                <span className="text-[10px] font-mono tracking-widest text-slate-500 mt-1">
                  *{inventoryCode}*
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Pindai kode barcode saat verifikasi pengembalian di meja sirkulasi.
              </p>
            </div>
          </section>

          {/* Section: Ulasan & Rating Pembaca */}
          <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <MessageSquare className="w-5 h-5 text-emerald-700" aria-hidden="true" />
                <h2 className="text-base font-bold text-slate-900">
                  Ulasan & Rating Pembaca
                </h2>
              </div>
              <span className="text-xs text-slate-500">
                {reviewsData.totalReviews} ulasan terkumpul
              </span>
            </div>

            {/* Form Tulis Review (Jika Login) */}
            {user ? (
              <form onSubmit={handleReviewSubmit} className="space-y-4 bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Beri Rating & Ulasan Buku
                </h3>

                {reviewMsg && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                    {reviewMsg}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600">Pilih Bintang:</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRatingInput(star)}
                        className="p-1 hover:scale-110 transition cursor-pointer"
                        aria-label={`Beri ${star} bintang`}
                      >
                        <Star
                          className={`w-5 h-5 ${
                            star <= ratingInput
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <span className="text-xs font-bold text-amber-700 ml-1">
                    {ratingInput} dari 5
                  </span>
                </div>

                <div>
                  <textarea
                    rows="3"
                    required
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    placeholder="Bagikan pendapatmu tentang alur cerita, wawasan, atau manfaat buku ini..."
                    className="w-full p-3.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="px-5 py-2 rounded-xl bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 active:bg-emerald-900 disabled:opacity-50 transition cursor-pointer"
                  >
                    {submittingReview ? 'Mengirim...' : 'Kirim Ulasan'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-600">
                <Link href="/login" className="text-emerald-700 font-semibold hover:underline">
                  Login ke akunmu
                </Link>{' '}
                untuk menulis rating dan ulasan pada buku ini.
              </div>
            )}

            {/* List Reviews */}
            <div className="space-y-4 pt-2">
              {reviewsData.reviews.length > 0 ? (
                reviewsData.reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-4 rounded-2xl border border-slate-100 bg-white hover:bg-slate-50/50 transition space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
                          {rev.userName?.charAt(0).toUpperCase() || 'P'}
                        </div>
                        <span className="text-xs font-bold text-slate-900">
                          {rev.userName}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center text-amber-500">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3 h-3 ${
                                s <= rev.rating
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-slate-200'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {formatDate(rev.created_at)}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed pl-9">
                      {rev.comment}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-center text-xs text-slate-500 py-6">
                  Belum ada ulasan untuk buku ini. Jadilah pembaca pertama yang mengulas!
                </p>
              )}
            </div>
          </section>
        </main>
      </div>
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
