'use client'

import AdminLoansManager from '@/components/AdminLoansManager'
import { ClipboardList } from 'lucide-react'

export default function AdminPeminjamanPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
          <ClipboardList className="w-6 h-6 text-emerald-600" />
          <span>Daftar Seluruh Peminjaman</span>
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Pantau status peminjaman, tandai pengembalian, dan tinjau transaksi yang melewati jatuh tempo.
        </p>
      </div>

      <AdminLoansManager />
    </div>
  )
}
