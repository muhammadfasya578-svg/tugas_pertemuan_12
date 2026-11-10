'use client'

import AdminCategoriesManager from '@/components/AdminCategoriesManager'
import { Tags } from 'lucide-react'

export default function AdminKategoriPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
          <Tags className="w-6 h-6 text-emerald-700" aria-hidden="true" />
          <span>Kelola Kategori Buku</span>
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Atur daftar kategori buku perpustakaan untuk digunakan pada formulir buku dan filter katalog.
        </p>
      </div>

      <AdminCategoriesManager />
    </div>
  )
}
