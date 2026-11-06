'use client'

import AdminBooksManager from '@/components/AdminBooksManager'
import { BookMarked } from 'lucide-react'

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

      <AdminBooksManager />
    </div>
  )
}
