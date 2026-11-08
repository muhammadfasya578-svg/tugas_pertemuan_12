import Link from 'next/link'
import Image from 'next/image'

export default function BookCard({ book }) {
  const isAvailable = book.stock > 0
  const coverSrc = book.cover || '/covers/default-book.svg'

  return (
    <div className="group rounded-2xl border border-slate-200 bg-white shadow-xs hover:border-emerald-300 transition-colors duration-200 flex flex-col overflow-hidden">
      {/* Cover Image using next/image */}
      <div className="h-52 bg-slate-50 flex items-center justify-center p-4 border-b border-slate-100 relative">
        <Image
          src={coverSrc}
          alt={`Sampul buku ${book.title}`}
          width={130}
          height={182}
          className="rounded-lg shadow-xs object-cover transition-transform duration-200 group-hover:scale-102"
        />
        <span className="absolute top-3 right-3 text-[11px] font-semibold text-emerald-900 bg-white/95 px-2.5 py-0.5 rounded-md border border-slate-200 shadow-2xs">
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
