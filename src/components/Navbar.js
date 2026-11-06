'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { BookOpen, History, Shield, LogOut, User } from 'lucide-react'
import { clearSession } from '@/lib/storage'

export default function Navbar({ profile }) {
  const pathname = usePathname()
  const router = useRouter()

  const navLinks = [
    { href: '/', label: 'Katalog Buku', icon: BookOpen },
    { href: '/riwayat', label: 'Riwayat Pinjam', icon: History },
  ]

  const handleLogout = () => {
    clearSession()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 font-bold text-slate-900 text-lg">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <span>Perpus</span>
          </Link>

          {/* Nav Items */}
          <nav className="hidden sm:flex items-center gap-1">
            {navLinks.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Right side: User & Actions */}
        <div className="flex items-center gap-3">
          {/* Admin Link if admin */}
          {profile?.role === 'admin' && (
            <Link
              href="/admin"
              className="hidden sm:flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-xl transition"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Panel Admin</span>
            </Link>
          )}

          {/* User badge */}
          <div className="flex items-center gap-2 bg-slate-100/80 px-3 py-1.5 rounded-xl text-sm text-slate-700">
            <User className="w-4 h-4 text-emerald-600" />
            <span className="font-medium max-w-[120px] truncate sm:max-w-[180px]">
              {profile?.name || profile?.email || 'User'}
            </span>
          </div>

          {/* Logout */}
          <button
            type="button"
            onClick={handleLogout}
            title="Keluar"
            className="flex items-center gap-1 text-slate-500 hover:text-red-600 p-2 sm:px-3 sm:py-1.5 rounded-xl text-sm font-medium hover:bg-red-50 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </div>

      {/* Mobile Nav Sub-bar */}
      <div className="sm:hidden border-t border-slate-100 px-4 py-2 flex items-center justify-around bg-slate-50/50">
        {navLinks.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${
                isActive ? 'bg-emerald-100 text-emerald-700' : 'text-slate-600'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </Link>
          )
        })}
        {profile?.role === 'admin' && (
          <Link
            href="/admin"
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-100"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Admin</span>
          </Link>
        )}
      </div>
    </header>
  )
}
