import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'

export default function BookCard({ book }) {
  const isAvailable = book.stock > 0
  const coverSrc = book.cover || '/covers/default-book.svg'

  return (
    <article className="group rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all duration-300 flex flex-col justify-between">
      {/* Book Cover Stage */}
      <div className="relative mb-3 flex items-center justify-center py-5 bg-gradient-to-b from-slate-50 to-slate-100/50 rounded-xl overflow-hidden group-hover:bg-emerald-50/40 transition-colors">
        {/* Category Pill */}
        <span className="absolute top-2.5 right-2.5 text-[10px] font-semibold text-emerald-800 bg-white/95 backdrop-blur-xs px-2.5 py-0.5 rounded-md border border-slate-200/80 shadow-2xs z-10">
          {book.category}
        </span>

        {/* Physical 3D Book Cover */}
        <div className="relative transition-transform duration-300 ease-out group-hover:-translate-y-2 group-hover:scale-102">
          <Image
            src={coverSrc}
            alt={`Sampul buku ${book.title}`}
            width={124}
            height={176}
            className="rounded-md shadow-md object-cover ring-1 ring-slate-900/10"
          />
          {/* Subtle book spine lighting effect */}
          <div
            className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-r from-white/30 to-transparent rounded-l-md pointer-events-none"
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Book Metadata & Action */}
      <div className="flex flex-col flex-1 justify-between gap-3">
        <div>
          <h2
            className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors text-sm sm:text-base leading-snug line-clamp-1"
            title={book.title}
          >
            {book.title}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
            {book.author}
          </p>
        </div>

        {/* Stock Status & CTA Button */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          {isAvailable ? (
            <span className="text-xs font-semibold text-emerald-700">
              Sisa {book.stock} buku
            </span>
          ) : (
            <span className="text-xs font-medium text-slate-400">
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
