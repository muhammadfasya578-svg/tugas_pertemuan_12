import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, User } from 'lucide-react'

export default function BookCard({ book }) {
  const isAvailable = book.stock > 0
  const coverSrc = book.cover || '/covers/default-book.svg'

  return (
    <article className="group rounded-2xl border border-slate-200/90 bg-white shadow-xs hover:border-emerald-300 hover:shadow-md transition-all duration-300 flex flex-col overflow-hidden">
      {/* Cover Image Stage */}
      <div className="h-56 bg-gradient-to-b from-slate-100/80 via-slate-50 to-slate-100/40 flex items-center justify-center p-5 border-b border-slate-100 relative overflow-hidden">
        {/* Subtle ambient blur behind cover */}
        <div
          className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          aria-hidden="true"
        />

        {/* Category Badge */}
        <span className="absolute top-3.5 right-3.5 text-[11px] font-semibold text-emerald-900 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-full border border-slate-200 shadow-2xs z-10">
          {book.category}
        </span>

        {/* Book Cover with Physical Book Elevation */}
        <div className="relative transition-transform duration-300 ease-out group-hover:-translate-y-1.5 group-hover:scale-[1.02]">
          <Image
            src={coverSrc}
            alt={`Sampul buku ${book.title}`}
            width={132}
            height={184}
            className="rounded-lg shadow-md object-cover ring-1 ring-slate-900/5"
          />
        </div>
      </div>

      {/* Content Area */}
      <div className="p-5 flex flex-col flex-1 justify-between gap-4">
        <div className="space-y-1.5">
          <h2
            className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors text-base leading-snug line-clamp-1"
            title={book.title}
          >
            {book.title}
          </h2>
          <p className="text-xs text-slate-600 line-clamp-1 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" aria-hidden="true" />
            <span>{book.author}</span>
          </p>
        </div>

        {/* Stock Status & CTA Button */}
        <div className="pt-3.5 border-t border-slate-100 flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Status Koleksi:</span>
            {isAvailable ? (
              <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" aria-hidden="true" />
                <span>Tersedia ({book.stock})</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                <span>Stok Habis</span>
              </span>
            )}
          </div>

          <Link
            href={`/buku/${book.id}`}
            aria-label={`Lihat detail dan pinjam buku ${book.title}`}
            className="w-full min-h-[44px] px-4 rounded-xl bg-slate-900 text-white font-medium text-xs hover:bg-emerald-700 active:bg-emerald-800 transition-colors flex items-center justify-center gap-2 shadow-2xs group/btn"
          >
            <span>Lihat & Pinjam Buku</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover/btn:translate-x-0.5 transition-transform" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  )
}
