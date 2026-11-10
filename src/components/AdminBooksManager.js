'use client'

import { useState, useEffect } from 'react'
import {
  fetchBooks,
  getBooks,
  addBook,
  updateBookData,
  deleteBookData,
  resolveBookCover,
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
} from 'lucide-react'

export default function AdminBooksManager() {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('add') // 'add' | 'edit'
  const [selectedBook, setSelectedBook] = useState(null)

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
    const data = await fetchBooks()
    setBooks(data)
    setLoading(false)
  }

  useEffect(() => {
    loadBooks()
  }, [])

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
    setTitle('')
    setAuthor('')
    setCategory('Novel')
    setStock('1')
    setCover('')
    setErrorMsg('')
    setIsModalOpen(true)
  }

  const openEditModal = (book) => {
    setModalMode('edit')
    setSelectedBook(book)
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
    } else {
      res = await updateBookData(selectedBook.id, { title, author, category, stock, cover })
    }
    setSaving(false)

    if (res?.error) {
      setErrorMsg(res.error)
    } else {
      closeModal()
      loadBooks()
    }
  }

  const handleDelete = async (book) => {
    const confirmed = window.confirm(
      `Yakin ingin menghapus buku "${book.title}"?`
    )
    if (!confirmed) return

    const res = await deleteBookData(book.id)
    if (res?.error) {
      alert(res.error)
    } else {
      loadBooks()
    }
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <Search className="w-4 h-4 text-slate-500" aria-hidden="true" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari buku, penulis, atau kategori..."
            aria-label="Cari buku, penulis, atau kategori"
            className="w-full h-10 pl-9 pr-4 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>

        {/* Add Button */}
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 h-10 rounded-xl bg-emerald-600 text-white font-medium text-sm hover:bg-emerald-700 active:bg-emerald-800 transition shadow-xs"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span>Tambah Buku Baru</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
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
              {filteredBooks.length > 0 ? (
                filteredBooks.map((book) => (
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
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-600 text-sm">
                    Tidak ada buku yang sesuai dengan pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Dialog Tambah / Edit */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-book-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs"
        >
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-150">
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
                  <input
                    type="text"
                    required
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Novel, Teknologi, dll"
                    className="w-full h-11 px-3.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
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
