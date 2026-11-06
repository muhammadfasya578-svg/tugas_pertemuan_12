import Link from 'next/link'
import { BookOpen, ArrowRight } from 'lucide-react'

export default function BookCard({ book }) {
  const isAvailable = book.stock > 0

  return (
    <div className="group rounded-2xl border border-slate-200 bg-white shadow-xs hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden">
      {/* Cover Placeholder */}
      <div className="h-44 bg-gradient-to-br from-emerald-50 to-emerald-100/50 flex flex-col items-center justify-center p-6 border-b border-slate-100 relative">
        <div className="w-16 h-16 rounded-2xl bg-white shadow-xs flex items-center justify-center text-emerald-600 group-hover:scale-105 transition-transform">
          <BookOpen className="w-8 h-8" />
        </div>
        <span className="mt-3 text-xs font-medium text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-full">
          {book.category}
        </span>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex-1">
          <h3 className="font-semibold text-slate-900 line-clamp-1 group-hover:text-emerald-600 transition-colors text-base" title={book.title}>
            {book.title}
          </h3>
          <p className="text-sm text-slate-500 mt-1 line-clamp-1">
            {book.author}
          </p>
        </div>

        {/* Stock status & Action */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
          {isAvailable ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Sisa {book.stock} buku
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              Habis
            </span>
          )}

          <Link
            href={`/buku/${book.id}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:gap-1.5 transition-all"
          >
            <span>Detail</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  )
}
