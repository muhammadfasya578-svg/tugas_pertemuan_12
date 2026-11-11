'use client'

import { useState, useEffect } from 'react'
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
  Menu,
  X,
  Compass,
} from 'lucide-react'
import { clearSession, getSession } from '@/lib/storage'

export default function AdminSidebar({ profile }) {
  const [currentProfile, setCurrentProfile] = useState(profile)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    setCurrentProfile(profile)
  }, [profile])

  useEffect(() => {
    const handleUpdate = () => {
      const current = getSession()
      if (current) setCurrentProfile(current)
    }
    window.addEventListener('perpus_session_updated', handleUpdate)
    return () => window.removeEventListener('perpus_session_updated', handleUpdate)
  }, [])

  // Tutup drawer mobile otomatis saat route berpindah
  useEffect(() => {
    setIsMobileOpen(false)
  }, [pathname])

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
    <>
      {/* Mobile Top Header (Sticky di layar kecil) */}
      <header className="md:hidden sticky top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 h-16 px-4 flex items-center justify-between shadow-2xs">
        <Link href="/admin" className="flex items-center gap-2.5 font-bold text-slate-900 text-base">
          <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-xs">
            <BookOpen className="w-4 h-4" aria-hidden="true" />
          </div>
          <div className="flex flex-col">
            <span className="leading-tight font-extrabold text-sm">Perpus</span>
            <span className="text-[9px] text-emerald-700 font-bold tracking-wider uppercase">
              Admin Panel
            </span>
          </div>
        </Link>

        <button
          type="button"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          aria-label={isMobileOpen ? 'Tutup menu navigasi admin' : 'Buka menu navigasi admin'}
          className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 transition cursor-pointer"
        >
          {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Dimmed Backdrop saat drawer mobile terbuka */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="md:hidden fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-50 transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container: Slide-over Drawer di Mobile, Sticky Sidebar di Desktop */}
      <aside
        className={`fixed top-0 bottom-0 left-0 w-72 max-w-[85vw] bg-white z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:w-64 md:min-h-screen md:h-screen md:sticky md:top-0 md:border-r md:border-slate-200 md:shadow-none ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-6 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
          <Link href="/admin" className="flex items-center gap-2.5 font-bold text-slate-900 text-lg">
            <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-xs">
              <BookOpen className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="flex flex-col">
              <span className="leading-tight font-extrabold">Perpus</span>
              <span className="text-[10px] text-emerald-700 font-semibold tracking-wider uppercase">
                Admin Panel
              </span>
            </div>
          </Link>

          {/* Tombol Tutup di dalam drawer mobile */}
          <button
            type="button"
            onClick={() => setIsMobileOpen(false)}
            aria-label="Tutup menu admin"
            className="md:hidden p-2 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Daftar Navigasi Utama */}
        <div className="p-4 flex-1 space-y-1.5 overflow-y-auto">
          <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Menu Utama
          </div>
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 min-h-[44px] rounded-xl text-sm font-medium transition ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-800 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0 text-emerald-700" aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            )
          })}

          <div className="pt-4 mt-4 border-t border-slate-100">
            <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Akses Pembaca
            </div>
            <Link
              href="/"
              className="flex items-center gap-3 px-3.5 py-2.5 min-h-[44px] rounded-xl text-sm font-medium text-slate-600 hover:text-emerald-700 hover:bg-slate-50 transition"
            >
              <ArrowLeft className="w-4 h-4 flex-shrink-0 text-slate-400" aria-hidden="true" />
              <span>Katalog Pembaca</span>
            </Link>
          </div>
        </div>

        {/* Profil Admin & Logout di bagian bawah Sidebar */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex-shrink-0">
          <div className="flex items-center gap-3 p-2.5 bg-white rounded-xl border border-slate-200/80 mb-3 shadow-2xs">
            {currentProfile?.avatar_url ? (
              <img
                src={currentProfile.avatar_url}
                alt={currentProfile.name || 'Admin'}
                className="w-9 h-9 rounded-xl object-cover flex-shrink-0 border border-slate-200 shadow-2xs"
              />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-2xs">
                <ShieldCheck className="w-4 h-4" aria-hidden="true" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">
                {currentProfile?.name || 'Administrator'}
              </p>
              <p className="text-[11px] text-slate-500 truncate">
                {currentProfile?.email || 'admin@perpus.com'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            aria-label="Keluar dari akun admin"
            className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 min-h-[44px] rounded-xl text-xs font-semibold text-slate-600 hover:text-red-700 hover:bg-red-50 transition cursor-pointer border border-transparent hover:border-red-200"
          >
            <LogOut className="w-4 h-4 text-slate-400 hover:text-red-600" aria-hidden="true" />
            <span>Keluar Akun</span>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar (Mudah dijangkau jempol di layar sentuh) */}
      <nav
        aria-label="Navigasi Cepat Admin Mobile"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 py-1 px-2 flex items-center justify-around shadow-lg"
      >
        <Link
          href="/admin"
          className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl min-w-[54px] min-h-[48px] transition ${
            pathname === '/admin'
              ? 'text-emerald-700 font-bold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Ringkasan</span>
        </Link>

        <Link
          href="/admin/buku"
          className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl min-w-[54px] min-h-[48px] transition ${
            pathname === '/admin/buku'
              ? 'text-emerald-700 font-bold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <BookMarked className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Buku</span>
        </Link>

        <Link
          href="/admin/peminjaman"
          className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl min-w-[54px] min-h-[48px] transition ${
            pathname === '/admin/peminjaman'
              ? 'text-emerald-700 font-bold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <ClipboardList className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Pinjam</span>
        </Link>

        <Link
          href="/admin/usulan"
          className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl min-w-[54px] min-h-[48px] transition ${
            pathname === '/admin/usulan'
              ? 'text-emerald-700 font-bold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <BookPlus className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Usulan</span>
        </Link>

        <button
          type="button"
          onClick={() => setIsMobileOpen(true)}
          className="flex flex-col items-center justify-center py-1.5 px-2 rounded-xl min-w-[54px] min-h-[48px] text-slate-500 hover:text-slate-900 transition cursor-pointer"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Menu</span>
        </button>
      </nav>
    </>
  )
}
