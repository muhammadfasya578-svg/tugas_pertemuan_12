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

      let totalFines = 0
      overdueLoans.forEach((l) => {
        const diffMs = now - new Date(l.due_date).getTime()
        const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
        totalFines += Math.max(0, days) * 1000
      })

      const bookLoanCounts = {}
      safeLoans.forEach((l) => {
        if (l.book_id) {
          bookLoanCounts[l.book_id] = (bookLoanCounts[l.book_id] || 0) + 1
        }
      })

      const popularBooks = safeBooks
        .map((b) => ({
          ...b,
          loanCount: bookLoanCounts[b.id] || 0,
          cover: resolveBookCover(b),
        }))
        .sort((a, b) => b.loanCount - a.loanCount)
        .slice(0, 4)

      const catCounts = {}
      safeBooks.forEach((b) => {
        if (b.category) {
          catCounts[b.category] = (catCounts[b.category] || 0) + 1
        }
      })

      const totalBooks = safeBooks.length || 1
      const categoryDistribution = Object.entries(catCounts)
        .map(([name, count]) => ({
          name,
          count,
          percentage: Math.round((count / totalBooks) * 100),
        }))
        .sort((a, b) => b.count - a.count)

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

      return {
        stats,
        recent,
        popularBooks,
        categoryDistribution,
        totalFines,
        isLive: true,
      }
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
    popularBooks: [],
    categoryDistribution: [],
    totalFines: 0,
    isLive: false,
  }
}

export async function fetchCategories() {
  const supabase = getSupabase()
  if (!supabase) return []

  try {
    const { data: booksData } = await supabase.from('books').select('category')
    const countMap = {}
    ;(booksData || []).forEach((b) => {
      if (b.category) {
        countMap[b.category] = (countMap[b.category] || 0) + 1
      }
    })

    const { data: catData, error: catErr } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true })

    if (!catErr && catData) {
      return catData.map((c) => ({
        ...c,
        book_count: countMap[c.name] || 0,
      }))
    }

    // Jika tabel categories belum dibuat di Supabase, ekstrak secara dinamis dari tabel books
    if (booksData && booksData.length > 0) {
      const distinctNames = Array.from(
        new Set(booksData.map((b) => b.category).filter(Boolean))
      ).sort()

      return distinctNames.map((name, idx) => ({
        id: `derived-${idx + 1}`,
        name,
        description: `Kategori ${name}`,
        book_count: countMap[name] || 0,
        isDerived: true,
      }))
    }

    return []
  } catch (err) {
    console.error('fetchCategories error:', err)
    return []
  }
}

export async function addCategory({ name, description = '' }) {
  const supabase = getSupabase()
  if (!supabase) return { error: 'Koneksi Supabase tidak aktif' }

  const cleanName = name.trim()
  if (!cleanName) return { error: 'Nama kategori wajib diisi' }

  try {
    const { data, error } = await supabase
      .from('categories')
      .insert({
        name: cleanName,
        description: description.trim(),
      })
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST205') {
        return {
          error:
            "Tabel 'categories' belum dibuat di database Supabase. Silakan jalankan script SQL supabase_setup.sql di Supabase SQL Editor.",
        }
      }
      if (error.code === '23505') {
        return { error: `Kategori "${cleanName}" sudah terdaftar.` }
      }
      return { error: error.message }
    }

    return { success: true, category: data }
  } catch (e) {
    return { error: e.message }
  }
}

