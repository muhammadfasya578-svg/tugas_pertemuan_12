'use client'

import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import CatalogView from '@/components/CatalogView'
import { getBooks, getSession } from '@/lib/storage'

export default function HomePage() {
  const [books, setBooks] = useState(() => {
    if (typeof window === 'undefined') return []
    return getBooks()
  })
  const [profile, setProfile] = useState(() => {
    if (typeof window === 'undefined') return null
    return getSession()
  })

  useEffect(() => {
    setBooks(getBooks())
    setProfile(getSession())
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar profile={profile} />

      <main className="max-w-6xl mx-auto px-4 py-8 flex-1 w-full">
        <CatalogView initialBooks={books} />
      </main>
    </div>
  )
}
