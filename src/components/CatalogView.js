'use client'

import { useState, useMemo } from 'react'
import BookCard from '@/components/BookCard'
import { Search, BookX, BookOpen } from 'lucide-react'

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
    <div className="space-y-8">
      {/* Hero Section & Search Bar */}
      <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 rounded-3xl p-6 sm:p-10 text-white shadow-sm relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium text-emerald-100 mb-4 border border-white/10">
            <BookOpen className="w-3.5 h-3.5 text-emerald-300" />
            <span>Katalog Perpustakaan Online</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Temukan & Pinjam Buku Favoritmu
          </h1>
          <p className="mt-2 text-emerald-100/90 text-sm sm:text-base leading-relaxed">
            Jelajahi koleksi novel, teknologi, pengembangan diri, dan pengetahuan umum. Pinjam instan dengan durasi 7 hari.
          </p>

          {/* Search Box */}
          <div className="mt-6 relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
              <Search className="w-5 h-5 text-slate-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari judul buku atau nama penulis..."
              className="w-full h-12 pl-11 pr-4 rounded-2xl bg-white text-slate-900 placeholder-slate-400 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-xs text-slate-400 hover:text-slate-600"
              >
                Hapus
              </button>
            )}
          </div>
        </div>

        {/* Decorative circle */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-emerald-500/20 blur-2xl pointer-events-none" />
      </div>

      {/* Filter Kategori Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1">
          Kategori:
        </span>
        {categories.map((cat) => {
          const isActive = selectedCategory === cat
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {cat}
            </button>
          )
        })}
      </div>

      {/* Grid Buku */}
      {filteredBooks.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredBooks.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
            <BookX className="w-8 h-8" />
          </div>
          <h3 className="text-base font-semibold text-slate-900">
            Tidak ada buku ditemukan
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Coba ubah kata kunci pencarian atau pilih kategori lain.
          </p>
          {(searchQuery || selectedCategory !== 'Semua') && (
            <button
              onClick={() => {
                setSearchQuery('')
                setSelectedCategory('Semua')
              }}
              className="mt-4 text-xs font-semibold text-emerald-600 hover:text-emerald-700 underline cursor-pointer"
            >
              Reset Filter
            </button>
          )}
        </div>
      )}
    </div>
  )
}
