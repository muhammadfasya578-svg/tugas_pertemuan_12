'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import AppSidebar from '@/components/AppSidebar'
import { getSession, syncSessionFromSupabase, fetchLoans, formatMemberId } from '@/lib/storage'
import { formatDate } from '@/lib/utils'
import { useDialog } from '@/components/DialogContext'
import {
  CreditCard,
  Printer,
  Copy,
  Check,
  ShieldCheck,
  BookOpen,
  Calendar,
  Sparkles,
  QrCode,
  ArrowLeft,
  Loader2,
} from 'lucide-react'

export default function MemberCardPage() {
  const { toast } = useDialog()
  const [profile, setProfile] = useState(null)
  const [loans, setLoans] = useState([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function loadData() {
      const user = await syncSessionFromSupabase()
      if (isMounted) {
        setProfile(user || getSession())
      }
      if (user?.id) {
        const userLoans = await fetchLoans(user.id)
        if (isMounted) {
          setLoans(userLoans)
        }
      }
      if (isMounted) {
        setLoading(false)
      }
    }

    loadData()
    return () => {
      isMounted = false
    }
  }, [])

  const memberId = formatMemberId(profile)
  const activeLoansCount = loans.filter((l) => l.status === 'dipinjam').length
  const completedLoansCount = loans.filter((l) => l.status === 'dikembalikan').length

  const handleCopyId = () => {
    navigator.clipboard.writeText(memberId)
    setCopied(true)
    toast({ message: `ID Anggota ${memberId} berhasil disalin!`, type: 'success' })
    setTimeout(() => setCopied(false), 2500)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar hidden in print */}
      <div className="print:hidden">
        <AppSidebar profile={profile} />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <main className="p-4 sm:p-8 pb-24 md:pb-8 max-w-5xl w-full mx-auto flex-1">
          {/* Header Action Bar */}
          <div className="print:hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-700 mb-2 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Kembali ke Beranda
              </Link>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2.5">
                <CreditCard className="w-8 h-8 text-emerald-600" />
                Kartu Anggota Digital
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Tanda pengenal resmi anggota The Books Digital Library.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleCopyId}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-sm font-semibold shadow-2xs transition"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4 text-slate-500" />
                )}
                <span>{copied ? 'Tersalin' : 'Salin ID'}</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-xs transition"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Kartu</span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-3" />
              <p className="text-sm">Menyiapkan kartu anggota...</p>
            </div>
          ) : !profile ? (
            <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center max-w-md mx-auto my-12 shadow-xs">
              <CreditCard className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-800">Belum Masuk</h3>
              <p className="text-sm text-slate-500 mt-1 mb-6">
                Silakan login terlebih dahulu untuk mengakses kartu anggota digitalmu.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 transition"
              >
                Masuk Sekarang
              </Link>
            </div>
          ) : (
            <div className="space-y-8">
              {/* MEMBER ID CARD PREVIEW CONTAINER */}
              <div className="max-w-xl mx-auto">
                <div
                  id="library-member-card"
                  className="relative overflow-hidden rounded-3xl bg-linear-to-br from-emerald-800 via-emerald-700 to-slate-900 text-white shadow-xl p-5 sm:p-8 border border-emerald-600/30 print:border-slate-800 print:shadow-none print:m-0"
                >
                  {/* Decorative Background Patterns */}
                  <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-emerald-500/15 blur-2xl pointer-events-none" />
                  <div className="absolute -left-12 -bottom-12 w-48 h-48 rounded-full bg-emerald-400/10 blur-xl pointer-events-none" />

                  {/* Card Header */}
                  <div className="flex items-center justify-between pb-6 border-b border-emerald-500/20 relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-white text-emerald-700 flex items-center justify-center shadow-md font-black">
                        <BookOpen className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-base font-extrabold tracking-tight text-white leading-tight">
                          THE BOOKS
                        </h2>
                        <p className="text-[11px] font-semibold tracking-wider text-emerald-200 uppercase">
                          Digital Library Card
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/25 border border-emerald-400/40 text-[11px] font-bold text-emerald-100 tracking-wide">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      AKTIF
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="py-6 flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
                    {/* User Avatar Circle */}
                    <div className="relative flex-shrink-0">
                      <div className="w-20 h-20 rounded-2xl bg-linear-to-tr from-emerald-500 to-emerald-300 text-slate-900 flex items-center justify-center text-2xl font-black shadow-lg border-2 border-white/60">
                        {profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white text-emerald-700 flex items-center justify-center shadow-xs">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                    </div>

                    {/* Member Details */}
                    <div className="flex-1 text-center sm:text-left space-y-2">
                      <div>
                        <h3 className="text-xl font-bold text-white tracking-tight">
                          {profile.name || 'Nama Anggota'}
                        </h3>
                        <p className="text-xs text-emerald-100/80 font-mono mt-0.5">
                          {profile.email}
                        </p>
                      </div>

                      <div className="inline-block px-2.5 py-0.5 rounded-lg bg-white/10 text-[11px] font-medium text-emerald-100 uppercase tracking-wider">
                        {profile.role === 'admin' ? 'Administrator' : 'Anggota Utama'}
                      </div>

                      <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-x-6 gap-y-2 text-xs text-emerald-100/90">
                        <div>
                          <span className="text-[10px] uppercase text-emerald-300/80 block font-semibold">
                            ID Anggota
                          </span>
                          <span className="font-mono font-bold text-white text-sm">
                            {memberId}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase text-emerald-300/80 block font-semibold">
                            Tahun Berlaku
                          </span>
                          <span className="font-semibold text-white">
                            2026 / 2027
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer: Barcode Representation */}
                  <div className="pt-4 border-t border-emerald-500/20 flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
                    {/* SVG Vector Barcode */}
                    <div className="bg-white px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-xs">
                      <div className="flex items-end h-7 gap-0.5" aria-hidden="true">
                        {[
                          3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 3, 1, 2, 4, 1, 2, 3, 1, 4, 2,
                          1, 3, 2, 4, 1, 2, 3, 1,
                        ].map((h, idx) => (
                          <div
                            key={idx}
                            className={`w-0.5 bg-slate-900 rounded-2xs ${
                              h === 1
                                ? 'h-3'
                                : h === 2
                                ? 'h-5'
                                : h === 3
                                ? 'h-6'
                                : 'h-7'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] font-mono font-bold text-slate-800 ml-2 tracking-tighter">
                        {memberId}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-right">
                      <QrCode className="w-8 h-8 text-emerald-200" />
                      <div className="text-[10px] text-emerald-200/80 leading-tight">
                        <span className="font-bold text-white block">SISTEM TERVERIFIKASI</span>
                        Otentikasi Supabase DB
                      </div>
                    </div>
                  </div>
                </div>

                {/* Print Hint (Screen only) */}
                <p className="print:hidden text-center text-xs text-slate-500 mt-3 flex items-center justify-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  Format kartu dirancang pas untuk dicetak seukuran ID card standar atau disimpan sebagai PDF.
                </p>
              </div>

              {/* STATISTIK & KETENTUAN KARTU */}
              <div className="print:hidden grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                    Pinjaman Aktif
                  </span>
                  <div className="text-2xl font-extrabold text-slate-900">
                    {activeLoansCount}{' '}
                    <span className="text-xs font-medium text-slate-500 font-normal">
                      / maks 3 buku
                    </span>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                    Buku Selesai Dibaca
                  </span>
                  <div className="text-2xl font-extrabold text-emerald-600">
                    {completedLoansCount}{' '}
                    <span className="text-xs font-medium text-slate-500 font-normal">
                      buku
                    </span>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                    Status Hak Akses
                  </span>
                  <div className="text-2xl font-extrabold text-slate-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-6 h-6 text-emerald-600" />
                    <span>Lengkap</span>
                  </div>
                </div>
              </div>

              {/* Syarat & Ketentuan Keanggotaan */}
              <div className="print:hidden bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
                <h4 className="text-base font-bold text-slate-900">
                  Syarat & Ketentuan Anggota
                </h4>
                <ul className="text-sm text-slate-600 space-y-2 list-disc list-inside leading-relaxed">
                  <li>
                    Kartu anggota digital ini merupakan bukti registrasi sah di The Books Digital Library.
                  </li>
                  <li>
                    Anggota berhak meminjam maksimal <strong>3 buku secara bersamaan</strong> dengan masa pinjam 7 hari per buku.
                  </li>
                  <li>
                    Peminjaman dapat diperpanjang satu kali (+7 hari) selama buku belum melewati tanggal jatuh tempo.
                  </li>
                  <li>
                    Keterlambatan pengembalian buku dikenakan denda administrasi sebesar <strong>Rp1.000 per hari keterlambatan</strong>.
                  </li>
                </ul>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
