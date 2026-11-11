'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  BookMarked,
  Tags,
  ClipboardList,
  Users,
  BookOpen,
  ArrowLeft,
  LogOut,
  ShieldCheck,
  BookPlus,
  History,
} from 'lucide-react'
import { clearSession } from '@/lib/storage'

export default function AdminSidebar({ profile }) {
  const pathname = usePathname()
  const router = useRouter()

  const menuItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/buku', label: 'Kelola Buku', icon: BookMarked },
    { href: '/admin/kategori', label: 'Kelola Kategori', icon: Tags },
    { href: '/admin/peminjaman', label: 'Peminjaman', icon: ClipboardList },
    { href: '/admin/user', label: 'Daftar User', icon: Users },
    { href: '/admin/usulan', label: 'Usulan Buku', icon: BookPlus },
    { href: '/admin/log', label: 'Log Aktivitas', icon: History },
  ]

  const handleLogout = () => {
    clearSession()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-full md:w-64 bg-white border-r border-slate-200 flex flex-col md:min-h-screen">
      {/* Brand */}
      <div className="h-16 px-6 border-b border-slate-100 flex items-center justify-between">
        <Link href="/admin" className="flex items-center gap-2.5 font-bold text-slate-900 text-lg">
          <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-xs">
            <BookOpen className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="flex flex-col">
            <span className="leading-tight">Perpus</span>
            <span className="text-[10px] text-emerald-700 font-semibold tracking-wider uppercase">
              Admin Panel
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <div className="p-4 flex-1 space-y-1 overflow-x-auto md:overflow-visible flex md:flex-col gap-1 md:gap-0">
        <div className="hidden md:block px-3 py-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          Menu Utama
        </div>
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition whitespace-nowrap ${
                isActive
                  ? 'bg-emerald-50 text-emerald-800 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          )
        })}

        <div className="hidden md:block pt-4 mt-4 border-t border-slate-100">
          <div className="px-3 py-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Navigasi Luar
          </div>
          <Link
            href="/"
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:text-emerald-700 hover:bg-slate-50 transition"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Katalog Pembaca</span>
          </Link>
        </div>
      </div>

      {/* Admin User Footer */}
      <div className="p-4 border-t border-slate-100 hidden md:block">
        <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl mb-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
            <ShieldCheck className="w-4 h-4" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-900 truncate">
              {profile?.name || 'Admin'}
            </p>
            <p className="text-[11px] text-slate-500 truncate">{profile?.email || 'admin@perpus.com'}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          aria-label="Keluar dari akun admin"
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 transition"
        >
          <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Keluar Akun</span>
        </button>
      </div>
    </aside>
  )
}
