// Helper Database LocalStorage untuk Aplikasi Perpus

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
    due_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // Lewat tempo (Terlambat)
    returned_at: null,
  },
]

// Seeder initialization
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

// Reset dan Muat Ulang Data Seeder Bawaan
export function resetToDefaultSeed() {
  if (typeof window === 'undefined') return
  localStorage.setItem('perpus_books', JSON.stringify(INITIAL_BOOKS))
  localStorage.setItem('perpus_users', JSON.stringify(INITIAL_USERS))
  localStorage.setItem('perpus_loans', JSON.stringify(INITIAL_LOANS))
  return true
}

// Auth and session helpers
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
  localStorage.removeItem('perpus_session')
  document.cookie = 'perpus_session=; path=/; max-age=0'
}

export function loginUser(email, password) {
  initLocalStorage()
  const users = getUsers()
  const user = users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase().trim() && u.password === password
  )
  if (!user) {
    return { error: 'Email atau password salah' }
  }
  const sessionData = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  }
  setSession(sessionData)
  return { success: true, user: sessionData }
}

export function registerUser(name, email, password) {
  initLocalStorage()
  const users = getUsers()
  const exists = users.some((u) => u.email.toLowerCase() === email.toLowerCase().trim())
  if (exists) {
    return { error: 'Email ini sudah terdaftar' }
  }

  const newUser = {
    id: 'usr-' + Date.now(),
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password,
    role: 'user', // Default selalu user
  }

  users.push(newUser)
  localStorage.setItem('perpus_users', JSON.stringify(users))

  const sessionData = {
    id: newUser.id,
    name: newUser.name,
    email: newUser.email,
    role: newUser.role,
  }
  setSession(sessionData)
  return { success: true, user: sessionData }
}

export function getUsers() {
  if (typeof window === 'undefined') return INITIAL_USERS
  initLocalStorage()
  const data = localStorage.getItem('perpus_users')
  return data ? JSON.parse(data) : INITIAL_USERS
}

// Books data operations
export function getBooks() {
  if (typeof window === 'undefined') return INITIAL_BOOKS
  initLocalStorage()
  const data = localStorage.getItem('perpus_books')
  return data ? JSON.parse(data) : INITIAL_BOOKS
}

export function getBookById(id) {
  const books = getBooks()
  return books.find((b) => Number(b.id) === Number(id)) || null
}

export function addBook({ title, author, category, stock, cover }) {
  const books = getBooks()
  const newBook = {
    id: Date.now(),
    title: title.trim(),
    author: author.trim(),
    category: category.trim(),
    stock: parseInt(stock, 10) || 0,
    cover: cover || '/covers/default-book.svg',
  }
  books.push(newBook)
  localStorage.setItem('perpus_books', JSON.stringify(books))
  return { success: true, book: newBook }
}

export function updateBookData(id, { title, author, category, stock, cover }) {
  const books = getBooks()
  const index = books.findIndex((b) => Number(b.id) === Number(id))
  if (index === -1) return { error: 'Buku tidak ditemukan' }

  books[index] = {
    ...books[index],
    title: title.trim(),
    author: author.trim(),
    category: category.trim(),
    stock: parseInt(stock, 10) || 0,
    cover: cover || books[index].cover || '/covers/default-book.svg',
  }
  localStorage.setItem('perpus_books', JSON.stringify(books))
  return { success: true, book: books[index] }
}

export function deleteBookData(id) {
  const loans = getLoans()
  const activeLoans = loans.filter(
    (l) => Number(l.book_id) === Number(id) && l.status === 'dipinjam'
  )
  if (activeLoans.length > 0) {
    return {
      error: `Buku tidak dapat dihapus karena masih memiliki ${activeLoans.length} peminjaman aktif.`,
    }
  }

  let books = getBooks()
  books = books.filter((b) => Number(b.id) !== Number(id))
  localStorage.setItem('perpus_books', JSON.stringify(books))
  return { success: true }
}

// Loans operations
export function getLoans() {
  if (typeof window === 'undefined') return INITIAL_LOANS
  initLocalStorage()
  const data = localStorage.getItem('perpus_loans')
  return data ? JSON.parse(data) : INITIAL_LOANS
}

export function borrowBookData(bookId, user) {
  if (!user) return { error: 'Harus login terlebih dahulu' }

  const loans = getLoans()
  const userActiveLoans = loans.filter(
    (l) => l.user_id === user.id && l.status === 'dipinjam'
  )

  // Aturan 1: Maksimal 3 buku aktif
  if (userActiveLoans.length >= 3) {
    return { error: 'Batas pinjam maksimal 3 buku aktif' }
  }

  // Aturan 2: Tidak boleh pinjam buku yang sama jika masih aktif
  const isAlreadyBorrowed = userActiveLoans.some(
    (l) => Number(l.book_id) === Number(bookId)
  )
  if (isAlreadyBorrowed) {
    return { error: 'Buku ini sedang kamu pinjam' }
  }

  const books = getBooks()
  const bookIndex = books.findIndex((b) => Number(b.id) === Number(bookId))
  if (bookIndex === -1) return { error: 'Buku tidak ditemukan' }
  if (books[bookIndex].stock <= 0) return { error: 'Stok buku habis' }

  // Kurangi stok 1
  books[bookIndex].stock -= 1
  localStorage.setItem('perpus_books', JSON.stringify(books))

  // Catat pinjaman (durasi 7 hari)
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

  return { success: true }
}

export function returnBookData(loanId, user) {
  const loans = getLoans()
  const loanIndex = loans.findIndex((l) => Number(l.id) === Number(loanId))
  if (loanIndex === -1) return { error: 'Peminjaman tidak ditemukan' }

  const loan = loans[loanIndex]
  if (loan.status !== 'dipinjam') return { error: 'Buku sudah dikembalikan' }

  if (loan.user_id !== user.id && user.role !== 'admin') {
    return { error: 'Tidak diizinkan mengembalikan pinjaman milik orang lain' }
  }

  // Update status & waktu kembali
  loans[loanIndex].status = 'dikembalikan'
  loans[loanIndex].returned_at = new Date().toISOString()
  localStorage.setItem('perpus_loans', JSON.stringify(loans))

  // Tambah stok buku 1
  const books = getBooks()
  const bookIndex = books.findIndex((b) => Number(b.id) === Number(loan.book_id))
  if (bookIndex !== -1) {
    books[bookIndex].stock += 1
    localStorage.setItem('perpus_books', JSON.stringify(books))
  }

  return { success: true }
}
