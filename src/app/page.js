'use client'

import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import CatalogView from '@/components/CatalogView'
import { fetchBooks, getBooks, getSession, syncSessionFromSupabase } from '@/lib/storage'
import { Loader2 } from 'lucide-react'

export default function HomePage() {
  const [books, setBooks] = useState(() => {
    if (typeof window === 'undefined') return []
    return getBooks()
  })
  const [profile, setProfile] = useState(() => {
    if (typeof window === 'undefined') return null
    return getSession()
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function loadData() {
      const [bookData, userSession] = await Promise.all([
        fetchBooks(),
        syncSessionFromSupabase(),
      ])

      if (isMounted) {
        setBooks(bookData)
        setProfile(userSession)
        setLoading(false)
      }
    }

    loadData()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar profile={profile} />

      <main className="max-w-6xl mx-auto px-4 py-8 flex-1 w-full">
        {loading && books.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-3" />
            <p className="text-sm">Memuat katalog buku dari Supabase...</p>
          </div>
        ) : (
          <CatalogView initialBooks={books} />
        )}
      </main>
    </div>
  )
}
