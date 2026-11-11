'use client'

import { Suspense } from 'react'
import AdminBooksManager from '@/components/AdminBooksManager'
import { BookMarked, Loader2 } from 'lucide-react'

export default function AdminBukuPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
          <BookMarked className="w-6 h-6 text-emerald-600" />
          <span>Kelola Data Buku</span>
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Tambah koleksi baru, edit detail, atau kelola kuota stok buku perpustakaan.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 className="w-7 h-7 animate-spin text-emerald-600" />
            <p className="text-sm">Memuat data koleksi buku...</p>
          </div>
        }
      >
        <AdminBooksManager />
      </Suspense>
    </div>
  )
}
