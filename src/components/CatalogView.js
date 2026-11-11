'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import BookCard from '@/components/BookCard'
import Dropdown from '@/components/Dropdown'
import LoanAlertBanner from '@/components/LoanAlertBanner'
import { useDialog } from '@/components/DialogContext'
import { resolveBookCover, fetchFavorites, toggleFavorite } from '@/lib/storage'
import { Search, BookX, X, ArrowRight, Bookmark } from 'lucide-react'

export default function CatalogView({ initialBooks, initialCategories = [], user = null }) {
  const { confirm, alert, toast } = useDialog()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Semua')
  const [favoriteIds, setFavoriteIds] = useState([])
  const [onlyFavorites, setOnlyFavorites] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('favorite') === 'true') {
        setOnlyFavorites(true)
      }
    }
  }, [])

  useEffect(() => {
    if (!user?.id) return
    let isMounted = true

    async function loadFavs() {
      const favs = await fetchFavorites(user.id)
      if (isMounted) {
        setFavoriteIds(favs)
      }
    }

    loadFavs()
    return () => {
      isMounted = false
    }
  }, [user?.id])

  const handleToggleFavorite = async (bookId) => {
    if (!user) {
      const goToLogin = await confirm({
        title: 'Login Diperlukan',
        message: 'Silakan login terlebih dahulu untuk menyimpan buku favorit ke koleksimu.',
        confirmText: 'Ke Halaman Login',
        cancelText: 'Nanti Saja',
        type: 'primary',
      })
      if (goToLogin) {
        window.location.href = '/login'
      }
      return
    }
    const res = await toggleFavorite(bookId, user.id)
    if (res.success) {
      if (res.isFavorite) {
        setFavoriteIds((prev) => Array.from(new Set([...prev, Number(bookId)])))
        toast({ message: 'Buku disimpan ke Favorit', type: 'success' })
      } else {
        setFavoriteIds((prev) => prev.filter((id) => id !== Number(bookId)))
        toast({ message: 'Buku dihapus dari Favorit', type: 'info' })
      }
    }
  }

  // Kategori murni dari database kategori (dengan fallback ke kategori buku jika kosong)
  const categories = useMemo(() => {
    if (initialCategories && initialCategories.length > 0) {
      const dbCatNames = initialCategories.map((c) => (typeof c === 'string' ? c : c.name)).filter(Boolean)
      return ['Semua', ...Array.from(new Set(dbCatNames))]
    }
    const cats = new Set(initialBooks.map((b) => b.category).filter(Boolean))
    return ['Semua', ...Array.from(cats)]
  }, [initialBooks, initialCategories])

  // Opsi dropdown kategori dengan label yang rapi
  const categoryOptions = useMemo(() => {
    return categories.map((cat) => ({
      value: cat,
      label: cat === 'Semua' ? 'Semua Kategori' : cat,
    }))
  }, [categories])

  // Filter buku berdasarkan search query, kategori terpilih, dan filter favorit
  const filteredBooks = useMemo(() => {
    return initialBooks.filter((book) => {
      const matchSearch =
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(searchQuery.toLowerCase())

      const matchCategory =
        selectedCategory === 'Semua' || book.category === selectedCategory

      const matchFavorite = !onlyFavorites || favoriteIds.includes(Number(book.id))

      return matchSearch && matchCategory && matchFavorite
    })
  }, [initialBooks, searchQuery, selectedCategory, onlyFavorites, favoriteIds])

  // Buku rekomendasi terpopuler / tersedia untuk rak atas
  const recommendedBooks = useMemo(() => {
    return initialBooks.filter((b) => b.stock > 0).slice(0, 4)
  }, [initialBooks])

  const isFiltering =
    searchQuery.trim().length > 0 || selectedCategory !== 'Semua' || onlyFavorites

  return (
    <div className="space-y-10">
      {/* Due Date Alert Banner if user has active loans */}
      {user?.id && <LoanAlertBanner userId={user.id} />}

      {/* Top Header: Discover Title & Search Bar */}
      <section
        aria-label="Pencarian dan penjelajahan buku"
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 pb-2"
      >
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Jelajahi Buku
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Temukan dan pinjam bacaan favoritmu dari koleksi perpustakaan.
          </p>
        </div>

        {/* Unified Search Pill (Category Dropdown + Search Input + Button) */}
        <div className="w-full lg:max-w-xl bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-1.5 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Custom Category Dropdown */}
          <div className="flex-shrink-0">
            <Dropdown
              options={categoryOptions}
              value={selectedCategory}
              onChange={(val) => {
                setSelectedCategory(val)
                setOnlyFavorites(false)
              }}
              className="w-full sm:w-auto"
            />
          </div>

          <div className="hidden sm:block w-px h-6 bg-slate-200" aria-hidden="true" />

          {/* Search Input Field */}
          <div className="relative flex-1 flex items-center">
            <Search className="w-4 h-4 text-slate-400 ml-2.5 mr-2 flex-shrink-0" aria-hidden="true" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari judul buku atau penulis..."
              aria-label="Cari judul buku atau nama penulis"
              className="w-full text-xs sm:text-sm bg-transparent placeholder-slate-400 text-slate-900 focus:outline-none py-1.5 pr-8"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-2 flex items-center text-slate-400 hover:text-slate-600"
                aria-label="Hapus kata kunci pencarian"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Favorite filter toggle */}
          {user && (
            <button
              type="button"
              onClick={() => setOnlyFavorites(!onlyFavorites)}
              className={`min-h-[40px] px-3.5 rounded-xl font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer ${
                onlyFavorites
                  ? 'bg-emerald-700 text-white'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
              }`}
              title="Tampilkan hanya buku favorit"
            >
              <Bookmark className={`w-3.5 h-3.5 ${onlyFavorites ? 'fill-white' : ''}`} aria-hidden="true" />
              <span className="hidden sm:inline">Favorit ({favoriteIds.length})</span>
            </button>
          )}
        </div>
      </section>

      {/* Section 1: Rekomendasi Buku - Tampil saat tidak sedang mencari */}
      {!isFiltering && recommendedBooks.length > 0 && (
        <section aria-label="Rekomendasi buku unggulan" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">
              Rekomendasi Buku
            </h2>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('Semua')
                setOnlyFavorites(false)
              }}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>Lihat semua</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>

          {/* Physical Standing Book Showcase */}
          <div className="bg-gradient-to-b from-slate-100/70 via-slate-50 to-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 items-end">
              {recommendedBooks.map((book) => (
                <Link
                  key={book.id}
                  href={`/buku/${book.id}`}
                  className="group flex flex-col items-center text-center focus:outline-none"
                  aria-label={`Lihat buku ${book.title}`}
                >
                  <div className="relative h-48 sm:h-56 w-full flex items-center justify-center transition-transform duration-300 ease-out group-hover:-translate-y-2.5 group-hover:scale-105">
                    <img
                      src={resolveBookCover(book)}
                      alt={`Sampul buku ${book.title}`}
                      className="max-h-full max-w-full object-contain drop-shadow-xl"
                    />
                  </div>

                  <div className="mt-4 w-full px-1">
                    <h3 className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors text-xs sm:text-sm line-clamp-1 capitalize" title={book.title}>
                      {book.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5 capitalize">
                      {book.author}
                    </p>
                    <span className="inline-block mt-1.5 text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/80">
                      Sisa {book.stock} buku
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Section 2: Kategori Buku & Daftar Lengkap */}
      <section
        id="kategori-section"
        aria-label="Daftar koleksi buku lengkap"
        className="space-y-5 scroll-mt-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {onlyFavorites
                ? 'Buku Favorit Tersimpan'
                : isFiltering
                ? 'Hasil Pencarian Koleksi'
                : 'Kategori Buku'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {onlyFavorites
                ? 'Daftar buku yang telah Anda bookmark untuk dibaca nanti.'
                : 'Pilih kategori atau jelajahi seluruh koleksi buku perpustakaan.'}
            </p>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Menampilkan <strong className="text-slate-900 font-bold">{filteredBooks.length}</strong> dari {initialBooks.length} buku
          </div>
        </div>

        {/* Category Pill Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat && !onlyFavorites
            return (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat)
                  setOnlyFavorites(false)
                }}
                className={`min-h-[38px] px-4 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {cat}
              </button>
            )
          })}

          {user && (
            <button
              type="button"
              onClick={() => setOnlyFavorites(!onlyFavorites)}
              className={`min-h-[38px] px-4 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                onlyFavorites
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${onlyFavorites ? 'fill-white' : ''}`} aria-hidden="true" />
              <span>Favorit Saya ({favoriteIds.length})</span>
            </button>
          )}
        </div>

        {/* Books Grid */}
        {filteredBooks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pt-2">
            {filteredBooks.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                isFavorite={favoriteIds.includes(Number(book.id))}
                onToggleFavorite={user ? handleToggleFavorite : null}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-3">
              <BookX className="w-7 h-7" aria-hidden="true" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              {onlyFavorites ? 'Belum Ada Buku Favorit' : 'Tidak Ada Buku Ditemukan'}
            </h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              {onlyFavorites
                ? 'Klik ikon bookmark pada kartu buku untuk menyimpan buku favorit Anda di sini.'
                : 'Tidak ada buku yang cocok dengan kata kunci atau kategori yang dipilih.'}
            </p>
            {isFiltering && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('')
                  setSelectedCategory('Semua')
                  setOnlyFavorites(false)
                }}
                className="mt-4 min-h-[40px] px-4 py-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold hover:bg-emerald-100 transition-colors cursor-pointer"
              >
                Reset Filter & Pencarian
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
