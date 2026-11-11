'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import Dropdown from '@/components/Dropdown'
import { useDialog } from '@/components/DialogContext'
import {
  fetchBooks,
  fetchCategories,
  addBook,
  updateBookData,
  deleteBookData,
  resolveBookCover,
  exportToCSV,
  updateBookRequestStatus,
} from '@/lib/storage'
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Search,
  BookOpen,
  AlertCircle,
  Loader2,
  Upload,
  Image as ImageIcon,
  Download,
  Sparkles,
} from 'lucide-react'

export default function AdminBooksManager() {
  const { confirm, alert, toast } = useDialog()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [books, setBooks] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('add') // 'add' | 'edit'
  const [selectedBook, setSelectedBook] = useState(null)
  const [fromRequestId, setFromRequestId] = useState(null)

  // Form states
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [category, setCategory] = useState('')
  const [stock, setStock] = useState('1')
  const [cover, setCover] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [saving, setSaving] = useState(false)

  const loadBooks = async () => {
    setLoading(true)
    const [bookData, catData] = await Promise.all([
      fetchBooks(),
      fetchCategories(),
    ])
    setBooks(bookData)
    setCategories(catData)
    setLoading(false)
  }

  useEffect(() => {
    loadBooks()
  }, [])

  // Buka modal secara otomatis jika diarahkan dari halaman usulan buku atau ada parameter action=add
  useEffect(() => {
    const action = searchParams.get('action')
    const paramTitle = searchParams.get('title')
    const paramAuthor = searchParams.get('author')
    const paramCategory = searchParams.get('category')
    const fromRequest = searchParams.get('from_request')

    if (action === 'add' || paramTitle || fromRequest) {
      setModalMode('add')
      setSelectedBook(null)
      setTitle(paramTitle || '')
      setAuthor(paramAuthor || '')
      if (paramCategory) {
        setCategory(paramCategory)
      } else if (categories.length > 0) {
        setCategory(categories[0].name)
      } else {
        setCategory('Novel')
      }
      setStock('1')
      setCover('')
      setErrorMsg('')
      setFromRequestId(fromRequest || null)
      setIsModalOpen(true)
    }
  }, [searchParams, categories])

  // R-32: Keyboard Escape listener for modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isModalOpen) {
        closeModal()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isModalOpen])

  const openAddModal = () => {
    setModalMode('add')
    setSelectedBook(null)
    setFromRequestId(null)
    setTitle('')
    setAuthor('')
    const defaultCat = categories.length > 0 ? categories[0].name : 'Novel'
    setCategory(defaultCat)
    setStock('1')
    setCover('')
    setErrorMsg('')
    setIsModalOpen(true)
  }

  const openEditModal = (book) => {
    setModalMode('edit')
    setSelectedBook(book)
    setFromRequestId(null)
    setTitle(book.title)
    setAuthor(book.author)
    setCategory(book.category)
    setStock(book.stock.toString())
    setCover(book.cover || '')
    setErrorMsg('')
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setErrorMsg('')
    setFromRequestId(null)
    if (searchParams.get('action') || searchParams.get('from_request')) {
      router.replace('/admin/buku')
    }
  }

  // Handle upload dan kompresi gambar cover di sisi client
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setErrorMsg('File harus berupa format gambar (PNG, JPG, WEBP, atau SVG)')
      return
    }

    if (file.type === 'image/svg+xml') {
      const reader = new FileReader()
      reader.onload = (event) => {
        setCover(event.target.result)
      }
      reader.readAsDataURL(file)
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new window.Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const maxDim = 600
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width)
            width = maxDim
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height)
            height = maxDim
          }
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)

        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85)
        setCover(compressedDataUrl)
      }
      img.src = event.target.result
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setSaving(true)

    let res
    if (modalMode === 'add') {
      res = await addBook({ title, author, category, stock, cover })
      if (!res?.error && fromRequestId) {
        try {
          await updateBookRequestStatus(fromRequestId, 'disetujui')
        } catch {}
      }
    } else {
      res = await updateBookData(selectedBook.id, { title, author, category, stock, cover })
    }
    setSaving(false)

    if (res?.error) {
      setErrorMsg(res.error)
    } else {
      toast({
        message: fromRequestId
          ? `Buku "${title}" sukses diterbitkan dari usulan pembaca!`
          : modalMode === 'add'
          ? `Buku "${title}" berhasil ditambahkan!`
          : `Data buku berhasil diperbarui!`,
        type: 'success',
      })
      closeModal()
      loadBooks()
    }
  }

  const handleDelete = async (book) => {
    const confirmed = await confirm({
      title: 'Hapus Data Buku',
      message: `Apakah Anda yakin ingin menghapus buku "${book.title}"? Buku yang masih memiliki transaksi peminjaman aktif tidak dapat dihapus.`,
      confirmText: 'Ya, Hapus Buku',
      cancelText: 'Batal',
      type: 'danger',
    })
    if (!confirmed) return

    const res = await deleteBookData(book.id)
    if (res?.error) {
      await alert({
        title: 'Penghapusan Gagal',
        message: res.error,
        type: 'error',
      })
    } else {
      toast({
        message: `Buku "${book.title}" berhasil dihapus.`,
        type: 'success',
      })
      loadBooks()
    }
  }

  const handleExportBooks = () => {
    if (books.length === 0) return
    const headers = ['ID', 'Judul Buku', 'Penulis', 'Kategori', 'Jumlah Stok']
    const rows = filteredBooks.map((b) => [b.id, b.title, b.author, b.category, b.stock])
    exportToCSV('katalog-buku-perpustakaan', headers, rows)
  }

  const filteredBooks = books.filter(
    (b) =>
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.author.toLowerCase().includes(search.toLowerCase()) ||
      b.category.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full sm:max-w-sm">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <Search className="w-4 h-4 text-slate-500" aria-hidden="true" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari buku, penulis, atau kategori..."
            aria-label="Cari buku, penulis, atau kategori"
            className="w-full h-11 pl-9 pr-4 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-2xs"
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleExportBooks}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 h-11 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition cursor-pointer"
            title="Ekspor katalog buku ke format CSV"
          >
            <Download className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
            <span>Ekspor CSV</span>
          </button>

          <button
            type="button"
            onClick={openAddModal}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 h-11 rounded-xl bg-emerald-700 text-white font-medium text-sm hover:bg-emerald-800 active:bg-emerald-900 transition shadow-2xs cursor-pointer"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>Tambah Buku</span>
          </button>
        </div>
      </div>

      {/* Content: Mobile Cards List & Desktop Table */}
      {filteredBooks.length > 0 ? (
        <div className="space-y-4">
          {/* TAMPILAN MOBILE: Kartu Buku Responsif (md:hidden) */}
          <div className="md:hidden space-y-3">
            {filteredBooks.map((book) => (
              <article
                key={book.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3"
              >
                <div className="flex items-start gap-3">
                  <div className="w-14 h-20 relative flex-shrink-0 rounded-xl bg-slate-100 overflow-hidden shadow-2xs border border-slate-200">
                    <img
                      src={resolveBookCover(book)}
                      alt={`Sampul ${book.title}`}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-mono font-bold text-slate-400">
                      ID #{book.id}
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-1 mt-0.5">
                      {book.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                      {book.author}
                    </p>

                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {book.category}
                      </span>
                      <span
                        className={`text-xs font-bold ${
                          book.stock > 0 ? 'text-slate-700' : 'text-red-600'
                        }`}
                      >
                        Stok: {book.stock}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tombol Aksi Mobile (Min touch target 44px) */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => openEditModal(book)}
                    className="flex-1 min-h-[44px] px-3 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Pencil className="w-4 h-4" />
                    <span>Ubah Buku</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(book)}
                    className="min-h-[44px] px-4 rounded-xl text-xs font-semibold bg-red-50 text-red-700 hover:bg-red-100 flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Hapus</span>
                  </button>
                </div>
              </article>
            ))}
          </div>

          {/* TAMPILAN DESKTOP: Tabel Buku Lengkap (hidden md:block) */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-600">
                  <tr>
                    <th scope="col" className="px-6 py-4">ID</th>
                    <th scope="col" className="px-6 py-4">Judul & Penulis</th>
                    <th scope="col" className="px-6 py-4">Kategori</th>
                    <th scope="col" className="px-6 py-4">Stok</th>
                    <th scope="col" className="px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBooks.map((book) => (
                    <tr key={book.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-6 py-4 text-xs font-mono text-slate-500">
                        #{book.id}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-14 relative flex-shrink-0 rounded-lg bg-slate-100 overflow-hidden shadow-2xs border border-slate-200">
                            <img
                              src={resolveBookCover(book)}
                              alt={`Sampul ${book.title}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 line-clamp-1">
                              {book.title}
                            </div>
                            <div className="text-xs text-slate-500 line-clamp-1">{book.author}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {book.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`font-semibold ${
                            book.stock > 0 ? 'text-slate-900' : 'text-red-600'
                          }`}
                        >
                          {book.stock}
                        </span>{' '}
                        <span className="text-xs text-slate-500">eksemplar</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(book)}
                            className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                            title="Edit Buku"
                            aria-label={`Edit data buku ${book.title}`}
                          >
                            <Pencil className="w-4 h-4" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(book)}
                            className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Hapus Buku"
                            aria-label={`Hapus buku ${book.title}`}
                          >
                            <Trash2 className="w-4 h-4" aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-600 text-sm">
          Tidak ada buku yang sesuai dengan pencarian.
        </div>
      )}

      {/* Modal Dialog Tambah / Edit */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-book-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs"
        >
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-4 sm:p-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <h3 id="modal-book-title" className="text-lg font-bold text-slate-900">
                {modalMode === 'add' ? 'Tambah Buku Baru' : 'Edit Data Buku'}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                aria-label="Tutup dialog"
                className="text-slate-500 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {errorMsg && (
              <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {fromRequestId && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-start gap-2.5 text-xs text-emerald-900">
                  <Sparkles className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Form Terisi Otomatis dari Usulan Buku</span>
                    <p className="text-[11px] text-emerald-800/90 mt-0.5">
                      Detail judul, penulis, dan kategori telah diisi dari usulan pembaca. Silakan sesuaikan jumlah stok dan unggah gambar sampul.
                    </p>
                  </div>
                </div>
              )}

              {/* Cover Upload Dropzone / Preview */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  Gambar Sampul Buku
                </label>

                {cover ? (
                  <div className="flex items-center gap-4 p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70">
                    <div className="w-16 h-22 relative rounded-lg overflow-hidden shadow-xs flex-shrink-0 bg-white border border-slate-200">
                      <img
                        src={cover}
                        alt="Preview Sampul"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-xs font-bold text-slate-800">Sampul Terpilih</p>
                      <p className="text-[11px] text-slate-500">Gambar berhasil dimuat dan siap disimpan.</p>
                      <div className="flex items-center gap-3 pt-1">
                        <label className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 cursor-pointer">
                          <span>Ganti Gambar</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="sr-only"
                          />
                        </label>
                        <span className="text-slate-300" aria-hidden="true">•</span>
                        <button
                          type="button"
                          onClick={() => setCover('')}
                          className="text-xs font-semibold text-red-600 hover:text-red-700 cursor-pointer"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/20 rounded-2xl p-5 flex flex-col items-center justify-center cursor-pointer transition-colors group">
                    <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-emerald-100 text-slate-500 group-hover:text-emerald-700 flex items-center justify-center mb-2 transition-colors">
                      <Upload className="w-5 h-5" aria-hidden="true" />
                    </div>
                    <p className="text-xs font-semibold text-slate-800 group-hover:text-emerald-800 text-center">
                      Klik untuk unggah gambar sampul buku
                    </p>
                    <p className="text-[11px] text-slate-500 text-center mt-0.5">
                      Format PNG, JPG, WEBP, atau SVG (otomatis dioptimalkan)
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="sr-only"
                    />
                  </label>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  Judul Buku
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Mis. Laskar Pelangi"
                  className="w-full h-11 px-3.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  Penulis
                </label>
                <input
                  type="text"
                  required
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Mis. Andrea Hirata"
                  className="w-full h-11 px-3.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                    Kategori
                  </label>
                  {categories.length > 0 ? (
                    <Dropdown
                      variant="form"
                      direction="up"
                      value={category}
                      onChange={(val) => setCategory(val)}
                      options={categories.map((c) => ({
                        value: c.name,
                        label: c.name,
                      }))}
                      placeholder="Pilih Kategori"
                    />
                  ) : (
                    <input
                      type="text"
                      required
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="Novel, Teknologi, dll"
                      className="w-full h-11 px-3.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  )}
                  <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Kategori database</span>
                    <Link
                      href="/admin/kategori"
                      className="text-emerald-700 hover:text-emerald-800 font-medium hover:underline"
                    >
                      + Kelola Kategori
                    </Link>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                    Jumlah Stok
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full h-11 px-3.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 h-11 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 h-11 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 active:bg-emerald-800 transition flex items-center gap-2 cursor-pointer"
                >
                  <span>{modalMode === 'add' ? 'Simpan Buku' : 'Perbarui Buku'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
