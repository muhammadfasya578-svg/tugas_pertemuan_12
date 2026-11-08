// Adapter Database Supabase & LocalStorage untuk Aplikasi Perpus
import { createClient } from '@/lib/supabase/client'

let supabaseInstance = null

export function getSupabase() {
  if (typeof window === 'undefined') return null
  if (!supabaseInstance && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      supabaseInstance = createClient()
    } catch {
      supabaseInstance = null
    }
  }
  return supabaseInstance
}

export const INITIAL_BOOKS = [
  { id: 1, title: 'Laskar Pelangi', author: 'Andrea Hirata', category: 'Novel', stock: 3, cover: '/covers/laskar-pelangi.svg' },
  { id: 2, title: 'Bumi Manusia', author: 'Pramoedya A. Toer', category: 'Novel', stock: 2, cover: '/covers/bumi-manusia.svg' },
  { id: 3, title: 'Filosofi Teras', author: 'Henry Manampiring', category: 'Self-help', stock: 4, cover: '/covers/filosofi-teras.svg' },
  { id: 4, title: 'Atomic Habits', author: 'James Clear', category: 'Self-help', stock: 2, cover: '/covers/atomic-habits.svg' },
  { id: 5, title: 'Clean Code', author: 'Robert C. Martin', category: 'Teknologi', stock: 3, cover: '/covers/clean-code.svg' },
  { id: 6, title: 'The Pragmatic Programmer', author: 'Andrew Hunt', category: 'Teknologi', stock: 1, cover: '/covers/the-pragmatic-programmer.svg' },
  { id: 7, title: 'Sapiens', author: 'Yuval Noah Harari', category: 'Sejarah', stock: 2, cover: '/covers/sapiens.svg' },
  { id: 8, title: 'Cantik Itu Luka', author: 'Eka Kurniawan', category: 'Novel', stock: 0, cover: '/covers/cantik-itu-luka.svg' },
]

export const INITIAL_USERS = [
  { id: 'usr-1', name: 'Admin Utama', email: 'admin1@perpus.com', password: 'adminpassword123', role: 'admin' },
  { id: 'usr-2', name: 'Admin Koleksi', email: 'admin2@perpus.com', password: 'adminpassword123', role: 'admin' },
  { id: 'usr-3', name: 'Admin Sirkulasi', email: 'admin3@perpus.com', password: 'adminpassword123', role: 'admin' },
  { id: 'usr-4', name: 'Ahmad Fauzi', email: 'user@perpus.com', password: 'userpassword123', role: 'user' },
]

export const INITIAL_LOANS = [
  {
    id: 1,
    user_id: 'usr-4',
    book_id: 1,
    status: 'dipinjam',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    returned_at: null,
  },
  {
    id: 2,
    user_id: 'usr-4',
    book_id: 3,
    status: 'dipinjam',
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    due_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    returned_at: null,
  },
]

// Inisialisasi dan sinkronisasi cache lokal
export function initLocalStorage() {
  if (typeof window === 'undefined') return
  if (!localStorage.getItem('perpus_books')) {
    localStorage.setItem('perpus_books', JSON.stringify(INITIAL_BOOKS))
  }
  if (!localStorage.getItem('perpus_users')) {
    localStorage.setItem('perpus_users', JSON.stringify(INITIAL_USERS))
  }
  if (!localStorage.getItem('perpus_loans')) {
    localStorage.setItem('perpus_loans', JSON.stringify(INITIAL_LOANS))
  }
}

// Reset data lokal jika diperlukan
export function resetToDefaultSeed() {
  if (typeof window === 'undefined') return
  localStorage.setItem('perpus_books', JSON.stringify(INITIAL_BOOKS))
  localStorage.setItem('perpus_users', JSON.stringify(INITIAL_USERS))
  localStorage.setItem('perpus_loans', JSON.stringify(INITIAL_LOANS))
  return true
}

// Sesi dan Cookie
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

