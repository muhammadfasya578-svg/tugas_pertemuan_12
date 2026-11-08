import Link from 'next/link'
import { BookOpen } from 'lucide-react'

export default function BookCard({ book }) {
  const isAvailable = book.stock > 0

  return (
    <div className="group rounded-2xl border border-slate-200 bg-white shadow-xs hover:border-emerald-300 transition-colors duration-200 flex flex-col overflow-hidden">
      {/* Cover Placeholder */}
      <div className="h-44 bg-slate-50 flex flex-col items-center justify-center p-6 border-b border-slate-100 relative">
        <div className="w-16 h-16 rounded-2xl bg-white shadow-xs flex items-center justify-center text-emerald-700 transition-transform">
          <BookOpen className="w-8 h-8" aria-hidden="true" />
        </div>
        <span className="mt-3 text-xs font-semibold text-emerald-800 bg-emerald-100/90 px-3 py-1 rounded-lg">
          {book.category}
        </span>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex-1">
          <h3 className="font-semibold text-slate-900 line-clamp-1 group-hover:text-emerald-700 transition-colors text-base" title={book.title}>
            {book.title}
          </h3>
          <p className="text-sm text-slate-600 mt-1 line-clamp-1">
            {book.author}
          </p>
        </div>

        {/* Stock status & Action */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
          {isAvailable ? (
            <span className="inline-flex items-center text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
              Sisa {book.stock} buku
            </span>
          ) : (
            <span className="inline-flex items-center text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
              Stok Habis
            </span>
          )}

          <Link
            href={`/buku/${book.id}`}
            aria-label={`Lihat detail buku ${book.title}`}
            className="inline-flex items-center text-xs font-semibold text-emerald-700 hover:text-emerald-800 underline-offset-4 hover:underline py-1"
          >
            Lihat Detail
          </Link>
        </div>
      </div>
    </div>
  )
}
