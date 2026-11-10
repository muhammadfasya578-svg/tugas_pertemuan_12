'use client'

import { useState, useEffect } from 'react'
import {
  fetchCategories,
  addCategory,
  updateCategory,
  deleteCategory,
} from '@/lib/storage'
import {
  Tags,
  Plus,
  Pencil,
  Trash2,
  X,
  Search,
  BookOpen,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Info,
  Copy,
  Check,
} from 'lucide-react'

export default function AdminCategoriesManager() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('add') // 'add' | 'edit'
  const [selectedCategory, setSelectedCategory] = useState(null)

  // Form State
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [copiedSql, setCopiedSql] = useState(false)

  const loadCategories = async () => {
    setLoading(true)
    const data = await fetchCategories()
    setCategories(data)
    setLoading(false)
  }

  useEffect(() => {
    loadCategories()
  }, [])

  // Keyboard Escape listener
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
    setSelectedCategory(null)
    setName('')
    setDescription('')
    setErrorMsg('')
    setIsModalOpen(true)
  }

  const openEditModal = (cat) => {
    setModalMode('edit')
    setSelectedCategory(cat)
    setName(cat.name)
    setDescription(cat.description || '')
    setErrorMsg('')
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setErrorMsg('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) {
      setErrorMsg('Nama kategori wajib diisi')
      return
    }

    setSaving(true)
    setErrorMsg('')

    let res
    if (modalMode === 'add') {
      res = await addCategory({ name, description })
    } else {
      res = await updateCategory(
        selectedCategory.id,
        { name, description },
        selectedCategory.name
      )
    }

    setSaving(false)

    if (res?.error) {
      setErrorMsg(res.error)
    } else {
      closeModal()
      setSuccessMsg(
        modalMode === 'add'
          ? `Kategori "${name}" berhasil ditambahkan ke database!`
          : `Kategori "${name}" berhasil diperbarui!`
      )
      setTimeout(() => setSuccessMsg(''), 4000)
      loadCategories()
    }
  }

  const handleDelete = async (cat) => {
    const confirmed = window.confirm(
      `Apakah kamu yakin ingin menghapus kategori "${cat.name}"?`
    )
    if (!confirmed) return

    const res = await deleteCategory(cat.id, cat.name)
    if (res?.error) {
      alert(res.error)
    } else {
      setSuccessMsg(`Kategori "${cat.name}" berhasil dihapus dari database.`)
      setTimeout(() => setSuccessMsg(''), 4000)
      loadCategories()
    }
  }

  const hasDerivedCategories = categories.some((c) => c.isDerived)

  const filteredCategories = categories.filter((c) => {
    const s = search.toLowerCase()
    return (
      c.name.toLowerCase().includes(s) ||
      (c.description && c.description.toLowerCase().includes(s))
    )
  })

  const totalBooksAssigned = categories.reduce(
    (acc, curr) => acc + (curr.book_count || 0),
    0
  )

  const copySqlSnippet = () => {
    const sql = `CREATE TABLE IF NOT EXISTS public.categories (
  id bigint generated always as identity primary key,
  name text not null unique,
  description text,
  created_at timestamptz not null default now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories: semua user login boleh baca" ON public.categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "categories: admin insert" ON public.categories FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "categories: admin update" ON public.categories FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "categories: admin delete" ON public.categories FOR DELETE TO authenticated USING (public.is_admin());
INSERT INTO public.categories (name) SELECT DISTINCT category FROM public.books WHERE category IS NOT NULL ON CONFLICT (name) DO NOTHING;`

    navigator.clipboard.writeText(sql)
    setCopiedSql(true)
    setTimeout(() => setCopiedSql(false), 3000)
  }

  return (
    <div className="space-y-6">
      {/* Alert Notifikasi Sukses */}
      {successMsg && (
        <div
          className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-3 shadow-xs animate-in fade-in"
          role="status"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span className="font-medium">{successMsg}</span>
        </div>
      )}

      {/* Info Banner jika tabel categories belum dibuat di Supabase */}
      {hasDerivedCategories && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-900 text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-900">
                Tabel Database Kategori Tersedia di Script SQL
              </p>
              <p className="text-xs text-amber-800 mt-0.5">
                Kategori saat ini dibaca dari buku yang ada di Supabase. Jalankan script{' '}
                <code className="bg-amber-100/80 px-1.5 py-0.5 rounded font-mono text-amber-900 font-semibold">
                  supabase_setup.sql
                </code>{' '}
                di SQL Editor Supabase untuk mengaktifkan tabel kategori penuh.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={copySqlSnippet}
            className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs transition cursor-pointer shadow-xs"
          >
            {copiedSql ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Salin SQL Kategori</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Toolbar: Search, Statistik, dan Tombol Tambah */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama kategori..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 pl-10 pr-4 text-sm rounded-xl border border-slate-200 bg-white placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-600 shadow-2xs">
            <Tags className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              Total: <strong className="text-slate-900">{categories.length}</strong> Kategori
            </span>
          </div>

          <button
            onClick={openAddModal}
            className="h-11 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-2xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Kategori</span>
          </button>
        </div>
      </div>

      {/* Tabel Kategori */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-slate-500 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-3" />
            <p>Memuat daftar kategori dari Supabase...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-600">
                <tr>
                  <th scope="col" className="px-6 py-4">ID</th>
                  <th scope="col" className="px-6 py-4">Nama Kategori</th>
                  <th scope="col" className="px-6 py-4">Deskripsi</th>
                  <th scope="col" className="px-6 py-4 text-center">Jumlah Buku</th>
                  <th scope="col" className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCategories.length > 0 ? (
                  filteredCategories.map((cat, idx) => (
                    <tr key={cat.id || idx} className="hover:bg-slate-50/80 transition">
                      <td className="px-6 py-4 text-xs font-mono text-slate-400">
                        #{cat.id}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-600" />
                          <span className="font-semibold text-slate-900">{cat.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-xs">
                        {cat.description || '-'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <BookOpen className="w-3 h-3 text-emerald-600" />
                          <span>{cat.book_count || 0} buku</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(cat)}
                            title="Edit Kategori"
                            className="p-2 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition cursor-pointer"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(cat)}
                            title="Hapus Kategori"
                            className="p-2 rounded-lg text-slate-500 hover:text-red-700 hover:bg-red-50 transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500 text-sm">
                      {search
                        ? 'Tidak ada kategori yang sesuai dengan kata kunci pencarian.'
                        : 'Belum ada kategori terdaftar.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Tambah / Edit Kategori */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-900 text-base">
                {modalMode === 'add' ? 'Tambah Kategori Baru' : 'Edit Kategori'}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {errorMsg && (
                <div
                  className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2"
                  role="alert"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Nama Kategori <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Mis. Novel, Sains, Teknologi, Sejarah"
                  className="w-full h-11 px-3.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Deskripsi (Opsional)
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Deskripsi singkat mengenai jenis buku pada kategori ini..."
                  className="w-full p-3 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={closeModal}
                  className="h-10 px-4 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium text-xs transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="h-10 px-5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white font-medium text-xs flex items-center gap-2 transition cursor-pointer shadow-xs"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{modalMode === 'add' ? 'Simpan Kategori' : 'Perbarui Kategori'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