// Autentikasi Pengguna
export async function loginUser(email, password) {
  const supabase = getSupabase()
  const trimmedEmail = email.toLowerCase().trim()

  if (supabase) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      })

      if (!error && data?.user) {
        // Ambil profil dari database Supabase
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single()

        const sessionUser = {
          id: data.user.id,
          email: data.user.email,
          name: profile?.name || data.user.user_metadata?.name || trimmedEmail.split('@')[0],
          role: profile?.role || 'user',
        }
        setSession(sessionUser)
        return { user: sessionUser }
      }
    } catch {}
  }

  // Fallback akun lokal
  initLocalStorage()
  const users = getUsers()
  const user = users.find(
    (u) => u.email.toLowerCase() === trimmedEmail && u.password === password
  )
  if (!user) {
    return { error: 'Email atau password salah' }
  }

  const sessionUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  }
  setSession(sessionUser)
  return { user: sessionUser }
}

export async function registerUser(name, email, password) {
  const supabase = getSupabase()
  const trimmedEmail = email.toLowerCase().trim()
  const trimmedName = name.trim()

  if (supabase) {
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
  }

  // Fallback lokal
  initLocalStorage()
  const users = getUsers()
  if (users.some((u) => u.email.toLowerCase() === trimmedEmail)) {
    return { error: 'Email sudah terdaftar' }
  }

  const newUser = {
    id: `usr-${Date.now()}`,
    name: trimmedName,
    email: trimmedEmail,
    password,
    role: 'user',
  }
  users.push(newUser)
  localStorage.setItem('perpus_users', JSON.stringify(users))

  const sessionUser = {
    id: newUser.id,
    name: newUser.name,
    email: newUser.email,
    role: newUser.role,
  }
  setSession(sessionUser)
  return { user: sessionUser }
}

// Operasi Pengguna
export function getUsers() {
  if (typeof window === 'undefined') return INITIAL_USERS
  const data = localStorage.getItem('perpus_users')
  return data ? JSON.parse(data) : INITIAL_USERS
}

// Operasi Buku
export function getBooks() {
  if (typeof window === 'undefined') return INITIAL_BOOKS
  initLocalStorage()
  const data = localStorage.getItem('perpus_books')
  return data ? JSON.parse(data) : INITIAL_BOOKS
}

export async function fetchBooksFromSupabase() {
  const supabase = getSupabase()
  if (!supabase) return getBooks()
  try {
    const { data, error } = await supabase.from('books').select('*').order('id')
    if (!error && data && data.length > 0) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('perpus_books', JSON.stringify(data))
      }
      return data
    }
  } catch {}
  return getBooks()
}

export function getBookById(id) {
  const books = getBooks()
  return books.find((b) => Number(b.id) === Number(id)) || null
}

export async function addBook({ title, author, category, stock, cover }) {
  const supabase = getSupabase()
  const cleanCover = cover || '/covers/default-book.svg'
  const parsedStock = parseInt(stock, 10) || 0

  if (supabase) {
    try {
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

      if (!error && data) {
        const books = getBooks()
        books.push(data)
        if (typeof window !== 'undefined') {
          localStorage.setItem('perpus_books', JSON.stringify(books))
        }
        return { success: true, book: data }
      }
    } catch {}
  }

  const books = getBooks()
  const newBook = {
    id: Date.now(),
    title: title.trim(),
    author: author.trim(),
    category: category.trim(),
    stock: parsedStock,
    cover: cleanCover,
  }
  books.push(newBook)
  if (typeof window !== 'undefined') {
    localStorage.setItem('perpus_books', JSON.stringify(books))
  }
  return { success: true, book: newBook }
}

export async function updateBookData(id, { title, author, category, stock, cover }) {
  const supabase = getSupabase()
  const parsedStock = parseInt(stock, 10) || 0

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('books')
        .update({
          title: title.trim(),
          author: author.trim(),
          category: category.trim(),
          stock: parsedStock,
          cover,
        })
        .eq('id', id)
        .select()
        .single()

      if (!error && data) {
        const books = getBooks()
        const idx = books.findIndex((b) => Number(b.id) === Number(id))
        if (idx !== -1) books[idx] = data
        if (typeof window !== 'undefined') {
          localStorage.setItem('perpus_books', JSON.stringify(books))
        }
        return { success: true, book: data }
      }
    } catch {}
  }

  const books = getBooks()
  const index = books.findIndex((b) => Number(b.id) === Number(id))
  if (index === -1) return { error: 'Buku tidak ditemukan' }

  books[index] = {
    ...books[index],
    title: title.trim(),
    author: author.trim(),
    category: category.trim(),
    stock: parsedStock,
    cover: cover || books[index].cover || '/covers/default-book.svg',
  }
  if (typeof window !== 'undefined') {
    localStorage.setItem('perpus_books', JSON.stringify(books))
  }
  return { success: true, book: books[index] }
}

