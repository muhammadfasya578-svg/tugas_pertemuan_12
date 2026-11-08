'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminSidebar from '@/components/AdminSidebar'
import { getSession, syncSessionFromSupabase } from '@/lib/storage'

export default function AdminLayout({ children }) {
  const [profile, setProfile] = useState(() => {
    if (typeof window === 'undefined') return null
    return getSession()
  })
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    let isMounted = true

    async function checkAdmin() {
      const s = await syncSessionFromSupabase()
      if (!isMounted) return

      if (!s || s.role !== 'admin') {
        router.push('/')
        return
      }
      setProfile(s)
      setLoading(false)
    }

    checkAdmin()

    return () => {
      isMounted = false
    }
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500 text-sm">Memeriksa hak akses admin dari Supabase...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      <AdminSidebar profile={profile} />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="p-4 sm:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  )
}
