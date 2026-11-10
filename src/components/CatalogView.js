'use client'

import { useState, useMemo } from 'react'
import BookCard from '@/components/BookCard'
import { Search, BookX, X } from 'lucide-react'

export default function CatalogView({ initialBooks }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Semua')

  // Ekstrak kategori unik dari data buku
  const categories = useMemo(() => {
    const cats = new Set(initialBooks.map((b) => b.category))
    return ['Semua', ...Array.from(cats)]
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

  return (
    <div className="space-y-6">
      {/* Header & Kotak Pencarian */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Katalog Buku
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Jelajahi koleksi buku perpustakaan dan pinjam langsung dengan durasi 7 hari.
          </p>
        </div>

        {/* Input Pencarian */}
        <div className="w-full md:w-80 relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" aria-hidden="true" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari judul atau penulis..."
            aria-label="Cari judul atau nama penulis buku"
            className="w-full h-11 pl-10 pr-9 text-sm rounded-xl border border-slate-200 bg-white placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              aria-label="Hapus kata kunci pencarian"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Kategori & Info Hasil */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-emerald-700 text-white font-semibold shadow-2xs'
                    : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {cat}
              </button>
            )
          })}
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Menampilkan <strong className="text-slate-800 font-semibold">{filteredBooks.length}</strong> dari {initialBooks.length} buku
        </div>
      </div>

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
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-3">
            <BookX className="w-7 h-7" aria-hidden="true" />
          </div>
          <h2 className="text-base font-bold text-slate-900">
            Tidak Ada Buku Ditemukan
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Coba ubah kata kunci pencarian atau pilih kategori lain.
          </p>
          {(searchQuery || selectedCategory !== 'Semua') && (
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
    </div>
  )
}
