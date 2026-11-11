'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Compass,
  LayoutGrid,
  Bookmark,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  X,
  BookOpen,
  Heart,
} from 'lucide-react'
import { clearSession } from '@/lib/storage'

export default function AppSidebar({ profile }) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = () => {
    clearSession()
    router.push('/login')
    router.refresh()
  }

  const navItems = [
    {
      href: '/',
      label: 'Discover',
      sublabel: 'Jelajahi',
      icon: Compass,
      isActive: pathname === '/',
    },
    {
      href: '/#kategori',
      label: 'Category',
      sublabel: 'Kategori Buku',
      icon: LayoutGrid,
      isActive: false,
      onClick: (e) => {
        if (pathname === '/') {
          e.preventDefault()
          const el = document.getElementById('kategori-section')
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' })
          }
        }
      },
    },
    {
      href: '/riwayat',
      label: 'My Library',
      sublabel: 'Buku Dipinjam',
      icon: Bookmark,
      isActive: pathname === '/riwayat',
    },
    {
      href: '/?favorite=true',
      label: 'Favorite',
      sublabel: 'Buku Disimpan',
      icon: Heart,
      isActive: false,
    },
  ]

  // Tambahkan menu Admin jika user memiliki role admin
  if (profile?.role === 'admin') {
    navItems.push({
      href: '/admin',
      label: 'Admin Panel',
      sublabel: 'Kelola Sistem',
      icon: ShieldCheck,
      isActive: pathname.startsWith('/admin'),
    })
  }

  return (
    <>
      {/* Mobile Top Header */}
      <div className="md:hidden bg-white border-b border-slate-200 px-4 h-16 flex items-center justify-between sticky top-0 z-40">
        <Link href="/" className="flex items-center gap-2.5 font-extrabold text-slate-900 text-base">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <BookOpen className="w-4 h-4" aria-hidden="true" />
          </div>
          <span>THE BOOKS</span>
        </Link>

        <button
          type="button"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          aria-label={isMobileOpen ? 'Tutup navigasi' : 'Buka navigasi'}
          className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        >
          {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="md:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen bg-white border-r border-slate-200/90 z-50 md:z-30 flex flex-col transition-all duration-300 ease-in-out ${
          isCollapsed ? 'md:w-20' : 'md:w-64'
        } ${
          isMobileOpen
            ? 'translate-x-0 w-64 shadow-2xl'
            : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Floating Collapse / Expand Toggle Button (Desktop Only) */}
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'}
          className="hidden md:flex absolute -right-3.5 top-7 w-7 h-7 rounded-full bg-white border border-slate-200 shadow-md items-center justify-center text-slate-500 hover:text-emerald-700 hover:scale-105 transition-all z-20 cursor-pointer"
        >
          {isCollapsed ? (
            <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
          )}
        </button>

        {/* Brand / Logo */}
        <div
          className={`h-20 px-6 flex items-center border-b border-slate-100/80 ${
            isCollapsed ? 'justify-center px-0' : 'justify-between'
          }`}
        >
          <Link href="/" className="flex items-center gap-3 group focus:outline-none">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 group-hover:bg-emerald-700 text-white flex items-center justify-center shadow-xs transition-colors flex-shrink-0">
              <BookOpen className="w-5 h-5" aria-hidden="true" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="font-extrabold text-slate-900 tracking-tight text-base leading-tight">
                  THE BOOKS
                </span>
                <span className="text-[10px] text-emerald-700 font-semibold uppercase tracking-wider">
                  Digital Library
                </span>
              </div>
            )}
          </Link>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 px-3 py-6 space-y-6 overflow-y-auto scrollbar-none">
          <div>
            {!isCollapsed && (
              <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Menu
              </div>
            )}
            <nav className="space-y-1.5" aria-label="Navigasi Utama">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={(e) => {
                      if (item.onClick) item.onClick(e)
                      setIsMobileOpen(false)
                    }}
                    title={isCollapsed ? item.label : undefined}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all duration-200 group ${
                      item.isActive
                        ? 'bg-emerald-50/80 text-emerald-900 font-bold border border-emerald-200/60 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium'
                    } ${isCollapsed ? 'justify-center px-0' : ''}`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all flex-shrink-0 ${
                        item.isActive
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-500 group-hover:bg-emerald-50 group-hover:text-emerald-700'
                      }`}
                    >
                      <Icon className="w-4 h-4" aria-hidden="true" />
                    </div>

                    {!isCollapsed && (
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs truncate leading-snug">{item.label}</span>
                        <span className="text-[10px] text-slate-400 font-normal truncate">
                          {item.sublabel}
                        </span>
                      </div>
                    )}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Footer / User Profile & Logout */}
        <div className="p-3 border-t border-slate-100/80 space-y-2">
          {/* User Info */}
          {profile && (
            <div
              className={`p-2 rounded-2xl bg-slate-50/80 border border-slate-200/60 flex items-center gap-2.5 ${
                isCollapsed ? 'justify-center p-2' : ''
              }`}
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-2xs">
                {profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate leading-tight">
                    {profile.name}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate capitalize">
                    {profile.role === 'admin' ? 'Administrator' : 'Pembaca'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Logout Button */}
          <button
            type="button"
            onClick={handleLogout}
            title={isCollapsed ? 'Keluar' : undefined}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer ${
              isCollapsed ? 'justify-center px-0' : ''
            }`}
          >
            <LogOut className="w-4 h-4 flex-shrink-0 text-slate-400 hover:text-red-600" aria-hidden="true" />
            {!isCollapsed && <span>Keluar</span>}
          </button>
        </div>
      </aside>
    </>
  )
}
