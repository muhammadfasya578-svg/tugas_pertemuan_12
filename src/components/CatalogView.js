'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import BookCard from '@/components/BookCard'
import Dropdown from '@/components/Dropdown'
import { Search, BookX, X, ArrowRight } from 'lucide-react'

export default function CatalogView({ initialBooks }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Semua')

  // Ekstrak kategori unik dari data buku
  const categories = useMemo(() => {
    const cats = new Set(initialBooks.map((b) => b.category))
    return ['Semua', ...Array.from(cats)]
  }, [initialBooks])

  // Opsi dropdown kategori dengan label yang rapi
  const categoryOptions = useMemo(() => {
    return categories.map((cat) => ({
      value: cat,
      label: cat === 'Semua' ? 'Semua Kategori' : cat,
    }))
  }, [categories])

  // Filter buku berdasarkan search query dan kategori terpilih
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

  // Buku rekomendasi terpopuler / tersedia untuk rak atas
  const recommendedBooks = useMemo(() => {
    return initialBooks.filter((b) => b.stock > 0).slice(0, 4)
  }, [initialBooks])

  const isFiltering = searchQuery.trim().length > 0 || selectedCategory !== 'Semua'

  return (
    <div className="space-y-10">
      {/* Top Header: Discover Title & Dribbble-Style Unified Search Bar */}
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
              onChange={setSelectedCategory}
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
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
          </div>

          {/* Submit Action */}
          <button
            type="button"
            onClick={() => {}}
            className="min-h-[40px] px-5 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-semibold text-xs transition-colors flex items-center justify-center shadow-2xs cursor-pointer"
          >
            Cari
          </button>
        </div>
      </section>

      {/* Section 1: Rekomendasi Buku (Featured Shelf) - Tampil saat tidak sedang mencari */}
      {!isFiltering && recommendedBooks.length > 0 && (
        <section aria-label="Rekomendasi buku unggulan" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">
              Rekomendasi Buku
            </h2>
            <button
              type="button"
              onClick={() => setSelectedCategory('Semua')}
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
                  {/* Stand-up 3D Book with Realistic Soft Drop Shadow */}
                  <div className="relative aspect-[3/4.2] w-36 sm:w-40 rounded-xl overflow-hidden shadow-lg border border-slate-200/80 transition-transform duration-300 ease-out group-hover:-translate-y-2.5 group-hover:scale-103 bg-slate-100">
                    <img
                      src={book.cover || '/covers/default-book.svg'}
                      alt={`Sampul buku ${book.title}`}
                      className="w-full h-full object-cover"
                    />
                    {/* Spine highlight overlay on left */}
                    <div
                      className="absolute inset-y-0 left-0 w-2.5 bg-gradient-to-r from-black/20 via-white/10 to-transparent pointer-events-none"
                      aria-hidden="true"
                    />
                  </div>

                  {/* Metadata Below Stand-up Book */}
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
              {isFiltering ? 'Hasil Pencarian Koleksi' : 'Kategori Buku'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Pilih kategori atau jelajahi seluruh koleksi buku perpustakaan.
            </p>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Menampilkan <strong className="text-slate-900 font-bold">{filteredBooks.length}</strong> dari {initialBooks.length} buku
          </div>
        </div>

        {/* Category Pill Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
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
        </div>

        {/* Books Grid */}
        {filteredBooks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pt-2">
            {filteredBooks.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-3">
              <BookX className="w-7 h-7" aria-hidden="true" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Tidak Ada Buku Ditemukan
            </h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Tidak ada buku yang cocok dengan kata kunci atau kategori yang dipilih.
            </p>
            {isFiltering && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('')
                  setSelectedCategory('Semua')
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