export async function updateCategory(id, { name, description = '' }, oldName = null) {
  const supabase = getSupabase()
  if (!supabase) return { error: 'Koneksi Supabase tidak aktif' }

  const cleanName = name.trim()
  if (!cleanName) return { error: 'Nama kategori tidak boleh kosong' }

  try {
    const { data, error } = await supabase
      .from('categories')
      .update({
        name: cleanName,
        description: description.trim(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return { error: `Kategori "${cleanName}" sudah ada.` }
      }
      return { error: error.message }
    }

    // Jika nama kategori berubah, perbarui juga buku yang memakai kategori lama
    if (oldName && oldName !== cleanName) {
      await supabase
        .from('books')
        .update({ category: cleanName })
        .eq('category', oldName)
    }

    return { success: true, category: data }
  } catch (e) {
    return { error: e.message }
  }
}

export async function deleteCategory(id, name) {
  const supabase = getSupabase()
  if (!supabase) return { error: 'Koneksi Supabase tidak aktif' }

  try {
    // Cek apakah masih ada buku yang memakai kategori ini
    const { data: booksUsing } = await supabase
      .from('books')
      .select('id, title')
      .eq('category', name)

    if (booksUsing && booksUsing.length > 0) {
      return {
        error: `Kategori "${name}" tidak dapat dihapus karena masih digunakan oleh ${booksUsing.length} buku. Ubah kategori buku terkait terlebih dahulu.`,
      }
    }

    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) {
      return { error: error.message }
    }

    return { success: true }
  } catch (e) {
    return { error: e.message }
  }
}

export async function extendLoanData(loanId, user) {
  if (!user) return { error: 'Harus login terlebih dahulu' }
  const supabase = getSupabase()
  if (!supabase) return { error: 'Koneksi Supabase tidak aktif' }

  try {
    const { error } = await supabase.rpc('extend_loan', {
      p_loan_id: Number(loanId),
    })

    if (error) {
      if (error.code === 'PGRST202' || error.message?.includes('function public.extend_loan') || error.message?.includes('does not exist')) {
        const { data: loan, error: fetchErr } = await supabase
          .from('loans')
          .select('*')
          .eq('id', Number(loanId))
          .single()

        if (fetchErr || !loan) {
          return { error: 'Peminjaman tidak ditemukan' }
        }

        if (loan.status !== 'dipinjam') {
          return { error: 'Buku sudah dikembalikan' }
        }

        if (loan.renewed) {
          return { error: 'Peminjaman sudah pernah diperpanjang sebelumnya' }
        }

        if (new Date(loan.due_date).getTime() < Date.now()) {
          return { error: 'Buku sudah melewati jatuh tempo, tidak dapat diperpanjang' }
        }

        const newDueDate = new Date(new Date(loan.due_date).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
        const { error: updateErr } = await supabase
          .from('loans')
          .update({
            due_date: newDueDate,
            renewed: true,
          })
          .eq('id', Number(loanId))

        if (updateErr) return { error: updateErr.message }
        return { success: true }
      }

      return { error: error.message }
    }

    return { success: true }
  } catch (e) {
    return { error: e.message }
  }
}

export async function fetchFavorites(userId) {
  if (!userId) return []
  const supabase = getSupabase()

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('book_id')
        .eq('user_id', userId)

      if (!error && data) {
        return data.map((f) => Number(f.book_id))
      }
    } catch {}
  }

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(`perpus_favs_${userId}`)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  }

  return []
}

export async function toggleFavorite(bookId, userId) {
  if (!userId) return { error: 'Silakan login terlebih dahulu untuk menandai favorit' }
  const cleanBookId = Number(bookId)
  const supabase = getSupabase()

  let isNowFavorite = false

  if (supabase) {
    try {
      const { data: existing, error: checkErr } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', userId)
        .eq('book_id', cleanBookId)
        .maybeSingle()

      if (!checkErr) {
        if (existing) {
          await supabase.from('favorites').delete().eq('id', existing.id)
          isNowFavorite = false
        } else {
          await supabase.from('favorites').insert({
            user_id: userId,
            book_id: cleanBookId,
          })
          isNowFavorite = true
        }

        if (typeof window !== 'undefined') {
          try {
            const raw = localStorage.getItem(`perpus_favs_${userId}`)
            let list = raw ? JSON.parse(raw) : []
            if (isNowFavorite) {
              list = Array.from(new Set([...list, cleanBookId]))
            } else {
              list = list.filter((id) => id !== cleanBookId)
            }
            localStorage.setItem(`perpus_favs_${userId}`, JSON.stringify(list))
          } catch {}
        }

        return { success: true, isFavorite: isNowFavorite }
      }
    } catch {}
  }

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(`perpus_favs_${userId}`)
      let list = raw ? JSON.parse(raw) : []
      if (list.includes(cleanBookId)) {
        list = list.filter((id) => id !== cleanBookId)
        isNowFavorite = false
      } else {
        list.push(cleanBookId)
        isNowFavorite = true
      }
      localStorage.setItem(`perpus_favs_${userId}`, JSON.stringify(list))
      return { success: true, isFavorite: isNowFavorite }
    } catch {}
  }

  return { success: true, isFavorite: false }
}

