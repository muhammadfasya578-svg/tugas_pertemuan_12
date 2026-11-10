import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default function BookCard({ book }) {
  const isAvailable = book.stock > 0
  const coverSrc = book.cover || '/covers/default-book.svg'

  return (
    <article className="group rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-2xs hover:border-emerald-500 hover:shadow-md transition-all duration-300 flex flex-col justify-between">
      {/* Book Cover Viewport - Aspect Ratio Realistis & Borderless */}
      <div className="relative aspect-[3/4.2] w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-200/70 mb-3 group-hover:shadow-sm transition-all duration-300">
        <img
          src={coverSrc}
          alt={`Sampul buku ${book.title}`}
          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />

        {/* Efek Punggung Buku (Spine Lighting) */}
        <div
          className="absolute inset-y-0 left-0 w-2.5 bg-gradient-to-r from-black/25 via-white/10 to-transparent pointer-events-none"
          aria-hidden="true"
        />

        {/* Gradasi Ambient Halus di Bagian Bawah */}
        <div
          className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"
          aria-hidden="true"
        />

        {/* Category Badge */}
        <span className="absolute top-2.5 right-2.5 text-[10px] font-bold text-slate-800 bg-white/95 backdrop-blur-xs px-2.5 py-0.5 rounded-full border border-slate-200/80 shadow-2xs z-10">
          {book.category}
        </span>
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
          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1 capitalize">
            {book.author}
          </p>
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
