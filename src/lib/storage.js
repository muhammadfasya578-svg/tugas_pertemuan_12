import { createClient } from '@/lib/supabase/client'

let supabaseInstance = null

export function getSupabase() {
  if (typeof window === 'undefined') return null
  if (!supabaseInstance && process.env.SUPABASE_URL) {
    try {
      supabaseInstance = createClient()
    } catch {
      supabaseInstance = null
    }
  }
  return supabaseInstance
}

export function resolveBookCover(book) {
  if (!book) return '/covers/default-book.svg'
  if (book.cover) {
    if (book.cover.startsWith('data:') || book.cover.startsWith('http')) {
      return book.cover
    }
    if (book.cover.endsWith('.svg') && !book.cover.includes('default-book')) {
      return book.cover.replace('.svg', '.jpg')
    }
    return book.cover
  }
  return '/covers/default-book.svg'
}

export function initLocalStorage() {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem('perpus_books')
    localStorage.removeItem('perpus_loans')
  } catch {}
}

export function getSession() {
  if (typeof window === 'undefined') return null
  const sessionStr = localStorage.getItem('perpus_session')
  if (!sessionStr) return null
  try {
    return JSON.parse(sessionStr)
  } catch {
    return null
  }
}

export function setSession(user) {
  if (typeof window === 'undefined') return
  localStorage.setItem('perpus_session', JSON.stringify(user))
  document.cookie = `perpus_session=${encodeURIComponent(JSON.stringify(user))}; path=/; max-age=86400`
}

export function clearSession() {
  if (typeof window === 'undefined') return
  const supabase = getSupabase()
  if (supabase) {
    try {
      supabase.auth.signOut()
    } catch {}
  }
  localStorage.removeItem('perpus_session')
  document.cookie = 'perpus_session=; path=/; max-age=0'
}

export async function syncSessionFromSupabase() {
  const supabase = getSupabase()
  if (!supabase) return getSession()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      clearSession()
      return null
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    const sessionUser = {
      id: user.id,
      email: user.email,
      name: profile?.name || user.user_metadata?.name || user.email.split('@')[0],
      role: profile?.role || 'user',
    }
    setSession(sessionUser)
    return sessionUser
  } catch {
    return getSession()
  }
}

export async function loginUser(email, password) {
  const supabase = getSupabase()
  const trimmedEmail = email.toLowerCase().trim()

  if (!supabase) {
    return { error: 'Konfigurasi Supabase tidak ditemukan' }
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password,
    })

    if (error) {
      if (error.code === 'invalid_credentials' || error.message.includes('Invalid login credentials')) {
        return { error: 'Email atau password salah' }
      }
      if (error.code === 'email_not_confirmed' || error.message.includes('Email not confirmed')) {
        return {
          error: 'Email belum dikonfirmasi di Supabase. Silakan jalankan script SQL supabase_setup.sql di dashboard Supabase.',
        }
      }
      return { error: error.message }
    }

    if (data?.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle()

      const sessionUser = {
        id: data.user.id,
        email: data.user.email,
        name: profile?.name || data.user.user_metadata?.name || trimmedEmail.split('@')[0],
        role: profile?.role || 'user',
      }
      setSession(sessionUser)
      return { user: sessionUser }
    }
  } catch (err) {
    return { error: err.message || 'Gagal terhubung ke Supabase' }
  }

  return { error: 'Gagal melakukan login' }
}

export async function registerUser(name, email, password) {
  const supabase = getSupabase()
  const trimmedEmail = email.toLowerCase().trim()
  const trimmedName = name.trim()

  if (!supabase) {
    return { error: 'Konfigurasi Supabase tidak ditemukan' }
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: {
        data: { name: trimmedName },
      },
    })

    if (error) {
      return { error: error.message }
    }

    if (data?.user) {
      const sessionUser = {
        id: data.user.id,
        email: trimmedEmail,
        name: trimmedName,
        role: 'user',
      }
      setSession(sessionUser)
      return { user: sessionUser }
    }
  } catch (e) {
    return { error: e.message }
  }

  return { error: 'Gagal mendaftar' }
}

export async function fetchBooks() {
  const supabase = getSupabase()
  if (!supabase) return []

  try {
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .order('id', { ascending: true })

    if (error) {
      console.error('Gagal mengambil buku dari database Supabase:', error.message)
      return []
    }

    return (data || []).map((b) => ({
      ...b,
      cover: resolveBookCover(b),
    }))
  } catch (err) {
    console.error('Koneksi Supabase error saat fetchBooks:', err)
    return []
  }
}

export function getBooks() {
  return []
}

export async function fetchBookById(id) {
  const supabase = getSupabase()
  if (!supabase) return null

  try {
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .eq('id', Number(id))
      .maybeSingle()

    if (error || !data) {
      return null
    }

    return {
      ...data,
      cover: resolveBookCover(data),
    }
  } catch (err) {
    console.error('Koneksi Supabase error saat fetchBookById:', err)
    return null
  }
}

export function getBookById(id) {
  return null
}

