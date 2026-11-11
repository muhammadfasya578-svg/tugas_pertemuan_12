'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  fetchBookRequests,
  updateBookRequestStatus,
  deleteBookRequest,
  addBook,
  exportToCSV,
  getSession,
  syncSessionFromSupabase,
} from '@/lib/storage'
import { formatDate } from '@/lib/utils'
import { useDialog } from '@/components/DialogContext'
import {
  BookPlus,
  CheckCircle,
  XCircle,
  Trash2,
  Download,
  Search,
  Clock,
  Sparkles,
  BookOpen,
  Plus,
  Loader2,
} from 'lucide-react'

export default function AdminBookRequestsPage() {
  const { confirm, alert, toast } = useDialog()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('semua')
  const [processingId, setProcessingId] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    let isMounted = true

    async function loadData() {
      const user = await syncSessionFromSupabase()
      if (isMounted) {
        setCurrentUser(user || getSession())
      }
      const data = await fetchBookRequests()
      if (isMounted) {
        setRequests(data)
        setLoading(false)
      }
    }

    loadData()
    return () => {
      isMounted = false
    }
  }, [])

  const reloadRequests = async () => {
    const data = await fetchBookRequests()
    setRequests(data)
  }

  const handleUpdateStatus = async (id, status) => {
    setProcessingId(id)
    const res = await updateBookRequestStatus(id, status, currentUser)
    setProcessingId(null)

    if (res?.error) {
      await alert({
        title: 'Gagal Memperbarui Status',
        message: res.error,
        type: 'error',
      })
    } else {
      toast({
        message: `Usulan berhasil diubah menjadi "${status}"`,
        type: 'success',
      })
      await reloadRequests()
    }
  }

  const handleDelete = async (id, title) => {
    const confirmed = await confirm({
      title: 'Hapus Usulan Buku',
      message: `Hapus usulan buku "${title}" dari daftar?`,
      confirmText: 'Ya, Hapus',
      cancelText: 'Batal',
      type: 'danger',
    })
    if (!confirmed) return

    setProcessingId(id)
    const res = await deleteBookRequest(id)
    setProcessingId(null)

    if (res?.error) {
      await alert({
        title: 'Gagal Menghapus',
        message: res.error,
        type: 'error',
      })
    } else {
      toast({ message: 'Usulan berhasil dihapus', type: 'info' })
      await reloadRequests()
    }
  }

  const handleConvertToBook = async (req) => {
    const confirmed = await confirm({
      title: 'Terbitkan ke Katalog Buku',
      message: `Tambahkan buku "${req.title}" karya ${req.author} ke koleksi perpustakaan dengan stok awal 1?`,
      confirmText: 'Tambahkan ke Buku',
      cancelText: 'Batal',
      type: 'primary',
    })
    if (!confirmed) return

    setProcessingId(req.id)
    const res = await addBook({
      title: req.title,
      author: req.author,
      category: req.category || 'Umum',
      stock: 1,
    })

    if (res?.error) {
      setProcessingId(null)
      await alert({
        title: 'Gagal Menerbitkan Buku',
        message: res.error,
        type: 'error',
      })
      return
    }

    await updateBookRequestStatus(req.id, 'disetujui', currentUser)
    setProcessingId(null)
    toast({
      message: `Buku "${req.title}" sukses ditambahkan ke katalog perpustakaan!`,
      type: 'success',
    })
    await reloadRequests()
  }

  const handleExport = () => {
    if (requests.length === 0) return
    const headers = [
      'ID Usulan',
      'Judul Buku',
      'Penulis',
      'Kategori',
      'Nama Pengusul',
      'Email Pengusul',
      'Tanggal Pengusulan',
      'Alasan',
      'Status',
    ]
    const rows = filteredRequests.map((r) => [
      r.id,
      r.title,
      r.author,
      r.category || 'Umum',
      r.userName,
      r.userEmail,
      formatDate(r.created_at),
      r.reason || '-',
      r.status,
    ])
    exportToCSV(`usulan_buku_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows)
  }

  const filteredRequests = requests.filter((r) => {
    const matchSearch =
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.userName?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchStatus = statusFilter === 'semua' || r.status === statusFilter

    return matchSearch && matchStatus
  })

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <BookPlus className="w-7 h-7 text-emerald-600" />
            <span>Usulan Buku Pengguna</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Daftar rekomendasi buku yang diajukan oleh anggota perpustakaan.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExport}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-sm font-semibold shadow-2xs transition"
        >
          <Download className="w-4 h-4" />
          <span>Ekspor CSV</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'semua', label: 'Semua Usulan' },
            { id: 'menunggu', label: 'Menunggu' },
            { id: 'disetujui', label: 'Disetujui' },
            { id: 'ditolak', label: 'Ditolak' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari judul, penulis, pengusul..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-4 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
          />
        </div>
      </div>

      {/* Table & Cards Container */}
      {loading ? (
        <div className="bg-white rounded-3xl border border-slate-200 py-20 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-2" />
          <p className="text-xs">Memuat daftar usulan...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 py-16 text-center text-slate-400">
          <BookPlus className="w-10 h-10 mx-auto mb-2 text-slate-300" />
          <p className="text-sm font-semibold text-slate-600">Tidak ada usulan buku</p>
          <p className="text-xs text-slate-400 mt-1">
            Usulan buku baru dari pembaca akan terdaftar di sini.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* TAMPILAN MOBILE: Kartu Usulan Responsif (md:hidden) */}
          <div className="md:hidden space-y-3">
            {filteredRequests.map((req) => (
              <article
                key={req.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm leading-snug">
                      {req.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">karya {req.author}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700">
                      {req.category || 'Umum'}
                    </span>
                  </div>

                  <div>
                    {req.status === 'menunggu' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                        <Clock className="w-3 h-3" />
                        Menunggu
                      </span>
                    )}
                    {req.status === 'disetujui' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                        <CheckCircle className="w-3 h-3" />
                        Disetujui
                      </span>
                    )}
                    {req.status === 'ditolak' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-100 text-red-800 font-bold text-[10px]">
                        <XCircle className="w-3 h-3" />
                        Ditolak
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-400">Pengusul:</span>
                    <span className="font-semibold text-slate-700">
                      {req.userName} ({req.userEmail})
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-400">Waktu:</span>
                    <span className="text-slate-600">{formatDate(req.created_at)}</span>
                  </div>
                  {req.reason && (
                    <p className="text-slate-600 italic text-[11px] pt-1 border-t border-slate-200/50">
                      &ldquo;{req.reason}&rdquo;
                    </p>
                  )}
                </div>

                {/* Tombol Aksi Mobile (>= 44px) */}
                <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                  {req.status === 'menunggu' && (
                    <>
                      <button
                        type="button"
                        disabled={processingId === req.id}
                        onClick={() => handleUpdateStatus(req.id, 'disetujui')}
                        className="flex-1 min-h-[44px] px-3 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Setujui</span>
                      </button>
                      <button
                        type="button"
                        disabled={processingId === req.id}
                        onClick={() => handleUpdateStatus(req.id, 'ditolak')}
                        className="min-h-[44px] px-3.5 rounded-xl text-xs font-semibold bg-amber-50 text-amber-800 hover:bg-amber-100 flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Tolak</span>
                      </button>
                    </>
                  )}

                  {req.status === 'disetujui' && (
                    <button
                      type="button"
                      disabled={processingId === req.id}
                      onClick={() => handleConvertToBook(req)}
                      className="flex-1 min-h-[44px] px-3 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Terbitkan ke Buku</span>
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={processingId === req.id}
                    onClick={() => handleDelete(req.id, req.title)}
                    className="min-h-[44px] px-3.5 rounded-xl text-xs font-semibold bg-red-50 text-red-700 hover:bg-red-100 flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Hapus</span>
                  </button>
                </div>
              </article>
            ))}
          </div>

          {/* TAMPILAN DESKTOP: Tabel Lengkap (hidden md:block) */}
          <div className="hidden md:block bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 px-5">Buku yang Diusulkan</th>
                    <th className="py-3.5 px-5">Kategori</th>
                    <th className="py-3.5 px-5">Pengusul</th>
                    <th className="py-3.5 px-5">Tanggal & Alasan</th>
                    <th className="py-3.5 px-5">Status</th>
                    <th className="py-3.5 px-5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-4 px-5">
                        <div className="font-bold text-slate-900 text-sm">{req.title}</div>
                        <div className="text-slate-500 mt-0.5">karya {req.author}</div>
                      </td>

                      <td className="py-4 px-5">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 font-medium text-slate-700">
                          {req.category || 'Umum'}
                        </span>
                      </td>

                      <td className="py-4 px-5">
                        <div className="font-semibold text-slate-800">{req.userName}</div>
                        <div className="text-slate-400 text-[11px] font-mono">{req.userEmail}</div>
                      </td>

                      <td className="py-4 px-5 max-w-xs">
                        <div className="text-slate-500 text-[11px] font-medium">
                          {formatDate(req.created_at)}
                        </div>
                        {req.reason && (
                          <p className="text-slate-600 text-xs italic mt-1 line-clamp-2">
                            &ldquo;{req.reason}&rdquo;
                          </p>
                        )}
                      </td>

                      <td className="py-4 px-5">
                        {req.status === 'menunggu' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-bold text-[11px]">
                            <Clock className="w-3 h-3" />
                            Menunggu
                          </span>
                        )}
                        {req.status === 'disetujui' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                            <CheckCircle className="w-3 h-3" />
                            Disetujui
                          </span>
                        )}
                        {req.status === 'ditolak' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-100 text-red-800 font-bold text-[11px]">
                            <XCircle className="w-3 h-3" />
                            Ditolak
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {req.status === 'menunggu' && (
                            <>
                              <button
                                type="button"
                                disabled={processingId === req.id}
                                onClick={() => handleUpdateStatus(req.id, 'disetujui')}
                                title="Setujui Usulan"
                                className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition cursor-pointer"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                disabled={processingId === req.id}
                                onClick={() => handleUpdateStatus(req.id, 'ditolak')}
                                title="Tolak Usulan"
                                className="p-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition cursor-pointer"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          {req.status === 'disetujui' && (
                            <button
                              type="button"
                              disabled={processingId === req.id}
                              onClick={() => handleConvertToBook(req)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] shadow-2xs transition cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Terbitkan</span>
                            </button>
                          )}

                          <button
                            type="button"
                            disabled={processingId === req.id}
                            onClick={() => handleDelete(req.id, req.title)}
                            title="Hapus Usulan"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
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
      )}
    </div>
  )
}