export async function deleteBookData(id) {
  const supabase = getSupabase()

  // Cek peminjaman aktif
  const loans = getLoans()
  const activeLoans = loans.filter(
    (l) => Number(l.book_id) === Number(id) && l.status === 'dipinjam'
  )
  if (activeLoans.length > 0) {
    return {
      error: `Buku tidak dapat dihapus karena masih memiliki ${activeLoans.length} peminjaman aktif.`,
    }
  }

  if (supabase) {
    try {
      const { error } = await supabase.from('books').delete().eq('id', id)
      if (error) {
        return { error: error.message }
      }
    } catch {}
  }

  let books = getBooks()
  books = books.filter((b) => Number(b.id) !== Number(id))
  if (typeof window !== 'undefined') {
    localStorage.setItem('perpus_books', JSON.stringify(books))
  }
  return { success: true }
}

// Operasi Peminjaman
export function getLoans() {
  if (typeof window === 'undefined') return INITIAL_LOANS
  initLocalStorage()
  const data = localStorage.getItem('perpus_loans')
  return data ? JSON.parse(data) : INITIAL_LOANS
}

export async function borrowBookData(bookId, user) {
  if (!user) return { error: 'Harus login terlebih dahulu' }

  const supabase = getSupabase()
  if (supabase) {
    try {
      const { error } = await supabase.rpc('borrow_book', {
        p_book_id: Number(bookId),
      })
      if (error) {
        return { error: error.message }
      }
      await fetchBooksFromSupabase()
      return { success: true }
    } catch (e) {
      return { error: e.message }
    }
  }

  const loans = getLoans()
  const userActiveLoans = loans.filter(
    (l) => l.user_id === user.id && l.status === 'dipinjam'
  )
  if (userActiveLoans.length >= 3) {
    return { error: 'Batas pinjam maksimal 3 buku aktif.' }
  }

  const alreadyBorrowed = loans.some(
    (l) =>
      l.user_id === user.id &&
      Number(l.book_id) === Number(bookId) &&
      l.status === 'dipinjam'
  )
  if (alreadyBorrowed) {
    return { error: 'Buku ini sedang kamu pinjam.' }
  }

  const books = getBooks()
  const bookIndex = books.findIndex((b) => Number(b.id) === Number(bookId))
  if (bookIndex === -1) return { error: 'Buku tidak ditemukan' }
  if (books[bookIndex].stock <= 0) return { error: 'Stok buku habis' }

  books[bookIndex].stock -= 1
  localStorage.setItem('perpus_books', JSON.stringify(books))

  const newLoan = {
    id: Date.now(),
    user_id: user.id,
    book_id: Number(bookId),
    status: 'dipinjam',
    created_at: new Date().toISOString(),
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    returned_at: null,
  }
  loans.unshift(newLoan)
  localStorage.setItem('perpus_loans', JSON.stringify(loans))
  return { success: true, loan: newLoan }
}

export async function returnBookData(loanId, user) {
  const supabase = getSupabase()
  if (supabase) {
    try {
      const { error } = await supabase.rpc('return_book', {
        p_loan_id: Number(loanId),
      })
      if (error) {
        return { error: error.message }
      }
      await fetchBooksFromSupabase()
      return { success: true }
    } catch (e) {
      return { error: e.message }
    }
  }

  const loans = getLoans()
  const loanIndex = loans.findIndex((l) => Number(l.id) === Number(loanId))
  if (loanIndex === -1) return { error: 'Peminjaman tidak ditemukan' }

  const loan = loans[loanIndex]
  if (loan.status !== 'dipinjam') return { error: 'Buku sudah dikembalikan' }

  loans[loanIndex].status = 'dikembalikan'
  loans[loanIndex].returned_at = new Date().toISOString()
  localStorage.setItem('perpus_loans', JSON.stringify(loans))

  const books = getBooks()
  const bookIndex = books.findIndex((b) => Number(b.id) === Number(loan.book_id))
  if (bookIndex !== -1) {
    books[bookIndex].stock += 1
    localStorage.setItem('perpus_books', JSON.stringify(books))
  }
  return { success: true }
}