export async function fetchReviews(bookId) {
  const cleanBookId = Number(bookId)
  const supabase = getSupabase()

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*, user:profiles(name, email)')
        .eq('book_id', cleanBookId)
        .order('created_at', { ascending: false })

      if (!error && data) {
        const total = data.length
        const sum = data.reduce((acc, r) => acc + (Number(r.rating) || 0), 0)
        const avg = total > 0 ? (sum / total).toFixed(1) : '0'

        return {
          reviews: data.map((r) => ({
            ...r,
            userName: r.user?.name || 'Pembaca',
            userEmail: r.user?.email || '',
          })),
          averageRating: Number(avg),
          totalReviews: total,
        }
      }
    } catch {}
  }

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(`perpus_reviews_${cleanBookId}`)
      const localReviews = raw ? JSON.parse(raw) : []
      const total = localReviews.length
      const sum = localReviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0)
      const avg = total > 0 ? (sum / total).toFixed(1) : '0'

      return {
        reviews: localReviews,
        averageRating: Number(avg),
        totalReviews: total,
      }
    } catch {}
  }

  return { reviews: [], averageRating: 0, totalReviews: 0 }
}

export async function addReview({ bookId, rating, comment, user }) {
  if (!user) return { error: 'Harus login untuk memberikan ulasan' }
  const cleanBookId = Number(bookId)
  const cleanRating = parseInt(rating, 10)
  const cleanComment = (comment || '').trim()

  if (isNaN(cleanRating) || cleanRating < 1 || cleanRating > 5) {
    return { error: 'Rating harus antara 1 sampai 5 bintang' }
  }

  if (!cleanComment) {
    return { error: 'Tuliskan ulasan singkat Anda' }
  }

  const supabase = getSupabase()
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .insert({
          user_id: user.id,
          book_id: cleanBookId,
          rating: cleanRating,
          comment: cleanComment,
        })
        .select('*, user:profiles(name, email)')
        .single()

      if (!error && data) {
        return {
          success: true,
          review: {
            ...data,
            userName: data.user?.name || user.name || 'Pembaca',
          },
        }
      }
    } catch {}
  }

  if (typeof window !== 'undefined') {
    try {
      const newReview = {
        id: Date.now(),
        user_id: user.id,
        book_id: cleanBookId,
        rating: cleanRating,
        comment: cleanComment,
        created_at: new Date().toISOString(),
        userName: user.name || 'Pembaca',
        userEmail: user.email || '',
      }
      const raw = localStorage.getItem(`perpus_reviews_${cleanBookId}`)
      const list = raw ? JSON.parse(raw) : []
      list.unshift(newReview)
      localStorage.setItem(`perpus_reviews_${cleanBookId}`, JSON.stringify(list))
      return { success: true, review: newReview }
    } catch {}
  }

  return { success: true }
}

export function exportToCSV(filename, headers, rows) {
  if (typeof window === 'undefined') return

  const escapeCSV = (val) => {
    if (val === null || val === undefined) return '""'
    const str = String(val).replace(/"/g, '""')
    return `"${str}"`
  }

  const csvContent =
    '\uFEFF' +
    [
      headers.map(escapeCSV).join(','),
      ...rows.map((row) => row.map(escapeCSV).join(',')),
    ].join('\r\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
