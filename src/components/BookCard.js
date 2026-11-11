'use client'

import Link from 'next/link'
import { ArrowRight, Bookmark, Star } from 'lucide-react'
import { resolveBookCover } from '@/lib/storage'

export default function BookCard({ book, isFavorite = false, onToggleFavorite }) {
  const isAvailable = book.stock > 0
  const coverSrc = resolveBookCover(book)

  return (
    <article className="group rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-2xs hover:border-emerald-500 hover:shadow-md transition-all duration-300 flex flex-col justify-between relative">
      {/* 3D Book Cover Stage - Desain panggung buku fisik realistis */}
      <div className="relative h-60 sm:h-64 w-full rounded-2xl overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-50/60 border border-slate-100 flex items-center justify-center p-3 mb-3 group-hover:bg-emerald-50/20 transition-colors">
        {/* Category Badge */}
        <span className="absolute top-2.5 right-2.5 text-[10px] font-bold text-slate-800 bg-white/95 backdrop-blur-xs px-2.5 py-0.5 rounded-full border border-slate-200/80 shadow-2xs z-10">
          {book.category}
        </span>

        {/* Favorite Bookmark Button */}
        {onToggleFavorite && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onToggleFavorite(book.id)
            }}
            aria-label={isFavorite ? 'Hapus dari buku favorit' : 'Simpan ke buku favorit'}
            className={`absolute top-2.5 left-2.5 w-8 h-8 rounded-full flex items-center justify-center transition-all z-10 shadow-xs cursor-pointer ${
              isFavorite
                ? 'bg-emerald-700 text-white'
                : 'bg-white/95 text-slate-400 hover:text-emerald-700 hover:bg-white'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${isFavorite ? 'fill-white' : ''}`} aria-hidden="true" />
          </button>
        )}

        {/* 3D Standing Book Mockup with Drop Shadow */}
        <div className="relative w-full h-full flex items-center justify-center transition-transform duration-300 ease-out group-hover:-translate-y-2 group-hover:scale-105">
          <img
            src={coverSrc}
            alt={`Sampul buku ${book.title}`}
            className="max-h-full max-w-full object-contain drop-shadow-md"
          />
        </div>
      </div>

      {/* Book Metadata & Action */}
      <div className="flex flex-col flex-1 justify-between gap-3">
        <div>
          <h2
            className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors text-sm sm:text-base leading-snug line-clamp-1 capitalize"
            title={book.title}
          >
            {book.title}
          </h2>
          <div className="flex items-center justify-between gap-2 mt-0.5">
            <p className="text-xs text-slate-500 line-clamp-1 capitalize">
              {book.author}
            </p>
            {book.averageRating > 0 && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                <Star className="w-3 h-3 fill-amber-500 text-amber-500" aria-hidden="true" />
                <span>{book.averageRating}</span>
              </span>
            )}
          </div>
        </div>

        {/* Stock Status & CTA Button */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          {isAvailable ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" aria-hidden="true" />
              <span>Sisa {book.stock} buku</span>
            </span>
          ) : (
            <span className="inline-flex items-center text-xs font-medium text-slate-400">
              Stok Habis
            </span>
          )}

          <Link
            href={`/buku/${book.id}`}
            aria-label={`Lihat detail dan pinjam buku ${book.title}`}
            className="min-h-[36px] px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-medium text-xs transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <span>Lihat Buku</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  )
}
