import Link from 'next/link'
import Image from 'next/image'

export default function BookCard({ book }) {
  const isAvailable = book.stock > 0
  const coverSrc = book.cover || '/covers/default-book.svg'

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs hover:border-emerald-300 hover:shadow-xs transition-all duration-200 flex flex-col overflow-hidden">
      {/* Cover Image */}
      <div className="h-52 bg-slate-50 flex items-center justify-center p-4 border-b border-slate-100 relative">
        <Image
          src={coverSrc}
          alt={`Sampul buku ${book.title}`}
          width={124}
          height={174}
          className="rounded shadow-xs object-cover"
        />
        <span className="absolute top-3 right-3 text-[11px] font-medium text-emerald-800 bg-white/95 px-2.5 py-0.5 rounded-md border border-slate-200 shadow-2xs">
          {book.category}
        </span>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
        <div>
          <h2
            className="font-semibold text-slate-900 line-clamp-1 text-sm sm:text-base leading-snug"
            title={book.title}
          >
            {book.title}
          </h2>
          <p className="text-xs text-slate-500 mt-1 line-clamp-1">
            {book.author}
          </p>
        </div>

        {/* Stock Status & Action Button */}
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
            className="min-h-[36px] px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-xs transition-colors flex items-center justify-center"
          >
            Lihat Buku
          </Link>
        </div>
      </div>
    </div>
  )
}
