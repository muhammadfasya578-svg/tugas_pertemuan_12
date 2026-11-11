'use client'

import { useState } from 'react'
import { createBookRequest } from '@/lib/storage'
import { useDialog } from '@/components/DialogContext'
import { PlusCircle, X, Loader2, Sparkles, BookPlus } from 'lucide-react'

export default function BookRequestModal({ user, categories = [], isOpen, onClose, onSuccess }) {
  const { alert, toast } = useDialog()
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [category, setCategory] = useState('')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim() || !author.trim()) {
      await alert({
        title: 'Formulir Belum Lengkap',
        message: 'Mohon isi judul buku dan nama penulis terlebih dahulu.',
        type: 'warning',
      })
      return
    }

    setSubmitting(true)
    const res = await createBookRequest({
      title: title.trim(),
      author: author.trim(),
      category: category.trim() || 'Umum',
      reason: reason.trim(),
      user,
    })
    setSubmitting(false)

    if (res?.error) {
      await alert({
        title: 'Gagal Mengusulkan',
        message: res.error,
        type: 'error',
      })
    } else {
      toast({
        message: 'Usulan buku baru berhasil dikirim ke pengelola perpustakaan!',
        type: 'success',
      })
      setTitle('')
      setAuthor('')
      setCategory('')
      setReason('')
      if (onSuccess) onSuccess()
      onClose()
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <BookPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                Usulkan Buku Baru
              </h3>
              <p className="text-xs text-slate-500">
                Bantu perpus memperkaya koleksi bacaan.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            aria-label="Tutup form"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Judul Buku <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Sang Pemimpi"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Penulis / Pengarang <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Andrea Hirata"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Kategori Rekomendasi
            </label>
            <input
              type="text"
              list="request-category-list"
              placeholder="Pilih atau ketik kategori (mis. Novel, Teknologi)"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
            />
            <datalist id="request-category-list">
              {categories.map((c, i) => (
                <option key={i} value={typeof c === 'string' ? c : c.name} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Alasan Pengusulan (Opsional)
            </label>
            <textarea
              rows={3}
              placeholder="Mengapa buku ini layak dibaca anggota perpus?"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-semibold transition cursor-pointer"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-xs transition disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Mengirim...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Kirim Usulan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
