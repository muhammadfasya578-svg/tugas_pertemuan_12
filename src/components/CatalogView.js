'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import BookCard from '@/components/BookCard'
import {
  Search,
  BookX,
  BookOpen,
  Sparkles,
  Layers,
  BookText,
  Compass,
  Code2,
  History,
  Clock,
  ShieldCheck,
  ArrowRight,
  X,
} from 'lucide-react'

const CATEGORY_ICONS = {
  Semua: Layers,
  Novel: BookText,
  'Self-help': Compass,
  Teknologi: Code2,
  Sejarah: History,
}

export default function CatalogView({ initialBooks }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Semua')

  // Ekstrak kategori unik dari data buku
  const categories = useMemo(() => {
    const cats = new Set(initialBooks.map((b) => b.category))
    return ['Semua', ...Array.from(cats)]
  }, [initialBooks])

  // Hitung jumlah buku per kategori
  const categoryCounts = useMemo(() => {
    const counts = { Semua: initialBooks.length }
    initialBooks.forEach((b) => {
      counts[b.category] = (counts[b.category] || 0) + 1
    })
    return counts
  }, [initialBooks])

  // Filter buku berdasarkan search query dan kategori
  const filteredBooks = useMemo(() => {
    return initialBooks.filter((book) => {
      const matchSearch =
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(searchQuery.toLowerCase())

      const matchCategory =
        selectedCategory === 'Semua' || book.category === selectedCategory

      return matchSearch && matchCategory
    })
  }, [initialBooks, searchQuery, selectedCategory])

  // Featured book untuk spotlight card
  const featuredBook = useMemo(() => {
    if (!initialBooks || initialBooks.length === 0) return null
    return initialBooks.find((b) => b.stock > 0) || initialBooks[0]
  }, [initialBooks])

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section
        className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-950 rounded-3xl p-6 sm:p-10 text-white shadow-md relative overflow-hidden"
        aria-label="Pencarian dan sorotan buku perpustakaan"
      >
        {/* Subtle decorative radial light */}
        <div
          className="absolute -top-32 -right-32 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-24 -left-24 w-72 h-72 bg-teal-400/10 rounded-full blur-2xl pointer-events-none"
          aria-hidden="true"
        />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Kolom Kiri: Headline & Pencarian */}
          <div className="lg:col-span-7 space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
              <Sparkles className="w-3.5 h-3.5 text-emerald-300" aria-hidden="true" />
              <span>Koleksi Perpustakaan Digital</span>
            </span>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Temukan & Pinjam Buku Favoritmu
            </h1>

            <p className="text-emerald-100/90 text-sm sm:text-base leading-relaxed max-w-xl">
              Jelajahi karya sastra, teknologi, pengembangan diri, dan referensi akademik. Pinjam instan secara online dengan masa pinjam 7 hari.
            </p>

            {/* Search Box */}
            <div className="pt-2">
              <form
                onSubmit={(e) => e.preventDefault()}
                className="relative flex flex-col sm:flex-row items-stretch gap-2 max-w-xl"
                role="search"
              >
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <Search className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari judul buku atau nama penulis..."
                    aria-label="Cari judul buku atau nama penulis"
                    className="w-full h-12 pl-11 pr-10 rounded-2xl bg-white text-slate-900 placeholder-slate-500 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700"
                      aria-label="Hapus kata kunci pencarian"
                    >
                      <X className="w-4 h-4" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Feature Pills */}
            <div className="pt-3 flex flex-wrap items-center gap-3 text-xs text-emerald-100/80">
              <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-lg backdrop-blur-xs">
                <Clock className="w-3.5 h-3.5 text-emerald-300" aria-hidden="true" />
                <span>Masa Pinjam 7 Hari</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-lg backdrop-blur-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" aria-hidden="true" />
                <span>Maksimal 3 Buku Aktif</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-lg backdrop-blur-xs">
                <BookOpen className="w-3.5 h-3.5 text-emerald-300" aria-hidden="true" />
                <span>Koleksi Terverifikasi</span>
              </div>
            </div>
          </div>

          {/* Kolom Kanan: Spotlight Card (Buku Unggulan) */}
          {featuredBook && (
            <div className="lg:col-span-5 hidden lg:block">
              <div className="bg-white/10 border border-white/15 rounded-2xl p-5 backdrop-blur-sm shadow-lg flex gap-4 items-center">
                <div className="w-24 h-34 relative flex-shrink-0 rounded-lg overflow-hidden shadow-md">
                  <Image
                    src={featuredBook.cover || '/covers/default-book.svg'}
                    alt={`Sampul ${featuredBook.title}`}
                    width={96}
                    height={136}
                    className="object-cover w-full h-full"
                  />
                </div>
                <div className="flex-1 min-w-0 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full">
                    Sorotan Koleksi
                  </span>
                  <h3 className="text-base font-bold text-white truncate" title={featuredBook.title}>
                    {featuredBook.title}
                  </h3>
                  <p className="text-xs text-emerald-100/80 truncate">
                    {featuredBook.author}
                  </p>
                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-xs font-semibold text-emerald-200">
                      Stok: {featuredBook.stock} buku
                    </span>
                    <Link
                      href={`/buku/${featuredBook.id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <span>Detail</span>
                      <ArrowRight className="w-3 h-3" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Filter Kategori & Info Hasil */}
      <section aria-label="Filter kategori buku" className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat
              const Icon = CATEGORY_ICONS[cat] || Layers
              const count = categoryCounts[cat] || 0

              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                    isActive
                      ? 'bg-emerald-700 text-white shadow-sm font-semibold'
                      : 'bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
                  <span>{cat}</span>
                  <span
                    className={`text-[11px] px-1.5 py-0.2 rounded-full font-semibold ${
                      isActive
                        ? 'bg-emerald-800 text-emerald-100'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Results Counter */}
          <div className="text-xs text-slate-500 font-medium whitespace-nowrap">
            Menampilkan <strong className="text-slate-800 font-bold">{filteredBooks.length}</strong> dari {initialBooks.length} buku
          </div>
        </div>
      </section>

      {/* Grid Buku */}
      {filteredBooks.length > 0 ? (
        <section aria-label="Daftar koleksi buku">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredBooks.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </section>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-4">
            <BookX className="w-8 h-8" aria-hidden="true" />
          </div>
          <h2 className="text-base font-bold text-slate-900">
            Tidak Ada Buku Ditemukan
          </h2>
          <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
            Tidak ada buku yang cocok dengan kata kunci atau kategori yang dipilih. Silakan coba kata kunci lain.
          </p>
          {(searchQuery || selectedCategory !== 'Semua') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('')
                setSelectedCategory('Semua')
              }}
              className="mt-5 min-h-[40px] px-4 py-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold hover:bg-emerald-100 transition-colors cursor-pointer"
            >
              Reset Filter & Pencarian
            </button>
          )}
        </div>
      )}
    </div>
  )
}