export async function addBook({ title, author, category, stock, cover }) {
  const supabase = getSupabase()
  if (!supabase) return { error: 'Koneksi Supabase tidak aktif' }

  const cleanCover = cover || '/covers/default-book.svg'
  const parsedStock = parseInt(stock, 10) || 0

  const { data, error } = await supabase
    .from('books')
    .insert({
      title: title.trim(),
      author: author.trim(),
      category: category.trim(),
      stock: parsedStock,
      cover: cleanCover,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  await fetchBooks()
  return { success: true, book: data }
}

export async function updateBookData(id, { title, author, category, stock, cover }) {
  const supabase = getSupabase()
  if (!supabase) return { error: 'Koneksi Supabase tidak aktif' }

  const parsedStock = parseInt(stock, 10) || 0

  const { data, error } = await supabase
    .from('books')
    .update({
      title: title.trim(),
      author: author.trim(),
      category: category.trim(),
      stock: parsedStock,
      cover,
    })
    .eq('id', Number(id))
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  await fetchBooks()
  return { success: true, book: data }
}

export async function deleteBookData(id) {
  const supabase = getSupabase()
  if (!supabase) return { error: 'Koneksi Supabase tidak aktif' }

  const { data: activeLoans, error: loanErr } = await supabase
    .from('loans')
    .select('id')
    .eq('book_id', Number(id))
    .eq('status', 'dipinjam')

  if (!loanErr && activeLoans && activeLoans.length > 0) {
    return {
      error: `Buku tidak dapat dihapus karena masih memiliki ${activeLoans.length} peminjaman aktif.`,
    }
  }

  const { error } = await supabase.from('books').delete().eq('id', Number(id))
  if (error) {
    return { error: error.message }
  }

  await fetchBooks()
  return { success: true }
}

export async function fetchLoans(userId = null) {
  const supabase = getSupabase()
  if (!supabase) return []

  try {
    let query = supabase
      .from('loans')
      .select('*, book:books(*), user:profiles(*)')
      .order('created_at', { ascending: false })

    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data, error } = await query
    if (error) {
      console.error('Gagal mengambil data peminjaman dari Supabase:', error.message)
      return []
    }

    return (data || []).map((l) => ({
      ...l,
      userName: l.user?.name || 'User',
      userEmail: l.user?.email || '-',
      bookTitle: l.book?.title || 'Buku dihapus',
      bookCategory: l.book?.category || '-',
      bookCover: l.book ? resolveBookCover(l.book) : '/covers/default-book.svg',
    }))
  } catch (err) {
    console.error('Koneksi Supabase error saat fetchLoans:', err)
    return []
  }
}

export function getLoans() {
  return []
}

export async function borrowBookData(bookId, user) {
  if (!user) return { error: 'Harus login terlebih dahulu' }

  const supabase = getSupabase()
  if (!supabase) return { error: 'Koneksi Supabase tidak tersedia' }

  try {
    const { error } = await supabase.rpc('borrow_book', {
      p_book_id: Number(bookId),
    })

    if (error) {
      return { error: error.message }
    }

    await fetchBooks()
    return { success: true }
  } catch (e) {
    return { error: e.message }
  }
}

export async function returnBookData(loanId, user) {
  const supabase = getSupabase()
  if (!supabase) return { error: 'Koneksi Supabase tidak tersedia' }

  try {
    const { error } = await supabase.rpc('return_book', {
      p_loan_id: Number(loanId),
    })

    if (error) {
      return { error: error.message }
    }

    await fetchBooks()
    return { success: true }
  } catch (e) {
    return { error: e.message }
  }
}

export async function fetchProfiles() {
  const supabase = getSupabase()
  if (supabase) {
    try {
      const { data, error } = await supabase.from('profiles').select('*')
      if (!error && data) return data
    } catch {}
  }
  return []
}

export function getUsers() {
  return []
}

export async function fetchDashboardMetrics() {
  const supabase = getSupabase()
  const now = Date.now()

  if (supabase) {
    try {
      const [{ data: books }, { data: profiles }, { data: loans }] = await Promise.all([
        supabase.from('books').select('*').order('id', { ascending: true }),
        supabase.from('profiles').select('*'),
        supabase.from('loans').select('*, book:books(*), user:profiles(*)').order('created_at', { ascending: false }),
      ])

      const safeBooks = books || []
      const safeProfiles = profiles || []
      const safeLoans = loans || []

      const activeLoans = safeLoans.filter((l) => l.status === 'dipinjam')
      const overdueLoans = activeLoans.filter(
        (l) => l.due_date && new Date(l.due_date).getTime() < now
      )

      const stats = [
        {
          label: 'Total Buku',
          value: safeBooks.length,
          iconName: 'BookOpen',
          color: 'text-emerald-600',
          bg: 'bg-emerald-50',
        },
        {
          label: 'Total Pengguna',
          value: safeProfiles.length,
          iconName: 'Users',
          color: 'text-blue-600',
          bg: 'bg-blue-50',
        },
        {
          label: 'Peminjaman Aktif',
          value: activeLoans.length,
          iconName: 'Clock',
          color: 'text-amber-600',
          bg: 'bg-amber-50',
        },
        {
          label: 'Peminjaman Terlambat',
          value: overdueLoans.length,
          iconName: 'AlertTriangle',
          color: 'text-red-600',
          bg: 'bg-red-50',
        },
      ]

      const recent = safeLoans.slice(0, 5).map((l) => ({
        ...l,
        userName: l.user?.name || 'User',
        userEmail: l.user?.email || '-',
        bookTitle: l.book?.title || 'Buku dihapus',
      }))

      return { stats, recent, isLive: true }
    } catch (err) {
      console.error('fetchDashboardMetrics error:', err)
    }
  }

  return {
    stats: [
      { label: 'Total Buku', value: 0, iconName: 'BookOpen', color: 'text-emerald-600', bg: 'bg-emerald-50' },
      { label: 'Total Pengguna', value: 0, iconName: 'Users', color: 'text-blue-600', bg: 'bg-blue-50' },
      { label: 'Peminjaman Aktif', value: 0, iconName: 'Clock', color: 'text-amber-600', bg: 'bg-amber-50' },
      { label: 'Peminjaman Terlambat', value: 0, iconName: 'AlertTriangle', color: 'text-red-600', bg: 'bg-red-50' },
    ],
    recent: [],
    isLive: false,
  }
}
